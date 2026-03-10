import {
  BadRequestException, Injectable,
  Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateText } from '@ai-lab/ai-core';

import { ApplicationEntity, BaseCvEntity } from './entities/application.entity';
import type {
  CreateApplicationDto, PatchApplicationDto,
  UpsertBaseCvDto, GenerateCvDto, ExtractCvDto,
  EvaluateCvDto, CvEvaluationResult,
} from './dto/application.dto';

// ─────────────────────────────────────────────────────────────────────────────
// LangChain treats {word} inside prompts as template variables and throws
// "Missing value for input variable" when it finds any curly brace pair.
// Escape every { and } in user-supplied content before sending to generateText.
// ─────────────────────────────────────────────────────────────────────────────
function esc(text: string): string {
  return (text ?? '').replace(/\{/g, '(').replace(/\}/g, ')');
}

// ── Robust JSON extractor ────────────────────────────────────────────────────
function extractJson<T>(text: string): T | null {
  // Strip all markdown fences (Gemini loves wrapping in ```json ... ```)
  let s = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // Direct parse (clean response)
  try { return JSON.parse(s) as T; } catch { /* continue */ }

  // Locate outermost { ... } by balanced brace scan
  const start = s.indexOf('{');
  if (start === -1) return null;
  let depth = 0, end = -1;
  for (let i = start; i < s.length; i++) {
    if (s[i] === '{') depth++;
    else if (s[i] === '}') { if (--depth === 0) { end = i; break; } }
  }
  if (end !== -1) {
    try { return JSON.parse(s.slice(start, end + 1)) as T; } catch { /* continue */ }
  }

  // Last resort: first { to last }
  const last = s.lastIndexOf('}');
  if (last > start) {
    try { return JSON.parse(s.slice(start, last + 1)) as T; } catch { /* fall through */ }
  }
  return null;
}

// ── Retry with exponential backoff ────────────────────────────────────────────
async function withRetry<T>(fn: () => Promise<T>, retries = 2, baseMs = 2000): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, baseMs * Math.pow(2, attempt)));
    }
  }
  throw new Error('unreachable');
}

const CV_FIELDS = [
  'fullName', 'email', 'phone', 'location', 'linkedIn',
  'summary', 'experience', 'education', 'skills', 'languages', 'certifications',
] as const;

@Injectable()
export class ApplicationsService {
  private readonly logger = new Logger(ApplicationsService.name);

  constructor(
    @InjectRepository(ApplicationEntity)
    private readonly appRepo: Repository<ApplicationEntity>,
    @InjectRepository(BaseCvEntity)
    private readonly cvRepo: Repository<BaseCvEntity>,
  ) {}

  // ── Base CV ──────────────────────────────────────────────────────────────────

  async getBaseCV(userId: string): Promise<BaseCvEntity> {
    const existing = await this.cvRepo.findOne({ where: { userId } });
    if (existing) return existing;
    return this.cvRepo.create({
      userId, fullName: '', email: '', phone: '', location: '',
      linkedIn: '', summary: '', experience: '', education: '',
      skills: '', languages: '', certifications: '',
    });
  }

  async upsertBaseCV(userId: string, dto: UpsertBaseCvDto & { cvScore?: number }): Promise<BaseCvEntity> {
    // Enforce minimum quality gate — clients must evaluate before saving
    if (typeof dto.cvScore === 'number' && dto.cvScore < 85) {
      throw new BadRequestException(
        `CV quality score is ${dto.cvScore}/100. A score of at least 85 is required to save.`
      );
    }
    let entity = await this.cvRepo.findOne({ where: { userId } });
    if (!entity) entity = this.cvRepo.create({ userId });
    const { cvScore: _ignored, ...cvData } = dto;
    Object.assign(entity, cvData);
    return this.cvRepo.save(entity);
  }

  // ── Applications CRUD ─────────────────────────────────────────────────────

  async findAll(userId: string): Promise<ApplicationEntity[]> {
    return this.appRepo.find({ where: { userId }, order: { appliedAt: 'DESC' } });
  }

  async findOne(userId: string, id: string): Promise<ApplicationEntity> {
    const app = await this.appRepo.findOne({ where: { id, userId } });
    if (!app) throw new NotFoundException('Application not found');
    return app;
  }

  async create(userId: string, dto: CreateApplicationDto): Promise<ApplicationEntity> {
    const entity = this.appRepo.create({
      userId,
      company: dto.company,
      position: dto.position,
      jobOffer: dto.jobOffer,
      status: 'pending',
      atsScore: dto.atsScore,
      cvGenerated: dto.generatedCvText,
      cvGeneratedFlag: !!(dto.cvGenerated || dto.generatedCvText),
    });
    return this.appRepo.save(entity);
  }

  async patch(userId: string, id: string, dto: PatchApplicationDto): Promise<ApplicationEntity> {
    const app = await this.findOne(userId, id);
    if (dto.status !== undefined) app.status = dto.status;
    if (dto.atsScore !== undefined) app.atsScore = dto.atsScore;
    if (dto.generatedCvText !== undefined) {
      app.cvGenerated = dto.generatedCvText;
      app.cvGeneratedFlag = true;
    }
    return this.appRepo.save(app);
  }

  async remove(userId: string, id: string): Promise<void> {
    const app = await this.findOne(userId, id);
    await this.appRepo.remove(app);
  }

  // ── AI: Generate ATS-optimized CV ─────────────────────────────────────────

  async generateCv(
    userId: string,
    dto: GenerateCvDto,
  ): Promise<{ atsScore: number; cvText: string }> {
    const baseCV = await this.cvRepo.findOne({ where: { userId } });
    if (!baseCV || !baseCV.fullName || (!baseCV.experience && !baseCV.summary)) {
      throw new BadRequestException(
        'Base CV is incomplete. Please fill in name, email and experience/summary before generating.',
      );
    }

    // Build systemMessage and prompt using plain string concatenation.
    // NO curly braces allowed in the literal text — LangChain treats them as template vars.
    // User-supplied data is escaped via esc() which converts { } to ( ).
    const systemMessage =
      'You are an expert ATS CV optimizer. Your goal: produce a CV with 90-100% keyword match to the job offer WITHOUT inventing any data.\n' +
      'RULES (strictly enforced):\n' +
      '1. Use the EXACT technical keywords, tools, and phrases from the job offer — embed them naturally in summary, skills and experience.\n' +
      '2. Reorder work experience bullets to prioritize what the job offer values most.\n' +
      '3. Rewrite the professional summary to mirror the role title and top 3 requirements.\n' +
      '4. NEVER add skills, companies, degrees or certifications not present in the base CV.\n' +
      '5. Expand abbreviations if the job offer uses full words (e.g. JS → JavaScript).\n' +
      '6. Format for ATS parsers: plain text only, no tables, columns, icons or graphics.\n' +
      '7. Structure: Name/Contact → Summary → Experience → Education → Skills → Languages → Certifications.\n' +
      '8. Calculate ATS Match Score 0-100 based on keyword overlap between the CV output and job offer.\n\n' +
      'Respond with ONLY raw JSON — no markdown, no backticks:\n' +
      '{"atsScore":<integer 0-100>,"cvText":"<full optimized CV as plain text with \\n newlines>"}';

    const cvBlock =
      'Name: ' + esc(baseCV.fullName) + '\n' +
      'Email: ' + esc(baseCV.email) + '\n' +
      'Phone: ' + esc(baseCV.phone) + '\n' +
      'Location: ' + esc(baseCV.location) + '\n' +
      'LinkedIn: ' + esc(baseCV.linkedIn) + '\n\n' +
      'PROFESSIONAL SUMMARY:\n' + esc(baseCV.summary) + '\n\n' +
      'WORK EXPERIENCE:\n' + esc(baseCV.experience) + '\n\n' +
      'EDUCATION:\n' + esc(baseCV.education) + '\n\n' +
      'SKILLS:\n' + esc(baseCV.skills) + '\n\n' +
      'LANGUAGES:\n' + esc(baseCV.languages) + '\n\n' +
      'CERTIFICATIONS:\n' + esc(baseCV.certifications);

    const prompt =
      'JOB OFFER - ' + esc(dto.company) + ' / ' + esc(dto.position) + ':\n' +
      esc(dto.jobOffer) + '\n\n' +
      '---\n\n' +
      'CANDIDATE BASE CV:\n' + cvBlock + '\n\n' +
      'Generate the optimized ATS CV and return ONLY the JSON object.';

    this.logger.log(`Generating ATS CV for user ${userId} -> ${dto.position} @ ${dto.company}`);

    return withRetry(async () => {
      const { text, model } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 3000,
        temperature: 0.3,
      });
      this.logger.debug(`AI model: ${model} — response length: ${text.length} chars`);
      const parsed = extractJson<{ atsScore: number; cvText: string }>(text);
      if (!parsed || typeof parsed.atsScore !== 'number' || !parsed.cvText) {
        this.logger.warn(`Unexpected AI format: ${text.slice(0, 200)}`);
        throw new Error('AI response missing atsScore or cvText');
      }
      return {
        atsScore: Math.min(100, Math.max(0, Math.round(parsed.atsScore))),
        cvText: parsed.cvText.trim(),
      };
    }, 2, 2000);
  }

  // ── AI: Extract CV data from PDF text ────────────────────────────────────

  async extractCvFromText(
    userId: string,
    dto: ExtractCvDto,
  ): Promise<Partial<Record<typeof CV_FIELDS[number], string>>> {
    if (!dto.pdfText || dto.pdfText.length < 10) {
      throw new BadRequestException('PDF text is too short to extract data from');
    }

    const truncated = dto.pdfText.length > 8000
      ? dto.pdfText.slice(0, 8000) + '\n...[truncated]'
      : dto.pdfText;

    const systemMessage =
      'You are a precise CV/resume data extractor. Extract EVERY detail from the raw PDF text.\n' +
      'Return ONLY a valid JSON object. No markdown fences, no explanation, no extra text.\n' +
      'Required keys (always present, use empty string if not found):\n' +
      'fullName, email, phone, location, linkedIn, summary, experience, education, skills, languages, certifications\n\n' +
      'Extraction rules:\n' +
      '- fullName: person full legal name\n' +
      '- email: professional email address\n' +
      '- phone: phone with country code if present\n' +
      '- location: city + country or region\n' +
      '- linkedIn: full LinkedIn profile URL if present\n' +
      '- summary: professional summary or objective paragraph — copy verbatim if present\n' +
      '- experience: for EACH role include: Company | Job Title | MM/YYYY – MM/YYYY, then bullet achievements. Preserve ALL roles.\n' +
      '- education: institution, degree/field, graduation year for each entry\n' +
      '- skills: comma-separated technical skills list\n' +
      '- languages: e.g. Spanish (native), English (C1)\n' +
      '- certifications: name — issuer — year for each\n' +
      '- All values must be plain strings without special encoding\n' +
      '- Your entire response must start with {{ and end with }}';

    const prompt = 'Extract all CV data from this PDF text and return as JSON. Preserve ALL work experience entries:\n\n' + esc(truncated);

    this.logger.log(`Extracting CV for user ${userId} — text length: ${dto.pdfText.length} chars`);

    return withRetry(async () => {
      const { text, model } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 2000,
        temperature: 0.05,
      });
      this.logger.debug(`AI model: ${model} — response preview: ${text.slice(0, 150)}`);
      const parsed = extractJson<Record<string, string>>(text);
      if (!parsed) {
        this.logger.warn(`Could not extract JSON from: ${text.slice(0, 300)}`);
        throw new Error('AI returned unstructured response');
      }
      const normalized: Record<string, string> = {};
      for (const key of CV_FIELDS) {
        normalized[key] = typeof parsed[key] === 'string' ? parsed[key] : '';
      }
      return normalized;
    }, 2, 2000);
  }

  // ── AI: Evaluate Base CV quality for ATS ─────────────────────────────────
  // Score rubric (to avoid infinite change loops):
  //   summary    20pts — min 3 sentences, must include role + years + value prop
  //   experience 30pts — min 2 roles, each with dates + 2 quantified achievements
  //   skills     15pts — min 6 skills listed
  //   education  10pts — institution + degree + year present
  //   contact    10pts — fullName + email + phone + location all present
  //   languages   5pts — at least one language with level
  //   certifications 5pts — at least one entry
  //   linkedIn    5pts — URL present and looks valid
  // Total: 100pts. Approved when >= 85.
  async evaluateBaseCV(dto: EvaluateCvDto): Promise<CvEvaluationResult> {
    const cvText =
      'FULL NAME: ' + esc(dto.fullName) + '\n' +
      'EMAIL: ' + esc(dto.email) + '\n' +
      'PHONE: ' + esc(dto.phone ?? '') + '\n' +
      'LOCATION: ' + esc(dto.location ?? '') + '\n' +
      'LINKEDIN: ' + esc(dto.linkedIn ?? '') + '\n\n' +
      'SUMMARY:\n' + esc(dto.summary) + '\n\n' +
      'EXPERIENCE:\n' + esc(dto.experience) + '\n\n' +
      'EDUCATION:\n' + esc(dto.education ?? '') + '\n\n' +
      'SKILLS:\n' + esc(dto.skills ?? '') + '\n\n' +
      'LANGUAGES:\n' + esc(dto.languages ?? '') + '\n\n' +
      'CERTIFICATIONS:\n' + esc(dto.certifications ?? '');

    // Evaluation rubric (fixed, non-negotiable):
    // summary 20 | experience 30 | skills 15 | education 10 | contact 10 | languages 5 | certifications 5 | linkedIn 5
    // Feedback rules: max 1 actionable sentence per field, only if genuinely missing/incomplete.
    // If a section is acceptable, fieldFeedback value must be an empty string "".
    // This prevents infinite improvement loops.
    const systemMessage =
      'You are an ATS CV evaluator. Score this CV using the fixed rubric below. Do not invent criteria.\n' +
      'RUBRIC (total 100 pts):\n' +
      '- summary: 20 pts. Full points if: min 3 sentences, contains job title, years of experience, and value proposition.\n' +
      '- experience: 30 pts. Full points if: min 2 complete roles each with company, title, YYYY–YYYY dates, and min 2 quantified achievements.\n' +
      '- skills: 15 pts. Full points if: min 6 technical skills listed.\n' +
      '- education: 10 pts. Full points if: institution + degree + graduation year present.\n' +
      '- contact: 10 pts. Full points if: fullName, email, phone AND location are all non-empty.\n' +
      '- languages: 5 pts. Full points if: at least one language with level (e.g. English C1).\n' +
      '- certifications: 5 pts. Full points if: at least one entry with name and year.\n' +
      '- linkedIn: 5 pts. Full points if: a linkedin.com URL is present.\n\n' +
      'RULES:\n' +
      '1. If a criterion is met, award full points and set fieldFeedback to "".\n' +
      '2. If a criterion is partially met, deduct proportionally and write ONE sentence of feedback (max 15 words).\n' +
      '3. If a criterion is not met at all, award 0 and write ONE sentence of feedback (max 15 words).\n' +
      '4. Do not suggest improvements beyond the rubric. Do not hallucinate missing info.\n' +
      '5. Respond with ONLY raw JSON — no markdown, no backticks, no explanation.\n' +
      'JSON shape: {{ "score": <0-100>, "approved": <true if score>=85>, "summary": "<max 20 words>", ' +
      '"fieldFeedback": {{ "summary": "", "experience": "", "skills": "", "education": "", ' +
      '"contact": "", "languages": "", "certifications": "", "linkedIn": "" }} }}';

    const prompt = 'Score this CV:\n\n' + cvText;

    return withRetry(async () => {
      const { text } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 600,
        temperature: 0,
      });
      const parsed = extractJson<CvEvaluationResult>(text);
      if (!parsed || typeof parsed.score !== 'number') {
        throw new Error('AI returned invalid evaluation response');
      }
      return {
        score: Math.min(100, Math.max(0, Math.round(parsed.score))),
        approved: parsed.score >= 85,
        summary: parsed.summary ?? '',
        fieldFeedback: parsed.fieldFeedback ?? {},
      };
    }, 2, 1500);
  }

  // ── AI: Job search coaching feedback ─────────────────────────────────────

  async generateFeedback(userId: string): Promise<{ feedback: string }> {
    const apps = await this.findAll(userId);
    if (apps.length < 2) {
      throw new BadRequestException('Need at least 2 applications to generate feedback');
    }

    const total      = apps.length;
    const accepted   = apps.filter(a => a.status === 'accepted').length;
    const rejected   = apps.filter(a => a.status === 'rejected').length;
    const pending    = apps.filter(a => a.status === 'pending' || a.status === 'in_process').length;
    const acceptRate = Math.round((accepted / total) * 100);
    const withAts    = apps.filter(a => a.atsScore != null);
    const avgAts     = withAts.length
      ? Math.round(withAts.reduce((s, a) => s + (a.atsScore ?? 0), 0) / withAts.length)
      : 0;
    const companies  = apps.map(a => esc(a.company) + ' (' + esc(a.position) + ')').join(', ');

    const systemMessage =
      'You are an expert career coach specializing in tech job searches.\n' +
      'Give concise, actionable feedback in Spanish.\n' +
      'Plain text only - no markdown, no bullet points. Max 200 words.';

    const prompt =
      'Analyze this job search data and give 3-5 specific actionable recommendations:\n\n' +
      'Total applications: ' + total + '\n' +
      'Accepted: ' + accepted + ' (' + acceptRate + '% success rate)\n' +
      'Rejected: ' + rejected + '\n' +
      'In process/pending: ' + pending + '\n' +
      'Average ATS score: ' + avgAts + '%\n' +
      'Companies applied to: ' + companies + '\n\n' +
      'Provide warm, specific, data-driven feedback in Spanish.';

    const { text } = await withRetry(
      () => generateText({ prompt, systemMessage, maxTokens: 400, temperature: 0.6 }),
      2, 1500,
    );

    return { feedback: text.trim() };
  }
}

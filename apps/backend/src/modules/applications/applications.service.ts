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
// Strategy: strip markdown fences, then try 3 parse approaches in order.
// The AI sometimes returns a truncated response on the first attempt —
// withRetry handles that. The parser must never fail on valid JSON.
function extractJson<T>(text: string): T | null {
  // 1. Strip markdown code fences
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 2. Try direct parse first (ideal case: model returned clean JSON)
  try { return JSON.parse(cleaned) as T; } catch { /* continue */ }

  // 3. Find outermost {...} by scanning for balanced braces
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  let end = -1;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++;
    else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0) { end = i; break; }
    }
  }
  if (end !== -1) {
    try { return JSON.parse(cleaned.slice(start, end + 1)) as T; } catch { /* continue */ }
  }

  // 4. Last resort: find last } and try to parse from first { to there
  const lastClose = cleaned.lastIndexOf('}');
  if (lastClose > start) {
    try { return JSON.parse(cleaned.slice(start, lastClose + 1)) as T; } catch { /* fall through */ }
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
      'You are an expert ATS CV optimizer.\n' +
      'You receive a candidate base CV and a job offer, and produce a fully optimized ATS CV.\n' +
      'Rules:\n' +
      '1. Incorporate exact keywords from the job offer naturally.\n' +
      '2. Reorder and emphasize the most relevant experience.\n' +
      '3. Adapt the professional summary specifically for this role.\n' +
      '4. NEVER invent data - only reorganize and optimize existing information.\n' +
      '5. Use clean plain-text format suitable for ATS parsers (no tables, columns or graphics).\n' +
      '6. Calculate an ATS Match Score from 0 to 100 based on keyword overlap and relevance.\n\n' +
      'Respond with ONLY a valid JSON object - no markdown, no explanation:\n' +
      '{"atsScore":<integer 0-100>,"cvText":"<full optimized CV as plain text>"}';

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

    const systemMessage =
      'You are a strict ATS CV evaluator. Evaluate the CV using this exact rubric — DO NOT change the rubric or be lenient:\n' +
      'summary: 20 pts — needs min 3 sentences, job title, years of experience, and a concrete value proposition\n' +
      'experience: 30 pts — needs min 2 roles each with company, title, date range (YYYY-YYYY), and min 2 quantified achievements per role\n' +
      'skills: 15 pts — needs min 6 relevant technical skills\n' +
      'education: 10 pts — needs institution, degree/field, graduation year\n' +
      'contact: 10 pts — fullName + email + phone + location all required\n' +
      'languages: 5 pts — at least one language with proficiency level\n' +
      'certifications: 5 pts — at least one entry\n' +
      'linkedIn: 5 pts — valid LinkedIn URL present\n\n' +
      'IMPORTANT: Be strict. Do not award full points unless ALL criteria for that section are met.\n' +
      'Do not suggest making changes that are already correct. Only flag genuine gaps.\n' +
      'Return ONLY a JSON object with this exact shape (no markdown, no explanation):\n' +
      '{{ "score": <integer 0-100>, "approved": <true if score>=85>, "summary": "<one sentence overall assessment>", ' +
      '"fieldFeedback": {{ "summary": "<specific tip or empty string if ok>", "experience": "<specific tip or empty string if ok>", ' +
      '"skills": "<tip or empty>", "education": "<tip or empty>", "contact": "<tip or empty>", ' +
      '"languages": "<tip or empty>", "certifications": "<tip or empty>", "linkedIn": "<tip or empty>" }} }}';

    const prompt = 'Evaluate this CV:\n\n' + cvText;

    return withRetry(async () => {
      const { text } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 800,
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

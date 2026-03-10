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
  ): Promise<Partial<Record<typeof CV_FIELDS[number], string>> & { fieldFeedback?: Record<string, string> }> {
    if (!dto.pdfText || dto.pdfText.length < 10) {
      throw new BadRequestException('PDF text is too short to extract data from');
    }

    const truncated = dto.pdfText.length > 8000
      ? dto.pdfText.slice(0, 8000) + '\n...[truncated]'
      : dto.pdfText;

    // Combined extract + evaluate: one AI call returns extracted fields AND per-field hints.
    // This avoids a separate evaluate call after extraction.
    const systemMessage =
      'You are a CV data extractor AND ATS quality evaluator. Do both tasks in one pass.\n\n' +
      'TASK 1 — EXTRACT all CV data from the raw PDF text into these fields:\n' +
      '  fullName, email, phone, location, linkedIn, summary, experience, education, skills, languages, certifications\n' +
      'Extraction rules:\n' +
      '- experience: for EACH role: Company | Job Title | MM/YYYY–MM/YYYY, then bullets with achievements. Preserve ALL roles.\n' +
      '- skills: comma-separated list\n' +
      '- languages: e.g. Spanish (native), English (C1)\n' +
      '- certifications: name — issuer — year\n' +
      '- All values must be plain strings\n\n' +
      'TASK 2 — EVALUATE each field for ATS quality and set a one-sentence hint if incomplete (max 12 words), or empty string "" if ok:\n' +
      '  fieldFeedback keys: summary, experience, skills, education, contact, languages, certifications, linkedIn\n' +
      '  contact = fullName + email + phone + location combined\n\n' +
      'Write all fieldFeedback values in ' + ((dto as any).lang === 'en' ? 'English' : 'Spanish') + '.\n' +
      'Return ONLY raw JSON — no markdown, no backticks:\n' +
      '{{ "fullName":"","email":"","phone":"","location":"","linkedIn":"","summary":"","experience":"","education":"","skills":"","languages":"","certifications":"", ' +
      '"fieldFeedback":{{"summary":"","experience":"","skills":"","education":"","contact":"","languages":"","certifications":"","linkedIn":""}} }}';

    const prompt = 'Extract and evaluate this CV PDF text:\n\n' + esc(truncated);

    this.logger.log(`Extracting CV for user ${userId} — text length: ${dto.pdfText.length} chars`);

    return withRetry(async () => {
      const { text, model } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 3500,
        temperature: 0.05,
      });
      this.logger.debug(`AI model: ${model} — response preview: ${text.slice(0, 150)}`);
      const parsed = extractJson<Record<string, unknown>>(text);
      if (!parsed) {
        this.logger.warn(`Could not extract JSON from: ${text.slice(0, 300)}`);
        throw new Error('AI returned unstructured response');
      }
      const normalized: Record<string, unknown> = {};
      for (const key of CV_FIELDS) {
        normalized[key] = typeof parsed[key] === 'string' ? parsed[key] : '';
      }
      // Pass through fieldFeedback if present (combined extract+evaluate response)
      if (parsed['fieldFeedback'] && typeof parsed['fieldFeedback'] === 'object') {
        normalized['fieldFeedback'] = parsed['fieldFeedback'];
      }
      return normalized as Partial<Record<typeof CV_FIELDS[number], string>> & { fieldFeedback?: Record<string, string> };
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
    const isEs = (dto.lang ?? 'es') === 'es';

    // Build compact CV block — keep it short so the response budget is for JSON not input
    const cvText =
      'NAME: '   + esc(dto.fullName) + ' | EMAIL: ' + esc(dto.email) +
      ' | PHONE: ' + esc(dto.phone ?? '') + ' | LOC: ' + esc(dto.location ?? '') +
      ' | LI: '  + esc(dto.linkedIn ?? '') + '\n' +
      'SUMMARY: '  + esc((dto.summary        ?? '').slice(0, 600)) + '\n' +
      'EXPERIENCE: ' + esc((dto.experience   ?? '').slice(0, 1200)) + '\n' +
      'EDUCATION: ' + esc((dto.education     ?? '').slice(0, 400)) + '\n' +
      'SKILLS: '   + esc((dto.skills         ?? '').slice(0, 300)) + '\n' +
      'LANGUAGES: ' + esc((dto.languages     ?? '').slice(0, 200)) + '\n' +
      'CERTS: '    + esc((dto.certifications ?? '').slice(0, 300));

    // Rubric: summary20|experience30|skills15|education10|contact10|languages5|certs5|linkedin5
    // Each fieldFeedback value: ONE short sentence in the requested language, or "" if ok.
    // CRITICAL: keep feedback under 12 words each so the total JSON fits in the token budget.
    const lang = isEs ? 'Spanish' : 'English';
    const systemMessage =
      'You are a strict ATS CV scorer. Reply ONLY with raw JSON — zero markdown, zero explanation.\n' +
      'Language for all text fields: ' + lang + '\n\n' +
      'RUBRIC (100 pts total — be strict, do not round up):\n' +
      'contact:10 — fullName+email+phone+location all present\n' +
      'linkedIn:5 — valid linkedin.com URL present\n' +
      'summary:20 — min 3 sentences, has job title + years + value prop\n' +
      'experience:30 — min 2 roles each with company+title+YYYY-YYYY+2 quantified achievements\n' +
      'skills:15 — min 6 technical skills listed\n' +
      'education:10 — institution+degree+year\n' +
      'languages:5 — at least one with level\n' +
      'certifications:5 — at least one with name+year\n\n' +
      'RULES:\n' +
      '- Full pts if ALL criteria met; 0 if nothing; partial otherwise\n' +
      '- fieldFeedback: empty string "" if section is ok; else ONE sentence max 10 words in ' + lang + '\n' +
      '- summary field in output: ONE sentence max 12 words in ' + lang + '\n' +
      '- Do NOT invent or assume missing info\n\n' +
      'OUTPUT — exactly this JSON shape, no extra keys:\n' +
      '{"score":0,"approved":false,"summary":"","fieldFeedback":{"contact":"","linkedIn":"","summary":"","experience":"","skills":"","education":"","languages":"","certifications":""}}';

    const prompt = 'SCORE THIS CV:\n' + cvText;

    return withRetry(async () => {
      const { text } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 500,
        temperature: 0,
      });

      this.logger.debug('[evaluateBaseCV] raw AI response: ' + text.slice(0, 400));

      const parsed = extractJson<CvEvaluationResult>(text);

      // Graceful recovery: if we got a score but the JSON was otherwise malformed,
      // build a safe partial result rather than throwing and retrying.
      if (!parsed) {
        // Try to salvage just the score from the raw text
        const scoreMatch = text.match(/"score"\s*:\s*(\d+)/);
        if (scoreMatch) {
          const score = Math.min(100, Math.max(0, parseInt(scoreMatch[1], 10)));
          this.logger.warn('[evaluateBaseCV] JSON parse failed but salvaged score=' + score);
          return { score, approved: score >= 85, summary: '', fieldFeedback: {} };
        }
        this.logger.error('[evaluateBaseCV] Unparseable response: ' + text.slice(0, 300));
        throw new Error('AI returned unparseable evaluation response');
      }

      if (typeof parsed.score !== 'number') {
        throw new Error('AI evaluation missing score field');
      }

      return {
        score:         Math.min(100, Math.max(0, Math.round(parsed.score))),
        approved:      parsed.score >= 85,
        summary:       typeof parsed.summary === 'string' ? parsed.summary : '',
        fieldFeedback: (parsed.fieldFeedback && typeof parsed.fieldFeedback === 'object')
                         ? parsed.fieldFeedback
                         : {},
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

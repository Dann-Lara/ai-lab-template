import {
  BadRequestException, Injectable,
  Logger, NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { generateText } from '@ai-lab/ai-core';

import { ApplicationEntity } from './entities/application.entity';
import { BaseCvEntity } from './entities/application.entity';
import type {
  CreateApplicationDto, PatchApplicationDto,
  UpsertBaseCvDto, GenerateCvDto, ExtractCvDto,
} from './dto/application.dto';

// ── JSON extractor — same robust pattern as checklists.service ────────────────
function extractJson<T>(text: string): T | null {
  const cleaned = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();
  const start = cleaned.indexOf('{');
  if (start === -1) return null;
  let depth = 0;
  for (let i = start; i < cleaned.length; i++) {
    if (cleaned[i] === '{') depth++;
    else if (cleaned[i] === '}') {
      depth--;
      if (depth === 0) {
        try { return JSON.parse(cleaned.slice(start, i + 1)) as T; } catch { break; }
      }
    }
  }
  return null;
}

// ── Retry with backoff (same helper as checklists) ────────────────────────────
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

// ── CV fields required for generation ────────────────────────────────────────
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
    // Return an empty template without saving
    return this.cvRepo.create({ userId, fullName: '', email: '', phone: '', location: '',
      linkedIn: '', summary: '', experience: '', education: '',
      skills: '', languages: '', certifications: '' });
  }

  async upsertBaseCV(userId: string, dto: UpsertBaseCvDto): Promise<BaseCvEntity> {
    let entity = await this.cvRepo.findOne({ where: { userId } });
    if (!entity) {
      entity = this.cvRepo.create({ userId });
    }
    // Merge only provided fields
    Object.assign(entity, dto);
    return this.cvRepo.save(entity);
  }

  // ── Applications CRUD ─────────────────────────────────────────────────────

  async findAll(userId: string): Promise<ApplicationEntity[]> {
    return this.appRepo.find({
      where: { userId },
      order: { appliedAt: 'DESC' },
    });
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

  // ── AI: Generate ATS CV ───────────────────────────────────────────────────

  async generateCv(
    userId: string,
    dto: GenerateCvDto,
  ): Promise<{ atsScore: number; cvText: string }> {
    // Load the user's base CV for context
    const baseCV = await this.cvRepo.findOne({ where: { userId } });
    if (!baseCV || !baseCV.fullName || (!baseCV.experience && !baseCV.summary)) {
      throw new BadRequestException('Base CV is incomplete. Please fill in name, email and experience/summary before generating.');
    }

    const cvContext = `
Name: ${baseCV.fullName}
Email: ${baseCV.email}
Phone: ${baseCV.phone}
Location: ${baseCV.location}
LinkedIn: ${baseCV.linkedIn}

PROFESSIONAL SUMMARY:
${baseCV.summary}

WORK EXPERIENCE:
${baseCV.experience}

EDUCATION:
${baseCV.education}

SKILLS:
${baseCV.skills}

LANGUAGES:
${baseCV.languages}

CERTIFICATIONS:
${baseCV.certifications}`.trim();

    const systemMessage = `You are an expert ATS CV optimizer.
You receive a candidate's base CV and a job offer, and you produce a fully optimized ATS CV.
Rules:
1. Incorporate exact keywords from the job offer naturally
2. Reorder and emphasize the most relevant experience
3. Adapt the summary specifically for this role
4. NEVER invent data — only reorganize and optimize existing information
5. Use clean plain-text format suitable for ATS parsers (no tables, columns or graphics)
6. Calculate an ATS Match Score (0-100) based on keyword overlap and relevance

You MUST respond with ONLY a valid JSON object (no markdown, no explanation):
{"atsScore":<integer 0-100>,"cvText":"<full optimized CV as plain text with sections separated by \\n\\n>"}`;

    const prompt = `JOB OFFER — ${dto.company} / ${dto.position}:
${dto.jobOffer}

---

CANDIDATE BASE CV:
${cvContext}

Generate the optimized ATS CV and return ONLY the JSON object.`;

    this.logger.log(`Generating ATS CV for user ${userId} → ${dto.position} @ ${dto.company}`);

    const result = await withRetry(async () => {
      const { text, model } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 3000,
        temperature: 0.3,
      });

      this.logger.debug(`AI model: ${model} — response length: ${text.length} chars`);

      const parsed = extractJson<{ atsScore: number; cvText: string }>(text);
      if (!parsed || typeof parsed.atsScore !== 'number' || !parsed.cvText) {
        this.logger.warn(`AI returned unexpected format: ${text.slice(0, 200)}`);
        throw new Error('AI response missing atsScore or cvText');
      }

      return {
        atsScore: Math.min(100, Math.max(0, Math.round(parsed.atsScore))),
        cvText: parsed.cvText.trim(),
      };
    }, 2, 2000);

    return result;
  }

  // ── AI: Extract CV from PDF text ──────────────────────────────────────────

  async extractCvFromText(
    userId: string,
    dto: ExtractCvDto,
  ): Promise<Partial<Record<typeof CV_FIELDS[number], string>>> {
    if (!dto.pdfText || dto.pdfText.length < 10) {
      throw new BadRequestException('PDF text is too short to extract data from');
    }

    // Truncate to ~8000 chars to stay within token limits
    const truncated = dto.pdfText.length > 8000
      ? dto.pdfText.slice(0, 8000) + '\n...[truncated]'
      : dto.pdfText;

    const systemMessage = `You are a precise CV/resume data extractor.
You receive raw text extracted from a PDF CV.
You MUST return ONLY a valid JSON object — no markdown, no explanation, no extra text.
The JSON must contain exactly these string keys (use empty string "" if not found):
fullName, email, phone, location, linkedIn, summary, experience, education, skills, languages, certifications

Extraction rules:
- experience: include company, job title, date range (e.g. "Jan 2020 – Mar 2022"), and key achievements for each role, separated by newlines
- education: institution, degree/field, graduation year
- skills: comma-separated list of technical skills
- languages: e.g. "Spanish (native), English (C1)"
- All values must be plain strings (no nested objects or arrays)
- Start response with { and end with } — nothing before or after`;

    const prompt = `Extract all CV/resume information from this text:\n\n${truncated}`;

    this.logger.log(`Extracting CV for user ${userId} — text length: ${dto.pdfText.length} chars`);

    const result = await withRetry(async () => {
      const { text, model } = await generateText({
        prompt,
        systemMessage,
        maxTokens: 2000,
        temperature: 0.05,
      });

      this.logger.debug(`AI model: ${model} — response: ${text.slice(0, 150)}`);

      const parsed = extractJson<Record<string, string>>(text);
      if (!parsed) {
        this.logger.warn(`Could not extract JSON from response: ${text.slice(0, 300)}`);
        throw new Error('AI returned unstructured response');
      }

      // Normalize: ensure all required keys exist as strings
      const normalized: Record<string, string> = {};
      for (const key of CV_FIELDS) {
        normalized[key] = typeof parsed[key] === 'string' ? parsed[key] : '';
      }
      return normalized;
    }, 2, 2000);

    return result;
  }

  // ── AI: Job search coaching feedback ─────────────────────────────────────

  async generateFeedback(userId: string): Promise<{ feedback: string }> {
    const apps = await this.findAll(userId);
    if (apps.length < 2) {
      throw new BadRequestException('Need at least 2 applications to generate feedback');
    }

    const total    = apps.length;
    const accepted = apps.filter(a => a.status === 'accepted').length;
    const rejected = apps.filter(a => a.status === 'rejected').length;
    const pending  = apps.filter(a => a.status === 'pending' || a.status === 'in_process').length;
    const acceptRate = Math.round((accepted / total) * 100);
    const withAts  = apps.filter(a => a.atsScore !== null && a.atsScore !== undefined);
    const avgAts   = withAts.length
      ? Math.round(withAts.reduce((s, a) => s + (a.atsScore ?? 0), 0) / withAts.length)
      : 0;
    const companies = apps.map(a => `${a.company} (${a.position})`).join(', ');

    const systemMessage = `You are an expert career coach specializing in tech job searches.
Give concise, actionable feedback in Spanish.
Response must be plain text only — no markdown, no bullet points. Max 200 words.`;

    const prompt = `Analyze this job search data and provide constructive feedback with 3-5 specific, actionable recommendations:

Total applications: ${total}
Accepted: ${accepted} (${acceptRate}% success rate)
Rejected: ${rejected}
In process/pending: ${pending}
Average ATS score: ${avgAts}%
Companies applied to: ${companies}

Provide warm, specific, data-driven feedback in Spanish.`;

    const { text } = await withRetry(
      () => generateText({ prompt, systemMessage, maxTokens: 400, temperature: 0.6 }),
      2, 1500,
    );

    return { feedback: text.trim() };
  }
}

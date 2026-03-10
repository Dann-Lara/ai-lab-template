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
      cvGenerated: dto.generatedCvTextEs ?? dto.generatedCvText,
      cvGeneratedEs: dto.generatedCvTextEs,
      cvGeneratedEn: dto.generatedCvTextEn,
      cvGeneratedFlag: !!(dto.cvGenerated || dto.generatedCvText || dto.generatedCvTextEs),
      appliedFrom: dto.appliedFrom,
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
    if (dto.generatedCvTextEs !== undefined) {
      app.cvGeneratedEs = dto.generatedCvTextEs;
      app.cvGenerated = dto.generatedCvTextEs; // keep compat
      app.cvGeneratedFlag = true;
    }
    if (dto.generatedCvTextEn !== undefined) app.cvGeneratedEn = dto.generatedCvTextEn;
    if (dto.appliedFrom !== undefined) app.appliedFrom = dto.appliedFrom;
    if (dto.interviewQuestions !== undefined) app.interviewQuestions = dto.interviewQuestions;
    if (dto.interviewAnswers !== undefined) app.interviewAnswers = dto.interviewAnswers;
    return this.appRepo.save(app);
  }

  async remove(userId: string, id: string): Promise<void> {
    const app = await this.findOne(userId, id);
    await this.appRepo.remove(app);
  }

  // ── AI: Generate dual-language ATS-optimized hybrid CV ─────────────────────

  async generateCv(
    userId: string,
    dto: GenerateCvDto,
  ): Promise<{ atsScore: number; cvEs: string; cvEn: string }> {
    const baseCV = await this.cvRepo.findOne({ where: { userId } });
    if (!baseCV || !baseCV.fullName || (!baseCV.experience && !baseCV.summary)) {
      throw new BadRequestException(
        'Base CV is incomplete. Please fill in name, email and experience/summary before generating.',
      );
    }

    const cvBlock =
      'NAME: ' + esc(baseCV.fullName) + '\n' +
      'EMAIL: ' + esc(baseCV.email) + '\n' +
      'PHONE: ' + esc(baseCV.phone) + '\n' +
      'LOCATION: ' + esc(baseCV.location) + '\n' +
      'LINKEDIN: ' + esc(baseCV.linkedIn) + '\n\n' +
      'PROFESSIONAL SUMMARY:\n' + esc(baseCV.summary) + '\n\n' +
      'WORK EXPERIENCE:\n' + esc(baseCV.experience) + '\n\n' +
      'EDUCATION:\n' + esc(baseCV.education) + '\n\n' +
      'SKILLS:\n' + esc(baseCV.skills) + '\n\n' +
      'LANGUAGES:\n' + esc(baseCV.languages) + '\n\n' +
      'CERTIFICATIONS:\n' + esc(baseCV.certifications);

    // We use a delimiter-based format instead of embedding full CVs inside JSON values.
    // Embedding 2-page CVs inside JSON strings causes truncation and parse failures
    // because models serialize \n as literal chars and some providers cap output tokens.
    //
    // Format:
    //   SCORE:<integer>
    //   ===ES===
    //   <full Spanish CV, plain text>
    //   ===EN===
    //   <full English CV, plain text>
    //   ===END===
    // ── ATS expert system prompt — one focused call per language ─────────────
    const systemMessage =
      'You are a world-class ATS CV specialist. Produce ONE complete hybrid CV that scores 90-100% on ANY ATS system without lying.\n\n' +
      'HYBRID APPROACH — adapt without inventing:\n' +
      '- If the base CV lists a tool, describe its logical derivatives truthfully:\n' +
      '  React -> "built reusable components with React and hooks"\n' +
      '  Node.js -> "designed RESTful APIs with Node.js and Express"\n' +
      '  SQL -> "wrote complex queries and optimized indexes"\n' +
      '- Never add companies, job titles, degrees or dates not in the base CV\n' +
      '- Never inflate years of experience\n' +
      '- Rephrase existing achievements using exact job-offer wording when truthful\n\n' +
      'ATS FORMATTING RULES (mandatory):\n' +
      '1. Plain text only — NO tables, columns, headers/footers, images, markdown\n' +
      '2. Section headers ALL CAPS: CONTACT | SUMMARY | EXPERIENCE | EDUCATION | SKILLS | LANGUAGES | CERTIFICATIONS\n' +
      '3. Dates: MM/YYYY format (e.g. 03/2021 - Present)\n' +
      '4. Bullet points: hyphen-space "- " only, never Unicode bullets\n' +
      '5. Numbers over words: "5 years" not "five years"\n' +
      '6. Embed EXACT keywords from job offer verbatim\n' +
      '7. Skills section: comma-separated list, no sub-categories\n' +
      '8. No personal pronouns — start bullets with action verbs\n' +
      '9. Summary: first sentence = job title from offer + years of experience\n' +
      '10. Contact block at top, single column layout\n\n' +
      'KEYWORD STRATEGY:\n' +
      '- Extract ALL technical keywords from the job offer\n' +
      '- Put the 5 most critical ones in the Summary\n' +
      '- Distribute remaining keywords in Experience bullets\n' +
      '- List all derivable job-offer skills in Skills\n\n' +
      'OUTPUT: plain text only, no markdown, no backticks, no preamble.\n' +
      'Start directly with the CV. First line must be the candidate full name.';

    const jobHeader =
      'JOB OFFER (' + esc(dto.company) + ' — ' + esc(dto.position) + '):\n' +
      esc(dto.jobOffer) + '\n\n---\n\nCANDIDATE BASE CV:\n' + cvBlock;

    this.logger.log(`Generating dual ATS CV: ${dto.position} @ ${dto.company} for user ${userId}`);

    // ── Two parallel focused calls — each generates ONE language CV fully ─────
    // This avoids the truncation that occurs when asking for two full CVs in one output.
    const [esResult, enResult, scoreResult] = await Promise.all([
      withRetry(() => generateText({
        prompt: jobHeader + '\n\nWrite the complete ATS-optimized CV in SPANISH. Plain text only.',
        systemMessage,
        maxTokens: 4000,
        temperature: 0.2,
      }), 2, 1500),
      withRetry(() => generateText({
        prompt: jobHeader + '\n\nWrite the complete ATS-optimized CV in ENGLISH. Plain text only.',
        systemMessage,
        maxTokens: 4000,
        temperature: 0.2,
      }), 2, 1500),
      withRetry(() => generateText({
        prompt: jobHeader + '\n\nReply with ONLY a single integer 0-100 representing the ATS keyword match score between this candidate profile and the job offer. No explanation, no text, just the number.',
        systemMessage: 'You are an ATS scoring engine. Output a single integer 0-100.',
        maxTokens: 10,
        temperature: 0,
      }), 2, 1500),
    ]);

    const cvEs = esResult.text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
    const cvEn = enResult.text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();

    const scoreRaw = parseInt(scoreResult.text.replace(/\D/g, ''), 10);
    const atsScore = isNaN(scoreRaw) ? 75 : Math.min(100, Math.max(0, scoreRaw));

    this.logger.debug(`generateCv ES: ${esResult.model} — ${cvEs.length} chars`);
    this.logger.debug(`generateCv EN: ${enResult.model} — ${cvEn.length} chars`);

    if (!cvEs && !cvEn) {
      throw new Error('AI returned empty CV content for both languages');
    }

    return { atsScore, cvEs: cvEs || cvEn, cvEn: cvEn || cvEs };
  }

    // ── AI: Answer interview questions ──────────────────────────────────────────

  async answerInterviewQuestions(
    userId: string,
    appId: string,
    questions: string,
    lang: string,
    userRole: string,
  ): Promise<{ answers: string }> {
    const app = await this.findOne(userId, appId);
    const baseCV = await this.cvRepo.findOne({ where: { userId } });

    if (!baseCV) throw new BadRequestException('Base CV not found');
    if (!app.cvGeneratedEs && !app.cvGeneratedEn) {
      throw new BadRequestException('No generated CV found for this application');
    }

    const isEs   = (lang ?? 'es') === 'es';
    const langTx = isEs ? 'Spanish' : 'English';

    // Use the tailored CV as primary context — it already contains all base CV info
    // adapted for this role. Add only the extra fields for inference completeness.
    const tailoredCv = esc(((app.cvGeneratedEs ?? app.cvGeneratedEn) ?? '').slice(0, 3500));
    const cvContext =
      '=== TAILORED CV for ' + esc(app.position) + ' @ ' + esc(app.company) + ' ===\n' +
      tailoredCv + '\n\n' +
      '=== ADDITIONAL CONTEXT ===\n' +
      'SKILLS (full): ' + esc((baseCV.skills ?? '').slice(0, 500)) + '\n' +
      'LANGUAGES: ' + esc(baseCV.languages ?? '') + '\n' +
      'CERTS: ' + esc((baseCV.certifications ?? '').slice(0, 300));

    // Technical doc context for superadmin
    const techContext = userRole === 'superadmin'
      ? '\n\n=== TECHNICAL REPOSITORY CONTEXT ===\n' +
        'This is an AI-powered job application assistant built on a Next.js 14 + NestJS monorepo (Turborepo).\n' +
        'Tech: TypeScript, PostgreSQL (TypeORM), Redis, LangChain, Google Gemini / OpenAI / Groq (multi-provider fallback).\n' +
        'Architecture: PermissionsProvider (DB-backed per user), JWT auth, modular NestJS services.\n' +
        'Applications module: Base CV (ATS scored >=85 to save), hybrid AI CV generator (ES+EN), PDF export, Q&A assistant.\n' +
        'Candidate is superadmin — may reference system capabilities, AI models used, or technical implementation if relevant to interview questions.'
      : '';

    const systemMessage =
      'You are a professional interview coach and career advisor helping a job applicant answer interview questions.\n' +
      'Answer all questions based STRICTLY on the provided CVs and context.\n\n' +
      'INFERENCE RULES (apply these before answering):\n' +
      '- If the CV shows a senior-level tool or framework, INFER logical derivatives:\n' +
      '  Angular -> knows observables/RxJS, lazy loading, dependency injection, NgRx\n' +
      '  React -> knows hooks, context, code splitting, testing with RTL\n' +
      '  Node.js -> knows async/await, event loop, streams, Express middleware\n' +
      '  TypeScript -> knows generics, decorators, utility types\n' +
      '  AWS -> knows IAM, VPC, EC2/ECS, CloudWatch basics\n' +
      '  Docker -> knows compose, networking, volumes, multi-stage builds\n' +
      '- If the CV shows X years senior experience, infer leadership and mentoring capacity\n' +
      '- NEVER invent specific company names, projects, or numbers not in the CV\n' +
      '- If a question cannot be answered from CV context, give a genuine best-effort answer that fits the profile\n\n' +
      'FORMAT:\n' +
      '- CRITICAL: answer EVERY question — do NOT stop early or truncate\n' +
      '- Answer each question clearly, numbered to match the input\n' +
      '- Each answer: 2-5 sentences, professional but natural tone\n' +
      '- Use first person ("I have..." / "En mi experiencia...")\n' +
      '- If there are many questions, keep each answer concise (3 sentences) so you can complete all of them\n' +
      '- Language: ' + langTx + '\n\n' +
      'CV CONTEXT:\n' + cvContext + techContext;

    const prompt =
      'JOB: ' + esc(app.position) + ' @ ' + esc(app.company) + '\n\n' +
      'INTERVIEW QUESTIONS:\n' + esc(questions) + '\n\n' +
      'Provide clear, professional answers to each question above.';

    return withRetry(async () => {
      const { text } = await generateText({
        prompt, systemMessage, maxTokens: 6000, temperature: 0.4,
      });
      // Strip any accidental markdown
      const clean = text.replace(/```[a-z]*\n?/gi, '').replace(/```/g, '').trim();
      return { answers: clean };
    }, 2, 1500);
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
      '{ "fullName":"","email":"","phone":"","location":"","linkedIn":"","summary":"","experience":"","education":"","skills":"","languages":"","certifications":"", ' +
      '"fieldFeedback":{"summary":"","experience":"","skills":"","education":"","contact":"","languages":"","certifications":"","linkedIn":""} }';

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
    const isEs     = (dto.lang ?? 'es') === 'es';
    const lang     = isEs ? 'Spanish' : 'English';
    const approved = dto.approvedFields ?? [];

    // Canonical rubric weights
    const WEIGHTS: Record<string, number> = {
      contact: 10, linkedIn: 5, summary: 20, experience: 30,
      skills: 15, education: 10, languages: 5, certifications: 5,
    };
    const ALL_FIELDS = Object.keys(WEIGHTS);

    // Short-circuit: everything already approved
    if (ALL_FIELDS.every(k => approved.includes(k))) {
      const ff: Record<string, string> = {};
      ALL_FIELDS.forEach(k => { ff[k] = ''; });
      return { score: 100, approved: true, summary: '', fieldFeedback: ff };
    }

    const lockedScore   = approved.reduce((sum, k) => sum + (WEIGHTS[k] ?? 0), 0);
    const pendingFields = ALL_FIELDS.filter(k => !approved.includes(k));

    // Build CV block - only include sections still pending (saves tokens)
    const cvLines: string[] = [
      'NAME: ' + esc(dto.fullName) + ' | EMAIL: ' + esc(dto.email) +
      ' | PHONE: ' + esc(dto.phone ?? '') + ' | LOC: ' + esc(dto.location ?? '') +
      ' | LI: ' + esc(dto.linkedIn ?? ''),
    ];
    if (pendingFields.includes('summary'))        cvLines.push('SUMMARY: '    + esc((dto.summary        ?? '').slice(0, 600)));
    if (pendingFields.includes('experience'))     cvLines.push('EXPERIENCE: ' + esc((dto.experience     ?? '').slice(0, 1200)));
    if (pendingFields.includes('education'))      cvLines.push('EDUCATION: '  + esc((dto.education      ?? '').slice(0, 400)));
    if (pendingFields.includes('skills'))         cvLines.push('SKILLS: '     + esc((dto.skills         ?? '').slice(0, 300)));
    if (pendingFields.includes('languages'))      cvLines.push('LANGUAGES: '  + esc((dto.languages      ?? '').slice(0, 200)));
    if (pendingFields.includes('certifications')) cvLines.push('CERTS: '      + esc((dto.certifications ?? '').slice(0, 300)));

    const RUBRIC: Record<string, string> = {
      contact:        'contact:10 - fullName+email+phone+location all present',
      linkedIn:       'linkedIn:5 - valid linkedin.com URL present',
      summary:        'summary:20 - min 3 sentences, has job title+years+value prop',
      experience:     'experience:30 - min 2 roles each with company+title+YYYY-YYYY+2 quantified achievements',
      skills:         'skills:15 - min 6 technical skills listed',
      education:      'education:10 - institution+degree+year present',
      languages:      'languages:5 - at least one entry with proficiency level',
      certifications: 'certifications:5 - at least one entry with name and year',
    };

    const rubricLines  = pendingFields.map(k => RUBRIC[k]).filter(Boolean).join('\n');
    const approvedNote = approved.length > 0
      ? 'FROZEN fields (already approved - keep full pts, feedback MUST be ""): ' + approved.join(', ') + '\n\n'
      : '';

    // fieldFeedback template with all keys preset to ""
    const ffTemplate: Record<string, string> = {};
    ALL_FIELDS.forEach(k => { ffTemplate[k] = ''; });

    const systemMessage =
      'You are a strict ATS CV scorer. Reply ONLY with raw JSON - zero markdown.\n' +
      'Language for all feedback text: ' + lang + '\n\n' +
      approvedNote +
      'RUBRIC for PENDING fields:\n' + rubricLines + '\n\n' +
      'SCORING:\n' +
      '- Pending fields: full pts if ALL criteria met; 0 if none; partial otherwise\n' +
      '- Frozen fields always score full points (already locked in)\n' +
      '- Total = sum of frozen (' + lockedScore + ' pts locked) + pending field scores\n' +
      '- fieldFeedback for frozen fields MUST be ""\n' +
      '- fieldFeedback for pending: "" if met; else ONE sentence max 10 words in ' + lang + '\n' +
      '- summary (output): ONE sentence max 12 words in ' + lang + '\n' +
      '- Do NOT invent info\n\n' +
      'OUTPUT (no extra keys):\n' +
      JSON.stringify({ score: 0, approved: false, summary: '', fieldFeedback: ffTemplate });

    const prompt = 'EVALUATE:\n' + cvLines.join('\n');

    return withRetry(async () => {
      const { text } = await generateText({ prompt, systemMessage, maxTokens: 500, temperature: 0 });

      this.logger.debug('[evaluateBaseCV] raw: ' + text.slice(0, 400));

      const parsed = extractJson<CvEvaluationResult>(text);

      if (!parsed) {
        const m = text.match(/"score"\s*:\s*(\d+)/);
        if (m) {
          const score = Math.min(100, Math.max(0, parseInt(m[1], 10)));
          this.logger.warn('[evaluateBaseCV] salvaged score=' + score);
          return { score, approved: score >= 85, summary: '', fieldFeedback: ffTemplate };
        }
        this.logger.error('[evaluateBaseCV] unparseable: ' + text.slice(0, 300));
        throw new Error('AI returned unparseable evaluation response');
      }

      if (typeof parsed.score !== 'number') throw new Error('AI evaluation missing score field');

      // Enforce: frozen fields must always have empty feedback
      const ff = (parsed.fieldFeedback && typeof parsed.fieldFeedback === 'object')
        ? { ...ffTemplate, ...parsed.fieldFeedback }
        : { ...ffTemplate };
      approved.forEach(k => { ff[k] = ''; });

      return {
        score:         Math.min(100, Math.max(0, Math.round(parsed.score))),
        approved:      parsed.score >= 85,
        summary:       typeof parsed.summary === 'string' ? parsed.summary : '',
        fieldFeedback: ff,
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

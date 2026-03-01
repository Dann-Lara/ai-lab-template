import {
  BadRequestException, ForbiddenException, Injectable,
  InternalServerErrorException, Logger, NotFoundException,
  TooManyRequestsException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThanOrEqual } from 'typeorm';
import { generateText } from '@ai-lab/ai-core';

import {
  ChecklistEntity, ChecklistItemEntity, ChecklistFeedbackEntity,
} from './entities/checklist.entity';
import type {
  CreateChecklistParamsDto, ChecklistItemDraftDto,
  ConfirmChecklistDto, RegenerateDraftDto, PatchItemDto, PatchChecklistDto,
} from './dto/checklist.dto';

// ── Simple in-memory rate limiter per user (resets on restart) ──────────────
const generationCounts = new Map<string, { count: number; resetAt: number }>();

function checkRateLimit(userId: string, maxPerHour = 10): void {
  const now = Date.now();
  const entry = generationCounts.get(userId);
  if (!entry || entry.resetAt < now) {
    generationCounts.set(userId, { count: 1, resetAt: now + 3_600_000 });
    return;
  }
  if (entry.count >= maxPerHour) {
    throw new TooManyRequestsException('AI generation limit reached. Try again later.');
  }
  entry.count++;
}

// ── AI response schema validation ───────────────────────────────────────────
interface AiItem {
  description: string;
  frequency: string;
  estimatedDuration: number;
  hack: string;
  customFrequencyDays?: number;
}
interface AiDraft { items: AiItem[]; rationale?: string; }

function validateAiResponse(raw: unknown): AiDraft {
  if (!raw || typeof raw !== 'object') throw new Error('Not an object');
  const obj = raw as Record<string, unknown>;
  if (!Array.isArray(obj['items']) || obj['items'].length === 0)
    throw new Error('Missing or empty items array');

  const validFreqs = new Set(['once', 'daily', 'weekly', 'custom']);
  for (const item of obj['items'] as unknown[]) {
    const i = item as Record<string, unknown>;
    if (typeof i['description'] !== 'string' || !i['description'])
      throw new Error('Item missing description');
    if (typeof i['frequency'] !== 'string' || !validFreqs.has(i['frequency'] as string))
      throw new Error(`Invalid frequency: ${String(i['frequency'])}`);
    if (typeof i['estimatedDuration'] !== 'number' || (i['estimatedDuration'] as number) < 1)
      throw new Error('Invalid estimatedDuration');
    if (typeof i['hack'] !== 'string' || !i['hack'])
      throw new Error('Item missing hack');
  }
  return obj as unknown as AiDraft;
}

// ── Parse AI JSON with markdown fences removed ───────────────────────────────
function parseAiJson(text: string): AiDraft {
  const cleaned = text.replace(/```json|```/g, '').trim();
  // Find the first { ... } block
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object found');
  return validateAiResponse(JSON.parse(cleaned.slice(start, end + 1)) as unknown);
}

// ── Retry helper with exponential backoff ────────────────────────────────────
async function withRetry<T>(
  fn: () => Promise<T>,
  retries = 2,
  baseDelayMs = 2000,
): Promise<T> {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try { return await fn(); }
    catch (err) {
      if (attempt === retries) throw err;
      await new Promise((r) => setTimeout(r, baseDelayMs * Math.pow(2, attempt)));
    }
  }
  throw new Error('unreachable');
}

// ── Build prompts ────────────────────────────────────────────────────────────
function buildGenerationPrompt(p: CreateChecklistParamsDto): string {
  return `You are a productivity expert. Generate a personalized checklist from:
Title: ${p.title}
Objective: ${p.objective}
${p.category ? `Category: ${p.category}` : ''}
Start: ${p.startDate} | End: ${p.endDate}
Difficulty: ${p.difficulty} | Daily time: ${p.dailyTimeAvailable} min
${p.goalMetric ? `Goal: ${p.goalMetric}` : ''}
Style: ${p.style}
Language: ${p.language ?? 'es'}

Generate 5-15 tasks. Each task MUST have:
- description: actionable text in the specified language
- frequency: "once","daily","weekly", or "custom"
- customFrequencyDays: (integer, only if frequency is "custom")
- estimatedDuration: minutes (integer)
- hack: motivational tip max 140 chars in the specified language

Total estimated daily duration must not exceed ${p.dailyTimeAvailable} minutes.
Optionally include "rationale" string (max 200 chars).

Respond ONLY with valid JSON: {"items":[...],"rationale":"..."}. No extra text.`;
}

function buildRegenerationPrompt(p: CreateChecklistParamsDto, feedback: string): string {
  return `${buildGenerationPrompt(p)}

User feedback on previous draft: "${feedback}"

Generate a revised list incorporating this feedback. Keep the same JSON format.`;
}

function buildFeedbackPrompt(data: {
  title: string; objective: string; startDate: string; endDate: string;
  completedLastWeek: number; totalTasks: number; trend: string;
  upcomingTasks: string[]; language: string;
}): string {
  return `You are a motivational productivity coach. Write a short (max 200 words), warm, 
encouraging comment in ${data.language} based on:
Checklist: "${data.title}" — ${data.objective}
Period: ${data.startDate} to ${data.endDate}
Completed last week: ${data.completedLastWeek}/${data.totalTasks}
Trend: ${data.trend}
Upcoming: ${data.upcomingTasks.join(', ')}

Respond with plain text only. No markdown. Be warm, specific and motivating.`;
}

@Injectable()
export class ChecklistsService {
  private readonly logger = new Logger(ChecklistsService.name);

  constructor(
    @InjectRepository(ChecklistEntity)
    private readonly checklistRepo: Repository<ChecklistEntity>,
    @InjectRepository(ChecklistItemEntity)
    private readonly itemRepo: Repository<ChecklistItemEntity>,
    @InjectRepository(ChecklistFeedbackEntity)
    private readonly feedbackRepo: Repository<ChecklistFeedbackEntity>,
  ) {}

  // ── Generate draft ─────────────────────────────────────────────────────────
  async generateDraft(
    userId: string,
    params: CreateChecklistParamsDto,
  ): Promise<{ suggestedItems: ChecklistItemDraftDto[]; rationale?: string }> {
    checkRateLimit(userId);

    // Validate date logic
    if (new Date(params.endDate) <= new Date(params.startDate)) {
      throw new BadRequestException('endDate must be after startDate');
    }

    const prompt = buildGenerationPrompt(params);

    const draft = await withRetry(async () => {
      const { text } = await generateText({ prompt, maxTokens: 2000, temperature: 0.7 });
      return parseAiJson(text);
    }, 2, 2000);

    const items: ChecklistItemDraftDto[] = draft.items.map((item, idx) => ({
      order: idx,
      description: item.description.slice(0, 500),
      frequency: (item.frequency as ChecklistItemDraftDto['frequency']) ?? 'daily',
      customFrequencyDays: item.customFrequencyDays,
      estimatedDuration: Math.min(Math.max(item.estimatedDuration, 1), 480),
      hack: item.hack.slice(0, 200),
    }));

    return { suggestedItems: items, rationale: draft.rationale };
  }

  // ── Regenerate draft ───────────────────────────────────────────────────────
  async regenerateDraft(
    userId: string,
    dto: RegenerateDraftDto,
  ): Promise<{ suggestedItems: ChecklistItemDraftDto[]; rationale?: string }> {
    checkRateLimit(userId);
    const prompt = buildRegenerationPrompt(dto.parameters, dto.feedback);

    const draft = await withRetry(async () => {
      const { text } = await generateText({ prompt, maxTokens: 2000, temperature: 0.75 });
      return parseAiJson(text);
    }, 2, 2000);

    const items: ChecklistItemDraftDto[] = draft.items.map((item, idx) => ({
      order: idx,
      description: item.description.slice(0, 500),
      frequency: (item.frequency as ChecklistItemDraftDto['frequency']) ?? 'daily',
      customFrequencyDays: item.customFrequencyDays,
      estimatedDuration: Math.min(Math.max(item.estimatedDuration, 1), 480),
      hack: item.hack.slice(0, 200),
    }));

    return { suggestedItems: items, rationale: draft.rationale };
  }

  // ── Confirm (save) ─────────────────────────────────────────────────────────
  async confirm(userId: string, dto: ConfirmChecklistDto): Promise<ChecklistEntity> {
    if (!dto.finalItems.length) throw new BadRequestException('At least one task required');

    const checklist = this.checklistRepo.create({
      userId,
      title: dto.parameters.title,
      objective: dto.parameters.objective,
      category: dto.parameters.category,
      startDate: dto.parameters.startDate,
      endDate: dto.parameters.endDate,
      difficulty: dto.parameters.difficulty,
      dailyTimeAvailable: dto.parameters.dailyTimeAvailable,
      reminderPreferences: dto.parameters.reminderPreferences,
      isRecurring: dto.parameters.isRecurring ?? false,
      recurrencePattern: dto.parameters.recurrencePattern,
      goalMetric: dto.parameters.goalMetric,
      style: dto.parameters.style,
      telegramChatId: dto.parameters.telegramChatId,
      language: dto.parameters.language ?? 'es',
      status: 'active',
    });

    const saved = await this.checklistRepo.save(checklist);

    const itemEntities = dto.finalItems.map((item, idx) =>
      this.itemRepo.create({
        checklistId: saved.id,
        order: item.order ?? idx,
        description: item.description,
        frequency: item.frequency,
        customFrequencyDays: item.customFrequencyDays,
        estimatedDuration: item.estimatedDuration,
        hack: item.hack,
        status: 'pending',
        dueDate: new Date(),
      }),
    );

    await this.itemRepo.save(itemEntities);
    return this.findOne(userId, saved.id);
  }

  // ── List checklists ────────────────────────────────────────────────────────
  async findAll(userId: string): Promise<ChecklistEntity[]> {
    return this.checklistRepo.find({
      where: { userId },
      relations: ['items'],
      order: { createdAt: 'DESC' },
    });
  }

  // ── Get single checklist ───────────────────────────────────────────────────
  async findOne(userId: string, id: string): Promise<ChecklistEntity> {
    const checklist = await this.checklistRepo.findOne({
      where: { id, userId },
      relations: ['items', 'feedbacks'],
    });
    if (!checklist) throw new NotFoundException('Checklist not found');
    // Sort items by order
    checklist.items?.sort((a, b) => a.order - b.order);
    return checklist;
  }

  // ── Patch checklist ────────────────────────────────────────────────────────
  async patchChecklist(userId: string, id: string, dto: PatchChecklistDto): Promise<ChecklistEntity> {
    const checklist = await this.findOne(userId, id);
    if (dto.status) checklist.status = dto.status;
    if (dto.title) checklist.title = dto.title;
    await this.checklistRepo.save(checklist);
    return checklist;
  }

  // ── Delete checklist ───────────────────────────────────────────────────────
  async remove(userId: string, id: string): Promise<void> {
    const checklist = await this.findOne(userId, id);
    await this.checklistRepo.remove(checklist);
  }

  // ── Patch item (complete / postpone / skip) ────────────────────────────────
  async patchItem(userId: string, checklistId: string, itemId: string, dto: PatchItemDto): Promise<ChecklistItemEntity> {
    const checklist = await this.findOne(userId, checklistId);
    const item = checklist.items?.find((i) => i.id === itemId);
    if (!item) throw new NotFoundException('Item not found');

    if (dto.action === 'complete') {
      item.status = 'completed';
      item.completedAt = new Date();
    } else if (dto.action === 'postpone') {
      const due = dto.dueDate ? new Date(dto.dueDate) : (() => {
        const d = new Date(); d.setDate(d.getDate() + 1); return d;
      })();
      item.dueDate = due;
      item.reminderSent = false;
    } else if (dto.action === 'skip') {
      item.status = 'skipped';
    }

    return this.itemRepo.save(item);
  }

  // ── Progress data for dashboard ────────────────────────────────────────────
  async getProgress(userId: string, checklistId: string): Promise<{
    total: number; completed: number; skipped: number; pending: number;
    completionRate: number; dailyData: Array<{ date: string; count: number }>;
    estimatedTotalMinutes: number; completedMinutes: number;
  }> {
    const checklist = await this.findOne(userId, checklistId);
    const items = checklist.items ?? [];

    const total = items.length;
    const completed = items.filter((i) => i.status === 'completed').length;
    const skipped = items.filter((i) => i.status === 'skipped').length;
    const pending = items.filter((i) => i.status === 'pending').length;

    // Daily completions (last 14 days)
    const dailyMap = new Map<string, number>();
    items
      .filter((i) => i.completedAt)
      .forEach((i) => {
        const date = new Date(i.completedAt!).toISOString().split('T')[0]!;
        dailyMap.set(date, (dailyMap.get(date) ?? 0) + 1);
      });

    // Fill last 14 days
    const dailyData: Array<{ date: string; count: number }> = [];
    for (let d = 13; d >= 0; d--) {
      const date = new Date();
      date.setDate(date.getDate() - d);
      const dateStr = date.toISOString().split('T')[0]!;
      dailyData.push({ date: dateStr, count: dailyMap.get(dateStr) ?? 0 });
    }

    const estimatedTotalMinutes = items.reduce((s, i) => s + i.estimatedDuration, 0);
    const completedMinutes = items
      .filter((i) => i.status === 'completed')
      .reduce((s, i) => s + i.estimatedDuration, 0);

    return {
      total, completed, skipped, pending,
      completionRate: total > 0 ? Math.round((completed / total) * 100) : 0,
      dailyData, estimatedTotalMinutes, completedMinutes,
    };
  }

  // ── Generate feedback ──────────────────────────────────────────────────────
  async generateFeedback(userId: string, checklistId: string): Promise<ChecklistFeedbackEntity> {
    const checklist = await this.findOne(userId, checklistId);
    const items = checklist.items ?? [];

    const oneWeekAgo = new Date(); oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);
    const completedLastWeek = items.filter(
      (i) => i.status === 'completed' && i.completedAt && new Date(i.completedAt) >= oneWeekAgo,
    ).length;

    const prevWeek = new Date(); prevWeek.setDate(prevWeek.getDate() - 14);
    const completedPrevWeek = items.filter(
      (i) => i.status === 'completed' && i.completedAt &&
        new Date(i.completedAt) >= prevWeek && new Date(i.completedAt) < oneWeekAgo,
    ).length;

    const trend = completedPrevWeek === 0 ? 'first week'
      : completedLastWeek > completedPrevWeek ? `+${completedLastWeek - completedPrevWeek} more than last week`
      : completedLastWeek < completedPrevWeek ? `-${completedPrevWeek - completedLastWeek} fewer than last week`
      : 'same as last week';

    const upcomingTasks = items
      .filter((i) => i.status === 'pending')
      .slice(0, 3)
      .map((i) => i.description);

    const prompt = buildFeedbackPrompt({
      title: checklist.title, objective: checklist.objective,
      startDate: checklist.startDate, endDate: checklist.endDate,
      completedLastWeek, totalTasks: items.length, trend,
      upcomingTasks, language: checklist.language,
    });

    const { text } = await withRetry(
      () => generateText({ prompt, maxTokens: 400, temperature: 0.8 }),
      2, 1500,
    );

    const now = new Date();
    const weekNumber = Math.ceil(
      (now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000,
    );

    const feedback = this.feedbackRepo.create({
      checklistId, feedbackText: text.trim(), weekNumber, generatedAt: new Date(),
    });
    return this.feedbackRepo.save(feedback);
  }

  // ── Due reminders (for n8n) ────────────────────────────────────────────────
  async getDueReminders(): Promise<Array<{
    itemId: string; checklistTitle: string; description: string; hack: string;
    telegramChatId: string | undefined; checklistId: string;
  }>> {
    const now = new Date();
    const items = await this.itemRepo.find({
      where: {
        status: 'pending',
        reminderSent: false,
        dueDate: LessThanOrEqual(now),
      },
      relations: ['checklist'],
    });

    return items
      .filter((i) => i.checklist?.status === 'active')
      .map((i) => ({
        itemId: i.id,
        checklistId: i.checklistId,
        checklistTitle: i.checklist?.title ?? '',
        description: i.description,
        hack: i.hack,
        telegramChatId: i.checklist?.telegramChatId,
      }));
  }
}

// ── Types ────────────────────────────────────────────────────────────────────
export type Difficulty = 'low' | 'medium' | 'high';
export type TaskStyle = 'micro-habits' | 'concrete-tasks' | 'mixed';
export type ChecklistStatus = 'active' | 'paused' | 'completed';
export type TaskFrequency = 'once' | 'daily' | 'weekly' | 'custom';
export type TaskStatus = 'pending' | 'completed' | 'skipped';

export interface ReminderPreferences {
  time: string;
  days: string[];
  frequency: 'daily' | 'weekly' | 'custom';
}

export interface ChecklistParams {
  title: string;
  objective: string;
  category?: string;
  startDate: string;
  endDate: string;
  difficulty: Difficulty;
  dailyTimeAvailable: number;
  reminderPreferences?: ReminderPreferences;
  isRecurring?: boolean;
  recurrencePattern?: 'daily' | 'weekly' | 'monthly';
  goalMetric?: string;
  style: TaskStyle;
  telegramChatId?: string;
  language?: string;
}

export interface TaskDraft {
  id?: string;          // set after save
  order: number;
  description: string;
  frequency: TaskFrequency;
  customFrequencyDays?: number;
  estimatedDuration: number;
  hack: string;
  status?: TaskStatus;
  completedAt?: string;
  dueDate?: string;
}

export interface Checklist {
  id: string;
  title: string;
  objective: string;
  category?: string;
  startDate: string;
  endDate: string;
  difficulty: Difficulty;
  dailyTimeAvailable: number;
  style: TaskStyle;
  status: ChecklistStatus;
  language: string;
  telegramChatId?: string;
  items: TaskDraft[];
  feedbacks?: Array<{ id: string; feedbackText: string; generatedAt: string; weekNumber?: number }>;
  createdAt: string;
  updatedAt: string;
}

export interface ProgressData {
  total: number;
  completed: number;
  skipped: number;
  pending: number;
  completionRate: number;
  dailyData: Array<{ date: string; count: number }>;
  estimatedTotalMinutes: number;
  completedMinutes: number;
}

// ── API client ────────────────────────────────────────────────────────────────
function getHeaders(): Record<string, string> {
  const token = typeof window !== 'undefined' ? localStorage.getItem('ailab_at') : null;
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(path, { ...init, headers: { ...getHeaders(), ...((init?.headers as Record<string, string>) ?? {}) } });
  const data = await res.json() as T;
  if (!res.ok) {
    const err = (data as { message?: string }).message ?? 'Request failed';
    throw new Error(Array.isArray(err) ? (err as string[]).join(', ') : String(err));
  }
  return data;
}

export const checklistsApi = {
  generateDraft: (params: ChecklistParams) =>
    apiFetch<{ suggestedItems: TaskDraft[]; rationale?: string }>(
      '/api/checklists/generate-draft', { method: 'POST', body: JSON.stringify(params) }
    ),

  regenerateDraft: (params: ChecklistParams, feedback: string) =>
    apiFetch<{ suggestedItems: TaskDraft[]; rationale?: string }>(
      '/api/checklists/regenerate-draft', { method: 'POST', body: JSON.stringify({ parameters: params, feedback }) }
    ),

  confirm: (params: ChecklistParams, finalItems: TaskDraft[]) =>
    apiFetch<Checklist>(
      '/api/checklists/confirm', { method: 'POST', body: JSON.stringify({ parameters: params, finalItems }) }
    ),

  list: () => apiFetch<Checklist[]>('/api/checklists'),

  get: (id: string) => apiFetch<Checklist>(`/api/checklists/${id}`),

  patch: (id: string, data: { status?: ChecklistStatus; title?: string }) =>
    apiFetch<Checklist>(`/api/checklists/${id}`, { method: 'PATCH', body: JSON.stringify(data) }),

  delete: (id: string) =>
    fetch(`/api/checklists/${id}`, { method: 'DELETE', headers: getHeaders() }),

  patchItem: (checklistId: string, itemId: string, action: 'complete' | 'postpone' | 'skip', dueDate?: string) =>
    apiFetch<TaskDraft>(`/api/checklists/${checklistId}/items/${itemId}`, {
      method: 'PATCH', body: JSON.stringify({ action, dueDate })
    }),

  getProgress: (id: string) => apiFetch<ProgressData>(`/api/checklists/${id}/progress`),

  generateFeedback: (id: string) =>
    apiFetch<{ feedbackText: string; generatedAt: string }>(
      `/api/checklists/${id}/feedback`, { method: 'POST', body: '{}' }
    ),

  sendToTelegram: (id: string) =>
    apiFetch<{ sent: boolean; message: string }>(
      `/api/checklists/${id}/send-to-telegram`, { method: 'POST', body: '{}' }
    ),
};

// ── Helpers ──────────────────────────────────────────────────────────────────
export function totalDailyMinutes(items: TaskDraft[]): number {
  return items
    .filter((i) => i.frequency === 'daily')
    .reduce((s, i) => s + (i.estimatedDuration ?? 0), 0);
}

export const WEEKDAYS = ['monday','tuesday','wednesday','thursday','friday','saturday','sunday'] as const;

export function getWeekNumber(): number {
  const now = new Date();
  return Math.ceil((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 604800000);
}

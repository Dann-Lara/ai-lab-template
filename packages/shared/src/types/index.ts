// ─────────────────────────────────────────────────────────────────
// packages/shared/src/types/index.ts
// Shared TypeScript types across frontend and backend
// ─────────────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  message?: string;
  statusCode: number;
}

export interface ApiError {
  statusCode: number;
  message: string;
  error?: string;
  timestamp: string;
  path?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PaginationParams {
  page?: number;
  limit?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

// ── User types ───────────────────────────────────────────────────
export type UserRole = 'admin' | 'user' | 'guest';

export interface UserPublic {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  createdAt: string;
}

// ── AI types ─────────────────────────────────────────────────────
export interface AiGenerateRequest {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

export interface AiGenerateResponse {
  result: string;
  model: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
}

export interface AiChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt?: string;
}

// ── Webhook types ─────────────────────────────────────────────────
export interface N8nWebhookPayload {
  event: string;
  data: Record<string, unknown>;
  timestamp: string;
  source?: string;
}

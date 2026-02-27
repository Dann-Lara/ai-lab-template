export interface AiGenerateRequest {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
  model?: string;
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

export interface AiStreamChunk {
  content: string;
  done: boolean;
}

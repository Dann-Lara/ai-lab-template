export interface GenerateTextDto {
  prompt: string;
  systemMessage?: string;
  temperature?: number;
  maxTokens?: number;
}

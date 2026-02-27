export const PROMPTS = {
  WELCOME_EMAIL: `Generate a warm, professional welcome email for a new user named {userName} 
    who just joined {appName}. Keep it under 100 words. Be friendly and encouraging.`,

  CODE_REVIEW: `Review the following code and provide constructive feedback on:
    1. Code quality and best practices
    2. Potential bugs or edge cases
    3. Performance considerations
    
    Code:
    {code}`,

  CONTENT_SUMMARY: `Summarize the following content in {language} in {maxWords} words or less.
    Focus on the key points and main ideas.
    
    Content:
    {content}`,
} as const;

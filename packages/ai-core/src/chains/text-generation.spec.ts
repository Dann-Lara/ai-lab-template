import { generateText } from './text-generation';

// Mock LangChain modules
jest.mock('@langchain/openai', () => ({
  ChatOpenAI: jest.fn().mockImplementation(() => ({
    pipe: jest.fn().mockReturnThis(),
  })),
}));

jest.mock('@langchain/core/prompts', () => ({
  ChatPromptTemplate: {
    fromMessages: jest.fn().mockReturnValue({
      pipe: jest.fn().mockReturnValue({
        pipe: jest.fn().mockReturnValue({
          invoke: jest.fn().mockResolvedValue('Mocked AI response'),
        }),
      }),
    }),
  },
}));

jest.mock('@langchain/core/output_parsers', () => ({
  StringOutputParser: jest.fn(),
}));

describe('generateText', () => {
  beforeEach(() => {
    process.env['OPENAI_API_KEY'] = 'sk-test-key';
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should return generated text with default options', async () => {
    const result = await generateText({ prompt: 'Say hello' });
    expect(result.text).toBe('Mocked AI response');
    expect(result.model).toBe('gpt-4o-mini');
  });

  it('should use custom system message when provided', async () => {
    const result = await generateText({
      prompt: 'Hello',
      systemMessage: 'You are a pirate',
    });
    expect(result).toBeDefined();
    expect(result.text).toBeTruthy();
  });
});

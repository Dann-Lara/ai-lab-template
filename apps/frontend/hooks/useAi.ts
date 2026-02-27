import { useCallback, useState } from 'react';

import type { AiGenerateRequest, AiGenerateResponse } from '@ai-lab/shared';

interface UseAiState {
  result: string | null;
  loading: boolean;
  error: string | null;
}

interface UseAiReturn extends UseAiState {
  generate: (request: AiGenerateRequest) => Promise<void>;
  reset: () => void;
}

export function useAi(): UseAiReturn {
  const [state, setState] = useState<UseAiState>({
    result: null,
    loading: false,
    error: null,
  });

  const generate = useCallback(async (request: AiGenerateRequest): Promise<void> => {
    setState({ result: null, loading: true, error: null });
    try {
      const res = await fetch('/api/ai/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(request),
      });
      if (!res.ok) throw new Error(`Request failed: HTTP ${res.status}`);
      const data = await res.json() as AiGenerateResponse;
      setState({ result: data.result, loading: false, error: null });
    } catch (err) {
      setState({
        result: null,
        loading: false,
        error: err instanceof Error ? err.message : 'Unknown error',
      });
    }
  }, []);

  const reset = useCallback((): void => {
    setState({ result: null, loading: false, error: null });
  }, []);

  return { ...state, generate, reset };
}

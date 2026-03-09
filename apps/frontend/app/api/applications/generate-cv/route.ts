/**
 * POST /api/applications/generate-cv
 *
 * Forwards to the existing /v1/ai/generate backend endpoint (which handles
 * provider selection — Gemini first, then fallbacks).
 *
 * Expects body: { prompt: string, company: string, position: string, jobOffer: string }
 * Returns:      { atsScore: number, cvText: string }
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { prompt, company, position } = await req.json() as {
      prompt: string;
      company: string;
      position: string;
      jobOffer: string;
    };

    const token = req.headers.get('authorization');

    // Use the existing AI infrastructure — no direct provider calls from the browser
    const res = await fetch(`${BACKEND_URL}/v1/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        prompt,
        systemMessage: `Eres un experto en CVs ATS para ${company} — puesto: ${position}. 
Responde ÚNICAMENTE con JSON puro (sin markdown, sin explicaciones):
{"atsScore":<número 0-100>,"cvText":"<CV optimizado, secciones separadas por \\n\\n>"}`,
        maxTokens: 2048,
        temperature: 0.3,
      }),
    });

    if (!res.ok) {
      const err = await res.text();
      console.error('[generate-cv] backend error:', err);
      return NextResponse.json({ error: 'AI backend error' }, { status: res.status });
    }

    const data = await res.json() as { result: string; model: string };

    // The backend returns { result: string, model: string }
    // result should be the JSON string from the AI
    const clean = data.result.replace(/```json|```/g, '').trim();

    let parsed: { atsScore: number; cvText: string };
    try {
      parsed = JSON.parse(clean) as { atsScore: number; cvText: string };
    } catch {
      // If AI didn't return valid JSON, treat the whole result as cvText
      parsed = { atsScore: 70, cvText: data.result };
    }

    return NextResponse.json(parsed);
  } catch (err) {
    console.error('[generate-cv]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

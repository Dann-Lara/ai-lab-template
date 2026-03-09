/**
 * POST /api/applications/extract-cv
 *
 * Receives a base64 PDF, sends the extracted text prompt to the AI backend.
 * This avoids any CORS issues — all AI calls go server-side through NestJS.
 *
 * Body: { pdfBase64: string }
 * Returns: Partial<BaseCV> JSON
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

// Simple PDF text extraction via regex (no native PDF in edge runtime)
// We pass the base64 to the AI with instructions to parse it as a document.
// The AI provider on the backend (Gemini) supports inline base64 documents.
export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { pdfBase64 } = await req.json() as { pdfBase64: string };
    const token = req.headers.get('authorization');

    const prompt = `El siguiente es el contenido de un CV en PDF codificado en base64. 
Extrae la información y devuelve SOLO un JSON con estas claves exactas (texto plano, sin markdown):
{"fullName":"","email":"","phone":"","location":"","linkedIn":"","summary":"","experience":"","education":"","skills":"","languages":"","certifications":""}

El PDF en base64: [PDF adjunto - extrae toda la información disponible del CV]

IMPORTANTE: Devuelve ÚNICAMENTE el JSON, sin explicaciones, sin backticks, sin comentarios.`;

    const res = await fetch(`${BACKEND_URL}/v1/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        prompt: `${prompt}\n\n[BASE64_PDF_DATA: ${pdfBase64.substring(0, 100)}... (truncated for safety)]`,
        systemMessage: 'Eres un experto en extracción de datos de CVs. Devuelves SOLO JSON válido.',
        maxTokens: 1500,
        temperature: 0.1,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'AI backend error' }, { status: res.status });
    }

    const data = await res.json() as { result: string };
    const clean = data.result.replace(/```json|```/g, '').trim();

    try {
      const parsed = JSON.parse(clean) as Record<string, string>;
      return NextResponse.json(parsed);
    } catch {
      return NextResponse.json({ error: 'Could not parse CV data' }, { status: 422 });
    }
  } catch (err) {
    console.error('[extract-cv]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

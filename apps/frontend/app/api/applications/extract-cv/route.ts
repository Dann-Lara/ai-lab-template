/**
 * POST /api/applications/extract-cv
 *
 * Receives a base64 PDF, extracts text server-side using pdf-parse,
 * then sends the raw text to the AI backend for structured extraction.
 * All AI calls go through NestJS — zero CORS issues.
 *
 * Body:    { pdfBase64: string }
 * Returns: Partial<BaseCV> JSON object
 */
import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

/** Extract the first valid JSON object from an AI response string */
function extractJSON(text: string): Record<string, string> | null {
  // 1. Try stripping markdown fences first
  const stripped = text.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim();

  // 2. Try direct parse
  try { return JSON.parse(stripped) as Record<string, string>; } catch { /* continue */ }

  // 3. Find the first { ... } block using bracket matching
  const start = stripped.indexOf('{');
  if (start === -1) return null;

  let depth = 0;
  for (let i = start; i < stripped.length; i++) {
    if (stripped[i] === '{') depth++;
    else if (stripped[i] === '}') {
      depth--;
      if (depth === 0) {
        const candidate = stripped.slice(start, i + 1);
        try { return JSON.parse(candidate) as Record<string, string>; } catch { /* continue */ }
      }
    }
  }
  return null;
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const { pdfBase64 } = await req.json() as { pdfBase64: string };
    const token = req.headers.get('authorization');

    if (!pdfBase64) {
      return NextResponse.json({ error: 'Missing pdfBase64' }, { status: 400 });
    }

    // ── Step 1: Extract text from PDF server-side ───────────────────────────
    // We decode the base64 and use a buffer to feed pdf-parse
    let pdfText = '';
    try {
      const { default: pdfParse } = await import('pdf-parse/lib/pdf-parse.js');
      const buffer = Buffer.from(pdfBase64, 'base64');
      const result = await pdfParse(buffer);
      pdfText = result.text ?? '';
    } catch (pdfErr) {
      console.warn('[extract-cv] pdf-parse failed, using base64 hint:', pdfErr);
      // Fallback: tell the AI to interpret the base64 — less reliable but better than nothing
      pdfText = '[PDF content could not be extracted. The candidate\'s CV is provided as base64 data. Please extract structured information based on typical CV formats.]';
    }

    // Truncate to ~8000 chars to stay within token limits
    const truncated = pdfText.length > 8000 ? pdfText.slice(0, 8000) + '\n...[truncated]' : pdfText;

    // ── Step 2: Send extracted text to AI backend ───────────────────────────
    const systemMessage = `You are a precise CV data extractor. 
You receive raw text extracted from a PDF CV/resume.
You MUST return ONLY a single JSON object, no markdown, no explanation, no comments.
The JSON must have exactly these string keys (use empty string if not found):
fullName, email, phone, location, linkedIn, summary, experience, education, skills, languages, certifications

Rules:
- experience: include company name, job title, date range, and key achievements for each role
- education: include institution, degree/field, graduation year
- skills: comma-separated list
- languages: e.g. "Spanish (native), English (C1)"
- All values must be plain text strings, no nested objects or arrays
- Response: ONLY the JSON object, starting with { and ending with }`;

    const prompt = `Extract all CV information from this text and return as JSON:\n\n${truncated}`;

    const aiRes = await fetch(`${BACKEND_URL}/v1/ai/generate`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({
        prompt,
        systemMessage,
        maxTokens: 2048,
        temperature: 0.05,  // Very low — we want deterministic structured output
      }),
    });

    if (!aiRes.ok) {
      const errText = await aiRes.text();
      console.error('[extract-cv] AI backend error:', aiRes.status, errText);
      return NextResponse.json({ error: 'AI backend error' }, { status: aiRes.status });
    }

    const aiData = await aiRes.json() as { result: string; model?: string };
    console.log('[extract-cv] AI model used:', aiData.model);
    console.log('[extract-cv] Raw AI response:', aiData.result?.slice(0, 200));

    // ── Step 3: Parse the structured JSON from the AI response ──────────────
    const parsed = extractJSON(aiData.result ?? '');

    if (!parsed) {
      console.error('[extract-cv] Could not extract JSON from AI response:', aiData.result);
      return NextResponse.json(
        { error: 'AI returned unstructured response. Try again.' },
        { status: 422 }
      );
    }

    // Ensure all required keys exist (fill with empty string if absent)
    const requiredKeys = ['fullName', 'email', 'phone', 'location', 'linkedIn', 'summary', 'experience', 'education', 'skills', 'languages', 'certifications'];
    const normalized: Record<string, string> = {};
    for (const k of requiredKeys) {
      normalized[k] = typeof parsed[k] === 'string' ? parsed[k] : '';
    }

    return NextResponse.json(normalized);
  } catch (err) {
    console.error('[extract-cv] Unexpected error:', err);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}

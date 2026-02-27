import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const body = await request.json() as unknown;

    const res = await fetch(`${BACKEND_URL}/v1/ai/generate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Failed to connect to backend' }, { status: 502 });
  }
}

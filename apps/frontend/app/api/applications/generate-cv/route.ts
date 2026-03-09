import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    const { prompt, company, position } = await req.json() as {
      prompt: string;
      company: string;
      position: string;
      jobOffer: string;
    };

    // Forward to backend (NestJS) which holds the actual API key
    const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
    const token = req.headers.get('authorization');

    const res = await fetch(`${backendUrl}/ai/generate-cv`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: token } : {}),
      },
      body: JSON.stringify({ prompt, company, position }),
    });

    if (!res.ok) {
      return NextResponse.json({ error: 'Backend error' }, { status: res.status });
    }

    const data = await res.json() as { atsScore: number; cvText: string };
    return NextResponse.json(data);
  } catch (err) {
    console.error('[generate-cv]', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}

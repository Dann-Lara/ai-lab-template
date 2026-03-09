import { type NextRequest, NextResponse } from 'next/server';

const BACKEND_URL = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get('authorization');
  return {
    'Content-Type': 'application/json',
    ...(token ? { Authorization: token } : {}),
  };
}

export async function GET(req: NextRequest) {
  try {
    const res = await fetch(`${BACKEND_URL}/v1/applications`, { headers: authHeader(req) });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json([], { status: 200 }); // graceful: return empty list if backend not ready
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json() as unknown;
    const res = await fetch(`${BACKEND_URL}/v1/applications`, {
      method: 'POST',
      headers: authHeader(req),
      body: JSON.stringify(body),
    });
    const data = await res.json() as unknown;
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

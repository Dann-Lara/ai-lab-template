import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

function authHeader(req: NextRequest): Record<string, string> {
  const token = req.headers.get('authorization');
  return token ? { Authorization: token, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
}

export async function GET(req: NextRequest) {
  const res = await fetch(`${backendUrl}/applications`, { headers: authHeader(req) });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const res = await fetch(`${backendUrl}/applications`, {
    method: 'POST',
    headers: authHeader(req),
    body: JSON.stringify(body),
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

import { NextRequest, NextResponse } from 'next/server';
const BACKEND = process.env.BACKEND_URL ?? 'http://localhost:3001';

export async function POST(req: NextRequest) {
  const auth = req.headers.get('authorization') ?? '';
  const body = await req.text();
  const res = await fetch(`${BACKEND}/v1/applications/base-cv/evaluate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json', Authorization: auth },
    body,
  });
  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

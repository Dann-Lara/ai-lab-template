import { NextRequest, NextResponse } from 'next/server';

const backendUrl = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

export async function PATCH(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  const token = req.headers.get('authorization');
  const body = await req.json();

  const res = await fetch(`${backendUrl}/users/${params.id}/permissions`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: token } : {}),
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data, { status: res.status });
}

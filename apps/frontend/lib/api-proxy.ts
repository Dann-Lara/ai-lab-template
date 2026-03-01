import { type NextRequest, NextResponse } from 'next/server';

const BACKEND = process.env['BACKEND_URL'] ?? 'http://localhost:3001';

/** Forward a request to the NestJS backend, passing the Authorization header */
export async function proxyToBackend(
  request: NextRequest,
  backendPath: string,
  method = request.method,
  body?: unknown,
): Promise<NextResponse> {
  const auth = request.headers.get('authorization') ?? '';
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(auth ? { Authorization: auth } : {}),
  };

  let resolvedBody: string | undefined;
  if (method !== 'GET' && method !== 'DELETE') {
    if (body !== undefined) {
      resolvedBody = JSON.stringify(body);
    } else {
      try { resolvedBody = JSON.stringify(await request.json()); }
      catch { resolvedBody = undefined; }
    }
  }

  try {
    const res = await fetch(`${BACKEND}${backendPath}`, {
      method,
      headers,
      body: resolvedBody,
    });
    const data = await res.json().catch(() => ({}));
    return NextResponse.json(data, { status: res.status });
  } catch {
    return NextResponse.json({ error: 'Backend unavailable' }, { status: 502 });
  }
}

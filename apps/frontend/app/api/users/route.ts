import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../lib/api-proxy';
export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/v1/users', 'GET');
}
export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/v1/auth/users', 'POST');
}

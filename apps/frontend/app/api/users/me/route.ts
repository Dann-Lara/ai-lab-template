import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../lib/api-proxy';
export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/v1/users/me', 'GET');
}
export async function PATCH(req: NextRequest) {
  return proxyToBackend(req, '/v1/users/me', 'PATCH');
}

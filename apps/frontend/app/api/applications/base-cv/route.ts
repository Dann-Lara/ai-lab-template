import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../lib/api-proxy';

export async function GET(req: NextRequest) {
  return proxyToBackend(req, '/v1/applications/base-cv', 'GET');
}

export async function PUT(req: NextRequest) {
  return proxyToBackend(req, '/v1/applications/base-cv', 'PUT');
}

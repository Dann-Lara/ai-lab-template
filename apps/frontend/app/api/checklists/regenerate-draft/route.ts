import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../lib/api-proxy';
export async function POST(req: NextRequest) {
  return proxyToBackend(req, '/v1/checklists/regenerate-draft', 'POST');
}

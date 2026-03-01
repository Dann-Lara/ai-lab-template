import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../lib/api-proxy';
type Ctx = { params: { id: string } };
export async function GET(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, `/v1/users/${params.id}`, 'GET');
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  // route body has { action: 'toggle' | 'active', isActive: bool }
  return proxyToBackend(req, `/v1/users/${params.id}/active`, 'PATCH');
}

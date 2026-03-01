import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../lib/api-proxy';
type Ctx = { params: { id: string } };
export async function GET(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, `/v1/checklists/${params.id}`, 'GET');
}
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, `/v1/checklists/${params.id}`, 'PATCH');
}
export async function DELETE(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, `/v1/checklists/${params.id}`, 'DELETE');
}

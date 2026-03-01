import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../../../lib/api-proxy';
type Ctx = { params: { id: string; itemId: string } };
export async function PATCH(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, `/v1/checklists/${params.id}/items/${params.itemId}`, 'PATCH');
}

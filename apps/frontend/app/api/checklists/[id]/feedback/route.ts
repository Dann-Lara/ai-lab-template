import { type NextRequest } from 'next/server';
import { proxyToBackend } from '../../../../../lib/api-proxy';
type Ctx = { params: { id: string } };
export async function POST(req: NextRequest, { params }: Ctx) {
  return proxyToBackend(req, `/v1/checklists/${params.id}/feedback`, 'POST');
}

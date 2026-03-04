import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getManifiestosBasuron, createManifiestoBasuron } from '@/lib/services/manifiesto_basuron';

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await getManifiestosBasuron();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const contentType = req.headers.get('content-type') || '';
  let body: any;
  let archivo: File | null = null;
  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    body = JSON.parse(form.get('manifiesto') as string);
    archivo = form.get('archivo') as File | null;
  } else {
    body = await req.json();
  }
  const data = await createManifiestoBasuron(body, archivo ?? undefined);
  return NextResponse.json(data);
}

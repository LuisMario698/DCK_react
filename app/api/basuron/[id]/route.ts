import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getManifiestoBasuronById, updateManifiestoBasuron, deleteManifiestoBasuron, completarManifiestoBasuron } from '@/lib/services/manifiesto_basuron';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const data = await getManifiestoBasuronById(Number(id));
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  if (body._action === 'completar') {
    const data = await completarManifiestoBasuron(Number(id), body.pesoSalida, body.horaSalida, body.observaciones, body.pdfUrl);
    return NextResponse.json(data);
  }
  const data = await updateManifiestoBasuron(Number(id), body);
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await deleteManifiestoBasuron(Number(id));
  return NextResponse.json({ ok: true });
}

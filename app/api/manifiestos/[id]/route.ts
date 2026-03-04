import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getManifiestoById, updateManifiesto, deleteManifiesto } from '@/lib/services/manifiestos';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const data = await getManifiestoById(Number(id));
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data = await updateManifiesto(Number(id), body.manifiesto, body.residuos);
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await deleteManifiesto(Number(id));
  return NextResponse.json({ ok: true });
}

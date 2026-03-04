import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { updateTipoPersona, deleteTipoPersona } from '@/lib/services/tipos_persona';

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data = await updateTipoPersona(Number(id), body);
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await deleteTipoPersona(Number(id));
  return NextResponse.json({ ok: true });
}

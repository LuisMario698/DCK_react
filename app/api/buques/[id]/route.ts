import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBuqueById, updateBuque, deleteBuque } from '@/lib/services/buques';

export async function GET(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const data = await getBuqueById(Number(id));
  return NextResponse.json(data);
}

export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const data = await updateBuque(Number(id), body);
  return NextResponse.json(data);
}

export async function DELETE(_: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { id } = await params;
  await deleteBuque(Number(id));
  return NextResponse.json({ ok: true });
}

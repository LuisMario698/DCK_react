import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getOrCreateTipoPersona } from '@/lib/services/personas';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { nombre } = await req.json();
  const data = await getOrCreateTipoPersona(nombre);
  return NextResponse.json(data);
}

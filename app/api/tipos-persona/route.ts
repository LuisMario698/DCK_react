import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getTiposPersona, createTipoPersona } from '@/lib/services/tipos_persona';

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await getTiposPersona();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const data = await createTipoPersona(body);
  return NextResponse.json(data);
}

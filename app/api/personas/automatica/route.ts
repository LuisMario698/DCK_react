import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createPersonaAutomatica } from '@/lib/services/personas';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { nombre, tipo_persona_id } = await req.json();
  const data = await createPersonaAutomatica(nombre, tipo_persona_id ?? undefined);
  return NextResponse.json(data);
}

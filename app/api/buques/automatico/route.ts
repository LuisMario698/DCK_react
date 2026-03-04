import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { createBuqueAutomatico } from '@/lib/services/buques';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const { nombre } = await req.json();
  const data = await createBuqueAutomatico(nombre);
  return NextResponse.json(data);
}

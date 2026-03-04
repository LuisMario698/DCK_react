import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { generarNumeroManifiesto } from '@/lib/services/manifiestos';

export async function GET(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const fecha = req.nextUrl.searchParams.get('fecha') ?? new Date().toISOString().split('T')[0];
  const numero = await generarNumeroManifiesto(fecha);
  return NextResponse.json({ numero });
}

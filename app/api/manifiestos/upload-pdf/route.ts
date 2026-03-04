import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { uploadManifiestoPDF } from '@/lib/services/storage';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const form = await req.formData();
  const file = form.get('file') as File;
  const numero = form.get('numero') as string;
  if (!file || !numero) return NextResponse.json({ error: 'Missing file or numero' }, { status: 400 });
  const url = await uploadManifiestoPDF(file, numero);
  return NextResponse.json({ url });
}

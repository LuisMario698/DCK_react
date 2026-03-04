import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getManifiestos, createManifiesto } from '@/lib/services/manifiestos';

export async function GET() {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const data = await getManifiestos();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const contentType = req.headers.get('content-type') || '';
  let manifiesto: any;
  let residuos: any;
  let archivo: File | null = null;
  let pdfFile: File | null = null;

  let numeroPredefinido: string | undefined;

  if (contentType.includes('multipart/form-data')) {
    const form = await req.formData();
    manifiesto = JSON.parse(form.get('manifiesto') as string);
    const residuosRaw = form.get('residuos');
    residuos = residuosRaw ? JSON.parse(residuosRaw as string) : undefined;
    numeroPredefinido = form.get('numeroPredefinido') as string | undefined;
    archivo = form.get('archivo') as File | null;
    pdfFile = form.get('pdfFile') as File | null;
  } else {
    const body = await req.json();
    manifiesto = body.manifiesto;
    residuos = body.residuos;
    numeroPredefinido = body.numeroPredefinido;
  }

  const data = await createManifiesto(manifiesto, residuos, archivo, pdfFile, numeroPredefinido);
  return NextResponse.json(data);
}

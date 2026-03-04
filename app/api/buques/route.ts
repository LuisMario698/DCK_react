import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getBuques, createBuque, searchBuques } from '@/lib/services/buques';

export async function GET(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const search = req.nextUrl.searchParams.get('search');
  const data = search ? await searchBuques(search) : await getBuques();
  return NextResponse.json(data);
}

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  const body = await req.json();
  const data = await createBuque(body);
  return NextResponse.json(data);
}

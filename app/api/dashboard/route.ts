import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/auth';
import { getDashboardKPIsFiltered, getComparacionPeriodoAnterior, getReporteComplejo } from '@/lib/services/dashboard_stats';
import { ReportFilters, FiltrosDashboard } from '@/types/dashboard';

export async function POST(req: NextRequest) {
  if (!await getSession()) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const { type, filtros, filters } = body;

  if (type === 'kpis') {
    const data = await getDashboardKPIsFiltered(filtros as FiltrosDashboard);
    return NextResponse.json(data);
  }

  if (type === 'comparacion') {
    const data = await getComparacionPeriodoAnterior(filtros as FiltrosDashboard);
    return NextResponse.json(data);
  }

  if (type === 'reporte') {
    const data = await getReporteComplejo(filters as ReportFilters);
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Unknown type' }, { status: 400 });
}

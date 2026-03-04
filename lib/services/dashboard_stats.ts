import { prisma } from '@/lib/prisma';
import {
  DashboardKPIs,
  DashboardStats,
  ReportFilters,
  ReporteDetalladoItem,
  ResiduosPorMes,
  ResiduosPorBuque,
  ChartDataPoint,
  Comparaciones,
  PeriodoFiltro,
  FiltrosDashboard,
} from '@/types/dashboard';

export type { PeriodoFiltro, FiltrosDashboard };

export function calcularRangoFechas(
  periodo: PeriodoFiltro,
  fechaInicio?: string,
  fechaFin?: string
): { inicio: string; fin: string } {
  const ahora = new Date();
  const fin = ahora.toISOString().split('T')[0];
  let inicio: string;

  switch (periodo) {
    case 'semana': {
      const d = new Date(ahora);
      d.setDate(d.getDate() - 7);
      inicio = d.toISOString().split('T')[0];
      break;
    }
    case 'mes': {
      const d = new Date(ahora);
      d.setMonth(d.getMonth() - 1);
      inicio = d.toISOString().split('T')[0];
      break;
    }
    case 'trimestre': {
      const d = new Date(ahora);
      d.setMonth(d.getMonth() - 3);
      inicio = d.toISOString().split('T')[0];
      break;
    }
    case 'anio': {
      const d = new Date(ahora);
      d.setFullYear(d.getFullYear() - 1);
      inicio = d.toISOString().split('T')[0];
      break;
    }
    case 'personalizado':
      return { inicio: fechaInicio || fin, fin: fechaFin || fin };
    case 'todo':
    default:
      inicio = '2020-01-01';
      break;
  }

  return { inicio, fin };
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const [totalManifiestos, manifiestosPendientes, totalBuques, buquesActivos, residuosAgg] = await Promise.all([
    prisma.manifiestos.count(),
    prisma.manifiestos.count({ where: { estado_digitalizacion: 'pendiente' } }),
    prisma.buques.count(),
    prisma.buques.count({ where: { estado: 'Activo' } }),
    prisma.manifiestos_residuos.aggregate({
      _sum: { aceite_usado: true, basura: true },
    }),
  ]);

  const totalAceiteUsado = Number(residuosAgg._sum.aceite_usado ?? 0);
  const totalBasuraGeneral = Number(residuosAgg._sum.basura ?? 0);

  return {
    totalManifiestos,
    manifiestosPendientes,
    totalBuques,
    buquesActivos,
    totalResiduosReciclados: totalAceiteUsado + totalBasuraGeneral,
    totalBasuraGeneral,
    totalAceiteUsado,
  };
}

export async function getDashboardKPIsFiltered(
  filtros: FiltrosDashboard
): Promise<DashboardKPIs & {
  totalBasuron: number;
  entregasBasuron: number;
  filtrosAceite: number;
  filtrosDiesel: number;
  filtrosAire: number;
}> {
  const { inicio, fin } = calcularRangoFechas(filtros.periodo, filtros.fechaInicio, filtros.fechaFin);
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin + 'T23:59:59.999Z');

  const [
    totalManifiestos,
    manifiestosPendientes,
    totalBuques,
    buquesActivos,
    residuosAgg,
    basuronAgg,
    entregasBasuron,
  ] = await Promise.all([
    prisma.manifiestos.count({ where: { fecha_emision: { gte: fechaInicio, lte: fechaFin } } }),
    prisma.manifiestos.count({ where: { fecha_emision: { gte: fechaInicio, lte: fechaFin }, estado_digitalizacion: 'pendiente' } }),
    prisma.buques.count(),
    prisma.buques.count({ where: { estado: 'Activo' } }),
    prisma.manifiestos_residuos.aggregate({
      where: { manifiesto: { fecha_emision: { gte: fechaInicio, lte: fechaFin } } },
      _sum: { aceite_usado: true, basura: true, filtros_aceite: true, filtros_diesel: true, filtros_aire: true },
    }),
    prisma.manifiesto_basuron.aggregate({
      where: { fecha: { gte: fechaInicio, lte: fechaFin } },
      _sum: { total_depositado: true },
    }),
    prisma.manifiesto_basuron.count({ where: { fecha: { gte: fechaInicio, lte: fechaFin } } }),
  ]);

  const totalAceiteUsado = Number(residuosAgg._sum.aceite_usado ?? 0);
  const totalBasuraGeneral = Number(residuosAgg._sum.basura ?? 0);
  const totalBasuron = Number(basuronAgg._sum.total_depositado ?? 0);

  return {
    totalManifiestos,
    manifiestosPendientes,
    totalBuques,
    buquesActivos,
    totalResiduosReciclados: totalAceiteUsado + totalBasuraGeneral + totalBasuron,
    totalBasuraGeneral,
    totalAceiteUsado,
    totalBasuron,
    entregasBasuron,
    filtrosAceite: Number(residuosAgg._sum.filtros_aceite ?? 0),
    filtrosDiesel: Number(residuosAgg._sum.filtros_diesel ?? 0),
    filtrosAire: Number(residuosAgg._sum.filtros_aire ?? 0),
  };
}

export async function getComparacionPeriodoAnterior(filtros: FiltrosDashboard): Promise<Comparaciones> {
  const { inicio, fin } = calcularRangoFechas(filtros.periodo, filtros.fechaInicio, filtros.fechaFin);
  const fechaInicio = new Date(inicio);
  const fechaFin = new Date(fin);
  const duracionMs = fechaFin.getTime() - fechaInicio.getTime();
  const finAnterior = new Date(fechaInicio.getTime() - 1);
  const inicioAnterior = new Date(finAnterior.getTime() - duracionMs);

  const [manifestosAnterior, residuosAnt, basuronAnt] = await Promise.all([
    prisma.manifiestos.count({
      where: { fecha_emision: { gte: inicioAnterior, lte: finAnterior } },
    }),
    prisma.manifiestos_residuos.aggregate({
      where: { manifiesto: { fecha_emision: { gte: inicioAnterior, lte: finAnterior } } },
      _sum: { aceite_usado: true, basura: true },
    }),
    prisma.manifiesto_basuron.aggregate({
      where: { fecha: { gte: inicioAnterior, lte: finAnterior } },
      _sum: { total_depositado: true },
    }),
  ]);

  const aceiteAnterior = Number(residuosAnt._sum.aceite_usado ?? 0);
  const basuraAnterior = Number(residuosAnt._sum.basura ?? 0);
  const basuronAnteriorVal = Number(basuronAnt._sum.total_depositado ?? 0);

  return {
    manifestosAnterior,
    aceiteAnterior,
    basuraAnterior,
    basuronAnterior: basuronAnteriorVal,
    totalAnterior: aceiteAnterior + basuraAnterior + basuronAnteriorVal,
  };
}

export async function getDashboardStats(_filters?: ReportFilters): Promise<DashboardStats> {
  const kpis = await getDashboardKPIs();

  // Monthly residuos for last 6 months
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

  const residuosMensuales = await prisma.manifiestos_residuos.findMany({
    where: { manifiesto: { fecha_emision: { gte: sixMonthsAgo } } },
    include: { manifiesto: { select: { fecha_emision: true } } },
  });

  const monthMap: Record<string, { aceite: number; basura: number; filtros: number }> = {};
  for (const r of residuosMensuales) {
    const mes = r.manifiesto.fecha_emision.toISOString().slice(0, 7);
    if (!monthMap[mes]) monthMap[mes] = { aceite: 0, basura: 0, filtros: 0 };
    monthMap[mes].aceite += Number(r.aceite_usado ?? 0);
    monthMap[mes].basura += Number(r.basura ?? 0);
    monthMap[mes].filtros += Number(r.filtros_aceite ?? 0) + Number(r.filtros_diesel ?? 0) + Number(r.filtros_aire ?? 0);
  }

  const residuosPorMes: ResiduosPorMes[] = Object.entries(monthMap)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([mes, vals]) => ({ mes, ...vals, otros: 0 }));

  // Top 5 buques by waste
  const topBuquesRaw = await prisma.manifiestos_residuos.groupBy({
    by: ['manifiesto_id'],
    _sum: { aceite_usado: true, basura: true },
  });

  // Get manifiesto → buque mapping for top
  const manifiestoIds = topBuquesRaw.map((r) => r.manifiesto_id);
  const manifiestos = await prisma.manifiestos.findMany({
    where: { id: { in: manifiestoIds } },
    include: { buque: { select: { id: true, nombre_buque: true } } },
  });

  const buqueMap: Record<number, { nombre: string; total: number; count: number }> = {};
  for (const r of topBuquesRaw) {
    const m = manifiestos.find((m) => m.id === r.manifiesto_id);
    if (!m?.buque) continue;
    const bid = m.buque.id;
    if (!buqueMap[bid]) buqueMap[bid] = { nombre: m.buque.nombre_buque, total: 0, count: 0 };
    buqueMap[bid].total += Number(r._sum.aceite_usado ?? 0) + Number(r._sum.basura ?? 0);
    buqueMap[bid].count += 1;
  }

  const topBuques: ResiduosPorBuque[] = Object.entries(buqueMap)
    .sort(([, a], [, b]) => b.total - a.total)
    .slice(0, 5)
    .map(([id, v]) => ({
      buqueId: Number(id),
      nombreBuque: v.nombre,
      totalKg: v.total,
      cantidadManifiestos: v.count,
    }));

  const distribucionTipos: ChartDataPoint[] = [
    { label: 'Aceite Usado', value: kpis.totalAceiteUsado, color: '#F59E0B' },
    { label: 'Basura General', value: kpis.totalBasuraGeneral, color: '#EF4444' },
  ];

  return { kpis, residuosPorMes, topBuques, distribucionTipos };
}

export async function getReporteComplejo(filters: ReportFilters): Promise<ReporteDetalladoItem[]> {
  const where: any = {};
  if (filters.fechaInicio) where.fecha_emision = { ...(where.fecha_emision ?? {}), gte: new Date(filters.fechaInicio + 'T00:00:00') };
  if (filters.fechaFin) where.fecha_emision = { ...(where.fecha_emision ?? {}), lte: new Date(filters.fechaFin + 'T23:59:59.999') };
  if (filters.buqueId) where.buque_id = filters.buqueId;
  if (filters.estado) where.estado_digitalizacion = filters.estado;

  const manifiestos = await prisma.manifiestos.findMany({
    where,
    include: {
      buque: { select: { nombre_buque: true } },
      responsable_principal: { select: { nombre: true } },
      residuos: true,
    },
    orderBy: { fecha_emision: 'desc' },
  });

  return manifiestos.map((m) => ({
    fecha: m.fecha_emision instanceof Date ? m.fecha_emision.toISOString().split('T')[0] : String(m.fecha_emision),
    folio: m.numero_manifiesto,
    buque: m.buque?.nombre_buque ?? 'Sin buque',
    tipoResiduo: m.residuos ? 'Residuos mixtos' : 'Sin residuos',
    cantidad: m.residuos
      ? Number(m.residuos.aceite_usado ?? 0) + Number(m.residuos.basura ?? 0)
      : 0,
    unidad: 'kg/L',
    estado: m.estado_digitalizacion,
    responsable: m.responsable_principal?.nombre ?? 'No asignado',
  }));
}

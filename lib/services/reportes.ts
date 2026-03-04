import { prisma } from '@/lib/prisma';

export interface ReporteFechas {
  fecha: string;
  total_aceite: number;
  total_basura: number;
  total_filtros_diesel: number;
  cantidad_manifiestos: number;
}

export async function getReporteResiduosPorFechas(fechaInicio: string, fechaFin: string): Promise<ReporteFechas[]> {
  const data = await prisma.manifiestos.findMany({
    where: {
      fecha_emision: {
        gte: new Date(fechaInicio),
        lte: new Date(fechaFin + 'T23:59:59.999'),
      },
    },
    include: { residuos: true },
    orderBy: { fecha_emision: 'asc' },
  });

  const reporte: Record<string, ReporteFechas> = {};

  for (const m of data) {
    const fecha = m.fecha_emision instanceof Date
      ? m.fecha_emision.toISOString().split('T')[0]
      : String(m.fecha_emision).split('T')[0];

    if (!reporte[fecha]) {
      reporte[fecha] = { fecha, total_aceite: 0, total_basura: 0, total_filtros_diesel: 0, cantidad_manifiestos: 0 };
    }

    if (m.residuos) {
      reporte[fecha].total_aceite += Number(m.residuos.aceite_usado ?? 0);
      reporte[fecha].total_basura += Number(m.residuos.basura ?? 0);
      reporte[fecha].total_filtros_diesel += Number(m.residuos.filtros_diesel ?? 0);
    }
    reporte[fecha].cantidad_manifiestos += 1;
  }

  return Object.values(reporte);
}

export async function getTotalesGenerales() {
  const agg = await prisma.manifiestos_residuos.aggregate({
    _sum: { aceite_usado: true, basura: true, filtros_diesel: true },
  });

  return {
    aceite: Number(agg._sum.aceite_usado ?? 0),
    basura: Number(agg._sum.basura ?? 0),
    diesel: Number(agg._sum.filtros_diesel ?? 0),
  };
}

export async function saveFirmaDigital(_manifiestoId: number, _firmaBase64: string) {
  return { success: true, message: 'Firma recibida (campo no implementado en DB)' };
}

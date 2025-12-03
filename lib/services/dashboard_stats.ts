import { createClient } from '@/lib/supabase/client';
import {
    DashboardKPIs,
    DashboardStats,
    ReportFilters,
    ReporteDetalladoItem,
    ResiduosPorMes,
    ResiduosPorBuque,
    ChartDataPoint
} from '@/types/dashboard';

/**
 * Obtiene los KPIs principales para el dashboard
 */
export async function getDashboardKPIs(): Promise<DashboardKPIs> {
    const supabase = createClient();

    // Consultas paralelas para optimizar tiempo
    const [
        { count: totalManifiestos },
        { count: manifiestosPendientes },
        { count: totalBuques },
        { count: buquesActivos },
        { data: residuosData }
    ] = await Promise.all([
        supabase.from('manifiestos').select('*', { count: 'exact', head: true }),
        supabase.from('manifiestos').select('*', { count: 'exact', head: true }).eq('estado_digitalizacion', 'pendiente'),
        supabase.from('buques').select('*', { count: 'exact', head: true }),
        supabase.from('buques').select('*', { count: 'exact', head: true }).eq('estado', 'Activo'),
        supabase.from('manifiestos_residuos').select('aceite_usado, basura')
    ]);

    // Calcular totales de residuos
    let totalAceite = 0;
    let totalBasura = 0;

    if (residuosData) {
        residuosData.forEach(r => {
            totalAceite += Number(r.aceite_usado || 0);
            totalBasura += Number(r.basura || 0);
        });
    }

    return {
        totalManifiestos: totalManifiestos || 0,
        manifiestosPendientes: manifiestosPendientes || 0,
        totalBuques: totalBuques || 0,
        buquesActivos: buquesActivos || 0,
        totalResiduosReciclados: totalAceite + totalBasura, // Simplificación para demo
        totalBasuraGeneral: totalBasura,
        totalAceiteUsado: totalAceite
    };
}

/**
 * Obtiene estadísticas completas para gráficas
 */
export async function getDashboardStats(filters?: ReportFilters): Promise<DashboardStats> {
    const kpis = await getDashboardKPIs();
    const supabase = createClient();

    // 1. Obtener residuos por mes (últimos 6 meses)
    // Nota: Idealmente usar una función RPC en Postgres para agregaciones complejas por fecha
    // Aquí simulamos la agregación en cliente por limitaciones de acceso a crear funciones
    const { data: residuosCronologicos } = await supabase
        .from('manifiestos')
        .select(`
      fecha_emision,
      residuos:manifiestos_residuos(aceite_usado, basura, filtros_diesel)
    `)
        .order('fecha_emision', { ascending: true })
        .limit(100); // Limitamos para no traer todo el historial en esta demo

    const residuosPorMesMap = new Map<string, ResiduosPorMes>();

    residuosCronologicos?.forEach(m => {
        const fecha = new Date(m.fecha_emision);
        const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;

        if (!residuosPorMesMap.has(key)) {
            residuosPorMesMap.set(key, { mes: key, aceite: 0, basura: 0, filtros: 0, otros: 0 });
        }

        const entry = residuosPorMesMap.get(key)!;
        // @ts-ignore - Supabase types inference limitation
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;

        if (r) {
            entry.aceite += Number(r.aceite_usado || 0);
            entry.basura += Number(r.basura || 0);
            entry.filtros += Number(r.filtros_diesel || 0);
        }
    });

    const residuosPorMes = Array.from(residuosPorMesMap.values())
        .sort((a, b) => a.mes.localeCompare(b.mes));

    // 2. Top Buques
    const { data: topBuquesData } = await supabase
        .from('manifiestos')
        .select(`
      buque:buques(id, nombre_buque),
      residuos:manifiestos_residuos(aceite_usado, basura)
    `);

    const buquesMap = new Map<string, ResiduosPorBuque>();

    topBuquesData?.forEach(m => {
        // @ts-ignore
        const buque = Array.isArray(m.buque) ? m.buque[0] : m.buque;
        if (!buque) return;

        if (!buquesMap.has(buque.nombre_buque)) {
            buquesMap.set(buque.nombre_buque, {
                buqueId: buque.id,
                nombreBuque: buque.nombre_buque,
                totalKg: 0,
                cantidadManifiestos: 0
            });
        }

        const entry = buquesMap.get(buque.nombre_buque)!;
        // @ts-ignore
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;

        if (r) {
            entry.totalKg += Number(r.aceite_usado || 0) + Number(r.basura || 0);
        }
        entry.cantidadManifiestos += 1;
    });

    const topBuques = Array.from(buquesMap.values())
        .sort((a, b) => b.totalKg - a.totalKg)
        .slice(0, 5);

    // 3. Distribución
    const distribucionTipos: ChartDataPoint[] = [
        { label: 'Aceite Usado', value: kpis.totalAceiteUsado, color: '#F59E0B' },
        { label: 'Basura General', value: kpis.totalBasuraGeneral, color: '#EF4444' },
        // Se podrían agregar más tipos si existieran en la tabla residuos
    ];

    return {
        kpis,
        residuosPorMes,
        topBuques,
        distribucionTipos
    };
}

/**
 * Genera un reporte detallado para tablas complejas
 */
export async function getReporteComplejo(filters: ReportFilters): Promise<ReporteDetalladoItem[]> {
    const supabase = createClient();

    let query = supabase
        .from('manifiestos')
        .select(`
      fecha_emision,
      numero_manifiesto,
      estado_digitalizacion,
      buque:buques(nombre_buque),
      responsable:personas!responsable_principal_id(nombre),
      residuos:manifiestos_residuos(*)
    `);

    if (filters.fechaInicio) query = query.gte('fecha_emision', filters.fechaInicio);
    if (filters.fechaFin) query = query.lte('fecha_emision', filters.fechaFin);
    if (filters.buqueId) query = query.eq('buque_id', filters.buqueId);
    if (filters.estado) query = query.eq('estado_digitalizacion', filters.estado);

    const { data, error } = await query;

    if (error) throw error;

    // Aplanar datos para reporte tabular
    const reporte: ReporteDetalladoItem[] = [];

    data?.forEach(m => {
        // @ts-ignore
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;
        // @ts-ignore
        const buqueName = m.buque?.nombre_buque || 'Desconocido';
        // @ts-ignore
        const respName = m.responsable?.nombre || 'No asignado';

        if (r) {
            // Crear una fila por cada tipo de residuo relevante (desnormalización para reporte)
            if (r.aceite_usado > 0) {
                reporte.push({
                    fecha: m.fecha_emision,
                    folio: m.numero_manifiesto,
                    buque: buqueName,
                    tipoResiduo: 'Aceite Usado',
                    cantidad: r.aceite_usado,
                    unidad: 'litros',
                    estado: m.estado_digitalizacion,
                    responsable: respName
                });
            }
            if (r.basura > 0) {
                reporte.push({
                    fecha: m.fecha_emision,
                    folio: m.numero_manifiesto,
                    buque: buqueName,
                    tipoResiduo: 'Basura General',
                    cantidad: r.basura,
                    unidad: 'kg',
                    estado: m.estado_digitalizacion,
                    responsable: respName
                });
            }
            // Agregar más tipos según necesidad
        }
    });

    return reporte;
}

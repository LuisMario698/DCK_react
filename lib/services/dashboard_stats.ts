import { SupabaseClient } from '@supabase/supabase-js';
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
 * Obtiene los KPIs principales para el dashboard usando RPC
 */
export async function getDashboardKPIs(supabase: SupabaseClient): Promise<DashboardKPIs> {
    const { data, error } = await supabase.rpc('get_dashboard_kpis');

    if (error) {
        console.error('Error fetching KPIs:', error);
        return {
            totalManifiestos: 0,
            manifiestosPendientes: 0,
            totalBuques: 0,
            buquesActivos: 0,
            totalResiduosReciclados: 0,
            totalBasuraGeneral: 0,
            totalAceiteUsado: 0
        };
    }

    // El RPC devuelve un array con un solo objeto
    const kpis = Array.isArray(data) ? data[0] : data;

    return {
        totalManifiestos: Number(kpis?.total_manifiestos || 0),
        manifiestosPendientes: Number(kpis?.manifiestos_pendientes || 0),
        totalBuques: Number(kpis?.total_buques || 0),
        buquesActivos: Number(kpis?.buques_activos || 0),
        totalResiduosReciclados: Number(kpis?.total_aceite || 0) + Number(kpis?.total_basura || 0),
        totalBasuraGeneral: Number(kpis?.total_basura || 0),
        totalAceiteUsado: Number(kpis?.total_aceite || 0)
    };
}

/**
 * Obtiene estadísticas completas para gráficas usando RPCs optimizados
 */
export async function getDashboardStats(supabase: SupabaseClient, filters?: ReportFilters): Promise<DashboardStats> {
    // Ejecutar todas las consultas en paralelo
    const [kpis, residuosRes, buquesRes] = await Promise.all([
        getDashboardKPIs(supabase),
        supabase.rpc('get_monthly_waste_stats', { months_limit: 6 }),
        supabase.rpc('get_top_buques_waste', { limit_count: 5 })
    ]);

    // Procesar Residuos por Mes
    const residuosPorMes: ResiduosPorMes[] = (residuosRes.data || []).map((r: any) => ({
        mes: r.mes,
        aceite: Number(r.aceite),
        basura: Number(r.basura),
        filtros: 0, // Por ahora no incluido en RPC
        otros: 0
    }));

    // Procesar Top Buques
    const topBuques: ResiduosPorBuque[] = (buquesRes.data || []).map((b: any) => ({
        buqueId: b.buque_id,
        nombreBuque: b.nombre_buque,
        totalKg: Number(b.total_kg),
        cantidadManifiestos: Number(b.cantidad_manifiestos)
    }));

    // Distribución (Calculada de KPIs)
    const distribucionTipos: ChartDataPoint[] = [
        { label: 'Aceite Usado', value: kpis.totalAceiteUsado, color: '#F59E0B' },
        { label: 'Basura General', value: kpis.totalBasuraGeneral, color: '#EF4444' },
    ];

    return {
        kpis,
        residuosPorMes,
        topBuques,
        distribucionTipos
    };
}

/**
 * Genera un reporte detallado usando RPC
 */
export async function getReporteComplejo(supabase: SupabaseClient, filters: ReportFilters): Promise<ReporteDetalladoItem[]> {
    const { data, error } = await supabase.rpc('get_reporte_detallado', {
        p_fecha_inicio: filters.fechaInicio || null,
        p_fecha_fin: filters.fechaFin || null,
        p_buque_id: filters.buqueId || null,
        p_estado: filters.estado || null
    });

    if (error) {
        console.error('Error fetching report:', error);
        throw error;
    }

    return (data || []).map((item: any) => ({
        fecha: item.fecha,
        folio: item.folio,
        buque: item.buque,
        tipoResiduo: item.tipo_residuo, // Mapeo de snake_case a camelCase
        cantidad: Number(item.cantidad),
        unidad: item.unidad,
        estado: item.estado,
        responsable: item.responsable || 'No asignado'
    }));
}

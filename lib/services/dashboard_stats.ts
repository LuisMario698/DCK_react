import { SupabaseClient } from '@supabase/supabase-js';
import {
    DashboardKPIs,
    DashboardStats,
    ReportFilters,
    ReporteDetalladoItem,
    ResiduosPorMes,
    ResiduosPorBuque,
    ChartDataPoint,
    Comparaciones
} from '@/types/dashboard';

export type PeriodoFiltro = 'semana' | 'mes' | 'trimestre' | 'anio' | 'todo' | 'personalizado';

export interface FiltrosDashboard {
    periodo: PeriodoFiltro;
    fechaInicio?: string;
    fechaFin?: string;
}

/**
 * Calcula las fechas de inicio y fin basado en el período seleccionado
 */
export function calcularRangoFechas(periodo: PeriodoFiltro, fechaInicio?: string, fechaFin?: string): { inicio: string; fin: string } {
    const ahora = new Date();
    const fin = ahora.toISOString().split('T')[0];
    let inicio: string;

    switch (periodo) {
        case 'semana':
            const semanaAtras = new Date(ahora);
            semanaAtras.setDate(ahora.getDate() - 7);
            inicio = semanaAtras.toISOString().split('T')[0];
            break;
        case 'mes':
            const mesAtras = new Date(ahora);
            mesAtras.setMonth(ahora.getMonth() - 1);
            inicio = mesAtras.toISOString().split('T')[0];
            break;
        case 'trimestre':
            const trimestreAtras = new Date(ahora);
            trimestreAtras.setMonth(ahora.getMonth() - 3);
            inicio = trimestreAtras.toISOString().split('T')[0];
            break;
        case 'anio':
            const anioAtras = new Date(ahora);
            anioAtras.setFullYear(ahora.getFullYear() - 1);
            inicio = anioAtras.toISOString().split('T')[0];
            break;
        case 'personalizado':
            inicio = fechaInicio || fin;
            return { inicio, fin: fechaFin || fin };
        case 'todo':
        default:
            inicio = '2020-01-01'; // Fecha mínima razonable
            break;
    }

    return { inicio, fin };
}

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
 * Obtiene KPIs filtrados por período de tiempo
 */
export async function getDashboardKPIsFiltered(
    supabase: SupabaseClient,
    filtros: FiltrosDashboard
): Promise<DashboardKPIs & {
    totalBasuron: number;
    entregasBasuron: number;
    filtrosAceite: number;
    filtrosDiesel: number;
    filtrosAire: number;
}> {
    const { inicio, fin } = calcularRangoFechas(filtros.periodo, filtros.fechaInicio, filtros.fechaFin);

    // Ejecutar todas las consultas en paralelo
    const [manifestosRes, residuosRes, buquesRes, basuronRes] = await Promise.all([
        // Manifiestos en el período
        supabase
            .from('manifiestos')
            .select('id, estado_digitalizacion')
            .gte('fecha_emision', inicio)
            .lte('fecha_emision', fin),

        // Residuos en el período (join con manifiestos)
        supabase
            .from('manifiestos')
            .select(`
                id,
                residuos:manifiestos_residuos(
                    aceite_usado,
                    basura,
                    filtros_aceite,
                    filtros_diesel,
                    filtros_aire
                )
            `)
            .gte('fecha_emision', inicio)
            .lte('fecha_emision', fin),

        // Buques totales y activos
        supabase
            .from('buques')
            .select('id, estado'),

        // Basurón en el período
        supabase
            .from('manifiesto_basuron')
            .select('id, total_depositado')
            .gte('fecha', inicio)
            .lte('fecha', fin)
    ]);

    // Calcular totales de manifiestos
    const manifiestos = manifestosRes.data || [];
    const totalManifiestos = manifiestos.length;
    const manifiestosPendientes = manifiestos.filter(m => m.estado_digitalizacion === 'pendiente').length;

    // Calcular totales de residuos
    const residuos = residuosRes.data || [];
    let totalAceite = 0;
    let totalBasura = 0;
    let filtrosAceite = 0;
    let filtrosDiesel = 0;
    let filtrosAire = 0;

    residuos.forEach((m: any) => {
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;
        if (r) {
            totalAceite += Number(r.aceite_usado || 0);
            totalBasura += Number(r.basura || 0);
            filtrosAceite += Number(r.filtros_aceite || 0);
            filtrosDiesel += Number(r.filtros_diesel || 0);
            filtrosAire += Number(r.filtros_aire || 0);
        }
    });

    // Calcular buques
    const buques = buquesRes.data || [];
    const totalBuques = buques.length;
    const buquesActivos = buques.filter(b => b.estado === 'Activo').length;

    // Calcular basurón
    const basuronData = basuronRes.data || [];
    const totalBasuron = basuronData.reduce((sum, b) => sum + Number(b.total_depositado || 0), 0);
    const entregasBasuron = basuronData.length;

    return {
        totalManifiestos,
        manifiestosPendientes,
        totalBuques,
        buquesActivos,
        totalResiduosReciclados: totalAceite + totalBasura + totalBasuron,
        totalBasuraGeneral: totalBasura,
        totalAceiteUsado: totalAceite,
        totalBasuron,
        entregasBasuron,
        filtrosAceite,
        filtrosDiesel,
        filtrosAire
    };
}

/**
 * Calcula la comparación con el período anterior
 */
export async function getComparacionPeriodoAnterior(
    supabase: SupabaseClient,
    filtros: FiltrosDashboard
): Promise<Comparaciones> {
    const { inicio, fin } = calcularRangoFechas(filtros.periodo, filtros.fechaInicio, filtros.fechaFin);

    // Calcular duración del período actual
    const fechaInicio = new Date(inicio);
    const fechaFin = new Date(fin);
    const duracionMs = fechaFin.getTime() - fechaInicio.getTime();

    // Calcular período anterior
    const finAnterior = new Date(fechaInicio.getTime() - 1); // Un día antes del inicio actual
    const inicioAnterior = new Date(finAnterior.getTime() - duracionMs);

    const inicioAnteriorStr = inicioAnterior.toISOString().split('T')[0];
    const finAnteriorStr = finAnterior.toISOString().split('T')[0];

    // Obtener datos del período anterior
    const [manifestosRes, residuosRes, basuronRes] = await Promise.all([
        supabase
            .from('manifiestos')
            .select('id', { count: 'exact' })
            .gte('fecha_emision', inicioAnteriorStr)
            .lte('fecha_emision', finAnteriorStr),

        supabase
            .from('manifiestos')
            .select(`
                residuos:manifiestos_residuos(aceite_usado, basura)
            `)
            .gte('fecha_emision', inicioAnteriorStr)
            .lte('fecha_emision', finAnteriorStr),

        supabase
            .from('manifiesto_basuron')
            .select('total_depositado')
            .gte('fecha', inicioAnteriorStr)
            .lte('fecha', finAnteriorStr)
    ]);

    const manifestosAnterior = manifestosRes.count || 0;

    let aceiteAnterior = 0;
    let basuraAnterior = 0;
    (residuosRes.data || []).forEach((m: any) => {
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;
        if (r) {
            aceiteAnterior += Number(r.aceite_usado || 0);
            basuraAnterior += Number(r.basura || 0);
        }
    });

    const basuronAnterior = (basuronRes.data || []).reduce(
        (sum, b) => sum + Number(b.total_depositado || 0), 0
    );

    return {
        manifestosAnterior,
        aceiteAnterior,
        basuraAnterior,
        basuronAnterior,
        totalAnterior: aceiteAnterior + basuraAnterior + basuronAnterior
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
    // Ajustar la fecha fin para incluir todo el día (agregar un día)
    // Convertir fechas a ISO strings (UTC) preservando el inicio y fin del día local
    // Esto evita problemas de zona horaria donde registros de "ieri" (local) aparecen hoy (UTC)
    let fechaInicioISO = undefined;
    if (filters.fechaInicio) {
        // Inicio del día local: 00:00:00
        fechaInicioISO = new Date(filters.fechaInicio + 'T00:00:00').toISOString();
    }

    let fechaFinISO = undefined;
    if (filters.fechaFin) {
        // Fin del día local: 23:59:59.999
        fechaFinISO = new Date(filters.fechaFin + 'T23:59:59.999').toISOString();
    }

    const { data, error } = await supabase.rpc('get_reporte_detallado', {
        p_fecha_inicio: fechaInicioISO || null,
        p_fecha_fin: fechaFinISO || null,
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

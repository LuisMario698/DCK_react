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
 * Obtiene los KPIs principales para el dashboard con queries directas a tablas.
 * Evita el límite de 1,000 filas de Supabase usando head:true para conteos
 * y queries directas a las tablas de detalle con limit alto.
 */
export async function getDashboardKPIs(supabase: SupabaseClient): Promise<DashboardKPIs> {
    const [totalRes, pendientesRes, residuosRes, buquesRes] = await Promise.all([
        supabase
            .from('manifiestos')
            .select('*', { count: 'exact', head: true }),

        supabase
            .from('manifiestos')
            .select('*', { count: 'exact', head: true })
            .eq('estado_digitalizacion', 'pendiente'),

        supabase
            .from('manifiestos_residuos')
            .select('aceite_usado, basura')
            .limit(100_000),

        supabase
            .from('buques')
            .select('id, estado')
            .limit(10_000),
    ]);

    const totalManifiestos = totalRes.count ?? 0;
    const manifiestosPendientes = pendientesRes.count ?? 0;

    let totalAceite = 0;
    let totalBasura = 0;
    for (const r of residuosRes.data ?? []) {
        totalAceite += Number(r.aceite_usado ?? 0);
        totalBasura  += Number(r.basura ?? 0);
    }

    const buques = buquesRes.data ?? [];
    const totalBuques = buques.length;
    const buquesActivos = buques.filter((b: any) => b.estado === 'Activo').length;

    return {
        totalManifiestos,
        manifiestosPendientes,
        totalBuques,
        buquesActivos,
        totalResiduosReciclados: totalAceite + totalBasura,
        totalBasuraGeneral: totalBasura,
        totalAceiteUsado: totalAceite,
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
    // Para "todo" no aplicamos filtros de fecha: registros con fecha NULL o pre-2020 quedarían
    // excluidos con .gte/.lte, produciendo conteos distintos a los del landing.
    const isTodo = filtros.periodo === 'todo';

    const baseManifiestos = supabase
        .from('manifiestos')
        .select('id, estado_digitalizacion')
        .limit(100_000);

    const baseResiduos = supabase
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
        .limit(100_000);

    const baseBasuron = supabase
        .from('manifiesto_basuron')
        .select('id, total_depositado')
        .limit(100_000);

    const [manifestosRes, residuosRes, buquesRes, basuronRes] = await Promise.all([
        isTodo
            ? baseManifiestos
            : baseManifiestos.gte('fecha_emision', inicio).lte('fecha_emision', fin),

        isTodo
            ? baseResiduos
            : baseResiduos.gte('fecha_emision', inicio).lte('fecha_emision', fin),

        supabase.from('buques').select('id, estado').limit(10_000),

        isTodo
            ? baseBasuron
            : baseBasuron.gte('fecha', inicio).lte('fecha', fin),
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
 * Obtiene estadísticas completas para gráficas con queries directas a tablas
 */
export async function getDashboardStats(supabase: SupabaseClient, _filters?: ReportFilters): Promise<DashboardStats> {
    // Rango: últimos 6 meses completos
    const sixMonthsAgo = new Date();
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
    const sixMonthsAgoStr = sixMonthsAgo.toISOString().split('T')[0];

    const [kpis, manifestosRes] = await Promise.all([
        getDashboardKPIs(supabase),
        supabase
            .from('manifiestos')
            .select(`
                id,
                fecha_emision,
                buque_id,
                buque:buques(nombre_buque),
                residuos:manifiestos_residuos(aceite_usado, basura)
            `)
            .gte('fecha_emision', sixMonthsAgoStr)
            .order('fecha_emision', { ascending: true }),
    ]);

    const manifiestos = manifestosRes.data ?? [];

    // ── Residuos por mes (agrupación client-side) ─────────────────────────
    const monthlyMap = new Map<string, { aceite: number; basura: number }>();
    manifiestos.forEach((m: any) => {
        if (!m.fecha_emision) return;
        const mes = (m.fecha_emision as string).substring(0, 7); // YYYY-MM
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;
        const aceite = Number(r?.aceite_usado ?? 0);
        const basura = Number(r?.basura ?? 0);
        const prev = monthlyMap.get(mes) ?? { aceite: 0, basura: 0 };
        monthlyMap.set(mes, { aceite: prev.aceite + aceite, basura: prev.basura + basura });
    });
    const residuosPorMes: ResiduosPorMes[] = Array.from(monthlyMap.entries()).map(([mes, d]) => ({
        mes,
        aceite: d.aceite,
        basura: d.basura,
        filtros: 0,
        otros: 0,
    }));

    // ── Top 5 buques por volumen (agrupación client-side) ─────────────────
    const buqueMap = new Map<number, { nombre: string; totalKg: number; count: number }>();
    manifiestos.forEach((m: any) => {
        if (!m.buque_id) return;
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;
        const total = Number(r?.aceite_usado ?? 0) + Number(r?.basura ?? 0);
        const nombre =
            (Array.isArray(m.buque) ? m.buque[0]?.nombre_buque : m.buque?.nombre_buque) ?? 'Desconocido';
        const prev = buqueMap.get(m.buque_id) ?? { nombre, totalKg: 0, count: 0 };
        buqueMap.set(m.buque_id, { nombre: prev.nombre, totalKg: prev.totalKg + total, count: prev.count + 1 });
    });
    const topBuques: ResiduosPorBuque[] = Array.from(buqueMap.entries())
        .sort((a, b) => b[1].totalKg - a[1].totalKg)
        .slice(0, 5)
        .map(([id, d]) => ({
            buqueId: id,
            nombreBuque: d.nombre,
            totalKg: d.totalKg,
            cantidadManifiestos: d.count,
        }));

    const distribucionTipos: ChartDataPoint[] = [
        { label: 'Aceite Usado', value: kpis.totalAceiteUsado, color: '#F59E0B' },
        { label: 'Basura General', value: kpis.totalBasuraGeneral, color: '#EF4444' },
    ];

    return { kpis, residuosPorMes, topBuques, distribucionTipos };
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

import { SupabaseClient } from '@supabase/supabase-js';

export interface LandingStats {
    totalManifiestos: number;
    totalAceiteUsado: number;   // litros
    totalBasura: number;         // kg (manifiestos_residuos)
    totalBasuron: number;        // kg (manifiesto_basuron)
    filtrosAceite: number;       // unidades
    filtrosDiesel: number;       // unidades
    filtrosAire: number;         // unidades
}

/**
 * Estadísticas históricas completas para la landing page.
 * Sin filtro de fecha → totalidad de registros desde el inicio.
 *
 * La landing la ven visitantes anónimos, y las políticas RLS sólo dan acceso
 * al rol `authenticated`: consultar las tablas directamente devuelve [] sin
 * lanzar error, y la página acababa mostrando 0 en todo. Por eso se pide
 * primero la función `estadisticas_publicas()` (SECURITY DEFINER, devuelve
 * sólo los totales — ver CREAR_FUNCION_ESTADISTICAS_PUBLICAS.sql).
 *
 * Si la función todavía no existe en la base de datos, se recurre a las
 * consultas directas, que siguen funcionando con sesión iniciada.
 */
export async function getLandingStats(supabase: SupabaseClient): Promise<LandingStats> {
    const { data: rpcData, error: rpcError } = await supabase
        .rpc('estadisticas_publicas')
        .maybeSingle<EstadisticasPublicasRow>();

    if (!rpcError && rpcData) {
        return {
            totalManifiestos: Number(rpcData.total_manifiestos ?? 0),
            totalAceiteUsado: Number(rpcData.total_aceite_usado ?? 0),
            totalBasura: Number(rpcData.total_basura ?? 0),
            totalBasuron: Number(rpcData.total_basuron ?? 0),
            filtrosAceite: Number(rpcData.filtros_aceite ?? 0),
            filtrosDiesel: Number(rpcData.filtros_diesel ?? 0),
            filtrosAire: Number(rpcData.filtros_aire ?? 0),
        };
    }

    return getLandingStatsDirecto(supabase);
}

/** Fila que devuelve `public.estadisticas_publicas()`. */
interface EstadisticasPublicasRow {
    total_manifiestos: number;
    total_aceite_usado: number;
    total_basura: number;
    total_basuron: number;
    filtros_aceite: number;
    filtros_diesel: number;
    filtros_aire: number;
}

/**
 * Consulta directa a las tablas (requiere sesión por RLS).
 *
 * Estrategia para no depender del límite de 1,000 filas de Supabase:
 *   - COUNT de manifiestos con head:true (sin transferir filas)
 *   - Sumas sobre manifiestos_residuos y manifiesto_basuron directamente
 *     con limit alto (evita join innecesario con manifiestos)
 */
async function getLandingStatsDirecto(supabase: SupabaseClient): Promise<LandingStats> {
    const [countRes, residuosRes, basuronRes] = await Promise.all([
        // Solo el conteo, sin traer filas
        supabase
            .from('manifiestos')
            .select('*', { count: 'exact', head: true }),

        // Sumas de residuos directo desde la tabla de detalle
        supabase
            .from('manifiestos_residuos')
            .select('aceite_usado, basura, filtros_aceite, filtros_diesel, filtros_aire')
            .limit(100_000),

        // Sumas de basurón
        supabase
            .from('manifiesto_basuron')
            .select('total_depositado')
            .limit(100_000),
    ]);

    const totalManifiestos = countRes.count ?? 0;

    let totalAceiteUsado = 0;
    let totalBasura = 0;
    let filtrosAceite = 0;
    let filtrosDiesel = 0;
    let filtrosAire = 0;

    for (const r of residuosRes.data ?? []) {
        totalAceiteUsado += Number(r.aceite_usado ?? 0);
        totalBasura      += Number(r.basura ?? 0);
        filtrosAceite    += Number(r.filtros_aceite ?? 0);
        filtrosDiesel    += Number(r.filtros_diesel ?? 0);
        filtrosAire      += Number(r.filtros_aire ?? 0);
    }

    const totalBasuron = (basuronRes.data ?? []).reduce(
        (sum, b) => sum + Number(b.total_depositado ?? 0),
        0,
    );

    return {
        totalManifiestos,
        totalAceiteUsado,
        totalBasura,
        totalBasuron,
        filtrosAceite,
        filtrosDiesel,
        filtrosAire,
    };
}

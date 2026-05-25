import { SupabaseClient } from '@supabase/supabase-js';

export interface AuditLogItem {
    id: number;
    tabla: string;
    operacion: 'INSERT' | 'UPDATE' | 'DELETE';
    registro_id: string | null;
    datos_ant: Record<string, unknown> | null;
    datos_nue: Record<string, unknown> | null;
    usuario_email: string | null;
    created_at: string;
}

export interface AuditLogFilters {
    tabla?: string;
    operacion?: string;
    desde?: string;
    hasta?: string;
    page?: number;
    pageSize?: number;
}

export const TABLAS_AUDITADAS = [
    'manifiestos',
    'manifiestos_residuos',
    'manifiesto_basuron',
    'buques',
    'personas',
    'asociaciones_recolectoras',
    'tipos_persona',
];

export const TABLA_LABELS: Record<string, string> = {
    manifiestos: 'Manifiestos',
    manifiestos_residuos: 'Residuos de Manifiesto',
    manifiesto_basuron: 'Basurón',
    buques: 'Embarcaciones',
    personas: 'Personas',
    asociaciones_recolectoras: 'Asociaciones',
    tipos_persona: 'Tipos de Persona',
};

export async function getAuditLog(
    supabase: SupabaseClient,
    filters: AuditLogFilters = {}
): Promise<{ data: AuditLogItem[]; total: number }> {
    const { tabla, operacion, desde, hasta, page = 1, pageSize = 50 } = filters;
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;

    let query = supabase
        .from('audit_log')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range(from, to);

    if (tabla) query = query.eq('tabla', tabla);
    if (operacion) query = query.eq('operacion', operacion);
    if (desde) query = query.gte('created_at', `${desde}T00:00:00Z`);
    if (hasta) query = query.lte('created_at', `${hasta}T23:59:59Z`);

    const { data, error, count } = await query;
    if (error) throw error;
    return { data: (data ?? []) as AuditLogItem[], total: count ?? 0 };
}

export async function getAuditLogResumen(supabase: SupabaseClient) {
    const { data, error } = await supabase
        .from('audit_log')
        .select('tabla, operacion');

    if (error) throw error;

    const resumen: Record<string, { INSERT: number; UPDATE: number; DELETE: number; total: number }> = {};
    for (const row of data ?? []) {
        if (!resumen[row.tabla]) resumen[row.tabla] = { INSERT: 0, UPDATE: 0, DELETE: 0, total: 0 };
        resumen[row.tabla][row.operacion as 'INSERT' | 'UPDATE' | 'DELETE']++;
        resumen[row.tabla].total++;
    }
    return resumen;
}

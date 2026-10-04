import type { SupabaseClient } from '@supabase/supabase-js';

/** Lo que tiene una base de datos, para elegir cuál ver (Superadmin → Sistema) */
export interface ResumenBase {
    manifiestos: number;
    personas: number;
    embarcaciones: number;
    /** Cuándo se capturó el último manifiesto (ISO); null si no hay */
    ultimaCaptura: string | null;
}

/** Sólo conteos (sin traer filas) y la fecha del último manifiesto */
export async function getResumenBase(supabase: SupabaseClient): Promise<ResumenBase> {
    const contar = (tabla: string) => supabase.from(tabla).select('id', { count: 'exact', head: true });
    const [manifiestos, personas, embarcaciones, ultimo] = await Promise.all([
        contar('manifiestos'),
        contar('personas'),
        contar('buques'),
        supabase.from('manifiestos').select('created_at').order('created_at', { ascending: false, nullsFirst: false }).limit(1),
    ]);
    const error = manifiestos.error ?? personas.error ?? embarcaciones.error ?? ultimo.error;
    if (error) throw error;
    return {
        manifiestos: manifiestos.count ?? 0,
        personas: personas.count ?? 0,
        embarcaciones: embarcaciones.count ?? 0,
        ultimaCaptura: (ultimo.data as { created_at: string | null }[] | null)?.[0]?.created_at ?? null,
    };
}

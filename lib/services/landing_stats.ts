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

export async function getLandingStats(supabase: SupabaseClient): Promise<LandingStats> {
    const [residuosRes, basuronRes] = await Promise.all([
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
            `),
        supabase
            .from('manifiesto_basuron')
            .select('total_depositado'),
    ]);

    const manifiestos = residuosRes.data ?? [];
    const totalManifiestos = manifiestos.length;

    let totalAceiteUsado = 0;
    let totalBasura = 0;
    let filtrosAceite = 0;
    let filtrosDiesel = 0;
    let filtrosAire = 0;

    for (const m of manifiestos) {
        const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;
        if (r) {
            totalAceiteUsado += Number(r.aceite_usado ?? 0);
            totalBasura += Number(r.basura ?? 0);
            filtrosAceite += Number(r.filtros_aceite ?? 0);
            filtrosDiesel += Number(r.filtros_diesel ?? 0);
            filtrosAire += Number(r.filtros_aire ?? 0);
        }
    }

    const totalBasuron = (basuronRes.data ?? []).reduce(
        (sum, b) => sum + Number(b.total_depositado ?? 0),
        0
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

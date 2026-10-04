import { VariantCinematic } from '@/components/landing/VariantCinematic';
import { baseElegida, createServerClient } from '@/lib/supabase/server';
import { AvisoBaseDck } from '@/components/landing/AvisoBaseDck';
import { getLandingStats } from '@/lib/services/landing_stats';
import {
    VARIANTES_MAPA,
    VARIANTE_MAPA_PREDETERMINADA,
    type VarianteMapa,
} from '@/components/landing/mapa/puertos';

// Revalida cada hora para reflejar nuevos manifiestos sin rebuild
export const revalidate = 3600;

export default async function LandingPage({
    searchParams,
}: {
    searchParams: Promise<{ mapa?: string }>;
}) {
    // ?mapa=globo|red|silueta permite comparar las opciones del mapa de puertos
    const { mapa } = await searchParams;
    const varianteMapa = VARIANTES_MAPA.some((v) => v.id === mapa)
        ? (mapa as VarianteMapa)
        : VARIANTE_MAPA_PREDETERMINADA;

    // Si el superadmin eligió la base de DCK (sólo consulta) en su navegador, las cifras salen de ahí
    const conDck = (await baseElegida()) === 'dck';

    let stats = null;
    try {
        const supabase = await createServerClient({ conBaseElegida: true });
        stats = await getLandingStats(supabase);
    } catch {
        // Si falla el fetch, la página sigue funcionando con datos nulos
    }

    return (
        <>
            <VariantCinematic stats={stats} varianteMapa={varianteMapa} compararMapas={mapa !== undefined} />
            {conDck && <AvisoBaseDck />}
        </>
    );
}

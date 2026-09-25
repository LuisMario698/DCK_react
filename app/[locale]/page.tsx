import { VariantCinematic } from '@/components/landing/VariantCinematic';
import { createServerClient } from '@/lib/supabase/server';
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

    let stats = null;
    try {
        const supabase = await createServerClient();
        stats = await getLandingStats(supabase);
    } catch {
        // Si falla el fetch, la página sigue funcionando con datos nulos
    }

    return <VariantCinematic stats={stats} varianteMapa={varianteMapa} compararMapas={mapa !== undefined} />;
}

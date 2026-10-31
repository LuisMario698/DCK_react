import { VariantCinematic } from '@/components/landing/VariantCinematic';
import { LandingNueva } from '@/components/landing/nueva/LandingNueva';
import { SelectorVersionLanding, type VersionLanding } from '@/components/landing/SelectorVersionLanding';
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

/**
 * La landing. Mientras se decide entre la actual y la nueva, las dos conviven: ?landing=nueva
 * enseña la nueva y el botón de abajo a la izquierda cambia entre ellas (sin el parámetro, la actual).
 */
export default async function LandingPage({
    searchParams,
}: {
    searchParams: Promise<{ mapa?: string; landing?: string }>;
}) {
    // ?mapa=globo|red|silueta permite comparar las opciones del mapa de puertos
    const { mapa, landing } = await searchParams;
    const varianteMapa = VARIANTES_MAPA.some((v) => v.id === mapa)
        ? (mapa as VarianteMapa)
        : VARIANTE_MAPA_PREDETERMINADA;
    const version: VersionLanding = landing === 'nueva' ? 'nueva' : 'actual';

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
            {version === 'nueva' ? (
                <LandingNueva stats={stats} varianteMapa={varianteMapa} />
            ) : (
                <VariantCinematic stats={stats} varianteMapa={varianteMapa} compararMapas={mapa !== undefined} />
            )}
            <SelectorVersionLanding version={version} sobreAviso={conDck} />
            {conDck && <AvisoBaseDck />}
        </>
    );
}

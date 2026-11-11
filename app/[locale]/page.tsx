import { VariantCinematic } from '@/components/landing/VariantCinematic';
import { NoticiasPortada } from '@/components/landing/NoticiasPortada';
// Las otras dos landings (y el aviso de la base de DCK) sólo bajan cuando se piden (ver LandingsAlternas)
import { AvisoBaseDck, LandingNueva, LandingTresD } from '@/components/landing/LandingsAlternas';
import { SelectorVersionLanding, type VersionLanding } from '@/components/landing/SelectorVersionLanding';
import { baseElegida, createServerClient } from '@/lib/supabase/server';
import { getLandingStats } from '@/lib/services/landing_stats';
import {
    VARIANTES_MAPA,
    VARIANTE_MAPA_PREDETERMINADA,
    type VarianteMapa,
} from '@/components/landing/mapa/puertos';

// Revalida cada hora para reflejar nuevos manifiestos sin rebuild
export const revalidate = 3600;

/**
 * La landing. Mientras se decide entre la actual, la nueva y la 3D, conviven las tres: ?landing=nueva
 * y ?landing=3d enseñan las otras y el botón flotante cambia entre ellas (sin el parámetro, la actual).
 */
export default async function LandingPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ mapa?: string; landing?: string }>;
}) {
    const { locale } = await params;
    // ?mapa=globo|red|silueta permite comparar las opciones del mapa de puertos
    const { mapa, landing } = await searchParams;
    const varianteMapa = VARIANTES_MAPA.some((v) => v.id === mapa)
        ? (mapa as VarianteMapa)
        : VARIANTE_MAPA_PREDETERMINADA;
    const version: VersionLanding = landing === 'nueva' || landing === '3d' ? landing : 'actual';

    // Si el superadmin eligió la base de DCK (sólo consulta) en su navegador, las cifras salen de ahí
    const conDck = (await baseElegida()) === 'dck';

    // Las noticias de la 3D se importan sólo cuando se pide esa landing: con un import arriba, sus
    // componentes de cliente (tarjetas, ilustraciones) bajaban también con la actual
    const noticias3d =
        version === '3d'
            ? await import('@/components/landing/tresd/SeccionNoticias').then(({ SeccionNoticias }) => (
                  <SeccionNoticias locale={locale} />
              ))
            : null;

    let stats = null;
    try {
        const supabase = await createServerClient({ conBaseElegida: true });
        stats = await getLandingStats(supabase);
    } catch {
        // Si falla el fetch, la página sigue funcionando con datos nulos
    }

    return (
        <>
            {version === '3d' ? (
                <LandingTresD stats={stats} varianteMapa={varianteMapa} noticias={noticias3d} />
            ) : version === 'nueva' ? (
                <LandingNueva stats={stats} varianteMapa={varianteMapa} />
            ) : (
                <VariantCinematic
                    stats={stats}
                    varianteMapa={varianteMapa}
                    compararMapas={mapa !== undefined}
                    noticias={<NoticiasPortada locale={locale} />}
                />
            )}
            <SelectorVersionLanding version={version} sobreAviso={conDck} />
            {conDck && <AvisoBaseDck />}
        </>
    );
}

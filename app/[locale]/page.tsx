import { VariantCinematic } from '@/components/landing/VariantCinematic';
import { NoticiasPortada } from '@/components/landing/NoticiasPortada';
// El aviso de la base de DCK sólo baja cuando se enseña (ver AvisoBaseDckDiferido)
import { AvisoBaseDck } from '@/components/landing/AvisoBaseDckDiferido';
import { LandingAnterior } from '@/components/landing/anterior/LandingAnterior';
import { MODO_DEMO } from '@/lib/demo/config';
import { baseElegida, createServerClient } from '@/lib/supabase/server';
import { getLandingStats } from '@/lib/services/landing_stats';
import {
    VARIANTES_MAPA,
    VARIANTE_MAPA_PREDETERMINADA,
    type VarianteMapa,
} from '@/components/landing/mapa/puertos';

// Revalida cada hora para reflejar nuevos manifiestos sin rebuild
export const revalidate = 3600;

/** La landing (la «Actual»): portada, proyecto, noticias, mapa de puertos y cierre. */
export default async function LandingPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ mapa?: string; version?: string }>;
}) {
    const { locale } = await params;
    // ?mapa=globo|red|silueta permite comparar las opciones del mapa de puertos
    const { mapa, version } = await searchParams;
    // ?version=anterior: la landing de antes del rediseño, sólo en la demo (en producción se ignora)
    const verAnterior = MODO_DEMO && version === 'anterior';
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

    // «Cifras al…»: se arma aquí (servidor) con la hora del puerto, para no chocar al hidratar
    const cifrasAl = new Intl.DateTimeFormat('es-MX', {
        timeZone: 'America/Hermosillo',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(new Date());

    if (verAnterior) {
        return (
            <>
                <LandingAnterior stats={stats} varianteMapa={varianteMapa} compararMapas={mapa !== undefined} />
                {conDck && <AvisoBaseDck />}
            </>
        );
    }

    return (
        <>
            <VariantCinematic
                stats={stats}
                cifrasAl={cifrasAl}
                varianteMapa={varianteMapa}
                compararMapas={mapa !== undefined}
                noticias={<NoticiasPortada locale={locale} stats={stats} />}
            />
            {conDck && <AvisoBaseDck />}
        </>
    );
}

import type { Metadata } from 'next';
import { redirect } from 'next/navigation';
import { EntradaDemo } from '@/components/demo/EntradaDemo';
import { MODO_DEMO, URL_DEMO, esVistaDemo } from '@/lib/demo/config';
import { tituloPantalla } from '@/lib/constants/titulo';

export const metadata: Metadata = { title: tituloPantalla('Demostración') };

/**
 * Entrada a la demostración: se elige cómo ver SiMAR (el puerto o una empresa recolectora) y se entra
 * sin cuenta, directo al recorrido. Con ?vista=puerto|empresa entra sola (para un código QR).
 * Fuera del despliegue de la demo, manda a la demo (si existe) o al inicio.
 */
export default async function DemoPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ vista?: string }>;
}) {
    const { locale } = await params;
    const { vista } = await searchParams;
    if (!MODO_DEMO) redirect(URL_DEMO ? `${URL_DEMO}/${locale}/demo${vista ? `?vista=${encodeURIComponent(vista)}` : ''}` : `/${locale}`);
    return <EntradaDemo locale={locale} vistaInicial={esVistaDemo(vista) ? vista : null} />;
}

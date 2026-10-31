import type { Metadata } from 'next';
import { NOTICIAS } from '@/lib/constants/noticias';
import { tituloPantalla } from '@/lib/constants/titulo';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';

export const metadata: Metadata = {
    title: tituloPantalla('Noticias'),
    description: 'Noticias de SiMAR y artículos sobre el Mar de Cortés, la basura de los barcos y el aceite usado.',
};

/** Todas las noticias y artículos (los datos están en lib/constants/noticias.ts) */
export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const [destacada, ...resto] = [...NOTICIAS].sort((a, b) => Number(!!b.destacada) - Number(!!a.destacada));

    return (
        <div className="simar-landing min-h-screen bg-simar-papel font-sans text-simar-texto antialiased">
            <EncabezadoNoticias locale={locale} />
            <main className="px-6 pt-12 pb-24 md:pt-16 md:pb-32 movil:px-5 movil:pt-8 movil:pb-16">
                <div className="max-w-[1248px] mx-auto">
                    <p className="text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">Noticias</p>
                    <h1 className="mt-3 max-w-4xl text-[clamp(40px,5vw,72px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[34px]">
                        Lo que pasa en el puerto y en el mar.
                    </h1>
                    <p className="mt-5 max-w-3xl text-xl md:text-[22px] leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[17px]">
                        Novedades de SiMAR y artículos cortos, con sus fuentes, sobre el Mar de Cortés y lo que llega al centro de acopio.
                    </p>
                    <h2 className="sr-only">Todas las noticias</h2>
                    <div className="mt-12 grid gap-5 md:gap-6 movil:mt-8 movil:gap-4">
                        <TarjetaNoticia noticia={destacada} locale={locale} grande />
                        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 movil:gap-4">
                            {resto.map((n) => (
                                <TarjetaNoticia key={n.slug} noticia={n} locale={locale} />
                            ))}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

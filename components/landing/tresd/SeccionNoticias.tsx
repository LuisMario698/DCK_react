import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NOTICIAS, minutosDeLectura } from '@/lib/constants/noticias';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';

/**
 * «Noticias» en la landing 3D, al estilo de una sala de prensa: la destacada a lo grande (el texto
 * sobre la foto) y al lado las más recientes en lista. En celular, las demás van en un carrusel que
 * se desliza de lado (no alarga el scroll).
 *
 * Es un componente de servidor: la página lo arma y se lo pasa a LandingTresD, así los artículos
 * no bajan con el JavaScript de la landing.
 */
export function SeccionNoticias({ locale }: { locale: string }) {
    const destacada = NOTICIAS.find((n) => n.destacada) ?? NOTICIAS[0];
    const otras = NOTICIAS.filter((n) => n !== destacada).slice(0, 4);
    const conMinutos = <T extends (typeof NOTICIAS)[number]>(n: T) => ({ ...n, minutos: minutosDeLectura(n) });

    return (
        <section id="noticias" aria-labelledby="noticias-titulo" className="relative bg-simar-superficie px-6 py-24 md:py-32 overflow-clip movil:px-5 movil:py-16">
            <div className="max-w-[1248px] mx-auto">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="t3-enfoca text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">Noticias</p>
                        <h2
                            id="noticias-titulo"
                            className="t3-enfoca mt-3 text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]"
                        >
                            Lo que pasa en el puerto y en el mar.
                        </h2>
                        <p className="t3-enfoca mt-4 max-w-2xl text-xl leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[17px]">
                            Novedades de SiMAR y artículos cortos, con sus fuentes, sobre el Mar de Cortés y lo que llega al centro de acopio.
                        </p>
                    </div>
                    <Link
                        href={`/${locale}/noticias`}
                        className="t3-enfoca max-sm:hidden min-h-[52px] px-6 rounded-full border-2 border-simar-campo-borde text-simar-texto text-[17px] font-bold inline-flex items-center gap-2 hover:bg-simar-texto/5 transition-colors"
                    >
                        Todas las noticias
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="mt-12 grid lg:grid-cols-[minmax(0,1.3fr)_minmax(0,1fr)] gap-10 lg:gap-14 items-start movil:mt-8">
                    <div className="t3-enfoca">
                        <TarjetaNoticia noticia={conMinutos(destacada)} locale={locale} variante="portada" />
                    </div>

                    {/* Computadora y tableta: las más recientes en lista */}
                    <div className="max-sm:hidden">
                        <h3 className="t3-enfoca text-[17px] font-extrabold text-simar-texto-2">Más recientes</h3>
                        <ul className="mt-4 divide-y divide-simar-borde">
                            {otras.map((n, i) => (
                                <li key={n.slug} className={`t3-enfoca py-5 first:pt-2 ${i % 3 === 1 ? 't3-enfoca-2' : i % 3 === 2 ? 't3-enfoca-3' : ''}`}>
                                    <TarjetaNoticia noticia={conMinutos(n)} locale={locale} variante="fila" />
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>

                {/* Celular: un carrusel que se desliza de lado */}
                <div className="sm:hidden mt-5">
                    <h3 className="text-[17px] font-extrabold text-simar-texto-2">Más recientes</h3>
                    <ul className="simar-carrusel mt-3" aria-label="Más recientes (desliza de lado)">
                        {otras.map((n) => (
                            <li key={n.slug} className="flex">
                                <TarjetaNoticia noticia={conMinutos(n)} locale={locale} className="w-full" />
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={`/${locale}/noticias`}
                        className="mt-6 min-h-[52px] rounded-full border-2 border-simar-campo-borde text-simar-texto text-[17px] font-bold flex items-center justify-center gap-2"
                    >
                        Todas las noticias
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>
            </div>
        </section>
    );
}

'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight } from 'lucide-react';
import { NOTICIAS } from '@/lib/constants/noticias';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';

/** «Noticias»: la destacada en grande y las tres siguientes; el resto en /noticias */
export function SeccionNoticias() {
    const { locale } = useParams<{ locale: string }>();
    const destacada = NOTICIAS.find((n) => n.destacada) ?? NOTICIAS[0];
    const otras = NOTICIAS.filter((n) => n !== destacada).slice(0, 3);

    return (
        <section id="noticias" className="relative bg-simar-superficie px-6 py-24 md:py-36 overflow-clip movil:px-5 movil:py-16">
            <div className="max-w-[1248px] mx-auto">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="t3-enfoca text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">Noticias</p>
                        <h2 className="t3-enfoca mt-3 text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]">
                            Lo que pasa en el puerto y en el mar.
                        </h2>
                    </div>
                    <Link
                        href={`/${locale}/noticias`}
                        className="t3-enfoca min-h-[52px] px-6 rounded-full border-2 border-simar-campo-borde text-simar-texto text-[17px] font-bold inline-flex items-center gap-2 hover:bg-simar-texto/5 transition-colors movil:hidden"
                    >
                        Ver todas
                        <ArrowRight className="w-5 h-5" />
                    </Link>
                </div>

                <div className="mt-12 grid gap-5 md:gap-6 movil:mt-8 movil:gap-4">
                    <div className="t3-enfoca">
                        <TarjetaNoticia noticia={destacada} locale={locale} grande />
                    </div>
                    <div className="grid md:grid-cols-3 gap-5 md:gap-6 movil:gap-4">
                        {otras.map((n, i) => (
                            <div key={n.slug} className={`t3-enfoca flex ${i === 1 ? 't3-enfoca-2' : i === 2 ? 't3-enfoca-3' : ''}`}>
                                <TarjetaNoticia noticia={n} locale={locale} className="w-full" />
                            </div>
                        ))}
                    </div>
                </div>

                <Link
                    href={`/${locale}/noticias`}
                    className="hidden movil:flex mt-6 min-h-[52px] rounded-full border-2 border-simar-campo-borde text-simar-texto text-[17px] font-bold items-center justify-center gap-2"
                >
                    Ver todas las noticias
                    <ArrowRight className="w-5 h-5" />
                </Link>
            </div>
        </section>
    );
}

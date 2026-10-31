import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fechaNoticia, type Noticia } from '@/lib/constants/noticias';
import { PortadaNoticia } from './PortadaNoticia';

/**
 * Tarjeta de una noticia (sección de la landing 3D y lista de /noticias). `grande` pone la portada
 * a un lado en computadora. Toda la tarjeta es el enlace.
 */
export function TarjetaNoticia({ noticia, locale, grande = false, className = '' }: { noticia: Noticia; locale: string; grande?: boolean; className?: string }) {
    return (
        <Link
            href={`/${locale}/noticias/${noticia.slug}`}
            className={`simar-tarjeta-accion group flex flex-col overflow-hidden rounded-[28px] border border-simar-borde bg-simar-superficie shadow-simar focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-4 movil:rounded-[22px] ${
                grande ? 'lg:grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]' : ''
            } ${className}`}
        >
            <PortadaNoticia
                noticia={noticia}
                sizes={grande ? '(min-width: 1024px) 700px, 100vw' : '(min-width: 1024px) 400px, 100vw'}
                className={grande ? 'aspect-[16/10] lg:aspect-auto lg:min-h-[420px]' : 'aspect-[16/10]'}
            />
            <div className={`flex flex-1 flex-col p-6 md:p-7 movil:p-5 ${grande ? 'lg:p-10 lg:justify-center' : ''}`}>
                <p className="flex flex-wrap items-center gap-x-2.5 gap-y-1 text-[15px] font-bold">
                    <span className="text-simar-marea-tinta">{noticia.categoria}</span>
                    <span aria-hidden="true" className="text-simar-texto-3">·</span>
                    <span className="text-simar-texto-2 font-semibold">{fechaNoticia(noticia)}</span>
                </p>
                <h3
                    className={`mt-3 font-extrabold leading-[1.15] tracking-[-0.015em] text-simar-texto ${
                        grande ? 'text-[26px] md:text-[34px] lg:text-[38px]' : 'text-[22px] md:text-[24px]'
                    } movil:text-[21px]`}
                >
                    {noticia.titulo}
                </h3>
                <p className={`mt-3 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[16px] ${grande ? 'md:text-[19px]' : 'line-clamp-3'}`}>{noticia.resumen}</p>
                <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[17px] font-bold text-simar-marea-tinta">
                    Leer
                    <span className="sr-only">: {noticia.titulo}</span>
                    <ArrowRight className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}

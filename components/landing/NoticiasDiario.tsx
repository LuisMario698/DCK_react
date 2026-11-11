'use client';

import { useEffect, useRef, type CSSProperties } from 'react';
import Link from 'next/link';
import { ArrowRight, Newspaper } from 'lucide-react';
import { CabeceraDiario, LoUltimo, NotaPrincipal } from '@/components/noticias/PortadaEditorial';
import type { DatosEditorial } from '@/components/noticias/TarjetaEditorial';
import { FotoNota } from '@/components/noticias/FotoNota';
import { ContadorNuevas, RecordarVisita } from './MarcaNueva';

/**
 * Las noticias de la landing Actual, como la portada de Noticias: una hoja de periódico sobre la
 * franja oscura, con la misma cabecera («Noticias del Mar» en Newsreader, la fecha, los filetes),
 * la nota principal con su foto grande y «Lo último». Así, quien entra a Noticias llega a lo mismo
 * que ya vio (DISEÑO_SIMAR.md §8.7).
 *
 * Que se note que hay una sección entera: arriba, junto a las cifras, «Ver la sección completa»;
 * al pie, un banner oscuro que lleva a ella, con un abanico de fotos de otras notas que se abre al
 * pasar el cursor y lo que hay adentro (las notas, las cifras, el mapa, el glosario).
 *
 * Movimiento: la hoja sube al entrar a la pantalla (atada al scroll, `n-hoja`) y lo de adentro
 * (los filetes que se dibujan, las palabras de la cabecera, las notas) espera a que se vea para
 * empezar (`n-espera` + data-visto): son las mismas entradas de la página de Noticias. Las fotos
 * llegan con FotoNota. Con «reducir movimiento», quieto.
 */

export interface MuestraFoto {
    src: string;
    posicion?: string;
    previa?: string;
}

export interface DatosDiario {
    fechaHoy: string;
    /** «31 de octubre de 2026»: la fecha de la nota más nueva */
    ultima: string;
    ultimaIso: string;
    cifras: { cifra: number; texto: string }[];
    principal: DatosEditorial;
    recientes: DatosEditorial[];
    /** Cuántas notas hay en Noticias */
    cuantas: number;
    /** Tres fotos de otras notas, para el abanico del banner */
    muestras: MuestraFoto[];
}

const retraso = (segundos: number) => ({ '--n-retraso': `${segundos}s` }) as CSSProperties;

/** El banner al pie de la hoja: lleva a la sección completa */
function PortalNoticias({ href, cuantas, muestras }: { href: string; cuantas: number; muestras: MuestraFoto[] }) {
    const adentro = [`${cuantas} notas`, 'El problema en cifras', 'Las noticias en el mapa', 'Glosario y fuentes'];
    return (
        <div style={retraso(0.7)} className="n-sube mt-10 movil:mt-8">
            <Link
                href={href}
                data-vidrio=""
                className="n-portal group relative flex flex-wrap items-center gap-x-10 gap-y-7 overflow-hidden rounded-[28px] bg-simar-texto text-simar-papel px-10 py-9 shadow-[0_30px_60px_-34px_rgba(11,34,54,0.9)] focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-4 max-lg:px-8 movil:rounded-[22px] movil:px-5 movil:py-6 movil:gap-y-5"
            >
                {/* Un abanico de fotos de otras notas: se abre al pasar el cursor */}
                <span aria-hidden="true" className="n-portal-abanico relative w-[196px] h-[132px] flex-shrink-0 movil:w-[164px] movil:h-[108px]">
                    {muestras.slice(0, 3).map((m, i) => (
                        <span key={m.src} className="n-portal-carta absolute left-0 top-1 w-[118px] h-[124px] overflow-hidden rounded-[16px] ring-[3px] ring-simar-papel movil:w-[98px] movil:h-[102px]" style={{ '--i': i } as CSSProperties}>
                            <FotoNota src={m.src} alt="" posicion={m.posicion} previa={m.previa} sizes="118px" className="absolute! inset-0" />
                        </span>
                    ))}
                </span>

                <span className="flex-1 min-w-[min(100%,300px)]">
                    <span className="inline-flex items-center gap-2 text-[14px] font-extrabold uppercase tracking-[0.14em] text-simar-papel/70">
                        <Newspaper aria-hidden="true" className="w-[18px] h-[18px]" strokeWidth={2.2} />
                        Una sección entera
                    </span>
                    <span className="mt-2 block font-titular text-[clamp(30px,3vw,44px)] font-semibold leading-[1.04] tracking-[-0.02em] text-balance movil:text-[28px]">
                        Hay mucho más en Noticias del Mar
                    </span>
                    {/* Cada cosa con su punto (también la primera): al partirse en renglones, ninguno empieza suelto */}
                    <span className="mt-3 flex flex-wrap gap-x-5 gap-y-1 text-[17px] text-simar-papel/80 movil:text-[16px]">
                        {adentro.map((t) => (
                            <span key={t} className="inline-flex items-center gap-2">
                                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-simar-espuma" />
                                {t}
                            </span>
                        ))}
                    </span>
                </span>

                <span className="n-portal-boton inline-flex items-center gap-3 min-h-[64px] pl-8 pr-3 rounded-full bg-simar-espuma text-[#0B2236] text-[19px] font-extrabold whitespace-nowrap movil:w-full movil:justify-between movil:min-h-[58px] movil:pl-6 movil:text-[18px]">
                    Abrir la sección
                    <span className="w-11 h-11 rounded-full bg-[#0B2236] text-simar-espuma flex items-center justify-center transition-transform duration-500 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
                        <ArrowRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                    </span>
                </span>
            </Link>
        </div>
    );
}

export function NoticiasDiario({ datos, locale }: { datos: DatosDiario; locale: string }) {
    const hoja = useRef<HTMLDivElement>(null);
    // Las entradas salen del servidor en pausa (data-visto="no") y arrancan al verse la hoja. Antes
    // salían sin pausa: corrían mientras cargaba la página, fuera de la pantalla, y al llegar unas
    // veces ya habían terminado y otras se reanudaban a medias. Sin JavaScript no hay pausa
    // (globals.css, @media (scripting: enabled)).
    // El atributo se cambia directo en la hoja, sin estado de React: volver a dibujar toda la hoja
    // (cabecera, notas, banner) en el mismo cuadro en que arrancan sus entradas trababa la llegada.
    // React no lo vuelve a poner: para él siempre vale "no"
    useEffect(() => {
        const el = hoja.current;
        if (!el) return;
        const io = new IntersectionObserver(
            ([e]) => {
                el.dataset.visto = e.isIntersecting ? 'si' : 'no';
                if (e.isIntersecting) io.disconnect();
            },
            { threshold: 0.12 },
        );
        io.observe(el);
        return () => io.disconnect();
    }, []);
    const base = `/${locale}/noticias`;

    return (
        <div
            ref={hoja}
            data-visto="no"
            className="n-espera n-hoja relative rounded-[36px] bg-simar-papel text-simar-texto px-12 pt-10 pb-10 ring-1 ring-black/5 shadow-[0_50px_100px_-45px_rgba(0,0,0,0.75)] dark:bg-simar-superficie dark:ring-white/10 max-lg:px-8 movil:rounded-[24px] movil:px-5 movil:pt-6 movil:pb-5"
        >
            <CabeceraDiario
                nivel={2}
                compacta
                fechaHoy={datos.fechaHoy}
                cifras={datos.cifras}
                estado={
                    <>
                        <span className="inline-flex items-center gap-2">
                            <span aria-hidden="true" className="simar-en-vivo" />
                            <span>
                                Actualizado el <time dateTime={datos.ultimaIso}>{datos.ultima}</time>
                            </span>
                        </span>
                        <ContadorNuevas fechas={[datos.principal, ...datos.recientes].map((n) => n.fecha)} />
                    </>
                }
                // Desde arriba se ve que hay una sección completa
                accion={
                    <Link
                        href={base}
                        data-vidrio="claro"
                        className="simar-presiona group min-h-[54px] pl-5 pr-2 rounded-full inline-flex items-center gap-3 bg-simar-superficie ring-2 ring-simar-texto text-simar-texto text-[17px] font-extrabold dark:bg-simar-papel movil:min-h-[52px]"
                    >
                        <Newspaper aria-hidden="true" className="w-5 h-5" strokeWidth={2.2} />
                        Ver la sección completa
                        <span className="w-9 h-9 rounded-full bg-simar-texto text-simar-papel flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
                            <ArrowRight aria-hidden="true" className="w-[18px] h-[18px]" strokeWidth={2.4} />
                        </span>
                    </Link>
                }
            />
            <div className="mt-9 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_360px] gap-x-12 gap-y-10 movil:mt-6">
                <NotaPrincipal nota={datos.principal} locale={locale} nivel={3} />
                <LoUltimo notas={datos.recientes} locale={locale} nivel={3} id="noticias-lo-ultimo" verTodas={`${base}#todas`} />
            </div>

            <PortalNoticias href={base} cuantas={datos.cuantas} muestras={datos.muestras} />
            <RecordarVisita />
        </div>
    );
}

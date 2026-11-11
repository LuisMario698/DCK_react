'use client';

import { createElement, useState, type CSSProperties, type HTMLAttributes, type ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Pause, Play } from 'lucide-react';
import { textoCredito } from '@/lib/constants/fotos';
import { MarcaNueva, RecordarVisita } from '@/components/landing/MarcaNueva';
import { Cuando, TemaVersalitas, type DatosEditorial } from './TarjetaEditorial';
import { DibujoPortada } from './ilustraciones';
import { FotoNota } from './FotoNota';

/**
 * La portada de Noticias, como la de un periódico:
 *  - la cabecera: fecha y lugar, «Noticias del Mar» en letra de titular (Newsreader), la línea de
 *    qué es y los números; entre filetes que se dibujan al cargar;
 *  - «Al momento»: una cinta con los titulares más nuevos (de SiMAR y de otros medios, que abren su
 *    nota original); se detiene al pasar el cursor, al enfocarla o con su botón, y con «reducir
 *    movimiento» es una fila que se desliza a mano;
 *  - la nota principal con su foto grande (se descubre al cargar y se mueve un poco al bajar) y su
 *    crédito, y «Lo último» con las cuatro siguientes.
 * Las entradas son CSS (n-filete, n-palabra, n-sube, n-descubre-ya, n-acerca-ya en globals.css): se
 * ven desde el primer cuadro, sin esperar a que cargue JavaScript (lo primero que se lee de un medio
 * no puede llegar tarde). La foto principal se mueve un poco al bajar con CSS atado al scroll
 * (`n-paralaje`, sin JavaScript). Con «reducir movimiento», todo quieto. Las fotos llegan con FotoNota (difuminadas al instante; se enfocan al llegar).
 *
 * Sus piezas (CabeceraDiario, NotaPrincipal, LoUltimo) también arman las noticias de la landing
 * (components/landing/NoticiasDiario.tsx), con los títulos un nivel más abajo (`nivel`).
 */

/** Un título h1…h6 según el nivel de la página (la cabecera de Noticias es h1; en la landing, h2) */
function Encabezado({ nivel, children, ...resto }: { nivel: number; children: ReactNode } & HTMLAttributes<HTMLHeadingElement>) {
    return createElement(`h${Math.min(6, Math.max(1, nivel))}`, resto, children);
}

export interface ItemTeletipo {
    titulo: string;
    url: string;
    /** «SiMAR», «Mongabay Latam»… */
    fuente: string;
    externa: boolean;
}

export interface DatosPortada {
    /** «Jueves 5 de noviembre de 2026» */
    fechaHoy: string;
    /** «13:45» (hora del puerto en que se leyeron los otros medios) */
    actualizado: string | null;
    cifras: { cifra: number; texto: string }[];
    principal: DatosEditorial;
    recientes: DatosEditorial[];
    teletipo: ItemTeletipo[];
}

/** El retraso de una entrada de CSS, en segundos */
const retraso = (segundos: number) => ({ '--n-retraso': `${segundos}s` }) as CSSProperties;

/** Un filete que se dibuja de izquierda a derecha */
function Filete({ grueso = false, espera = 0 }: { grueso?: boolean; espera?: number }) {
    return (
<span aria-hidden="true" className={`n-filete block bg-simar-texto ${grueso ? 'h-[3px]' : 'h-px'}`} style={retraso(espera)} />
    );
}

/**
 * La cabecera del periódico. `estado` va a la derecha de la fecha («Actualizado a las 13:45 h»);
 * `nivel` 1 en Noticias (h1) y 2 en la landing (h2, `compacta`: un poco más chica). `accion` va junto
 * a las cifras (en la landing, el botón a la sección completa).
 */
export function CabeceraDiario({
    fechaHoy,
    estado,
    cifras,
    accion,
    nivel = 1,
    id = 'noticias-titulo',
    compacta = false,
}: {
    fechaHoy: string;
    estado?: ReactNode;
    cifras: DatosPortada['cifras'];
    accion?: ReactNode;
    nivel?: number;
    id?: string;
    compacta?: boolean;
}) {
    const palabras: { texto: string; italica?: boolean }[] = [{ texto: 'Noticias' }, { texto: 'del', italica: true }, { texto: 'Mar' }];
    return (
        <header>
            <Filete grueso />
            <div
                style={retraso(0.1)}
                className="n-sube mt-3 flex flex-wrap items-center justify-between gap-x-6 gap-y-2 text-[14px] font-extrabold uppercase tracking-[0.12em] text-simar-texto-2 movil:text-[13px] movil:tracking-[0.08em]"
            >
                <span>
                    {fechaHoy}
                    <span className="movil:hidden"> · Puerto Peñasco, Sonora</span>
                </span>
                {estado && <span className="inline-flex flex-wrap items-center gap-x-4 gap-y-2 normal-case tracking-normal text-[15px] font-bold">{estado}</span>}
            </div>

            <Encabezado
                nivel={nivel}
                id={id}
                className={`mt-4 font-titular font-semibold leading-[0.9] tracking-[-0.035em] text-simar-texto movil:mt-3 ${
                    compacta ? 'text-[clamp(56px,7.4vw,112px)] movil:text-[50px]' : 'text-[clamp(60px,9.2vw,138px)] movil:text-[54px]'
                }`}
            >
                {palabras.map((p, i) => (
                    <span key={p.texto} className="inline-block overflow-hidden -mt-[0.18em] pt-[0.18em] pb-[0.1em] -mb-[0.02em] pr-[0.08em] -mr-[0.08em] align-bottom">
                        <span className={`n-palabra inline-block ${p.italica ? 'italic font-normal' : ''}`} style={retraso(0.15 + i * 0.09)}>
                            {p.texto}
                        </span>
                        {i < palabras.length - 1 && ' '}
                    </span>
                ))}
            </Encabezado>

            <div style={retraso(0.38)} className="n-sube mt-4 mb-4 flex flex-wrap items-end justify-between gap-x-10 gap-y-4 movil:mt-3"
            >
                <p className="max-w-[620px] text-[21px] leading-relaxed text-simar-texto-2 text-pretty movil:text-[18px]">
                    El Alto Golfo de California y los océanos, contados con sus fuentes. Por SiMAR, desde Puerto Peñasco.
                </p>
                <div className="flex flex-wrap items-end gap-x-9 gap-y-4">
                    <dl className="flex gap-7 movil:gap-5">
                        {cifras.map((c) => (
                            <div key={c.texto} className="flex flex-col-reverse">
                                <dt className="text-[14px] font-bold uppercase tracking-[0.1em] text-simar-texto-2">{c.texto}</dt>
                                <dd className="font-titular text-[38px] font-semibold leading-none tabular-nums movil:text-[32px]">{c.cifra}</dd>
                            </div>
                        ))}
                    </dl>
                    {accion}
                </div>
            </div>
            <Filete espera={0.2} />
            <span aria-hidden="true" className="block h-[3px]" />
            <Filete espera={0.3} />
        </header>
    );
}

/** La cinta de titulares. Va dos veces seguida para que dé la vuelta sin salto (la copia, oculta al lector) */
function Teletipo({ items }: { items: ItemTeletipo[] }) {
    const [pausa, setPausa] = useState(false);
    if (items.length === 0) return null;
    return (
        <div
            style={retraso(0.5)}
            role="region"
            aria-label="Al momento: los titulares más nuevos"
            className="n-sube mt-5 flex items-center gap-2 rounded-full bg-simar-superficie ring-1 ring-simar-borde p-1.5 movil:mt-4"
        >
            <span className="flex-shrink-0 inline-flex items-center gap-2.5 min-h-[44px] px-5 rounded-full bg-simar-texto text-simar-papel text-[14px] font-extrabold uppercase tracking-[0.12em] movil:px-3.5 movil:text-[12px]">
                <span aria-hidden="true" className="simar-en-vivo" />
                Al momento
            </span>
            <div className={`n-teletipo relative flex-1 min-w-0 overflow-hidden ${pausa ? 'n-teletipo-pausa' : ''}`} style={{ '--n-dura': `${items.length * 8}s` } as CSSProperties}>
                <ul className="n-teletipo-cinta flex w-max">
                    {[...items, ...items].map((it, i) => {
                        const copia = i >= items.length;
                        return (
                            <li key={i} aria-hidden={copia || undefined} className="flex items-center">
                                <a
                                    href={it.url}
                                    {...(it.externa ? { target: '_blank', rel: 'noopener noreferrer' } : {})}
                                    tabIndex={copia ? -1 : undefined}
                                    className="inline-flex items-center gap-3 min-h-[44px] px-5 text-[17px] font-semibold whitespace-nowrap text-simar-texto hover:text-simar-marea-tinta transition-colors"
                                >
                                    <span className="text-[13px] font-extrabold uppercase tracking-[0.1em] text-simar-texto-2">{it.fuente}</span>
                                    {it.titulo}
                                    {it.externa && <span className="sr-only">(abre en otra pestaña)</span>}
                                </a>
                                <span aria-hidden="true" className="w-1.5 h-1.5 rounded-full bg-simar-borde" />
                            </li>
                        );
                    })}
                </ul>
            </div>
            <button
                type="button"
                onClick={() => setPausa((p) => !p)}
                aria-pressed={pausa}
                aria-label={pausa ? 'Mover los titulares' : 'Detener los titulares'}
                className="n-teletipo-boton flex-shrink-0 w-11 h-11 rounded-full inline-flex items-center justify-center text-simar-texto-2 hover:bg-simar-texto/5 hover:text-simar-texto active:scale-95 transition cursor-pointer"
            >
                {pausa ? <Play aria-hidden="true" className="w-[18px] h-[18px]" /> : <Pause aria-hidden="true" className="w-[18px] h-[18px]" />}
            </button>
        </div>
    );
}

/** El crédito de una foto, con enlace a su página (autor y licencia) */
export function CreditoDeFoto({ nota, className = '' }: { nota: DatosEditorial; className?: string }) {
    if (!nota.imagen) return null;
    const c = nota.imagen.credito;
    return (
        <p className={`text-[14px] leading-snug text-simar-texto-2 ${className}`}>
            {c ? (
                <a href={c.pagina} target="_blank" rel="noopener noreferrer" className="hover:text-simar-texto hover:underline">
                    {textoCredito(c)}
                    <span className="sr-only"> (abre en otra pestaña)</span>
                </a>
            ) : (
                'Foto: SiMAR'
            )}
        </p>
    );
}

/** La nota principal: su foto grande (se descubre y se mueve un poco al bajar) y su titular */
export function NotaPrincipal({ nota, locale, nivel = 2 }: { nota: DatosEditorial; locale: string; nivel?: number }) {
    const href = `/${locale}/noticias/${nota.slug}`;

    return (
        <article className="group relative">
            <figure>
                <Link href={href} tabIndex={-1} aria-hidden="true" className="block">
                    {/* El marco recorta; adentro, la foto se descubre de arriba abajo con dos traslados
                        opuestos (n-descubre-ya y su contra: ver globals.css), sin clip-path */}
                    <div className="relative aspect-[16/10] overflow-clip rounded-[20px] movil:aspect-[4/3] movil:rounded-[16px]">
                        <div className="n-descubre-ya absolute inset-0 bg-simar-abismo">
                            <div className="n-descubre-ya-contra absolute inset-0">
                                <div className="n-paralaje absolute inset-x-0 -top-[6%] h-[112%]">
                                    <div className="n-acerca-ya absolute inset-0">
                                        <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.035]">
                                            {nota.imagen ? (
                                                <FotoNota
                                                    src={nota.imagen.src}
                                                    alt={nota.imagen.alt}
                                                    posicion={nota.imagen.posicion}
                                                    previa={nota.previa}
                                                    prioridad={nivel === 2}
                                                    sizes="(min-width: 1024px) 800px, 100vw"
                                                    className="absolute! inset-0"
                                                />
                                            ) : (
                                                <DibujoPortada tipo={nota.ilustracion} />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                {/* Sin backdrop-filter: la foto se mueve debajo al bajar y el desenfoque se
                                    recalculaba en cada cuadro (con 95 % de fondo no se notaba) */}
                                <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-simar-superficie/95 px-3.5 py-1.5 text-[14px] font-extrabold text-simar-texto movil:left-3 movil:top-3">
                                    <span aria-hidden="true" className="simar-en-vivo" />
                                    Lo más reciente
                                </span>
                            </div>
                        </div>
                    </div>
                </Link>
                <figcaption className="mt-2.5 flex justify-end">
                    <CreditoDeFoto nota={nota} />
                </figcaption>
            </figure>

            <div style={retraso(0.55)} className="n-sube mt-3">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                    <MarcaNueva fecha={nota.fecha} />
                    <TemaVersalitas categoria={nota.categoria} />
                </div>
                <Encabezado
                    nivel={nivel}
                    className="mt-3 font-titular text-[clamp(36px,3.7vw,56px)] font-semibold leading-[1.03] tracking-[-0.022em] text-balance movil:text-[32px] movil:leading-[1.08]"
                >
                    <Link href={href} className="rounded-sm focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-4">
                        <span className="n-subraya">{nota.titulo}</span>
                    </Link>
                </Encabezado>
                <p className="mt-4 max-w-[64ch] text-[20px] leading-relaxed text-simar-texto-2 text-pretty movil:text-[18px]">{nota.resumen}</p>
                <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2">
                    <span className="text-[15px] font-extrabold text-simar-texto">Redacción SiMAR</span>
                    <Cuando nota={nota} />
                    <span className="text-[15px] font-semibold text-simar-texto-2">{nota.minutos} min de lectura</span>
                </div>
            </div>
        </article>
    );
}

/** «Lo último»: las cuatro siguientes, numeradas, con su foto chica. `verTodas`: a dónde lleva «Ver todas» */
export function LoUltimo({
    notas,
    locale,
    nivel = 2,
    id = 'mas-reciente-titulo',
    verTodas = '#todas',
}: {
    notas: DatosEditorial[];
    locale: string;
    nivel?: number;
    id?: string;
    verTodas?: string;
}) {
    return (
        <aside aria-labelledby={id}>
            <div className="flex items-center justify-between gap-4 border-b-2 border-simar-texto pb-3">
                <Encabezado nivel={nivel} id={id} className="text-[15px] font-extrabold uppercase tracking-[0.14em]">
                    Lo último
                </Encabezado>
                <a href={verTodas} className="inline-flex items-center gap-1.5 min-h-[44px] text-[16px] font-bold text-simar-marea-tinta hover:underline">
                    Ver todas
                    <ArrowRight aria-hidden="true" className="w-4 h-4" />
                </a>
            </div>
            <ol>
                {notas.map((n, i) => (
                    <li key={n.slug} style={retraso(0.6 + i * 0.07)} className="n-sube border-b border-simar-borde last:border-b-0">
                        <article className="group relative grid grid-cols-[34px_minmax(0,1fr)_92px] gap-4 py-5 movil:grid-cols-[minmax(0,1fr)_84px] movil:gap-3">
                            <span aria-hidden="true" className="font-titular text-[30px] italic leading-none text-simar-texto-3 tabular-nums movil:hidden">
                                {i + 1}
                            </span>
                            <div className="min-w-0">
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                    <MarcaNueva fecha={n.fecha} />
                                    <TemaVersalitas categoria={n.categoria} />
                                </div>
                                <Encabezado nivel={nivel + 1} className="mt-1.5 font-titular text-[22px] font-semibold leading-[1.15] tracking-[-0.01em] text-pretty movil:text-[20px]">
                                    <Link
                                        href={`/${locale}/noticias/${n.slug}`}
                                        className="after:absolute after:inset-0 after:rounded-[12px] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-simar-golfo"
                                    >
                                        <span className="n-subraya">{n.titulo}</span>
                                    </Link>
                                </Encabezado>
                                <span className="mt-2 block">
                                    <Cuando nota={n} />
                                </span>
                            </div>
                            <div className="relative w-[92px] h-[92px] overflow-hidden rounded-[14px] bg-simar-abismo movil:w-[84px] movil:h-[84px]">
                                <div className="absolute inset-0 transition-transform duration-700 group-hover:scale-[1.06]">
                                    {n.imagen ? (
                                        <FotoNota src={n.imagen.src} alt="" posicion={n.imagen.posicion} previa={n.previa} sizes="92px" className="absolute! inset-0" />
                                    ) : (
                                        <DibujoPortada tipo={n.ilustracion} />
                                    )}
                                </div>
                            </div>
                        </article>
                    </li>
                ))}
            </ol>
        </aside>
    );
}

export function PortadaEditorial({ datos, locale }: { datos: DatosPortada; locale: string }) {
    return (
        <section id="portada" aria-labelledby="noticias-titulo" className="scroll-mt-[164px] px-6 pt-8 pb-20 md:pt-10 md:pb-24 movil:scroll-mt-[136px] movil:px-5 movil:pt-5 movil:pb-14">
            <div className="max-w-[1248px] mx-auto">
                <CabeceraDiario
                    fechaHoy={datos.fechaHoy}
                    cifras={datos.cifras}
                    estado={
                        datos.actualizado && (
                            <span className="inline-flex items-center gap-2">
                                <span aria-hidden="true" className="simar-en-vivo" />
                                Actualizado a las {datos.actualizado} h
                            </span>
                        )
                    }
                />
                <Teletipo items={datos.teletipo} />
                <div className="mt-9 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-x-12 gap-y-10 movil:mt-6">
                    <NotaPrincipal nota={datos.principal} locale={locale} />
                    <LoUltimo notas={datos.recientes} locale={locale} />
                </div>
            </div>
            <RecordarVisita />
        </section>
    );
}

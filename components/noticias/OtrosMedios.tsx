'use client';

import { useState, type CSSProperties, type KeyboardEvent } from 'react';
import { AnimatePresence, LazyMotion, MotionConfig, type Variants } from 'motion/react';
import * as m from 'motion/react-m';
import { ArrowUpRight, MapPin } from 'lucide-react';
import { useIndicador } from './useIndicador';
import { useAjustesLectura } from './ajustesLectura';

/**
 * «Otros medios»: lo que publican sobre el mar medios con licencia abierta (lib/services/
 * noticias_externas.ts). Cada tarjeta es el titular, el resumen de su propio canal, el medio, el
 * autor y la fecha, y abre la nota original en otra pestaña. Pestañas por medio (con la píldora que
 * se desliza); al cambiar, las tarjetas se reacomodan (Motion, layout). Abajo, quién es cada medio y
 * su licencia. Lo de México va marcado.
 */

export interface MedioLigero {
    id: string;
    nombre: string;
    sitio: string;
    descripcion: string;
    licencia: string;
    licenciaUrl: string;
}

export interface NotaExternaLigera {
    url: string;
    titulo: string;
    resumen: string;
    fecha: string;
    /** «Hace 3 h», «Ayer», «Hace 4 días» (con la hora del servidor al leerla) */
    cuando: string;
    fechaTexto: string;
    fuente: string;
    autor?: string;
    deMexico: boolean;
}

/** El color de cada medio (sólo tokens de SiMAR) */
const COLOR: Record<string, string> = {
    mongabay: 'bg-simar-arrecife',
    sinc: 'bg-simar-golfo',
    onu: 'bg-simar-marea',
    conversation: 'bg-simar-aceite',
};

const rasgos = () => import('motion/react').then((mod) => mod.domMax);
const FRENA = [0.22, 1, 0.36, 1] as const;

const entra: Variants = {
    oculto: { opacity: 0, y: 28 },
    visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { duration: 0.7, ease: FRENA, delay: Math.min(i, 6) * 0.06 } }),
    sale: { opacity: 0, scale: 0.96, transition: { duration: 0.2 } },
};

function Tarjeta({ nota, medio, destacada, indice }: { nota: NotaExternaLigera; medio: MedioLigero; destacada: boolean; indice: number }) {
    return (
        <m.li
            layout
            variants={entra}
            initial="oculto"
            whileInView="visible"
            viewport={{ once: true, margin: '0px 0px -60px 0px' }}
            exit="sale"
            custom={indice}
            className={`flex ${destacada ? 'md:col-span-2' : ''}`}
        >
            <article className="simar-tarjeta-accion group relative flex w-full flex-col rounded-[24px] bg-simar-superficie ring-1 ring-simar-borde shadow-simar p-7 movil:rounded-[20px] movil:p-5">
                <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
                    <span className="inline-flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.1em] text-simar-texto">
                        <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] ${COLOR[medio.id] ?? 'bg-simar-texto-2'}`} />
                        {medio.nombre}
                    </span>
                    {nota.deMexico && (
                        <span className="inline-flex items-center gap-1 rounded-full bg-simar-marea-suave px-2.5 py-0.5 text-[13px] font-extrabold text-simar-marea-tinta">
                            <MapPin aria-hidden="true" className="w-3.5 h-3.5" />
                            México
                        </span>
                    )}
                </div>
                <h3
                    className={`mt-4 font-titular font-semibold tracking-[-0.015em] text-pretty text-simar-texto ${
                        destacada ? 'text-[clamp(30px,2.9vw,42px)] leading-[1.06] max-w-[28ch]' : 'text-[24px] leading-[1.15] movil:text-[21px]'
                    }`}
                >
                    <a
                        href={nota.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="after:absolute after:inset-0 after:rounded-[24px] focus-visible:outline-none focus-visible:after:outline-3 focus-visible:after:outline-simar-golfo"
                    >
                        <span className="n-subraya">{nota.titulo}</span>
                        <span className="sr-only"> (abre en {medio.nombre}, en otra pestaña)</span>
                    </a>
                </h3>
                {nota.resumen && (
                    <p className={`mt-3 text-simar-texto-2 text-pretty ${destacada ? 'max-w-[62ch] text-[19px] leading-relaxed line-clamp-3 movil:text-[17px]' : 'text-[17px] leading-relaxed line-clamp-4'}`}>
                        {nota.resumen}
                    </p>
                )}
                <div className="mt-auto pt-5 flex flex-wrap items-end justify-between gap-3">
                    <p className="text-[15px] leading-snug text-simar-texto-2">
                        {nota.autor && <span className="block font-bold text-simar-texto">{nota.autor}</span>}
                        <time dateTime={nota.fecha} title={nota.fechaTexto}>
                            {nota.cuando}
                        </time>
                    </p>
                    <span className="inline-flex items-center gap-1.5 text-[15px] font-extrabold text-simar-marea-tinta">
                        Leer en {medio.nombre}
                        <ArrowUpRight aria-hidden="true" className="w-[18px] h-[18px] transition-transform duration-300 group-hover:translate-x-0.5 group-hover:-translate-y-0.5" />
                    </span>
                </div>
            </article>
        </m.li>
    );
}

export function OtrosMedios({ notas, medios, actualizado }: { notas: NotaExternaLigera[]; medios: MedioLigero[]; actualizado: string | null }) {
    const quieto = useAjustesLectura().movimiento === 'quieto';
    const [medio, setMedio] = useState<string | null>(null);
    const pestanas = useIndicador<HTMLDivElement>(medio);
    const conNotas = medios.filter((md) => notas.some((n) => n.fuente === md.id));
    const opciones = [{ id: null as string | null, nombre: 'Todos', cuantas: notas.length }, ...conNotas.map((md) => ({ id: md.id as string | null, nombre: md.nombre, cuantas: notas.filter((n) => n.fuente === md.id).length }))];
    const activa = Math.max(0, opciones.findIndex((o) => o.id === medio));
    const visibles = medio ? notas.filter((n) => n.fuente === medio) : notas;
    const porId = Object.fromEntries(medios.map((md) => [md.id, md]));

    const alTeclear = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const n = opciones.length;
        const destino = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (destino === undefined) return;
        e.preventDefault();
        setMedio(opciones[destino].id);
        (e.currentTarget.parentElement?.children[destino + 1] as HTMLElement | undefined)?.focus();
    };

    return (
        <LazyMotion features={rasgos} strict>
            <MotionConfig reducedMotion={quieto ? 'always' : 'user'}>
                <div className="mt-8 flex flex-wrap items-center justify-between gap-4 movil:mt-6">
                    <div className="max-w-full overflow-x-auto [scrollbar-width:none] rounded-full bg-simar-superficie ring-1 ring-simar-borde p-1.5">
                        <div ref={pestanas} role="tablist" aria-label="Medios" className="n-sin-medir relative inline-flex gap-1" style={{ '--n-y': '0px' } as CSSProperties}>
                            <span aria-hidden="true" className="n-indicador bg-simar-texto" />
                            {opciones.map((o, i) => {
                                const elegida = i === activa;
                                return (
                                    <button
                                        key={o.nombre}
                                        type="button"
                                        role="tab"
                                        aria-selected={elegida}
                                        tabIndex={elegida ? 0 : -1}
                                        data-activo={elegida}
                                        onClick={() => setMedio(o.id)}
                                        onKeyDown={(e) => alTeclear(e, i)}
                                        className={`relative flex-shrink-0 min-h-[46px] px-[18px] rounded-full inline-flex items-center gap-2 text-[16px] font-bold whitespace-nowrap cursor-pointer transition-colors duration-300 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-simar-marea focus-visible:outline-offset-2 ${
                                            elegida ? 'text-simar-papel' : 'text-simar-texto-2 hover:text-simar-texto'
                                        }`}
                                    >
                                        {o.id && <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] ${COLOR[o.id]}`} />}
                                        {o.nombre}
                                        <span className={`text-[13px] font-extrabold tabular-nums ${elegida ? 'opacity-60' : 'text-simar-texto-3'}`}>{o.cuantas}</span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                    {actualizado && (
                        <p className="inline-flex items-center gap-2 text-[15px] font-bold text-simar-texto-2">
                            <span aria-hidden="true" className="simar-en-vivo" />
                            Se revisan cada hora · última, {actualizado} h
                        </p>
                    )}
                </div>

                <ul className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 movil:gap-4">
                    <AnimatePresence mode="popLayout" initial={false}>
                        {visibles.map((n, i) => (
                            <Tarjeta key={n.url} nota={n} medio={porId[n.fuente]} destacada={i === 0 && visibles.length > 2} indice={i} />
                        ))}
                    </AnimatePresence>
                </ul>

                {/* Quién es cada medio y con qué licencia se muestra */}
                <div className="mt-10 border-t border-simar-borde pt-6 movil:mt-8">
                    <p className="text-[15px] font-extrabold uppercase tracking-[0.12em] text-simar-texto-2">De dónde salen</p>
                    <ul className="mt-4 grid sm:grid-cols-2 lg:grid-cols-4 gap-x-8 gap-y-5">
                        {conNotas.map((md) => (
                            <li key={md.id}>
                                <a href={md.sitio} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-[17px] font-extrabold hover:text-simar-marea-tinta hover:underline">
                                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-[3px] ${COLOR[md.id]}`} />
                                    {md.nombre}
                                    <span className="sr-only">(abre en otra pestaña)</span>
                                </a>
                                <p className="mt-1 text-[15px] leading-snug text-simar-texto-2">{md.descripcion}.</p>
                                <a href={md.licenciaUrl} target="_blank" rel="noopener noreferrer" className="mt-1 inline-block text-[14px] font-bold text-simar-texto-2 underline decoration-simar-borde underline-offset-4 hover:text-simar-texto">
                                    Licencia: {md.licencia}
                                    <span className="sr-only"> (abre en otra pestaña)</span>
                                </a>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 max-w-3xl text-[15px] leading-relaxed text-simar-texto-2">
                        Mostramos el titular y el resumen que cada medio publica en su canal, con su autor y un enlace a la nota completa. Las notas y sus fotos son de sus autores.
                    </p>
                </div>
            </MotionConfig>
        </LazyMotion>
    );
}

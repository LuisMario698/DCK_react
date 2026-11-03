'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { moverConTeclas } from './pestanas';

export interface Hito {
    fecha: string;
    titulo: string;
    texto: string;
    articulo?: string;
}

/** «Octubre de 2015» → { mes: 'Oct.', anio: '2015' }; «2000» → { anio: '2000' } */
function partes(fecha: string) {
    const m = fecha.match(/^(\S+) de (\d{4})$/);
    return m ? { mes: `${m[1].slice(0, 3)}.`, anio: m[2] } : { mes: null, anio: fecha };
}

/**
 * La historia del proyecto, un paso a la vez: una línea con los años (se tocan o se recorren con
 * Anterior y Siguiente) y, abajo, lo que pasó ese año. La línea se llena hasta el año elegido.
 */
export function HistoriaProyecto({ hitos, locale }: { hitos: Hito[]; locale: string }) {
    const [elegido, setElegido] = useState(0);
    const h = hitos[elegido];
    const total = hitos.length;
    const boton =
        'simar-presiona min-h-[52px] px-5 rounded-full border-2 border-simar-campo-borde inline-flex items-center gap-2 text-[17px] font-bold transition-colors cursor-pointer hover:bg-simar-texto/5 disabled:opacity-40 disabled:cursor-default disabled:hover:bg-transparent movil:min-h-[48px] movil:px-4 movil:text-[16px]';

    return (
        <div>
            <div className="relative">
                {/* La línea va del centro del primer año al del último */}
                <div aria-hidden="true" className="absolute top-[27px] h-1 rounded-full bg-simar-borde" style={{ left: `${50 / total}%`, right: `${50 / total}%` }}>
                    <div className="h-full rounded-full bg-simar-marea transition-[width] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]" style={{ width: `${(elegido / (total - 1)) * 100}%` }} />
                </div>
                <div role="tablist" aria-label="La historia de SiMAR, año por año" className="relative grid" style={{ gridTemplateColumns: `repeat(${total}, minmax(0, 1fr))` }}>
                    {hitos.map((hito, i) => {
                        const activo = i === elegido;
                        const { mes, anio } = partes(hito.fecha);
                        return (
                            <button
                                key={hito.titulo}
                                type="button"
                                role="tab"
                                id={`hito-${i}`}
                                aria-selected={activo}
                                aria-controls="hito-panel"
                                aria-label={`${hito.fecha}: ${hito.titulo}`}
                                tabIndex={activo ? 0 : -1}
                                onClick={() => setElegido(i)}
                                onKeyDown={(e) => moverConTeclas(e, i, total, setElegido)}
                                className="group flex flex-col items-center pt-[17px] pb-2 min-h-[96px] rounded-[16px] cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-golfo"
                            >
                                <span
                                    aria-hidden="true"
                                    className={`w-6 h-6 rounded-full border-[3px] transition-[transform,background-color,border-color,box-shadow] duration-300 ${
                                        i <= elegido ? 'bg-simar-marea border-simar-marea' : 'bg-simar-superficie border-simar-campo-borde group-hover:border-simar-marea'
                                    } ${activo ? 'scale-125 shadow-[0_0_0_6px_var(--simar-marea-suave)]' : ''}`}
                                />
                                <span aria-hidden="true" className={`mt-3 text-[18px] font-extrabold tabular-nums leading-none movil:text-[15px] ${activo ? 'text-simar-marea-tinta' : 'text-simar-texto'}`}>
                                    {anio}
                                </span>
                                {mes && (
                                    <span aria-hidden="true" className="mt-1 text-[15px] font-semibold text-simar-texto-2 movil:text-[13px]">
                                        {mes}
                                    </span>
                                )}
                            </button>
                        );
                    })}
                </div>
            </div>

            <div
                key={elegido}
                role="tabpanel"
                id="hito-panel"
                aria-labelledby={`hito-${elegido}`}
                className="simar-aparece relative isolate overflow-hidden mt-4 rounded-[28px] bg-simar-superficie border border-simar-borde shadow-simar p-6 md:p-8 movil:rounded-[22px] movil:p-5"
            >
                {/* El año, enorme y tenue, de fondo */}
                <span
                    aria-hidden="true"
                    className="absolute -z-10 right-6 -bottom-6 text-[clamp(96px,14vw,200px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums text-simar-texto/[0.06] select-none movil:hidden"
                >
                    {partes(h.fecha).anio}
                </span>
                <p className="text-[15px] font-bold text-simar-marea-tinta">
                    {h.fecha} · {elegido + 1} de {total}
                </p>
                <h4 className="mt-2 text-[28px] font-extrabold leading-[1.15] tracking-[-0.015em] movil:text-[22px]">{h.titulo}</h4>
                <p className="mt-2 max-w-[60ch] text-[18px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{h.texto}</p>
                <div className="mt-6 flex flex-wrap items-center gap-3 movil:mt-5">
                    <button type="button" className={boton} onClick={() => setElegido(elegido - 1)} disabled={elegido === 0} aria-label="Año anterior">
                        <ArrowLeft aria-hidden="true" className="w-5 h-5" />
                        <span className="max-sm:hidden">Anterior</span>
                    </button>
                    <button type="button" className={boton} onClick={() => setElegido(elegido + 1)} disabled={elegido === total - 1} aria-label="Año siguiente">
                        <span className="max-sm:hidden">Siguiente</span>
                        <ArrowRight aria-hidden="true" className="w-5 h-5" />
                    </button>
                    {h.articulo && (
                        <Link
                            href={`/${locale}/noticias/${h.articulo}`}
                            className="ml-auto min-h-[52px] px-5 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold inline-flex items-center gap-2 transition-colors movil:ml-0 movil:min-h-[48px] movil:text-[16px]"
                        >
                            Leer la noticia
                            <ArrowRight aria-hidden="true" className="w-5 h-5" />
                        </Link>
                    )}
                </div>
            </div>
        </div>
    );
}

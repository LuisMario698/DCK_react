'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

export interface Hito {
    fecha: string;
    titulo: string;
    texto: string;
    articulo?: string;
}

/** «Octubre de 2015» → { anio: '2015' }; «2000» → { anio: '2000' } */
function partes(fecha: string) {
    const m = fecha.match(/(\d{4})$/);
    return { anio: m ? m[1] : fecha };
}

/**
 * La historia del proyecto en una línea de tiempo que se llena al bajar: todo a la vista, sin
 * clics. Cada año se enciende cuando la línea llega a él. En computadora los años van de un lado
 * y lo que pasó del otro, en zigzag; en celular, todo a la derecha de la línea.
 */
export function HistoriaProyecto({ hitos, locale }: { hitos: Hito[]; locale: string }) {
    const lista = useRef<HTMLOListElement>(null);
    const relleno = useRef<HTMLDivElement>(null);
    const puntos = useRef<(HTMLSpanElement | null)[]>([]);
    const [encendidos, setEncendidos] = useState(0);

    useEffect(() => {
        let cuadro = 0;
        const medir = () => {
            cuadro = 0;
            const ol = lista.current;
            if (!ol) return;
            const linea = window.innerHeight * 0.62;
            const r = ol.getBoundingClientRect();
            const avance = Math.min(1, Math.max(0, (linea - r.top) / r.height));
            if (relleno.current) relleno.current.style.transform = `scaleY(${avance})`;
            setEncendidos(puntos.current.filter((p) => p && p.getBoundingClientRect().top <= linea).length);
        };
        const pedir = () => {
            if (!cuadro) cuadro = requestAnimationFrame(medir);
        };
        medir();
        window.addEventListener('scroll', pedir, { passive: true });
        window.addEventListener('resize', pedir);
        return () => {
            window.removeEventListener('scroll', pedir);
            window.removeEventListener('resize', pedir);
            cancelAnimationFrame(cuadro);
        };
    }, []);

    return (
        <ol ref={lista} className="relative">
            {/* La línea, que se llena con el scroll */}
            <div aria-hidden="true" className="absolute top-3 bottom-3 left-[18px] w-1 rounded-full bg-simar-borde overflow-hidden md:left-1/2 md:-ml-0.5">
                <div ref={relleno} className="h-full w-full origin-top rounded-full bg-gradient-to-b from-simar-golfo to-simar-marea" style={{ transform: 'scaleY(0)' }} />
            </div>
            {hitos.map((h, i) => {
                const encendido = i < encendidos;
                const izquierda = i % 2 === 0;
                const { anio } = partes(h.fecha);
                return (
                    <li key={h.titulo} className="relative grid grid-cols-1 md:grid-cols-2 md:gap-x-20 pl-14 pb-8 last:pb-0 md:pl-0 md:pb-12 movil:pl-12">
                        <span
                            ref={(el) => {
                                puntos.current[i] = el;
                            }}
                            aria-hidden="true"
                            className={`absolute left-[8px] top-4 w-6 h-6 rounded-full border-4 transition-[background-color,border-color,box-shadow,transform] duration-500 md:left-1/2 md:-ml-3 md:top-8 ${
                                encendido ? 'bg-simar-marea border-simar-marea shadow-[0_0_0_7px_var(--simar-marea-suave)] scale-110' : 'bg-simar-superficie border-simar-campo-borde'
                            }`}
                        />
                        {/* El año, grande, del otro lado (en computadora) */}
                        <p
                            aria-hidden="true"
                            className={`max-md:hidden self-start pt-3 text-[clamp(56px,6vw,92px)] font-extrabold leading-none tracking-[-0.05em] tabular-nums transition-colors duration-500 ${
                                izquierda ? 'md:col-start-2 md:row-start-1' : 'md:col-start-1 md:row-start-1 md:text-right'
                            } ${encendido ? 'text-simar-marea-tinta' : 'text-simar-texto/15'}`}
                        >
                            {anio}
                        </p>
                        <div
                            className={`t3-enfoca rounded-[26px] bg-simar-superficie border p-6 md:p-7 transition-[border-color,box-shadow] duration-500 movil:rounded-[20px] movil:p-5 ${
                                izquierda ? 'md:col-start-1 md:row-start-1' : 'md:col-start-2 md:row-start-1'
                            } ${encendido ? 'border-simar-campo-borde shadow-simar' : 'border-simar-borde'}`}
                        >
                            <p className="text-[17px] font-extrabold text-simar-marea-tinta tabular-nums movil:text-[15px]">
                                {h.fecha}
                            </p>
                            <h4 className="mt-1.5 text-[26px] font-extrabold leading-[1.15] tracking-[-0.015em] movil:text-[21px]">{h.titulo}</h4>
                            <p className="mt-2 text-[18px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{h.texto}</p>
                            {h.articulo && (
                                <Link
                                    href={`/${locale}/noticias/${h.articulo}`}
                                    className="group mt-4 min-h-[52px] px-5 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold inline-flex items-center gap-2 transition-colors movil:min-h-[48px] movil:text-[16px]"
                                >
                                    Leer la noticia
                                    <ArrowRight aria-hidden="true" className="w-5 h-5 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            )}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

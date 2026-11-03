'use client';

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { Globe2, Landmark, MapPin } from 'lucide-react';
import type { ResumenNoticia } from '@/lib/constants/noticias';
import { TarjetaNoticia } from './TarjetaNoticia';

export interface LugarMapa {
    id: string;
    nombre: string;
    detalle: string;
    /** En % del mapa; sin posición, el lugar va sólo como botón (México, el mundo) */
    pos?: { x: number; y: number };
    lado?: 'derecha' | 'izquierda' | 'abajo';
    noticias: ResumenNoticia[];
}

const LADO = {
    derecha: 'left-full ml-2 top-1/2 -translate-y-1/2',
    izquierda: 'right-full mr-2 top-1/2 -translate-y-1/2',
    abajo: 'top-full mt-2 left-0',
};

const ICONO_FUERA: Record<string, typeof Globe2> = { mundo: Globe2, mexico: Landmark };

/**
 * «En el mapa»: las noticias por lugar. Las marcas del mapa y los botones de arriba eligen el
 * mismo lugar; al lado (abajo en celular) salen sus noticias. El número de cada marca es cuántas
 * hay. El mapa (MapaGolfo) se dibuja en el servidor y llega como prop.
 */
export function ExploradorMapa({ mapa, lugares, locale }: { mapa: ReactNode; lugares: LugarMapa[]; locale: string }) {
    const [elegido, setElegido] = useState(lugares[0].id);
    const lugar = lugares.find((l) => l.id === elegido) ?? lugares[0];
    const cuantas = (n: number) => (n === 1 ? '1 noticia' : `${n} noticias`);
    const fila = useRef<HTMLDivElement>(null);

    // En celular los lugares van en una fila que se desliza: el elegido (también desde el mapa), a la vista
    useEffect(() => {
        const contenedor = fila.current;
        const boton = contenedor?.querySelector<HTMLElement>('[aria-pressed="true"]');
        if (!contenedor || !boton || contenedor.scrollWidth <= contenedor.clientWidth) return;
        contenedor.scrollTo({ left: boton.offsetLeft - contenedor.clientWidth / 2 + boton.offsetWidth / 2, behavior: 'smooth' });
    }, [elegido]);

    return (
        <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start movil:mt-7 movil:gap-5">
            <div>
                <div className="relative aspect-square rounded-[32px] overflow-hidden bg-simar-abismo shadow-simar movil:rounded-[24px]">
                    {mapa}
                    {lugares
                        .filter((l) => l.pos)
                        .map((l) => {
                            const activo = l.id === lugar.id;
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    aria-pressed={activo}
                                    aria-label={`${l.nombre}: ${cuantas(l.noticias.length)}`}
                                    onClick={() => setElegido(l.id)}
                                    style={{ left: `${l.pos!.x}%`, top: `${l.pos!.y}%` }}
                                    className={`group absolute -translate-x-1/2 -translate-y-1/2 rounded-full cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-espuma focus-visible:outline-offset-4 ${activo ? 'z-10' : ''}`}
                                >
                                    {activo && <span aria-hidden="true" className="absolute inset-0 rounded-full bg-simar-aceite animate-map-ping" />}
                                    <span
                                        aria-hidden="true"
                                        className={`relative w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-extrabold tabular-nums shadow-[0_6px_18px_rgba(0,0,0,0.35)] ring-4 transition-[transform,background-color] duration-300 movil:w-11 movil:h-11 movil:text-[16px] ${
                                            activo ? 'bg-simar-aceite text-simar-abismo ring-simar-aceite/30 scale-110' : 'bg-white text-simar-abismo ring-white/20 group-hover:scale-105'
                                        }`}
                                    >
                                        {l.noticias.length}
                                    </span>
                                    <span
                                        aria-hidden="true"
                                        className={`max-sm:hidden absolute ${LADO[l.lado ?? 'derecha']} whitespace-nowrap rounded-full px-3.5 py-1.5 text-[15px] font-bold border transition-colors ${
                                            activo ? 'bg-simar-aceite text-simar-abismo border-simar-aceite' : 'bg-simar-abismo/85 text-white border-white/15 group-hover:bg-simar-abismo'
                                        }`}
                                    >
                                        {l.nombre}
                                    </span>
                                </button>
                            );
                        })}
                </div>
                <p className="mt-3 text-[15px] leading-snug text-simar-texto-2">Ubicaciones aproximadas. El número de cada marca es cuántas noticias hay de ese lugar.</p>
            </div>

            <div>
                <div ref={fila} role="group" aria-label="Elige un lugar" className="-mx-5 px-5 flex gap-2 overflow-x-auto [scrollbar-width:none] md:mx-0 md:px-0 md:flex-wrap">
                    {lugares.map((l) => {
                        const activo = l.id === lugar.id;
                        const Icono = ICONO_FUERA[l.id] ?? MapPin;
                        return (
                            <button
                                key={l.id}
                                type="button"
                                aria-pressed={activo}
                                onClick={() => setElegido(l.id)}
                                className={`simar-presiona flex-shrink-0 min-h-[48px] px-4 rounded-full inline-flex items-center gap-2 text-[17px] font-bold border-2 transition-colors cursor-pointer movil:min-h-[44px] movil:text-[15px] ${
                                    activo ? 'bg-simar-texto text-simar-papel border-simar-texto' : 'bg-simar-superficie text-simar-texto border-simar-borde hover:border-simar-campo-borde'
                                }`}
                            >
                                <Icono aria-hidden="true" className={`w-[18px] h-[18px] ${activo ? '' : 'text-simar-marea-tinta'}`} />
                                {l.nombre}
                            </button>
                        );
                    })}
                </div>

                <div key={lugar.id} aria-live="polite" className="simar-aparece mt-5 rounded-[28px] bg-simar-superficie border border-simar-borde shadow-simar p-6 md:p-8 movil:rounded-[22px] movil:p-5">
                    <p className="text-[15px] font-bold text-simar-marea-tinta">{cuantas(lugar.noticias.length)}</p>
                    <h3 className="mt-1 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] movil:text-[24px]">{lugar.nombre}</h3>
                    <p className="mt-2 text-[18px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{lugar.detalle}</p>
                    <ul className="mt-5 divide-y divide-simar-borde">
                        {lugar.noticias.map((n) => (
                            <li key={n.slug} className="py-4 first:pt-1 last:pb-0">
                                <TarjetaNoticia noticia={n} locale={locale} variante="fila" />
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

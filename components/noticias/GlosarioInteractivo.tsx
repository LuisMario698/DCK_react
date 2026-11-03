'use client';

import { useRef, useState } from 'react';
import { ArrowLeft, ArrowRight } from 'lucide-react';
import { moverConTeclas, sinMovimiento } from './pestanas';

/**
 * El glosario: las palabras arriba (o a un lado) y, en una tarjeta grande, lo que quiere decir la
 * elegida. En celular, al tocar una palabra la tarjeta se asoma si quedó abajo de la pantalla.
 */
export function GlosarioInteractivo({ terminos }: { terminos: { termino: string; definicion: string }[] }) {
    const [elegido, setElegido] = useState(0);
    const tarjeta = useRef<HTMLDivElement>(null);
    const t = terminos[elegido];
    const total = terminos.length;

    const elegir = (i: number) => {
        setElegido(i);
        if (window.matchMedia('(max-width: 1023px)').matches) {
            requestAnimationFrame(() => tarjeta.current?.scrollIntoView({ block: 'nearest', behavior: sinMovimiento() ? 'auto' : 'smooth' }));
        }
    };
    const flecha =
        'simar-presiona w-[52px] h-[52px] rounded-full border-2 border-white/25 inline-flex items-center justify-center text-white transition-colors cursor-pointer hover:bg-white/10 focus-visible:outline-3 focus-visible:outline-simar-espuma';

    return (
        <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start movil:mt-7 movil:gap-5">
            <div role="tablist" aria-label="Palabras" className="flex flex-wrap gap-2.5">
                {terminos.map((g, i) => {
                    const activo = i === elegido;
                    return (
                        <button
                            key={g.termino}
                            type="button"
                            role="tab"
                            id={`termino-${i}`}
                            aria-selected={activo}
                            aria-controls="termino-panel"
                            tabIndex={activo ? 0 : -1}
                            onClick={() => elegir(i)}
                            onKeyDown={(e) => moverConTeclas(e, i, total, elegir)}
                            className={`simar-presiona min-h-[52px] px-5 rounded-full text-[17px] font-bold border-2 transition-colors cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-2 movil:min-h-[46px] movil:px-4 movil:text-[16px] ${
                                activo ? 'bg-simar-abismo text-white border-simar-abismo' : 'bg-simar-superficie text-simar-texto border-simar-borde hover:border-simar-campo-borde'
                            }`}
                        >
                            {g.termino}
                        </button>
                    );
                })}
            </div>

            <div
                ref={tarjeta}
                key={elegido}
                role="tabpanel"
                id="termino-panel"
                aria-labelledby={`termino-${elegido}`}
                className="simar-aparece scroll-mt-40 lg:sticky lg:top-44 min-h-[280px] flex flex-col rounded-[32px] bg-simar-abismo text-white border border-white/10 p-8 md:p-10 shadow-simar movil:min-h-0 movil:rounded-[24px] movil:p-6"
            >
                <p className="text-[15px] font-bold text-simar-espuma tabular-nums">
                    {elegido + 1} de {total}
                </p>
                <h3 className="mt-3 text-[clamp(32px,3.4vw,46px)] font-extrabold leading-[1.05] tracking-[-0.025em] movil:mt-2 movil:text-[28px]">{t.termino}</h3>
                <p className="mt-4 text-[20px] leading-relaxed text-simar-franja-texto-2 movil:mt-3 movil:text-[17px]">{t.definicion}</p>
                <div className="mt-auto pt-8 flex gap-3 movil:pt-6">
                    <button type="button" className={flecha} aria-label="Palabra anterior" onClick={() => elegir((elegido - 1 + total) % total)}>
                        <ArrowLeft aria-hidden="true" className="w-5 h-5" />
                    </button>
                    <button type="button" className={flecha} aria-label="Palabra siguiente" onClick={() => elegir((elegido + 1) % total)}>
                        <ArrowRight aria-hidden="true" className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
}

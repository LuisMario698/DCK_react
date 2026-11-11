'use client';

import { useId, useLayoutEffect, useRef } from 'react';
import { moverLente, tramoDe } from './lente';
import { movimientoQuieto } from './viaje';

/**
 * Un selector de dos o más opciones (Normal / Alto…) con una lente líquida (lente.ts): la pastilla
 * oscura se desliza a la opción elegida estirándose en el camino, y el texto cambia de color justo
 * donde pasa (la lente lleva su propia copia de las etiquetas, en el color de encima).
 *
 * Responde al presionar, no al soltar: al tocar otra opción la lente ya se asoma hacia ella y, si el
 * dedo se va sin soltar ahí, regresa. Con «reducir movimiento» salta sin animar. Cada opción es un
 * botón con aria-pressed (lectores de pantalla y teclado, como antes).
 */

const CAJA = 'min-h-[44px] min-w-[84px] px-4 rounded-full inline-flex items-center justify-center text-[16px] font-bold';

export function SelectorLiquido<T extends string>({
    etiqueta,
    valor,
    opciones,
    alCambiar,
}: {
    etiqueta: string;
    valor: T;
    opciones: { valor: T; texto: string }[];
    alCambiar: (v: T, boton: HTMLButtonElement) => void;
}) {
    const id = useId();
    const lente = useRef<HTMLSpanElement>(null);
    const botones = useRef<(HTMLButtonElement | null)[]>([]);
    const indice = Math.max(0, opciones.findIndex((o) => o.valor === valor));
    const elegido = useRef(indice);
    const montado = useRef(false);

    // Lleva la lente a la opción `i` (o sólo una parte del camino, al presionar)
    const ir = (i: number, { animar = true, parcial = 1 }: { animar?: boolean; parcial?: number } = {}) => {
        const capa = lente.current;
        const destino = botones.current[i];
        if (!capa || !destino) return;
        let tramo = tramoDe(capa, destino);
        if (parcial < 1) {
            const actual = botones.current[elegido.current];
            if (!actual) return;
            const base = tramoDe(capa, actual);
            tramo = { izq: base.izq + (tramo.izq - base.izq) * parcial, der: base.der + (tramo.der - base.der) * parcial };
        }
        moverLente(capa, tramo, { quieto: !animar || movimientoQuieto(), ms: parcial < 1 ? 240 : 440, aplastar: parcial < 1 ? 0.97 : 0.92 });
    };

    // Al cambiar el valor (un clic, el teclado o «Volver a como estaba»), la lente va hacia él; la
    // primera vez se pone sin animar
    useLayoutEffect(() => {
        elegido.current = indice;
        ir(indice, { animar: montado.current });
        montado.current = true;
    }, [indice]);

    // Si la pista cambia de tamaño, la lente se acomoda sin animar
    useLayoutEffect(() => {
        const capa = lente.current;
        if (!capa) return;
        const ro = new ResizeObserver(() => ir(elegido.current, { animar: false }));
        ro.observe(capa);
        return () => ro.disconnect();
    }, []);

    const regresar = () => ir(elegido.current);

    return (
        <div role="group" aria-labelledby={id} className="flex items-center justify-between gap-4 py-3">
            <span id={id} className="text-[17px] font-bold text-simar-texto">
                {etiqueta}
            </span>
            <span className="isla-selector relative inline-flex flex-shrink-0 rounded-full bg-simar-papel ring-1 ring-inset ring-simar-borde p-1">
                {opciones.map((o, i) => (
                    <button
                        key={o.valor}
                        ref={(el) => {
                            botones.current[i] = el;
                        }}
                        type="button"
                        aria-pressed={o.valor === valor}
                        onPointerDown={(e) => {
                            if (e.button === 0 && i !== elegido.current) ir(i, { parcial: 0.16 });
                        }}
                        onPointerLeave={(e) => {
                            if (e.buttons && i !== elegido.current) regresar();
                        }}
                        onPointerCancel={regresar}
                        onClick={(e) => {
                            if (o.valor !== valor) alCambiar(o.valor, e.currentTarget);
                        }}
                        className={`${CAJA} relative text-simar-texto-2 hover:text-simar-texto transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-simar-marea focus-visible:outline-offset-2`}
                    >
                        {o.texto}
                    </button>
                ))}
                {/* La lente: la pastilla oscura con las mismas etiquetas en claro, recortada donde está la elegida */}
                <span ref={lente} aria-hidden="true" className="isla-selector-lente absolute inset-0 p-1 flex pointer-events-none">
                    {opciones.map((o) => (
                        <span key={o.valor} className={CAJA}>
                            {o.texto}
                        </span>
                    ))}
                </span>
            </span>
        </div>
    );
}

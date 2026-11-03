'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { ChevronsLeftRight } from 'lucide-react';

const limitar = (v: number) => Math.min(100, Math.max(0, v));

/**
 * La hoja en papel (una ilustración: la misma hoja, envejecida) encima del manifiesto digital,
 * recortada hasta la barra. Es el comparador de la landing nueva sin Motion: la posición vive en
 * una variable CSS (`--corte`) y React sólo se entera al soltar.
 *
 * Empieza todo en papel y, la primera vez que se ve, la barra se corre sola a la mitad: así se
 * entiende que se puede arrastrar. Sigue al dedo 1:1 (touch-action: pan-y deja el scroll vertical
 * al celular); con las flechas del teclado cambia de 5 en 5.
 */
export function ComparadorHojas() {
    const caja = useRef<HTMLDivElement>(null);
    const posicion = useRef(100);
    const arrastrando = useRef(false);
    const [valor, setValor] = useState(100);

    const poner = (v: number, suave: boolean) => {
        const el = caja.current;
        if (!el) return;
        posicion.current = limitar(v);
        el.classList.toggle('t3-corte-suave', suave);
        el.style.setProperty('--corte', `${posicion.current}%`);
    };
    const irA = (v: number, suave = true) => {
        poner(v, suave);
        setValor(posicion.current);
    };

    // La primera vez que se ve: de papel a la mitad
    useEffect(() => {
        const el = caja.current;
        if (!el) return;
        const vista = new IntersectionObserver(
            ([e]) => {
                if (!e.isIntersecting) return;
                vista.disconnect();
                if (!arrastrando.current) irA(50);
            },
            { threshold: 0.6 }
        );
        vista.observe(el);
        return () => vista.disconnect();
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const enX = (x: number) => {
        const r = caja.current?.getBoundingClientRect();
        return r ? ((x - r.left) / r.width) * 100 : 50;
    };
    const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        arrastrando.current = true;
        poner(enX(e.clientX), true);
    };
    const alMover = (e: PointerEvent<HTMLDivElement>) => {
        if (arrastrando.current) poner(enX(e.clientX), false);
    };
    const alSoltar = () => {
        if (!arrastrando.current) return;
        arrastrando.current = false;
        setValor(posicion.current);
    };
    const alTeclear = (e: KeyboardEvent) => {
        const pasos: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
        if (e.key in pasos) irA(posicion.current + pasos[e.key], false);
        else if (e.key === 'Home') irA(0, false);
        else if (e.key === 'End') irA(100, false);
        else return;
        e.preventDefault();
    };
    const redondo = Math.round(valor);

    return (
        <div>
            <div
                ref={caja}
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                style={{ ['--corte' as string]: '100%' }}
                className="t3-comparador relative aspect-[900/1115] w-full rounded-[28px] overflow-hidden bg-white/10 select-none touch-pan-y cursor-ew-resize movil:rounded-[22px]"
            >
                <Image
                    src="/assets/landing/despues-manifiesto.webp"
                    alt="Después: el manifiesto digital de SiMAR, con los datos de la embarcación y las firmas (datos de la demostración)"
                    fill
                    sizes="(min-width: 1024px) 520px, 100vw"
                    className="object-cover pointer-events-none"
                    draggable={false}
                />
                <div className="t3-comparador-antes absolute inset-0">
                    <Image
                        src="/assets/landing/antes-hoja.webp"
                        alt="Antes: la misma hoja en papel, manchada y desvanecida por los años (ilustración)"
                        fill
                        sizes="(min-width: 1024px) 520px, 100vw"
                        className="object-cover pointer-events-none"
                        draggable={false}
                    />
                </div>
                <span className="absolute left-3 top-3 rounded-full bg-simar-abismo/80 px-3.5 py-1.5 text-[15px] font-bold text-white pointer-events-none">Antes · papel</span>
                <span className="absolute right-3 top-3 rounded-full bg-simar-abismo/80 px-3.5 py-1.5 text-[15px] font-bold text-white pointer-events-none">Después · SiMAR</span>
                {/* La barra: una capa del ancho de la caja que se recorre (transform, no left) */}
                <div className="t3-comparador-barra absolute inset-0 pointer-events-none">
                    <div className="absolute inset-y-0 left-0 -translate-x-1/2 w-[3px] bg-white shadow-[0_0_12px_rgba(6,18,30,0.5)]">
                        <div
                            role="slider"
                            tabIndex={0}
                            aria-label="Comparar la hoja en papel con el manifiesto digital"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={redondo}
                            aria-valuetext={`${redondo} % de la hoja en papel`}
                            onKeyDown={alTeclear}
                            className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white text-simar-abismo shadow-simar flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-simar-golfo movil:w-12 movil:h-12"
                        >
                            <ChevronsLeftRight className="w-7 h-7 movil:w-6 movil:h-6" />
                        </div>
                    </div>
                </div>
            </div>
            <div className="mt-4 flex flex-wrap items-center justify-between gap-3 movil:mt-3">
                <div className="inline-flex rounded-full bg-white/8 border border-white/15 p-1" role="group" aria-label="Ver la hoja">
                    {[
                        { texto: 'Antes', valor: 100 },
                        { texto: 'Después', valor: 0 },
                    ].map((b) => (
                        <button
                            key={b.texto}
                            type="button"
                            onClick={() => irA(b.valor)}
                            aria-pressed={redondo === b.valor}
                            className={`simar-presiona min-h-[48px] px-5 rounded-full text-[17px] font-bold transition-colors cursor-pointer movil:min-h-[44px] movil:px-4 movil:text-[15px] ${
                                redondo === b.valor ? 'bg-white text-simar-abismo' : 'text-white hover:bg-white/10'
                            }`}
                        >
                            {b.texto}
                        </button>
                    ))}
                </div>
                <p className="text-[15px] text-simar-franja-texto-3">Arrastra la barra para comparar.</p>
            </div>
        </div>
    );
}

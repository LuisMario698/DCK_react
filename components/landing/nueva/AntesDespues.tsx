'use client';

import { useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { ChevronsLeftRight, Quote } from 'lucide-react';
import { Encabezado, cifra } from './comunes';

/** Hojas en papel que se llenaron a mano desde 2014 (README, "más de 5,000") */
const HOJAS_EN_PAPEL = '5,000';
const ANIO_PRIMERA_HOJA = 2014;

/**
 * El comparador: la hoja en papel (una ilustración: la misma hoja, envejecida) encima del
 * manifiesto digital, recortada hasta la barra. La barra se arrastra con el dedo o el mouse
 * (touch-action: pan-y deja el scroll vertical al celular), con las flechas del teclado, o con los
 * botones "Antes" y "Después".
 */
function Comparador() {
    // Qué tanto se ve la hoja en papel, de 0 a 100 (%)
    const [pos, setPos] = useState(50);
    const [arrastrando, setArrastrando] = useState(false);
    const caja = useRef<HTMLDivElement>(null);

    const moverA = (x: number) => {
        const r = caja.current?.getBoundingClientRect();
        if (!r) return;
        setPos(Math.min(100, Math.max(0, ((x - r.left) / r.width) * 100)));
    };
    const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        setArrastrando(true);
        moverA(e.clientX);
    };
    const alMover = (e: PointerEvent<HTMLDivElement>) => {
        if (arrastrando) moverA(e.clientX);
    };
    const alSoltar = () => setArrastrando(false);
    const alTeclear = (e: KeyboardEvent) => {
        const pasos: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
        if (e.key in pasos) setPos((p) => Math.min(100, Math.max(0, p + pasos[e.key])));
        else if (e.key === 'Home') setPos(0);
        else if (e.key === 'End') setPos(100);
        else return;
        e.preventDefault();
    };
    const transicion = arrastrando ? '' : 'transition-[clip-path,left] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]';

    return (
        <div>
            <div
                ref={caja}
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                className="relative aspect-[900/1115] w-full rounded-[30px] overflow-hidden bg-simar-borde shadow-simar select-none touch-pan-y cursor-ew-resize movil:rounded-[24px]"
            >
                <Image
                    src="/assets/landing/despues-manifiesto.webp"
                    alt="Después: el manifiesto digital de SiMAR, con los datos del barco y las firmas (datos de la demostración)"
                    fill
                    sizes="(min-width: 1024px) 540px, 100vw"
                    className="object-cover pointer-events-none"
                    draggable={false}
                />
                <div className={`absolute inset-0 bg-simar-borde ${transicion}`} style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
                    <Image
                        src="/assets/landing/antes-hoja.webp"
                        alt="Antes: la misma hoja en papel, manchada y desvanecida por los años (ilustración)"
                        fill
                        sizes="(min-width: 1024px) 540px, 100vw"
                        className="object-cover pointer-events-none"
                        draggable={false}
                    />
                </div>
                <span className="simar-vidrio-fuerte absolute left-3 top-3 rounded-full px-3.5 py-1.5 text-[15px] font-bold text-simar-texto pointer-events-none">
                    Antes · papel
                </span>
                <span className="simar-vidrio-fuerte absolute right-3 top-3 rounded-full px-3.5 py-1.5 text-[15px] font-bold text-simar-texto pointer-events-none">
                    Después · SiMAR
                </span>
                {/* La barra */}
                <div className={`absolute inset-y-0 -translate-x-1/2 w-[3px] bg-white shadow-[0_0_12px_rgba(11,34,54,0.45)] pointer-events-none ${transicion}`} style={{ left: `${pos}%` }}>
                    <div
                        role="slider"
                        tabIndex={0}
                        aria-label="Comparar la hoja en papel con el manifiesto digital"
                        aria-valuemin={0}
                        aria-valuemax={100}
                        aria-valuenow={Math.round(pos)}
                        aria-valuetext={`${Math.round(pos)} % de la hoja en papel`}
                        onKeyDown={alTeclear}
                        className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white text-simar-abismo shadow-simar flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-simar-golfo movil:w-12 movil:h-12"
                    >
                        <ChevronsLeftRight className="w-7 h-7 movil:w-6 movil:h-6" />
                    </div>
                </div>
            </div>
            <div className="mt-4 flex items-center justify-between gap-3 movil:mt-3">
                <div className="inline-flex rounded-full bg-simar-superficie border border-simar-borde p-1" role="group" aria-label="Ver la hoja">
                    {[
                        { texto: 'Antes', valor: 100 },
                        { texto: 'Después', valor: 0 },
                    ].map((b) => (
                        <button
                            key={b.texto}
                            type="button"
                            onClick={() => setPos(b.valor)}
                            aria-pressed={pos === b.valor}
                            className={`min-h-[48px] px-5 rounded-full text-[17px] font-bold transition-colors movil:min-h-[44px] movil:px-4 movil:text-[15px] ${
                                pos === b.valor ? 'bg-simar-marea text-white' : 'text-simar-texto hover:bg-simar-texto/5'
                            }`}
                        >
                            {b.texto}
                        </button>
                    ))}
                </div>
                <p className="text-[15px] text-simar-texto-2 text-right">La hoja en papel es una ilustración.</p>
            </div>
        </div>
    );
}

/**
 * 3 · Antes y después, con Don Francisco. La hoja deteriorada contra el manifiesto digital, su cita
 * y la cifra honesta: miles de hojas en papel y las que ya son digitales. `manifiestos` es el total
 * registrado en SiMAR (null sin datos).
 */
export function AntesDespues({ manifiestos }: { manifiestos: number | null }) {
    return (
        <section id="antes-despues" className="relative bg-simar-papel px-6 pt-24 md:pt-32 pb-20 md:pb-28 movil:px-5 movil:pt-16 movil:pb-14">
            <div className="max-w-[1248px] mx-auto grid lg:grid-cols-[minmax(0,540px)_minmax(0,1fr)] gap-12 lg:gap-16 items-center movil:gap-7">
                <Encabezado
                    className="lg:hidden"
                    antetitulo="Antes y después"
                    titulo="Del papel que se borra al dato que se queda."
                />
                <div className="ln-sube">
                    <Comparador />
                </div>
                <div>
                    <Encabezado className="hidden lg:block" antetitulo="Antes y después" titulo="Del papel que se borra al dato que se queda." />
                    <blockquote className="m-0 mt-8 flex gap-3 text-2xl md:text-[26px] leading-snug font-bold movil:mt-0 movil:text-[20px] movil:gap-2.5">
                        <Quote className="w-8 h-8 flex-shrink-0 mt-1 text-simar-marea-tinta movil:w-7 movil:h-7" />
                        <span>“Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre de Puerto Peñasco.”</span>
                    </blockquote>
                    <div className="mt-5 flex items-center gap-4 movil:mt-4">
                        <span className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 movil:w-14 movil:h-14">
                            <Image src="/assets/images/img4.jpeg" alt="" fill sizes="64px" className="object-cover object-[50%_18%]" />
                        </span>
                        <span>
                            <span className="block text-lg font-extrabold movil:text-[17px]">Francisco Javier Bojórquez Ochoa</span>
                            <span className="block text-[17px] text-simar-texto-2 movil:text-[15px]">Responsable del área de residuos del recinto portuario</span>
                        </span>
                    </div>
                    <div className="mt-6 space-y-4 text-lg md:text-[19px] leading-relaxed text-simar-texto-2 movil:mt-5 movil:space-y-3 movil:text-[16px]">
                        <p>
                            Durante años, Don Francisco llenó los manifiestos a mano, hoja por hoja, y los guardó en archiveros
                            donde el tiempo los iba borrando.
                        </p>
                        <p>
                            SiMAR se diseñó <strong className="text-simar-texto">con él y para él</strong>: letra grande, botones grandes
                            y pasos en orden. Ahora cada entrega se firma en la pantalla y queda guardada en SiMAR, lista para consultarse.
                        </p>
                    </div>
                    <div className="mt-7 rounded-[24px] bg-simar-superficie border border-simar-borde shadow-simar px-6 py-5 movil:mt-5 movil:px-5 movil:py-4">
                        <p className="text-xl font-extrabold leading-snug movil:text-[18px]">
                            Más de {HOJAS_EN_PAPEL} hojas en papel desde {ANIO_PRIMERA_HOJA}.
                            {manifiestos !== null && (
                                <>
                                    {' '}
                                    <span className="text-simar-arrecife-tinta">{cifra(manifiestos)} ya son digitales, y contando.</span>
                                </>
                            )}
                        </p>
                    </div>
                </div>
            </div>
        </section>
    );
}

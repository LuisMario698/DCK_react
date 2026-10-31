'use client';

import { useEffect, useRef, useState, type KeyboardEvent, type PointerEvent } from 'react';
import Image from 'next/image';
import { ChevronsLeftRight, Quote } from 'lucide-react';
import { animate, useInView, useMotionValue, useTransform } from 'motion/react';
import * as m from 'motion/react-m';
import { NumeroAnimado, usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { Encabezado } from './comunes';
import { RESORTE, TextoQueSeEnciende } from './escena';

/** Hojas en papel que se llenaron a mano desde 2014 (README, "más de 5,000") */
const HOJAS_EN_PAPEL = 5000;
const ANIO_PRIMERA_HOJA = 2014;

const limitar = (v: number) => Math.min(100, Math.max(0, v));

/**
 * El comparador: la hoja en papel (una ilustración: la misma hoja, envejecida) encima del
 * manifiesto digital, recortada hasta la barra. Empieza toda en papel y, al llegar a la vista, la
 * barra se corre sola a la mitad (una vez): así se entiende que se puede arrastrar. La barra sigue al
 * dedo o al mouse 1:1 (touch-action: pan-y deja el scroll vertical al celular); al tocar en otro
 * lado va hacia ahí con un resorte sin rebote, igual que los botones "Antes" y "Después". Con las
 * flechas del teclado cambia al instante.
 */
function Comparador() {
    const reducir = usePrefiereMenosMovimiento();
    // Qué tanto se ve la hoja en papel, de 0 a 100 (%). Es un valor de Motion: no vuelve a dibujar
    // el componente en cada cuadro
    const pos = useMotionValue(100);
    const recorte = useTransform(pos, (v) => `inset(0 ${100 - v}% 0 0)`);
    const barra = useTransform(pos, (v) => `translateX(${v}%)`);
    // Lo que oye el lector de pantalla y qué botón está activo (se actualiza al terminar cada gesto)
    const [valor, setValor] = useState(100);
    const arrastrando = useRef(false);
    const caja = useRef<HTMLDivElement>(null);
    const visto = useInView(caja, { once: true, amount: 0.6 });

    const irA = (v: number, conResorte = true) => {
        const destino = limitar(v);
        if (!conResorte || reducir) {
            pos.stop();
            pos.set(destino);
            setValor(destino);
            return;
        }
        animate(pos, destino, RESORTE).then(() => setValor(destino));
    };

    // La primera vez que se ve: de papel a la mitad
    useEffect(() => {
        if (visto && !arrastrando.current) irA(50);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [visto]);

    const enX = (x: number) => {
        const r = caja.current?.getBoundingClientRect();
        return r ? ((x - r.left) / r.width) * 100 : 50;
    };
    const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
        e.currentTarget.setPointerCapture(e.pointerId);
        arrastrando.current = true;
        irA(enX(e.clientX));
    };
    const alMover = (e: PointerEvent<HTMLDivElement>) => {
        if (!arrastrando.current) return;
        pos.stop();
        pos.set(limitar(enX(e.clientX)));
    };
    const alSoltar = () => {
        if (!arrastrando.current) return;
        arrastrando.current = false;
        setValor(pos.get());
    };
    const alTeclear = (e: KeyboardEvent) => {
        const pasos: Record<string, number> = { ArrowLeft: -5, ArrowDown: -5, ArrowRight: 5, ArrowUp: 5, PageDown: -20, PageUp: 20 };
        if (e.key in pasos) irA(pos.get() + pasos[e.key], false);
        else if (e.key === 'Home') irA(0, false);
        else if (e.key === 'End') irA(100, false);
        else return;
        e.preventDefault();
    };

    return (
        <div>
            <div
                ref={caja}
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                className="relative aspect-[900/1115] w-full rounded-[30px] overflow-hidden bg-simar-borde shadow-[0_40px_80px_-40px_rgba(11,34,54,0.55)] select-none touch-pan-y cursor-ew-resize movil:rounded-[24px]"
            >
                <Image
                    src="/assets/landing/despues-manifiesto.webp"
                    alt="Después: el manifiesto digital de SiMAR, con los datos del barco y las firmas (datos de la demostración)"
                    fill
                    sizes="(min-width: 1024px) 540px, 100vw"
                    className="object-cover pointer-events-none"
                    draggable={false}
                />
                <m.div className="absolute inset-0 bg-simar-borde" style={{ clipPath: recorte }}>
                    <Image
                        src="/assets/landing/antes-hoja.webp"
                        alt="Antes: la misma hoja en papel, manchada y desvanecida por los años (ilustración)"
                        fill
                        sizes="(min-width: 1024px) 540px, 100vw"
                        className="object-cover pointer-events-none"
                        draggable={false}
                    />
                </m.div>
                <span className="simar-vidrio-fuerte absolute left-3 top-3 rounded-full px-3.5 py-1.5 text-[15px] font-bold text-simar-texto pointer-events-none">
                    Antes · papel
                </span>
                <span className="simar-vidrio-fuerte absolute right-3 top-3 rounded-full px-3.5 py-1.5 text-[15px] font-bold text-simar-texto pointer-events-none">
                    Después · SiMAR
                </span>
                {/* La barra: una capa del ancho de la caja que se recorre (transform, no left) */}
                <m.div className="absolute inset-0 pointer-events-none" style={{ transform: barra }}>
                    <div className="absolute inset-y-0 left-0 -translate-x-1/2 w-[3px] bg-white shadow-[0_0_12px_rgba(11,34,54,0.45)]">
                        <div
                            role="slider"
                            tabIndex={0}
                            aria-label="Comparar la hoja en papel con el manifiesto digital"
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-valuenow={Math.round(valor)}
                            aria-valuetext={`${Math.round(valor)} % de la hoja en papel`}
                            onKeyDown={alTeclear}
                            className="pointer-events-auto absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white text-simar-abismo shadow-simar flex items-center justify-center outline-none focus-visible:ring-4 focus-visible:ring-simar-golfo movil:w-12 movil:h-12"
                        >
                            <ChevronsLeftRight className="w-7 h-7 movil:w-6 movil:h-6" />
                        </div>
                    </div>
                </m.div>
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
                            onClick={() => irA(b.valor)}
                            aria-pressed={Math.round(valor) === b.valor}
                            className={`simar-presiona min-h-[48px] px-5 rounded-full text-[17px] font-bold transition-colors movil:min-h-[44px] movil:px-4 movil:text-[15px] ${
                                Math.round(valor) === b.valor ? 'bg-simar-marea text-white' : 'text-simar-texto hover:bg-simar-texto/5'
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
        <section id="antes-despues" className="relative bg-simar-papel px-6 pt-24 md:pt-36 pb-20 md:pb-32 movil:px-5 movil:pt-16 movil:pb-14">
            <div className="max-w-[1248px] mx-auto">
                <Encabezado
                    antetitulo="Antes y después"
                    titulo={<TextoQueSeEnciende texto="Del papel que se borra al dato que se queda." />}
                />
                <div className="mt-12 grid lg:grid-cols-[minmax(0,520px)_minmax(0,1fr)] gap-12 lg:gap-20 items-center movil:mt-8 movil:gap-8">
                    <div className="ln-enfoca-foto">
                        <Comparador />
                    </div>
                    <div>
                        <blockquote className="m-0 flex gap-4 text-[clamp(26px,2.4vw,34px)] leading-[1.25] font-bold tracking-[-0.01em] movil:text-[21px] movil:gap-2.5">
                            <Quote className="w-9 h-9 flex-shrink-0 mt-1 text-simar-marea-tinta movil:w-7 movil:h-7" />
                            <TextoQueSeEnciende texto="“Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre de Puerto Peñasco.”" />
                        </blockquote>
                        <div className="ln-enfoca mt-6 flex items-center gap-4 movil:mt-4">
                            <span className="relative w-16 h-16 rounded-full overflow-hidden flex-shrink-0 movil:w-14 movil:h-14">
                                <Image src="/assets/images/img4.jpeg" alt="" fill sizes="64px" className="object-cover object-[50%_18%]" />
                            </span>
                            <span>
                                <span className="block text-lg font-extrabold movil:text-[17px]">Francisco Javier Bojórquez Ochoa</span>
                                <span className="block text-[17px] text-simar-texto-2 movil:text-[15px]">Responsable del área de residuos del recinto portuario</span>
                            </span>
                        </div>
                        <div className="ln-enfoca mt-8 space-y-4 text-lg md:text-xl leading-relaxed text-simar-texto-2 movil:mt-6 movil:space-y-3 movil:text-[16px]">
                            <p>
                                Durante años, Don Francisco llenó los manifiestos a mano, hoja por hoja, y los guardó en archiveros
                                donde el tiempo los iba borrando.
                            </p>
                            <p>
                                SiMAR se diseñó <strong className="text-simar-texto">con él y para él</strong>: letra grande, botones
                                grandes y pasos en orden. Ahora cada entrega se firma en la pantalla y queda guardada en SiMAR, lista para
                                consultarse.
                            </p>
                        </div>
                        {/* Las dos cifras: lo que hubo en papel y lo que ya es digital */}
                        <dl className="ln-enfoca mt-10 grid grid-cols-2 gap-4 movil:mt-7 movil:gap-3">
                            <div className="rounded-[26px] bg-simar-superficie border border-simar-borde px-6 py-5 movil:rounded-[20px] movil:px-4 movil:py-4">
                                <dt className="sr-only">En papel</dt>
                                <dd className="m-0">
                                    <span className="block text-[44px] font-extrabold leading-none tracking-[-0.03em] tabular-nums movil:text-[32px]">
                                        +<NumeroAnimado valor={HOJAS_EN_PAPEL} duracion={1400} />
                                    </span>
                                    <span className="mt-2 block text-[17px] leading-snug text-simar-texto-2 movil:text-[15px]">
                                        hojas en papel desde {ANIO_PRIMERA_HOJA}
                                    </span>
                                </dd>
                            </div>
                            {manifiestos !== null && (
                                <div className="rounded-[26px] bg-simar-arrecife-suave px-6 py-5 movil:rounded-[20px] movil:px-4 movil:py-4">
                                    <dt className="sr-only">Digitales</dt>
                                    <dd className="m-0">
                                        <span className="block text-[44px] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-simar-arrecife-tinta movil:text-[32px]">
                                            <NumeroAnimado valor={manifiestos} duracion={1400} />
                                        </span>
                                        <span className="mt-2 block text-[17px] leading-snug text-simar-arrecife-tinta movil:text-[15px]">
                                            ya son digitales, y contando
                                        </span>
                                    </dd>
                                </div>
                            )}
                        </dl>
                    </div>
                </div>
            </div>
        </section>
    );
}

'use client';

import { useId, useState } from 'react';
import { ArrowDown, ArrowRight, PlayCircle } from 'lucide-react';
import { useMotionValueEvent, useTransform, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { cifra } from './comunes';
import { useEscena, useRango, useTramo } from './escena';

/*
 * 1 · Hero «Una gota». Una escena fija de pantalla completa que avanza con el scroll:
 *   0.00–0.20  la gota cae junto al barco camaronero
 *   0.20–0.45  toca el agua: ondas, y la mancha de aceite se extiende por el mar, que se oscurece
 *   0.32–0.56  el título deja su lugar a la cifra real de litros, que cuenta mientras se baja
 *   0.60–0.85  la mancha se recoge y el mar vuelve a su color: lo que ya hizo el puerto
 * El título se ve desde el primer cuadro (es el elemento LCP) y el texto de abajo y los botones no
 * se mueven en toda la escena. Con "reducir movimiento", el hero quieto (HeroQuieto).
 * El horizonte está al 50 % de la pantalla en celular y al 64 % en computadora.
 */

const HORIZONTE = 'top-[50svh] md:top-[64svh]';
/** Dónde cae la gota (y de dónde sale la mancha), a lo ancho */
const X_GOTA = 74;

function Barco({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 220 140" className={className} aria-hidden="true">
            <g fill="#06172A" stroke="#06172A" strokeLinecap="round">
                <path d="M8 104 L206 98 C202 118 190 132 170 136 L40 136 C24 132 12 120 8 104 Z" stroke="none" />
                <rect x="104" y="70" width="62" height="32" rx="3" stroke="none" />
                <rect x="114" y="57" width="40" height="15" rx="2" stroke="none" />
                <line x1="70" y1="104" x2="70" y2="4" strokeWidth="4" />
                <line x1="70" y1="16" x2="4" y2="64" strokeWidth="3" />
                <line x1="70" y1="16" x2="146" y2="54" strokeWidth="3" />
                <line x1="70" y1="6" x2="10" y2="102" strokeWidth="1.2" />
                <line x1="70" y1="6" x2="198" y2="98" strokeWidth="1.2" />
                <g fill="#7FE0D6" fillOpacity="0.6" stroke="none">
                    <rect x="112" y="79" width="11" height="8" rx="1.5" />
                    <rect x="129" y="79" width="11" height="8" rx="1.5" />
                    <rect x="146" y="79" width="11" height="8" rx="1.5" />
                </g>
                <circle cx="70" cy="3" r="3.5" fill="#F2C14E" stroke="none" />
            </g>
        </svg>
    );
}

function Gota({ className = '' }: { className?: string }) {
    const id = useId();
    return (
        <svg viewBox="0 0 40 54" className={className} aria-hidden="true">
            <defs>
                <linearGradient id={id} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFE29A" />
                    <stop offset="0.55" stopColor="#F2C14E" />
                    <stop offset="1" stopColor="#B7791F" />
                </linearGradient>
            </defs>
            <path d="M20 1 C20 1 2 24 2 35 a18 18 0 0 0 36 0 C38 24 20 1 20 1 Z" fill={`url(#${id})`} />
            <ellipse cx="13" cy="34" rx="3.5" ry="6" fill="#FFFFFF" fillOpacity="0.75" />
        </svg>
    );
}

/** El fondo, el barco, la gota, las ondas y la mancha: todo decorativo */
function Escenario({ p }: { p: MotionValue<number> }) {
    // La gota cae (con la aceleración de algo que cae) y se estira un poco; al tocar el agua se va
    const caidaEscritorio = useRango(p, [0, 0.2], ['translateY(-38svh) scaleY(1)', 'translateY(0svh) scaleY(1.12)'], {
        ease: (t) => t * t,
    });
    const caidaCelular = useRango(p, [0, 0.2], ['translateY(-15svh) scaleY(1)', 'translateY(0svh) scaleY(1.12)'], {
        ease: (t) => t * t,
    });
    const gotaOpacidad = useRango(p, [0, 0.195, 0.205], [1, 1, 0]);

    // Dos ondas desde el punto donde cayó
    const onda1 = useRango(p, [0.2, 0.36], ['scale(0.2)', 'scale(2.4)']);
    const onda2 = useRango(p, [0.23, 0.4], ['scale(0.2)', 'scale(2)']);
    const ondaOpacidad1 = useRango(p, [0.2, 0.36], [0.9, 0]);
    const ondaOpacidad2 = useRango(p, [0.23, 0.4], [0.7, 0]);

    // La mancha se extiende por el mar y luego se recoge
    const mancha = useRango(
        p,
        [0.2, 0.46, 0.6, 0.86],
        [
            `ellipse(0% 0% at ${X_GOTA}% 0%)`,
            `ellipse(150% 95% at ${X_GOTA}% 0%)`,
            `ellipse(150% 95% at ${X_GOTA}% 0%)`,
            `ellipse(0% 0% at ${X_GOTA}% 0%)`,
        ]
    );
    const marSucio = useRango(p, [0.2, 0.46, 0.6, 0.86], [0, 1, 1, 0]);
    // Al final el mar se ve más claro que al principio: la luz que vuelve
    const luz = useRango(p, [0, 0.6, 0.9], [0.55, 0.4, 1]);
    const deriva = useRango(p, [0, 1], ['translateX(0px)', 'translateX(28px)']);

    return (
        <div aria-hidden="true" className="absolute inset-0 pointer-events-none">
            {/* Cielo de madrugada */}
            <div className="absolute inset-x-0 top-0 h-[50svh] md:h-[64svh] bg-[linear-gradient(180deg,var(--simar-abismo)_0%,#0F2B47_55%,var(--simar-mar-2)_100%)]" />
            <m.div
                style={{ opacity: luz }}
                className="absolute inset-x-0 top-0 h-[50svh] md:h-[64svh] bg-[radial-gradient(48%_70%_at_78%_100%,rgba(242,163,124,0.5),transparent_70%)]"
            />
            {/* El mar */}
            <div className={`absolute inset-x-0 bottom-0 ${HORIZONTE} bg-[linear-gradient(180deg,#13708A_0%,var(--simar-mar-1)_40%,#0B3A52_100%)]`} />
            <m.div
                style={{ opacity: luz }}
                className={`absolute inset-x-0 bottom-0 ${HORIZONTE} bg-[radial-gradient(60%_40%_at_78%_0%,rgba(127,224,214,0.32),transparent_75%)]`}
            />
            {/* El mar se oscurece bajo la mancha */}
            <m.div
                style={{ opacity: marSucio }}
                className={`absolute inset-x-0 bottom-0 ${HORIZONTE} bg-[linear-gradient(180deg,#2A2A1C_0%,#1A2420_50%,#0C1A1F_100%)]`}
            />
            {/* La mancha: película tornasol que sale de donde cayó la gota */}
            <m.div
                style={{ clipPath: mancha }}
                className={`absolute inset-x-0 bottom-0 ${HORIZONTE} opacity-80 bg-[linear-gradient(100deg,rgba(242,193,78,0.0)_0%,rgba(242,193,78,0.55)_18%,rgba(201,163,245,0.5)_38%,rgba(127,224,214,0.45)_58%,rgba(242,193,78,0.5)_78%,rgba(242,193,78,0.1)_100%)]`}
            />
            {/* La línea del agua */}
            <svg viewBox="0 0 1440 16" preserveAspectRatio="none" className={`absolute inset-x-0 ${HORIZONTE} -translate-y-1/2 w-full h-4`}>
                <path
                    d="M0 8 C60 3 120 3 180 8 C240 13 300 13 360 8 C420 3 480 3 540 8 C600 13 660 13 720 8 C780 3 840 3 900 8 C960 13 1020 13 1080 8 C1140 3 1200 3 1260 8 C1320 13 1380 13 1440 8"
                    fill="none"
                    stroke="#7FE0D6"
                    strokeOpacity="0.55"
                    strokeWidth="2"
                />
            </svg>

            {/* El barco a contraluz, con el casco en el agua */}
            <m.div style={{ transform: deriva }} className={`absolute ${HORIZONTE} -translate-y-[78%] left-[54%] w-[140px] md:left-[54%] md:w-[300px]`}>
                <Barco className="w-full h-auto" />
            </m.div>

            {/* Ondas */}
            {[
                { escala: onda1, opacidad: ondaOpacidad1, clase: 'border-simar-espuma' },
                { escala: onda2, opacidad: ondaOpacidad2, clase: 'border-white/80' },
            ].map((o, i) => (
                <m.span
                    key={i}
                    style={{ transform: o.escala, opacity: o.opacidad, left: `${X_GOTA}%` }}
                    className={`absolute ${HORIZONTE} -ml-[90px] -mt-[12px] w-[180px] h-[24px] rounded-[50%] border-2 ${o.clase}`}
                />
            ))}

            {/* La gota: su punta de abajo llega a la línea del agua */}
            <m.div style={{ opacity: gotaOpacidad, left: `${X_GOTA}%` }} className={`absolute ${HORIZONTE} -ml-5 -translate-y-full`}>
                <m.div style={{ transform: caidaEscritorio }} className="hidden md:block origin-bottom">
                    <Gota className="w-12 h-[65px] drop-shadow-[0_8px_16px_rgba(242,193,78,0.45)]" />
                </m.div>
                <m.div style={{ transform: caidaCelular }} className="md:hidden origin-bottom">
                    <Gota className="w-8 h-[43px] drop-shadow-[0_8px_16px_rgba(242,193,78,0.45)]" />
                </m.div>
            </m.div>
        </div>
    );
}

function Acciones({ rutaDemo }: { rutaDemo: string | null }) {
    return (
        <div className="mt-7 flex flex-wrap gap-3 movil:mt-5 movil:flex-col">
            <a
                href="#viaje"
                className="simar-presiona group min-h-[60px] px-7 rounded-[20px] bg-simar-espuma text-simar-abismo text-lg md:text-xl font-extrabold inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px]"
            >
                Ver cómo lo hacemos
                <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
            </a>
            {rutaDemo && (
                <a
                    href={rutaDemo}
                    className="simar-presiona min-h-[60px] px-7 rounded-[20px] border-2 border-white/80 text-white text-lg md:text-xl font-bold hover:bg-white/10 inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px]"
                >
                    <PlayCircle className="w-[22px] h-[22px]" />
                    Probar la demostración
                </a>
            )}
        </div>
    );
}

const ANTETITULO = 'Puerto Peñasco · Alto Golfo de California';
const TITULO = 'Un litro de aceite puede contaminar hasta un millón de litros de mar.';
const TEXTO = 'SiMAR registra cada litro, filtro y kilo de basura que los barcos entregan en el muelle, para que llegue al reciclaje y no al Golfo.';
const CLASE_TITULO =
    'font-extrabold text-[clamp(48px,5.6vw,84px)] leading-[1.02] tracking-[-0.035em] movil:text-[34px] movil:leading-[1.08] movil:tracking-[-0.02em]';

/** La cifra: cuenta de 0 a `litros` mientras se baja (entre 0.5 y 0.72 de la escena) */
function Cifra({ p, litros, enfocable }: { p: MotionValue<number>; litros: number; enfocable: boolean }) {
    const texto = useTransform(p, [0.5, 0.72], [0, litros], { clamp: true });
    const redondeado = useTransform(texto, (v) => cifra(Math.round(v)));
    return (
        <>
            <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">En Puerto Peñasco ya evitamos que</p>
            <p className="mt-2 flex flex-wrap items-baseline gap-x-4 font-extrabold leading-none text-simar-aceite">
                <span className="sr-only">{cifra(litros)} litros</span>
                <m.span aria-hidden="true" className="tabular-nums text-[clamp(84px,9vw,148px)] tracking-[-0.04em] movil:text-[68px]">
                    {redondeado}
                </m.span>
                <span aria-hidden="true" className="text-[clamp(30px,3vw,44px)] movil:text-[26px]">
                    litros
                </span>
            </p>
            <p className="mt-3 text-2xl md:text-[30px] font-bold leading-tight movil:text-[19px]">de aceite usado llegaran al Golfo.</p>
            <a
                href="#fuentes"
                tabIndex={enfocable ? undefined : -1}
                className="mt-2 inline-flex min-h-[44px] items-center text-[17px] text-simar-franja-texto-2 underline underline-offset-4 hover:text-white movil:text-[15px]"
            >
                ¿De dónde sale esta cifra?
            </a>
        </>
    );
}

function HeroEscena({ litros, rutaDemo }: { litros: number | null; rutaDemo: string | null }) {
    const [ref, p] = useEscena<HTMLElement>();
    const titulo = useTramo(p, [0, 0, 0.32, 0.44]);
    const segundo = useTramo(p, [0.46, 0.56, 1, 1]);
    const pista = useTramo(p, [0, 0, 0.04, 0.1]);
    // El enlace de la cifra sólo se enfoca con Tab cuando la cifra está a la vista
    const [conCifra, setConCifra] = useState(false);
    useMotionValueEvent(p, 'change', (v) => setConCifra(v > 0.5));

    return (
        <header id="inicio" ref={ref} className="relative h-[260svh] bg-simar-abismo text-white">
            <div className="sticky top-0 h-[100svh] overflow-hidden isolate">
                <Escenario p={p} />

                {/* Arriba, en el cielo: el título y luego la cifra, en el mismo lugar */}
                <div className="relative z-10 h-[50svh] md:h-[64svh] px-6 movil:px-5">
                    <div className="relative h-full max-w-[1248px] mx-auto">
                        <m.div style={titulo} className="absolute inset-x-0 bottom-[11svh] md:bottom-[9svh] max-w-[880px] movil:bottom-[15svh]">
                            <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">{ANTETITULO}</p>
                            <h1 className={`mt-4 movil:mt-3 ${CLASE_TITULO}`}>{TITULO}</h1>
                        </m.div>
                        <m.div style={segundo} className="absolute inset-x-0 bottom-[9svh] max-w-[880px] movil:bottom-[12svh]">
                            {litros !== null ? (
                                <Cifra p={p} litros={litros} enfocable={conCifra} />
                            ) : (
                                <p className="text-[clamp(36px,4vw,60px)] font-extrabold leading-[1.06] tracking-[-0.03em] movil:text-[28px]">
                                    Cada litro que se entrega en el muelle es un litro que no llega al Golfo.
                                </p>
                            )}
                        </m.div>
                    </div>
                </div>

                {/* Abajo, en el mar: lo que hace SiMAR y los botones, quietos toda la escena */}
                <div className="relative z-10 px-6 pt-8 md:pt-10 movil:px-5 movil:pt-6">
                    <div className="max-w-[1248px] mx-auto">
                        <p className="max-w-xl text-lg md:text-[21px] leading-relaxed text-simar-franja-texto-2 movil:text-[16px]">{TEXTO}</p>
                        <Acciones rutaDemo={rutaDemo} />
                    </div>
                </div>

                <m.a
                    href="#problema"
                    style={pista}
                    className="absolute z-10 bottom-5 left-1/2 -translate-x-1/2 hidden md:flex min-h-[52px] items-center gap-2 px-4 rounded-full text-[17px] font-bold text-simar-franja-texto-2 hover:text-white"
                >
                    <ArrowDown className="w-5 h-5" />
                    Baja al fondo del mar
                </m.a>
            </div>
        </header>
    );
}

/** El hero sin escena (con "reducir movimiento"): el título, la cifra y los botones, quietos */
function HeroQuieto({ litros, rutaDemo }: { litros: number | null; rutaDemo: string | null }) {
    return (
        <header id="inicio" className="relative bg-simar-abismo text-white px-6 pt-[150px] pb-20 movil:px-5 movil:pt-[104px] movil:pb-14">
            <div className="max-w-[1248px] mx-auto">
                <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">{ANTETITULO}</p>
                <h1 className={`mt-4 max-w-[880px] movil:mt-3 ${CLASE_TITULO}`}>{TITULO}</h1>
                <p className="mt-6 max-w-xl text-lg md:text-[21px] leading-relaxed text-simar-franja-texto-2 movil:text-[16px]">{TEXTO}</p>
                <Acciones rutaDemo={rutaDemo} />
                {litros !== null && (
                    <div className="mt-14 pt-10 border-t border-white/15 movil:mt-10 movil:pt-8">
                        <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">En Puerto Peñasco ya evitamos que</p>
                        <p className="mt-2 font-extrabold leading-none text-simar-aceite">
                            <span className="text-[96px] tracking-[-0.04em] movil:text-[64px]">{cifra(litros)}</span>
                            <span className="ml-3 text-[36px] movil:text-[24px]">litros</span>
                        </p>
                        <p className="mt-3 text-2xl font-bold movil:text-[19px]">de aceite usado llegaran al Golfo.</p>
                        <a href="#fuentes" className="mt-2 inline-flex min-h-[44px] items-center text-[17px] text-simar-franja-texto-2 underline underline-offset-4 hover:text-white movil:text-[15px]">
                            ¿De dónde sale esta cifra?
                        </a>
                    </div>
                )}
            </div>
        </header>
    );
}

/**
 * El hero. `litros` es el aceite que ya llegó al centro de acopio (null sin datos). El servidor
 * dibuja la escena en su primer cuadro; si el sistema pide reducir movimiento, se cambia al hero
 * quieto al cargar.
 */
export function HeroGota({ litros, rutaDemo }: { litros: number | null; rutaDemo: string | null }) {
    const reducir = usePrefiereMenosMovimiento();
    return reducir ? <HeroQuieto litros={litros} rutaDemo={rutaDemo} /> : <HeroEscena litros={litros} rutaDemo={rutaDemo} />;
}

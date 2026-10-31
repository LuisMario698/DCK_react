'use client';

import { useState, type CSSProperties, type ReactNode } from 'react';
import Image from 'next/image';
import { FileSignature, Recycle, Ship, Truck, Warehouse, type LucideIcon } from 'lucide-react';
import { AnimatePresence, useMotionValueEvent, useScroll, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { Encabezado } from './comunes';
import { FRENA, RESORTE, TextoQueSeEnciende, useEscena, useRango } from './escena';

interface Paso {
    corto: string;
    titulo: string;
    texto: string;
    icono: LucideIcon;
    imagen: string;
    alt: string;
    /** Cómo se enseña la captura: en un celular o como hoja impresa */
    marco: 'telefono' | 'hoja';
}

// Capturas reales de SiMAR con los datos inventados de la demostración (public/assets/landing)
const PASOS: Paso[] = [
    {
        corto: 'Entrega',
        titulo: 'El barco lo entrega en el muelle.',
        texto: 'Al volver de la pesca, la embarcación entrega su aceite usado, sus filtros y su basura en el centro de acopio. Don Francisco lo registra en SiMAR desde el celular.',
        icono: Ship,
        imagen: '/assets/landing/viaje-2-manifiesto.webp',
        alt: 'Formulario de nuevo manifiesto en SiMAR: fecha, barco, aceite usado, filtros y basura',
        marco: 'telefono',
    },
    {
        corto: 'Manifiesto',
        titulo: 'Queda el manifiesto firmado.',
        texto: 'Quien entrega y quien recibe firman en la pantalla. SiMAR arma el manifiesto en el formato MARPOL Anexo V, listo para imprimir o mandar.',
        icono: FileSignature,
        imagen: '/assets/landing/despues-manifiesto.webp',
        alt: 'Manifiesto de entrega-recepción en PDF con los residuos del barco y las firmas',
        marco: 'hoja',
    },
    {
        corto: 'Centro de acopio',
        titulo: 'Se suma al centro de acopio.',
        texto: 'Lo recibido entra al inventario del centro de acopio, separado por tipo: aceite, filtros, cartón, plástico y chatarra.',
        icono: Warehouse,
        imagen: '/assets/landing/viaje-3-inventario.webp',
        alt: 'Inventario del centro de acopio en SiMAR: aceite usado, cartón y chatarra metálica publicados',
        marco: 'telefono',
    },
    {
        corto: 'Empresa',
        titulo: 'Una empresa recolectora lo pide.',
        texto: 'Las empresas recolectoras ven en su portal lo que hay disponible y solicitan recolectarlo. El puerto aprueba la solicitud.',
        icono: Truck,
        imagen: '/assets/landing/viaje-4-solicitud.webp',
        alt: 'Portal de la empresa recolectora: residuos disponibles en Puerto Peñasco con el botón Solicitar',
        marco: 'telefono',
    },
    {
        corto: 'Destino',
        titulo: 'Llega a su destino final.',
        texto: 'Al recolectarlo, la empresa recibe su comprobante. Así cada litro se puede seguir desde el barco hasta el reciclaje.',
        icono: Recycle,
        imagen: '/assets/landing/viaje-5-comprobante.webp',
        alt: 'Historial de la empresa recolectora con los comprobantes de cada recolección',
        marco: 'telefono',
    },
];

function Telefono({ children, className = '' }: { children: ReactNode; className?: string }) {
    return (
        <div className={`relative aspect-[390/844] rounded-[44px] bg-simar-abismo p-[10px] shadow-[0_50px_90px_-40px_rgba(11,34,54,0.75)] ring-1 ring-black/5 movil:rounded-[30px] movil:p-[7px] ${className}`}>
            <div className="relative h-full w-full overflow-hidden rounded-[35px] bg-simar-papel movil:rounded-[24px]">{children}</div>
        </div>
    );
}

function Hoja({ paso, className = '', sizes }: { paso: Paso; className?: string; sizes: string }) {
    return (
        <div className={`relative aspect-[900/1115] rounded-[10px] overflow-hidden bg-white shadow-[0_40px_70px_-30px_rgba(11,34,54,0.6)] ring-1 ring-simar-borde ${className}`}>
            <Image src={paso.imagen} alt={paso.alt} fill sizes={sizes} className="object-cover" />
        </div>
    );
}

/** La gota que viaja por el camino */
function GotaMarca({ className = '', style }: { className?: string; style?: CSSProperties }) {
    return (
        <svg viewBox="0 0 28 38" className={className} style={style} aria-hidden="true">
            <path d="M14 1 C14 1 1 17 1 25 a13 13 0 0 0 26 0 C27 17 14 1 14 1 Z" fill="var(--simar-aceite)" stroke="var(--simar-abismo)" strokeWidth="2" />
            <ellipse cx="9.5" cy="24" rx="2.5" ry="4" fill="#FFFFFF" fillOpacity="0.75" />
        </svg>
    );
}

// Qué pantalla enseña el celular en cada paso: en el del manifiesto se queda la del registro y la
// hoja sale de un lado, como recién impresa
const PANTALLA = PASOS.map((p, i) => (p.marco === 'hoja' ? i - 1 : i));
// El tramo de la escena en que avanza la gota (antes y después, quieta en el primer y último paso)
const INICIO = 0.06;
const RECORRIDO = 0.88;

/** El camino con las cinco estaciones; la gota avanza con el scroll y cada estación lleva a su paso */
function Riel({ p, activo, irAPaso }: { p: MotionValue<number>; activo: number; irAPaso: (i: number) => void }) {
    const avance = useRango(p, [INICIO, INICIO + RECORRIDO], ['scaleX(0)', 'scaleX(1)']);
    const gota = useRango(p, [INICIO, INICIO + RECORRIDO], ['translateX(0%)', 'translateX(100%)']);
    return (
        <div className="relative mx-[26px] h-[92px] movil:mx-[20px] movil:h-[56px]">
            <span className="absolute inset-x-0 top-[26px] h-1.5 -translate-y-1/2 rounded-full bg-simar-borde movil:top-[20px] movil:h-1" />
            <m.span style={{ transform: avance }} className="absolute inset-x-0 top-[26px] h-1.5 -translate-y-1/2 rounded-full bg-simar-golfo origin-left movil:top-[20px] movil:h-1" />
            {PASOS.map((paso, i) => {
                const Icono = paso.icono;
                const llego = i <= activo;
                return (
                    <button
                        key={paso.corto}
                        type="button"
                        tabIndex={-1}
                        onClick={() => irAPaso(i)}
                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
                        style={{ left: `${(i / (PASOS.length - 1)) * 100}%` }}
                    >
                        <span
                            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center border-[3px] transition-colors duration-300 movil:w-10 movil:h-10 movil:border-2 ${
                                llego ? 'bg-simar-marea border-simar-marea text-white' : 'bg-simar-superficie border-simar-borde text-simar-texto-2'
                            }`}
                        >
                            <Icono className="w-6 h-6 movil:w-5 movil:h-5" />
                        </span>
                        <span className={`text-[17px] font-bold whitespace-nowrap movil:hidden ${i === activo ? 'text-simar-texto' : 'text-simar-texto-2'}`}>{paso.corto}</span>
                    </button>
                );
            })}
            {/* Una capa del ancho del camino que se recorre: la gota va en su borde izquierdo */}
            <m.div style={{ transform: gota }} className="absolute inset-x-0 -top-[44px] pointer-events-none movil:-top-[34px]">
                <GotaMarca className="w-7 h-[38px] -translate-x-1/2 drop-shadow-[0_6px_8px_rgba(11,34,54,0.35)] movil:w-6 movil:h-[32px]" />
            </m.div>
        </div>
    );
}

/** El celular con las pantallas reales y la hoja del manifiesto que sale de un lado */
function Dispositivo({ activo, entrada }: { activo: number; entrada: MotionValue<string> }) {
    const pantalla = PANTALLA[activo];
    const conHoja = PASOS[activo].marco === 'hoja';
    return (
        <m.div style={{ transform: entrada }} className="relative h-full flex items-center justify-center [transform-style:preserve-3d]">
            <Telefono className="h-full max-h-[min(60svh,620px)] movil:max-h-none">
                {PASOS.map((paso, i) =>
                    paso.marco === 'hoja' ? null : (
                        <m.div
                            key={paso.corto}
                            className="absolute inset-0"
                            initial={false}
                            animate={{
                                opacity: i === pantalla ? 1 : 0,
                                transform: i === pantalla ? 'translateY(0%) scale(1)' : `translateY(${i < pantalla ? -3 : 3}%) scale(0.98)`,
                            }}
                            transition={{ duration: 0.45, ease: FRENA }}
                        >
                            <Image src={paso.imagen} alt="" fill sizes="(min-width: 1024px) 300px, 220px" className="object-cover object-top" />
                        </m.div>
                    )
                )}
            </Telefono>
            {/* La hoja del manifiesto: sale de detrás del celular */}
            <m.div
                className="absolute top-1/2 left-1/2 w-[min(78%,400px)] -translate-y-1/2 max-lg:left-[12%] max-lg:w-[76%]"
                initial={false}
                animate={{
                    opacity: conHoja ? 1 : 0,
                    transform: conHoja ? 'translateX(-2%) rotate(3deg) scale(1)' : 'translateX(-50%) rotate(0deg) scale(0.9)',
                }}
                transition={RESORTE}
            >
                <Hoja paso={PASOS[1]} sizes="400px" />
            </m.div>
        </m.div>
    );
}

/** El texto del paso activo: el nuevo sube y se aclara, el anterior se va hacia arriba (más rápido) */
function TextoPaso({ activo }: { activo: number }) {
    const paso = PASOS[activo];
    return (
        <AnimatePresence mode="wait" initial={false}>
            <m.div
                key={paso.corto}
                initial={{ opacity: 0, transform: 'translateY(16px)' }}
                animate={{ opacity: 1, transform: 'translateY(0px)', transition: { duration: 0.32, ease: FRENA } }}
                exit={{ opacity: 0, transform: 'translateY(-10px)', transition: { duration: 0.16, ease: 'easeIn' } }}
            >
                <p className="flex items-baseline gap-4 movil:gap-3">
                    <span className="text-[96px] font-extrabold leading-none tracking-[-0.04em] tabular-nums text-simar-golfo/25 movil:hidden">
                        {String(activo + 1).padStart(2, '0')}
                    </span>
                    <span className="text-lg font-bold text-simar-marea-tinta movil:text-[15px]">
                        Paso {activo + 1} de {PASOS.length} · {paso.corto}
                    </span>
                </p>
                <h3 className="mt-3 text-[clamp(36px,3.4vw,52px)] font-extrabold leading-[1.06] tracking-[-0.025em] movil:mt-1.5 movil:text-[23px] movil:leading-[1.12] movil:tracking-[-0.01em]">
                    {paso.titulo}
                </h3>
                <p className="mt-4 text-xl leading-relaxed text-simar-texto-2 movil:mt-2 movil:text-[16px]">{paso.texto}</p>
            </m.div>
        </AnimatePresence>
    );
}

/**
 * La escena fija: el celular se levanta al llegar (como cuando se presenta un equipo), cada paso
 * cambia su pantalla y su texto, y la gota recorre el camino. En computadora el texto va a la
 * izquierda y el celular a la derecha; en celular el camino arriba, el celular al centro y el texto
 * abajo.
 */
function Escena() {
    const [ref, p] = useEscena<HTMLDivElement>();
    const reducir = usePrefiereMenosMovimiento();
    // El celular se levanta mientras la escena sube a la pantalla
    const { scrollYProgress: llegada } = useScroll({ target: ref, offset: ['start end', 'start start'] });
    const entrada = useRango(llegada, [0, 1], ['perspective(1400px) rotateX(22deg) scale(0.86) translateY(60px)', 'perspective(1400px) rotateX(0deg) scale(1) translateY(0px)']);
    const [activo, setActivo] = useState(0);
    useMotionValueEvent(p, 'change', (v) => {
        const t = Math.min(1, Math.max(0, (v - INICIO) / RECORRIDO));
        setActivo(Math.round(t * (PASOS.length - 1)));
    });

    const irAPaso = (i: number) => {
        const el = ref.current;
        if (!el) return;
        const inicio = el.getBoundingClientRect().top + window.scrollY;
        const largo = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: inicio + largo * (INICIO + (RECORRIDO * i) / (PASOS.length - 1)) + 2, behavior: reducir ? 'auto' : 'smooth' });
    };

    return (
        <div ref={ref} aria-hidden="true" className="relative h-[520svh]">
            <div className="sticky top-0 h-[100svh] overflow-hidden">
                <div className="h-full max-w-[1248px] mx-auto px-6 pt-[116px] pb-7 flex flex-col movil:px-5 movil:pt-[112px] movil:pb-[76px]">
                    <div className="order-2 flex-1 min-h-0 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-12 items-center max-lg:grid-rows-[minmax(0,1fr)_auto] max-lg:gap-5 movil:order-2">
                        <div className="lg:order-1 order-2 max-w-xl max-lg:min-h-[190px]">
                            <TextoPaso activo={activo} />
                        </div>
                        <div className="lg:order-2 order-1 h-full min-h-0 py-2">
                            <Dispositivo activo={activo} entrada={entrada} />
                        </div>
                    </div>
                    <div className="order-3 mt-6 max-lg:order-1 max-lg:mt-0 max-lg:mb-3">
                        <Riel p={p} activo={activo} irAPaso={irAPaso} />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Con "reducir movimiento": los cinco pasos en lista, cada uno con su pantalla */
function ListaQuieta() {
    return (
        <ol aria-hidden="true" className="mt-12 space-y-14 movil:mt-8 movil:space-y-12">
            {PASOS.map((paso, i) => {
                const Icono = paso.icono;
                return (
                    <li key={paso.corto} className="grid md:grid-cols-[minmax(0,1fr)_auto] gap-6 md:gap-16 items-center">
                        <div>
                            <p className="inline-flex items-center gap-3 text-lg font-bold text-simar-marea-tinta movil:text-[15px]">
                                <span className="w-11 h-11 rounded-full bg-simar-marea text-white flex items-center justify-center">
                                    <Icono className="w-[22px] h-[22px]" />
                                </span>
                                Paso {i + 1} · {paso.corto}
                            </p>
                            <h3 className="mt-3 text-[34px] font-extrabold leading-tight movil:text-[23px]">{paso.titulo}</h3>
                            <p className="mt-3 text-xl leading-relaxed text-simar-texto-2 movil:text-[16px]">{paso.texto}</p>
                        </div>
                        {paso.marco === 'hoja' ? (
                            <Hoja paso={paso} sizes="420px" className="w-full max-w-[420px]" />
                        ) : (
                            <Telefono className="w-[260px] mx-auto md:mx-0 movil:w-[220px]">
                                <Image src={paso.imagen} alt="" fill sizes="260px" className="object-cover object-top" />
                            </Telefono>
                        )}
                    </li>
                );
            })}
        </ol>
    );
}

/**
 * 4 · El viaje de un litro: del barco al reciclaje, con una pantalla real en cada paso. Lo que oye
 * el lector de pantalla es la lista de abajo (la escena es visual).
 */
export function ViajeDeUnLitro() {
    const reducir = usePrefiereMenosMovimiento();
    return (
        <section id="viaje" className="relative bg-simar-superficie">
            <div className="max-w-[1248px] mx-auto px-6 pt-24 md:pt-36 movil:px-5 movil:pt-16">
                <Encabezado
                    antetitulo="Cómo funciona"
                    titulo={<TextoQueSeEnciende texto="El viaje de un litro de aceite." />}
                    texto="Del barco al reciclaje, cada paso queda registrado. Son pantallas reales de SiMAR, con los datos de la demostración."
                />
                <ol className="sr-only">
                    {PASOS.map((paso) => (
                        <li key={paso.corto}>
                            {paso.titulo} {paso.texto} ({paso.alt})
                        </li>
                    ))}
                </ol>
                {reducir && (
                    <div className="pb-24 movil:pb-16">
                        <ListaQuieta />
                    </div>
                )}
            </div>
            {!reducir && <Escena />}
        </section>
    );
}

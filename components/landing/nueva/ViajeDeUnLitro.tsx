'use client';

import { type CSSProperties } from 'react';
import Image from 'next/image';
import { FileSignature, Recycle, Ship, Truck, Warehouse, type LucideIcon } from 'lucide-react';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { Encabezado, useProgresoScroll } from './comunes';

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

function Captura({ paso, className = '', sizes }: { paso: Paso; className?: string; sizes: string }) {
    if (paso.marco === 'hoja') {
        return (
            <div className={`relative aspect-[900/1115] rounded-[10px] overflow-hidden bg-white shadow-[0_30px_60px_-30px_rgba(11,34,54,0.55)] ring-1 ring-simar-borde ${className}`}>
                <Image src={paso.imagen} alt={paso.alt} fill sizes={sizes} className="object-cover" />
            </div>
        );
    }
    return (
        <div className={`relative aspect-[390/844] rounded-[40px] bg-simar-abismo p-[9px] shadow-[0_30px_60px_-30px_rgba(11,34,54,0.7)] movil:rounded-[32px] movil:p-[7px] ${className}`}>
            <div className="relative h-full w-full overflow-hidden rounded-[32px] bg-simar-papel movil:rounded-[26px]">
                <Image src={paso.imagen} alt={paso.alt} fill sizes={sizes} className="object-cover object-top" />
            </div>
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

/**
 * 4 · El viaje de un litro: del barco al reciclaje, con una pantalla real en cada paso. En
 * computadora el camino es horizontal y la gota avanza por él mientras se baja (el bloque se queda
 * fijo); en celular, una línea vertical con la gota que baja y cada paso como tarjeta.
 */
export function ViajeDeUnLitro() {
    const [fijoRef, activo] = useProgresoScroll<HTMLDivElement>(PASOS.length, 'fijo', 'estaciones');
    const [listaRef] = useProgresoScroll<HTMLOListElement>(PASOS.length, 'centro');
    const reducir = usePrefiereMenosMovimiento();
    const paso = PASOS[activo];

    // Las estaciones llevan al paso: el bloque fijo recorre su altura menos una pantalla
    const irAPaso = (i: number) => {
        const el = fijoRef.current;
        if (!el) return;
        const inicio = el.getBoundingClientRect().top + window.scrollY;
        const recorrido = el.offsetHeight - window.innerHeight;
        window.scrollTo({ top: inicio + (recorrido * i) / (PASOS.length - 1) + 2, behavior: reducir ? 'auto' : 'smooth' });
    };

    return (
        <section id="viaje" className="relative bg-simar-superficie px-6 pt-20 md:pt-28 pb-10 lg:pb-0 movil:px-5 movil:pt-14 movil:pb-14">
            <div className="max-w-[1248px] mx-auto">
                <Encabezado
                    antetitulo="Cómo funciona"
                    titulo="El viaje de un litro de aceite."
                    texto="Del barco al reciclaje, cada paso queda registrado. Son pantallas reales de SiMAR, con los datos de la demostración."
                />

                {/* Lo que ve el lector de pantalla: los cinco pasos en orden (el escenario de abajo es visual) */}
                <ol className="sr-only">
                    {PASOS.map((p) => (
                        <li key={p.corto}>
                            {p.titulo} {p.texto}
                        </li>
                    ))}
                </ol>

                {/* ── Computadora ── */}
                <div ref={fijoRef} aria-hidden="true" className="hidden lg:block relative h-[380vh]" style={{ '--ln-progreso': 0 } as CSSProperties}>
                    <div className="sticky top-0 h-screen flex flex-col justify-center pt-[104px] pb-8">
                        {/* El camino */}
                        <div className="relative mx-[26px] h-[104px]">
                            <span className="absolute left-0 right-0 top-[26px] h-1.5 -translate-y-1/2 rounded-full bg-simar-borde" />
                            <span
                                className="absolute left-0 top-[26px] h-1.5 -translate-y-1/2 rounded-full bg-simar-golfo"
                                style={{ width: 'calc(var(--ln-progreso) * 100%)' }}
                            />
                            {PASOS.map((p, i) => {
                                const Icono = p.icono;
                                const llego = i <= activo;
                                return (
                                    <button
                                        key={p.corto}
                                        type="button"
                                        tabIndex={-1}
                                        onClick={() => irAPaso(i)}
                                        className="absolute top-0 -translate-x-1/2 flex flex-col items-center gap-2 cursor-pointer"
                                        style={{ left: `${(i / (PASOS.length - 1)) * 100}%` }}
                                    >
                                        <span
                                            className={`w-[52px] h-[52px] rounded-full flex items-center justify-center border-[3px] transition-colors duration-300 ${
                                                llego ? 'bg-simar-marea border-simar-marea text-white' : 'bg-simar-superficie border-simar-borde text-simar-texto-2'
                                            }`}
                                        >
                                            <Icono className="w-6 h-6" />
                                        </span>
                                        <span className={`text-[17px] font-bold whitespace-nowrap ${i === activo ? 'text-simar-texto' : 'text-simar-texto-2'}`}>{p.corto}</span>
                                    </button>
                                );
                            })}
                            <GotaMarca
                                className="absolute -top-[46px] w-7 h-[38px] -translate-x-1/2 drop-shadow-[0_6px_8px_rgba(11,34,54,0.35)]"
                                style={{ left: 'calc(var(--ln-progreso) * 100%)' }}
                            />
                        </div>

                        {/* El paso activo */}
                        <div className="mt-6 grid grid-cols-[minmax(0,1fr)_auto] gap-16 items-center">
                            <div key={paso.corto} className="ln-cambia max-w-xl">
                                <p className="text-lg font-bold text-simar-marea-tinta">
                                    Paso {activo + 1} de {PASOS.length}
                                </p>
                                <h3 className="mt-2 text-[44px] font-extrabold leading-[1.1]">{paso.titulo}</h3>
                                <p className="mt-4 text-[21px] leading-relaxed text-simar-texto-2">{paso.texto}</p>
                            </div>
                            <div className="relative h-[min(60vh,620px)] aspect-[900/1115] flex items-center justify-center">
                                {PASOS.map((p, i) => (
                                    <div
                                        key={p.corto}
                                        className={`absolute inset-0 flex items-center justify-center transition-[opacity,transform] duration-500 ${
                                            i === activo ? 'opacity-100 scale-100' : 'opacity-0 scale-[0.97]'
                                        }`}
                                    >
                                        <Captura paso={p} sizes={p.marco === 'hoja' ? '500px' : '290px'} className={`h-full ${p.marco === 'hoja' ? '-rotate-1' : ''}`} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

                {/* ── Celular y tableta ── */}
                <ol ref={listaRef} aria-hidden="true" className="lg:hidden relative mt-10 movil:mt-8" style={{ '--ln-progreso': 0 } as CSSProperties}>
                    <span className="absolute left-[21px] top-2 bottom-2 w-1.5 -translate-x-1/2 rounded-full bg-simar-borde" />
                    <span className="absolute left-[21px] top-2 w-1.5 -translate-x-1/2 rounded-full bg-simar-golfo" style={{ height: 'calc(var(--ln-progreso) * (100% - 16px))' }} />
                    <GotaMarca
                        className="absolute left-[21px] w-7 h-[38px] -translate-x-1/2 -translate-y-1/2 z-10 drop-shadow-[0_6px_8px_rgba(11,34,54,0.35)]"
                        style={{ top: 'calc(8px + var(--ln-progreso) * (100% - 16px))' }}
                    />
                    {PASOS.map((p, i) => {
                        const Icono = p.icono;
                        return (
                            <li key={p.corto} className="relative grid grid-cols-[44px_minmax(0,1fr)] gap-x-4 pb-14 last:pb-0 movil:gap-x-3 movil:pb-12">
                                <span className="relative z-[1] w-11 h-11 rounded-full bg-simar-marea text-white flex items-center justify-center">
                                    <Icono className="w-[22px] h-[22px]" />
                                </span>
                                <div>
                                    <p className="text-[17px] font-bold text-simar-marea-tinta movil:text-[15px]">
                                        Paso {i + 1} · {p.corto}
                                    </p>
                                    <h3 className="mt-1 text-[28px] font-extrabold leading-tight movil:text-[22px]">{p.titulo}</h3>
                                    <p className="mt-2.5 text-lg leading-relaxed text-simar-texto-2 movil:text-[16px]">{p.texto}</p>
                                    <Captura
                                        paso={p}
                                        sizes={p.marco === 'hoja' ? '(min-width: 640px) 420px, 85vw' : '240px'}
                                        className={`ln-sube mt-6 ${p.marco === 'hoja' ? 'w-full max-w-[420px]' : 'w-[240px] max-w-full mx-auto sm:mx-0 movil:w-[220px]'}`}
                                    />
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

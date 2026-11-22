'use client';

import type { CSSProperties, ReactNode } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Award } from 'lucide-react';
import { TextoEnfoca } from '../comun';
import { HojaPapel } from './HojaPapel';
import { ManifiestoDigital } from './ManifiestoDigital';
import './don-francisco.css';

const SLUG_HISTORIA = 'conanp-reconoce-25-anios-del-centro-de-acopio';

/**
 * Don Francisco (#don-francisco), en dos pantallas:
 * 1. La persona: retrato, su cita y los 25 años del reconocimiento de la CONANP.
 * 2. La hoja que se vuelve dato: la hoja a mano se descubre (dos translate opuestos) y deja ver
 *    el manifiesto en SiMAR; las frases se empujan al bajar.
 * Todo el movimiento es CSS atado al scroll (don-francisco.css); sin soporte o con «reducir
 * movimiento» queda quieto: la hoja y el manifiesto lado a lado y las frases en orden.
 */
export function DonFrancisco({ totalManifiestos }: { totalManifiestos: number | undefined }) {
    const params = useParams<{ locale: string }>();
    const locale = params?.locale ?? 'es';
    const hayManifiestos = typeof totalManifiestos === 'number' && totalManifiestos > 0;

    return (
        <section
            id="don-francisco"
            aria-labelledby="df-titulo"
            className="df relative bg-simar-papel text-simar-texto"
        >
            <Persona hrefHistoria={`/${locale}/noticias/${SLUG_HISTORIA}`} />
            <HojaQueSeVuelveDato total={hayManifiestos ? totalManifiestos : null} />
        </section>
    );
}

/* ---------- Pantalla 1: la persona ---------- */

function Persona({ hrefHistoria }: { hrefHistoria: string }) {
    return (
        <div className="df-persona max-w-[1248px] mx-auto px-6 pt-24 pb-16 md:pt-32 md:pb-24 movil:px-5 movil:pt-16 movil:pb-10">
            <header className="df-cabeza">
                <p className="df-sube text-[17px] font-bold text-simar-marea-tinta">Quién los recibe</p>
                <h2
                    id="df-titulo"
                    className="df-titulo mt-3 text-[56px] font-extrabold leading-[1.04] movil:mt-2 movil:text-[36px] movil:leading-[1.08]"
                >
                    <TextoEnfoca texto="Para él se hizo SiMAR." />
                </h2>
            </header>

            <figure className="df-foto m-0">
                {/* El marco recorta con overflow clip (nunca hidden: congelaría el view() de adentro) */}
                <div className="df-marco">
                    <div className="df-retrato-capa">
                        <Image
                            src="/assets/images/img4.jpeg"
                            alt="Francisco Javier Bojórquez Ochoa con su reconocimiento de la CONANP, en Puerto Peñasco"
                            fill
                            sizes="(min-width: 640px) 520px, calc(100vw - 40px)"
                            loading="lazy"
                            className="df-retrato object-cover"
                        />
                    </div>
                </div>

                {/* La cifra sale del fondo: tarjeta blanca, ícono suave */}
                <div className="df-cifra rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar p-5 flex items-start gap-4 movil:p-4 movil:gap-3">
                    <span className="w-12 h-12 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center shrink-0 movil:w-11 movil:h-11">
                        <Award aria-hidden="true" className="w-6 h-6" strokeWidth={2} />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[40px] leading-none font-extrabold tracking-[-0.02em] tabular-nums movil:text-[34px]">
                            25 años
                        </p>
                        <p className="mt-2 text-[17px] leading-snug text-simar-texto-2">
                            al frente del centro de acopio. Reconocimiento de la CONANP, 2025.
                        </p>
                    </div>
                </div>
            </figure>

            <blockquote className="df-cita m-0">
                <p className="df-lado relative text-[30px] leading-[1.28] font-bold tracking-[-0.01em] movil:text-[23px] movil:leading-[1.3]">
                    <span aria-hidden="true" className="df-comillas">“</span>
                    Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre de Puerto Peñasco.”
                </p>
                <footer className="df-lado df-lado-tarde mt-6 flex items-center gap-3 movil:mt-5">
                    <span aria-hidden="true" className="df-firma-linea" />
                    <cite className="not-italic text-[18px] font-bold text-simar-texto movil:text-[17px]">
                        Francisco Javier Bojórquez Ochoa
                    </cite>
                </footer>
            </blockquote>

            <div className="df-enlace">
                <Link
                    href={hrefHistoria}
                    data-vidrio=""
                    className="simar-presiona group min-h-[56px] pl-6 pr-2 rounded-full inline-flex items-center gap-3 bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold focus-visible:outline-none focus-visible:ring-4 focus-visible:ring-simar-golfo/50 movil:min-h-[52px]"
                >
                    Lee su historia
                    <span className="w-10 h-10 rounded-full bg-white/15 flex items-center justify-center">
                        <ArrowRight
                            aria-hidden="true"
                            className="w-[18px] h-[18px] transition-transform duration-200 group-hover:translate-x-0.5"
                            strokeWidth={2.4}
                        />
                    </span>
                </Link>
            </div>
        </div>
    );
}

/* ---------- Pantalla 2: la hoja que se vuelve dato ---------- */

/** Una frase de la pista. `entra` / `sale`: rangos de la línea --df-pista (p. ej. "contain 28% contain 40%") */
type Frase = { clave: string; contenido: ReactNode; entra?: string; sale?: string };

/** Reparte las frases sobre la pista: la nueva sube y empuja a la anterior en cada cambio */
function repartir(contenidos: { clave: string; contenido: ReactNode }[]): Frase[] {
    // Puntos de cambio (en % del tramo fijo); la hoja se descubre entre 8 % y 46 %. La que sale
    // termina de apagarse 1 % antes del cambio y la nueva empieza justo en él: nunca se enciman
    const cambios = contenidos.length === 4 ? [28, 56, 80] : [30, 66];
    return contenidos.map((c, i) => {
        const antes = i > 0 ? cambios[i - 1] : undefined;
        const despues = i < contenidos.length - 1 ? cambios[i] : undefined;
        return {
            ...c,
            entra: antes !== undefined ? `contain ${antes}% contain ${antes + 8}%` : undefined,
            sale: despues !== undefined ? `contain ${despues - 9}% contain ${despues - 1}%` : undefined,
        };
    });
}

function HojaQueSeVuelveDato({ total }: { total: number | null }) {
    const frases = repartir([
        { clave: 'antes', contenido: 'Antes, cada entrega se anotaba a mano.' },
        { clave: 'ahora', contenido: 'Ahora es un dato que no se borra.' },
        ...(total !== null
            ? [
                  {
                      clave: 'total',
                      contenido: (
                          <>
                              Ya son{' '}
                              <span className="text-simar-marea-tinta tabular-nums">{total.toLocaleString('es-MX')}</span>{' '}
                              manifiestos así.
                          </>
                      ),
                  },
              ]
            : []),
        { clave: 'con-el', contenido: 'Hecho con él: letra grande y pasos claros.' },
    ]);

    return (
        <div className="df-pista">
            <div className="df-escenario">
                <div className="df-escena max-w-[1248px] mx-auto w-full px-6 movil:px-5">
                    <div className="df-texto">
                        <h3 className="df-sobre">La hoja que se vuelve dato</h3>
                        <div className="df-frases">
                            {frases.map((f) => (
                                <p
                                    key={f.clave}
                                    className="df-frase"
                                    data-entra={f.entra ? '' : undefined}
                                    data-sale={f.sale ? '' : undefined}
                                    style={{ '--df-entra': f.entra, '--df-sale': f.sale } as CSSProperties}
                                >
                                    <span className="df-frase-texto">{f.contenido}</span>
                                </p>
                            ))}
                        </div>
                        {/* Cuánto falta de la pista: una línea fina que se llena */}
                        <div className="df-avance" aria-hidden="true">
                            <span />
                        </div>
                    </div>

                    <div className="df-mesa">
                        {/* Abajo, quieto: el manifiesto en SiMAR */}
                        <figure
                            className="df-lamina df-lamina-ahora"
                            role="img"
                            aria-label="El mismo manifiesto en SiMAR, firmado y guardado"
                        >
                            <ManifiestoDigital />
                            {/* La palomita va en HTML: se anima compuesta, sin repintar el dibujo */}
                            <span className="df-ok" aria-hidden="true">
                                <svg viewBox="0 0 24 24" focusable="false">
                                    <path d="M6 12.5 L10.2 16.6 L18 8" />
                                </svg>
                            </span>
                            <span className="df-chip df-chip-ahora">Ahora</span>
                        </figure>

                        {/* Encima, la hoja a mano: la capa se corre a la izquierda y su contenido a la
                            derecha lo mismo; la hoja no se mueve, sólo se descubre */}
                        <div className="df-capa">
                            <div className="df-capa-contra">
                                <figure
                                    className="df-lamina df-lamina-antes"
                                    role="img"
                                    aria-label="Manifiesto anotado a mano en una hoja de papel"
                                >
                                    <HojaPapel />
                                    <span className="df-chip df-chip-antes">Antes</span>
                                </figure>
                            </div>
                        </div>

                        {/* La orilla de la hoja: una barra fina con su sombra que avanza con ella,
                            recortada a la tarjeta para que nunca asome por fuera */}
                        <div className="df-orilla-marco" aria-hidden="true">
                            <div className="df-orilla" />
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

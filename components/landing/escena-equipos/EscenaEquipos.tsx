'use client';

import { useEffect, useRef, useState } from 'react';
import { ArrowDown } from 'lucide-react';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { cuandoEnReposo } from '@/lib/utils/reposo';
import type { MotorEquipos } from './motorEquipos';
import { EquiposPlanos } from './EquiposPlanos';

/**
 * «Así funciona SiMAR»: una escena fija mientras se baja, al estilo de las páginas de producto de
 * Apple. Una laptop y un celular realistas (motorEquipos.ts) con las pantallas reales de la
 * demostración: la laptop cerrada gira hacia el frente, se abre en el Panel, pasa al manifiesto y a
 * Estadísticas, y al final entra el celular con el portal de las empresas. Arriba, una sola frase
 * por paso.
 *
 * Nunca queda en blanco: la versión plana (EquiposPlanos.tsx: los mismos equipos dibujados, con las
 * mismas capturas y los mismos pasos) se ve desde el principio y se desvanece cuando el 3D está listo.
 * Las frases y los puntos siguen al scroll por su cuenta: no esperan al motor.
 *
 * Carga (para no trabar la portada ni llegar tarde si se baja rápido):
 *  - ya cargada la página y en un rato libre (cuandoEnReposo) empieza la descarga de los modelos
 *    (≈ 2.7 MB, sólo red) y, en el siguiente rato libre, se baja three.js y se arma el motor, sin
 *    esperar a que la sección esté cerca (va justo después de la portada);
 *  - el motor se arma en pedazos, uno por rato libre (motorEquipos.ts), y entra con un fundido;
 *  - en equipos que no dan para el 3D se queda la versión plana (ver `capacidad3D`).
 * Al bajar:
 *  - el avance sigue al scroll con un resorte (sin saltos con la rueda del ratón);
 *  - sólo se escucha el scroll mientras la sección está cerca.
 * Con «reducir movimiento» no hay recorrido ni 3D: la toma final, quieta, en plano.
 */

const PASOS = [
    { desde: 0, antetitulo: 'Cómo funciona', titulo: 'Así trabaja SiMAR en el muelle.' },
    { desde: 0.2, antetitulo: 'El Panel', titulo: 'Todo el centro de acopio, en una pantalla.' },
    { desde: 0.5, antetitulo: 'Manifiesto digital', titulo: 'Se llena y se firma ahí mismo.' },
    { desde: 0.65, antetitulo: 'Estadísticas', titulo: 'Las cifras se cuentan solas.' },
    { desde: 0.82, antetitulo: 'Empresas recolectoras', titulo: 'Y quien recicla, conectado.' },
];

const OPCIONES = {
    laptop: '/assets/landing/3d/modelos/laptop.glb',
    celular: '/assets/landing/3d/modelos/celular.glb',
    pantallas: [
        '/assets/landing/3d/pantalla-panel.webp',
        '/assets/landing/3d/pantalla-manifiesto.webp',
        '/assets/landing/3d/pantalla-estadisticas.webp',
        '/assets/landing/3d/pantalla-portal.webp',
    ],
    capturaCelular: '/assets/landing/3d/celular-portal.webp',
};

/** Avance de la toma final, la que se ve con «reducir movimiento» */
const TOMA_QUIETA = 1;

const pasoDe = (p: number) => {
    let i = 0;
    PASOS.forEach((s, k) => {
        if (p >= s.desde) i = k;
    });
    return i;
};

type NavegadorConPistas = Navigator & {
    /** GB, redondeado (0.25 … 8); sólo Chromium */
    deviceMemory?: number;
    connection?: { saveData?: boolean; effectiveType?: string };
};

/**
 * ¿Vale el 3D en este equipo? Si no, se queda la versión plana, que cuenta lo mismo. Regla:
 *  - no con «ahorro de datos» ni con red lenta (2G/3G): son ≈ 2.7 MB de modelos;
 *  - no sin WebGL;
 *  - no en equipos muy justos: ≤ 2 núcleos o ≤ 2 GB de memoria;
 *  - no en celulares Android de gama baja: pantalla angosta (< 768 px) o táctil y ≤ 4 núcleos
 *    (sólo cuando el navegador dice su memoria, o sea Chromium; los iPhone, que mueven bien WebGL
 *    pero no la reportan, se quedan con el 3D).
 * Densidad del lienzo: 1.25× en celulares y tabletas (táctiles o < 768 px) y en equipos de ≤ 4
 * núcleos o ≤ 4 GB; 1.5× en el resto.
 */
function capacidad3D(): { usar: boolean; densidadMax: number } {
    const nav = navigator as NavegadorConPistas;
    const nucleos = nav.hardwareConcurrency || 4;
    const memoria = nav.deviceMemory;
    const red = nav.connection;
    const celular = window.matchMedia('(max-width: 767px), (pointer: coarse)').matches;
    const modesto = celular || nucleos <= 4 || (memoria !== undefined && memoria <= 4);
    const densidadMax = modesto ? 1.25 : 1.5;
    const no = { usar: false, densidadMax };
    if (red?.saveData || /2g|3g/.test(red?.effectiveType ?? '')) return no;
    if (typeof WebGLRenderingContext === 'undefined') return no;
    if (nucleos <= 2 || (memoria !== undefined && memoria <= 2)) return no;
    if (celular && memoria !== undefined && nucleos <= 4) return no;
    return { usar: true, densidadMax };
}

/** Un .glb completo, pedido con prioridad baja (que no le gane a las fotos que se están viendo) */
function pedirModelo(url: string, senal: AbortSignal): Promise<ArrayBuffer> {
    const pedido = fetch(url, { signal: senal, priority: 'low' } as RequestInit).then((r) => {
        if (!r.ok) throw new Error(`${url}: ${r.status}`);
        return r.arrayBuffer();
    });
    // Si se cancela antes de usarlo, no queda como «rechazo sin atender»
    pedido.catch(() => {});
    return pedido;
}

const ratoLibre = () => new Promise<void>((listo) => cuandoEnReposo(() => listo()));

export function EscenaEquipos() {
    const reducir = usePrefiereMenosMovimiento();
    const pistaRef = useRef<HTMLDivElement>(null);
    const lienzoRef = useRef<HTMLDivElement>(null);
    // El recuadro de las frases: el motor encuadra los equipos debajo de él
    const frasesRef = useRef<HTMLDivElement>(null);
    const [paso, setPaso] = useState(0);
    // El 3D ya está dibujado: la versión plana se desvanece
    const [listo, setListo] = useState(false);

    useEffect(() => {
        const pista = pistaRef.current;
        const lienzo = lienzoRef.current;
        if (!pista || !lienzo) return;

        let motor: MotorEquipos | null = null;
        let vivo = true;
        let cuadro = 0;
        let antes = 0;
        let meta = reducir ? TOMA_QUIETA : 0;
        let mostrado = meta;
        let pasoActual = -1;
        const ponerPaso = (p: number) => {
            const i = pasoDe(p);
            if (i === pasoActual) return;
            pasoActual = i;
            setPaso(i);
        };

        const avance = () => {
            if (reducir) return TOMA_QUIETA;
            const r = pista.getBoundingClientRect();
            const recorrido = r.height - window.innerHeight;
            return recorrido > 0 ? Math.min(1, Math.max(0, -r.top / recorrido)) : 0;
        };

        // Resorte sin rebote: el avance mostrado alcanza al del scroll en ~0.3 s (sólo con el 3D)
        const tick = (ahora: number) => {
            const dt = antes ? Math.min(0.05, (ahora - antes) / 1000) : 1 / 60;
            antes = ahora;
            const d = meta - mostrado;
            mostrado = Math.abs(d) < 0.0005 ? meta : mostrado + d * (1 - Math.exp(-dt * 11));
            motor?.pintar(mostrado);
            ponerPaso(mostrado);
            if (mostrado !== meta && motor) cuadro = requestAnimationFrame(tick);
            else {
                cuadro = 0;
                antes = 0;
            }
        };
        const alMover = () => {
            meta = avance();
            if (!motor) {
                // Sin 3D (todavía): el paso sigue directo al scroll; las transiciones de la versión
                // plana y de las frases ya suavizan el cambio
                mostrado = meta;
                ponerPaso(meta);
                return;
            }
            if (!cuadro) cuadro = requestAnimationFrame(tick);
        };
        const alCambiarTamano = () => {
            if (!motor) return alMover();
            motor.medir();
            meta = avance();
            mostrado = meta;
            motor.pintar(mostrado);
            ponerPaso(mostrado);
        };

        // El 3D: ya cargada la página y en reposo, sin esperar a que la sección esté cerca
        const cancelar = new AbortController();
        const reserva = () => {
            // Lo que tapa la página: arriba, hasta el pie del recuadro de las frases; abajo, los
            // puntos de los pasos (y «Baja para abrirla»)
            const frases = frasesRef.current?.getBoundingClientRect();
            const arriba = frases ? frases.bottom - lienzo.getBoundingClientRect().top : 0;
            return { arriba, abajo: 76 };
        };
        const arrancar = async (densidadMax: number) => {
            try {
                // Primero la red (no ocupa el hilo principal); three.js, en el siguiente rato libre
                const modelos = {
                    laptop: pedirModelo(OPCIONES.laptop, cancelar.signal),
                    celular: pedirModelo(OPCIONES.celular, cancelar.signal),
                };
                await ratoLibre();
                if (!vivo) return;
                const { crearMotorEquipos } = await import('./motorEquipos');
                if (!vivo) return;
                const m = await crearMotorEquipos(lienzo, { ...OPCIONES, modelos, densidadMax }, () => vivo, reserva);
                if (!vivo) {
                    m.liberar();
                    return;
                }
                motor = m;
                // Se armó en varios ratos: por si la ventana cambió de tamaño mientras tanto
                m.medir();
                meta = mostrado = avance();
                m.pintar(mostrado);
                ponerPaso(mostrado);
                setListo(true);
            } catch (e) {
                // Se queda la versión plana
                if (vivo) console.error('Escena 3D de la landing:', e);
            }
        };
        let soltarReposo = () => {};
        if (!reducir) {
            const { usar, densidadMax } = capacidad3D();
            if (usar) soltarReposo = cuandoEnReposo(() => void arrancar(densidadMax));
        }

        // El scroll sólo se escucha mientras la sección está cerca
        let cerca = false;
        const escuchar = new IntersectionObserver(
            (entradas) => {
                const ahora = entradas.some((e) => e.isIntersecting);
                if (ahora === cerca) return;
                cerca = ahora;
                if (cerca) {
                    window.addEventListener('scroll', alMover, { passive: true });
                    alMover();
                } else {
                    window.removeEventListener('scroll', alMover);
                    // Al salir, queda en su toma de la orilla (arriba o abajo)
                    alMover();
                }
            },
            { rootMargin: '20% 0px' }
        );
        escuchar.observe(pista);
        window.addEventListener('resize', alCambiarTamano);
        return () => {
            vivo = false;
            soltarReposo();
            cancelar.abort();
            escuchar.disconnect();
            cancelAnimationFrame(cuadro);
            window.removeEventListener('scroll', alMover);
            window.removeEventListener('resize', alCambiarTamano);
            motor?.liberar();
            // Sin motor, vuelve la versión plana
            setListo(false);
        };
    }, [reducir]);

    const visible = reducir ? 0 : paso;

    return (
        <section id="como-funciona" aria-labelledby="como-funciona-titulo" className="relative bg-simar-superficie">
            <h2 id="como-funciona-titulo" className="sr-only">
                Así trabaja SiMAR en el muelle
            </h2>
            <ol className="sr-only">
                {PASOS.slice(1).map((s) => (
                    <li key={s.antetitulo}>
                        {s.antetitulo}: {s.titulo}
                    </li>
                ))}
            </ol>

            {/* La pista da el recorrido del scroll; el escenario se queda fijo mientras tanto */}
            <div ref={pistaRef} className="relative" style={{ height: reducir ? 'auto' : '400svh' }}>
                <div
                    className="top-0 overflow-clip"
                    style={{ position: reducir ? 'relative' : 'sticky', height: '100svh', minHeight: 560 }}
                >
                    {/* El motor pone aquí su lienzo */}
                    <div
                        ref={lienzoRef}
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ opacity: listo ? 1 : 0, transition: 'opacity 700ms ease' }}
                    />

                    {/* La versión plana: desde el primer momento, hasta que el 3D está listo (o siempre) */}
                    <EquiposPlanos paso={paso} oculto={listo} quieto={reducir} />

                    {/* Una frase por paso, arriba de los equipos. Sin desvanecido: la frase que sigue sube
                        desde abajo y empuja a la anterior fuera del recuadro, como las pantallas */}
                    {/* Debajo de la isla (≈ 84 px en celular, 108 px de 768 en adelante) con aire */}
                    <div aria-hidden="true" className="relative z-10 px-6 text-center pointer-events-none pt-[max(100px,13svh)] md:pt-[max(128px,14svh)]">
                        <div ref={frasesRef} className="relative mx-auto max-w-[900px] overflow-clip" style={{ height: 'clamp(124px, 17svh, 176px)' }}>
                            {PASOS.map((s, i) => {
                                const activo = i === visible;
                                return (
                                    <div
                                        key={s.antetitulo}
                                        className="absolute inset-x-0 top-0"
                                        style={{
                                            // La de abajo espera justo bajo el recuadro (mide hasta 176 px)
                                            transform: activo ? 'none' : i < visible ? 'translateY(-115%)' : 'translateY(184px)',
                                            transition: 'transform 520ms cubic-bezier(0.22,1,0.36,1)',
                                        }}
                                    >
                                        <p className="text-lg font-bold text-simar-marea-tinta movil:text-[17px]">{s.antetitulo}</p>
                                        {/* La letra también sigue al alto de la pantalla (5.6svh): con sólo el
                                            ancho, en una laptop de 1280 × 800 los títulos de dos renglones medían
                                            154 px en un recuadro de 136 y se cortaba el segundo renglón */}
                                        <p
                                            className="mt-2 font-extrabold text-simar-texto"
                                            style={{ fontSize: 'clamp(28px, min(4.4vw, 5.6svh), 60px)', lineHeight: 1.05, letterSpacing: '-0.03em' }}
                                        >
                                            {s.titulo}
                                        </p>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {!reducir && (
                        <>
                            {/* Pista para bajar, sólo al principio */}
                            <div
                                aria-hidden="true"
                                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2 whitespace-nowrap text-[17px] font-semibold text-simar-texto-2"
                                style={{ bottom: 'calc(30px + env(safe-area-inset-bottom, 0px))', opacity: paso === 0 ? 1 : 0, transition: 'opacity 400ms ease' }}
                            >
                                <ArrowDown className="w-5 h-5" />
                                {listo ? 'Baja para abrirla' : 'Baja para encenderla'}
                            </div>
                            {/* Cuatro pasos: el actual se alarga */}
                            <div
                                aria-hidden="true"
                                className="absolute left-1/2 -translate-x-1/2 flex items-center gap-2"
                                style={{ bottom: 'calc(36px + env(safe-area-inset-bottom, 0px))', opacity: paso > 0 ? 1 : 0, transition: 'opacity 400ms ease' }}
                            >
                                {PASOS.slice(1).map((s, i) => (
                                    <span
                                        key={s.antetitulo}
                                        className="block h-2 rounded-full"
                                        style={{
                                            width: paso - 1 === i ? 32 : 8,
                                            background: paso - 1 === i ? 'var(--simar-marea)' : 'color-mix(in srgb, var(--simar-texto) 20%, transparent)',
                                            transition: 'width 350ms cubic-bezier(0.22,1,0.36,1), background-color 350ms ease',
                                        }}
                                    />
                                ))}
                            </div>
                        </>
                    )}
                </div>
            </div>
        </section>
    );
}

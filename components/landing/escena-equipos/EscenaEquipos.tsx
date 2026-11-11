'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { ArrowDown } from 'lucide-react';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { cuandoEnReposo } from '@/lib/utils/reposo';
import type { MotorEquipos } from './motorEquipos';

/**
 * «Así funciona SiMAR»: una escena fija mientras se baja, al estilo de las páginas de producto de
 * Apple. Una laptop y un celular realistas (motorEquipos.ts) con las pantallas reales de la
 * demostración: la laptop cerrada gira hacia el frente, se abre en el Panel, pasa al manifiesto y a
 * Estadísticas, y al final entra el celular con el portal de las empresas. Arriba, una sola frase
 * por paso.
 *
 * - El avance sigue al scroll con un resorte (sin saltos con la rueda del ratón).
 * - Para no trabar la carga de la página: los modelos (≈ 2.5 MB) se bajan en segundo plano cuando
 *   la página ya cargó y está en reposo (requestIdleCallback), y la escena se arma cuando la
 *   sección está a una pantalla; el motor compila y sube texturas de a poco (motorEquipos.ts).
 * - Sólo escucha el scroll mientras la sección está cerca.
 * - Con «reducir movimiento» no hay recorrido: se ve la toma final, quieta.
 * - Si WebGL falla, queda la captura del Panel.
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

export function EscenaEquipos() {
    const reducir = usePrefiereMenosMovimiento();
    const pistaRef = useRef<HTMLDivElement>(null);
    const lienzoRef = useRef<HTMLDivElement>(null);
    // El recuadro de las frases: el motor encuadra los equipos debajo de él
    const frasesRef = useRef<HTMLDivElement>(null);
    const [paso, setPaso] = useState(0);
    const [estado, setEstado] = useState<'cargando' | 'listo' | 'error'>('cargando');

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

        // Resorte sin rebote: el avance mostrado alcanza al del scroll en ~0.3 s
        const tick = (ahora: number) => {
            const dt = antes ? Math.min(0.05, (ahora - antes) / 1000) : 1 / 60;
            antes = ahora;
            const d = meta - mostrado;
            mostrado = Math.abs(d) < 0.0005 ? meta : mostrado + d * (1 - Math.exp(-dt * 11));
            motor?.pintar(mostrado);
            ponerPaso(mostrado);
            if (mostrado !== meta) cuadro = requestAnimationFrame(tick);
            else {
                cuadro = 0;
                antes = 0;
            }
        };
        const alMover = () => {
            meta = avance();
            if (!cuadro && motor) cuadro = requestAnimationFrame(tick);
        };
        const alCambiarTamano = () => {
            if (!motor) return;
            motor.medir();
            meta = avance();
            mostrado = meta;
            motor.pintar(mostrado);
        };

        let iniciado = false;
        const iniciar = async () => {
            if (iniciado) return;
            iniciado = true;
            try {
                const { crearMotorEquipos } = await import('./motorEquipos');
                // Lo que tapa la página: arriba, hasta el pie del recuadro de las frases; abajo, los
                // puntos de los pasos (y «Baja para abrirla»)
                const reserva = () => {
                    const frases = frasesRef.current?.getBoundingClientRect();
                    const arriba = frases ? frases.bottom - lienzo.getBoundingClientRect().top : 0;
                    return { arriba, abajo: 76 };
                };
                const m = await crearMotorEquipos(lienzo, OPCIONES, () => vivo, reserva);
                if (!vivo) {
                    m.liberar();
                    return;
                }
                motor = m;
                meta = mostrado = avance();
                m.pintar(mostrado);
                ponerPaso(mostrado);
                setEstado('listo');
            } catch (e) {
                if (!vivo) return;
                console.error('Escena 3D de la landing:', e);
                setEstado('error');
            }
        };

        // 1. Ya cargada la página y en reposo: los archivos se bajan en segundo plano (a la caché)
        const soltarReposo = cuandoEnReposo(() => {
            const archivos = [OPCIONES.laptop, OPCIONES.celular, ...OPCIONES.pantallas, OPCIONES.capturaCelular];
            for (const url of archivos)
                fetch(url, { priority: 'low' } as RequestInit)
                    .then((r) => r.blob())
                    .catch(() => {});
        });

        // 2. A una pantalla de distancia: se arma la escena (si la página ya cargó)
        let cerca = false;
        const armar = new IntersectionObserver(
            (entradas) => {
                if (!entradas.some((e) => e.isIntersecting)) return;
                armar.disconnect();
                if (document.readyState === 'complete') iniciar();
                else window.addEventListener('load', iniciar, { once: true });
            },
            { rootMargin: '100% 0px' }
        );
        armar.observe(pista);

        // 3. El scroll sólo se escucha mientras la sección está cerca
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
            armar.disconnect();
            escuchar.disconnect();
            window.removeEventListener('load', iniciar);
            cancelAnimationFrame(cuadro);
            window.removeEventListener('scroll', alMover);
            window.removeEventListener('resize', alCambiarTamano);
            motor?.liberar();
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
                    className="top-0 overflow-hidden"
                    style={{ position: reducir ? 'relative' : 'sticky', height: '100svh', minHeight: 560 }}
                >
                    {/* El motor pone aquí su lienzo */}
                    <div
                        ref={lienzoRef}
                        aria-hidden="true"
                        className="absolute inset-0"
                        style={{ opacity: estado === 'listo' ? 1 : 0, transition: 'opacity 700ms ease' }}
                    />

                    {estado === 'error' && (
                        <div className="absolute inset-x-6 bottom-[8svh] top-[34svh] flex items-center justify-center">
                            <div className="relative w-full max-w-[760px] aspect-[16/10] rounded-[22px] overflow-hidden border-[10px] border-[#1b1f24] shadow-simar">
                                <Image src="/assets/landing/3d/pantalla-panel.webp" alt="" fill sizes="760px" className="object-cover object-left-top" />
                            </div>
                        </div>
                    )}

                    {/* Una frase por paso, arriba de los equipos. Sin desvanecido: la frase que sigue sube
                        desde abajo y empuja a la anterior fuera del recuadro, como las pantallas */}
                    {/* Debajo de la isla (74 px en celular, 108 px de 768 en adelante) con aire */}
                    <div aria-hidden="true" className="relative z-10 px-6 text-center pointer-events-none pt-[max(100px,13svh)] md:pt-[max(128px,14svh)]">
                        <div ref={frasesRef} className="relative mx-auto max-w-[900px] overflow-hidden" style={{ height: 'clamp(124px, 17svh, 176px)' }}>
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
                                        <p className="text-lg font-bold text-simar-marea-tinta movil:text-[15px]">{s.antetitulo}</p>
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
                                className="absolute left-1/2 -translate-x-1/2 bottom-8 flex items-center gap-2 text-base font-semibold text-simar-texto-2"
                                style={{ opacity: paso === 0 && estado === 'listo' ? 1 : 0, transition: 'opacity 400ms ease' }}
                            >
                                <ArrowDown className="w-5 h-5" />
                                Baja para abrirla
                            </div>
                            {/* Cuatro pasos: el actual se alarga */}
                            <div
                                aria-hidden="true"
                                className="absolute left-1/2 -translate-x-1/2 bottom-9 flex items-center gap-2"
                                style={{ opacity: paso > 0 ? 1 : 0, transition: 'opacity 400ms ease' }}
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

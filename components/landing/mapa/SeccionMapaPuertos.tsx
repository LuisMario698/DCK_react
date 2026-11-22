'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Anchor, MapPin } from 'lucide-react';
import MapaSilueta from './MapaSilueta';
import { PUERTOS, VARIANTES_MAPA, type VarianteMapa } from './puertos';
import './mapa.css';

// Las variantes con MapLibre (WebGL) sólo existen para comparar en desarrollo: en producción
// el mapa es siempre la silueta SVG, ligera y sin WebGL
const EN_DESARROLLO = process.env.NODE_ENV === 'development';
const MapaMapLibrePuertos = dynamic(() => import('./MapaMapLibrePuertos'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 bg-simar-abismo" />,
});

const ACTIVOS = PUERTOS.filter((p) => p.activo).length;
const FUTUROS = PUERTOS.length - ACTIVOS;
const ACTIVO = PUERTOS.find((p) => p.activo) ?? PUERTOS[0];
const OTROS = PUERTOS.filter((p) => !p.activo);
const EN_ORDEN = [ACTIVO, ...OTROS];

/** Marca del puerto en la leyenda y la lista: llena si está activo, hueca si puede sumarse */
function Marca({ activo }: { activo: boolean }) {
    return <span aria-hidden="true" className="mp-marca" data-activo={activo} />;
}

/**
 * Mapa de puertos de la landing. En pantallas anchas: el mapa y, debajo, el dato del Golfo; a
 * la derecha, la ficha del puerto elegido, la leyenda y la lista para elegirlo. En el celular,
 * compacto: el mapa de orilla a orilla, la ficha montada sobre su orilla de abajo, los puertos en
 * una fila que se desliza con el dedo (la leyenda se vuelve la etiqueta «Activo» de Peñasco) y al
 * final el dato. `mostrarSelector` enseña el selector para comparar mapas, sólo en desarrollo.
 */
export function SeccionMapaPuertos({
    variante,
    mostrarSelector = false,
    nombreFuturos = 'Puede sumarse',
    resumenFuturos = 'Puede sumarse',
}: {
    variante: VarianteMapa;
    mostrarSelector?: boolean;
    nombreFuturos?: string;
    resumenFuturos?: string;
}) {
    const [seleccionado, setSeleccionado] = useState(ACTIVO.id);
    const escena = useRef<HTMLDivElement>(null);
    const lista = useRef<HTMLDivElement>(null);
    const puerto = PUERTOS.find((p) => p.id === seleccionado) ?? ACTIVO;
    const tipo: VarianteMapa = EN_DESARROLLO ? variante : 'silueta';
    const conMapLibre = tipo !== 'silueta';

    // Cuando el mapa se ve, Peñasco late dos veces (sólo CSS, una vez)
    useEffect(() => {
        const el = escena.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    el.dataset.visto = 'true';
                    obs.disconnect();
                }
            },
            { threshold: 0.55 }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    // Al tocar un puerto en el mapa, la fila del celular se corre hasta él (sólo en horizontal:
    // la página no se mueve)
    const elegirEnMapa = (id: string) => {
        setSeleccionado(id);
        const fila = lista.current;
        if (!fila || fila.scrollWidth <= fila.clientWidth) return;
        const boton = fila.querySelector<HTMLElement>(`[data-id="${id}"]`);
        if (!boton) return;
        const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        fila.scrollTo({ left: Math.max(0, boton.offsetLeft - 16), behavior: quieto ? 'auto' : 'smooth' });
    };

    return (
        <div className="w-full">
            {EN_DESARROLLO && mostrarSelector && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="text-[15px] font-bold text-white/70 mr-1">Comparar mapas:</span>
                    {VARIANTES_MAPA.map((v) => (
                        <a
                            key={v.id}
                            href={`?mapa=${v.id}#mapa`}
                            className={`min-h-[44px] inline-flex items-center px-4 rounded-full text-[15px] font-bold ring-1 transition-colors ${
                                v.id === variante ? 'bg-simar-espuma text-simar-abismo ring-simar-espuma' : 'ring-white/20 text-white/75 hover:bg-white/10'
                            }`}
                        >
                            {v.nombre}
                        </a>
                    ))}
                </div>
            )}

            <div className="mp-rejilla">
                {/* El mapa (en el celular, de orilla a orilla) */}
                <div className="mp-area-mapa">
                    <div
                        ref={escena}
                        className={`mp-escena relative isolate w-full ${
                            conMapLibre ? 'h-[420px] lg:h-[560px] rounded-[28px] overflow-clip ring-1 ring-white/10' : 'aspect-[1000/651]'
                        }`}
                    >
                        {conMapLibre ? (
                            <MapaMapLibrePuertos
                                modo={tipo === 'globo' ? 'globo' : 'red'}
                                seleccionado={seleccionado}
                                onSeleccionar={setSeleccionado}
                            />
                        ) : (
                            <MapaSilueta seleccionado={seleccionado} onSeleccionar={elegirEnMapa} />
                        )}
                    </div>
                </div>

                {/* Ficha del puerto elegido, leyenda y lista */}
                <div className="mp-area-panel mp-entra mp-d2">
                    <div aria-live="polite" className="mp-ficha-caja">
                        {/* Aparece suave cada vez que se cambia */}
                        <div key={puerto.id} className="mp-ficha">
                            <span aria-hidden="true" className="mp-ficha-icono" data-activo={puerto.activo}>
                                {puerto.activo ? (
                                    <Anchor className="w-[22px] h-[22px]" strokeWidth={2} />
                                ) : (
                                    <MapPin className="w-[22px] h-[22px]" strokeWidth={2} />
                                )}
                            </span>
                            <div className="min-w-0">
                                <h3 className="mp-ficha-nombre font-titular">{puerto.nombre}</h3>
                                <p className="mp-ficha-linea">
                                    <span>{puerto.estado}</span>
                                    <span className="mp-insignia" data-activo={puerto.activo}>
                                        {puerto.activo ? `Activo desde ${puerto.desde ?? 2026}` : nombreFuturos}
                                    </span>
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="mp-leyenda">
                        <span className="inline-flex items-center gap-2.5">
                            <Marca activo />
                            Activo ({ACTIVOS})
                        </span>
                        <span className="inline-flex items-center gap-2.5">
                            <Marca activo={false} />
                            {resumenFuturos} ({FUTUROS})
                        </span>
                    </div>

                    {/* Elegir puerto: con clic, dedo o teclado (nunca al pasar el ratón) */}
                    <div ref={lista} role="group" aria-label="Elegir un puerto" className="mp-lista">
                        {EN_ORDEN.map((p) => {
                            const sel = p.id === seleccionado;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    data-id={p.id}
                                    onClick={() => setSeleccionado(p.id)}
                                    aria-pressed={sel}
                                    aria-label={`${p.nombre}. ${p.activo ? 'Activo' : nombreFuturos}`}
                                    className="mp-boton simar-presiona min-h-[56px] movil:min-h-[48px]"
                                    data-sel={sel}
                                    data-activo={p.activo}
                                >
                                    <Marca activo={p.activo} />
                                    <span className="mp-boton-nombre">{p.nombre}</span>
                                    {p.activo && <span className="mp-boton-activo">Activo</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* El dato que explica por qué aquí */}
                <p className="mp-area-dato mp-dato mp-entra">
                    <span className="mp-dato-cifra font-titular">39 %</span>
                    <span className="mp-dato-texto">
                        de las especies de mamíferos marinos del planeta viven en el Golfo de California.
                        <span className="mp-dato-fuente">Fuente: UNESCO</span>
                    </span>
                </p>
            </div>
        </div>
    );
}

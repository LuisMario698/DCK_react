'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Anchor, Compass, Waves } from 'lucide-react';
import MapaSilueta from './MapaSilueta';
import { PUERTOS, VARIANTES_MAPA, type VarianteMapa } from './puertos';

// MapLibre (WebGL) se descarga sólo si se usa una variante que lo necesita
const MapaMapLibrePuertos = dynamic(() => import('./MapaMapLibrePuertos'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 animate-pulse bg-slate-900" />,
});

const ACTIVOS = PUERTOS.filter((p) => p.activo).length;
const FUTUROS = PUERTOS.length - ACTIVOS;

function coordenadas(lat: number, lng: number) {
    return `${Math.abs(lat).toFixed(2)}° ${lat >= 0 ? 'N' : 'S'} · ${Math.abs(lng).toFixed(2)}° ${lng >= 0 ? 'E' : 'O'}`;
}

/**
 * Mapa de puertos de la landing. `variante` elige el tipo de mapa; con
 * `mostrarSelector` aparece un selector para comparar las opciones (se activa
 * con ?mapa=... en la URL).
 */
export function SeccionMapaPuertos({
    variante,
    mostrarSelector = false,
}: {
    variante: VarianteMapa;
    mostrarSelector?: boolean;
}) {
    const [seleccionado, setSeleccionado] = useState(PUERTOS[0].id);
    const [visible, setVisible] = useState(false);
    const contenedor = useRef<HTMLDivElement>(null);
    const puerto = PUERTOS.find((p) => p.id === seleccionado) ?? PUERTOS[0];

    // El mapa se monta cuando la sección se acerca a la pantalla
    useEffect(() => {
        const el = contenedor.current;
        if (!el) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setVisible(true);
                    obs.disconnect();
                }
            },
            { rootMargin: '300px' }
        );
        obs.observe(el);
        return () => obs.disconnect();
    }, []);

    return (
        <div className="w-full">
            {mostrarSelector && (
                <div className="mb-6 flex flex-wrap items-center gap-2">
                    <span className="text-xs font-semibold uppercase tracking-widest text-slate-400 mr-1">Comparar mapas:</span>
                    {VARIANTES_MAPA.map((v) => (
                        <a
                            key={v.id}
                            href={`?mapa=${v.id}#mapa`}
                            className={`px-4 py-2 rounded-full text-sm font-semibold border transition-colors ${
                                v.id === variante
                                    ? 'bg-cyan-400 text-slate-950 border-cyan-300'
                                    : 'border-white/15 text-slate-300 hover:bg-white/10'
                            }`}
                        >
                            {v.nombre}
                        </a>
                    ))}
                </div>
            )}

            <div className="grid lg:grid-cols-[1.55fr_1fr] gap-8 items-stretch">
                {/* Mapa */}
                <div
                    ref={contenedor}
                    className={`relative isolate rounded-3xl overflow-hidden border border-white/10 bg-[#030712] shadow-2xl shadow-cyan-950/40 ${
                        // La silueta conserva la proporción del mapa; los mapas MapLibre usan alto fijo
                        variante === 'silueta' ? 'aspect-[1000/651] lg:aspect-auto lg:h-[560px]' : 'h-[360px] sm:h-[460px] lg:h-[560px]'
                    }`}
                >
                    {visible &&
                        (variante === 'silueta' ? (
                            <MapaSilueta seleccionado={seleccionado} onSeleccionar={setSeleccionado} />
                        ) : (
                            <MapaMapLibrePuertos
                                modo={variante === 'globo' ? 'globo' : 'red'}
                                seleccionado={seleccionado}
                                onSeleccionar={setSeleccionado}
                            />
                        ))}

                    {/* Leyenda */}
                    <div
                        className={`pointer-events-none absolute left-3 z-10 flex flex-wrap gap-2 ${
                            // En los mapas MapLibre la atribución ocupa la parte de abajo
                            variante === 'silueta' ? 'bottom-3' : 'top-3'
                        }`}
                    >
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-white/10 text-xs text-slate-200 backdrop-blur">
                            <span className="w-2.5 h-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.7)]" />
                            Activo ({ACTIVOS})
                        </span>
                        <span className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-950/80 border border-white/10 text-xs text-slate-200 backdrop-blur">
                            <span className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            Expansión ({FUTUROS})
                        </span>
                    </div>
                </div>

                {/* Panel lateral */}
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icono: Anchor, valor: String(ACTIVOS), texto: 'Puerto activo' },
                            { icono: Compass, valor: String(FUTUROS), texto: 'En expansión' },
                            { icono: Waves, valor: '11,122', texto: 'km de litoral' },
                        ].map(({ icono: Icono, valor, texto }) => (
                            <div key={texto} className="rounded-2xl border border-white/10 bg-white/[0.04] p-4">
                                <Icono className="w-4 h-4 text-cyan-300 mb-2" />
                                <p className="text-2xl font-bold text-white leading-none">{valor}</p>
                                <p className="text-[11px] uppercase tracking-wider text-slate-400 mt-1.5">{texto}</p>
                            </div>
                        ))}
                    </div>

                    <div
                        key={puerto.id}
                        className="relative overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-br from-slate-900 to-slate-950 p-6 animate-fade-in"
                    >
                        <div
                            aria-hidden="true"
                            className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl ${puerto.activo ? 'bg-cyan-500/20' : 'bg-blue-500/15'}`}
                        />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-2xl font-bold text-white">{puerto.nombre}</h3>
                                    <p className="text-sm text-slate-400">{puerto.estado}</p>
                                </div>
                                <span
                                    className={`shrink-0 px-3 py-1 rounded-full text-[11px] font-bold uppercase tracking-wider border ${
                                        puerto.activo
                                            ? 'bg-cyan-400/15 text-cyan-300 border-cyan-400/40'
                                            : 'bg-blue-500/10 text-blue-300 border-blue-400/30'
                                    }`}
                                >
                                    {puerto.activo ? 'Activo' : 'Expansión'}
                                </span>
                            </div>
                            <p className="mt-4 text-slate-300 leading-relaxed">{puerto.descripcion}</p>
                            <p className="mt-4 text-xs font-mono text-slate-500">{coordenadas(puerto.lat, puerto.lng)}</p>
                        </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                        {PUERTOS.map((p) => {
                            const sel = p.id === seleccionado;
                            return (
                                <button
                                    key={p.id}
                                    type="button"
                                    onClick={() => setSeleccionado(p.id)}
                                    className={`flex items-center gap-2 px-3 py-2.5 rounded-xl text-left text-sm border transition-all ${
                                        sel
                                            ? 'bg-cyan-400/10 border-cyan-400/50 text-white'
                                            : 'border-white/10 text-slate-300 hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span
                                        className={`w-2 h-2 rounded-full shrink-0 ${
                                            p.activo ? 'bg-cyan-300 shadow-[0_0_8px_2px_rgba(34,211,238,0.6)]' : 'bg-blue-500'
                                        }`}
                                    />
                                    <span className="truncate">{p.nombre}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>
            </div>
        </div>
    );
}

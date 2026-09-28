'use client';

import { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Anchor, Compass, Waves } from 'lucide-react';
import MapaSilueta from './MapaSilueta';
import { PUERTOS, VARIANTES_MAPA, type VarianteMapa } from './puertos';
import { NumeroAnimado } from '@/components/ui/movimiento';

// MapLibre (WebGL) se descarga sólo si se usa una variante que lo necesita
const MapaMapLibrePuertos = dynamic(() => import('./MapaMapLibrePuertos'), {
    ssr: false,
    loading: () => <div className="absolute inset-0 animate-pulse bg-[#0B2236]" />,
});

// Colores sobre la franja oscura (la landing fuerza los tokens claros, así que aquí van fijos):
// espuma = puerto activo, azul claro = expansión. Ver DISEÑO_SIMAR.md → Color.
const ACTIVO_PUNTO = 'bg-[#7FE0D6] shadow-[0_0_8px_2px_rgba(127,224,214,0.6)]';
const EXPANSION_PUNTO = 'bg-[#8AB4F8]';

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
                    <span className="text-[15px] font-bold text-[#C7D3DD] mr-1">Comparar mapas:</span>
                    {VARIANTES_MAPA.map((v) => (
                        <a
                            key={v.id}
                            href={`?mapa=${v.id}#mapa`}
                            className={`min-h-[44px] inline-flex items-center px-4 rounded-full text-base font-bold border transition-colors ${
                                v.id === variante
                                    ? 'bg-[#7FE0D6] text-[#0B2236] border-[#7FE0D6]'
                                    : 'border-white/20 text-[#C7D3DD] hover:bg-white/10'
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
                    className={`relative isolate rounded-[28px] overflow-hidden border border-white/10 bg-[#030712] shadow-[0_30px_60px_-30px_rgba(0,0,0,0.7)] ${
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
                        <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#06121E]/85 border border-white/10 text-[15px] text-white backdrop-blur">
                            <span className={`w-3 h-3 rounded-full ${ACTIVO_PUNTO}`} />
                            Activo ({ACTIVOS})
                        </span>
                        <span className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full bg-[#06121E]/85 border border-white/10 text-[15px] text-white backdrop-blur">
                            <span className={`w-3 h-3 rounded-full ${EXPANSION_PUNTO}`} />
                            Expansión ({FUTUROS})
                        </span>
                    </div>
                </div>

                {/* Panel lateral */}
                <div className="flex flex-col gap-5">
                    <div className="grid grid-cols-3 gap-3">
                        {[
                            { icono: Anchor, valor: ACTIVOS, texto: 'Puerto activo' },
                            { icono: Compass, valor: FUTUROS, texto: 'En expansión' },
                            { icono: Waves, valor: 11122, texto: 'km de litoral' },
                        ].map(({ icono: Icono, valor, texto }) => (
                            <div key={texto} className="rounded-[22px] border border-white/10 bg-[#12304A] p-4">
                                <Icono className="w-6 h-6 text-[#7FE0D6] mb-2" strokeWidth={2} />
                                <NumeroAnimado valor={valor} duracion={1200} className="block text-[28px] font-extrabold text-white leading-none" />
                                <p className="text-[15px] leading-snug text-[#C7D3DD] mt-1.5">{texto}</p>
                            </div>
                        ))}
                    </div>

                    {/* Ficha del puerto elegido: entra de nuevo cada vez que se cambia de puerto */}
                    <div
                        key={puerto.id}
                        className="simar-aparece relative overflow-hidden rounded-[22px] border border-white/10 bg-[#12304A] p-6"
                    >
                        <div
                            aria-hidden="true"
                            className={`absolute -top-16 -right-16 w-48 h-48 rounded-full blur-3xl ${puerto.activo ? 'bg-[rgba(127,224,214,0.16)]' : 'bg-[rgba(138,180,248,0.14)]'}`}
                        />
                        <div className="relative">
                            <div className="flex items-start justify-between gap-3">
                                <div>
                                    <h3 className="text-[26px] font-extrabold leading-tight text-white">{puerto.nombre}</h3>
                                    <p className="text-base text-[#C7D3DD]">{puerto.estado}</p>
                                </div>
                                <span
                                    className={`shrink-0 inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-[15px] font-bold border ${
                                        puerto.activo
                                            ? 'bg-[rgba(127,224,214,0.14)] text-[#7FE0D6] border-[rgba(127,224,214,0.4)]'
                                            : 'bg-[rgba(138,180,248,0.12)] text-[#9DBEF7] border-[rgba(138,180,248,0.35)]'
                                    }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full ${puerto.activo ? ACTIVO_PUNTO : EXPANSION_PUNTO}`} />
                                    {puerto.activo ? 'Activo' : 'Expansión'}
                                </span>
                            </div>
                            <p className="mt-4 text-[17px] text-[#C7D3DD] leading-relaxed">{puerto.descripcion}</p>
                            <p className="mt-4 text-[15px] font-mono text-[#8FA3B4]">{coordenadas(puerto.lat, puerto.lng)}</p>
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
                                    aria-pressed={sel}
                                    className={`simar-presiona flex items-center gap-2.5 min-h-[48px] px-3.5 rounded-2xl text-left text-base border ${
                                        sel
                                            ? 'bg-[rgba(127,224,214,0.12)] border-[rgba(127,224,214,0.5)] text-white font-bold'
                                            : 'border-white/10 text-[#C7D3DD] hover:bg-white/5 hover:text-white'
                                    }`}
                                >
                                    <span className={`w-2.5 h-2.5 rounded-full shrink-0 ${p.activo ? ACTIVO_PUNTO : EXPANSION_PUNTO}`} />
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

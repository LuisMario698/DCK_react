'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Map, { Layer, Marker, NavigationControl, Source, type MapRef } from 'react-map-gl/maplibre';
import type { FeatureCollection, LineString } from 'geojson';
import 'maplibre-gl/dist/maplibre-gl.css';
import { PUERTOS, PUERTO_ACTIVO, arco } from './puertos';
import { CONTORNO_MEXICO } from './contorno-mexico';

// Estilo vectorial gratuito y sin API key; se recolorea al cargar (ver alCargar).
const ESTILO = 'https://tiles.openfreemap.org/styles/dark';

// Etiquetas del estilo que se conservan: el resto (calles, colonias, POI) se oculta.
const ETIQUETAS_VISIBLES = new Set([
    'water_name',
    'place_state',
    'place_country_other',
    'place_country_minor',
    'place_country_major',
]);

// Secuencia para animar el "flujo" de las rutas (técnica de line-dasharray).
const SECUENCIA_GUIONES: number[][] = [
    [0, 4, 3], [0.5, 4, 2.5], [1, 4, 2], [1.5, 4, 1.5], [2, 4, 1], [2.5, 4, 0.5], [3, 4, 0],
    [0, 0.5, 3, 3.5], [0, 1, 3, 3], [0, 1.5, 3, 2.5], [0, 2, 3, 2], [0, 2.5, 3, 1.5], [0, 3, 3, 1], [0, 3.5, 3, 0.5],
];

const VISTA_MEXICO = { longitude: -101.5, latitude: 21.5 };
// Zoom del globo: se ve la curvatura del planeta con México al frente
const ZOOM_GLOBO = 2.35;

/**
 * Mapa de puertos con MapLibre GL JS.
 * - `globo`: proyección de globo con atmósfera y una animación de entrada.
 * - `red`: mapa plano de México con las rutas desde el puerto activo.
 */
export default function MapaMapLibrePuertos({
    modo,
    seleccionado,
    onSeleccionar,
}: {
    modo: 'globo' | 'red';
    seleccionado: string;
    onSeleccionar: (id: string) => void;
}) {
    const mapa = useRef<MapRef>(null);
    const [cargado, setCargado] = useState(false);
    // Sólo se vuela cuando el usuario cambia de puerto (no al cargar)
    const ultimoSeleccionado = useRef(seleccionado);
    const esGlobo = modo === 'globo';

    const rutas = useMemo<FeatureCollection<LineString, { id: string }>>(
        () => ({
            type: 'FeatureCollection',
            features: PUERTOS.filter((p) => !p.activo).map((p) => ({
                type: 'Feature',
                properties: { id: p.id },
                geometry: { type: 'LineString', coordinates: arco(PUERTO_ACTIVO, p) },
            })),
        }),
        []
    );

    const alCargar = useCallback(() => {
        const m = mapa.current?.getMap();
        if (!m) return;
        // Paleta de la landing: tierra azul marino, mar casi negro azulado
        if (m.getLayer('background')) m.setPaintProperty('background', 'background-color', '#0f1e36');
        if (m.getLayer('water')) m.setPaintProperty('water', 'fill-color', '#020713');
        for (const capa of m.getStyle().layers ?? []) {
            if (capa.type === 'symbol' && !ETIQUETAS_VISIBLES.has(capa.id)) {
                m.setLayoutProperty(capa.id, 'visibility', 'none');
            }
        }
        setCargado(true);
        // Entrada: del océano Atlántico a México
        if (esGlobo) {
            m.flyTo({ center: [VISTA_MEXICO.longitude, VISTA_MEXICO.latitude], zoom: ZOOM_GLOBO, duration: 3800, essential: true });
        }
    }, [esGlobo]);

    // Animación continua de las rutas
    useEffect(() => {
        if (!cargado) return;
        const m = mapa.current?.getMap();
        let paso = 0;
        const id = window.setInterval(() => {
            if (!m?.getLayer('rutas-flujo')) return;
            paso = (paso + 1) % SECUENCIA_GUIONES.length;
            m.setPaintProperty('rutas-flujo', 'line-dasharray', SECUENCIA_GUIONES[paso]);
        }, 70);
        return () => window.clearInterval(id);
    }, [cargado]);

    // Volar al puerto elegido
    useEffect(() => {
        if (!cargado || seleccionado === ultimoSeleccionado.current) return;
        ultimoSeleccionado.current = seleccionado;
        const p = PUERTOS.find((x) => x.id === seleccionado);
        if (!p) return;
        mapa.current?.flyTo({
            center: [p.lng, p.lat - (esGlobo ? 1.5 : 0)],
            zoom: esGlobo ? 3.4 : 5.2,
            duration: 1600,
            essential: true,
        });
    }, [seleccionado, cargado, esGlobo]);

    const verTodo = () => {
        if (esGlobo) {
            mapa.current?.flyTo({ center: [VISTA_MEXICO.longitude, VISTA_MEXICO.latitude], zoom: ZOOM_GLOBO, duration: 1400 });
        } else {
            mapa.current?.fitBounds([[-118.5, 14.3], [-86.6, 32.9]], { padding: 24, duration: 1400 });
        }
    };

    return (
        <div
            className="relative w-full h-full"
            style={{
                background: esGlobo
                    ? 'radial-gradient(circle at 50% 45%, #0b2a4a 0%, #050b1a 55%, #02040b 100%)'
                    : '#040b19',
            }}
        >
            {esGlobo && (
                // Estrellas de fondo (sólo visibles alrededor del globo)
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-60"
                    style={{
                        backgroundImage:
                            'radial-gradient(1px 1px at 12% 18%, #fff, transparent), radial-gradient(1px 1px at 78% 12%, #cbd5e1, transparent), radial-gradient(1.5px 1.5px at 88% 64%, #fff, transparent), radial-gradient(1px 1px at 22% 82%, #e2e8f0, transparent), radial-gradient(1px 1px at 55% 8%, #fff, transparent), radial-gradient(1px 1px at 6% 56%, #cbd5e1, transparent), radial-gradient(1.5px 1.5px at 94% 30%, #e2e8f0, transparent), radial-gradient(1px 1px at 40% 94%, #fff, transparent)',
                    }}
                />
            )}
            <Map
                ref={mapa}
                mapStyle={ESTILO}
                projection={esGlobo ? 'globe' : 'mercator'}
                initialViewState={
                    esGlobo
                        ? { longitude: -96, latitude: 18, zoom: 1.45 }
                        : { bounds: [[-118.5, 14.3], [-86.6, 32.9]], fitBoundsOptions: { padding: 24 } }
                }
                sky={{
                    'sky-color': '#0b1f3f',
                    'horizon-color': '#22d3ee',
                    'fog-color': '#0b1220',
                    'atmosphere-blend': ['interpolate', ['linear'], ['zoom'], 0, 1, 5, 1, 7, 0],
                }}
                style={{ width: '100%', height: '100%', position: 'absolute', inset: 0 }}
                attributionControl={{ compact: true }}
                dragRotate={false}
                touchPitch={false}
                cooperativeGestures
                onLoad={alCargar}
            >
                <NavigationControl position="bottom-right" showCompass={false} />

                {/* México resaltado */}
                <Source id="mexico" type="geojson" data={{ type: 'Feature', properties: {}, geometry: CONTORNO_MEXICO }}>
                    <Layer id="mexico-relleno" type="fill" paint={{ 'fill-color': '#22d3ee', 'fill-opacity': 0.08 }} />
                    <Layer
                        id="mexico-brillo"
                        type="line"
                        paint={{ 'line-color': '#22d3ee', 'line-width': 6, 'line-blur': 6, 'line-opacity': 0.35 }}
                    />
                    <Layer id="mexico-contorno" type="line" paint={{ 'line-color': '#67e8f9', 'line-width': 1.2 }} />
                </Source>

                <Source id="rutas" type="geojson" data={rutas}>
                    <Layer
                        id="rutas-brillo"
                        type="line"
                        layout={{ 'line-cap': 'round' }}
                        paint={{
                            'line-color': '#22d3ee',
                            'line-width': ['case', ['==', ['get', 'id'], seleccionado], 9, 5],
                            'line-blur': 6,
                            'line-opacity': ['case', ['==', ['get', 'id'], seleccionado], 0.45, 0.12],
                        }}
                    />
                    <Layer
                        id="rutas-flujo"
                        type="line"
                        paint={{
                            'line-color': ['case', ['==', ['get', 'id'], seleccionado], '#a5f3fc', '#38bdf8'],
                            'line-width': ['case', ['==', ['get', 'id'], seleccionado], 2.4, 1.4],
                            'line-opacity': ['case', ['==', ['get', 'id'], seleccionado], 1, 0.55],
                            'line-dasharray': SECUENCIA_GUIONES[0],
                        }}
                    />
                </Source>

                {PUERTOS.map((p) => {
                    const sel = p.id === seleccionado;
                    return (
                        <Marker key={p.id} longitude={p.lng} latitude={p.lat} anchor="center">
                            <button
                                type="button"
                                onClick={() => onSeleccionar(p.id)}
                                aria-label={`${p.nombre}, ${p.estado}. ${p.activo ? 'Puerto activo' : 'Expansión futura'}`}
                                className="group relative flex items-center justify-center w-8 h-8 cursor-pointer"
                            >
                                {p.activo && (
                                    <>
                                        <span className="absolute inset-0 rounded-full bg-cyan-400/40 animate-ping" />
                                        <span className="absolute -inset-2 rounded-full border border-cyan-300/40" />
                                    </>
                                )}
                                <span
                                    className={`relative rounded-full border-2 transition-all duration-300 ${
                                        p.activo
                                            ? 'w-4 h-4 bg-cyan-300 border-white shadow-[0_0_18px_4px_rgba(34,211,238,0.8)]'
                                            : sel
                                              ? 'w-3.5 h-3.5 bg-sky-300 border-white shadow-[0_0_14px_3px_rgba(56,189,248,0.8)]'
                                              : 'w-2.5 h-2.5 bg-blue-500 border-slate-900 group-hover:bg-sky-300'
                                    }`}
                                />
                                {(sel || p.activo) && (
                                    <span className="absolute left-1/2 -translate-x-1/2 -top-7 whitespace-nowrap px-2 py-0.5 rounded-md bg-slate-950/85 border border-white/10 text-[11px] font-semibold text-white shadow-lg">
                                        {p.nombre}
                                    </span>
                                )}
                            </button>
                        </Marker>
                    );
                })}
            </Map>

            <button
                type="button"
                onClick={verTodo}
                className="absolute top-3 right-3 z-10 px-3 py-1.5 rounded-lg bg-slate-950/80 border border-white/10 text-xs font-semibold text-slate-200 hover:bg-slate-900 transition-colors"
            >
                Ver todo México
            </button>
        </div>
    );
}

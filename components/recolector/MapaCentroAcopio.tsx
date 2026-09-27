'use client';

import dynamic from 'next/dynamic';

// maplibre-gl usa APIs del navegador (WebGL): se carga sólo en el cliente
const MapaMapLibre = dynamic(() => import('./MapaMapLibre'), {
    ssr: false,
    loading: () => <div className="w-full h-full animate-pulse bg-simar-papel" />,
});

/**
 * Mapa del centro de acopio (MapLibre GL JS + react-map-gl, teselas de
 * OpenFreeMap).
 *
 * `isolate` crea un contexto de apilamiento propio: los z-index internos del
 * mapa (controles, marcadores) no pueden quedar por encima de los modales.
 */
export function MapaCentroAcopio({
    alto = 'h-72',
    zoom = 14,
}: {
    /** Clase de altura de Tailwind (h-72, h-full, ...). */
    alto?: string;
    zoom?: number;
}) {
    return (
        <div className={`relative isolate w-full ${alto} rounded-xl overflow-hidden bg-simar-papel`}>
            <MapaMapLibre zoom={zoom} />
        </div>
    );
}

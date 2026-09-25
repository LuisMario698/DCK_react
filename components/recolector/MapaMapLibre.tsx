'use client';

import Map, { Marker, NavigationControl } from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import { Anchor } from 'lucide-react';
import { useTheme } from '@/components/layout/ThemeContext';
import { PUERTO_PENASCO } from '@/lib/constants/residuos';

// Estilos vectoriales de OpenFreeMap: gratis, sin API key y sin límite de uso.
const ESTILOS = {
    dark: 'https://tiles.openfreemap.org/styles/dark',
    light: 'https://tiles.openfreemap.org/styles/liberty',
} as const;

/** Mapa MapLibre centrado en el centro de acopio. Se carga sólo en el cliente. */
export default function MapaMapLibre({ zoom }: { zoom: number }) {
    const { theme } = useTheme();
    const { lat, lng } = PUERTO_PENASCO;

    return (
        <Map
            initialViewState={{ latitude: lat, longitude: lng, zoom }}
            mapStyle={ESTILOS[theme]}
            style={{ width: '100%', height: '100%' }}
            attributionControl={{ compact: true }}
            dragRotate={false}
            touchPitch={false}
            // En pantallas táctiles el mapa se mueve con dos dedos, para que no
            // "atrape" el scroll de la página
            cooperativeGestures
        >
            <NavigationControl position="bottom-right" showCompass={false} />
            <Marker latitude={lat} longitude={lng} anchor="bottom">
                <div className="flex flex-col items-center">
                    <span className="mb-1 px-2.5 py-1 rounded-lg bg-gray-900/90 text-white text-[11px] font-semibold shadow-lg whitespace-nowrap">
                        Centro de acopio
                    </span>
                    <span className="relative flex items-center justify-center w-9 h-9">
                        <span className="absolute inset-0 rounded-full bg-emerald-500/40 animate-ping" />
                        <span className="relative w-9 h-9 rounded-full bg-emerald-500 border-2 border-white shadow-lg flex items-center justify-center">
                            <Anchor className="w-4 h-4 text-white" />
                        </span>
                    </span>
                </div>
            </Marker>
        </Map>
    );
}

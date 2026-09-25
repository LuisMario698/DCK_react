'use client';

import { Navigation, MapPin } from 'lucide-react';
import { PUERTO_PENASCO } from '@/lib/constants/residuos';

/**
 * Mapa del centro de acopio con Google Maps incrustado (iframe).
 *
 * - No requiere API key ni cuenta de facturación.
 * - Es un iframe en el flujo normal de la página: no compite con el z-index
 *   de los modales (con Leaflet el mapa se dibujaba encima de ellos).
 * - Los botones abren la ruta en Google Maps o en Apple Maps (en iPhone/Mac
 *   abre la app nativa).
 */
export function MapaCentroAcopio({
    alto = 'h-72',
    zoom = 15,
    enlaces = true,
}: {
    /** Clase de altura de Tailwind (h-72, h-full, ...). */
    alto?: string;
    zoom?: number;
    enlaces?: boolean;
}) {
    const { lat, lng, nombre } = PUERTO_PENASCO;
    const destino = `${lat},${lng}`;
    const embed = `https://maps.google.com/maps?q=${destino}&z=${zoom}&hl=es&output=embed`;
    const google = `https://www.google.com/maps/dir/?api=1&destination=${destino}`;
    const apple = `https://maps.apple.com/?daddr=${destino}&q=${encodeURIComponent(`Centro de acopio · ${nombre}`)}`;

    return (
        <div className={`flex flex-col gap-2 w-full ${alto}`}>
            <div className="relative flex-1 min-h-0 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800">
                <iframe
                    title={`Mapa del centro de acopio de ${nombre}`}
                    src={embed}
                    className="absolute inset-0 w-full h-full border-0"
                    loading="lazy"
                    referrerPolicy="no-referrer-when-downgrade"
                    allowFullScreen
                />
            </div>
            {/* Debajo del mapa, no encima: no se debe tapar la atribución de Google */}
            {enlaces && (
                <div className="flex flex-wrap gap-2">
                    <a
                        href={google}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <Navigation className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
                        Cómo llegar con Google Maps
                    </a>
                    <a
                        href={apple}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-xs font-semibold hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                    >
                        <MapPin className="w-3.5 h-3.5" />
                        Abrir en Apple Maps
                    </a>
                </div>
            )}
        </div>
    );
}

'use client';

import { Toaster } from 'sonner';
import { AlertTriangle, Info, XCircle } from 'lucide-react';
import { useTheme } from './ThemeContext';
import { PalomitaAnimada } from '@/components/ui/movimiento';

/**
 * Contenedor de los avisos `toast()` de sonner para toda la app.
 * Abajo a la derecha, donde no tapa el encabezado de las pantallas.
 * Colores y tamaños SiMAR en app/globals.css (bloque "Avisos"); el éxito dibuja su palomita.
 * Duran 6 s: da tiempo de leerlos con calma.
 */
export function Avisos() {
    const { theme } = useTheme();
    return (
        <Toaster
            theme={theme}
            position="bottom-right"
            richColors
            closeButton
            duration={6000}
            icons={{
                success: <PalomitaAnimada />,
                info: <Info strokeWidth={2} />,
                warning: <AlertTriangle strokeWidth={2} />,
                error: <XCircle strokeWidth={2} />,
            }}
        />
    );
}

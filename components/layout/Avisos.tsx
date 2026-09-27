'use client';

import { Toaster } from 'sonner';
import { useTheme } from './ThemeContext';

/**
 * Contenedor de los avisos `toast()` de sonner para toda la app.
 * Abajo a la derecha, donde no tapa el encabezado de las pantallas.
 */
export function Avisos() {
    const { theme } = useTheme();
    return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}

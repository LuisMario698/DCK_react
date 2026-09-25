'use client';

import { Toaster } from 'sonner';
import { useTheme } from './ThemeContext';

/**
 * Contenedor de los avisos `toast()` de sonner para toda la app.
 * Abajo a la derecha: arriba a la derecha está el botón flotante de tema.
 */
export function Avisos() {
    const { theme } = useTheme();
    return <Toaster theme={theme} position="bottom-right" richColors closeButton />;
}

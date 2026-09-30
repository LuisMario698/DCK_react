'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { suscribirCambios } from '@/lib/services/notificaciones';
import { suscribirMensajes } from '@/lib/services/mensajes';

/** Tras cuánto tiempo fuera de la pestaña (o de la app) el Panel se pide de nuevo al volver */
const TIEMPO_FUERA_MS = 60_000;

/**
 * Mantiene al día el Panel del recinto sin recargar la página: lo vuelve a pedir al servidor
 * (`router.refresh`, que conserva lo de pantalla y deja que los números cuenten del valor anterior
 * al nuevo) cuando cambia una solicitud o llega un mensaje de una empresa, y al volver después de
 * un rato (el saludo y "Último: hace…" se quedan viejos con la app abierta todo el día).
 * No dibuja nada.
 */
export function PanelEnVivo() {
    const router = useRouter();

    useEffect(() => {
        let espera: ReturnType<typeof setTimeout> | undefined;
        // Aprobar o completar cambia varias filas a la vez: una sola consulta para todas
        const refrescar = () => {
            clearTimeout(espera);
            espera = setTimeout(() => router.refresh(), 400);
        };
        const quitarSolicitudes = suscribirCambios('solicitudes_recoleccion', refrescar);
        const quitarMensajes = suscribirMensajes(refrescar);

        let fueraDesde = 0;
        const alCambiarVisibilidad = () => {
            if (document.hidden) fueraDesde = Date.now();
            else if (fueraDesde && Date.now() - fueraDesde > TIEMPO_FUERA_MS) refrescar();
        };
        document.addEventListener('visibilitychange', alCambiarVisibilidad);

        return () => {
            clearTimeout(espera);
            quitarSolicitudes();
            quitarMensajes();
            document.removeEventListener('visibilitychange', alCambiarVisibilidad);
        };
    }, [router]);

    return null;
}

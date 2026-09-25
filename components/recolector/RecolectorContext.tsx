'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMiPerfil, type PerfilConAsociacion } from '@/lib/services/perfil';
import { contarNotificacionesNoLeidas, suscribirNotificaciones } from '@/lib/services/notificaciones';
import { contarMensajesNoLeidos, suscribirMensajes } from '@/lib/services/mensajes';
import type { AsociacionRecolectora } from '@/types/database';

interface RecolectorContextType {
    perfil: PerfilConAsociacion | null;
    asociacion: AsociacionRecolectora | null;
    cargando: boolean;
    notificacionesNoLeidas: number;
    mensajesNoLeidos: number;
    /** La asociación no está activa: puede consultar pero no crear solicitudes. */
    bloqueada: boolean;
    recargarPerfil: () => Promise<void>;
    recargarContadores: () => Promise<void>;
}

const RecolectorContext = createContext<RecolectorContextType | null>(null);

export function useRecolector() {
    const ctx = useContext(RecolectorContext);
    if (!ctx) throw new Error('useRecolector debe usarse dentro de <RecolectorProvider>');
    return ctx;
}

/** Datos de la sesión del portal recolector compartidos por todas sus páginas. */
export function RecolectorProvider({ children }: { children: React.ReactNode }) {
    const [perfil, setPerfil] = useState<PerfilConAsociacion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [notificacionesNoLeidas, setNotificaciones] = useState(0);
    const [mensajesNoLeidos, setMensajes] = useState(0);

    const recargarPerfil = useCallback(async () => {
        try {
            setPerfil(await getMiPerfil());
        } catch (err) {
            console.error('Error cargando el perfil del recolector:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    const recargarContadores = useCallback(async () => {
        try {
            const [n, m] = await Promise.all([contarNotificacionesNoLeidas(), contarMensajesNoLeidos('admin')]);
            setNotificaciones(n);
            setMensajes(m);
        } catch (err) {
            console.error('Error cargando contadores:', err);
        }
    }, []);

    useEffect(() => {
        recargarPerfil();
        recargarContadores();
        const off1 = suscribirNotificaciones(() => recargarContadores());
        const off2 = suscribirMensajes(() => recargarContadores());
        return () => {
            off1();
            off2();
        };
    }, [recargarPerfil, recargarContadores]);

    const asociacion = perfil?.asociacion ?? null;

    return (
        <RecolectorContext.Provider
            value={{
                perfil,
                asociacion,
                cargando,
                notificacionesNoLeidas,
                mensajesNoLeidos,
                bloqueada: !!asociacion && asociacion.estado !== 'Activo',
                recargarPerfil,
                recargarContadores,
            }}
        >
            {children}
        </RecolectorContext.Provider>
    );
}

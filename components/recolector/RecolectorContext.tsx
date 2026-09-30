'use client';

import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { getMiPerfil, type PerfilConAsociacion } from '@/lib/services/perfil';
import { contarNotificacionesNoLeidas, suscribirNotificaciones } from '@/lib/services/notificaciones';
import { contarMensajesNoLeidos, suscribirMensajes } from '@/lib/services/mensajes';
import { getEstadoMiSuscripcion, type EstadoMiSuscripcion } from '@/lib/services/suscripciones';
import type { AsociacionRecolectora } from '@/types/database';
import { useInsigniaAvisos } from '@/components/layout/useInsigniaAvisos';

interface RecolectorContextType {
    perfil: PerfilConAsociacion | null;
    asociacion: AsociacionRecolectora | null;
    cargando: boolean;
    notificacionesNoLeidas: number;
    mensajesNoLeidos: number;
    /** Suscripción de la asociación (null si la migración no está aplicada). */
    suscripcion: EstadoMiSuscripcion | null;
    /** La asociación no está activa o su suscripción obligatoria no está vigente:
     *  puede consultar pero no crear solicitudes. */
    bloqueada: boolean;
    motivoBloqueo: 'asociacion' | 'suscripcion' | null;
    /**
     * Un superadmin usando el portal a nombre de su asociación vinculada. Como
     * sigue siendo admin, las páginas filtran siempre por `asociacion.id` y las
     * RPC de leídos/mensajes se llaman «como asociación».
     */
    esSuperadmin: boolean;
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
    const [suscripcion, setSuscripcion] = useState<EstadoMiSuscripcion | null>(null);
    const [cargando, setCargando] = useState(true);
    const [notificacionesNoLeidas, setNotificaciones] = useState(0);
    const [mensajesNoLeidos, setMensajes] = useState(0);
    // Las notificaciones sin leer también en la pestaña y en el ícono de la app instalada
    useInsigniaAvisos(notificacionesNoLeidas);

    const recargarPerfil = useCallback(async () => {
        try {
            const [p, s] = await Promise.all([getMiPerfil(), getEstadoMiSuscripcion()]);
            setPerfil(p);
            setSuscripcion(s);
        } catch (err) {
            console.error('Error cargando el perfil del recolector:', err);
        } finally {
            setCargando(false);
        }
    }, []);

    const asociacion = perfil?.asociacion ?? null;
    const asociacionId = asociacion?.id;

    const recargarContadores = useCallback(async () => {
        if (!asociacionId) return;
        try {
            const [n, m] = await Promise.all([
                contarNotificacionesNoLeidas({ destinatario: 'recolector', asociacionId }),
                contarMensajesNoLeidos('admin', asociacionId),
            ]);
            setNotificaciones(n);
            setMensajes(m);
        } catch (err) {
            console.error('Error cargando contadores:', err);
        }
    }, [asociacionId]);

    useEffect(() => {
        recargarPerfil();
    }, [recargarPerfil]);

    // Los contadores dependen de la asociación (se conoce al cargar el perfil)
    useEffect(() => {
        if (!asociacionId) return;
        recargarContadores();
        const off1 = suscribirNotificaciones(() => recargarContadores());
        const off2 = suscribirMensajes(() => recargarContadores(), asociacionId);
        return () => {
            off1();
            off2();
        };
    }, [asociacionId, recargarContadores]);

    const motivoBloqueo =
        asociacion && asociacion.estado !== 'Activo'
            ? 'asociacion'
            : suscripcion?.obligatoria && !suscripcion.vigente
              ? 'suscripcion'
              : null;

    return (
        <RecolectorContext.Provider
            value={{
                perfil,
                asociacion,
                cargando,
                notificacionesNoLeidas,
                mensajesNoLeidos,
                suscripcion,
                bloqueada: motivoBloqueo !== null,
                motivoBloqueo,
                esSuperadmin: !!perfil?.es_superadmin,
                recargarPerfil,
                recargarContadores,
            }}
        >
            {children}
        </RecolectorContext.Provider>
    );
}

'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellOff } from 'lucide-react';
import { tiempoRelativo } from '@/lib/constants/residuos';
import { Notificacion } from '@/types/database';
import {
    getNotificaciones,
    marcarNotificacionesLeidas,
    perteneceAlcance,
    suscribirNotificaciones,
} from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { Cargando, mensajeError } from '@/components/asociaciones/ui';

export default function NotificacionesPage() {
    const { recargarContadores, asociacion, esSuperadmin } = useRecolector();
    const asociacionId = asociacion?.id;
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        if (!asociacionId) return;
        try {
            setNotificaciones(await getNotificaciones(100, { destinatario: 'recolector', asociacionId }));
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudieron cargar las notificaciones.'));
        } finally {
            setCargando(false);
        }
    }, [asociacionId]);

    useEffect(() => {
        if (!asociacionId) return;
        cargar();
        // Un superadmin recibe también las de admin: sólo se agregan las de su asociación
        const alcance = { destinatario: 'recolector' as const, asociacionId };
        return suscribirNotificaciones((n) => {
            if (perteneceAlcance(n, alcance)) setNotificaciones((prev) => [n, ...prev]);
        });
    }, [asociacionId, cargar]);

    const marcar = async (ids?: number[]) => {
        try {
            await marcarNotificacionesLeidas(ids, esSuperadmin);
            setNotificaciones((prev) => prev.map((n) => (!ids || ids.includes(n.id) ? { ...n, leida: true } : n)));
            recargarContadores();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const noLeidas = notificaciones.filter((n) => !n.leida).length;

    if (cargando) return <Cargando texto="Cargando notificaciones…" />;

    return (
        <div className="space-y-6">
            <div className="bg-simar-superficie border border-simar-borde rounded-xl shadow-simar overflow-hidden">
                <div className="px-5 py-4 border-b border-simar-borde flex items-center justify-between">
                    <h2 className="text-base font-bold text-simar-texto">
                        Todas las notificaciones
                        {noLeidas > 0 && <span className="ml-2 text-[15px] font-semibold text-simar-marea-tinta">{noLeidas} sin leer</span>}
                    </h2>
                    <button
                        onClick={() => marcar()}
                        disabled={noLeidas === 0}
                        className="text-[15px] font-semibold text-simar-marea-tinta hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                        Marcar todas como leídas
                    </button>
                </div>
                {notificaciones.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-simar-texto-2">
                        <BellOff className="w-8 h-8" />
                        <p className="text-base">No tienes notificaciones.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-simar-borde-suave">
                        {notificaciones.map((n) => (
                            <li
                                key={n.id}
                                onClick={() => !n.leida && marcar([n.id])}
                                className={`px-5 py-4 transition-colors flex items-start gap-3 ${
                                    n.leida ? 'hover:bg-simar-papel' : 'bg-simar-marea-suave/50 cursor-pointer'
                                }`}
                            >
                                <NotifIcon tipo={n.tipo} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-base font-semibold text-simar-texto">{n.titulo}</p>
                                    {n.detalle && <p className="text-base text-simar-texto-2">{n.detalle}</p>}
                                    <p className="text-[15px] text-simar-texto-2 mt-1">{tiempoRelativo(n.created_at)}</p>
                                </div>
                                {!n.leida && <span className="w-2 h-2 rounded-full bg-simar-marea mt-2 flex-shrink-0" aria-label="Sin leer" />}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

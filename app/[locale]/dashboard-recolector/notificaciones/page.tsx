'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { BellOff } from 'lucide-react';
import { tiempoRelativo } from '@/lib/constants/residuos';
import { Notificacion } from '@/types/database';
import {
    getNotificaciones,
    marcarNotificacionesLeidas,
    suscribirNotificaciones,
} from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { Cargando, mensajeError } from '@/components/asociaciones/ui';

export default function NotificacionesPage() {
    const { recargarContadores } = useRecolector();
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);

    const cargar = useCallback(async () => {
        try {
            setNotificaciones(await getNotificaciones(100));
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudieron cargar las notificaciones.'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        return suscribirNotificaciones((n) => setNotificaciones((prev) => [n, ...prev]));
    }, [cargar]);

    const marcar = async (ids?: number[]) => {
        try {
            await marcarNotificacionesLeidas(ids);
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
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">
                        Todas las notificaciones
                        {noLeidas > 0 && <span className="ml-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400">{noLeidas} sin leer</span>}
                    </h2>
                    <button
                        onClick={() => marcar()}
                        disabled={noLeidas === 0}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-40 disabled:no-underline"
                    >
                        Marcar todas como leídas
                    </button>
                </div>
                {notificaciones.length === 0 ? (
                    <div className="py-16 flex flex-col items-center gap-2 text-gray-400">
                        <BellOff className="w-8 h-8" />
                        <p className="text-sm">No tienes notificaciones.</p>
                    </div>
                ) : (
                    <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                        {notificaciones.map((n) => (
                            <li
                                key={n.id}
                                onClick={() => !n.leida && marcar([n.id])}
                                className={`px-5 py-4 transition-colors flex items-start gap-3 ${
                                    n.leida ? 'hover:bg-gray-50 dark:hover:bg-gray-800/50' : 'bg-emerald-50/50 dark:bg-emerald-900/10 cursor-pointer'
                                }`}
                            >
                                <NotifIcon tipo={n.tipo} size="md" />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.titulo}</p>
                                    {n.detalle && <p className="text-sm text-gray-600 dark:text-gray-400">{n.detalle}</p>}
                                    <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{tiempoRelativo(n.created_at)}</p>
                                </div>
                                {!n.leida && <span className="w-2 h-2 rounded-full bg-emerald-500 mt-2 flex-shrink-0" aria-label="Sin leer" />}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
}

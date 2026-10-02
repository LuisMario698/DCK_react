'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { BellOff, CheckCheck } from 'lucide-react';
import { tiempoRelativo } from '@/lib/constants/residuos';
import { agruparPorDia } from '@/lib/utils/fechas';
import { Notificacion, SolicitudRecoleccion } from '@/types/database';
import { getSolicitudes } from '@/lib/services/solicitudes';
import { destinoDelAviso } from '@/components/recolector/destinoAviso';
import {
    getNotificaciones,
    marcarNotificacionesLeidas,
    perteneceAlcance,
    suscribirNotificaciones,
} from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { Cargando, mensajeError } from '@/components/asociaciones/ui';
import { EstadoVacio } from '@/components/ui/simar';

export default function NotificacionesPage() {
    const { recargarContadores, asociacion, esSuperadmin } = useRecolector();
    const asociacionId = asociacion?.id;
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    // Para saber qué solicitud abre cada aviso
    const [solicitudes, setSolicitudes] = useState<SolicitudRecoleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const base = `/${usePathname().split('/')[1] || 'es'}/dashboard-recolector`;

    const cargar = useCallback(async () => {
        if (!asociacionId) return;
        try {
            const [notif, sol] = await Promise.all([
                getNotificaciones(100, { destinatario: 'recolector', asociacionId }),
                getSolicitudes({ asociacionId }),
            ]);
            setNotificaciones(notif);
            setSolicitudes(sol);
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
        <div className="space-y-6 movil:space-y-3">
            <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar overflow-hidden">
                {/* En celular el título ya está arriba: en este renglón sólo cuántas faltan y el botón */}
                <div className="px-5 sm:px-6 py-4 border-b border-simar-borde flex flex-wrap items-center justify-between gap-3 movil:flex-nowrap movil:px-3.5 movil:py-2.5">
                    <h2 className="text-[21px] font-extrabold text-simar-texto movil:text-[15px] movil:font-bold">
                        <span className="movil:hidden">Todas las notificaciones</span>
                        {noLeidas > 0 && <span className="ml-2 text-base font-bold text-simar-marea-tinta movil:ml-0 movil:text-[15px]">{noLeidas} sin leer</span>}
                        {noLeidas === 0 && <span className="hidden movil:inline text-simar-texto-2">Todo leído</span>}
                    </h2>
                    <button
                        onClick={() => marcar()}
                        disabled={noLeidas === 0}
                        className="simar-presiona min-h-[48px] px-4 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-base font-bold hover:border-simar-marea-tinta disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-2 movil:flex-shrink-0 movil:px-3 movil:text-[14px]"
                    >
                        <CheckCheck className="w-5 h-5 text-simar-marea-tinta" />
                        <span className="movil:hidden">Marcar todas como leídas</span>
                        <span className="hidden movil:inline">Marcar como leídas</span>
                    </button>
                </div>
                {notificaciones.length === 0 ? (
                    <EstadoVacio icono={BellOff} titulo="No tienes notificaciones">
                        Aquí verás cuando el centro de acopio apruebe, complete o rechace tus solicitudes.
                    </EstadoVacio>
                ) : (
                    // Por días: "Hoy", "Ayer" y "Antes" (la hora de cada una sigue abajo de su texto)
                    agruparPorDia(notificaciones).map(({ grupo, items }, g) => (
                        <section key={grupo} aria-label={grupo} className={g > 0 ? 'border-t border-simar-borde-suave' : ''}>
                            <h3 className="px-5 sm:px-6 pt-4 pb-1 text-[15px] font-bold text-simar-texto-2 movil:px-3.5 movil:pt-3 movil:text-[13px]">{grupo}</h3>
                            <ul className="divide-y divide-simar-borde-suave">
                                {items.map((n) => (
                                    <li key={n.id}>
                                    {/* Tocar un aviso lo marca como leído y abre su solicitud (o Residuos, si es un residuo nuevo) */}
                                    <Link
                                        href={destinoDelAviso(n, solicitudes, base)}
                                        onClick={() => !n.leida && marcar([n.id])}
                                        className={`px-5 sm:px-6 py-4 transition-colors flex items-start gap-3.5 border-l-[5px] ${
                                            n.leida
                                                ? 'border-l-transparent hover:bg-simar-papel'
                                                : 'border-l-simar-marea-tinta bg-simar-marea-suave/50 hover:bg-simar-marea-suave'
                                        }`}
                                    >
                                        <NotifIcon tipo={n.tipo} size="md" />
                                        <div className="flex-1 min-w-0">
                                            <p className="flex flex-wrap items-center gap-2 text-[17px] font-bold text-simar-texto">
                                                {n.titulo}
                                                {/* No leída: franja azul y la palabra "Nueva" (el color nunca va solo) */}
                                                {!n.leida && (
                                                    <span className="px-2.5 py-0.5 rounded-full bg-simar-marea text-white text-[15px] font-bold leading-tight">
                                                        Nueva
                                                    </span>
                                                )}
                                            </p>
                                            {n.detalle && <p className="text-base text-simar-texto-2">{n.detalle}</p>}
                                            <p className="text-[15px] text-simar-texto-2 mt-1">{tiempoRelativo(n.created_at)}</p>
                                        </div>
                                    </Link>
                                    </li>
                                ))}
                            </ul>
                        </section>
                    ))
                )}
            </div>
        </div>
    );
}

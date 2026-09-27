'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ClipboardCheck, Truck, Package, Leaf, ArrowRight, Sparkles, Inbox } from 'lucide-react';
import { PUERTO_PENASCO, formatCantidad, tiempoRelativo } from '@/lib/constants/residuos';
import { co2eEvitadoKg } from '@/lib/constants/impacto';
import { InventarioResiduo, Notificacion, Recoleccion, SolicitudRecoleccion } from '@/types/database';
import { getInventario } from '@/lib/services/inventario';
import { getSolicitudes } from '@/lib/services/solicitudes';
import { getRecolecciones } from '@/lib/services/recolecciones';
import { getNotificaciones } from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { Cargando } from '@/components/asociaciones/ui';
import { NotifIcon } from '@/components/recolector/NotifIcon';
import { MapaCentroAcopio } from '@/components/recolector/MapaCentroAcopio';


export default function DashboardRecolectorPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/dashboard-recolector`;
    const { asociacion, cargando: cargandoPerfil } = useRecolector();

    const [inventario, setInventario] = useState<InventarioResiduo[]>([]);
    const [solicitudes, setSolicitudes] = useState<SolicitudRecoleccion[]>([]);
    const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
    const [notificaciones, setNotificaciones] = useState<Notificacion[]>([]);
    const [cargando, setCargando] = useState(true);

    // Todo se filtra por la asociación: un superadmin en el portal también es admin y la RLS le mostraría todo
    const asociacionId = asociacion?.id;
    useEffect(() => {
        if (!asociacionId) return;
        Promise.all([
            getInventario(true),
            getSolicitudes({ asociacionId }),
            getRecolecciones(asociacionId),
            getNotificaciones(5, { destinatario: 'recolector', asociacionId }),
        ])
            .then(([inv, sol, rec, notif]) => {
                setInventario(inv);
                setSolicitudes(sol);
                setRecolecciones(rec);
                setNotificaciones(notif);
            })
            .catch((err) => console.error('Error cargando el inicio del recolector:', err))
            .finally(() => setCargando(false));
    }, [asociacionId]);

    const disponibles = inventario.filter((i) => i.cantidad > 0);
    const activas = solicitudes.filter((s) => s.estado === 'pendiente' || s.estado === 'aprobada').length;
    const kgRecolectados = recolecciones.filter((r) => r.unidad === 'kg').reduce((s, r) => s + r.cantidad, 0);
    const co2 = recolecciones.reduce((s, r) => s + co2eEvitadoKg(r.tipo, r.cantidad), 0);

    if (cargandoPerfil || (asociacionId && cargando)) return <Cargando />;

    const kpis = [
        {
            label: 'Solicitudes activas',
            value: activas,
            icon: ClipboardCheck,
            accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            href: `${base}/solicitudes`,
        },
        {
            label: 'Recolecciones completadas',
            value: recolecciones.length,
            icon: Truck,
            accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            href: `${base}/historial`,
        },
        {
            label: 'Material sólido obtenido',
            value: kgRecolectados >= 1000 ? `${formatCantidad(kgRecolectados / 1000)} t` : `${formatCantidad(kgRecolectados)} kg`,
            icon: Package,
            accent: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
            href: `${base}/impacto`,
        },
        {
            label: 'CO₂e evitado (estimado)',
            value: co2 >= 1000 ? `${formatCantidad(co2 / 1000)} t` : `${formatCantidad(Math.round(co2))} kg`,
            icon: Leaf,
            accent: 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-400',
            href: `${base}/impacto`,
        },
    ];

    return (
        <div className="space-y-6">
            {/* Hero / saludo */}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-600 dark:from-emerald-600 dark:to-teal-700 rounded-2xl p-6 sm:p-8 text-white shadow-lg relative overflow-hidden">
                <div className="absolute inset-0 opacity-20">
                    <Sparkles className="absolute top-4 right-4 w-24 h-24" />
                </div>
                <div className="relative">
                    <p className="text-emerald-50 text-sm font-medium">¡Bienvenido de vuelta!</p>
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">{asociacion?.nombre_asociacion ?? 'Empresa recolectora'}</h2>
                    <p className="text-emerald-50 text-sm mt-2 max-w-xl">
                        Tienes <strong>{activas} {activas === 1 ? 'solicitud activa' : 'solicitudes activas'}</strong> y el
                        centro de acopio de {PUERTO_PENASCO.nombre} tiene{' '}
                        <strong>{disponibles.length} {disponibles.length === 1 ? 'residuo disponible' : 'residuos disponibles'}</strong>.
                    </p>
                    <Link
                        href={`${base}/mapa`}
                        className="inline-flex items-center gap-2 mt-4 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-md"
                    >
                        Ver residuos y solicitar <ArrowRight className="w-4 h-4" />
                    </Link>
                </div>
            </div>

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                {kpis.map((kpi) => {
                    const Icon = kpi.icon;
                    return (
                        <Link
                            key={kpi.label}
                            href={kpi.href}
                            className="group bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className={`w-11 h-11 rounded-lg flex items-center justify-center ${kpi.accent}`}>
                                    <Icon className="w-5 h-5" />
                                </div>
                                <ArrowRight className="w-4 h-4 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                            <p className="text-3xl font-bold text-gray-900 dark:text-white">{kpi.value}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">{kpi.label}</p>
                        </Link>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Mapa preview */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <div>
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Centro de acopio</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">
                                {PUERTO_PENASCO.nombre}, {PUERTO_PENASCO.region}
                            </p>
                        </div>
                        <Link
                            href={`${base}/mapa`}
                            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                            Ver inventario <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <MapaCentroAcopio alto="h-80" />
                </div>

                {/* Feed de actividad */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <div className="flex items-center justify-between mb-4">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Actividad reciente</h3>
                        <Link
                            href={`${base}/notificaciones`}
                            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            Ver todas
                        </Link>
                    </div>
                    {notificaciones.length === 0 ? (
                        <div className="flex flex-col items-center gap-2 py-10 text-gray-400">
                            <Inbox className="w-8 h-8" />
                            <p className="text-sm">Sin actividad todavía.</p>
                        </div>
                    ) : (
                        <ul className="space-y-3">
                            {notificaciones.map((n) => (
                                <li key={n.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0">
                                    <NotifIcon tipo={n.tipo} />
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.titulo}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.detalle}</p>
                                        <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{tiempoRelativo(n.created_at)}</p>
                                    </div>
                                </li>
                            ))}
                        </ul>
                    )}
                </div>
            </div>
        </div>
    );
}

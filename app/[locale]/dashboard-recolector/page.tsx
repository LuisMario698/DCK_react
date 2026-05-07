'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
    ClipboardCheck,
    Truck,
    Package,
    Leaf,
    ArrowRight,
    CheckCircle2,
    Droplet,
    XCircle,
    Sparkles,
} from 'lucide-react';
import {
    KPIS_MOCK,
    NOTIFICACIONES_MOCK,
    PUERTOS_MOCK,
    formatHaceMin,
} from '@/lib/mock/recolector';
import { PortMap } from '@/components/recolector/PortMap';

export default function DashboardRecolectorPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const base = `/${locale}/dashboard-recolector`;

    const kpis = [
        {
            label: 'Solicitudes activas',
            value: KPIS_MOCK.solicitudesActivas,
            icon: ClipboardCheck,
            accent: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400',
            href: `${base}/solicitudes`,
        },
        {
            label: 'Recolecciones completadas',
            value: KPIS_MOCK.recoleccionesCompletadas,
            icon: Truck,
            accent: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400',
            href: `${base}/historial`,
        },
        {
            label: 'Material obtenido',
            value: `${KPIS_MOCK.materialObtenidoToneladas} t`,
            icon: Package,
            accent: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400',
            href: `${base}/impacto`,
        },
        {
            label: 'CO₂ evitado',
            value: `${KPIS_MOCK.co2EvitadoToneladas} t`,
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
                    <h2 className="text-2xl sm:text-3xl font-bold mt-1">EcoRecicla S.A.</h2>
                    <p className="text-emerald-50 text-sm mt-2 max-w-xl">
                        Tienes <strong>3 solicitudes activas</strong> y <strong>4 puertos</strong> con residuos disponibles cerca de ti.
                    </p>
                    <Link
                        href={`${base}/mapa`}
                        className="inline-flex items-center gap-2 mt-4 bg-white text-emerald-700 hover:bg-emerald-50 font-semibold text-sm px-4 py-2 rounded-lg transition-colors shadow-md"
                    >
                        Explorar mapa <ArrowRight className="w-4 h-4" />
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
                            <h3 className="text-base font-bold text-gray-900 dark:text-white">Puertos cercanos</h3>
                            <p className="text-xs text-gray-500 dark:text-gray-400">Residuos disponibles en tiempo real</p>
                        </div>
                        <Link
                            href={`${base}/mapa`}
                            className="text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
                        >
                            Ver mapa completo <ArrowRight className="w-3.5 h-3.5" />
                        </Link>
                    </div>
                    <PortMap puertos={PUERTOS_MOCK} height="h-72" />
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
                    <ul className="space-y-3">
                        {NOTIFICACIONES_MOCK.slice(0, 5).map((n) => (
                            <li key={n.id} className="flex items-start gap-3 pb-3 border-b border-gray-100 dark:border-gray-800 last:border-b-0 last:pb-0">
                                <NotifIcon tipo={n.tipo} />
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{n.titulo}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{n.detalle}</p>
                                    <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">{formatHaceMin(n.haceMin)}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

function NotifIcon({ tipo }: { tipo: 'aprobada' | 'rechazada' | 'completada' | 'nuevo_residuo' }) {
    const map = {
        aprobada: { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        rechazada: { Icon: XCircle, cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
        completada: { Icon: Truck, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        nuevo_residuo: { Icon: Droplet, cls: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
    } as const;
    const { Icon, cls } = map[tipo];
    return (
        <div className={`w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
            <Icon className="w-4 h-4" />
        </div>
    );
}

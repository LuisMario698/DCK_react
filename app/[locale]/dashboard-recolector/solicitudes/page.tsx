'use client';

import { useState } from 'react';
import { Eye, Clock, CheckCircle2, XCircle, Truck } from 'lucide-react';
import {
    SOLICITUDES_MOCK,
    EstadoSolicitud,
    TIPO_RESIDUO_LABEL,
} from '@/lib/mock/recolector';

const TABS: { value: EstadoSolicitud | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'completada', label: 'Completadas' },
];

export default function SolicitudesPage() {
    const [tab, setTab] = useState<EstadoSolicitud | 'todas'>('todas');
    const filtradas = tab === 'todas' ? SOLICITUDES_MOCK : SOLICITUDES_MOCK.filter((s) => s.estado === tab);

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6">
                    <nav className="flex gap-1 sm:gap-4 overflow-x-auto -mb-px">
                        {TABS.map((t) => {
                            const count =
                                t.value === 'todas'
                                    ? SOLICITUDES_MOCK.length
                                    : SOLICITUDES_MOCK.filter((s) => s.estado === t.value).length;
                            const active = tab === t.value;
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => setTab(t.value)}
                                    className={`whitespace-nowrap py-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                                        active
                                            ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {t.label}
                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <Th>Puerto</Th>
                                <Th>Residuo</Th>
                                <Th>Cantidad</Th>
                                <Th>Fecha</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {filtradas.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">
                                        {s.puerto}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {TIPO_RESIDUO_LABEL[s.residuo]}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                        {s.cantidad} {s.unidad}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {new Date(s.fechaSolicitud).toLocaleDateString('es-MX')}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4">
                                        <EstadoBadge estado={s.estado} />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        <button className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors">
                                            <Eye className="w-4 h-4" />
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {filtradas.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        No hay solicitudes en esta categoría.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
            {children}
        </th>
    );
}

function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
    const map = {
        pendiente: { Icon: Clock, label: 'Pendiente', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
        aprobada: { Icon: CheckCircle2, label: 'Aprobada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
        rechazada: { Icon: XCircle, label: 'Rechazada', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
        completada: { Icon: Truck, label: 'Completada', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' },
    } as const;
    const { Icon, label, cls } = map[estado];
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
}

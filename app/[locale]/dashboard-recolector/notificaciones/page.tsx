'use client';

import { CheckCircle2, Truck, Droplet, XCircle } from 'lucide-react';
import { NOTIFICACIONES_MOCK, formatHaceMin } from '@/lib/mock/recolector';

export default function NotificacionesPage() {
    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="px-5 py-4 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <h2 className="text-base font-bold text-gray-900 dark:text-white">Todas las notificaciones</h2>
                    <button className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline">
                        Marcar como leídas
                    </button>
                </div>
                <ul className="divide-y divide-gray-100 dark:divide-gray-800">
                    {NOTIFICACIONES_MOCK.map((n) => (
                        <li key={n.id} className="px-5 py-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors flex items-start gap-3">
                            <NotifIcon tipo={n.tipo} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-semibold text-gray-900 dark:text-white">{n.titulo}</p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">{n.detalle}</p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{formatHaceMin(n.haceMin)}</p>
                            </div>
                        </li>
                    ))}
                </ul>
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
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
            <Icon className="w-5 h-5" />
        </div>
    );
}

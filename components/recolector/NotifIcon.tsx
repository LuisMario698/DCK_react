import { Ban, CheckCircle2, Droplet, Inbox, Truck, XCircle } from 'lucide-react';
import type { TipoNotificacion } from '@/types/database';

export function NotifIcon({ tipo, size = 'sm' }: { tipo: TipoNotificacion; size?: 'sm' | 'md' }) {
    const map: Record<TipoNotificacion, { Icon: typeof CheckCircle2; cls: string }> = {
        aprobada: { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400' },
        rechazada: { Icon: XCircle, cls: 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-400' },
        completada: { Icon: Truck, cls: 'bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400' },
        cancelada: { Icon: Ban, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
        nuevo_residuo: { Icon: Droplet, cls: 'bg-cyan-100 text-cyan-600 dark:bg-cyan-900/30 dark:text-cyan-400' },
        nueva_solicitud: { Icon: Inbox, cls: 'bg-orange-100 text-orange-600 dark:bg-orange-900/30 dark:text-orange-400' },
    };
    const { Icon, cls } = map[tipo];
    return (
        <div className={`${size === 'sm' ? 'w-9 h-9' : 'w-10 h-10'} rounded-lg flex items-center justify-center flex-shrink-0 ${cls}`}>
            <Icon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} />
        </div>
    );
}

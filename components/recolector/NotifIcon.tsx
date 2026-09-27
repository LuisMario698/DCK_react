import { Ban, CheckCircle2, Droplet, Inbox, Truck, XCircle } from 'lucide-react';
import type { TipoNotificacion } from '@/types/database';

export function NotifIcon({ tipo, size = 'sm' }: { tipo: TipoNotificacion; size?: 'sm' | 'md' }) {
    const map: Record<TipoNotificacion, { Icon: typeof CheckCircle2; cls: string }> = {
        // Mismos significados que EstadoSolicitudBadge (DISEÑO_SIMAR.md)
        aprobada: { Icon: CheckCircle2, cls: 'bg-simar-marea-suave text-simar-marea-tinta' },
        rechazada: { Icon: XCircle, cls: 'bg-simar-coral-suave text-simar-coral' },
        completada: { Icon: Truck, cls: 'bg-simar-arrecife-suave text-simar-arrecife-tinta' },
        cancelada: { Icon: Ban, cls: 'bg-simar-papel text-simar-texto-2' },
        nuevo_residuo: { Icon: Droplet, cls: 'bg-simar-arrecife-suave text-simar-arrecife-tinta' },
        nueva_solicitud: { Icon: Inbox, cls: 'bg-simar-coral-suave text-simar-coral' },
    };
    const { Icon, cls } = map[tipo];
    return (
        <div className={`${size === 'sm' ? 'w-11 h-11' : 'w-12 h-12'} rounded-full flex items-center justify-center flex-shrink-0 ${cls}`}>
            <Icon className={size === 'sm' ? 'w-5 h-5' : 'w-6 h-6'} />
        </div>
    );
}

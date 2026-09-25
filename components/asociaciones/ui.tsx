'use client';

// Piezas de UI compartidas por el módulo de asociaciones (panel admin y
// portal recolector).

import { useEffect } from 'react';
import { Ban, CheckCircle2, Clock, Loader2, Package, Truck, X, XCircle } from 'lucide-react';
import {
    ESTADO_SOLICITUD_LABEL,
    TIPO_RESIDUO_COLOR,
    TIPO_RESIDUO_LABEL,
    type EstadoSolicitud,
    type TipoResiduo,
} from '@/lib/constants/residuos';

export function EstadoSolicitudBadge({ estado }: { estado: EstadoSolicitud }) {
    const map = {
        pendiente: { Icon: Clock, cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500' },
        aprobada: { Icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
        rechazada: { Icon: XCircle, cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', dot: 'bg-red-500' },
        completada: { Icon: Truck, cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' },
        cancelada: { Icon: Ban, cls: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400', dot: 'bg-gray-400' },
    } as const;
    const { Icon, cls, dot } = map[estado];
    const pulse = estado === 'pendiente';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
            <span className="relative flex h-2 w-2">
                {pulse && <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dot}`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
            </span>
            <Icon className="w-3.5 h-3.5" />
            {ESTADO_SOLICITUD_LABEL[estado]}
        </span>
    );
}

export function ResiduoBadge({ tipo, size = 'sm' }: { tipo: TipoResiduo; size?: 'sm' | 'md' }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-semibold whitespace-nowrap ${TIPO_RESIDUO_COLOR[tipo]} ${
                size === 'sm' ? 'px-2.5 py-1 text-[11px]' : 'px-3 py-1.5 text-xs'
            }`}
        >
            <Package className="w-3 h-3" />
            {TIPO_RESIDUO_LABEL[tipo]}
        </span>
    );
}

export function Modal({
    titulo,
    subtitulo,
    onClose,
    children,
    ancho = 'max-w-lg',
}: {
    titulo: string;
    subtitulo?: string;
    onClose: () => void;
    children: React.ReactNode;
    ancho?: string;
}) {
    useEffect(() => {
        const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
        document.addEventListener('keydown', onKey);
        return () => document.removeEventListener('keydown', onKey);
    }, [onClose]);

    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
        >
            <div
                className={`bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full ${ancho} max-h-[92vh] flex flex-col border border-gray-200 dark:border-gray-800 animate-scale-in`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4">
                    <div className="min-w-0">
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">{titulo}</h3>
                        {subtitulo && <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">{subtitulo}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                        aria-label="Cerrar"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 pb-6 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export const inputCls =
    'w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all disabled:opacity-60';

export function Campo({
    label,
    children,
    ayuda,
    className = '',
}: {
    label: string;
    children: React.ReactNode;
    ayuda?: string;
    className?: string;
}) {
    return (
        <label className={`block ${className}`}>
            <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">{label}</span>
            {children}
            {ayuda && <span className="block text-[11px] text-gray-400 dark:text-gray-500 mt-1">{ayuda}</span>}
        </label>
    );
}

export function BotonPrimario({
    children,
    cargando,
    className = '',
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { cargando?: boolean }) {
    return (
        <button
            {...props}
            disabled={props.disabled || cargando}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-95 ${className}`}
        >
            {cargando && <Loader2 className="w-4 h-4 animate-spin" />}
            {children}
        </button>
    );
}

export function BotonSecundario({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-60 transition-all active:scale-95 ${className}`}
        >
            {children}
        </button>
    );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
    return (
        <div className="flex items-center justify-center gap-2 py-16 text-sm text-gray-500 dark:text-gray-400">
            <Loader2 className="w-5 h-5 animate-spin" />
            {texto}
        </div>
    );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
    return (
        <div className="rounded-xl border border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 p-4 text-sm text-red-700 dark:text-red-300 flex items-center justify-between gap-3">
            <span>{mensaje}</span>
            {onReintentar && (
                <button onClick={onReintentar} className="font-semibold underline underline-offset-2">
                    Reintentar
                </button>
            )}
        </div>
    );
}

/** Mensaje legible a partir de un error de Supabase/PostgREST. */
export function mensajeError(err: unknown, porDefecto = 'Ocurrió un error. Inténtalo de nuevo.'): string {
    if (err && typeof err === 'object' && 'message' in err && typeof (err as { message: unknown }).message === 'string') {
        const msg = (err as { message: string }).message;
        if (msg.includes('duplicate key') && msg.includes('nombre_asociacion')) return 'Ya existe una asociación con ese nombre.';
        if (msg.includes('duplicate key') && msg.includes('tipo')) return 'Ese residuo ya está en el inventario; edítalo en lugar de crearlo.';
        if (msg.includes('row-level security')) return 'No tienes permiso para realizar esta acción.';
        return msg;
    }
    return porDefecto;
}

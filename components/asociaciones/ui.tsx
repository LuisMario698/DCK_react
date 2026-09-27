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
    // Colores con significado (DISEÑO_SIMAR.md): coral = falta hacer algo, azul = en curso,
    // verde = completado. Siempre con ícono y texto; sin animaciones en bucle.
    const map = {
        pendiente: { Icon: Clock, cls: 'bg-simar-coral-suave text-simar-coral' },
        aprobada: { Icon: CheckCircle2, cls: 'bg-simar-marea-suave text-simar-marea-tinta' },
        rechazada: { Icon: XCircle, cls: 'bg-[#A63F0E] text-white' },
        completada: { Icon: Truck, cls: 'bg-simar-arrecife-suave text-simar-arrecife-tinta' },
        cancelada: { Icon: Ban, cls: 'bg-simar-papel text-simar-texto-2' },
    } as const;
    const { Icon, cls } = map[estado];
    return (
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[15px] font-bold whitespace-nowrap ${cls}`}>
            <Icon className="w-4 h-4" strokeWidth={2.2} />
            {ESTADO_SOLICITUD_LABEL[estado]}
        </span>
    );
}

export function ResiduoBadge({ tipo, size = 'sm' }: { tipo: TipoResiduo; size?: 'sm' | 'md' }) {
    return (
        <span
            className={`inline-flex items-center gap-1.5 rounded-full font-bold whitespace-nowrap ${TIPO_RESIDUO_COLOR[tipo]} ${
                size === 'sm' ? 'px-3 py-1 text-[15px]' : 'px-3.5 py-1.5 text-base'
            }`}
        >
            <Package className="w-4 h-4" />
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
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(11,34,54,0.55)]"
            onClick={onClose}
            role="dialog"
            aria-modal="true"
            aria-label={titulo}
        >
            <div
                className={`simar-aparece bg-simar-superficie rounded-[28px] shadow-2xl w-full ${ancho} max-h-[92vh] flex flex-col border border-simar-borde`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
                    <div className="min-w-0">
                        <h3 className="text-[22px] font-extrabold leading-tight text-simar-texto">{titulo}</h3>
                        {subtitulo && <p className="text-base text-simar-texto-2 mt-1">{subtitulo}</p>}
                    </div>
                    <button
                        onClick={onClose}
                        className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors"
                        aria-label="Cerrar"
                    >
                        <X className="w-6 h-6" />
                    </button>
                </div>
                <div className="px-7 pb-7 overflow-y-auto">{children}</div>
            </div>
        </div>
    );
}

export const inputCls =
    'w-full min-h-[56px] px-4 py-3 text-lg rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60';

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
            <span className="block text-[17px] font-bold text-simar-texto mb-2">{label}</span>
            {children}
            {ayuda && <span className="block text-[15px] text-simar-texto-2 mt-1.5">{ayuda}</span>}
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
            className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-60 disabled:cursor-not-allowed transition-colors ${className}`}
        >
            {cargando && <Loader2 className="w-5 h-5 animate-spin" />}
            {children}
        </button>
    );
}

export function BotonSecundario({ children, className = '', ...props }: React.ButtonHTMLAttributes<HTMLButtonElement>) {
    return (
        <button
            {...props}
            className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-simar-texto bg-simar-superficie border-2 border-simar-campo-borde hover:border-simar-marea-tinta disabled:opacity-60 transition-colors ${className}`}
        >
            {children}
        </button>
    );
}

export function Cargando({ texto = 'Cargando…' }: { texto?: string }) {
    return (
        <div className="flex items-center justify-center gap-2.5 py-16 text-lg text-simar-texto-2">
            <Loader2 className="w-6 h-6 animate-spin" />
            {texto}
        </div>
    );
}

export function ErrorCarga({ mensaje, onReintentar }: { mensaje: string; onReintentar?: () => void }) {
    return (
        <div className="rounded-2xl bg-simar-coral-suave p-5 text-base text-simar-texto flex flex-wrap items-center justify-between gap-3">
            <span>{mensaje}</span>
            {onReintentar && (
                <button onClick={onReintentar} className="min-h-[44px] font-bold text-simar-coral underline underline-offset-4">
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

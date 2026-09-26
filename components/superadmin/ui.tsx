'use client';

// Piezas de UI del panel de superadmin. Los formularios reutilizan las de
// components/asociaciones/ui.tsx (Modal, Campo, inputCls, botones).

import { useState } from 'react';
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    Clock,
    Hourglass,
    ShieldCheck,
    XCircle,
    type LucideIcon,
} from 'lucide-react';
import {
    ESTADO_SUSCRIPCION_COLOR,
    ESTADO_SUSCRIPCION_LABEL,
    type EstadoSuscripcion,
} from '@/lib/constants/suscripciones';
import type { RolUsuario } from '@/types/database';
import { formatearFecha } from '@/lib/utils/fechas';
import { BotonSecundario, Modal, inputCls } from '@/components/asociaciones/ui';

export function Tarjeta({
    titulo,
    subtitulo,
    acciones,
    children,
    className = '',
    sinPadding = false,
}: {
    titulo?: string;
    subtitulo?: string;
    acciones?: React.ReactNode;
    children: React.ReactNode;
    className?: string;
    sinPadding?: boolean;
}) {
    return (
        <section
            className={`bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm ${className}`}
        >
            {(titulo || acciones) && (
                <header className="flex flex-wrap items-start justify-between gap-3 px-5 pt-5 pb-3">
                    <div className="min-w-0">
                        {titulo && <h2 className="text-sm font-bold text-gray-900 dark:text-white">{titulo}</h2>}
                        {subtitulo && <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{subtitulo}</p>}
                    </div>
                    {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
                </header>
            )}
            <div className={sinPadding ? '' : 'px-5 pb-5'}>{children}</div>
        </section>
    );
}

/** Indicador: etiqueta, valor y un detalle opcional. */
export function Kpi({
    label,
    valor,
    detalle,
    icono: Icono,
    alerta = false,
}: {
    label: string;
    valor: string | number;
    detalle?: React.ReactNode;
    icono: LucideIcon;
    /** Resalta el indicador cuando requiere atención. */
    alerta?: boolean;
}) {
    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm">
            <div className="flex items-center justify-between gap-3">
                <span className="text-xs font-semibold text-gray-500 dark:text-gray-400">{label}</span>
                <span
                    className={`w-8 h-8 rounded-lg flex items-center justify-center ${
                        alerta
                            ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300'
                            : 'bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
                    }`}
                >
                    <Icono className="w-4 h-4" />
                </span>
            </div>
            <p className="mt-3 text-2xl font-bold text-gray-900 dark:text-white">{valor}</p>
            {detalle && <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{detalle}</p>}
        </div>
    );
}

const ICONO_ESTADO: Record<EstadoSuscripcion, LucideIcon> = {
    prueba: Hourglass,
    activa: CheckCircle2,
    vencida: AlertTriangle,
    suspendida: Ban,
    cancelada: XCircle,
};

export function EstadoSuscripcionBadge({ estado }: { estado: EstadoSuscripcion | null }) {
    if (!estado) {
        return (
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400">
                <Clock className="w-3.5 h-3.5" />
                Sin suscripción
            </span>
        );
    }
    const Icono = ICONO_ESTADO[estado];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${ESTADO_SUSCRIPCION_COLOR[estado]}`}
        >
            <Icono className="w-3.5 h-3.5" />
            {ESTADO_SUSCRIPCION_LABEL[estado]}
        </span>
    );
}

export const ROL_LABEL: Record<RolUsuario, string> = {
    admin: 'Administrador',
    recolector: 'Recolector',
    pendiente: 'Pendiente',
};

export function RolBadge({ rol, superadmin = false }: { rol: RolUsuario; superadmin?: boolean }) {
    if (superadmin) {
        return (
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300">
                <ShieldCheck className="w-3.5 h-3.5" />
                Superadmin
            </span>
        );
    }
    const cls = {
        admin: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
        recolector: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        pendiente: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    }[rol];
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold whitespace-nowrap ${cls}`}>
            {ROL_LABEL[rol]}
        </span>
    );
}

/** Interruptor accesible (role="switch"). */
export function Interruptor({
    activo,
    onChange,
    disabled,
    etiqueta,
}: {
    activo: boolean;
    onChange: (valor: boolean) => void;
    disabled?: boolean;
    etiqueta: string;
}) {
    return (
        <button
            type="button"
            role="switch"
            aria-checked={activo}
            aria-label={etiqueta}
            disabled={disabled}
            onClick={() => onChange(!activo)}
            className={`relative inline-flex h-6 w-11 flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900 ${
                activo ? 'bg-violet-600' : 'bg-gray-300 dark:bg-gray-700'
            }`}
        >
            <span
                className={`inline-block h-5 w-5 rounded-full bg-white shadow transition-transform ${
                    activo ? 'translate-x-5' : 'translate-x-0.5'
                }`}
            />
        </button>
    );
}

export function Pestanas<T extends string>({
    pestanas,
    activa,
    onChange,
}: {
    pestanas: { id: T; label: string; contador?: number }[];
    activa: T;
    onChange: (id: T) => void;
}) {
    return (
        <div role="tablist" className="inline-flex p-1 rounded-xl bg-gray-100 dark:bg-gray-800/60 gap-1">
            {pestanas.map((p) => (
                <button
                    key={p.id}
                    role="tab"
                    aria-selected={activa === p.id}
                    onClick={() => onChange(p.id)}
                    className={`px-3.5 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                        activa === p.id
                            ? 'bg-white dark:bg-gray-900 text-gray-900 dark:text-white shadow-sm'
                            : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                    }`}
                >
                    {p.label}
                    {!!p.contador && (
                        <span className="ml-1.5 text-xs font-bold text-violet-600 dark:text-violet-300">{p.contador}</span>
                    )}
                </button>
            ))}
        </div>
    );
}

export function EstadoVacio({
    icono: Icono,
    titulo,
    texto,
    accion,
}: {
    icono: LucideIcon;
    titulo: string;
    texto?: string;
    accion?: React.ReactNode;
}) {
    return (
        <div className="flex flex-col items-center text-center py-12 px-4">
            <div className="w-12 h-12 rounded-2xl bg-gray-100 dark:bg-gray-800 text-gray-400 flex items-center justify-center mb-3">
                <Icono className="w-6 h-6" />
            </div>
            <p className="text-sm font-semibold text-gray-900 dark:text-white">{titulo}</p>
            {texto && <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 max-w-sm">{texto}</p>}
            {accion && <div className="mt-4">{accion}</div>}
        </div>
    );
}

/** Botón de icono para las acciones de una fila de tabla. */
export function BotonIcono({
    icono: Icono,
    etiqueta,
    peligro = false,
    ...props
}: React.ButtonHTMLAttributes<HTMLButtonElement> & { icono: LucideIcon; etiqueta: string; peligro?: boolean }) {
    return (
        <button
            type="button"
            title={etiqueta}
            aria-label={etiqueta}
            {...props}
            className={`p-2 rounded-lg transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                peligro
                    ? 'text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:text-red-400 dark:hover:bg-red-900/20'
                    : 'text-gray-400 hover:text-gray-900 hover:bg-gray-100 dark:hover:text-white dark:hover:bg-gray-800'
            }`}
        >
            <Icono className="w-4 h-4" />
        </button>
    );
}

/**
 * Confirmación de una acción. Con `textoRequerido` el botón sólo se habilita
 * cuando se escribe exactamente ese texto (para acciones irreversibles).
 */
export function ModalConfirmar({
    titulo,
    children,
    textoConfirmar,
    peligro = false,
    textoRequerido,
    onConfirmar,
    onClose,
}: {
    titulo: string;
    children: React.ReactNode;
    textoConfirmar: string;
    peligro?: boolean;
    textoRequerido?: string;
    /** Si lanza un error, el modal sigue abierto. */
    onConfirmar: () => Promise<void>;
    onClose: () => void;
}) {
    const [escrito, setEscrito] = useState('');
    const [enviando, setEnviando] = useState(false);
    const bloqueado = !!textoRequerido && escrito.trim().toLowerCase() !== textoRequerido.toLowerCase();

    const confirmar = async () => {
        setEnviando(true);
        try {
            await onConfirmar();
        } catch {
            // Quien llama ya mostró el error; el modal sigue abierto para reintentar
        } finally {
            setEnviando(false);
        }
    };

    return (
        <Modal titulo={titulo} onClose={onClose}>
            <div className="space-y-4 text-sm text-gray-600 dark:text-gray-300">
                {children}
                {textoRequerido && (
                    <label className="block">
                        <span className="block text-xs font-semibold text-gray-600 dark:text-gray-400 mb-1">
                            Escribe <strong className="font-mono text-gray-900 dark:text-white">{textoRequerido}</strong> para confirmar
                        </span>
                        <input
                            className={inputCls}
                            value={escrito}
                            onChange={(e) => setEscrito(e.target.value)}
                            autoFocus
                            autoComplete="off"
                        />
                    </label>
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <BotonSecundario onClick={onClose} disabled={enviando}>
                        Cancelar
                    </BotonSecundario>
                    <button
                        onClick={confirmar}
                        disabled={bloqueado || enviando}
                        className={`inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 ${
                            peligro ? 'bg-red-600 hover:bg-red-700' : 'bg-violet-600 hover:bg-violet-700'
                        }`}
                    >
                        {enviando ? 'Procesando…' : textoConfirmar}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

export const thCls =
    'px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-gray-500 dark:text-gray-400 whitespace-nowrap';
export const tdCls = 'px-4 py-3 text-sm text-gray-700 dark:text-gray-300 align-middle';

// ─────────────────────────────────────────────────────────────────────
// Formatos
// ─────────────────────────────────────────────────────────────────────

const FECHA_HORA = new Intl.DateTimeFormat('es-MX', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    timeZone: 'America/Hermosillo',
});

/** Fecha corta ('05 oct 2026') o '—' si no hay; sin el desfase de las columnas `date`. */
export function formatoFecha(fecha: string | null | undefined): string {
    return fecha ? formatearFecha(fecha) : '—';
}

/** timestamptz → fecha y hora de Puerto Peñasco. */
export function formatoFechaHora(iso: string | null | undefined): string {
    if (!iso) return '—';
    return FECHA_HORA.format(new Date(iso));
}

const RELATIVO = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });

export function hace(iso: string | null | undefined): string {
    if (!iso) return 'Nunca';
    const seg = (Date.parse(iso) - Date.now()) / 1000;
    const unidades: [Intl.RelativeTimeFormatUnit, number][] = [
        ['year', 31_536_000],
        ['month', 2_592_000],
        ['day', 86_400],
        ['hour', 3_600],
        ['minute', 60],
    ];
    for (const [unidad, s] of unidades) {
        if (Math.abs(seg) >= s) return RELATIVO.format(Math.round(seg / s), unidad);
    }
    return 'Justo ahora';
}

export function formatoBytes(bytes: number): string {
    if (!bytes) return '0 B';
    const u = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), u.length - 1);
    return `${(bytes / 1024 ** i).toLocaleString('es-MX', { maximumFractionDigits: i ? 1 : 0 })} ${u[i]}`;
}

export function formatoNumero(n: number): string {
    return n.toLocaleString('es-MX');
}

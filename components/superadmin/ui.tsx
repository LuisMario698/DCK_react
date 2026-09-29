'use client';

// Piezas de UI del panel de superadmin. Los formularios reutilizan las de
// components/asociaciones/ui.tsx (Modal, Campo, inputCls, botones).

import { useState } from 'react';
import { NumeroAnimado } from '@/components/ui/movimiento';
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
            className={`bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar ${className}`}
        >
            {(titulo || acciones) && (
                <header className="flex flex-wrap items-start justify-between gap-3 px-6 pt-6 pb-3 movil:gap-2 movil:px-4 movil:pt-4 movil:pb-2.5">
                    <div className="min-w-0">
                        {titulo && <h2 className="text-[20px] font-extrabold text-simar-texto movil:text-[17px]">{titulo}</h2>}
                        {subtitulo && <p className="text-[15px] text-simar-texto-2 mt-0.5 movil:leading-snug">{subtitulo}</p>}
                    </div>
                    {acciones && <div className="flex flex-wrap items-center gap-2">{acciones}</div>}
                </header>
            )}
            <div className={sinPadding ? '' : 'px-6 pb-6 movil:px-4 movil:pb-4'}>{children}</div>
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
    // En celular, dos por fila (como TarjetaDato apilada del recinto): ícono y etiqueta más chicos
    return (
        <div className="bg-simar-superficie border border-simar-borde rounded-[22px] p-5 shadow-simar movil:p-3">
            <div className="flex items-center justify-between gap-3 movil:items-start movil:gap-2">
                <span className="text-[17px] text-simar-texto-2 movil:text-[13px] movil:leading-tight">{label}</span>
                <span
                    className={`w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 movil:w-8 movil:h-8 ${
                        alerta
                            ? 'bg-simar-coral-suave text-simar-coral'
                            : 'bg-simar-violeta-suave text-simar-violeta'
                    }`}
                >
                    <Icono className="w-6 h-6 movil:w-[17px] movil:h-[17px]" />
                </span>
            </div>
            <p className="mt-3 text-[30px] font-extrabold leading-tight text-simar-texto movil:mt-1 movil:text-[20px] movil:whitespace-nowrap">
                {/* Los conteos cuentan al aparecer; los textos (MXN, bytes) se muestran tal cual */}
                {typeof valor === 'number' ? <NumeroAnimado valor={valor} /> : valor}
            </p>
            {detalle && <p className="mt-1 text-[15px] text-simar-texto-2 movil:mt-0.5 movil:text-[13px] movil:leading-snug">{detalle}</p>}
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
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[15px] font-semibold whitespace-nowrap bg-simar-papel text-simar-texto-2">
                <Clock className="w-3.5 h-3.5" />
                Sin suscripción
            </span>
        );
    }
    const Icono = ICONO_ESTADO[estado];
    return (
        <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[15px] font-semibold whitespace-nowrap ${ESTADO_SUSCRIPCION_COLOR[estado]}`}
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
            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[15px] font-semibold whitespace-nowrap bg-simar-violeta-suave text-simar-violeta">
                <ShieldCheck className="w-3.5 h-3.5" />
                Superadmin
            </span>
        );
    }
    const cls = {
        admin: 'bg-simar-marea-suave text-simar-marea-tinta',
        recolector: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        pendiente: 'bg-simar-papel text-simar-texto-2',
    }[rol];
    return (
        <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[15px] font-semibold whitespace-nowrap ${cls}`}>
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
            // Medidas en px (32 × 56, bolita de 28): la escala compacta del celular encoge h-8/w-14 pero no
            // el recorrido de 26 px, y la bolita se salía
            className={`relative inline-flex h-[32px] w-[56px] flex-shrink-0 items-center rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta focus-visible:ring-offset-2 ${
                activo ? 'bg-[#5B3FA8]' : 'bg-simar-campo-borde'
            }`}
        >
            <span
                className={`inline-block h-[28px] w-[28px] rounded-full bg-white shadow-simar transition-transform ${
                    activo ? 'translate-x-[26px]' : 'translate-x-[2px]'
                }`}
            />
        </button>
    );
}

/**
 * Pestañas de una pantalla (secciones: la pastilla azul). En celular ocupan todo el ancho en partes
 * iguales y usan `corto` si la palabra no cabe ("Invitaciones pendientes" → "Invitaciones").
 */
export function Pestanas<T extends string>({
    pestanas,
    activa,
    onChange,
}: {
    pestanas: { id: T; label: string; corto?: string; contador?: number }[];
    activa: T;
    onChange: (id: T) => void;
}) {
    return (
        <div role="tablist" className="inline-flex flex-wrap p-1.5 rounded-2xl bg-simar-superficie border border-simar-borde shadow-simar gap-1 movil:flex movil:flex-nowrap movil:w-full movil:p-1">
            {pestanas.map((p) => (
                <button
                    key={p.id}
                    role="tab"
                    aria-selected={activa === p.id}
                    onClick={() => onChange(p.id)}
                    className={`simar-presiona min-h-[48px] px-5 rounded-xl text-base font-bold transition-colors movil:flex-1 movil:min-w-0 movil:min-h-[42px] movil:px-2 movil:text-[15px] ${
                        activa === p.id
                            ? 'bg-simar-marea text-white'
                            : 'text-simar-texto-2 hover:text-simar-texto hover:bg-simar-papel'
                    }`}
                >
                    {p.corto ? (
                        <>
                            <span className="movil:hidden">{p.label}</span>
                            <span className="hidden movil:inline">{p.corto}</span>
                        </>
                    ) : (
                        p.label
                    )}
                    {!!p.contador && (
                        <span className={`ml-1.5 text-[15px] font-bold ${activa === p.id ? 'text-white' : 'text-simar-violeta'}`}>{p.contador}</span>
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
        <div className="flex flex-col items-center text-center py-12 px-4 movil:py-8">
            <div className="w-16 h-16 rounded-full bg-simar-papel text-simar-texto-2 flex items-center justify-center mb-3 movil:w-12 movil:h-12">
                <Icono className="w-8 h-8" />
            </div>
            <p className="text-lg font-bold text-simar-texto">{titulo}</p>
            {texto && <p className="text-base text-simar-texto-2 mt-1 max-w-sm">{texto}</p>}
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
            className={`w-11 h-11 inline-flex items-center justify-center rounded-xl transition-colors disabled:opacity-40 disabled:cursor-not-allowed ${
                peligro
                    ? 'text-simar-texto-2 hover:text-simar-coral hover:bg-simar-coral-suave'
                    : 'text-simar-texto-2 hover:text-simar-texto hover:bg-simar-papel'
            }`}
        >
            <Icono className="w-5 h-5" />
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
            <div className="space-y-4 text-base text-simar-texto-2">
                {children}
                {textoRequerido && (
                    <label className="block text-[17px] font-bold text-simar-texto">
                        <span className="block text-[15px] font-semibold text-simar-texto-2 mb-1">
                            Escribe <strong className="font-mono text-simar-texto">{textoRequerido}</strong> para confirmar
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
                <div className="flex flex-wrap justify-end gap-3 pt-2">
                    <BotonSecundario onClick={onClose} disabled={enviando}>
                        Cancelar
                    </BotonSecundario>
                    <button
                        onClick={confirmar}
                        disabled={bloqueado || enviando}
                        className={`inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors ${
                            peligro ? 'bg-[#A63F0E] hover:bg-[#8C340B]' : 'bg-[#5B3FA8] hover:bg-[#4A3289]'
                        }`}
                    >
                        {enviando ? 'Procesando…' : textoConfirmar}
                    </button>
                </div>
            </div>
        </Modal>
    );
}

/** Controles de filtro: como inputCls pero sin w-full (Tailwind no garantiza que w-auto le gane). */
export const filtroCls = inputCls.replace('w-full ', '');

export const thCls =
    'px-4 py-3.5 text-left text-[15px] font-bold text-simar-texto-2 whitespace-nowrap';
export const tdCls = 'px-4 py-3 text-base text-simar-texto align-middle';

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

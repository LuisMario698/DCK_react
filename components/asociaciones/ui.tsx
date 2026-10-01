'use client';

// Piezas de UI compartidas por el módulo de asociaciones (panel admin y
// portal recolector).

import { useEffect, useRef, useState } from 'react';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { Ban, CheckCircle2, Clock, Loader2, Package, Truck, X, XCircle } from 'lucide-react';
import {
    ESTADO_SOLICITUD_LABEL,
    TIPO_RESIDUO_COLOR,
    TIPO_RESIDUO_LABEL,
    type EstadoSolicitud,
    type TipoResiduo,
} from '@/lib/constants/residuos';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';

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
        // En celular más angosta, para dejarle espacio al nombre de la asociación en la misma línea
        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[15px] font-bold whitespace-nowrap movil:gap-1 movil:px-2.5 movil:text-[13px] ${cls}`}>
            <Icon className="w-4 h-4 movil:w-3.5 movil:h-3.5" strokeWidth={2.2} />
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
    // Al cerrar desde la ventana (X, clic fuera, Escape) primero se ve la salida y luego se
    // avisa a la pantalla. Si la pantalla la cierra sola (al guardar), desaparece sin más.
    const reducir = usePrefiereMenosMovimiento();
    const [cerrando, setCerrando] = useState(false);
    const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(espera.current), []);
    const cerrar = () => {
        if (cerrando) return;
        setCerrando(true);
        espera.current = setTimeout(onClose, reducir ? 0 : 180);
    };
    const cerrarRef = useRef(cerrar);
    // Foco adentro al abrir, Tab no se sale y al cerrar regresa al botón que la abrió
    const panelRef = useRef<HTMLDivElement>(null);
    useVentanaAccesible(panelRef, true, { alEscape: () => cerrarRef.current() });
    useEffect(() => {
        cerrarRef.current = cerrar;
    });

    return (
        <div
            className={`${cerrando ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 z-50 flex items-center justify-center p-4 bg-[rgba(11,34,54,0.55)]`}
            onClick={cerrar}
        >
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={titulo}
                tabIndex={-1}
                className={`${cerrando ? 'simar-ventana-sale' : 'simar-ventana'} bg-simar-superficie rounded-[28px] shadow-2xl w-full ${ancho} max-h-[92vh] flex flex-col border border-simar-borde outline-none`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex items-start justify-between gap-4 px-7 pt-7 pb-5">
                    <div className="min-w-0">
                        <h3 className="text-[22px] font-extrabold leading-tight text-simar-texto">{titulo}</h3>
                        {subtitulo && <p className="text-base text-simar-texto-2 mt-1">{subtitulo}</p>}
                    </div>
                    <button
                        onClick={cerrar}
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

/**
 * Filtro dentro de una sección, en celular (segundo nivel): canal gris y la opción elegida en blanco.
 * Más discreto que la pastilla azul de las secciones, para que se lea qué manda sobre qué. El número
 * de cada opción es opcional: en coral o azul si hay algo que atender, neutro si está en cero.
 * Sólo se muestra en la zona compacta de celular; tableta y escritorio usan sus pestañas de siempre.
 */
export function ControlSegmentado<T extends string>({
    opciones,
    valor,
    onCambiar,
    etiqueta,
    vista = 'movil',
}: {
    opciones: { valor: T; texto: string; conteo?: number; tono?: 'coral' | 'marea' }[];
    valor: T;
    onCambiar: (valor: T) => void;
    /** Nombre del grupo para el lector de pantalla */
    etiqueta: string;
    /**
     * 'movil' (lo de siempre): sólo en celular, a lo ancho. 'computadora': sólo en tableta y
     * computadora, también a lo ancho (las opciones se reparten parejo y el control cuadra con la
     * tabla de abajo), con la letra y los botones del tamaño de escritorio; si no caben en una fila,
     * dos filas de tres (pensado para seis opciones: Solicitudes del recinto, cuyos filtros ya no son
     * pestañas subrayadas).
     */
    vista?: 'movil' | 'computadora';
}) {
    const computadora = vista === 'computadora';
    const control = (
        <nav
            aria-label={etiqueta}
            className={
                computadora
                    ? // Por el ancho de SU contenedor (no de la pantalla): si caben en una fila (≥ 1024 px),
                      // una fila; si no (laptop con el menú abierto, tableta), dos filas de tres. Siempre de
                      // orilla a orilla, sin deslizarse (así no quedan opciones escondidas)
                      'grid grid-cols-3 @5xl:flex gap-1 p-1 rounded-[16px] bg-simar-papel'
                    : 'hidden movil:flex gap-0.5 p-[3px] rounded-[14px] bg-simar-papel'
            }
        >
            {opciones.map((o) => {
                const activo = o.valor === valor;
                const n = o.conteo ?? 0;
                const tonoConteo =
                    n > 0 && o.tono === 'coral'
                        ? 'bg-[#A63F0E] text-white'
                        : n > 0 && o.tono === 'marea'
                          ? 'bg-simar-marea-suave text-simar-marea-tinta'
                          : activo
                            ? 'bg-simar-papel text-simar-texto-2'
                            : 'bg-simar-superficie text-simar-texto-2';
                return (
                    <button
                        key={o.valor}
                        type="button"
                        onClick={() => onCambiar(o.valor)}
                        aria-pressed={activo}
                        className={`simar-presiona inline-flex items-center justify-center font-bold leading-tight transition-colors ${
                            computadora
                                ? 'flex-1 whitespace-nowrap min-h-[48px] px-4 rounded-[12px] gap-2 text-[17px]'
                                : 'flex-auto min-w-0 min-h-[42px] px-1.5 rounded-[11px] gap-1 text-[clamp(12px,3.6vw,14px)]'
                        } ${activo ? 'bg-simar-superficie text-simar-texto shadow-simar' : `text-simar-texto-2 ${computadora ? 'hover:text-simar-texto' : ''}`}`}
                    >
                        {o.texto}
                        {o.conteo !== undefined && (
                            <span
                                className={`flex-shrink-0 rounded-full font-bold tabular-nums inline-flex items-center justify-center ${
                                    computadora ? 'min-w-[26px] h-[26px] px-1.5 text-[14px]' : 'min-w-[20px] h-[20px] px-1 text-[12px]'
                                } ${tonoConteo}`}
                            >
                                {o.conteo}
                            </span>
                        )}
                    </button>
                );
            })}
        </nav>
    );
    // El de computadora va dentro de un contenedor que mide su propio ancho (@container)
    return computadora ? <div className="@container movil:hidden">{control}</div> : control;
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
        if (msg.includes('duplicate key') && msg.includes('nombre_asociacion')) return 'Ya existe una empresa con ese nombre.';
        if (msg.includes('duplicate key') && msg.includes('tipo')) return 'Ese residuo ya está en el inventario; edítalo en lugar de crearlo.';
        if (msg.includes('row-level security')) return 'No tienes permiso para realizar esta acción.';
        return msg;
    }
    return porDefecto;
}

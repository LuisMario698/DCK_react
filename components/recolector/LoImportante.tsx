'use client';

/**
 * Lo importante del Inicio del portal, con las piezas de SiMAR (DISEÑO_SIMAR.md §10.20):
 * - `ProximaRecoleccion`: la recolección agendada, como la tarjeta principal del Panel (azul sólido,
 *   ícono en círculo blanco y pastillas): el día en grande, "Ver solicitud" y "Cómo llegar"; las
 *   demás agendadas debajo. Si ya pasó su fecha, una tarjeta blanca con "Ya pasó su fecha" en coral.
 * - `Avisos`: UNA tarjeta blanca con lo que el centro de acopio le dijo a la empresa: los mensajes
 *   nuevos y los últimos avisos (primero los que no ha visto, con "Nueva" y fondo azul suave, como en
 *   Notificaciones). Tocar uno lo marca como visto y abre su solicitud. Antes cada aviso era una
 *   tarjeta de color con dos botones y se juntaba un bulto; además se repetían en "Actividad reciente".
 * - `TuResumen`: los cuatro datos de la empresa en una lista, cada uno lleva a su pantalla.
 */
import Link from 'next/link';
import type { ReactNode } from 'react';
import { BellOff, CalendarCheck, CalendarX, ChevronRight, MessageSquare, Navigation, type LucideIcon } from 'lucide-react';
import { PUERTO_PENASCO, TIPO_RESIDUO_LABEL, formatCantidad, tiempoRelativo, unidadEscrita } from '@/lib/constants/residuos';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { cantidadVigente } from '@/lib/services/solicitudes';
import { clasePastilla } from '@/components/dashboard/pastilla';
import { NumeroAnimado } from '@/components/ui/movimiento';
import { NotifIcon } from './NotifIcon';
import type { Notificacion, SolicitudConAsociacion } from '@/types/database';

const COMO_LLEGAR = `https://www.google.com/maps/dir/?api=1&destination=${PUERTO_PENASCO.lat},${PUERTO_PENASCO.lng}`;

/** "Jueves 3 de octubre" */
export function diaLargo(fecha: string) {
    const t = parseFechaLocal(fecha).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
    return t.charAt(0).toUpperCase() + t.slice(1);
}

/** Días de hoy a esa fecha (las dos en texto YYYY-MM-DD) */
export function diasHasta(fecha: string, hoy: string) {
    return Math.round((parseFechaLocal(fecha).getTime() - parseFechaLocal(hoy).getTime()) / 86400000);
}

function cuandoEs(dias: number) {
    if (dias === 0) return 'Hoy';
    if (dias === 1) return 'Mañana';
    return `En ${dias} días`;
}

const cantidadDe = (s: SolicitudConAsociacion) =>
    `${formatCantidad(cantidadVigente(s))} ${unidadEscrita(s.unidad, cantidadVigente(s))} de ${TIPO_RESIDUO_LABEL[s.tipo].toLowerCase()}`;

// Botones de SiMAR (DISEÑO_SIMAR.md §10.5): la acción en azul, la otra secundaria con borde de 2 px
const botonPrimario =
    'simar-presiona inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-bold transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]';
const botonSecundario =
    'simar-presiona inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]';

const tarjeta = 'bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] movil:rounded-[22px]';

export function ProximaRecoleccion({
    proxima,
    otras,
    recienAprobada,
    hoy,
    base,
}: {
    /** La recolección aprobada más cercana */
    proxima: SolicitudConAsociacion;
    /** Las demás aprobadas, en orden de fecha */
    otras: SolicitudConAsociacion[];
    /** Se acaba de aprobar (su aviso no se ha visto): lleva "Recién aprobada" */
    recienAprobada: boolean;
    hoy: string;
    base: string;
}) {
    const dias = diasHasta(proxima.fecha_propuesta, hoy);

    // Si ya pasó su fecha: tarjeta blanca y "Ya pasó su fecha" escrito en coral
    if (dias < 0) {
        return (
            <div className={`simar-aparece h-full flex flex-col justify-center gap-4 p-6 ${tarjeta} movil:p-3.5 movil:gap-3`} style={{ animationDelay: '0.04s' }}>
                <div className="flex items-start gap-4 movil:gap-3">
                    <span className="w-14 h-14 flex-shrink-0 rounded-full bg-simar-coral-suave text-simar-coral flex items-center justify-center movil:w-11 movil:h-11">
                        <CalendarX className="w-7 h-7 movil:w-[22px] movil:h-[22px]" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div className="min-w-0">
                        <p className="text-[15px] font-bold text-simar-coral movil:text-[13px]">Ya pasó su fecha</p>
                        <p className="text-[21px] font-extrabold leading-snug text-simar-texto movil:text-[16px]">Tu recolección del {diaLargo(proxima.fecha_propuesta).toLowerCase()}</p>
                        <p className="text-[17px] text-simar-texto-2 movil:text-[13.5px]">{cantidadDe(proxima)}. Aún no se registra: escribe al centro de acopio para acordar otro día.</p>
                    </div>
                </div>
                <div className="flex flex-wrap gap-2.5 movil:grid movil:grid-cols-2">
                    <Link href={`${base}/mensajes`} className={botonPrimario}>
                        <MessageSquare className="w-5 h-5" aria-hidden="true" />
                        Escribir
                    </Link>
                    <Link href={`${base}/solicitudes?ver=${proxima.id}`} className={botonSecundario}>
                        Ver solicitud
                    </Link>
                </div>
            </div>
        );
    }

    return (
        <div className="simar-aparece h-full flex flex-col justify-center rounded-[28px] bg-simar-marea text-white shadow-simar p-6 md:p-7 movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.04s' }}>
            <div className="flex items-center gap-5 movil:gap-3.5">
                <span className="w-[72px] h-[72px] flex-shrink-0 rounded-full bg-white text-[#1B5FC9] flex items-center justify-center movil:w-[54px] movil:h-[54px]">
                    <CalendarCheck className="w-[34px] h-[34px] movil:w-[26px] movil:h-[26px]" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="min-w-0">
                    <p className="text-[17px] md:text-[19px] text-[#E6EEFB] movil:text-[14px]">Tu próxima recolección</p>
                    <p className="text-[30px] md:text-[34px] font-extrabold leading-tight movil:text-[23px]">{diaLargo(proxima.fecha_propuesta)}</p>
                    <p className="text-[17px] md:text-[19px] leading-snug text-[#E6EEFB] movil:text-[14px]">
                        {cantidadDe(proxima)} · Centro de acopio de {PUERTO_PENASCO.nombre}
                    </p>
                    <div className="flex flex-wrap gap-x-2">
                        <span className={clasePastilla(true)}>{cuandoEs(dias)}</span>
                        {recienAprobada && <span className={clasePastilla(true, true)}>Recién aprobada</span>}
                    </div>
                </div>
            </div>
            <div className="mt-5 flex flex-wrap gap-2.5 movil:mt-3.5 movil:grid movil:grid-cols-2">
                <Link
                    href={`${base}/solicitudes?ver=${proxima.id}`}
                    className="simar-presiona min-h-[52px] px-6 rounded-2xl bg-white text-[#1B5FC9] text-[17px] font-bold inline-flex items-center justify-center gap-2 movil:min-h-[46px] movil:px-3 movil:text-[15px]"
                >
                    Ver solicitud
                </Link>
                <a
                    href={COMO_LLEGAR}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="simar-presiona min-h-[52px] px-6 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-[17px] font-bold inline-flex items-center justify-center gap-2 transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]"
                >
                    <Navigation className="w-5 h-5" aria-hidden="true" />
                    Cómo llegar
                </a>
            </div>
            {otras.length > 0 && (
                <ul className="mt-5 pt-3 border-t border-white/25 movil:mt-3.5 movil:pt-2.5">
                    <li className="text-[15px] font-bold text-[#E6EEFB] movil:text-[13px]">También agendadas</li>
                    {otras.slice(0, 3).map((s) => (
                        <li key={s.id}>
                            <Link
                                href={`${base}/solicitudes?ver=${s.id}`}
                                className="flex flex-wrap items-center gap-x-2 min-h-[40px] text-[17px] hover:underline underline-offset-4 movil:text-[14px] movil:min-h-[36px]"
                            >
                                <strong>{diaLargo(s.fecha_propuesta)}</strong>
                                <span className="text-[#E6EEFB]">{cantidadDe(s)}</span>
                            </Link>
                        </li>
                    ))}
                    {otras.length > 3 && <li className="text-[15px] text-[#E6EEFB] movil:text-[13px]">y {otras.length - 3} más en Mis solicitudes</li>}
                </ul>
            )}
        </div>
    );
}

/** "Nueva" (o "Nuevo"): lo que aún no se ve, escrito, no sólo de color (como en Notificaciones) */
const Nueva = ({ children }: { children: ReactNode }) => (
    <span className="flex-shrink-0 px-2 py-px rounded-full bg-simar-marea text-white text-[13px] font-bold leading-tight movil:text-[12px]">{children}</span>
);

// Un renglón de Avisos: sin ver, en azul suave; ya visto, en blanco
const renglon = (nuevo: boolean) =>
    `flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-colors movil:gap-2.5 movil:px-2.5 movil:py-2.5 ${
        nuevo ? 'bg-simar-marea-suave/50 hover:bg-simar-marea-suave' : 'hover:bg-simar-papel'
    }`;

/** Cuántos renglones caben sin hacer bulto; los demás, en Notificaciones */
const RENGLONES = 3;

export function Avisos({
    notificaciones,
    mensajes,
    nuevos,
    destino,
    onAbrir,
    base,
}: {
    /** Los últimos avisos de la empresa (los más recientes primero) */
    notificaciones: Notificacion[];
    /** Mensajes del centro de acopio sin leer */
    mensajes: number;
    /** Cuántos avisos y mensajes faltan por ver (el mismo número que el menú) */
    nuevos: number;
    destino: (n: Notificacion) => string;
    /** Se tocó un aviso sin ver: se marca como visto */
    onAbrir: (id: number) => void;
    base: string;
}) {
    // Primero lo que no ha visto; luego lo más reciente
    const lista = [...notificaciones.filter((n) => !n.leida), ...notificaciones.filter((n) => n.leida)].slice(0, RENGLONES - (mensajes > 0 ? 1 : 0));

    return (
        <section
            data-recorrido="portal-avisos"
            aria-labelledby="avisos-inicio"
            className={`simar-aparece h-full flex flex-col overflow-hidden ${tarjeta}`}
            style={{ animationDelay: '0.1s' }}
        >
            <div className="flex items-center justify-between gap-3 px-5 sm:px-6 pt-5 pb-2 movil:px-3.5 movil:pt-3.5 movil:pb-1.5">
                <h3 id="avisos-inicio" className="flex items-center gap-2.5 text-[22px] font-extrabold text-simar-texto movil:text-[17px]">
                    Avisos
                    {/* Contador de SiMAR (DISEÑO_SIMAR.md §10.6) */}
                    {nuevos > 0 && (
                        <span className="min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold inline-flex items-center justify-center">
                            {nuevos > 9 ? '9+' : nuevos}
                        </span>
                    )}
                </h3>
            </div>

            {lista.length === 0 && mensajes === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-2 px-6 py-8 text-center text-simar-texto-2">
                    <BellOff className="w-8 h-8 opacity-50" aria-hidden="true" />
                    <p className="text-[17px] font-bold text-simar-texto movil:text-[15px]">Sin avisos todavía</p>
                    <p className="text-base movil:text-[14px]">Aquí te avisaremos cuando el centro de acopio revise tus solicitudes.</p>
                </div>
            ) : (
                <ul className="flex-1 px-2 sm:px-3 pb-2 space-y-1 movil:px-1.5">
                    {mensajes > 0 && (
                        <li>
                            <Link href={`${base}/mensajes`} className={renglon(true)}>
                                <span className="w-11 h-11 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center">
                                    <MessageSquare className="w-5 h-5" aria-hidden="true" />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="flex items-center gap-2">
                                        <span className="text-[17px] font-bold leading-snug text-simar-texto movil:text-[15px]">
                                            {mensajes === 1 ? 'Un mensaje nuevo' : `${mensajes > 9 ? '9+' : mensajes} mensajes nuevos`}
                                        </span>
                                        <Nueva>{mensajes === 1 ? 'Nuevo' : 'Nuevos'}</Nueva>
                                    </span>
                                    <span className="block text-[15px] leading-snug text-simar-texto-2 movil:text-[13px]">Del centro de acopio de {PUERTO_PENASCO.nombre}</span>
                                </span>
                            </Link>
                        </li>
                    )}
                    {lista.map((n) => (
                        <li key={n.id}>
                            {/* Tocar un aviso lo marca como visto y abre su solicitud (o Residuos, si es un residuo nuevo) */}
                            <Link href={destino(n)} onClick={() => !n.leida && onAbrir(n.id)} className={renglon(!n.leida)}>
                                <NotifIcon tipo={n.tipo} />
                                <span className="flex-1 min-w-0">
                                    <span className="flex items-center gap-2">
                                        <span className="text-[17px] font-bold leading-snug text-simar-texto truncate movil:text-[15px]">{n.titulo}</span>
                                        {!n.leida && <Nueva>Nueva</Nueva>}
                                    </span>
                                    <span className="block text-[15px] leading-snug text-simar-texto-2 truncate movil:text-[13px]">
                                        {tiempoRelativo(n.created_at)}
                                        {n.detalle && ` · ${n.detalle}`}
                                    </span>
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>
            )}

            <Link
                href={`${base}/notificaciones`}
                className="flex items-center justify-center gap-1 min-h-[52px] border-t border-simar-borde-suave text-[16px] font-bold text-simar-marea-tinta hover:bg-simar-papel/60 movil:min-h-[44px] movil:text-[14px]"
            >
                Ver todos los avisos
                <ChevronRight aria-hidden="true" className="w-4 h-4" strokeWidth={2.4} />
            </Link>
        </section>
    );
}

export interface DatoResumen {
    etiqueta: string;
    valor: number | string;
    icono: LucideIcon;
    /** Círculo del ícono: 'bg-simar-…-suave text-simar-…' */
    tono: string;
    href: string;
}

/**
 * Los datos de la empresa en una tarjeta: uno por renglón en la columna angosta; a lo ancho (sin
 * recolección agendada) en cuatro columnas. Cada uno lleva a su pantalla.
 */
export function TuResumen({ datos, ancho }: { datos: DatoResumen[]; ancho: boolean }) {
    return (
        <section aria-labelledby="tu-resumen" className={`simar-aparece h-full p-5 sm:p-6 ${tarjeta} movil:p-3.5`} style={{ animationDelay: '0.22s' }}>
            <h3 id="tu-resumen" className="text-[22px] font-extrabold text-simar-texto movil:text-[17px]">
                Tu resumen
            </h3>
            <ul className={`mt-2 grid grid-cols-1 sm:grid-cols-2 gap-x-6 movil:grid-cols-2 movil:gap-x-2 movil:mt-1 ${ancho ? 'xl:grid-cols-4' : 'xl:grid-cols-1'}`}>
                {datos.map((d) => (
                    <li key={d.etiqueta}>
                        <Link href={d.href} className="-mx-2 px-2 flex items-center gap-3.5 min-h-[72px] py-2 rounded-xl transition-colors hover:bg-simar-papel/60 movil:min-h-[60px] movil:gap-2.5 movil:mx-0 movil:px-1">
                            <span className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center movil:w-9 movil:h-9 ${d.tono}`}>
                                <d.icono className="w-[22px] h-[22px] movil:w-[18px] movil:h-[18px]" strokeWidth={2} aria-hidden="true" />
                            </span>
                            <span className="flex-1 min-w-0">
                                <span className="block text-[15px] leading-snug text-simar-texto-2 movil:text-[12.5px]">{d.etiqueta}</span>
                                <span className="block text-[21px] font-extrabold leading-tight text-simar-texto movil:text-[16px]">
                                    {typeof d.valor === 'number' ? <NumeroAnimado valor={d.valor} /> : d.valor}
                                </span>
                            </span>
                            <ChevronRight aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-simar-texto-2 movil:hidden" strokeWidth={2} />
                        </Link>
                    </li>
                ))}
            </ul>
        </section>
    );
}

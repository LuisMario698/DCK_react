'use client';

/**
 * "Lo importante" del Inicio del portal, justo debajo del saludo: lo que la empresa no se debe perder.
 * Con las piezas de SiMAR (DISEÑO_SIMAR.md):
 * - La recolección agendada, como la tarjeta principal del Panel (azul sólido, ícono en círculo
 *   blanco y pastillas): el día en grande, "Ver solicitud" y "Cómo llegar"; las demás agendadas
 *   debajo. Si ya pasó su fecha, una tarjeta blanca con "Ya pasó su fecha" en coral.
 * - Los avisos sin leer que cambian algo (aprobada, completada, rechazada, cancelada), con el formato
 *   de Aviso: fondo suave del tono, ícono del tono, texto oscuro; botón azul y "Entendido".
 * - Los mensajes nuevos (aviso informativo) y lo que espera revisión.
 * Si no hay nada, no se dibuja.
 */
import Link from 'next/link';
import { ArrowRight, Ban, CalendarCheck, CalendarX, CheckCircle2, Clock, MessageSquare, Navigation, Truck, XCircle, type LucideIcon } from 'lucide-react';
import { PUERTO_PENASCO, TIPO_RESIDUO_LABEL, formatCantidad, unidadEscrita } from '@/lib/constants/residuos';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { cantidadVigente } from '@/lib/services/solicitudes';
import { clasePastilla } from '@/components/dashboard/pastilla';
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

const plural = (n: number, uno: string, varios: string) => `${n.toLocaleString('es-MX')} ${n === 1 ? uno : varios}`;

// Botones de SiMAR (DISEÑO_SIMAR.md §10.5): la acción en azul, la otra secundaria con borde de 2 px
const botonPrimario =
    'simar-presiona inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-bold transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]';
const botonSecundario =
    'simar-presiona inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]';

/** Cada aviso con el formato de Aviso: verde lo que salió bien, coral lo que no */
const ESTILO_AVISO: Partial<Record<Notificacion['tipo'], { Icono: LucideIcon; fondo: string; icono: string; ver: string }>> = {
    aprobada: { Icono: CheckCircle2, fondo: 'bg-simar-arrecife-suave', icono: 'text-simar-arrecife-tinta', ver: 'Ver solicitud' },
    completada: { Icono: Truck, fondo: 'bg-simar-arrecife-suave', icono: 'text-simar-arrecife-tinta', ver: 'Ver solicitud' },
    rechazada: { Icono: XCircle, fondo: 'bg-simar-coral-suave', icono: 'text-simar-coral', ver: 'Ver motivo' },
    cancelada: { Icono: Ban, fondo: 'bg-simar-coral-suave', icono: 'text-simar-coral', ver: 'Ver solicitud' },
};

export function avisoImportante(n: Notificacion) {
    return !n.leida && !!ESTILO_AVISO[n.tipo];
}

export function LoImportante({
    proxima,
    otras,
    recienAprobada,
    avisos,
    masAvisos,
    mensajes,
    pendientes,
    hoy,
    base,
    onEntendido,
}: {
    /** La recolección aprobada más cercana */
    proxima: SolicitudConAsociacion | null;
    /** Las demás aprobadas, en orden de fecha */
    otras: SolicitudConAsociacion[];
    /** La próxima se acaba de aprobar (su aviso no se ha leído): lleva "Recién aprobada" */
    recienAprobada: boolean;
    /** Avisos sin leer que cambian algo, con a dónde lleva cada uno */
    avisos: { aviso: Notificacion; href: string }[];
    /** Cuántos avisos más hay además de los que se muestran */
    masAvisos: number;
    mensajes: number;
    pendientes: number;
    hoy: string;
    base: string;
    onEntendido: (id: number) => void;
}) {
    if (!proxima && avisos.length === 0 && mensajes === 0 && pendientes === 0) return null;
    const dias = proxima ? diasHasta(proxima.fecha_propuesta, hoy) : 0;
    const paso = dias < 0;

    return (
        <section aria-label="Lo importante" className="space-y-3 movil:space-y-2.5">
            {/* La recolección agendada, como la tarjeta principal del Panel */}
            {proxima && !paso && (
                <div className="simar-aparece rounded-[28px] bg-simar-marea text-white shadow-simar p-6 md:p-7 movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.04s' }}>
                    <div className="flex flex-col md:flex-row md:items-center gap-5 movil:gap-3.5">
                        <div className="flex items-center gap-5 flex-1 min-w-0 movil:gap-3.5">
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
                        <div className="flex flex-wrap md:flex-col gap-2.5 flex-shrink-0 movil:grid movil:grid-cols-2">
                            <Link
                                href={`${base}/solicitudes?ver=${proxima.id}`}
                                className="simar-presiona min-h-[52px] px-5 rounded-2xl bg-white text-[#1B5FC9] text-[17px] font-bold inline-flex items-center justify-center gap-2 movil:min-h-[46px] movil:px-3 movil:text-[15px]"
                            >
                                Ver solicitud
                            </Link>
                            <a
                                href={COMO_LLEGAR}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="simar-presiona min-h-[52px] px-5 rounded-2xl bg-white/15 hover:bg-white/25 text-white text-[17px] font-bold inline-flex items-center justify-center gap-2 transition-colors movil:min-h-[46px] movil:px-3 movil:text-[15px]"
                            >
                                <Navigation className="w-5 h-5" aria-hidden="true" />
                                Cómo llegar
                            </a>
                        </div>
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
            )}

            {/* Si ya pasó su fecha: tarjeta blanca y "Ya pasó su fecha" escrito en coral */}
            {proxima && paso && (
                <div className="simar-aparece flex flex-wrap items-center gap-x-5 gap-y-3 rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar p-5 movil:p-3.5 movil:gap-x-3" style={{ animationDelay: '0.04s' }}>
                    <span className="w-14 h-14 flex-shrink-0 rounded-full bg-simar-coral-suave text-simar-coral flex items-center justify-center movil:w-11 movil:h-11">
                        <CalendarX className="w-7 h-7 movil:w-[22px] movil:h-[22px]" strokeWidth={2} aria-hidden="true" />
                    </span>
                    <div className="flex-1 min-w-[220px] movil:min-w-0">
                        <p className="text-[15px] font-bold text-simar-coral movil:text-[13px]">Ya pasó su fecha</p>
                        <p className="text-[21px] font-extrabold leading-snug text-simar-texto movil:text-[16px]">Tu recolección del {diaLargo(proxima.fecha_propuesta).toLowerCase()}</p>
                        <p className="text-[17px] text-simar-texto-2 movil:text-[13.5px]">{cantidadDe(proxima)}. Aún no se registra: escribe al centro de acopio para acordar otro día.</p>
                    </div>
                    <div className="flex gap-2.5 movil:basis-full movil:grid movil:grid-cols-2">
                        <Link href={`${base}/mensajes`} className={botonPrimario}>
                            <MessageSquare className="w-5 h-5" aria-hidden="true" />
                            Escribir
                        </Link>
                        <Link href={`${base}/solicitudes?ver=${proxima.id}`} className={botonSecundario}>
                            Ver solicitud
                        </Link>
                    </div>
                </div>
            )}

            {/* Avisos sin leer, con el formato de Aviso (fondo suave del tono, ícono del tono, texto oscuro) */}
            {avisos.map(({ aviso: n, href }, i) => {
                const e = ESTILO_AVISO[n.tipo]!;
                return (
                    <div
                        key={n.id}
                        className={`simar-aparece flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-5 text-simar-texto ${e.fondo} movil:p-3.5 movil:gap-x-2.5`}
                        style={{ animationDelay: `${0.08 + i * 0.04}s` }}
                    >
                        <div className="flex items-start gap-3.5 flex-1 min-w-[240px] movil:min-w-0 movil:gap-2.5">
                            <e.Icono className={`w-6 h-6 flex-shrink-0 mt-0.5 ${e.icono}`} strokeWidth={2} aria-hidden="true" />
                            <div className="min-w-0">
                                <p className="text-lg font-bold leading-snug movil:text-[15px]">{n.titulo}</p>
                                {n.detalle && <p className="text-base text-simar-texto-2 mt-0.5 movil:text-[14px] movil:leading-snug">{n.detalle}</p>}
                            </div>
                        </div>
                        <div className="flex gap-2.5 movil:basis-full movil:grid movil:grid-cols-2">
                            <Link href={href} className={botonPrimario}>
                                {e.ver}
                            </Link>
                            <button type="button" onClick={() => onEntendido(n.id)} className={botonSecundario}>
                                Entendido
                            </button>
                        </div>
                    </div>
                );
            })}
            {masAvisos > 0 && (
                <Link href={`${base}/notificaciones`} className="inline-flex min-h-[44px] items-center gap-1 px-1 text-[16px] font-bold text-simar-marea-tinta hover:underline movil:text-[14px]">
                    Y {plural(masAvisos, 'aviso más', 'avisos más')} en Notificaciones <ArrowRight className="w-4 h-4" />
                </Link>
            )}

            {/* Mensajes nuevos: aviso informativo con el contador de SiMAR */}
            {mensajes > 0 && (
                <div className="simar-aparece flex flex-wrap items-center gap-x-4 gap-y-3 rounded-2xl p-5 bg-simar-marea-suave text-simar-texto movil:p-3.5 movil:gap-x-2.5" style={{ animationDelay: '0.12s' }}>
                    <div className="flex items-start gap-3.5 flex-1 min-w-[240px] movil:min-w-0 movil:gap-2.5">
                        <MessageSquare className="w-6 h-6 flex-shrink-0 mt-0.5 text-simar-marea-tinta" strokeWidth={2} aria-hidden="true" />
                        <div className="min-w-0">
                            <p className="flex items-center gap-2 text-lg font-bold leading-snug movil:text-[15px]">
                                {mensajes === 1 ? 'Tienes un mensaje nuevo' : 'Tienes mensajes nuevos'}
                                <span className="min-w-[26px] h-[26px] px-1.5 rounded-full bg-[#A63F0E] text-white text-[13px] font-bold inline-flex items-center justify-center">
                                    {mensajes > 9 ? '9+' : mensajes}
                                </span>
                            </p>
                            <p className="text-base text-simar-texto-2 mt-0.5 movil:text-[14px]">Del centro de acopio de {PUERTO_PENASCO.nombre}</p>
                        </div>
                    </div>
                    <Link href={`${base}/mensajes`} className={`${botonPrimario} movil:basis-full`}>
                        Abrir mensajes
                    </Link>
                </div>
            )}

            {/* Lo que espera revisión */}
            {pendientes > 0 && (
                <Link
                    href={`${base}/solicitudes`}
                    className="flex items-center gap-3 rounded-2xl bg-simar-superficie border border-simar-borde shadow-simar px-5 py-3.5 text-[17px] text-simar-texto hover:border-simar-marea-tinta transition-colors movil:text-[14px] movil:px-3.5 movil:py-2.5"
                >
                    <Clock className="w-5 h-5 flex-shrink-0 text-simar-marea-tinta" aria-hidden="true" />
                    <span className="flex-1">
                        <strong>{plural(pendientes, 'solicitud', 'solicitudes')}</strong> esperando que el centro de acopio {pendientes === 1 ? 'la revise' : 'las revise'}
                    </span>
                    <ArrowRight className="w-4 h-4 flex-shrink-0 text-simar-marea-tinta" aria-hidden="true" />
                </Link>
            )}
        </section>
    );
}

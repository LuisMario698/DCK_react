'use client';

/**
 * La suscripción de la empresa, vista desde el portal. Antes la empresa sólo se enteraba cuando ya
 * estaba bloqueada; ahora:
 * - `TarjetaSuscripcion` (Perfil): plan, estado y cuándo vence, con qué hacer para renovarla;
 * - `AvisoVencimiento` (arriba de cada pantalla): una semana antes de que venza.
 * El cobro es manual (lo registra el equipo de SiMAR desde el panel de superadmin).
 */
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { CalendarClock, CreditCard } from 'lucide-react';
import { ESTADO_SUSCRIPCION_LABEL, diasHasta, estadoEfectivo, type EstadoSuscripcion } from '@/lib/constants/suscripciones';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { useRecolector } from './RecolectorContext';

const AVISAR_DIAS_ANTES = 7;

const TONO_ESTADO: Record<EstadoSuscripcion, string> = {
    activa: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
    prueba: 'bg-simar-marea-suave text-simar-marea-tinta',
    vencida: 'bg-simar-coral-suave text-simar-coral',
    suspendida: 'bg-simar-coral-suave text-simar-coral',
    cancelada: 'bg-simar-papel text-simar-texto-2',
};

/** "jueves 9 de octubre de 2026" */
const fechaLarga = (f: string) =>
    parseFechaLocal(f).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).replace(',', '');

/** "hoy", "mañana", "en 5 días", "hace 3 días" */
function cuando(dias: number) {
    if (dias === 0) return 'hoy';
    if (dias === 1) return 'mañana';
    if (dias > 1) return `en ${dias} días`;
    if (dias === -1) return 'ayer';
    return `hace ${-dias} días`;
}

export function TarjetaSuscripcion() {
    const { suscripcion } = useRecolector();
    // Sin datos (no es recolector o falta la migración) o sin nada que decir
    if (!suscripcion || (!suscripcion.estado && !suscripcion.obligatoria)) return null;

    const estado = suscripcion.estado ? estadoEfectivo(suscripcion.estado, suscripcion.vence_el) : null;
    const dias = suscripcion.vence_el ? diasHasta(suscripcion.vence_el) : null;
    const pronto = suscripcion.vigente && dias !== null && dias >= 0 && dias <= AVISAR_DIAS_ANTES;

    let nota: string;
    if (!suscripcion.obligatoria) nota = 'Por ahora SiMAR no pide suscripción para enviar solicitudes.';
    else if (!suscripcion.vigente) nota = 'Mientras no esté vigente puedes ver tu historial y escribir al centro de acopio, pero no enviar solicitudes nuevas. Para renovarla, comunícate con el equipo de SiMAR.';
    else if (pronto) nota = 'Vence pronto. Para renovarla, comunícate con el equipo de SiMAR: ellos registran tu pago.';
    else nota = 'Todo en orden. Te avisaremos una semana antes de que venza.';

    return (
        <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] p-6 md:p-7 shadow-simar movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.03s' }}>
            <div className="flex flex-wrap items-center justify-between gap-2 mb-4 movil:mb-3">
                <h3 className="flex items-center gap-2.5 text-[21px] font-extrabold text-simar-texto movil:text-[17px]">
                    <CreditCard className="w-6 h-6 text-simar-marea-tinta movil:w-5 movil:h-5" />
                    Tu suscripción
                </h3>
                {estado && <span className={`px-3 py-1 rounded-full text-[15px] font-bold movil:text-[13px] ${TONO_ESTADO[estado]}`}>{ESTADO_SUSCRIPCION_LABEL[estado]}</span>}
            </div>
            <dl className="space-y-3 movil:space-y-2">
                <div>
                    <dt className="text-[15px] font-bold text-simar-texto-2 movil:text-[13px]">Plan</dt>
                    <dd className="text-[19px] font-extrabold text-simar-texto movil:text-[16px]">{suscripcion.plan ?? (suscripcion.estado ? 'Sin plan asignado' : 'Sin suscripción')}</dd>
                </div>
                {suscripcion.vence_el && dias !== null && (
                    <div>
                        <dt className="text-[15px] font-bold text-simar-texto-2 movil:text-[13px]">{dias < 0 ? 'Venció' : 'Vence'}</dt>
                        <dd className={`text-[17px] font-bold movil:text-[15px] ${pronto || dias < 0 ? 'text-simar-coral' : 'text-simar-texto'}`}>
                            {fechaLarga(suscripcion.vence_el)} · {cuando(dias)}
                        </dd>
                    </div>
                )}
            </dl>
            <p className="mt-4 text-base leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[14px]">{nota}</p>
        </div>
    );
}

/** Una semana antes de que venza, arriba de cada pantalla del portal */
export function AvisoVencimiento() {
    const { suscripcion, bloqueada } = useRecolector();
    const locale = usePathname().split('/')[1] || 'es';
    // Si ya está bloqueada, el aviso de bloqueo (AvisoEstado) dice lo que pasa
    if (!suscripcion?.vigente || !suscripcion.vence_el || bloqueada) return null;
    const dias = diasHasta(suscripcion.vence_el);
    if (dias < 0 || dias > AVISAR_DIAS_ANTES) return null;

    return (
        <div className="mb-5 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-2xl bg-simar-coral-suave px-5 py-4 text-base text-simar-texto movil:mb-3 movil:px-3.5 movil:py-2.5 movil:gap-x-2.5 movil:text-[14px] movil:leading-snug">
            <CalendarClock className="w-6 h-6 flex-shrink-0 text-simar-coral movil:w-5 movil:h-5 movil:self-start movil:mt-0.5" />
            <p className="flex-1 min-w-[220px] movil:min-w-0">
                La suscripción de tu empresa vence <strong>{dias <= 1 ? cuando(dias) : `el ${fechaLarga(suscripcion.vence_el)}`}</strong>
                {dias > 1 && ` (${cuando(dias)})`}. Para renovarla, comunícate con el equipo de SiMAR.
            </p>
            <Link href={`/${locale}/dashboard-recolector/perfil`} className="min-h-[44px] inline-flex items-center font-bold text-simar-coral underline-offset-4 hover:underline movil:basis-full movil:min-h-[36px] movil:pl-[30px]">
                Ver detalles
            </Link>
        </div>
    );
}

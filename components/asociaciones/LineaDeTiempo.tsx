import { Check, X } from 'lucide-react';
import { formatCantidad, unidadEscrita } from '@/lib/constants/residuos';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { cantidadVigente } from '@/lib/services/solicitudes';
import type { SolicitudConAsociacion } from '@/types/database';

type EstadoPaso = 'hecho' | 'actual' | 'pendiente' | 'rechazado' | 'cancelado';

interface Paso {
    titulo: string;
    detalle?: string;
    cuando?: string;
    estado: EstadoPaso;
}

/** "12 sep 2026, 10:30" */
const fechaHora = (t: string) =>
    new Date(t).toLocaleString('es-MX', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
/** "Jueves 3 de octubre" */
const diaLargo = (f: string) => {
    const t = parseFechaLocal(f).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long' }).replace(',', '');
    return t.charAt(0).toUpperCase() + t.slice(1);
};

/**
 * Los pasos de una solicitud: Enviada → Aprobada → Recolectada (o Rechazada / Cancelada). Lo hecho
 * lleva palomita verde, lo que sigue un anillo azul y lo que falta un círculo vacío; el texto siempre
 * dice el estado (el color nunca va solo). La base guarda la hora de envío, la del último cambio
 * (`resuelta_at`) y la fecha de la recolección: una solicitud aprobada y luego completada ya no
 * guarda la hora en que se aprobó, así que ese paso va sin hora.
 */
function pasosDe(s: SolicitudConAsociacion, para: 'empresa' | 'recinto'): Paso[] {
    const u = (n: number) => `${formatCantidad(n)} ${unidadEscrita(s.unidad, n)}`;
    const enviada: Paso = { titulo: 'Enviada', detalle: `${u(s.cantidad_solicitada)} solicitados`, cuando: fechaHora(s.created_at), estado: 'hecho' };
    const aprobado = s.cantidad_aprobada ?? s.cantidad_solicitada;

    switch (s.estado) {
        case 'pendiente':
            return [
                enviada,
                { titulo: 'En revisión', detalle: para === 'empresa' ? 'El centro de acopio la revisará y te avisará.' : 'Falta aprobarla o rechazarla.', estado: 'actual' },
                { titulo: 'Recolección', detalle: `Fecha propuesta: ${diaLargo(s.fecha_propuesta)}`, estado: 'pendiente' },
            ];
        case 'aprobada':
            return [
                enviada,
                { titulo: 'Aprobada', detalle: `${u(aprobado)} aprobados`, cuando: s.resuelta_at ? fechaHora(s.resuelta_at) : undefined, estado: 'hecho' },
                { titulo: 'Recolección', detalle: diaLargo(s.fecha_propuesta), estado: 'actual' },
            ];
        case 'completada':
            return [
                enviada,
                { titulo: 'Aprobada', detalle: `${u(aprobado)} aprobados`, estado: 'hecho' },
                {
                    titulo: 'Recolectada',
                    detalle: `${u(cantidadVigente(s))}${s.recoleccion ? ` · folio ${s.recoleccion.folio}` : ''}`,
                    cuando: s.recoleccion?.fecha ? diaLargo(s.recoleccion.fecha) : s.resuelta_at ? fechaHora(s.resuelta_at) : undefined,
                    estado: 'hecho',
                },
            ];
        case 'rechazada':
            return [
                enviada,
                { titulo: 'Rechazada', detalle: s.motivo_rechazo ?? undefined, cuando: s.resuelta_at ? fechaHora(s.resuelta_at) : undefined, estado: 'rechazado' },
            ];
        case 'cancelada':
            return [enviada, { titulo: 'Cancelada', cuando: fechaHora(s.resuelta_at ?? s.updated_at), estado: 'cancelado' }];
    }
}

const CIRCULO: Record<EstadoPaso, string> = {
    hecho: 'bg-simar-arrecife text-white',
    actual: 'bg-simar-superficie border-[3px] border-simar-marea-tinta',
    pendiente: 'bg-simar-superficie border-2 border-simar-campo-borde',
    rechazado: 'bg-[#A63F0E] text-white',
    cancelado: 'bg-simar-campo-borde text-white',
};

/** `para`: quién la lee (cambia el texto de "En revisión") */
export function LineaDeTiempo({ solicitud, para = 'empresa' }: { solicitud: SolicitudConAsociacion; para?: 'empresa' | 'recinto' }) {
    const pasos = pasosDe(solicitud, para);
    return (
        <ol className="space-y-0" aria-label="Seguimiento de la solicitud">
            {pasos.map((p, i) => {
                const ultimo = i === pasos.length - 1;
                return (
                    <li key={p.titulo} className="relative flex gap-3.5 pb-4 last:pb-0">
                        {/* La línea que une los pasos: verde hasta donde ya se avanzó */}
                        {!ultimo && (
                            <span
                                aria-hidden="true"
                                className={`absolute left-[13px] top-[30px] bottom-0 w-[3px] rounded-full ${p.estado === 'hecho' ? 'bg-simar-arrecife' : 'bg-simar-borde'}`}
                            />
                        )}
                        <span className={`relative z-[1] mt-0.5 w-[29px] h-[29px] flex-shrink-0 rounded-full flex items-center justify-center ${CIRCULO[p.estado]}`}>
                            {p.estado === 'hecho' && <Check className="w-4 h-4" strokeWidth={3} />}
                            {(p.estado === 'rechazado' || p.estado === 'cancelado') && <X className="w-4 h-4" strokeWidth={3} />}
                            {p.estado === 'actual' && <span className="w-2.5 h-2.5 rounded-full bg-simar-marea-tinta" />}
                        </span>
                        <div className="min-w-0 flex-1">
                            <p className={`text-[17px] font-bold leading-snug ${p.estado === 'pendiente' ? 'text-simar-texto-2' : p.estado === 'rechazado' ? 'text-simar-coral' : 'text-simar-texto'}`}>
                                {p.titulo}
                                {p.estado === 'actual' && <span className="ml-2 text-[15px] font-bold text-simar-marea-tinta">· Ahora</span>}
                            </p>
                            {p.detalle && <p className="text-[15px] leading-snug text-simar-texto-2 mt-0.5 whitespace-pre-wrap">{p.detalle}</p>}
                            {p.cuando && <p className="text-[15px] text-simar-texto-2 mt-0.5">{p.cuando}</p>}
                        </div>
                    </li>
                );
            })}
        </ol>
    );
}

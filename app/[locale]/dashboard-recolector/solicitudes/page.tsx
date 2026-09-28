'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Ban, Plus, Inbox, FileText } from 'lucide-react';
import { PUERTO_PENASCO, formatCantidad, type EstadoSolicitud } from '@/lib/constants/residuos';
import { formatearFecha } from '@/lib/utils/fechas';
import { SolicitudConAsociacion } from '@/types/database';
import { cancelarSolicitud, cantidadVigente, getSolicitudes } from '@/lib/services/solicitudes';
import { suscribirCambios } from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import {
    BotonSecundario,
    Cargando,
    ErrorCarga,
    EstadoSolicitudBadge,
    Modal,
    ResiduoBadge,
    mensajeError,
} from '@/components/asociaciones/ui';
import { Aviso, EstadoVacio, claseChip } from '@/components/ui/simar';

type Filtro = EstadoSolicitud | 'todas';

const TABS: { value: Filtro; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'completada', label: 'Completadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'cancelada', label: 'Canceladas' },
];

export default function SolicitudesPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const [solicitudes, setSolicitudes] = useState<SolicitudConAsociacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Filtro>('todas');
    const [detalle, setDetalle] = useState<SolicitudConAsociacion | null>(null);
    const asociacionId = useRecolector().asociacion?.id;

    const cargar = useCallback(async () => {
        if (!asociacionId) return;
        try {
            setSolicitudes(await getSolicitudes({ asociacionId }));
            setError(null);
        } catch (err) {
            setError(mensajeError(err, 'No se pudieron cargar tus solicitudes.'));
        } finally {
            setCargando(false);
        }
    }, [asociacionId]);

    useEffect(() => {
        cargar();
        // Los cambios de estado que haga el centro de acopio llegan en vivo
        return suscribirCambios('solicitudes_recoleccion', cargar);
    }, [cargar]);

    const cancelar = async (s: SolicitudConAsociacion) => {
        if (!confirm('¿Cancelar esta solicitud?')) return;
        try {
            await cancelarSolicitud(s.id);
            toast.success('Solicitud cancelada');
            setDetalle(null);
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const filtradas = tab === 'todas' ? solicitudes : solicitudes.filter((s) => s.estado === tab);

    if (cargando) return <Cargando texto="Cargando solicitudes…" />;

    return (
        <div className="space-y-6">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar overflow-hidden">
                {/* Filtros (fichas de 48 px con su conteo) y la acción principal en la misma franja */}
                <div className="px-4 sm:px-6 py-5 border-b border-simar-borde flex flex-col xl:flex-row xl:items-center gap-4">
                    <nav aria-label="Filtrar solicitudes por estado" className="flex flex-wrap gap-2.5 flex-1">
                        {TABS.map((t) => {
                            const count =
                                t.value === 'todas'
                                    ? solicitudes.length
                                    : solicitudes.filter((s) => s.estado === t.value).length;
                            const active = tab === t.value;
                            return (
                                <button
                                    key={t.value}
                                    onClick={() => setTab(t.value)}
                                    aria-pressed={active}
                                    className={`${claseChip(active)} inline-flex items-center gap-2 whitespace-nowrap`}
                                >
                                    {t.label}
                                    <span
                                        className={`min-w-[26px] h-[26px] px-1.5 rounded-full inline-flex items-center justify-center text-[15px] font-bold ${
                                            active ? 'bg-white/25 text-white' : 'bg-simar-papel text-simar-texto-2'
                                        }`}
                                    >
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                    <Link
                        href={`/${locale}/dashboard-recolector/mapa`}
                        className="simar-presiona flex-shrink-0 min-h-[56px] px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold inline-flex items-center justify-center gap-2"
                    >
                        <Plus className="w-[22px] h-[22px]" strokeWidth={2.4} />
                        Nueva solicitud
                    </Link>
                </div>

                {/* Tabla. En celular, cantidad, fecha y estado van debajo del residuo (no se corta a la derecha) */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-simar-borde-suave">
                        <thead className="bg-simar-papel">
                            <tr>
                                <Th>Residuo</Th>
                                <Th className="hidden sm:table-cell">Cantidad</Th>
                                <Th className="hidden md:table-cell">Recolección</Th>
                                <Th className="hidden lg:table-cell">Enviada</Th>
                                <Th className="hidden sm:table-cell">Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-simar-borde-suave bg-simar-superficie">
                            {filtradas.map((s) => (
                                <tr key={s.id} className="hover:bg-simar-papel transition-colors">
                                    <td className="px-4 sm:px-6 py-4">
                                        <ResiduoBadge tipo={s.tipo} />
                                        <div className="sm:hidden mt-2 space-y-1.5">
                                            <p className="text-[17px] font-bold text-simar-texto">
                                                {formatCantidad(cantidadVigente(s))} {s.unidad}
                                                <span className="font-normal text-simar-texto-2"> · {formatearFecha(s.fecha_propuesta)}</span>
                                            </p>
                                            {s.recoleccion ? (
                                                <p className="text-[15px] text-simar-texto-2">recolectados</p>
                                            ) : (
                                                s.cantidad_aprobada !== null &&
                                                s.cantidad_aprobada !== s.cantidad_solicitada && (
                                                    <p className="text-[15px] text-simar-texto-2">
                                                        de {formatCantidad(s.cantidad_solicitada)} solicitados
                                                    </p>
                                                )
                                            )}
                                            <EstadoSolicitudBadge estado={s.estado} />
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-[17px] font-bold text-simar-texto whitespace-nowrap">
                                        {formatCantidad(cantidadVigente(s))} {s.unidad}
                                        {s.recoleccion ? (
                                            <span className="block text-[15px] font-normal text-simar-texto-2">recolectados</span>
                                        ) : (
                                            s.cantidad_aprobada !== null &&
                                            s.cantidad_aprobada !== s.cantidad_solicitada && (
                                                <span className="block text-[15px] font-normal text-simar-texto-2">
                                                    de {formatCantidad(s.cantidad_solicitada)} solicitados
                                                </span>
                                            )
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-base text-simar-texto hidden md:table-cell whitespace-nowrap">
                                        {formatearFecha(s.fecha_propuesta)}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-base text-simar-texto-2 hidden lg:table-cell whitespace-nowrap">
                                        {formatearFecha(s.created_at)}
                                    </td>
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4">
                                        <EstadoSolicitudBadge estado={s.estado} />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                                        <button
                                            onClick={() => setDetalle(s)}
                                            className="simar-presiona min-h-[44px] px-3.5 rounded-xl text-[15px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta inline-flex items-center justify-center gap-1.5"
                                            title="Ver detalle"
                                            aria-label="Ver detalle"
                                        >
                                            <Eye className="w-[18px] h-[18px]" />
                                            Ver
                                        </button>
                                        {s.estado === 'pendiente' && (
                                            <button
                                                onClick={() => cancelar(s)}
                                                className="simar-presiona min-h-[44px] px-3.5 rounded-xl text-[15px] font-bold bg-simar-coral-suave text-simar-coral hover:bg-[#A63F0E] hover:text-white inline-flex items-center justify-center gap-1.5"
                                                title="Cancelar solicitud"
                                                aria-label="Cancelar solicitud"
                                            >
                                                <Ban className="w-[18px] h-[18px]" />
                                                Cancelar
                                            </button>
                                        )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                            {filtradas.length === 0 && (
                                <tr>
                                    <td colSpan={6}>
                                        <EstadoVacio icono={Inbox} titulo={solicitudes.length === 0 ? 'Aún no hay solicitudes' : 'Nada en esta categoría'}>
                                            {solicitudes.length === 0
                                                ? 'Aún no has enviado solicitudes. Revisa los residuos disponibles para crear la primera.'
                                                : 'No hay solicitudes en esta categoría.'}
                                        </EstadoVacio>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {detalle && (
                <Modal titulo={`Solicitud #${detalle.id}`} subtitulo={PUERTO_PENASCO.nombre} onClose={() => setDetalle(null)}>
                    <div className="space-y-4">
                        <div className="flex flex-wrap items-center gap-2">
                            <EstadoSolicitudBadge estado={detalle.estado} />
                            <ResiduoBadge tipo={detalle.tipo} />
                        </div>
                        <dl className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                            <Dato label="Solicitado" valor={`${formatCantidad(detalle.cantidad_solicitada)} ${detalle.unidad}`} />
                            <Dato
                                label="Aprobado"
                                valor={detalle.cantidad_aprobada !== null ? `${formatCantidad(detalle.cantidad_aprobada)} ${detalle.unidad}` : '—'}
                            />
                            {detalle.recoleccion && (
                                <Dato
                                    label={`Recolectado · ${detalle.recoleccion.folio}`}
                                    valor={`${formatCantidad(detalle.recoleccion.cantidad)} ${detalle.unidad}`}
                                />
                            )}
                            <Dato label="Fecha propuesta" valor={formatearFecha(detalle.fecha_propuesta)} />
                            <Dato label="Enviada" valor={formatearFecha(detalle.created_at)} />
                        </dl>
                        {detalle.mensaje && <Nota titulo="Tu mensaje">{detalle.mensaje}</Nota>}
                        {detalle.motivo_rechazo && <Nota titulo="Motivo del rechazo">{detalle.motivo_rechazo}</Nota>}
                        {detalle.estado === 'aprobada' && (
                            <Aviso titulo="Tu recolección está aprobada">
                                Preséntate en el centro de acopio en la fecha acordada. Al recoger, el personal registrará
                                la cantidad real y tu comprobante aparecerá en el historial.
                            </Aviso>
                        )}
                        {detalle.estado === 'completada' && (
                            <Link
                                href={`/${locale}/dashboard-recolector/historial`}
                                className="simar-presiona w-full min-h-[52px] px-5 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta inline-flex items-center justify-center gap-2"
                            >
                                <FileText className="w-[22px] h-[22px] text-simar-marea-tinta" />
                                Ver comprobante en el historial
                            </Link>
                        )}
                        {detalle.estado === 'pendiente' && (
                            <BotonSecundario onClick={() => cancelar(detalle)} className="w-full !border-transparent !bg-simar-coral-suave !text-simar-coral">
                                <Ban className="w-5 h-5" /> Cancelar solicitud
                            </BotonSecundario>
                        )}
                    </div>
                </Modal>
            )}
        </div>
    );
}

function Dato({ label, valor }: { label: string; valor: string }) {
    return (
        <div className="rounded-2xl bg-simar-papel px-4 py-3.5">
            <dt className="text-[15px] font-bold text-simar-texto-2">{label}</dt>
            <dd className="mt-0.5 text-[20px] font-extrabold leading-tight text-simar-texto">{valor}</dd>
        </div>
    );
}

function Nota({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="rounded-2xl bg-simar-papel border border-simar-borde p-4">
            <p className="text-[15px] font-bold text-simar-texto-2 mb-1.5">{titulo}</p>
            <p className="text-[17px] text-simar-texto leading-relaxed whitespace-pre-wrap">{children}</p>
        </div>
    );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={`px-4 sm:px-6 py-3.5 text-left text-[15px] font-bold text-simar-texto-2 ${className}`}>
            {children}
        </th>
    );
}

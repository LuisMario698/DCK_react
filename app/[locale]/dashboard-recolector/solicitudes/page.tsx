'use client';

import { useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { Eye, Ban, Plus, Inbox } from 'lucide-react';
import { PUERTO_PENASCO, formatCantidad, type EstadoSolicitud } from '@/lib/constants/residuos';
import { formatearFecha } from '@/lib/utils/fechas';
import { SolicitudConAsociacion } from '@/types/database';
import { cancelarSolicitud, cantidadVigente, getSolicitudes } from '@/lib/services/solicitudes';
import { suscribirCambios } from '@/lib/services/notificaciones';
import {
    BotonSecundario,
    Cargando,
    ErrorCarga,
    EstadoSolicitudBadge,
    Modal,
    ResiduoBadge,
    mensajeError,
} from '@/components/asociaciones/ui';

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

    const cargar = useCallback(async () => {
        try {
            setSolicitudes(await getSolicitudes());
            setError(null);
        } catch (err) {
            setError(mensajeError(err, 'No se pudieron cargar tus solicitudes.'));
        } finally {
            setCargando(false);
        }
    }, []);

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

            <div className="flex justify-end">
                <Link
                    href={`/${locale}/dashboard-recolector/mapa`}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                    <Plus className="w-4 h-4" />
                    Nueva solicitud
                </Link>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6">
                    <nav className="flex gap-1 sm:gap-4 overflow-x-auto -mb-px">
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
                                    className={`whitespace-nowrap py-3 px-3 text-sm font-semibold border-b-2 transition-colors ${
                                        active
                                            ? 'border-emerald-600 text-emerald-600 dark:text-emerald-400 dark:border-emerald-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200'
                                    }`}
                                >
                                    {t.label}
                                    <span className={`ml-2 text-xs px-1.5 py-0.5 rounded-full ${active ? 'bg-emerald-100 dark:bg-emerald-900/30' : 'bg-gray-100 dark:bg-gray-800'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <Th>Residuo</Th>
                                <Th>Cantidad</Th>
                                <Th className="hidden sm:table-cell">Recolección</Th>
                                <Th className="hidden md:table-cell">Enviada</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {filtradas.map((s) => (
                                <tr key={s.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4">
                                        <ResiduoBadge tipo={s.tipo} />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                        {formatCantidad(cantidadVigente(s))} {s.unidad}
                                        {s.recoleccion ? (
                                            <span className="block text-[11px] font-normal text-gray-400">recolectados</span>
                                        ) : (
                                            s.cantidad_aprobada !== null &&
                                            s.cantidad_aprobada !== s.cantidad_solicitada && (
                                                <span className="block text-[11px] font-normal text-gray-400">
                                                    de {formatCantidad(s.cantidad_solicitada)} solicitados
                                                </span>
                                            )
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 hidden sm:table-cell whitespace-nowrap">
                                        {formatearFecha(s.fecha_propuesta)}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                        {formatearFecha(s.created_at)}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4">
                                        <EstadoSolicitudBadge estado={s.estado} />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right whitespace-nowrap">
                                        <button
                                            onClick={() => setDetalle(s)}
                                            className="p-1.5 rounded-md text-gray-400 hover:text-emerald-600 hover:bg-emerald-50 dark:hover:bg-emerald-900/20 transition-colors"
                                            title="Ver detalle"
                                            aria-label="Ver detalle"
                                        >
                                            <Eye className="w-4 h-4" />
                                        </button>
                                        {s.estado === 'pendiente' && (
                                            <button
                                                onClick={() => cancelar(s)}
                                                className="p-1.5 rounded-md text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                                                title="Cancelar solicitud"
                                                aria-label="Cancelar solicitud"
                                            >
                                                <Ban className="w-4 h-4" />
                                            </button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                            {filtradas.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        <Inbox className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        {solicitudes.length === 0
                                            ? 'Aún no has enviado solicitudes. Revisa los residuos disponibles para crear la primera.'
                                            : 'No hay solicitudes en esta categoría.'}
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
                        <dl className="grid grid-cols-2 gap-3 text-sm">
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
                            <p className="text-sm text-emerald-700 dark:text-emerald-400">
                                Preséntate en el centro de acopio en la fecha acordada. Al recoger, el personal registrará
                                la cantidad real y tu comprobante aparecerá en el historial.
                            </p>
                        )}
                        {detalle.estado === 'completada' && (
                            <Link
                                href={`/${locale}/dashboard-recolector/historial`}
                                className="inline-block text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                            >
                                Ver comprobante en el historial →
                            </Link>
                        )}
                        {detalle.estado === 'pendiente' && (
                            <BotonSecundario onClick={() => cancelar(detalle)} className="w-full !text-red-600 dark:!text-red-400">
                                <Ban className="w-4 h-4" /> Cancelar solicitud
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
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 p-3">
            <dt className="text-[10px] font-semibold text-gray-400 uppercase tracking-widest">{label}</dt>
            <dd className="mt-1 font-semibold text-gray-900 dark:text-white">{valor}</dd>
        </div>
    );
}

function Nota({ titulo, children }: { titulo: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-3.5">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">{titulo}</p>
            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{children}</p>
        </div>
    );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
            {children}
        </th>
    );
}

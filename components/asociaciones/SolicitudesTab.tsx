'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { CheckCircle2, XCircle, Truck, Eye, MessageSquare, Inbox, Ban, FileDown, Loader2 } from 'lucide-react';
import { formatCantidad, type EstadoSolicitud } from '@/lib/constants/residuos';
import { formatearFecha } from '@/lib/utils/fechas';
import { InventarioResiduo, SolicitudConAsociacion } from '@/types/database';
import {
    aprobarSolicitud,
    cancelarSolicitud,
    completarSolicitud,
    getSolicitudes,
    rechazarSolicitud,
} from '@/lib/services/solicitudes';
import { getInventario } from '@/lib/services/inventario';
import { abrirComprobante, getRecoleccionPorSolicitud, subirComprobante } from '@/lib/services/recolecciones';
import { suscribirCambios } from '@/lib/services/notificaciones';
import { generarPDFRecoleccion } from '@/lib/utils/pdfGeneratorRecoleccion';
import { useAuth } from '@/components/layout/AuthProvider';
import SignaturePad, { SignaturePadRef } from '@/components/ui/SignaturePad';
import {
    BotonPrimario,
    BotonSecundario,
    Campo,
    Cargando,
    ErrorCarga,
    EstadoSolicitudBadge,
    Modal,
    ResiduoBadge,
    inputCls,
    mensajeError,
} from './ui';

type Filtro = EstadoSolicitud | 'todas';

const TABS: { value: Filtro; label: string }[] = [
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Por recolectar' },
    { value: 'completada', label: 'Completadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'cancelada', label: 'Canceladas' },
    { value: 'todas', label: 'Todas' },
];

type Accion = { tipo: 'detalle' | 'aprobar' | 'rechazar' | 'completar'; solicitud: SolicitudConAsociacion };

export function SolicitudesTab({
    onAbrirChat,
    onCambio,
}: {
    onAbrirChat?: (asociacionId: number) => void;
    onCambio?: () => void;
}) {
    const [solicitudes, setSolicitudes] = useState<SolicitudConAsociacion[]>([]);
    const [inventario, setInventario] = useState<InventarioResiduo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Filtro>('pendiente');
    const [accion, setAccion] = useState<Accion | null>(null);
    const [descargando, setDescargando] = useState<number | null>(null);

    const cargar = useCallback(async () => {
        try {
            const [sol, inv] = await Promise.all([getSolicitudes(), getInventario()]);
            setSolicitudes(sol);
            setInventario(inv);
            setError(null);
        } catch (err) {
            setError(mensajeError(err, 'No se pudieron cargar las solicitudes.'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        return suscribirCambios('solicitudes_recoleccion', cargar);
    }, [cargar]);

    const trasCambio = async () => {
        setAccion(null);
        await cargar();
        onCambio?.();
    };

    const filtradas = tab === 'todas' ? solicitudes : solicitudes.filter((s) => s.estado === tab);
    const disponibleDe = (s: SolicitudConAsociacion) => inventario.find((i) => i.tipo === s.tipo)?.cantidad ?? 0;

    const cancelar = async (s: SolicitudConAsociacion) => {
        const aviso =
            s.estado === 'aprobada'
                ? `¿Cancelar la solicitud? Los ${formatCantidad(s.cantidad_aprobada ?? 0)} ${s.unidad} aprobados regresarán al inventario.`
                : '¿Cancelar esta solicitud?';
        if (!confirm(aviso)) return;
        try {
            await cancelarSolicitud(s.id);
            toast.success('Solicitud cancelada');
            await trasCambio();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const descargarComprobante = async (s: SolicitudConAsociacion) => {
        setDescargando(s.id);
        try {
            const rec = await getRecoleccionPorSolicitud(s.id);
            if (!rec) throw new Error('No se encontró la recolección de esta solicitud.');
            let ruta = rec.comprobante_pdf_path;
            if (!ruta) {
                // El comprobante no se subió al completar (p. ej. falló la red): se regenera sin firmas
                const pdf = await generarPDFRecoleccion({ recoleccion: rec, asociacion: rec.asociacion, solicitud: s });
                ruta = await subirComprobante(rec, pdf);
            }
            await abrirComprobante(ruta);
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudo abrir el comprobante.'));
        } finally {
            setDescargando(null);
        }
    };

    if (cargando) return <Cargando texto="Cargando solicitudes…" />;

    return (
        <div className="space-y-6">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                {/* Tabs */}
                <div className="border-b border-gray-200 dark:border-gray-800 px-4 sm:px-6 bg-gray-50/50 dark:bg-gray-900/50">
                    <nav className="flex gap-1 sm:gap-2 overflow-x-auto -mb-px">
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
                                    className={`whitespace-nowrap py-3.5 px-4 text-sm font-semibold border-b-2 transition-all duration-200 ${
                                        active
                                            ? 'border-blue-600 text-blue-600 dark:text-blue-400 dark:border-blue-400'
                                            : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200 hover:border-gray-300'
                                    }`}
                                >
                                    {t.label}
                                    <span className={`ml-2 text-xs px-2 py-0.5 rounded-full font-bold transition-colors ${active ? 'bg-blue-100 dark:bg-blue-900/40 text-blue-700 dark:text-blue-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'}`}>
                                        {count}
                                    </span>
                                </button>
                            );
                        })}
                    </nav>
                </div>

                {/* Tabla */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
                                <Th>Asociación</Th>
                                <Th>Residuo</Th>
                                <Th className="hidden sm:table-cell">Cantidad</Th>
                                <Th className="hidden md:table-cell">Recolección</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                            {filtradas.map((s, idx) => {
                                const nombre = s.asociacion?.nombre_asociacion ?? 'Asociación';
                                const cantidad = s.cantidad_aprobada ?? s.cantidad_solicitada;
                                return (
                                    <tr
                                        key={s.id}
                                        className="group bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150 animate-fade-in"
                                        style={{ animationDelay: `${Math.min(idx * 30, 300)}ms` }}
                                    >
                                        <td className="px-4 md:px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                    {nombre.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{nombre}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:block">
                                                        Solicitada {formatearFecha(s.created_at)}
                                                    </p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5">
                                            <ResiduoBadge tipo={s.tipo} />
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 hidden sm:table-cell whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{formatCantidad(cantidad)}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{s.unidad}</span>
                                            {s.cantidad_aprobada !== null && s.cantidad_aprobada !== s.cantidad_solicitada && (
                                                <span className="block text-[11px] text-gray-400">de {formatCantidad(s.cantidad_solicitada)} solicitados</span>
                                            )}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                            {formatearFecha(s.fecha_propuesta)}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5">
                                            <EstadoSolicitudBadge estado={s.estado} />
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {s.estado === 'pendiente' && (
                                                    <>
                                                        <AccionBtn color="emerald" onClick={() => setAccion({ tipo: 'aprobar', solicitud: s })} icon={<CheckCircle2 className="w-3.5 h-3.5" />}>
                                                            Aprobar
                                                        </AccionBtn>
                                                        <AccionBtn color="red" onClick={() => setAccion({ tipo: 'rechazar', solicitud: s })} icon={<XCircle className="w-3.5 h-3.5" />}>
                                                            Rechazar
                                                        </AccionBtn>
                                                    </>
                                                )}
                                                {s.estado === 'aprobada' && (
                                                    <AccionBtn color="blue" onClick={() => setAccion({ tipo: 'completar', solicitud: s })} icon={<Truck className="w-3.5 h-3.5" />}>
                                                        Completar
                                                    </AccionBtn>
                                                )}
                                                {s.estado === 'completada' && (
                                                    <AccionBtn color="blue" onClick={() => descargarComprobante(s)} icon={descargando === s.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <FileDown className="w-3.5 h-3.5" />}>
                                                        Comprobante
                                                    </AccionBtn>
                                                )}
                                                <IconBtn title="Ver detalle" onClick={() => setAccion({ tipo: 'detalle', solicitud: s })}>
                                                    <Eye className="w-4 h-4" />
                                                </IconBtn>
                                                <IconBtn title="Abrir chat" onClick={() => onAbrirChat?.(s.asociacion_id)}>
                                                    <MessageSquare className="w-4 h-4" />
                                                </IconBtn>
                                                {(s.estado === 'pendiente' || s.estado === 'aprobada') && (
                                                    <IconBtn title="Cancelar solicitud" onClick={() => cancelar(s)}>
                                                        <Ban className="w-4 h-4" />
                                                    </IconBtn>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                            {filtradas.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="py-16 text-center">
                                        <div className="flex flex-col items-center gap-2 text-gray-400">
                                            <Inbox className="w-10 h-10" />
                                            <p className="text-sm font-medium">No hay solicitudes en esta categoría.</p>
                                        </div>
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {accion?.tipo === 'detalle' && (
                <DetalleModal
                    solicitud={accion.solicitud}
                    disponible={disponibleDe(accion.solicitud)}
                    onClose={() => setAccion(null)}
                    onAccion={(tipo) => setAccion({ tipo, solicitud: accion.solicitud })}
                    onAbrirChat={() => {
                        onAbrirChat?.(accion.solicitud.asociacion_id);
                        setAccion(null);
                    }}
                />
            )}
            {accion?.tipo === 'aprobar' && (
                <AprobarModal
                    solicitud={accion.solicitud}
                    disponible={disponibleDe(accion.solicitud)}
                    onClose={() => setAccion(null)}
                    onHecho={trasCambio}
                />
            )}
            {accion?.tipo === 'rechazar' && (
                <RechazarModal solicitud={accion.solicitud} onClose={() => setAccion(null)} onHecho={trasCambio} />
            )}
            {accion?.tipo === 'completar' && (
                <CompletarModal
                    solicitud={accion.solicitud}
                    disponible={disponibleDe(accion.solicitud)}
                    onClose={() => setAccion(null)}
                    onHecho={trasCambio}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Modales
// ─────────────────────────────────────────────────────────────────────

function DetalleModal({
    solicitud: s,
    disponible,
    onClose,
    onAccion,
    onAbrirChat,
}: {
    solicitud: SolicitudConAsociacion;
    disponible: number;
    onClose: () => void;
    onAccion: (tipo: 'aprobar' | 'rechazar' | 'completar') => void;
    onAbrirChat: () => void;
}) {
    const a = s.asociacion;
    return (
        <Modal titulo={`Solicitud #${s.id}`} onClose={onClose} ancho="max-w-xl">
            <div className="space-y-4">
                <EstadoSolicitudBadge estado={s.estado} />

                {a && (
                    <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                        <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                            {a.nombre_asociacion.charAt(0)}
                        </div>
                        <div className="min-w-0 flex-1">
                            <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{a.nombre_asociacion}</p>
                            <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">
                                {[a.ubicacion, a.telefono, a.email].filter(Boolean).join(' · ') || 'Sin datos de contacto'}
                            </p>
                            {a.estado !== 'Activo' && (
                                <p className="text-xs font-semibold text-amber-600 dark:text-amber-400 mt-1">Asociación {a.estado.toLowerCase()}</p>
                            )}
                        </div>
                        <button
                            onClick={onAbrirChat}
                            className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                        >
                            <MessageSquare className="w-4 h-4" />
                            <span className="hidden sm:inline">Chat</span>
                        </button>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    <InfoCard label="Residuo">
                        <ResiduoBadge tipo={s.tipo} />
                    </InfoCard>
                    <InfoCard label="Solicitado">
                        <Cantidad valor={s.cantidad_solicitada} unidad={s.unidad} />
                    </InfoCard>
                    <InfoCard label={s.cantidad_aprobada !== null ? 'Aprobado' : 'Disponible'}>
                        <Cantidad valor={s.cantidad_aprobada ?? disponible} unidad={s.unidad} />
                    </InfoCard>
                    <InfoCard label="Fecha propuesta">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatearFecha(s.fecha_propuesta)}</span>
                    </InfoCard>
                </div>

                {s.mensaje && <Nota titulo="Mensaje de la asociación">{s.mensaje}</Nota>}
                {s.motivo_rechazo && <Nota titulo="Motivo del rechazo">{s.motivo_rechazo}</Nota>}

                <p className="text-xs text-gray-400 dark:text-gray-500">
                    Creada {formatearFecha(s.created_at)}
                    {s.resuelta_at && ` · actualizada ${formatearFecha(s.resuelta_at)}`}
                </p>

                {s.estado === 'pendiente' && (
                    <div className="grid grid-cols-2 gap-3 pt-1">
                        <BotonSecundario onClick={() => onAccion('rechazar')} className="!text-red-600 dark:!text-red-400">
                            <XCircle className="w-4 h-4" /> Rechazar
                        </BotonSecundario>
                        <BotonPrimario onClick={() => onAccion('aprobar')} className="!bg-emerald-600 hover:!bg-emerald-700">
                            <CheckCircle2 className="w-4 h-4" /> Aprobar
                        </BotonPrimario>
                    </div>
                )}
                {s.estado === 'aprobada' && (
                    <BotonPrimario onClick={() => onAccion('completar')} className="w-full">
                        <Truck className="w-4 h-4" /> Registrar recolección
                    </BotonPrimario>
                )}
            </div>
        </Modal>
    );
}

function AprobarModal({
    solicitud: s,
    disponible,
    onClose,
    onHecho,
}: {
    solicitud: SolicitudConAsociacion;
    disponible: number;
    onClose: () => void;
    onHecho: () => void;
}) {
    const [cantidad, setCantidad] = useState(String(Math.min(s.cantidad_solicitada, disponible)));
    const [guardando, setGuardando] = useState(false);
    const valor = Number(cantidad);
    const invalida = !cantidad || Number.isNaN(valor) || valor <= 0 || valor > s.cantidad_solicitada || valor > disponible;

    const aprobar = async () => {
        setGuardando(true);
        try {
            await aprobarSolicitud(s.id, valor);
            toast.success('Solicitud aprobada', {
                description: `${formatCantidad(valor)} ${s.unidad} descontados del inventario.`,
            });
            onHecho();
        } catch (err) {
            toast.error(mensajeError(err));
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Aprobar solicitud" subtitulo={s.asociacion?.nombre_asociacion} onClose={onClose}>
            <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                    <InfoCard label="Solicitado">
                        <Cantidad valor={s.cantidad_solicitada} unidad={s.unidad} />
                    </InfoCard>
                    <InfoCard label="Disponible en inventario">
                        <Cantidad valor={disponible} unidad={s.unidad} />
                    </InfoCard>
                </div>
                <Campo
                    label={`Cantidad a aprobar (${s.unidad})`}
                    ayuda="Puedes aprobar una cantidad menor a la solicitada. Se descuenta del inventario al aprobar."
                >
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        max={Math.min(s.cantidad_solicitada, disponible)}
                        value={cantidad}
                        onChange={(e) => setCantidad(e.target.value)}
                        className={inputCls}
                        autoFocus
                    />
                </Campo>
                {disponible < s.cantidad_solicitada && (
                    <p className="text-xs text-amber-600 dark:text-amber-400">
                        El inventario no alcanza para toda la solicitud; como máximo puedes aprobar {formatCantidad(disponible)} {s.unidad}.
                    </p>
                )}
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <BotonSecundario onClick={onClose}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={aprobar} cargando={guardando} disabled={invalida} className="!bg-emerald-600 hover:!bg-emerald-700">
                        <CheckCircle2 className="w-4 h-4" /> Aprobar
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

function RechazarModal({
    solicitud: s,
    onClose,
    onHecho,
}: {
    solicitud: SolicitudConAsociacion;
    onClose: () => void;
    onHecho: () => void;
}) {
    const [motivo, setMotivo] = useState('');
    const [guardando, setGuardando] = useState(false);

    const rechazar = async () => {
        setGuardando(true);
        try {
            await rechazarSolicitud(s.id, motivo);
            toast.success('Solicitud rechazada');
            onHecho();
        } catch (err) {
            toast.error(mensajeError(err));
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Rechazar solicitud" subtitulo={s.asociacion?.nombre_asociacion} onClose={onClose}>
            <div className="space-y-4">
                <Campo label="Motivo del rechazo" ayuda="La asociación verá este motivo en su notificación.">
                    <textarea
                        rows={3}
                        value={motivo}
                        onChange={(e) => setMotivo(e.target.value)}
                        placeholder="Ej. La cantidad ya fue asignada a otra asociación."
                        className={inputCls}
                        autoFocus
                    />
                </Campo>
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <BotonSecundario onClick={onClose}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={rechazar} cargando={guardando} disabled={!motivo.trim()} className="!bg-red-600 hover:!bg-red-700">
                        <XCircle className="w-4 h-4" /> Rechazar
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

function CompletarModal({
    solicitud: s,
    disponible,
    onClose,
    onHecho,
}: {
    solicitud: SolicitudConAsociacion;
    disponible: number;
    onClose: () => void;
    onHecho: () => void;
}) {
    const { user } = useAuth();
    const aprobada = s.cantidad_aprobada ?? s.cantidad_solicitada;
    const [cantidad, setCantidad] = useState(String(aprobada));
    const [entregadoPor, setEntregadoPor] = useState<string>(user?.user_metadata?.full_name ?? '');
    const [recibidoPor, setRecibidoPor] = useState('');
    const [observaciones, setObservaciones] = useState('');
    const [guardando, setGuardando] = useState(false);
    const firmaEntrega = useRef<SignaturePadRef>(null);
    const firmaRecibe = useRef<SignaturePadRef>(null);

    const valor = Number(cantidad);
    const maximo = aprobada + disponible;
    const invalida = !cantidad || Number.isNaN(valor) || valor <= 0 || valor > maximo;

    const completar = async () => {
        setGuardando(true);
        let rec;
        try {
            rec = await completarSolicitud(s.id, {
                cantidadReal: valor,
                entregadoPor,
                recibidoPor,
                observaciones,
            });
        } catch (err) {
            toast.error(mensajeError(err));
            setGuardando(false);
            return;
        }

        // La recolección ya quedó registrada; el comprobante se puede regenerar después si esto falla
        try {
            const pdf = await generarPDFRecoleccion({
                recoleccion: rec,
                asociacion: s.asociacion,
                solicitud: s,
                firmaEntrega: firmaEntrega.current?.isEmpty() ? null : firmaEntrega.current?.toDataURL(),
                firmaRecibe: firmaRecibe.current?.isEmpty() ? null : firmaRecibe.current?.toDataURL(),
            });
            const ruta = await subirComprobante(rec, pdf);
            toast.success(`Recolección ${rec.folio} registrada`, {
                description: 'El comprobante ya está disponible para la asociación.',
                action: { label: 'Ver PDF', onClick: () => abrirComprobante(ruta) },
            });
        } catch (err) {
            console.error('Error generando comprobante:', err);
            toast.warning(`Recolección ${rec.folio} registrada, pero no se pudo subir el comprobante`, {
                description: 'Puedes generarlo desde el botón "Comprobante" de la solicitud.',
            });
        }
        onHecho();
    };

    return (
        <Modal titulo="Registrar recolección" subtitulo={s.asociacion?.nombre_asociacion} onClose={onClose} ancho="max-w-2xl">
            <div className="space-y-4">
                <div className="grid grid-cols-3 gap-3">
                    <InfoCard label="Residuo">
                        <ResiduoBadge tipo={s.tipo} />
                    </InfoCard>
                    <InfoCard label="Aprobado">
                        <Cantidad valor={aprobada} unidad={s.unidad} />
                    </InfoCard>
                    <InfoCard label="Fecha propuesta">
                        <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatearFecha(s.fecha_propuesta)}</span>
                    </InfoCard>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <Campo
                        label={`Cantidad recolectada (${s.unidad})`}
                        ayuda={`Máximo ${formatCantidad(maximo)} ${s.unidad}. La diferencia con lo aprobado se ajusta en el inventario.`}
                    >
                        <input type="number" min={0} step="0.01" value={cantidad} onChange={(e) => setCantidad(e.target.value)} className={inputCls} />
                    </Campo>
                    <Campo label="Entrega (centro de acopio)">
                        <input value={entregadoPor} onChange={(e) => setEntregadoPor(e.target.value)} placeholder="Nombre" className={inputCls} />
                    </Campo>
                    <Campo label="Recibe (asociación)">
                        <input value={recibidoPor} onChange={(e) => setRecibidoPor(e.target.value)} placeholder="Nombre del operador" className={inputCls} />
                    </Campo>
                </div>

                <Campo label="Observaciones (opcional)">
                    <textarea rows={2} value={observaciones} onChange={(e) => setObservaciones(e.target.value)} className={inputCls} />
                </Campo>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <SignaturePad ref={firmaEntrega} label="Firma de quien entrega" height={150} />
                    <SignaturePad ref={firmaRecibe} label="Firma de quien recibe" height={150} />
                </div>

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <BotonSecundario onClick={onClose} disabled={guardando}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={completar} cargando={guardando} disabled={invalida}>
                        <Truck className="w-4 h-4" /> Completar y generar comprobante
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────

function AccionBtn({
    color,
    onClick,
    icon,
    children,
}: {
    color: 'emerald' | 'red' | 'blue';
    onClick: () => void;
    icon: React.ReactNode;
    children: React.ReactNode;
}) {
    const cls = {
        emerald: 'text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40',
        red: 'text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40',
        blue: 'text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40',
    }[color];
    return (
        <button onClick={onClick} className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold transition-all ${cls}`}>
            {icon}
            <span className="hidden sm:inline">{children}</span>
        </button>
    );
}

function IconBtn({ title, onClick, children }: { title: string; onClick: () => void; children: React.ReactNode }) {
    return (
        <button
            onClick={onClick}
            title={title}
            aria-label={title}
            className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
        >
            {children}
        </button>
    );
}

function Cantidad({ valor, unidad }: { valor: number; unidad: string }) {
    return (
        <span className="text-xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
            {formatCantidad(valor)}
            <span className="text-sm font-medium text-gray-400 ml-1">{unidad}</span>
        </span>
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

function InfoCard({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-4">
            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">{label}</p>
            <div>{children}</div>
        </div>
    );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={`px-4 md:px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap ${className}`}>
            {children}
        </th>
    );
}

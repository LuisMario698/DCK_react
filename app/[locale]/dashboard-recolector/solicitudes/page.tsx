'use client';

import { use, useCallback, useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { confirmar } from '@/components/ui/Confirmar';
import { Eye, Ban, Plus, Inbox, FileText } from 'lucide-react';
import { PUERTO_PENASCO, TIPO_RESIDUO_LABEL, formatCantidad, unidadEscrita, type EstadoSolicitud } from '@/lib/constants/residuos';
import { formatearFecha, hoyPuerto } from '@/lib/utils/fechas';
import { diaLargo, diasHasta } from '@/components/recolector/LoImportante';
import { SolicitudConAsociacion } from '@/types/database';
import { cancelarSolicitud, cantidadVigente, getSolicitudes } from '@/lib/services/solicitudes';
import { suscribirCambios } from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import {
    BotonSecundario,
    Cargando,
    ControlSegmentado,
    ErrorCarga,
    EstadoSolicitudBadge,
    Modal,
    ResiduoBadge,
    mensajeError,
} from '@/components/asociaciones/ui';
import { Aviso, EstadoVacio, claseChip } from '@/components/ui/simar';
import { BotonFlotante } from '@/components/ui/BotonFlotante';
import { LineaDeTiempo } from '@/components/asociaciones/LineaDeTiempo';

// 'activas' y 'terminadas' (grupos de estados) sólo se eligen en celular
type Filtro = EstadoSolicitud | 'todas' | 'activas' | 'terminadas';

const TABS: { value: Filtro; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'completada', label: 'Completadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'cancelada', label: 'Canceladas' },
];

const ACTIVAS: Filtro[] = ['pendiente', 'aprobada'];
const TERMINADAS: Filtro[] = ['completada', 'rechazada', 'cancelada'];

// Celular: tres grupos en el control segmentado y un selector para afinar dentro del grupo (como
// Asociaciones → Solicitudes en el recinto). "Activas" es lo mismo que cuenta el Inicio
const OPCIONES_GRUPO: Record<'activas' | 'terminadas', { value: Filtro; label: string }[]> = {
    activas: [
        { value: 'activas', label: 'Todas las activas' },
        { value: 'pendiente', label: 'Pendientes' },
        { value: 'aprobada', label: 'Aprobadas' },
    ],
    terminadas: [
        { value: 'terminadas', label: 'Todas las terminadas' },
        { value: 'completada', label: 'Completadas' },
        { value: 'rechazada', label: 'Rechazadas' },
        { value: 'cancelada', label: 'Canceladas' },
    ],
};

/** `?ver=ID` abre esa solicitud (así llegan los avisos y "Tu próxima recolección" del Inicio) */
export default function SolicitudesPage({ searchParams }: { searchParams: Promise<{ ver?: string }> }) {
    const { ver } = use(searchParams);
    const pathname = usePathname();
    const router = useRouter();
    const locale = pathname.split('/')[1] || 'es';
    const [solicitudes, setSolicitudes] = useState<SolicitudConAsociacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [tab, setTab] = useState<Filtro>('todas');
    const [detalle, setDetalle] = useState<SolicitudConAsociacion | null>(null);
    const asociacionId = useRecolector().asociacion?.id;
    // La solicitud a abrir con ?ver=ID: se abre en cuanto carga la lista (ajuste durante el render).
    // Si cambia el enlace estando en la pantalla (otro aviso), se abre la nueva
    const [verAnterior, setVerAnterior] = useState(ver);
    const [porAbrir, setPorAbrir] = useState(Number(ver) > 0 ? Number(ver) : null);
    if (ver !== verAnterior) {
        setVerAnterior(ver);
        setPorAbrir(Number(ver) > 0 ? Number(ver) : null);
    }
    if (porAbrir != null && !cargando) {
        setPorAbrir(null);
        const s = solicitudes.find((x) => x.id === porAbrir);
        if (s) setDetalle(s);
    }

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
        const ok = await confirmar({ titulo: '¿Cancelar esta solicitud?', mensaje: 'El centro de acopio ya no la verá como pendiente.', accion: 'Cancelar solicitud', volver: 'No, dejarla', peligro: true });
        if (!ok) return;
        try {
            await cancelarSolicitud(s.id);
            toast.success('Solicitud cancelada');
            setDetalle(null);
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const coincide = (s: SolicitudConAsociacion, f: Filtro) =>
        f === 'todas' ||
        (f === 'activas' ? ACTIVAS.includes(s.estado) : f === 'terminadas' ? TERMINADAS.includes(s.estado) : s.estado === f);
    const conteo = (f: Filtro) => solicitudes.filter((s) => coincide(s, f)).length;
    const filtradas = solicitudes.filter((s) => coincide(s, tab));
    const grupo: 'todas' | 'activas' | 'terminadas' =
        tab === 'todas' ? 'todas' : tab === 'activas' || ACTIVAS.includes(tab) ? 'activas' : 'terminadas';

    if (cargando) return <Cargando texto="Cargando solicitudes…" />;

    return (
        <div className="space-y-6 movil:space-y-3">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar overflow-hidden">
                {/* Filtros (fichas de 48 px con su conteo) y la acción principal en la misma franja */}
                <div className="px-4 sm:px-6 py-5 border-b border-simar-borde flex flex-col xl:flex-row xl:items-center gap-4 movil:p-2 movil:gap-2">
                    {/* Celular: control segmentado (discreto: las secciones están en la barra de abajo) */}
                    <ControlSegmentado
                        etiqueta="Filtrar solicitudes por estado"
                        valor={grupo}
                        onCambiar={setTab}
                        opciones={[
                            { valor: 'todas', texto: 'Todas', conteo: conteo('todas') },
                            { valor: 'activas', texto: 'Activas', conteo: conteo('activas'), tono: 'marea' },
                            { valor: 'terminadas', texto: 'Terminadas', conteo: conteo('terminadas') },
                        ]}
                    />
                    {grupo !== 'todas' && (
                        <label className="hidden movil:flex items-center gap-2.5 pl-1">
                            <span className="text-[14px] font-semibold text-simar-texto-2">Mostrar</span>
                            <select
                                value={tab}
                                onChange={(e) => setTab(e.target.value as Filtro)}
                                className="flex-1 min-w-0 min-h-[40px] px-3 rounded-[12px] border-2 border-simar-campo-borde bg-simar-superficie text-[15px] font-semibold text-simar-texto focus:outline-none focus:border-simar-marea-tinta transition-colors"
                            >
                                {OPCIONES_GRUPO[grupo].map((o) => (
                                    <option key={o.value} value={o.value}>
                                        {o.label} ({conteo(o.value)})
                                    </option>
                                ))}
                            </select>
                        </label>
                    )}
                    <nav aria-label="Filtrar solicitudes por estado" className="flex flex-wrap gap-2.5 flex-1 movil:hidden">
                        {TABS.map((t) => {
                            const count = conteo(t.value);
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
                    {/* En celular esta acción va en la burbuja flotante */}
                    <Link
                        href={`/${locale}/dashboard-recolector/mapa`}
                        className="simar-presiona flex-shrink-0 min-h-[56px] px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold inline-flex items-center justify-center gap-2 movil:hidden"
                    >
                        <Plus className="w-[22px] h-[22px]" strokeWidth={2.4} />
                        Nueva solicitud
                    </Link>
                </div>

                {/* Tabla. En celular cada solicitud es un bloque: residuo y estado; cantidad y fecha de
                    recolección; las acciones con su palabra */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-simar-borde-suave movil:block">
                        <thead className="bg-simar-papel movil:hidden">
                            <tr>
                                <Th>Residuo</Th>
                                <Th className="hidden sm:table-cell">Cantidad</Th>
                                <Th className="hidden md:table-cell">Recolección</Th>
                                <Th className="hidden lg:table-cell">Enviada</Th>
                                <Th className="hidden sm:table-cell">Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-simar-borde-suave bg-simar-superficie movil:block">
                            {filtradas.map((s) => (
                                <tr
                                    key={s.id}
                                    className={`transition-colors movil:grid movil:grid-cols-[1fr_auto] movil:items-start movil:gap-x-3 movil:gap-y-2.5 movil:px-3.5 movil:py-3 ${
                                        s.estado === 'aprobada'
                                            ? 'bg-simar-marea-suave/60 shadow-[inset_6px_0_0_0_var(--simar-marea)] hover:bg-simar-marea-suave'
                                            : s.estado === 'rechazada'
                                              ? 'shadow-[inset_6px_0_0_0_#A63F0E] hover:bg-simar-papel'
                                              : 'hover:bg-simar-papel'
                                    }`}
                                >
                                    <td className="px-4 sm:px-6 py-4 movil:p-0 movil:min-w-0">
                                        <ResiduoBadge tipo={s.tipo} />
                                        <div className="sm:hidden mt-2 space-y-0.5">
                                            <p className="text-[17px] font-bold text-simar-texto">
                                                {formatCantidad(cantidadVigente(s))} {s.unidad}
                                                {s.recoleccion ? (
                                                    <span className="text-[14px] font-normal text-simar-texto-2"> recolectados</span>
                                                ) : (
                                                    s.cantidad_aprobada !== null &&
                                                    s.cantidad_aprobada !== s.cantidad_solicitada && (
                                                        <span className="text-[14px] font-normal text-simar-texto-2">
                                                            {' '}de {formatCantidad(s.cantidad_solicitada)} solicitados
                                                        </span>
                                                    )
                                                )}
                                            </p>
                                            {s.estado === 'aprobada' ? (
                                                <p className="text-[14px] font-bold text-simar-marea-tinta">
                                                    Recolección: {diaLargo(s.fecha_propuesta)} · {cuando(s.fecha_propuesta)}
                                                </p>
                                            ) : (
                                                <p className="text-[13px] text-simar-texto-2">Recolección {formatearFecha(s.fecha_propuesta)}</p>
                                            )}
                                        </div>
                                        {s.estado === 'rechazada' && s.motivo_rechazo && (
                                            <p className="mt-1.5 text-[15px] leading-snug text-simar-coral movil:text-[13px]">
                                                <strong>Motivo:</strong> {s.motivo_rechazo}
                                            </p>
                                        )}
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
                                        {s.estado === 'aprobada' ? (
                                            <>
                                                <span className="block font-bold text-simar-texto">{diaLargo(s.fecha_propuesta)}</span>
                                                <span className="inline-flex mt-1 px-2.5 py-0.5 rounded-full bg-simar-marea text-white text-[14px] font-bold">{cuando(s.fecha_propuesta)}</span>
                                            </>
                                        ) : (
                                            formatearFecha(s.fecha_propuesta)
                                        )}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-base text-simar-texto-2 hidden lg:table-cell whitespace-nowrap">
                                        {formatearFecha(s.created_at)}
                                    </td>
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 movil:block movil:p-0 movil:col-start-2 movil:row-start-1">
                                        <EstadoSolicitudBadge estado={s.estado} />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right movil:p-0 movil:col-span-2 movil:text-left">
                                        <div className="inline-flex flex-col sm:flex-row items-stretch sm:items-center gap-2 movil:flex movil:flex-row">
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
                                <tr className="movil:block">
                                    <td colSpan={6} className="movil:block">
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

            {/* Celular: "Nueva solicitud" flota encima de la barra de navegación (lleva a Residuos) */}
            <BotonFlotante icono={Plus} etiqueta="Nueva solicitud" onClick={() => router.push(`/${locale}/dashboard-recolector/mapa`)} />

            {detalle && (
                <Modal
                    titulo={`${TIPO_RESIDUO_LABEL[detalle.tipo]} · ${formatCantidad(cantidadVigente(detalle))} ${unidadEscrita(detalle.unidad, cantidadVigente(detalle))}`}
                    subtitulo={`Solicitud n.º ${detalle.id} · ${PUERTO_PENASCO.nombre}`}
                    onClose={() => setDetalle(null)}
                >
                    <div className="space-y-4">
                        {/* El residuo ya va en el título: aquí sólo el estado */}
                        <EstadoSolicitudBadge estado={detalle.estado} />
                        {/* Seguimiento: enviada → aprobada → recolectada, con sus fechas (el motivo de un rechazo va en su paso) */}
                        <div className="rounded-2xl border border-simar-borde p-4 movil:p-3">
                            <LineaDeTiempo solicitud={detalle} />
                        </div>
                        {detalle.mensaje && <Nota titulo="Tu mensaje">{detalle.mensaje}</Nota>}
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

/** "Hoy", "Mañana", "En 3 días" o "Ya pasó la fecha" */
function cuando(fecha: string) {
    const d = diasHasta(fecha, hoyPuerto());
    return d < 0 ? 'Ya pasó la fecha' : d === 0 ? 'Hoy' : d === 1 ? 'Mañana' : `En ${d} días`;
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

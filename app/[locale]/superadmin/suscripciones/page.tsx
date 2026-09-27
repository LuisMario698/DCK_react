'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
    AlertTriangle,
    Ban,
    CheckCircle2,
    CreditCard,
    Hourglass,
    Pencil,
    Plus,
    Receipt,
    Search,
    Trash2,
    TrendingUp,
    Wallet,
} from 'lucide-react';
import {
    BotonPrimario,
    BotonSecundario,
    Campo,
    Cargando,
    ErrorCarga,
    Modal,
    inputCls,
    mensajeError,
} from '@/components/asociaciones/ui';
import {
    BotonIcono,
    EstadoSuscripcionBadge,
    EstadoVacio,
    Kpi,
    ModalConfirmar,
    Pestanas,
    Tarjeta,
    formatoFecha,
    hace,
    filtroCls,
    tdCls,
    thCls,
} from '@/components/superadmin/ui';
import {
    createSuscripcion,
    deletePago,
    deleteSuscripcion,
    getAsociacionesConSuscripcion,
    getPagos,
    getPlanes,
    registrarPago,
    updateSuscripcion,
    type AsociacionConSuscripcion,
    type PagoConAsociacion,
    type SuscripcionInput,
} from '@/lib/services/suscripciones';
import { updateAsociacion } from '@/lib/services/asociaciones';
import { getConfiguracion } from '@/lib/services/configuracion';
import {
    CICLO_LABEL,
    ESTADOS_GUARDABLES,
    ESTADO_SUSCRIPCION_LABEL,
    METODO_PAGO_LABEL,
    diasHasta,
    estadoEfectivo,
    formatoMXN,
    hoyPuerto,
    precioMensual,
    siguientePeriodo,
    sumarDias,
    type CicloSuscripcion,
    type EstadoSuscripcion,
    type MetodoPago,
} from '@/lib/constants/suscripciones';
import type { Plan, Suscripcion } from '@/types/database';

type FiltroEstado = 'todas' | 'sin' | EstadoSuscripcion;
const DIAS_AVISO = 15;

export default function SuscripcionesPage() {
    const pathname = usePathname();
    const base = `/${pathname.split('/')[1] || 'es'}/superadmin`;

    const [pestana, setPestana] = useState<'asociaciones' | 'pagos'>('asociaciones');
    const [asociaciones, setAsociaciones] = useState<AsociacionConSuscripcion[] | null>(null);
    const [pagos, setPagos] = useState<PagoConAsociacion[]>([]);
    const [planes, setPlanes] = useState<Plan[]>([]);
    const [diasPrueba, setDiasPrueba] = useState(30);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtro, setFiltro] = useState<FiltroEstado>('todas');
    const [filtroPagos, setFiltroPagos] = useState<number | 'todas'>('todas');

    const [editando, setEditando] = useState<AsociacionConSuscripcion | null>(null);
    const [cobrando, setCobrando] = useState<AsociacionConSuscripcion | null>(null);
    const [cambioEstado, setCambioEstado] = useState<AsociacionConSuscripcion | null>(null);
    const [borrandoPago, setBorrandoPago] = useState<PagoConAsociacion | null>(null);

    const cargar = useCallback(
        () =>
            Promise.all([getAsociacionesConSuscripcion(), getPagos(), getPlanes(), getConfiguracion()])
                .then(([a, p, pl, config]) => {
                    setAsociaciones(a);
                    setPagos(p);
                    setPlanes(pl);
                    setDiasPrueba(config.suscripciones.dias_prueba);
                    setError(null);
                })
                .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las suscripciones.'))),
        []
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    const conEstado = useMemo(
        () =>
            (asociaciones ?? []).map((a) => ({
                ...a,
                efectivo: a.suscripcion ? estadoEfectivo(a.suscripcion.estado, a.suscripcion.vence_el) : null,
            })),
        [asociaciones]
    );

    const kpis = useMemo(() => {
        let mrr = 0;
        let activas = 0;
        let prueba = 0;
        let atencion = 0;
        for (const a of conEstado) {
            const s = a.suscripcion;
            if (!s) continue;
            if (a.efectivo === 'activa') {
                activas++;
                mrr += precioMensual(Number(s.precio), s.ciclo);
            }
            if (a.efectivo === 'prueba') prueba++;
            if (a.efectivo === 'vencida' || (s.vence_el && (a.efectivo === 'activa' || a.efectivo === 'prueba') && diasHasta(s.vence_el) <= DIAS_AVISO)) {
                atencion++;
            }
        }
        return { mrr, activas, prueba, atencion };
    }, [conEstado]);

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return conEstado.filter((a) => {
            if (q && !`${a.nombre_asociacion} ${a.rfc ?? ''} ${a.suscripcion?.plan?.nombre ?? ''}`.toLowerCase().includes(q)) return false;
            if (filtro === 'sin') return !a.suscripcion;
            if (filtro !== 'todas') return a.efectivo === filtro;
            return true;
        });
    }, [conEstado, busqueda, filtro]);

    const pagosFiltrados = useMemo(
        () => (filtroPagos === 'todas' ? pagos : pagos.filter((p) => p.suscripcion?.asociacion_id === filtroPagos)),
        [pagos, filtroPagos]
    );

    if (error) return <ErrorCarga mensaje={error} onReintentar={cargar} />;
    if (!asociaciones) return <Cargando texto="Cargando suscripciones…" />;

    const verPagos = (a: AsociacionConSuscripcion) => {
        setFiltroPagos(a.id);
        setPestana('pagos');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                <Kpi label="Ingreso mensual recurrente" valor={formatoMXN(kpis.mrr)} icono={TrendingUp} detalle="Suscripciones activas" />
                <Kpi label="Activas" valor={kpis.activas} icono={CheckCircle2} detalle={`de ${asociaciones.length} asociación(es)`} />
                <Kpi label="En prueba" valor={kpis.prueba} icono={Hourglass} />
                <Kpi
                    label="Vencidas o por vencer"
                    valor={kpis.atencion}
                    icono={AlertTriangle}
                    alerta={kpis.atencion > 0}
                    detalle={`Vencen en ${DIAS_AVISO} días o menos`}
                />
            </div>

            <Pestanas
                pestanas={[
                    { id: 'asociaciones', label: 'Asociaciones', contador: asociaciones.length },
                    { id: 'pagos', label: 'Pagos', contador: pagos.length },
                ]}
                activa={pestana}
                onChange={setPestana}
            />

            {pestana === 'asociaciones' ? (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[220px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className={`${inputCls} pl-9`}
                                placeholder="Buscar asociación, RFC o plan"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                aria-label="Buscar asociaciones"
                            />
                        </div>
                        <select
                            className={`${filtroCls} w-auto`}
                            value={filtro}
                            onChange={(e) => setFiltro(e.target.value as FiltroEstado)}
                            aria-label="Filtrar por estado de la suscripción"
                        >
                            <option value="todas">Todas</option>
                            <option value="sin">Sin suscripción</option>
                            {(['activa', 'prueba', 'vencida', 'suspendida', 'cancelada'] as EstadoSuscripcion[]).map((e) => (
                                <option key={e} value={e}>
                                    {ESTADO_SUSCRIPCION_LABEL[e]}
                                </option>
                            ))}
                        </select>
                    </div>

                    <Tarjeta sinPadding>
                        {asociaciones.length === 0 ? (
                            <EstadoVacio
                                icono={CreditCard}
                                titulo="No hay asociaciones registradas"
                                texto="Las asociaciones recolectoras se dan de alta desde el panel del centro de acopio (Asociaciones)."
                            />
                        ) : filtradas.length === 0 ? (
                            <EstadoVacio icono={Search} titulo="Ninguna asociación coincide con los filtros" />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 dark:border-gray-800">
                                        <tr>
                                            <th className={thCls}>Asociación</th>
                                            <th className={thCls}>Plan</th>
                                            <th className={`${thCls} text-right`}>Precio</th>
                                            <th className={thCls}>Estado</th>
                                            <th className={thCls}>Vigencia</th>
                                            <th className={thCls}>Usuarios</th>
                                            <th className={`${thCls} text-right`}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filtradas.map((a) => {
                                            const s = a.suscripcion;
                                            const limite = s?.plan?.limite_usuarios ?? null;
                                            const dias = s?.vence_el ? diasHasta(s.vence_el) : null;
                                            return (
                                                <tr key={a.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                                    <td className={tdCls}>
                                                        <p className="font-medium text-gray-900 dark:text-white">{a.nombre_asociacion}</p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">
                                                            {a.estado === 'Activo' ? a.rfc || 'Sin RFC' : (
                                                                <span className="font-semibold text-red-600 dark:text-red-400">
                                                                    Asociación {a.estado.toLowerCase()}
                                                                </span>
                                                            )}
                                                        </p>
                                                    </td>
                                                    <td className={tdCls}>
                                                        {s ? (
                                                            <>
                                                                <p className="text-gray-900 dark:text-white">{s.plan?.nombre ?? '—'}</p>
                                                                <p className="text-xs text-gray-500 dark:text-gray-400">{CICLO_LABEL[s.ciclo]}</p>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-400">—</span>
                                                        )}
                                                    </td>
                                                    <td className={`${tdCls} text-right tabular-nums whitespace-nowrap`}>
                                                        {s ? formatoMXN(Number(s.precio)) : '—'}
                                                    </td>
                                                    <td className={tdCls}>
                                                        <EstadoSuscripcionBadge estado={a.efectivo} />
                                                    </td>
                                                    <td className={`${tdCls} whitespace-nowrap`}>
                                                        {!s ? (
                                                            '—'
                                                        ) : s.vence_el ? (
                                                            <>
                                                                <p>{formatoFecha(s.vence_el)}</p>
                                                                <p
                                                                    className={`text-xs ${
                                                                        dias! < 0
                                                                            ? 'text-red-600 dark:text-red-400'
                                                                            : dias! <= DIAS_AVISO
                                                                              ? 'text-amber-600 dark:text-amber-400'
                                                                              : 'text-gray-500 dark:text-gray-400'
                                                                    }`}
                                                                >
                                                                    {dias! < 0 ? `Venció hace ${-dias!} día(s)` : dias === 0 ? 'Vence hoy' : `En ${dias} día(s)`}
                                                                </p>
                                                            </>
                                                        ) : (
                                                            <span className="text-gray-500 dark:text-gray-400">Sin vencimiento</span>
                                                        )}
                                                    </td>
                                                    <td className={`${tdCls} tabular-nums`}>
                                                        <span
                                                            className={
                                                                limite !== null && a.usuarios > limite
                                                                    ? 'font-semibold text-red-600 dark:text-red-400'
                                                                    : ''
                                                            }
                                                        >
                                                            {a.usuarios}
                                                            {limite !== null && ` / ${limite}`}
                                                        </span>
                                                    </td>
                                                    <td className={`${tdCls} text-right whitespace-nowrap`}>
                                                        <BotonIcono
                                                            icono={s ? Pencil : Plus}
                                                            etiqueta={s ? 'Editar suscripción' : 'Crear suscripción'}
                                                            onClick={() => setEditando(a)}
                                                        />
                                                        <BotonIcono
                                                            icono={Wallet}
                                                            etiqueta="Registrar pago"
                                                            disabled={!s}
                                                            onClick={() => setCobrando(a)}
                                                        />
                                                        <BotonIcono
                                                            icono={Receipt}
                                                            etiqueta="Ver pagos"
                                                            disabled={!s}
                                                            onClick={() => verPagos(a)}
                                                        />
                                                        <BotonIcono
                                                            icono={a.estado === 'Activo' ? Ban : CheckCircle2}
                                                            etiqueta={a.estado === 'Activo' ? 'Suspender asociación' : 'Activar asociación'}
                                                            peligro={a.estado === 'Activo'}
                                                            onClick={() => setCambioEstado(a)}
                                                        />
                                                    </td>
                                                </tr>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </Tarjeta>
                </>
            ) : (
                <TablaPagos
                    pagos={pagosFiltrados}
                    asociaciones={asociaciones.filter((a) => a.suscripcion)}
                    filtro={filtroPagos}
                    onFiltro={setFiltroPagos}
                    onBorrar={setBorrandoPago}
                />
            )}

            {editando && (
                <ModalSuscripcion
                    asociacion={editando}
                    planes={planes}
                    diasPrueba={diasPrueba}
                    urlPlanes={`${base}/planes`}
                    numPagos={pagos.filter((p) => p.suscripcion_id === editando.suscripcion?.id).length}
                    onClose={() => setEditando(null)}
                    onGuardado={async () => {
                        setEditando(null);
                        await cargar();
                    }}
                />
            )}

            {cobrando?.suscripcion && (
                <ModalPago
                    asociacion={cobrando}
                    suscripcion={cobrando.suscripcion}
                    onClose={() => setCobrando(null)}
                    onGuardado={async () => {
                        setCobrando(null);
                        await cargar();
                    }}
                />
            )}

            {cambioEstado && (
                <ModalConfirmar
                    titulo={cambioEstado.estado === 'Activo' ? 'Suspender asociación' : 'Activar asociación'}
                    textoConfirmar={cambioEstado.estado === 'Activo' ? 'Suspender' : 'Activar'}
                    peligro={cambioEstado.estado === 'Activo'}
                    onClose={() => setCambioEstado(null)}
                    onConfirmar={async () => {
                        const nuevo = cambioEstado.estado === 'Activo' ? 'Suspendido' : 'Activo';
                        try {
                            await updateAsociacion(cambioEstado.id, { estado: nuevo });
                            toast.success(`${cambioEstado.nombre_asociacion} ${nuevo === 'Activo' ? 'activada' : 'suspendida'}`);
                            setCambioEstado(null);
                            await cargar();
                        } catch (err) {
                            toast.error(mensajeError(err));
                            throw err;
                        }
                    }}
                >
                    {cambioEstado.estado === 'Activo' ? (
                        <p>
                            <strong className="text-gray-900 dark:text-white">{cambioEstado.nombre_asociacion}</strong> podrá
                            consultar su historial y escribir al centro de acopio, pero no crear solicitudes de recolección. Sus
                            usuarios conservan su cuenta.
                        </p>
                    ) : (
                        <p>
                            <strong className="text-gray-900 dark:text-white">{cambioEstado.nombre_asociacion}</strong> volverá a
                            poder crear solicitudes (si su suscripción está vigente cuando sea obligatoria).
                        </p>
                    )}
                </ModalConfirmar>
            )}

            {borrandoPago && (
                <ModalConfirmar
                    titulo="Eliminar pago"
                    textoConfirmar="Eliminar"
                    peligro
                    onClose={() => setBorrandoPago(null)}
                    onConfirmar={async () => {
                        try {
                            await deletePago(borrandoPago.id);
                            toast.success('Pago eliminado');
                            setBorrandoPago(null);
                            await cargar();
                        } catch (err) {
                            toast.error(mensajeError(err));
                            throw err;
                        }
                    }}
                >
                    <p>
                        Se eliminará el pago de <strong className="text-gray-900 dark:text-white">{formatoMXN(Number(borrandoPago.monto))}</strong>{' '}
                        del {formatoFecha(borrandoPago.fecha_pago)}. La vigencia de la suscripción no cambia; ajústala a mano si
                        hace falta. Queda registro en la bitácora.
                    </p>
                </ModalConfirmar>
            )}
        </div>
    );
}

function TablaPagos({
    pagos,
    asociaciones,
    filtro,
    onFiltro,
    onBorrar,
}: {
    pagos: PagoConAsociacion[];
    asociaciones: AsociacionConSuscripcion[];
    filtro: number | 'todas';
    onFiltro: (f: number | 'todas') => void;
    onBorrar: (p: PagoConAsociacion) => void;
}) {
    const total = pagos.reduce((s, p) => s + Number(p.monto), 0);
    return (
        <>
            <div className="flex flex-wrap items-center justify-between gap-3">
                <select
                    className={`${filtroCls} w-auto`}
                    value={filtro}
                    onChange={(e) => onFiltro(e.target.value === 'todas' ? 'todas' : Number(e.target.value))}
                    aria-label="Filtrar pagos por asociación"
                >
                    <option value="todas">Todas las asociaciones</option>
                    {asociaciones.map((a) => (
                        <option key={a.id} value={a.id}>
                            {a.nombre_asociacion}
                        </option>
                    ))}
                </select>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {pagos.length} pago(s) · <strong className="text-gray-900 dark:text-white">{formatoMXN(total)}</strong>
                </p>
            </div>

            <Tarjeta sinPadding>
                {pagos.length === 0 ? (
                    <EstadoVacio
                        icono={Receipt}
                        titulo="Sin pagos registrados"
                        texto="Registra un pago desde la pestaña Asociaciones con el botón de cartera."
                    />
                ) : (
                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="border-b border-gray-200 dark:border-gray-800">
                                <tr>
                                    <th className={thCls}>Fecha</th>
                                    <th className={thCls}>Asociación</th>
                                    <th className={`${thCls} text-right`}>Monto</th>
                                    <th className={thCls}>Método</th>
                                    <th className={thCls}>Referencia</th>
                                    <th className={thCls}>Cubre hasta</th>
                                    <th className={thCls}>Registrado</th>
                                    <th className={`${thCls} text-right`} />
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                {pagos.map((p) => (
                                    <tr key={p.id}>
                                        <td className={`${tdCls} whitespace-nowrap`}>{formatoFecha(p.fecha_pago)}</td>
                                        <td className={tdCls}>{p.suscripcion?.asociacion?.nombre_asociacion ?? '—'}</td>
                                        <td className={`${tdCls} text-right tabular-nums font-semibold text-gray-900 dark:text-white whitespace-nowrap`}>
                                            {formatoMXN(Number(p.monto))}
                                        </td>
                                        <td className={tdCls}>{METODO_PAGO_LABEL[p.metodo]}</td>
                                        <td className={tdCls} title={p.notas ?? undefined}>
                                            {p.referencia ?? <span className="text-gray-400">—</span>}
                                        </td>
                                        <td className={`${tdCls} whitespace-nowrap`}>{formatoFecha(p.cubre_hasta)}</td>
                                        <td className={`${tdCls} whitespace-nowrap text-xs text-gray-500 dark:text-gray-400`}>{hace(p.created_at)}</td>
                                        <td className={`${tdCls} text-right`}>
                                            <BotonIcono icono={Trash2} etiqueta="Eliminar pago" peligro onClick={() => onBorrar(p)} />
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </Tarjeta>
        </>
    );
}

/** Precio del plan según el ciclo (si no hay precio anual, 12 meses). */
function precioDelPlan(plan: Plan | undefined, ciclo: CicloSuscripcion): number {
    if (!plan) return 0;
    return ciclo === 'anual' ? Number(plan.precio_anual ?? Number(plan.precio_mensual) * 12) : Number(plan.precio_mensual);
}

function ModalSuscripcion({
    asociacion,
    planes,
    diasPrueba,
    urlPlanes,
    numPagos,
    onClose,
    onGuardado,
}: {
    asociacion: AsociacionConSuscripcion;
    planes: Plan[];
    diasPrueba: number;
    urlPlanes: string;
    numPagos: number;
    onClose: () => void;
    onGuardado: () => Promise<void>;
}) {
    const actual = asociacion.suscripcion;
    const hoy = hoyPuerto();
    const disponibles = planes.filter((p) => p.activo || p.id === actual?.plan_id);
    const planInicial = actual?.plan_id ?? disponibles[0]?.id ?? null;

    const [form, setForm] = useState<Omit<SuscripcionInput, 'asociacion_id' | 'plan_id'> & { plan_id: number | null }>(() =>
        actual
            ? {
                  plan_id: actual.plan_id,
                  estado: actual.estado,
                  ciclo: actual.ciclo,
                  precio: Number(actual.precio),
                  fecha_inicio: actual.fecha_inicio,
                  vence_el: actual.vence_el,
                  notas: actual.notas,
              }
            : {
                  plan_id: planInicial,
                  estado: 'prueba',
                  ciclo: 'mensual',
                  precio: precioDelPlan(planes.find((p) => p.id === planInicial), 'mensual'),
                  fecha_inicio: hoy,
                  vence_el: sumarDias(hoy, diasPrueba),
                  notas: null,
              }
    );
    const [guardando, setGuardando] = useState(false);
    const [borrando, setBorrando] = useState(false);

    const set = <K extends keyof typeof form>(k: K, v: (typeof form)[K]) => setForm((f) => ({ ...f, [k]: v }));
    const cambiarPlanOCiclo = (planId: number | null, ciclo: CicloSuscripcion) =>
        setForm((f) => ({ ...f, plan_id: planId, ciclo, precio: precioDelPlan(planes.find((p) => p.id === planId), ciclo) }));

    if (disponibles.length === 0) {
        return (
            <Modal titulo="Suscripción" subtitulo={asociacion.nombre_asociacion} onClose={onClose}>
                <EstadoVacio
                    icono={CreditCard}
                    titulo="Aún no hay planes"
                    texto="Crea al menos un plan activo para poder asignar suscripciones."
                    accion={
                        <Link
                            href={urlPlanes}
                            className="inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 shadow-md shadow-blue-600/20 transition-all"
                        >
                            Ir a Planes
                        </Link>
                    }
                />
            </Modal>
        );
    }

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!form.plan_id) return toast.error('Elige un plan.');
        if (form.precio < 0 || Number.isNaN(form.precio)) return toast.error('El precio no es válido.');
        if (form.vence_el && form.vence_el < form.fecha_inicio) return toast.error('El vencimiento no puede ser anterior al inicio.');
        setGuardando(true);
        try {
            const datos = { ...form, plan_id: form.plan_id, notas: form.notas?.trim() || null };
            if (actual) await updateSuscripcion(actual.id, datos);
            else await createSuscripcion({ ...datos, asociacion_id: asociacion.id });
            toast.success(actual ? 'Suscripción actualizada' : 'Suscripción creada');
            await onGuardado();
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    // Se muestra en lugar del formulario: un modal dentro de otro queda mal posicionado
    if (borrando && actual) {
        return (
            <ModalConfirmar
                titulo="Eliminar suscripción"
                textoConfirmar="Eliminar"
                peligro
                textoRequerido={numPagos > 0 ? 'eliminar' : undefined}
                onClose={() => setBorrando(false)}
                onConfirmar={async () => {
                    try {
                        await deleteSuscripcion(actual.id);
                        toast.success('Suscripción eliminada');
                        await onGuardado();
                    } catch (err) {
                        toast.error(mensajeError(err));
                        throw err;
                    }
                }}
            >
                <p>
                    {numPagos > 0
                        ? `También se borrarán sus ${numPagos} pago(s) registrados (quedan en la bitácora). Si la asociación dejó de pagar, mejor márcala como cancelada o suspendida.`
                        : 'La asociación quedará sin suscripción.'}
                </p>
            </ModalConfirmar>
        );
    }

    const baseVencimiento = form.vence_el && form.vence_el > hoy ? form.vence_el : hoy;

    return (
        <Modal
            titulo={actual ? 'Editar suscripción' : 'Nueva suscripción'}
            subtitulo={asociacion.nombre_asociacion}
            onClose={onClose}
            ancho="max-w-xl"
        >
            <form onSubmit={guardar} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo label="Plan">
                        <select
                            className={inputCls}
                            value={form.plan_id ?? ''}
                            onChange={(e) => cambiarPlanOCiclo(Number(e.target.value), form.ciclo)}
                        >
                            {disponibles.map((p) => (
                                <option key={p.id} value={p.id}>
                                    {p.nombre}
                                    {!p.activo ? ' (inactivo)' : ''}
                                </option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Ciclo de cobro">
                        <select
                            className={inputCls}
                            value={form.ciclo}
                            onChange={(e) => cambiarPlanOCiclo(form.plan_id, e.target.value as CicloSuscripcion)}
                        >
                            <option value="mensual">Mensual</option>
                            <option value="anual">Anual</option>
                        </select>
                    </Campo>
                    <Campo label="Precio acordado por periodo (MXN)" ayuda="Se toma del plan; puedes ajustarlo (descuentos).">
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            className={inputCls}
                            value={form.precio}
                            onChange={(e) => set('precio', Number(e.target.value))}
                        />
                    </Campo>
                    <Campo label="Estado" ayuda="«Vencida» se calcula sola con la fecha de vencimiento.">
                        <select
                            className={inputCls}
                            value={form.estado}
                            onChange={(e) => set('estado', e.target.value as Suscripcion['estado'])}
                        >
                            {ESTADOS_GUARDABLES.map((e) => (
                                <option key={e} value={e}>
                                    {ESTADO_SUSCRIPCION_LABEL[e]}
                                </option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Inicio">
                        <input
                            type="date"
                            className={inputCls}
                            value={form.fecha_inicio}
                            onChange={(e) => set('fecha_inicio', e.target.value)}
                            required
                        />
                    </Campo>
                    <Campo label="Vence el" ayuda="Vacío = sin vencimiento.">
                        <input
                            type="date"
                            className={inputCls}
                            value={form.vence_el ?? ''}
                            min={form.fecha_inicio}
                            onChange={(e) => set('vence_el', e.target.value || null)}
                        />
                    </Campo>
                </div>

                <div className="flex flex-wrap gap-2">
                    <button
                        type="button"
                        onClick={() => set('vence_el', sumarDias(hoy, diasPrueba))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        Prueba de {diasPrueba} días
                    </button>
                    <button
                        type="button"
                        onClick={() => set('vence_el', siguientePeriodo(baseVencimiento, form.ciclo))}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        + 1 periodo {form.ciclo === 'anual' ? '(1 año)' : '(1 mes)'}
                    </button>
                    <button
                        type="button"
                        onClick={() => set('vence_el', null)}
                        className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                    >
                        Sin vencimiento
                    </button>
                </div>

                <Campo label="Notas internas">
                    <textarea
                        className={`${inputCls} min-h-[70px]`}
                        value={form.notas ?? ''}
                        onChange={(e) => set('notas', e.target.value)}
                        maxLength={500}
                    />
                </Campo>

                <div className="flex flex-wrap items-center justify-between gap-2 pt-2">
                    {actual ? (
                        <button
                            type="button"
                            onClick={() => setBorrando(true)}
                            className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline"
                        >
                            Eliminar suscripción
                        </button>
                    ) : (
                        <span />
                    )}
                    <div className="flex gap-2">
                        <BotonSecundario type="button" onClick={onClose}>
                            Cancelar
                        </BotonSecundario>
                        <BotonPrimario type="submit" cargando={guardando}>
                            Guardar
                        </BotonPrimario>
                    </div>
                </div>
            </form>
        </Modal>
    );
}

function ModalPago({
    asociacion,
    suscripcion,
    onClose,
    onGuardado,
}: {
    asociacion: AsociacionConSuscripcion;
    suscripcion: Suscripcion;
    onClose: () => void;
    onGuardado: () => Promise<void>;
}) {
    const hoy = hoyPuerto();
    const base = suscripcion.vence_el && suscripcion.vence_el > hoy ? suscripcion.vence_el : hoy;
    const [monto, setMonto] = useState(Number(suscripcion.precio) || 0);
    const [fecha, setFecha] = useState(hoy);
    const [metodo, setMetodo] = useState<MetodoPago>('transferencia');
    const [referencia, setReferencia] = useState('');
    const [extender, setExtender] = useState(true);
    const [cubreHasta, setCubreHasta] = useState(siguientePeriodo(base, suscripcion.ciclo));
    const [notas, setNotas] = useState('');
    const [guardando, setGuardando] = useState(false);

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!(monto > 0)) return toast.error('El monto debe ser mayor que cero.');
        if (extender && cubreHasta < suscripcion.fecha_inicio) {
            return toast.error('La nueva vigencia no puede ser anterior al inicio de la suscripción.');
        }
        setGuardando(true);
        try {
            await registrarPago({
                suscripcion_id: suscripcion.id,
                monto,
                fecha_pago: fecha,
                metodo,
                referencia: referencia.trim() || null,
                cubre_hasta: extender ? cubreHasta : null,
                notas: notas.trim() || null,
            });
            toast.success(`Pago de ${formatoMXN(monto)} registrado`);
            await onGuardado();
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Registrar pago" subtitulo={asociacion.nombre_asociacion} onClose={onClose}>
            <form onSubmit={guardar} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo label="Monto (MXN)">
                        <input
                            type="number"
                            min={0.01}
                            step="0.01"
                            className={inputCls}
                            value={monto}
                            onChange={(e) => setMonto(Number(e.target.value))}
                            autoFocus
                            required
                        />
                    </Campo>
                    <Campo label="Fecha del pago">
                        <input type="date" className={inputCls} value={fecha} onChange={(e) => setFecha(e.target.value)} required />
                    </Campo>
                    <Campo label="Método">
                        <select className={inputCls} value={metodo} onChange={(e) => setMetodo(e.target.value as MetodoPago)}>
                            {(Object.keys(METODO_PAGO_LABEL) as MetodoPago[]).map((m) => (
                                <option key={m} value={m}>
                                    {METODO_PAGO_LABEL[m]}
                                </option>
                            ))}
                        </select>
                    </Campo>
                    <Campo label="Referencia / folio">
                        <input className={inputCls} value={referencia} onChange={(e) => setReferencia(e.target.value)} maxLength={120} />
                    </Campo>
                </div>

                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                    <label className="flex items-center gap-2 text-sm font-medium text-gray-900 dark:text-white">
                        <input type="checkbox" checked={extender} onChange={(e) => setExtender(e.target.checked)} className="rounded" />
                        Extender la vigencia con este pago
                    </label>
                    {extender && (
                        <Campo
                            label="Vigente hasta"
                            ayuda={`Vence actualmente: ${suscripcion.vence_el ? formatoFecha(suscripcion.vence_el) : 'sin vencimiento'}. Una suscripción en prueba pasa a activa.`}
                        >
                            <input
                                type="date"
                                className={inputCls}
                                value={cubreHasta}
                                onChange={(e) => setCubreHasta(e.target.value)}
                                required
                            />
                        </Campo>
                    )}
                </div>

                <Campo label="Notas">
                    <input className={inputCls} value={notas} onChange={(e) => setNotas(e.target.value)} maxLength={300} />
                </Campo>

                <div className="flex justify-end gap-2 pt-2">
                    <BotonSecundario type="button" onClick={onClose}>
                        Cancelar
                    </BotonSecundario>
                    <BotonPrimario type="submit" cargando={guardando}>
                        Registrar pago
                    </BotonPrimario>
                </div>
            </form>
        </Modal>
    );
}

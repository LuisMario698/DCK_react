'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Mail, Phone, MapPin, Globe, Building2, MessageSquare, CheckCircle2, Search, Plus, Pencil,
    Truck, UserPlus, Users, Trash2, Clock, UserX, Package,
} from 'lucide-react';
import {
    TIPOS_RESIDUO,
    TIPO_RESIDUO_LABEL,
    formatCantidad,
    type TipoResiduo,
} from '@/lib/constants/residuos';
import { formatearFecha } from '@/lib/utils/fechas';
import { AsociacionRecolectora, Invitacion, Perfil, RecoleccionConAsociacion } from '@/types/database';
import {
    cancelarInvitacion,
    createAsociacion,
    deleteAsociacion,
    getAsociaciones,
    getInvitacionesPendientes,
    getUsuariosAsociacion,
    invitarUsuario,
    revocarAcceso,
    updateAsociacion,
    type AsociacionInput,
} from '@/lib/services/asociaciones';
import { getRecolecciones } from '@/lib/services/recolecciones';
import {
    BotonPrimario,
    BotonSecundario,
    Campo,
    Cargando,
    ErrorCarga,
    Modal,
    ResiduoBadge,
    inputCls,
    mensajeError,
} from './ui';

type Estado = AsociacionRecolectora['estado'];

const ESTADO_CLS: Record<Estado, string> = {
    Activo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    Inactivo: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
    Suspendido: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
};

interface Metricas {
    recolecciones: number;
    porUnidad: Record<string, number>;
}

export function EmpresasTab({
    onAbrirChat,
    onCambio,
}: {
    onAbrirChat?: (asociacionId: number) => void;
    onCambio?: () => void;
}) {
    const [asociaciones, setAsociaciones] = useState<AsociacionRecolectora[]>([]);
    const [recolecciones, setRecolecciones] = useState<RecoleccionConAsociacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [filtroEstado, setFiltroEstado] = useState<Estado | 'todos'>('todos');
    const [seleccionada, setSeleccionada] = useState<AsociacionRecolectora | null>(null);
    const [formulario, setFormulario] = useState<AsociacionRecolectora | 'nueva' | null>(null);

    const cargar = useCallback(async () => {
        try {
            const [aso, rec] = await Promise.all([getAsociaciones(), getRecolecciones()]);
            setAsociaciones(aso);
            setRecolecciones(rec);
            setError(null);
        } catch (err) {
            setError(mensajeError(err, 'No se pudieron cargar las asociaciones.'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
    }, [cargar]);

    const metricas = useMemo(() => {
        const m = new Map<number, Metricas>();
        recolecciones.forEach((r) => {
            const actual = m.get(r.asociacion_id) ?? { recolecciones: 0, porUnidad: {} };
            actual.recolecciones++;
            actual.porUnidad[r.unidad] = (actual.porUnidad[r.unidad] ?? 0) + r.cantidad;
            m.set(r.asociacion_id, actual);
        });
        return m;
    }, [recolecciones]);

    const texto = busqueda.toLowerCase();
    const filtradas = asociaciones.filter(
        (e) =>
            (filtroEstado === 'todos' || e.estado === filtroEstado) &&
            (e.nombre_asociacion.toLowerCase().includes(texto) ||
                (e.ubicacion ?? '').toLowerCase().includes(texto) ||
                (e.rfc ?? '').toLowerCase().includes(texto))
    );

    const trasGuardar = async (asociacion: AsociacionRecolectora) => {
        setFormulario(null);
        await cargar();
        onCambio?.();
        setSeleccionada(asociacion);
    };

    if (cargando) return <Cargando texto="Cargando asociaciones…" />;

    return (
        <div className="space-y-6">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Asociaciones recolectoras</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Registra empresas, vincula a sus usuarios y controla su estado.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <div className="relative flex-1 sm:w-72">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, RFC o ubicación…"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                            />
                        </div>
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as Estado | 'todos')}
                            className="py-2.5 px-3 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="Activo">Activas</option>
                            <option value="Inactivo">Inactivas</option>
                            <option value="Suspendido">Suspendidas</option>
                        </select>
                        <BotonPrimario onClick={() => setFormulario('nueva')}>
                            <Plus className="w-4 h-4" /> Nueva
                        </BotonPrimario>
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtradas.map((emp, idx) => {
                        const m = metricas.get(emp.id);
                        return (
                            <div
                                key={emp.id}
                                className="group relative border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-gray-900 overflow-hidden animate-fade-in"
                                style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
                            >
                                <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-start gap-3 mb-4">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                        {emp.nombre_asociacion.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emp.nombre_asociacion}</p>
                                        <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{emp.ubicacion || emp.direccion || 'Sin ubicación'}</span>
                                        </p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[10px] font-bold ${ESTADO_CLS[emp.estado]}`}>
                                        {emp.estado}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-xs mb-4 pb-4 border-b border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-400">
                                    <span className="inline-flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="font-semibold text-gray-900 dark:text-white">{m?.recolecciones ?? 0}</span> recolecciones
                                    </span>
                                    {m?.porUnidad.kg ? (
                                        <span className="inline-flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                            <span className="font-semibold text-gray-900 dark:text-white">{formatCantidad(m.porUnidad.kg)}</span> kg
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-5 min-h-[28px]">
                                    {emp.tipos_residuo.slice(0, 3).map((t) => (
                                        <ResiduoBadge key={t} tipo={t} />
                                    ))}
                                    {emp.tipos_residuo.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                            +{emp.tipos_residuo.length - 3}
                                        </span>
                                    )}
                                    {emp.tipos_residuo.length === 0 && (
                                        <span className="text-[11px] text-gray-400">Todos los residuos</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSeleccionada(emp)}
                                        className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-all hover:scale-[1.02] active:scale-95"
                                    >
                                        Ver perfil
                                    </button>
                                    <button
                                        onClick={() => onAbrirChat?.(emp.id)}
                                        className="px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 rounded-xl shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 transition-all inline-flex items-center gap-1.5 hover:scale-[1.02] active:scale-95"
                                    >
                                        <MessageSquare className="w-4 h-4" />
                                        Chat
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>

                {filtradas.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-blue-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                {asociaciones.length === 0
                                    ? 'Aún no hay asociaciones registradas.'
                                    : 'No se encontraron asociaciones con ese criterio.'}
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {seleccionada && (
                <PerfilModal
                    empresa={seleccionada}
                    metricas={metricas.get(seleccionada.id)}
                    onClose={() => setSeleccionada(null)}
                    onEditar={() => {
                        setFormulario(seleccionada);
                        setSeleccionada(null);
                    }}
                    onAbrirChat={() => {
                        onAbrirChat?.(seleccionada.id);
                        setSeleccionada(null);
                    }}
                    onCambio={async (actualizada) => {
                        await cargar();
                        onCambio?.();
                        setSeleccionada(actualizada);
                    }}
                />
            )}

            {formulario && (
                <FormularioModal
                    inicial={formulario === 'nueva' ? null : formulario}
                    onClose={() => setFormulario(null)}
                    onGuardado={trasGuardar}
                />
            )}
        </div>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Perfil de la asociación: datos, usuarios vinculados e invitaciones
// ─────────────────────────────────────────────────────────────────────

function PerfilModal({
    empresa,
    metricas,
    onClose,
    onEditar,
    onAbrirChat,
    onCambio,
}: {
    empresa: AsociacionRecolectora;
    metricas?: Metricas;
    onClose: () => void;
    onEditar: () => void;
    onAbrirChat: () => void;
    onCambio: (actualizada: AsociacionRecolectora | null) => void;
}) {
    const [usuarios, setUsuarios] = useState<Perfil[]>([]);
    const [invitaciones, setInvitaciones] = useState<Invitacion[]>([]);
    const [correo, setCorreo] = useState('');
    const [invitando, setInvitando] = useState(false);

    const cargarAccesos = useCallback(async () => {
        try {
            const [u, i] = await Promise.all([getUsuariosAsociacion(empresa.id), getInvitacionesPendientes(empresa.id)]);
            setUsuarios(u);
            setInvitaciones(i);
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudieron cargar los usuarios.'));
        }
    }, [empresa.id]);

    useEffect(() => {
        cargarAccesos();
    }, [cargarAccesos]);

    const invitar = async () => {
        setInvitando(true);
        try {
            const resultado = await invitarUsuario(correo, empresa.id);
            toast.success(
                resultado === 'vinculado'
                    ? `${correo} ya tenía cuenta: ahora tiene acceso al portal de ${empresa.nombre_asociacion}.`
                    : `Invitación registrada. Pide a ${correo} que se registre en SiMAR con ese correo.`
            );
            setCorreo('');
            await cargarAccesos();
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setInvitando(false);
        }
    };

    const quitarAcceso = async (u: Perfil) => {
        if (!confirm(`¿Quitar el acceso de ${u.email}? Su cuenta quedará pendiente de aprobación.`)) return;
        try {
            await revocarAcceso(u.id);
            toast.success('Acceso revocado');
            await cargarAccesos();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const borrarInvitacion = async (inv: Invitacion) => {
        try {
            await cancelarInvitacion(inv.id);
            await cargarAccesos();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const cambiarEstado = async (estado: Estado) => {
        try {
            const actualizada = await updateAsociacion(empresa.id, { estado });
            toast.success(`Asociación marcada como ${estado.toLowerCase()}`);
            onCambio(actualizada);
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const eliminar = async () => {
        if (metricas?.recolecciones) {
            return toast.error('La asociación tiene recolecciones registradas; suspéndela o márcala inactiva en lugar de eliminarla.');
        }
        if (!confirm(`¿Eliminar ${empresa.nombre_asociacion}? También se borrarán sus solicitudes y mensajes.`)) return;
        try {
            await deleteAsociacion(empresa.id);
            toast.success('Asociación eliminada');
            onCambio(null);
            onClose();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    return (
        <Modal titulo={empresa.nombre_asociacion} subtitulo={empresa.rfc ? `RFC ${empresa.rfc}` : undefined} onClose={onClose} ancho="max-w-2xl">
            <div className="space-y-5">
                <div className="flex flex-wrap items-center gap-2">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-bold ${ESTADO_CLS[empresa.estado]}`}>{empresa.estado}</span>
                    {empresa.tipo_asociacion && (
                        <span className="px-2.5 py-1 rounded-full text-xs font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300">
                            {empresa.tipo_asociacion}
                        </span>
                    )}
                    <div className="ml-auto flex gap-2">
                        <BotonSecundario onClick={onEditar} className="!py-1.5 !px-3">
                            <Pencil className="w-3.5 h-3.5" /> Editar
                        </BotonSecundario>
                        <BotonSecundario onClick={onAbrirChat} className="!py-1.5 !px-3">
                            <MessageSquare className="w-3.5 h-3.5" /> Chat
                        </BotonSecundario>
                    </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                    <Stat label="Recolecciones" value={String(metricas?.recolecciones ?? 0)} icon={<Truck className="w-4 h-4 text-blue-500" />} />
                    <Stat label="Sólidos" value={`${formatCantidad(metricas?.porUnidad.kg ?? 0)} kg`} icon={<Package className="w-4 h-4 text-emerald-500" />} />
                    <Stat label="Líquidos" value={`${formatCantidad(metricas?.porUnidad.L ?? 0)} L`} icon={<CheckCircle2 className="w-4 h-4 text-orange-500" />} />
                </div>

                {empresa.descripcion && (
                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{empresa.descripcion}</p>
                )}

                <div className="space-y-2.5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                    {empresa.contacto_asociacion && <InfoLine icon={<Users className="w-4 h-4" />} text={empresa.contacto_asociacion} />}
                    {empresa.email && <InfoLine icon={<Mail className="w-4 h-4" />} text={empresa.email} />}
                    {empresa.telefono && <InfoLine icon={<Phone className="w-4 h-4" />} text={empresa.telefono} />}
                    {(empresa.ubicacion || empresa.direccion) && (
                        <InfoLine icon={<MapPin className="w-4 h-4" />} text={[empresa.direccion, empresa.ubicacion].filter(Boolean).join(', ')} />
                    )}
                    {empresa.sitio_web && <InfoLine icon={<Globe className="w-4 h-4" />} text={empresa.sitio_web} />}
                    {!empresa.email && !empresa.telefono && !empresa.contacto_asociacion && (
                        <p className="text-sm text-gray-400">Sin datos de contacto.</p>
                    )}
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Materiales que recolecta</p>
                    <div className="flex flex-wrap gap-1.5">
                        {empresa.tipos_residuo.length > 0 ? (
                            empresa.tipos_residuo.map((t) => <ResiduoBadge key={t} tipo={t} size="md" />)
                        ) : (
                            <span className="text-sm text-gray-400">No especificado (recibe avisos de todos los residuos)</span>
                        )}
                    </div>
                </div>

                {/* Accesos al portal */}
                <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-4 space-y-3">
                    <div>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">Usuarios con acceso al portal</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                            Vincula el correo de la persona de la empresa. Si ya tiene cuenta obtiene acceso inmediato;
                            si no, al registrarse con ese correo.
                        </p>
                    </div>
                    <ul className="space-y-1.5">
                        {usuarios.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg bg-gray-50 dark:bg-gray-800/60">
                                <span className="truncate text-gray-800 dark:text-gray-200">
                                    {u.full_name ? `${u.full_name} · ` : ''}{u.email}
                                </span>
                                <button onClick={() => quitarAcceso(u)} className="text-red-500 hover:text-red-600 p-1" title="Quitar acceso">
                                    <UserX className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                        {invitaciones.map((i) => (
                            <li key={i.id} className="flex items-center justify-between gap-2 text-sm px-3 py-2 rounded-lg bg-amber-50 dark:bg-amber-900/10">
                                <span className="truncate text-gray-700 dark:text-gray-300 flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                                    {i.email} <span className="text-xs text-amber-600 dark:text-amber-400">· pendiente de registro desde {formatearFecha(i.created_at)}</span>
                                </span>
                                <button onClick={() => borrarInvitacion(i)} className="text-gray-400 hover:text-red-500 p-1" title="Cancelar invitación">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                        {usuarios.length === 0 && invitaciones.length === 0 && (
                            <li className="text-sm text-gray-400">Nadie tiene acceso todavía.</li>
                        )}
                    </ul>
                    <div className="flex gap-2">
                        <input
                            type="email"
                            value={correo}
                            onChange={(e) => setCorreo(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && correo && invitar()}
                            placeholder="correo@empresa.com"
                            className={inputCls}
                        />
                        <BotonPrimario onClick={invitar} cargando={invitando} disabled={!correo.trim()}>
                            <UserPlus className="w-4 h-4" /> Vincular
                        </BotonPrimario>
                    </div>
                </div>

                {/* Estado y eliminación */}
                <div className="flex flex-wrap items-center gap-2 pt-1">
                    <span className="text-xs font-semibold text-gray-500 dark:text-gray-400 mr-1">Cambiar estado:</span>
                    {(['Activo', 'Inactivo', 'Suspendido'] as Estado[])
                        .filter((e) => e !== empresa.estado)
                        .map((e) => (
                            <button
                                key={e}
                                onClick={() => cambiarEstado(e)}
                                className={`px-3 py-1.5 rounded-lg text-xs font-semibold ${ESTADO_CLS[e]} hover:opacity-80 transition-opacity`}
                            >
                                {e === 'Activo' ? 'Activar' : e === 'Inactivo' ? 'Marcar inactiva' : 'Suspender'}
                            </button>
                        ))}
                    <button onClick={eliminar} className="ml-auto inline-flex items-center gap-1 text-xs font-semibold text-red-600 dark:text-red-400 hover:underline">
                        <Trash2 className="w-3.5 h-3.5" /> Eliminar
                    </button>
                </div>
            </div>
        </Modal>
    );
}

// ─────────────────────────────────────────────────────────────────────
// Alta / edición
// ─────────────────────────────────────────────────────────────────────

const VACIO: AsociacionInput = {
    nombre_asociacion: '',
    tipo_asociacion: 'Empresa recolectora',
    contacto_asociacion: null,
    email: null,
    telefono: null,
    direccion: null,
    certificaciones: [],
    especialidad: [],
    estado: 'Activo',
    rfc: null,
    descripcion: null,
    sitio_web: null,
    ubicacion: null,
    tipos_residuo: [],
};

const RFC_REGEX = /^[A-ZÑ&]{3,4}\d{6}[A-Z\d]{3}$/;

function FormularioModal({
    inicial,
    onClose,
    onGuardado,
}: {
    inicial: AsociacionRecolectora | null;
    onClose: () => void;
    onGuardado: (a: AsociacionRecolectora) => void;
}) {
    const [datos, setDatos] = useState<AsociacionInput>(() => {
        if (!inicial) return VACIO;
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { id, created_at, updated_at, ...resto } = inicial;
        return resto;
    });
    const [certificaciones, setCertificaciones] = useState((inicial?.certificaciones ?? []).join(', '));
    const [guardando, setGuardando] = useState(false);

    const set = <K extends keyof AsociacionInput>(k: K, v: AsociacionInput[K]) => setDatos((d) => ({ ...d, [k]: v }));
    const texto = (k: keyof AsociacionInput) => ({
        value: (datos[k] as string | null) ?? '',
        onChange: (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
            set(k, (e.target.value || null) as never),
    });

    const toggleTipo = (t: TipoResiduo) =>
        set('tipos_residuo', datos.tipos_residuo.includes(t) ? datos.tipos_residuo.filter((x) => x !== t) : [...datos.tipos_residuo, t]);

    const guardar = async () => {
        const nombre = datos.nombre_asociacion.trim();
        if (!nombre) return toast.error('El nombre es obligatorio.');
        const rfc = datos.rfc?.trim().toUpperCase() || null;
        if (rfc && !RFC_REGEX.test(rfc)) return toast.error('El RFC no tiene un formato válido (12 o 13 caracteres).');
        if (datos.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(datos.email)) return toast.error('El correo no es válido.');

        const payload: AsociacionInput = {
            ...datos,
            nombre_asociacion: nombre,
            rfc,
            certificaciones: certificaciones.split(',').map((c) => c.trim()).filter(Boolean),
        };

        setGuardando(true);
        try {
            const guardada = inicial ? await updateAsociacion(inicial.id, payload) : await createAsociacion(payload);
            toast.success(inicial ? 'Asociación actualizada' : 'Asociación registrada');
            onGuardado(guardada);
        } catch (err) {
            toast.error(mensajeError(err));
            setGuardando(false);
        }
    };

    return (
        <Modal titulo={inicial ? 'Editar asociación' : 'Nueva asociación recolectora'} onClose={onClose} ancho="max-w-2xl">
            <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Campo label="Nombre o razón social *" className="sm:col-span-2">
                        <input {...texto('nombre_asociacion')} className={inputCls} autoFocus />
                    </Campo>
                    <Campo label="RFC">
                        <input {...texto('rfc')} className={`${inputCls} uppercase`} maxLength={13} />
                    </Campo>
                    <Campo label="Tipo">
                        <input {...texto('tipo_asociacion')} placeholder="Empresa recolectora, cooperativa…" className={inputCls} />
                    </Campo>
                    <Campo label="Persona de contacto">
                        <input {...texto('contacto_asociacion')} className={inputCls} />
                    </Campo>
                    <Campo label="Teléfono">
                        <input {...texto('telefono')} type="tel" className={inputCls} />
                    </Campo>
                    <Campo label="Correo">
                        <input {...texto('email')} type="email" className={inputCls} />
                    </Campo>
                    <Campo label="Sitio web">
                        <input {...texto('sitio_web')} className={inputCls} />
                    </Campo>
                    <Campo label="Dirección">
                        <input {...texto('direccion')} className={inputCls} />
                    </Campo>
                    <Campo label="Ciudad / estado">
                        <input {...texto('ubicacion')} placeholder="Hermosillo, Sonora" className={inputCls} />
                    </Campo>
                    <Campo label="Descripción" className="sm:col-span-2">
                        <textarea {...texto('descripcion')} rows={2} className={inputCls} />
                    </Campo>
                    <Campo label="Certificaciones" ayuda="Separadas por coma" className="sm:col-span-2">
                        <input value={certificaciones} onChange={(e) => setCertificaciones(e.target.value)} placeholder="ISO 14001, Registro SEMARNAT…" className={inputCls} />
                    </Campo>
                </div>

                <div>
                    <p className="text-xs font-semibold text-gray-600 dark:text-gray-400 mb-2">
                        Materiales que recolecta <span className="font-normal text-gray-400">(define qué avisos de inventario recibe)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {TIPOS_RESIDUO.map((t) => {
                            const activo = datos.tipos_residuo.includes(t);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleTipo(t)}
                                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all ${
                                        activo
                                            ? 'bg-blue-600 border-blue-600 text-white'
                                            : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-blue-400'
                                    }`}
                                >
                                    {TIPO_RESIDUO_LABEL[t]}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {!inicial && (
                    <Campo label="Estado">
                        <select value={datos.estado} onChange={(e) => set('estado', e.target.value as Estado)} className={inputCls}>
                            <option value="Activo">Activo</option>
                            <option value="Inactivo">Inactivo</option>
                            <option value="Suspendido">Suspendido</option>
                        </select>
                    </Campo>
                )}

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <BotonSecundario onClick={onClose}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={guardar} cargando={guardando}>
                        {inicial ? 'Guardar cambios' : 'Registrar asociación'}
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1">{icon}</div>
            <p className="text-base font-bold text-gray-900 dark:text-white">{value}</p>
            <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
        </div>
    );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2.5 text-sm text-gray-700 dark:text-gray-300">
            <span className="text-blue-500 flex-shrink-0">{icon}</span>
            <span className="truncate font-medium">{text}</span>
        </div>
    );
}

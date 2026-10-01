'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { confirmar } from '@/components/ui/Confirmar';
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
    ControlSegmentado,
    ErrorCarga,
    Modal,
    ResiduoBadge,
    inputCls,
    mensajeError,
} from './ui';
import { BotonFlotante } from '@/components/ui/BotonFlotante';

type Estado = AsociacionRecolectora['estado'];

const ESTADO_CLS: Record<Estado, string> = {
    Activo: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
    Inactivo: 'bg-simar-papel text-simar-texto-2',
    Suspendido: 'bg-simar-coral-suave text-simar-coral',
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
            setError(mensajeError(err, 'No se pudieron cargar las empresas.'));
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

    if (cargando) return <Cargando texto="Cargando empresas…" />;

    return (
        <div className="space-y-6">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            <div className="bg-simar-superficie border border-simar-borde rounded-2xl shadow-simar p-5 sm:p-6 transition-shadow movil:p-3">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-5 movil:mb-3">
                    {/* En celular el título ya está arriba de la pantalla: sólo buscador y filtro */}
                    <div className="movil:hidden">
                        <h3 className="text-lg font-bold text-simar-texto">Empresas recolectoras</h3>
                        <p className="text-base text-simar-texto-2 mt-0.5">
                            Registra empresas, vincula a sus usuarios y controla su estado.
                        </p>
                    </div>
                    {/* En celular la tarjeta "Asociaciones activas" se oculta: su número va aquí */}
                    <p className="hidden movil:block basis-full px-0.5 text-[14px] text-simar-texto-2">
                        <span className="font-bold text-simar-texto">{asociaciones.filter((a) => a.estado === 'Activo').length}</span>{' '}
                        activas de {asociaciones.length} registradas
                    </p>
                    <div className="flex items-center gap-2 w-full sm:w-auto flex-wrap">
                        <div className="relative flex-1 sm:w-72 movil:basis-full">
                            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-simar-texto-2" />
                            <input
                                type="text"
                                placeholder="Buscar por nombre, RFC o ubicación…"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                className="w-full pl-10 pr-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                            />
                        </div>
                        {/* En celular el estado se elige con el control segmentado de abajo */}
                        <select
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as Estado | 'todos')}
                            aria-label="Filtrar por estado"
                            className="px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60 movil:hidden"
                        >
                            <option value="todos">Todos los estados</option>
                            <option value="Activo">Activas</option>
                            <option value="Inactivo">Inactivas</option>
                            <option value="Suspendido">Suspendidas</option>
                        </select>
                        <BotonPrimario onClick={() => setFormulario('nueva')} className="movil:hidden">
                            <Plus className="w-4 h-4" /> Nueva
                        </BotonPrimario>
                    </div>
                    <div className="hidden movil:block basis-full">
                        <ControlSegmentado
                            etiqueta="Filtrar por estado"
                            valor={filtroEstado}
                            onCambiar={setFiltroEstado}
                            opciones={[
                                { valor: 'todos', texto: 'Todas' },
                                { valor: 'Activo', texto: 'Activas' },
                                { valor: 'Inactivo', texto: 'Inactivas' },
                                { valor: 'Suspendido', texto: 'Suspendidas' },
                            ]}
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 movil:gap-2.5">
                    {filtradas.map((emp, idx) => {
                        const m = metricas.get(emp.id);
                        return (
                            <div
                                key={emp.id}
                                className="group relative border border-simar-borde rounded-2xl p-5 hover:border-simar-marea-tinta/30 transition-all duration-300 bg-simar-superficie overflow-hidden movil:p-3.5"
                                style={{ animationDelay: `${Math.min(idx * 60, 400)}ms` }}
                            >
                                <div className="absolute inset-x-0 top-0 h-1 bg-simar-marea opacity-0 group-hover:opacity-100 transition-opacity" />

                                <div className="flex items-start gap-3 mb-4 movil:mb-2.5">
                                    <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-simar-marea flex items-center justify-center text-white font-extrabold text-xl shadow-simar group-hover:rotate-3 transition-transform duration-300 movil:w-11 movil:h-11 movil:text-[17px] movil:rounded-[14px]">
                                        {emp.nombre_asociacion.charAt(0)}
                                    </div>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-base font-bold text-simar-texto truncate movil:whitespace-normal movil:line-clamp-2 movil:leading-snug">{emp.nombre_asociacion}</p>
                                        <p className="text-[15px] text-simar-texto-2 flex items-center gap-1 mt-1">
                                            <MapPin className="w-3 h-3 flex-shrink-0" />
                                            <span className="truncate">{emp.ubicacion || emp.direccion || 'Sin ubicación'}</span>
                                        </p>
                                    </div>
                                    <span className={`flex-shrink-0 px-2 py-0.5 rounded-full text-[15px] font-bold ${ESTADO_CLS[emp.estado]}`}>
                                        {emp.estado}
                                    </span>
                                </div>

                                <div className="flex items-center gap-3 text-[15px] mb-4 pb-4 border-b border-simar-borde text-simar-texto-2 movil:mb-2.5 movil:pb-2.5">
                                    <span className="inline-flex items-center gap-1">
                                        <Truck className="w-3.5 h-3.5 text-simar-marea-tinta" />
                                        <span className="font-semibold text-simar-texto">{m?.recolecciones ?? 0}</span> recolecciones
                                    </span>
                                    {m?.porUnidad.kg ? (
                                        <span className="inline-flex items-center gap-1">
                                            <CheckCircle2 className="w-3.5 h-3.5 text-simar-arrecife-tinta" />
                                            <span className="font-semibold text-simar-texto">{formatCantidad(m.porUnidad.kg)}</span> kg
                                        </span>
                                    ) : null}
                                </div>

                                <div className="flex flex-wrap gap-1.5 mb-5 min-h-[28px] movil:mb-3 movil:min-h-0">
                                    {emp.tipos_residuo.slice(0, 3).map((t) => (
                                        <ResiduoBadge key={t} tipo={t} />
                                    ))}
                                    {emp.tipos_residuo.length > 3 && (
                                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[15px] font-semibold bg-simar-papel text-simar-texto-2">
                                            +{emp.tipos_residuo.length - 3}
                                        </span>
                                    )}
                                    {emp.tipos_residuo.length === 0 && (
                                        <span className="text-[15px] text-simar-texto-2">Todos los residuos</span>
                                    )}
                                </div>

                                <div className="flex gap-2">
                                    <button
                                        onClick={() => setSeleccionada(emp)}
                                        className="flex-1 px-4 py-2.5 text-base font-bold text-simar-texto bg-simar-papel hover:bg-simar-papel rounded-xl transition-all min-h-[52px]"
                                    >
                                        Ver perfil
                                    </button>
                                    <button
                                        onClick={() => onAbrirChat?.(emp.id)}
                                        className="px-4 py-2.5 text-base font-bold text-white bg-simar-marea hover:bg-simar-marea-hover rounded-xl shadow-simar transition-all inline-flex items-center gap-1.5 min-h-[52px]"
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
                            <div className="w-14 h-14 rounded-full bg-simar-marea-suave flex items-center justify-center">
                                <Building2 className="w-7 h-7 text-simar-marea-tinta" />
                            </div>
                            <p className="text-base text-simar-texto-2">
                                {asociaciones.length === 0
                                    ? 'Aún no hay empresas registradas.'
                                    : 'No se encontraron empresas con ese criterio.'}
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

            {/* Celular: "Nueva asociación" flota encima de la barra de navegación */}
            <BotonFlotante icono={Plus} etiqueta="Nueva empresa" onClick={() => setFormulario('nueva')} />

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
        const ok = await confirmar({ titulo: `¿Quitar el acceso de ${u.email}?`, mensaje: 'Su cuenta quedará pendiente de aprobación.', accion: 'Quitar acceso', peligro: true });
        if (!ok) return;
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
            toast.success(`Empresa marcada como ${estado.toLowerCase()}`);
            onCambio(actualizada);
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const eliminar = async () => {
        if (metricas?.recolecciones) {
            return toast.error('La empresa tiene recolecciones registradas; suspéndela o márcala inactiva en lugar de eliminarla.');
        }
        const ok = await confirmar({ titulo: `¿Eliminar ${empresa.nombre_asociacion}?`, mensaje: 'También se borrarán sus solicitudes y mensajes. No se puede deshacer.', accion: 'Eliminar', peligro: true });
        if (!ok) return;
        try {
            await deleteAsociacion(empresa.id);
            toast.success('Empresa eliminada');
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
                    <span className={`px-2.5 py-1 rounded-full text-[15px] font-bold ${ESTADO_CLS[empresa.estado]}`}>{empresa.estado}</span>
                    {empresa.tipo_asociacion && (
                        <span className="px-2.5 py-1 rounded-full text-[15px] font-semibold bg-simar-papel text-simar-texto-2">
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
                    <Stat label="Recolecciones" value={String(metricas?.recolecciones ?? 0)} icon={<Truck className="w-4 h-4 text-simar-marea-tinta" />} />
                    <Stat label="Sólidos" value={`${formatCantidad(metricas?.porUnidad.kg ?? 0)} kg`} icon={<Package className="w-4 h-4 text-simar-arrecife-tinta" />} />
                    <Stat label="Líquidos" value={`${formatCantidad(metricas?.porUnidad.L ?? 0)} L`} icon={<CheckCircle2 className="w-4 h-4 text-simar-coral" />} />
                </div>

                {empresa.descripcion && (
                    <p className="text-base text-simar-texto leading-relaxed">{empresa.descripcion}</p>
                )}

                <div className="space-y-2.5 p-4 rounded-xl bg-simar-papel border border-simar-borde">
                    {empresa.contacto_asociacion && <InfoLine icon={<Users className="w-4 h-4" />} text={empresa.contacto_asociacion} />}
                    {empresa.email && <InfoLine icon={<Mail className="w-4 h-4" />} text={empresa.email} />}
                    {empresa.telefono && <InfoLine icon={<Phone className="w-4 h-4" />} text={empresa.telefono} />}
                    {(empresa.ubicacion || empresa.direccion) && (
                        <InfoLine icon={<MapPin className="w-4 h-4" />} text={[empresa.direccion, empresa.ubicacion].filter(Boolean).join(', ')} />
                    )}
                    {empresa.sitio_web && <InfoLine icon={<Globe className="w-4 h-4" />} text={empresa.sitio_web} />}
                    {!empresa.email && !empresa.telefono && !empresa.contacto_asociacion && (
                        <p className="text-base text-simar-texto-2">Sin datos de contacto.</p>
                    )}
                </div>

                <div>
                    <p className="text-[15px] font-semibold text-simar-texto-2 mb-2">Materiales que recolecta</p>
                    <div className="flex flex-wrap gap-1.5">
                        {empresa.tipos_residuo.length > 0 ? (
                            empresa.tipos_residuo.map((t) => <ResiduoBadge key={t} tipo={t} size="md" />)
                        ) : (
                            <span className="text-base text-simar-texto-2">No especificado (recibe avisos de todos los residuos)</span>
                        )}
                    </div>
                </div>

                {/* Accesos al portal */}
                <div className="rounded-xl border border-simar-borde p-4 space-y-3">
                    <div>
                        <p className="text-base font-bold text-simar-texto">Usuarios con acceso al portal</p>
                        <p className="text-[15px] text-simar-texto-2">
                            Vincula el correo de la persona de la empresa. Si ya tiene cuenta obtiene acceso inmediato;
                            si no, al registrarse con ese correo.
                        </p>
                    </div>
                    <ul className="space-y-1.5">
                        {usuarios.map((u) => (
                            <li key={u.id} className="flex items-center justify-between gap-2 text-base px-3 py-2 rounded-lg bg-simar-papel">
                                <span className="truncate text-simar-texto">
                                    {u.full_name ? `${u.full_name} · ` : ''}{u.email}
                                </span>
                                <button onClick={() => quitarAcceso(u)} className="text-simar-coral hover:text-simar-coral p-1 min-w-[44px] min-h-[44px] inline-flex items-center justify-center" title="Quitar acceso">
                                    <UserX className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                        {invitaciones.map((i) => (
                            <li key={i.id} className="flex items-center justify-between gap-2 text-base px-3 py-2 rounded-lg bg-simar-coral-suave">
                                <span className="truncate text-simar-texto flex items-center gap-1.5">
                                    <Clock className="w-3.5 h-3.5 text-simar-coral flex-shrink-0" />
                                    {i.email} <span className="text-[15px] text-simar-coral">· pendiente de registro desde {formatearFecha(i.created_at)}</span>
                                </span>
                                <button onClick={() => borrarInvitacion(i)} className="text-simar-texto-2 hover:text-simar-coral p-1 min-w-[44px] min-h-[44px] inline-flex items-center justify-center" title="Cancelar invitación">
                                    <Trash2 className="w-4 h-4" />
                                </button>
                            </li>
                        ))}
                        {usuarios.length === 0 && invitaciones.length === 0 && (
                            <li className="text-base text-simar-texto-2">Nadie tiene acceso todavía.</li>
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
                    <span className="text-[15px] font-semibold text-simar-texto-2 mr-1">Cambiar estado:</span>
                    {(['Activo', 'Inactivo', 'Suspendido'] as Estado[])
                        .filter((e) => e !== empresa.estado)
                        .map((e) => (
                            <button
                                key={e}
                                onClick={() => cambiarEstado(e)}
                                className={`px-3 py-1.5 rounded-lg text-[15px] font-semibold ${ESTADO_CLS[e]} hover:opacity-80 transition-opacity`}
                            >
                                {e === 'Activo' ? 'Activar' : e === 'Inactivo' ? 'Marcar inactiva' : 'Suspender'}
                            </button>
                        ))}
                    <button onClick={eliminar} className="ml-auto inline-flex items-center gap-1 text-[15px] font-semibold text-simar-coral hover:underline">
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
            toast.success(inicial ? 'Empresa actualizada' : 'Empresa registrada');
            onGuardado(guardada);
        } catch (err) {
            toast.error(mensajeError(err));
            setGuardando(false);
        }
    };

    return (
        <Modal titulo={inicial ? 'Editar empresa' : 'Nueva empresa recolectora'} onClose={onClose} ancho="max-w-2xl">
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
                    <p className="text-[15px] font-semibold text-simar-texto-2 mb-2">
                        Materiales que recolecta <span className="font-normal text-simar-texto-2">(define qué avisos de inventario recibe)</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {TIPOS_RESIDUO.map((t) => {
                            const activo = datos.tipos_residuo.includes(t);
                            return (
                                <button
                                    key={t}
                                    type="button"
                                    onClick={() => toggleTipo(t)}
                                    className={`px-3 py-1.5 rounded-lg text-[15px] font-semibold border transition-all ${
                                        activo
                                            ? 'bg-simar-marea border-simar-marea-tinta text-white'
                                            : 'border-simar-campo-borde text-simar-texto-2 hover:border-simar-marea-tinta/30'
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
                        {inicial ? 'Guardar cambios' : 'Registrar empresa'}
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-simar-papel rounded-xl p-3 text-center">
            <div className="flex items-center justify-center mb-1">{icon}</div>
            <p className="text-base font-bold text-simar-texto">{value}</p>
            <p className="text-[15px] font-semibold text-simar-texto-2">{label}</p>
        </div>
    );
}

function InfoLine({ icon, text }: { icon: React.ReactNode; text: string }) {
    return (
        <div className="flex items-center gap-2.5 text-base text-simar-texto">
            <span className="text-simar-marea-tinta flex-shrink-0">{icon}</span>
            <span className="truncate font-medium">{text}</span>
        </div>
    );
}

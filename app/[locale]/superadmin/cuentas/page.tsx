'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import {
    Ban,
    MailPlus,
    Pencil,
    RotateCcw,
    Search,
    ShieldMinus,
    ShieldPlus,
    Trash2,
    UserX,
    Users,
    X,
} from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
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
    EstadoVacio,
    ModalConfirmar,
    Pestanas,
    ROL_LABEL,
    RolBadge,
    Tarjeta,
    formatoFecha,
    formatoFechaHora,
    hace,
    tdCls,
    thCls,
} from '@/components/superadmin/ui';
import {
    actualizarCuenta,
    cambiarSuperadmin,
    eliminarCuenta,
    getCuentas,
    getInvitacionesPendientes,
    invitarCuenta,
    reactivarCuenta,
    suspenderCuenta,
    type InvitacionConAsociacion,
} from '@/lib/services/superadmin';
import { cancelarInvitacion, getAsociaciones } from '@/lib/services/asociaciones';
import type { AsociacionRecolectora, CuentaUsuario, RolUsuario } from '@/types/database';

type FiltroRol = 'todos' | RolUsuario | 'superadmin';
type FiltroEstado = 'todas' | 'activas' | 'suspendidas' | 'sin_confirmar';
type Accion = 'editar' | 'suspender' | 'reactivar' | 'superadmin' | 'eliminar';

export default function CuentasPage() {
    const { user } = useAuth();
    const [pestana, setPestana] = useState<'cuentas' | 'invitaciones'>('cuentas');
    const [cuentas, setCuentas] = useState<CuentaUsuario[] | null>(null);
    const [invitaciones, setInvitaciones] = useState<InvitacionConAsociacion[]>([]);
    const [asociaciones, setAsociaciones] = useState<AsociacionRecolectora[]>([]);
    const [error, setError] = useState<string | null>(null);

    const [busqueda, setBusqueda] = useState('');
    const [filtroRol, setFiltroRol] = useState<FiltroRol>('todos');
    const [filtroEstado, setFiltroEstado] = useState<FiltroEstado>('todas');

    const [accion, setAccion] = useState<{ tipo: Accion; cuenta: CuentaUsuario } | null>(null);
    const [invitando, setInvitando] = useState(false);

    const cargar = useCallback(
        () =>
            Promise.all([getCuentas(), getInvitacionesPendientes(), getAsociaciones()])
                .then(([c, i, a]) => {
                    setCuentas(c);
                    setInvitaciones(i);
                    setAsociaciones(a);
                    setError(null);
                })
                .catch((err) => setError(mensajeError(err, 'No se pudieron cargar las cuentas.'))),
        []
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return (cuentas ?? []).filter((c) => {
            if (q && !`${c.email} ${c.full_name ?? ''} ${c.asociacion_nombre ?? ''}`.toLowerCase().includes(q)) return false;
            if (filtroRol === 'superadmin' ? !c.es_superadmin : filtroRol !== 'todos' && c.rol !== filtroRol) return false;
            if (filtroEstado === 'activas' && c.suspendido_at) return false;
            if (filtroEstado === 'suspendidas' && !c.suspendido_at) return false;
            if (filtroEstado === 'sin_confirmar' && c.correo_confirmado) return false;
            return true;
        });
    }, [cuentas, busqueda, filtroRol, filtroEstado]);

    const ejecutar = async (fn: () => Promise<void>, exito: string) => {
        try {
            await fn();
            toast.success(exito);
            setAccion(null);
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
            throw err;
        }
    };

    if (error) return <ErrorCarga mensaje={error} onReintentar={cargar} />;
    if (!cuentas) return <Cargando texto="Cargando cuentas…" />;

    const cuenta = accion?.cuenta;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <Pestanas
                    pestanas={[
                        { id: 'cuentas', label: 'Cuentas', contador: cuentas.length },
                        { id: 'invitaciones', label: 'Invitaciones pendientes', contador: invitaciones.length },
                    ]}
                    activa={pestana}
                    onChange={setPestana}
                />
                <BotonPrimario onClick={() => setInvitando(true)}>
                    <MailPlus className="w-4 h-4" />
                    Invitar cuenta
                </BotonPrimario>
            </div>

            {pestana === 'cuentas' ? (
                <>
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="relative flex-1 min-w-[220px] max-w-md">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className={`${inputCls} pl-9`}
                                placeholder="Buscar por correo, nombre o asociación"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                aria-label="Buscar cuentas"
                            />
                        </div>
                        <select
                            className={`${inputCls} w-auto`}
                            value={filtroRol}
                            onChange={(e) => setFiltroRol(e.target.value as FiltroRol)}
                            aria-label="Filtrar por rol"
                        >
                            <option value="todos">Todos los roles</option>
                            <option value="superadmin">Superadmins</option>
                            <option value="admin">Administradores</option>
                            <option value="recolector">Recolectores</option>
                            <option value="pendiente">Pendientes</option>
                        </select>
                        <select
                            className={`${inputCls} w-auto`}
                            value={filtroEstado}
                            onChange={(e) => setFiltroEstado(e.target.value as FiltroEstado)}
                            aria-label="Filtrar por estado"
                        >
                            <option value="todas">Todos los estados</option>
                            <option value="activas">Activas</option>
                            <option value="suspendidas">Suspendidas</option>
                            <option value="sin_confirmar">Correo sin confirmar</option>
                        </select>
                    </div>

                    <Tarjeta sinPadding>
                        {filtradas.length === 0 ? (
                            <EstadoVacio icono={Users} titulo="Ninguna cuenta coincide con los filtros" />
                        ) : (
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 dark:border-gray-800">
                                        <tr>
                                            <th className={thCls}>Usuario</th>
                                            <th className={thCls}>Rol</th>
                                            <th className={thCls}>Asociación</th>
                                            <th className={thCls}>Alta</th>
                                            <th className={thCls}>Último acceso</th>
                                            <th className={thCls}>Estado</th>
                                            <th className={`${thCls} text-right`}>Acciones</th>
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {filtradas.map((c) => {
                                            const esYo = c.id === user?.id;
                                            const protegida = esYo || c.es_superadmin;
                                            return (
                                                <tr key={c.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40">
                                                    <td className={tdCls}>
                                                        <p className="font-medium text-gray-900 dark:text-white">
                                                            {c.full_name || 'Sin nombre'}
                                                            {esYo && <span className="ml-1.5 text-xs font-normal text-gray-400">(tú)</span>}
                                                        </p>
                                                        <p className="text-xs text-gray-500 dark:text-gray-400">{c.email}</p>
                                                    </td>
                                                    <td className={tdCls}>
                                                        <RolBadge rol={c.rol} superadmin={c.es_superadmin} />
                                                    </td>
                                                    <td className={tdCls}>{c.asociacion_nombre ?? <span className="text-gray-400">—</span>}</td>
                                                    <td className={`${tdCls} whitespace-nowrap`}>{formatoFecha(c.creado_at)}</td>
                                                    <td className={`${tdCls} whitespace-nowrap`} title={formatoFechaHora(c.ultimo_acceso)}>
                                                        {hace(c.ultimo_acceso)}
                                                    </td>
                                                    <td className={tdCls}>
                                                        <EstadoCuenta cuenta={c} />
                                                    </td>
                                                    <td className={`${tdCls} text-right whitespace-nowrap`}>
                                                        <BotonIcono
                                                            icono={Pencil}
                                                            etiqueta={esYo ? 'No puedes cambiar tu propio rol' : 'Cambiar rol o asociación'}
                                                            disabled={esYo}
                                                            onClick={() => setAccion({ tipo: 'editar', cuenta: c })}
                                                        />
                                                        <BotonIcono
                                                            icono={c.es_superadmin ? ShieldMinus : ShieldPlus}
                                                            etiqueta={c.es_superadmin ? 'Quitar superadmin' : 'Hacer superadmin'}
                                                            disabled={esYo || !!c.suspendido_at}
                                                            onClick={() => setAccion({ tipo: 'superadmin', cuenta: c })}
                                                        />
                                                        {c.suspendido_at ? (
                                                            <BotonIcono
                                                                icono={RotateCcw}
                                                                etiqueta="Reactivar cuenta"
                                                                onClick={() => setAccion({ tipo: 'reactivar', cuenta: c })}
                                                            />
                                                        ) : (
                                                            <BotonIcono
                                                                icono={Ban}
                                                                etiqueta={protegida ? 'No se puede suspender' : 'Suspender cuenta'}
                                                                disabled={protegida}
                                                                peligro
                                                                onClick={() => setAccion({ tipo: 'suspender', cuenta: c })}
                                                            />
                                                        )}
                                                        <BotonIcono
                                                            icono={Trash2}
                                                            etiqueta={protegida ? 'No se puede eliminar' : 'Eliminar cuenta'}
                                                            disabled={protegida}
                                                            peligro
                                                            onClick={() => setAccion({ tipo: 'eliminar', cuenta: c })}
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
                <TablaInvitaciones
                    invitaciones={invitaciones}
                    onCancelar={(inv) =>
                        ejecutar(() => cancelarInvitacion(inv.id), `Invitación a ${inv.email} cancelada`).catch(() => {})
                    }
                />
            )}

            {accion?.tipo === 'editar' && cuenta && (
                <ModalEditarAcceso
                    cuenta={cuenta}
                    asociaciones={asociaciones}
                    onClose={() => setAccion(null)}
                    onGuardar={(rol, asociacionId) =>
                        ejecutar(() => actualizarCuenta(cuenta.id, rol, asociacionId), 'Acceso actualizado')
                    }
                />
            )}

            {accion?.tipo === 'suspender' && cuenta && (
                <ModalSuspender
                    cuenta={cuenta}
                    onClose={() => setAccion(null)}
                    onSuspender={(motivo) => ejecutar(() => suspenderCuenta(cuenta.id, motivo), `${cuenta.email} suspendida`)}
                />
            )}

            {accion?.tipo === 'reactivar' && cuenta && (
                <ModalConfirmar
                    titulo="Reactivar cuenta"
                    textoConfirmar="Reactivar"
                    onClose={() => setAccion(null)}
                    onConfirmar={() => ejecutar(() => reactivarCuenta(cuenta.id), `${cuenta.email} reactivada`)}
                >
                    <p>
                        <strong className="text-gray-900 dark:text-white">{cuenta.email}</strong> podrá volver a iniciar sesión
                        con su rol de <strong>{ROL_LABEL[cuenta.rol].toLowerCase()}</strong>.
                    </p>
                </ModalConfirmar>
            )}

            {accion?.tipo === 'superadmin' && cuenta && (
                <ModalConfirmar
                    titulo={cuenta.es_superadmin ? 'Quitar superadmin' : 'Hacer superadmin'}
                    textoConfirmar={cuenta.es_superadmin ? 'Quitar permiso' : 'Otorgar permiso'}
                    peligro={!cuenta.es_superadmin}
                    textoRequerido={cuenta.es_superadmin ? undefined : cuenta.email}
                    onClose={() => setAccion(null)}
                    onConfirmar={() =>
                        ejecutar(
                            () => cambiarSuperadmin(cuenta.id, !cuenta.es_superadmin),
                            cuenta.es_superadmin ? 'Permiso de superadmin retirado' : 'Permiso de superadmin otorgado'
                        )
                    }
                >
                    {cuenta.es_superadmin ? (
                        <p>
                            <strong className="text-gray-900 dark:text-white">{cuenta.email}</strong> dejará de ver este panel.
                            Conserva su rol de administrador.
                        </p>
                    ) : (
                        <p>
                            <strong className="text-gray-900 dark:text-white">{cuenta.email}</strong> tendrá control total:
                            cuentas, suscripciones, configuración y bitácora. También quedará como administrador del centro
                            de acopio.
                        </p>
                    )}
                </ModalConfirmar>
            )}

            {accion?.tipo === 'eliminar' && cuenta && (
                <ModalConfirmar
                    titulo="Eliminar cuenta"
                    textoConfirmar="Eliminar definitivamente"
                    peligro
                    textoRequerido={cuenta.email}
                    onClose={() => setAccion(null)}
                    onConfirmar={() => ejecutar(() => eliminarCuenta(cuenta.id), `${cuenta.email} eliminada`)}
                >
                    <p>
                        Se borrará la cuenta de <strong className="text-gray-900 dark:text-white">{cuenta.email}</strong> y su
                        perfil. Los manifiestos, solicitudes y mensajes que haya registrado se conservan sin autor.
                    </p>
                    <p className="text-red-600 dark:text-red-400 font-medium">
                        No se puede deshacer. Si sólo quieres quitarle el acceso, suspéndela.
                    </p>
                </ModalConfirmar>
            )}

            {invitando && (
                <ModalInvitar
                    asociaciones={asociaciones}
                    onClose={() => setInvitando(false)}
                    onInvitar={async (email, rol, asociacionId) => {
                        try {
                            const r = await invitarCuenta(email, rol, asociacionId);
                            toast.success(
                                r === 'vinculado'
                                    ? `${email} ya tenía cuenta: su acceso quedó actualizado`
                                    : `Invitación registrada: ${email} obtendrá acceso al registrarse`
                            );
                            setInvitando(false);
                            await cargar();
                        } catch (err) {
                            toast.error(mensajeError(err));
                        }
                    }}
                />
            )}
        </div>
    );
}

function EstadoCuenta({ cuenta }: { cuenta: CuentaUsuario }) {
    if (cuenta.suspendido_at) {
        return (
            <span
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-red-600 dark:text-red-400"
                title={cuenta.motivo_suspension ? `Motivo: ${cuenta.motivo_suspension}` : undefined}
            >
                <UserX className="w-3.5 h-3.5" />
                Suspendida
            </span>
        );
    }
    if (!cuenta.correo_confirmado) {
        return <span className="text-xs font-semibold text-amber-600 dark:text-amber-400">Correo sin confirmar</span>;
    }
    return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-600 dark:text-emerald-400">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
            Activa
        </span>
    );
}

function TablaInvitaciones({
    invitaciones,
    onCancelar,
}: {
    invitaciones: InvitacionConAsociacion[];
    onCancelar: (inv: InvitacionConAsociacion) => void;
}) {
    if (invitaciones.length === 0) {
        return (
            <Tarjeta>
                <EstadoVacio
                    icono={MailPlus}
                    titulo="Sin invitaciones pendientes"
                    texto="Cuando invites un correo que aún no tiene cuenta, aparecerá aquí hasta que se registre."
                />
            </Tarjeta>
        );
    }
    return (
        <Tarjeta sinPadding>
            <div className="overflow-x-auto">
                <table className="w-full">
                    <thead className="border-b border-gray-200 dark:border-gray-800">
                        <tr>
                            <th className={thCls}>Correo</th>
                            <th className={thCls}>Rol</th>
                            <th className={thCls}>Asociación</th>
                            <th className={thCls}>Invitado</th>
                            <th className={`${thCls} text-right`}>Acciones</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                        {invitaciones.map((inv) => (
                            <tr key={inv.id}>
                                <td className={`${tdCls} font-medium text-gray-900 dark:text-white`}>{inv.email}</td>
                                <td className={tdCls}>
                                    <RolBadge rol={inv.rol} />
                                </td>
                                <td className={tdCls}>{inv.asociacion?.nombre_asociacion ?? <span className="text-gray-400">—</span>}</td>
                                <td className={`${tdCls} whitespace-nowrap`}>{hace(inv.created_at)}</td>
                                <td className={`${tdCls} text-right`}>
                                    <BotonIcono icono={X} etiqueta="Cancelar invitación" peligro onClick={() => onCancelar(inv)} />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </Tarjeta>
    );
}

function SelectorAsociacion({
    asociaciones,
    valor,
    onChange,
}: {
    asociaciones: AsociacionRecolectora[];
    valor: number | null;
    onChange: (id: number | null) => void;
}) {
    return (
        <Campo label="Asociación">
            <select
                className={inputCls}
                value={valor ?? ''}
                onChange={(e) => onChange(e.target.value ? Number(e.target.value) : null)}
                required
            >
                <option value="">Selecciona una asociación…</option>
                {asociaciones.map((a) => (
                    <option key={a.id} value={a.id}>
                        {a.nombre_asociacion}
                        {a.estado !== 'Activo' ? ` (${a.estado.toLowerCase()})` : ''}
                    </option>
                ))}
            </select>
        </Campo>
    );
}

function ModalEditarAcceso({
    cuenta,
    asociaciones,
    onClose,
    onGuardar,
}: {
    cuenta: CuentaUsuario;
    asociaciones: AsociacionRecolectora[];
    onClose: () => void;
    onGuardar: (rol: RolUsuario, asociacionId: number | null) => Promise<void>;
}) {
    const [rol, setRol] = useState<RolUsuario>(cuenta.rol);
    const [asociacionId, setAsociacionId] = useState<number | null>(cuenta.asociacion_id);
    const [guardando, setGuardando] = useState(false);

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (rol === 'recolector' && !asociacionId) return toast.error('Elige la asociación del recolector.');
        setGuardando(true);
        try {
            await onGuardar(rol, asociacionId);
        } catch {
            // el aviso ya se mostró
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo="Cambiar acceso" subtitulo={cuenta.email} onClose={onClose}>
            <form onSubmit={guardar} className="space-y-4">
                <Campo
                    label="Rol"
                    ayuda={
                        cuenta.es_superadmin
                            ? 'Es superadmin: quita primero ese permiso para cambiarle el rol.'
                            : 'Pendiente = sin acceso a ningún panel.'
                    }
                >
                    <select
                        className={inputCls}
                        value={rol}
                        onChange={(e) => setRol(e.target.value as RolUsuario)}
                        disabled={cuenta.es_superadmin}
                    >
                        <option value="admin">Administrador (centro de acopio)</option>
                        <option value="recolector">Recolector (empresa)</option>
                        <option value="pendiente">Pendiente (sin acceso)</option>
                    </select>
                </Campo>
                {rol === 'recolector' && (
                    <SelectorAsociacion asociaciones={asociaciones} valor={asociacionId} onChange={setAsociacionId} />
                )}
                <div className="flex justify-end gap-2 pt-2">
                    <BotonSecundario type="button" onClick={onClose}>
                        Cancelar
                    </BotonSecundario>
                    <BotonPrimario type="submit" cargando={guardando} disabled={cuenta.es_superadmin}>
                        Guardar
                    </BotonPrimario>
                </div>
            </form>
        </Modal>
    );
}

function ModalSuspender({
    cuenta,
    onClose,
    onSuspender,
}: {
    cuenta: CuentaUsuario;
    onClose: () => void;
    onSuspender: (motivo: string | null) => Promise<void>;
}) {
    const [motivo, setMotivo] = useState('');

    return (
        <ModalConfirmar
            titulo="Suspender cuenta"
            textoConfirmar="Suspender"
            peligro
            onClose={onClose}
            onConfirmar={() => onSuspender(motivo.trim() || null)}
        >
            <p>
                <strong className="text-gray-900 dark:text-white">{cuenta.email}</strong> perderá el acceso de inmediato: se
                cierran sus sesiones y no podrá volver a iniciar sesión hasta que la reactives. Sus datos no se borran.
            </p>
            <Campo label="Motivo (opcional, sólo lo ven los superadmins)">
                <input className={inputCls} value={motivo} onChange={(e) => setMotivo(e.target.value)} maxLength={200} />
            </Campo>
        </ModalConfirmar>
    );
}

function ModalInvitar({
    asociaciones,
    onClose,
    onInvitar,
}: {
    asociaciones: AsociacionRecolectora[];
    onClose: () => void;
    onInvitar: (email: string, rol: 'admin' | 'recolector', asociacionId: number | null) => Promise<void>;
}) {
    const [email, setEmail] = useState('');
    const [rol, setRol] = useState<'admin' | 'recolector'>('recolector');
    const [asociacionId, setAsociacionId] = useState<number | null>(null);
    const [enviando, setEnviando] = useState(false);

    const enviar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim())) return toast.error('El correo no es válido.');
        if (rol === 'recolector' && !asociacionId) return toast.error('Elige la asociación del recolector.');
        setEnviando(true);
        await onInvitar(email.trim(), rol, asociacionId);
        setEnviando(false);
    };

    return (
        <Modal
            titulo="Invitar cuenta"
            subtitulo="Si el correo ya tiene cuenta, su acceso cambia de inmediato; si no, al registrarse."
            onClose={onClose}
        >
            <form onSubmit={enviar} className="space-y-4">
                <Campo label="Correo electrónico">
                    <input
                        type="email"
                        className={inputCls}
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="nombre@empresa.com"
                        autoFocus
                        required
                    />
                </Campo>
                <Campo label="Rol">
                    <select className={inputCls} value={rol} onChange={(e) => setRol(e.target.value as 'admin' | 'recolector')}>
                        <option value="recolector">Recolector (empresa)</option>
                        <option value="admin">Administrador (centro de acopio)</option>
                    </select>
                </Campo>
                {rol === 'recolector' && (
                    <SelectorAsociacion asociaciones={asociaciones} valor={asociacionId} onChange={setAsociacionId} />
                )}
                <p className="text-xs text-gray-500 dark:text-gray-400">
                    SiMAR no envía correos: avísale a la persona que se registre en la página de inicio con este correo.
                </p>
                <div className="flex justify-end gap-2 pt-2">
                    <BotonSecundario type="button" onClick={onClose}>
                        Cancelar
                    </BotonSecundario>
                    <BotonPrimario type="submit" cargando={enviando}>
                        Invitar
                    </BotonPrimario>
                </div>
            </form>
        </Modal>
    );
}

'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Building2, FileText, Edit3, Save, Globe, User, X, Home } from 'lucide-react';
import { TIPOS_RESIDUO, TIPO_RESIDUO_LABEL, type TipoResiduo } from '@/lib/constants/residuos';
import { actualizarMiAsociacion, type MiAsociacionInput } from '@/lib/services/asociaciones';
import { cambiarContrasena } from '@/lib/services/perfil';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { useAuth } from '@/components/layout/AuthProvider';
import { BotonPrimario, Cargando, ResiduoBadge, mensajeError } from '@/components/asociaciones/ui';
import type { AsociacionRecolectora } from '@/types/database';

function aFormulario(a: AsociacionRecolectora): MiAsociacionInput {
    return {
        contacto_asociacion: a.contacto_asociacion,
        email: a.email,
        telefono: a.telefono,
        direccion: a.direccion,
        ubicacion: a.ubicacion,
        sitio_web: a.sitio_web,
        descripcion: a.descripcion,
        tipos_residuo: a.tipos_residuo,
    };
}

export default function PerfilPage() {
    const { asociacion, cargando, recargarPerfil } = useRecolector();
    const [editing, setEditing] = useState(false);
    const [form, setForm] = useState<MiAsociacionInput | null>(null);
    const [guardando, setGuardando] = useState(false);

    if (cargando) return <Cargando />;
    if (!asociacion) {
        return <p className="text-sm text-gray-500 dark:text-gray-400">Tu usuario no está vinculado a una asociación.</p>;
    }

    const datos = editing && form ? form : aFormulario(asociacion);
    const set = <K extends keyof MiAsociacionInput>(k: K, v: MiAsociacionInput[K]) =>
        setForm((f) => (f ? { ...f, [k]: v } : f));

    const empezar = () => {
        setForm(aFormulario(asociacion));
        setEditing(true);
    };

    const guardar = async () => {
        if (!form) return;
        if (form.email && !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(form.email)) {
            return toast.error('El correo no es válido.');
        }
        setGuardando(true);
        try {
            await actualizarMiAsociacion(form);
            await recargarPerfil();
            toast.success('Datos actualizados');
            setEditing(false);
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const toggleTipo = (t: TipoResiduo) =>
        set('tipos_residuo', datos.tipos_residuo.includes(t) ? datos.tipos_residuo.filter((x) => x !== t) : [...datos.tipos_residuo, t]);

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Empresa */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5 gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div className="min-w-0">
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white truncate">{asociacion.nombre_asociacion}</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                    {asociacion.tipo_asociacion || 'Asociación recolectora'} · {asociacion.estado}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-3">
                            {editing && (
                                <button
                                    onClick={() => setEditing(false)}
                                    className="inline-flex items-center gap-1 text-sm font-semibold text-gray-500 hover:underline"
                                >
                                    <X className="w-4 h-4" /> Cancelar
                                </button>
                            )}
                            <button
                                onClick={editing ? guardar : empezar}
                                disabled={guardando}
                                className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                            >
                                {editing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                                {editing ? (guardando ? 'Guardando…' : 'Guardar') : 'Editar'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field label="RFC" icon={FileText} value={asociacion.rfc ?? ''} editing={false} ayuda={editing ? 'Sólo el centro de acopio puede cambiarlo' : undefined} />
                        <Field label="Persona de contacto" icon={User} value={datos.contacto_asociacion ?? ''} editing={editing} onChange={(v) => set('contacto_asociacion', v || null)} />
                        <Field label="Email" icon={Mail} value={datos.email ?? ''} editing={editing} onChange={(v) => set('email', v || null)} />
                        <Field label="Teléfono" icon={Phone} value={datos.telefono ?? ''} editing={editing} onChange={(v) => set('telefono', v || null)} />
                        <Field label="Dirección" icon={Home} value={datos.direccion ?? ''} editing={editing} onChange={(v) => set('direccion', v || null)} />
                        <Field label="Ciudad / estado" icon={MapPin} value={datos.ubicacion ?? ''} editing={editing} onChange={(v) => set('ubicacion', v || null)} />
                        <Field label="Sitio web" icon={Globe} value={datos.sitio_web ?? ''} editing={editing} onChange={(v) => set('sitio_web', v || null)} wide />
                        <Field label="Descripción" icon={Building2} value={datos.descripcion ?? ''} editing={editing} onChange={(v) => set('descripcion', v || null)} wide multiline />
                    </div>
                </div>

                {/* Tipos de residuo */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tipos de residuo</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">
                        Materiales que tu empresa recolecta. Recibirás avisos cuando haya nuevos lotes de estos residuos.
                    </p>
                    <div className="flex flex-wrap gap-2">
                        {editing
                            ? TIPOS_RESIDUO.map((t) => {
                                  const activo = datos.tipos_residuo.includes(t);
                                  return (
                                      <button
                                          key={t}
                                          type="button"
                                          onClick={() => toggleTipo(t)}
                                          className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-all ${
                                              activo
                                                  ? 'bg-emerald-600 border-emerald-600 text-white'
                                                  : 'border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 hover:border-emerald-400'
                                          }`}
                                      >
                                          {TIPO_RESIDUO_LABEL[t]}
                                      </button>
                                  );
                              })
                            : datos.tipos_residuo.length > 0
                              ? datos.tipos_residuo.map((t) => <ResiduoBadge key={t} tipo={t} size="md" />)
                              : <p className="text-sm text-gray-400">Sin especificar: recibirás avisos de todos los residuos.</p>}
                    </div>
                </div>
            </div>

            <CambioContrasena />
        </div>
    );
}

function CambioContrasena() {
    const { user } = useAuth();
    const [actual, setActual] = useState('');
    const [nueva, setNueva] = useState('');
    const [confirmar, setConfirmar] = useState('');
    const [guardando, setGuardando] = useState(false);

    const guardar = async () => {
        if (!user?.email) return;
        if (nueva.length < 6) return toast.error('La nueva contraseña debe tener al menos 6 caracteres.');
        if (nueva !== confirmar) return toast.error('Las contraseñas no coinciden.');
        setGuardando(true);
        try {
            await cambiarContrasena(user.email, actual, nueva);
            toast.success('Contraseña actualizada');
            setActual('');
            setNueva('');
            setConfirmar('');
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm max-w-xl">
            <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Seguridad</h3>
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Cuenta: {user?.email}</p>
            <div className="space-y-3">
                <PasswordInput label="Contraseña actual" value={actual} onChange={setActual} autoComplete="current-password" />
                <PasswordInput label="Nueva contraseña" value={nueva} onChange={setNueva} autoComplete="new-password" />
                <PasswordInput label="Confirmar nueva contraseña" value={confirmar} onChange={setConfirmar} autoComplete="new-password" />
                <BotonPrimario
                    onClick={guardar}
                    cargando={guardando}
                    disabled={!actual || !nueva || !confirmar}
                    className="!bg-emerald-600 hover:!bg-emerald-700"
                >
                    Actualizar contraseña
                </BotonPrimario>
            </div>
        </div>
    );
}

function Field({
    label,
    icon: Icon,
    value,
    editing,
    onChange,
    wide,
    multiline,
    ayuda,
}: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    editing: boolean;
    onChange?: (v: string) => void;
    wide?: boolean;
    multiline?: boolean;
    ayuda?: string;
}) {
    const cls =
        'mt-1 w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500';
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </label>
            {editing && onChange ? (
                multiline ? (
                    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
                ) : (
                    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
                )
            ) : (
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white whitespace-pre-wrap">{value || '—'}</p>
            )}
            {ayuda && <p className="text-[11px] text-gray-400 mt-0.5">{ayuda}</p>}
        </div>
    );
}

function PasswordInput({
    label,
    value,
    onChange,
    autoComplete,
}: {
    label: string;
    value: string;
    onChange: (v: string) => void;
    autoComplete: string;
}) {
    return (
        <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
            <input
                type="password"
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
                className="mt-1 w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
    );
}

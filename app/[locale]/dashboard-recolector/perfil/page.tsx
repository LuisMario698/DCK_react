'use client';

import { useState } from 'react';
import { toast } from 'sonner';
import { Mail, Phone, MapPin, Building2, FileText, Edit3, Save, Globe, User, X, Home, Check } from 'lucide-react';
import { TIPOS_RESIDUO, TIPO_RESIDUO_LABEL, type TipoResiduo } from '@/lib/constants/residuos';
import { actualizarMiAsociacion, type MiAsociacionInput } from '@/lib/services/asociaciones';
import { cambiarContrasena } from '@/lib/services/perfil';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { useAuth } from '@/components/layout/AuthProvider';
import { BotonPrimario, Cargando, ResiduoBadge, inputCls, mensajeError } from '@/components/asociaciones/ui';
import { claseChip } from '@/components/ui/simar';
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
        return <p className="text-base text-simar-texto-2">Tu usuario no está vinculado a una asociación.</p>;
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
        <div className="space-y-6 movil:space-y-3">
            {/* Empresa a la izquierda; tipos de residuo y seguridad en la columna derecha (sin huecos) */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start movil:gap-3">
                {/* Empresa */}
                <div className="simar-aparece lg:col-span-2 bg-simar-superficie border border-simar-borde rounded-[28px] p-6 md:p-7 shadow-simar">
                    <div className="flex flex-wrap items-center justify-between gap-4 pb-5 mb-6 border-b border-simar-borde-suave movil:gap-3 movil:pb-4 movil:mb-4">
                        <div className="flex items-center gap-4 min-w-0">
                            <span className="w-14 h-14 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center flex-shrink-0">
                                <Building2 className="w-7 h-7" strokeWidth={2} />
                            </span>
                            <div className="min-w-0">
                                <h3 className="text-[23px] font-extrabold leading-tight text-simar-texto truncate movil:whitespace-normal">{asociacion.nombre_asociacion}</h3>
                                <p className="text-base text-simar-texto-2">
                                    {asociacion.tipo_asociacion || 'Asociación recolectora'} · {asociacion.estado}
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-3">
                            {editing && (
                                <button
                                    onClick={() => setEditing(false)}
                                    className="simar-presiona min-h-[52px] px-5 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta inline-flex items-center gap-2"
                                >
                                    <X className="w-5 h-5" /> Cancelar
                                </button>
                            )}
                            <button
                                onClick={editing ? guardar : empezar}
                                disabled={guardando}
                                className={`simar-presiona min-h-[52px] px-5 rounded-2xl text-[17px] font-bold inline-flex items-center gap-2 disabled:opacity-50 ${
                                    editing
                                        ? 'bg-simar-marea hover:bg-simar-marea-hover text-white'
                                        : 'border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto hover:border-simar-marea-tinta'
                                }`}
                            >
                                {editing ? <Save className="w-5 h-5" /> : <Edit3 className="w-5 h-5" />}
                                {editing ? (guardando ? 'Guardando…' : 'Guardar') : 'Editar'}
                            </button>
                        </div>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-5 movil:gap-y-3.5">
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

                <div className="space-y-6 movil:space-y-3">
                    {/* Tipos de residuo */}
                    <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] p-6 md:p-7 shadow-simar" style={{ animationDelay: '0.06s' }}>
                        <h3 className="text-[21px] font-extrabold text-simar-texto mb-1">Tipos de residuo</h3>
                        <p className="text-base text-simar-texto-2 mb-4">
                            Materiales que tu empresa recolecta. Recibirás avisos cuando haya nuevos lotes de estos residuos.
                        </p>
                        <div className="flex flex-wrap gap-2.5">
                            {editing
                                ? TIPOS_RESIDUO.map((t) => {
                                      const activo = datos.tipos_residuo.includes(t);
                                      // Fichas de 48 px: la elegida lleva palomita, no sólo color
                                      return (
                                          <button
                                              key={t}
                                              type="button"
                                              onClick={() => toggleTipo(t)}
                                              aria-pressed={activo}
                                              className={`${claseChip(activo)} inline-flex items-center gap-2`}
                                          >
                                              {activo && <Check className="w-[18px] h-[18px]" strokeWidth={2.6} />}
                                              {TIPO_RESIDUO_LABEL[t]}
                                          </button>
                                      );
                                  })
                                : datos.tipos_residuo.length > 0
                                  ? datos.tipos_residuo.map((t) => <ResiduoBadge key={t} tipo={t} size="md" />)
                                  : <p className="text-base text-simar-texto-2">Sin especificar: recibirás avisos de todos los residuos.</p>}
                        </div>
                    </div>

                    <CambioContrasena />
                </div>
            </div>
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
        <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] p-6 md:p-7 shadow-simar" style={{ animationDelay: '0.12s' }}>
            <h3 className="text-[21px] font-extrabold text-simar-texto mb-1">Seguridad</h3>
            <p className="text-base text-simar-texto-2 mb-5 break-all">Cuenta: {user?.email}</p>
            <div className="space-y-4">
                <PasswordInput label="Contraseña actual" value={actual} onChange={setActual} autoComplete="current-password" />
                <PasswordInput label="Nueva contraseña" value={nueva} onChange={setNueva} autoComplete="new-password" />
                <PasswordInput label="Confirmar nueva contraseña" value={confirmar} onChange={setConfirmar} autoComplete="new-password" />
                <BotonPrimario
                    onClick={guardar}
                    cargando={guardando}
                    disabled={!actual || !nueva || !confirmar}
                    className="w-full min-h-[56px]"
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
    // Campos con el borde de 2 px del lenguaje SiMAR (inputCls)
    const cls = `mt-2 ${inputCls}`;
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <label className="text-[15px] font-bold text-simar-texto-2 flex items-center gap-2">
                <Icon className="w-[18px] h-[18px]" />
                {label}
            </label>
            {editing && onChange ? (
                multiline ? (
                    <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
                ) : (
                    <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className={cls} />
                )
            ) : (
                <p className="mt-1 text-[17px] text-simar-texto whitespace-pre-wrap">{value || '—'}</p>
            )}
            {ayuda && <p className="text-[15px] text-simar-texto-2 mt-1">{ayuda}</p>}
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
            <label className="block mb-2 text-[17px] font-bold text-simar-texto">{label}</label>
            <input
                type="password"
                value={value}
                autoComplete={autoComplete}
                onChange={(e) => onChange(e.target.value)}
                className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
            />
        </div>
    );
}

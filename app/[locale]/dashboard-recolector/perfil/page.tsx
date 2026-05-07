'use client';

import { useState } from 'react';
import { Mail, Phone, MapPin, Building2, FileText, Edit3, Save } from 'lucide-react';
import { toast } from 'sonner';
import { EMPRESA_PERFIL_MOCK, TIPO_RESIDUO_LABEL, TIPO_RESIDUO_COLOR } from '@/lib/mock/recolector';

export default function PerfilPage() {
    const [editing, setEditing] = useState(false);
    const [perfil, setPerfil] = useState(EMPRESA_PERFIL_MOCK);

    const guardar = () => {
        setEditing(false);
        toast.success('Datos actualizados');
    };

    return (
        <div className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Empresa */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <div className="flex items-center justify-between mb-5">
                        <div className="flex items-center gap-3">
                            <div className="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                                <Building2 className="w-6 h-6" />
                            </div>
                            <div>
                                <h3 className="text-lg font-bold text-gray-900 dark:text-white">Información de la empresa</h3>
                                <p className="text-xs text-gray-500 dark:text-gray-400">Datos generales</p>
                            </div>
                        </div>
                        <button
                            onClick={editing ? guardar : () => setEditing(true)}
                            className="inline-flex items-center gap-2 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                            {editing ? <Save className="w-4 h-4" /> : <Edit3 className="w-4 h-4" />}
                            {editing ? 'Guardar' : 'Editar'}
                        </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <Field
                            label="Nombre"
                            icon={Building2}
                            value={perfil.nombre}
                            editing={editing}
                            onChange={(v) => setPerfil({ ...perfil, nombre: v })}
                        />
                        <Field
                            label="Email"
                            icon={Mail}
                            value={perfil.email}
                            editing={editing}
                            onChange={(v) => setPerfil({ ...perfil, email: v })}
                        />
                        <Field
                            label="Teléfono"
                            icon={Phone}
                            value={perfil.telefono}
                            editing={editing}
                            onChange={(v) => setPerfil({ ...perfil, telefono: v })}
                        />
                        <Field
                            label="RFC"
                            icon={FileText}
                            value={perfil.rfc}
                            editing={editing}
                            onChange={(v) => setPerfil({ ...perfil, rfc: v })}
                        />
                        <Field
                            label="Ubicación"
                            icon={MapPin}
                            value={perfil.ubicacion}
                            editing={editing}
                            onChange={(v) => setPerfil({ ...perfil, ubicacion: v })}
                            wide
                        />
                    </div>
                </div>

                {/* Tipos de residuo */}
                <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Tipos de residuo</h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mb-4">Materiales que tu empresa recolecta</p>
                    <div className="flex flex-wrap gap-2">
                        {perfil.tiposResiduo.map((t) => (
                            <span
                                key={t}
                                className={`px-3 py-1.5 rounded-lg text-sm font-medium ${TIPO_RESIDUO_COLOR[t]}`}
                            >
                                {TIPO_RESIDUO_LABEL[t]}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {/* Cambiar contraseña */}
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6 shadow-sm max-w-xl">
                <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Seguridad</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-5">Cambia tu contraseña periódicamente</p>
                <div className="space-y-3">
                    <PasswordInput label="Contraseña actual" />
                    <PasswordInput label="Nueva contraseña" />
                    <PasswordInput label="Confirmar nueva contraseña" />
                    <button
                        onClick={() => toast.success('Contraseña actualizada (mock)')}
                        className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-5 py-2.5 rounded-lg transition-colors shadow-sm"
                    >
                        Actualizar contraseña
                    </button>
                </div>
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
}: {
    label: string;
    icon: React.ComponentType<{ className?: string }>;
    value: string;
    editing: boolean;
    onChange: (v: string) => void;
    wide?: boolean;
}) {
    return (
        <div className={wide ? 'sm:col-span-2' : ''}>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400 flex items-center gap-1.5">
                <Icon className="w-3.5 h-3.5" />
                {label}
            </label>
            {editing ? (
                <input
                    type="text"
                    value={value}
                    onChange={(e) => onChange(e.target.value)}
                    className="mt-1 w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
            ) : (
                <p className="mt-1 text-sm font-medium text-gray-900 dark:text-white">{value}</p>
            )}
        </div>
    );
}

function PasswordInput({ label }: { label: string }) {
    return (
        <div>
            <label className="text-xs font-medium text-gray-500 dark:text-gray-400">{label}</label>
            <input
                type="password"
                className="mt-1 w-full text-sm bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg px-3 py-2 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
        </div>
    );
}

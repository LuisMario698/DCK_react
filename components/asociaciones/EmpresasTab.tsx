'use client';

import { useState } from 'react';
import { Star, Mail, Phone, MapPin, Globe, Building2, MessageSquare, X, CheckCircle2, Search } from 'lucide-react';
import {
    EMPRESAS_MOCK,
    TIPO_RESIDUO_LABEL,
    TIPO_RESIDUO_COLOR,
    type EmpresaRecolectora,
} from '@/lib/mock/asociaciones';

export function EmpresasTab({
    onAbrirChat,
}: {
    onAbrirChat?: (empresaId: string) => void;
}) {
    const [busqueda, setBusqueda] = useState('');
    const [seleccionada, setSeleccionada] = useState<EmpresaRecolectora | null>(null);

    const filtradas = EMPRESAS_MOCK.filter((e) =>
        e.nombre.toLowerCase().includes(busqueda.toLowerCase()) ||
        e.ubicacion.toLowerCase().includes(busqueda.toLowerCase())
    );

    return (
        <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm p-5 sm:p-6 transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between gap-3 flex-wrap mb-5">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Directorio de empresas</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Información pública de empresas recolectoras registradas.
                        </p>
                    </div>
                    <div className="relative w-full sm:w-80">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar por nombre o ubicación…"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white focus:bg-white dark:focus:bg-gray-900 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {filtradas.map((emp, idx) => (
                        <div
                            key={emp.id}
                            className="group relative border border-gray-200 dark:border-gray-800 rounded-2xl p-5 hover:border-blue-400 dark:hover:border-blue-600 hover:shadow-xl hover:shadow-blue-100 dark:hover:shadow-blue-900/20 hover:-translate-y-1 transition-all duration-300 bg-white dark:bg-gray-900 overflow-hidden animate-fade-in"
                            style={{ animationDelay: `${idx * 60}ms` }}
                        >
                            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-blue-500 to-blue-700 opacity-0 group-hover:opacity-100 transition-opacity" />

                            <div className="flex items-start gap-3 mb-4">
                                <div className="flex-shrink-0 w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xl shadow-lg shadow-blue-600/20 group-hover:scale-110 group-hover:rotate-3 transition-transform duration-300">
                                    {emp.nombre.charAt(0)}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{emp.nombre}</p>
                                    <p className="text-xs text-gray-500 dark:text-gray-400 flex items-center gap-1 mt-1">
                                        <MapPin className="w-3 h-3 flex-shrink-0" />
                                        <span className="truncate">{emp.ubicacion}</span>
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-center gap-3 text-xs mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
                                <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 font-bold">
                                    <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                                    {emp.calificacion.toFixed(1)}
                                </span>
                                <span className="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="font-semibold text-gray-900 dark:text-white">{emp.convenios}</span> convenios
                                </span>
                            </div>

                            <div className="flex flex-wrap gap-1.5 mb-5 min-h-[28px]">
                                {emp.tiposResiduo.slice(0, 3).map((t) => (
                                    <span
                                        key={t}
                                        className={`inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold ${TIPO_RESIDUO_COLOR[t]}`}
                                    >
                                        {TIPO_RESIDUO_LABEL[t]}
                                    </span>
                                ))}
                                {emp.tiposResiduo.length > 3 && (
                                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                                        +{emp.tiposResiduo.length - 3}
                                    </span>
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
                    ))}
                </div>

                {filtradas.length === 0 && (
                    <div className="text-center py-16">
                        <div className="inline-flex flex-col items-center gap-3">
                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                <Search className="w-7 h-7 text-blue-500" />
                            </div>
                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                No se encontraron empresas con ese criterio.
                            </p>
                        </div>
                    </div>
                )}
            </div>

            {seleccionada && (
                <PerfilModal
                    empresa={seleccionada}
                    onClose={() => setSeleccionada(null)}
                    onAbrirChat={() => {
                        onAbrirChat?.(seleccionada.id);
                        setSeleccionada(null);
                    }}
                />
            )}
        </div>
    );
}

function PerfilModal({
    empresa,
    onClose,
    onAbrirChat,
}: {
    empresa: EmpresaRecolectora;
    onClose: () => void;
    onAbrirChat: () => void;
}) {
    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in" onClick={onClose}>
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative h-28 bg-gradient-to-br from-blue-500 via-blue-600 to-indigo-700 overflow-hidden">
                    <div className="absolute inset-0 opacity-20">
                        <div className="absolute -top-12 -right-8 w-40 h-40 bg-white/40 rounded-full blur-2xl" />
                        <div className="absolute -bottom-12 -left-8 w-40 h-40 bg-blue-300/40 rounded-full blur-2xl" />
                    </div>
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 p-1.5 rounded-full bg-white/15 hover:bg-white/30 text-white transition-all hover:rotate-90 duration-300 backdrop-blur-sm"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
                <div className="px-6 pb-6 -mt-12">
                    <div className="flex items-end gap-4 mb-5">
                        <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 border-4 border-white dark:border-gray-900 flex items-center justify-center text-white font-bold text-4xl shadow-xl">
                            {empresa.nombre.charAt(0)}
                        </div>
                        <div className="flex-1 pb-1 min-w-0">
                            <p className="text-lg font-bold text-gray-900 dark:text-white truncate">{empresa.nombre}</p>
                            <div className="flex items-center gap-1.5 text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                                <Building2 className="w-3.5 h-3.5 flex-shrink-0" />
                                <span>RFC {empresa.rfc}</span>
                            </div>
                        </div>
                    </div>

                    <div className="grid grid-cols-3 gap-3 mb-5">
                        <Stat label="Calificación" value={empresa.calificacion.toFixed(1)} icon={<Star className="w-4 h-4 fill-amber-400 text-amber-400" />} />
                        <Stat label="Convenios" value={empresa.convenios.toString()} icon={<CheckCircle2 className="w-4 h-4 text-emerald-500" />} />
                        <Stat label="Materiales" value={empresa.tiposResiduo.length.toString()} icon={<Building2 className="w-4 h-4 text-blue-500" />} />
                    </div>

                    <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed mb-5">
                        {empresa.descripcion}
                    </p>

                    <div className="space-y-2.5 mb-5 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800">
                        <InfoLine icon={<Mail className="w-4 h-4" />} text={empresa.email} />
                        <InfoLine icon={<Phone className="w-4 h-4" />} text={empresa.telefono} />
                        <InfoLine icon={<MapPin className="w-4 h-4" />} text={empresa.ubicacion} />
                        {empresa.sitioWeb && <InfoLine icon={<Globe className="w-4 h-4" />} text={empresa.sitioWeb} />}
                    </div>

                    <div className="mb-6">
                        <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-2">Materiales que recolecta</p>
                        <div className="flex flex-wrap gap-1.5">
                            {empresa.tiposResiduo.map((t) => (
                                <span
                                    key={t}
                                    className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TIPO_RESIDUO_COLOR[t]}`}
                                >
                                    {TIPO_RESIDUO_LABEL[t]}
                                </span>
                            ))}
                        </div>
                    </div>

                    <button
                        onClick={onAbrirChat}
                        className="w-full inline-flex items-center justify-center gap-2 px-4 py-3 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-bold rounded-xl shadow-lg shadow-blue-600/30 hover:shadow-blue-600/50 transition-all hover:scale-[1.02] active:scale-95"
                    >
                        <MessageSquare className="w-4 h-4" />
                        Iniciar chat con {empresa.nombre.split(' ')[0]}
                    </button>
                </div>
            </div>
        </div>
    );
}

function Stat({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) {
    return (
        <div className="bg-gray-50 dark:bg-gray-800 rounded-xl p-3 text-center hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <div className="flex items-center justify-center mb-1">{icon}</div>
            <p className="text-lg font-bold text-gray-900 dark:text-white">{value}</p>
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

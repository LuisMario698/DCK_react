'use client';

import { useState } from 'react';
import { CheckCircle2, XCircle, Clock, Truck, Eye, MessageSquare, Star, Inbox, X } from 'lucide-react';
import {
    SOLICITUDES_ENTRANTES_MOCK,
    EMPRESAS_MOCK,
    TIPO_RESIDUO_LABEL,
    TIPO_RESIDUO_COLOR,
    formatFechaCorta,
    type EstadoSolicitud,
    type SolicitudEntrante,
    type EmpresaRecolectora,
} from '@/lib/mock/asociaciones';

const TABS: { value: EstadoSolicitud | 'todas'; label: string }[] = [
    { value: 'todas', label: 'Todas' },
    { value: 'pendiente', label: 'Pendientes' },
    { value: 'aprobada', label: 'Aprobadas' },
    { value: 'rechazada', label: 'Rechazadas' },
    { value: 'completada', label: 'Completadas' },
];

export function SolicitudesTab({
    onAbrirChat,
}: {
    onAbrirChat?: (empresaId: string) => void;
}) {
    const [solicitudes, setSolicitudes] = useState<SolicitudEntrante[]>(SOLICITUDES_ENTRANTES_MOCK);
    const [tab, setTab] = useState<EstadoSolicitud | 'todas'>('pendiente');
    const [detalle, setDetalle] = useState<SolicitudEntrante | null>(null);

    const filtradas = tab === 'todas' ? solicitudes : solicitudes.filter((s) => s.estado === tab);

    const empresaDe = (id: string) => EMPRESAS_MOCK.find((e) => e.id === id);

    const cambiarEstado = (id: string, estado: EstadoSolicitud) => {
        setSolicitudes((prev) => prev.map((s) => (s.id === id ? { ...s, estado } : s)));
        setDetalle(null);
    };

    return (
        <div className="space-y-6">
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
                                <Th>Empresa</Th>
                                <Th>Residuo</Th>
                                <Th className="hidden sm:table-cell">Cantidad</Th>
                                <Th className="hidden md:table-cell">Fecha</Th>
                                <Th>Estado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                            {filtradas.map((s, idx) => {
                                const empresa = empresaDe(s.empresaId);
                                return (
                                    <tr
                                        key={s.id}
                                        className="group bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150 animate-fade-in"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <td className="px-4 md:px-5 py-3.5">
                                            <div className="flex items-center gap-2.5">
                                                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-xs shadow-sm">
                                                    {empresa?.nombre.charAt(0)}
                                                </div>
                                                <div className="min-w-0">
                                                    <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{empresa?.nombre}</p>
                                                    <p className="text-xs text-gray-400 dark:text-gray-500 truncate hidden sm:block">{empresa?.ubicacion}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5">
                                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-[11px] font-semibold ${TIPO_RESIDUO_COLOR[s.residuo]}`}>
                                                {TIPO_RESIDUO_LABEL[s.residuo]}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 hidden sm:table-cell">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">{s.cantidad}</span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{s.unidad}</span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 hidden md:table-cell whitespace-nowrap">
                                            {formatFechaCorta(s.fechaSolicitud)}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5">
                                            <EstadoBadge estado={s.estado} />
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-right">
                                            <div className="inline-flex items-center gap-1">
                                                {s.estado === 'pendiente' && (
                                                    <>
                                                        <button
                                                            onClick={() => cambiarEstado(s.id, 'aprobada')}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-900/20 hover:bg-emerald-100 dark:hover:bg-emerald-900/40 transition-all"
                                                            title="Aceptar"
                                                        >
                                                            <CheckCircle2 className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Aceptar</span>
                                                        </button>
                                                        <button
                                                            onClick={() => cambiarEstado(s.id, 'rechazada')}
                                                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-semibold text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/40 transition-all"
                                                            title="Rechazar"
                                                        >
                                                            <XCircle className="w-3.5 h-3.5" />
                                                            <span className="hidden sm:inline">Rechazar</span>
                                                        </button>
                                                    </>
                                                )}
                                                <button
                                                    onClick={() => setDetalle(s)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    title="Ver detalle"
                                                >
                                                    <Eye className="w-4 h-4" />
                                                </button>
                                                <button
                                                    onClick={() => onAbrirChat?.(s.empresaId)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all"
                                                    title="Abrir chat"
                                                >
                                                    <MessageSquare className="w-4 h-4" />
                                                </button>
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

            {detalle && (
                <DetalleModal
                    solicitud={detalle}
                    empresa={empresaDe(detalle.empresaId)}
                    onClose={() => setDetalle(null)}
                    onAceptar={() => cambiarEstado(detalle.id, 'aprobada')}
                    onRechazar={() => cambiarEstado(detalle.id, 'rechazada')}
                    onAbrirChat={() => {
                        onAbrirChat?.(detalle.empresaId);
                        setDetalle(null);
                    }}
                />
            )}
        </div>
    );
}

function DetalleModal({
    solicitud,
    empresa,
    onClose,
    onAceptar,
    onRechazar,
    onAbrirChat,
}: {
    solicitud: SolicitudEntrante;
    empresa?: EmpresaRecolectora;
    onClose: () => void;
    onAceptar: () => void;
    onRechazar: () => void;
    onAbrirChat: () => void;
}) {
    return (
        <div
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-gray-200 dark:border-gray-800 animate-scale-in"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Header minimal */}
                <div className="flex items-center justify-between px-6 pt-6 pb-4">
                    <div>
                        <h3 className="text-base font-bold text-gray-900 dark:text-white">Solicitud de recolección</h3>
                        <div className="mt-1"><EstadoBadge estado={solicitud.estado} /></div>
                    </div>
                    <button
                        onClick={onClose}
                        className="p-1.5 rounded-lg text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>

                <div className="px-6 pb-6 space-y-4">
                    {/* Empresa */}
                    {empresa && (
                        <div className="flex items-center gap-4 p-4 rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800">
                            <div className="flex-shrink-0 w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-lg shadow-sm">
                                {empresa.nombre.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <p className="text-base font-semibold text-gray-900 dark:text-white truncate">{empresa.nombre}</p>
                                    <span className="flex-shrink-0 inline-flex items-center gap-0.5 text-xs font-bold text-amber-600 dark:text-amber-400">
                                        <Star className="w-3.5 h-3.5 fill-current" />
                                        {empresa.calificacion.toFixed(1)}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 dark:text-gray-400 truncate mt-0.5">{empresa.ubicacion}</p>
                            </div>
                            <button
                                onClick={onAbrirChat}
                                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-sm font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                                title="Abrir chat"
                            >
                                <MessageSquare className="w-4 h-4" />
                                <span className="hidden sm:inline">Chat</span>
                            </button>
                        </div>
                    )}

                    {/* Info grid */}
                    <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                        <InfoCard label="Residuo">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-semibold ${TIPO_RESIDUO_COLOR[solicitud.residuo]}`}>
                                {TIPO_RESIDUO_LABEL[solicitud.residuo]}
                            </span>
                        </InfoCard>
                        <InfoCard label="Cantidad">
                            <span className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums leading-none">
                                {solicitud.cantidad}
                                <span className="text-sm font-medium text-gray-400 ml-1">{solicitud.unidad}</span>
                            </span>
                        </InfoCard>
                        <InfoCard label="Fecha solicitud">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatFechaCorta(solicitud.fechaSolicitud)}</span>
                        </InfoCard>
                        <InfoCard label="Fecha propuesta">
                            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{formatFechaCorta(solicitud.fechaPropuesta)}</span>
                        </InfoCard>
                    </div>

                    {/* Mensaje */}
                    {solicitud.mensaje && (
                        <div className="rounded-xl bg-gray-50 dark:bg-gray-800/60 border border-gray-100 dark:border-gray-800 p-3.5">
                            <p className="text-[10px] font-semibold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-1.5">Mensaje</p>
                            <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">{solicitud.mensaje}</p>
                        </div>
                    )}

                    {/* Acciones */}
                    {solicitud.estado === 'pendiente' ? (
                        <div className="grid grid-cols-2 gap-3 pt-1">
                            <button
                                onClick={onRechazar}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/40 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all active:scale-95"
                            >
                                <XCircle className="w-4 h-4" />
                                Rechazar
                            </button>
                            <button
                                onClick={onAceptar}
                                className="flex items-center justify-center gap-2 py-3 rounded-xl text-sm font-semibold text-white bg-emerald-600 hover:bg-emerald-700 shadow-md shadow-emerald-600/20 hover:shadow-emerald-600/30 transition-all active:scale-95"
                            >
                                <CheckCircle2 className="w-4 h-4" />
                                Aceptar solicitud
                            </button>
                        </div>
                    ) : (
                        <button
                            onClick={onClose}
                            className="w-full py-2.5 rounded-xl text-sm font-semibold text-gray-600 dark:text-gray-400 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all active:scale-95"
                        >
                            Cerrar
                        </button>
                    )}
                </div>
            </div>
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

function EstadoBadge({ estado }: { estado: EstadoSolicitud }) {
    const map = {
        pendiente: { Icon: Clock, label: 'Pendiente', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300', dot: 'bg-orange-500' },
        aprobada: { Icon: CheckCircle2, label: 'Aprobada', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300', dot: 'bg-emerald-500' },
        rechazada: { Icon: XCircle, label: 'Rechazada', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300', dot: 'bg-red-500' },
        completada: { Icon: Truck, label: 'Completada', cls: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300', dot: 'bg-blue-500' },
    } as const;
    const { Icon, label, cls, dot } = map[estado];
    const pulse = estado === 'pendiente';
    return (
        <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold ${cls}`}>
            <span className="relative flex h-2 w-2">
                {pulse && <span className={`absolute inline-flex h-full w-full rounded-full opacity-75 animate-ping ${dot}`} />}
                <span className={`relative inline-flex rounded-full h-2 w-2 ${dot}`} />
            </span>
            <Icon className="w-3.5 h-3.5" />
            {label}
        </span>
    );
}

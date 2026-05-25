'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getAuditLog, AuditLogItem, AuditLogFilters, TABLAS_AUDITADAS, TABLA_LABELS } from '@/lib/services/audit_log';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';

registerLocale('es', es);

const OP_COLORS: Record<string, string> = {
    INSERT: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    UPDATE: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    DELETE: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
};

const OP_LABELS: Record<string, string> = { INSERT: 'Creación', UPDATE: 'Edición', DELETE: 'Eliminación' };

function DiffModal({ item, onClose }: { item: AuditLogItem; onClose: () => void }) {
    const campos = Array.from(new Set([
        ...Object.keys(item.datos_ant ?? {}),
        ...Object.keys(item.datos_nue ?? {}),
    ])).filter(c => c !== 'id');

    const camposModificados = campos.filter(c => {
        const a = JSON.stringify((item.datos_ant ?? {})[c]);
        const b = JSON.stringify((item.datos_nue ?? {})[c]);
        return a !== b;
    });

    const mostrar = item.operacion === 'UPDATE' ? camposModificados : campos;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
            <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl w-full max-w-2xl max-h-[80vh] flex flex-col">
                <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white text-lg">Detalle del cambio</h3>
                        <p className="text-sm text-gray-400">
                            {TABLA_LABELS[item.tabla] ?? item.tabla} · {OP_LABELS[item.operacion]} · Registro #{item.registro_id}
                        </p>
                    </div>
                    <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-400">
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-y-auto p-5">
                    {item.operacion === 'UPDATE' && camposModificados.length === 0 ? (
                        <p className="text-gray-400 text-sm text-center py-4">Sin campos modificados detectados</p>
                    ) : (
                        <table className="w-full text-sm">
                            <thead>
                                <tr className="text-gray-400 text-xs uppercase tracking-wider">
                                    <th className="text-left py-2 pr-4 font-semibold">Campo</th>
                                    {item.operacion !== 'INSERT' && <th className="text-left py-2 pr-4 font-semibold text-red-500">Antes</th>}
                                    {item.operacion !== 'DELETE' && <th className="text-left py-2 font-semibold text-emerald-600">Después</th>}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 dark:divide-gray-800">
                                {mostrar.map(campo => (
                                    <tr key={campo}>
                                        <td className="py-2 pr-4 font-mono text-gray-500 dark:text-gray-400">{campo}</td>
                                        {item.operacion !== 'INSERT' && (
                                            <td className="py-2 pr-4 text-red-600 dark:text-red-400 break-all">
                                                {formatVal((item.datos_ant ?? {})[campo])}
                                            </td>
                                        )}
                                        {item.operacion !== 'DELETE' && (
                                            <td className="py-2 text-emerald-700 dark:text-emerald-400 break-all">
                                                {formatVal((item.datos_nue ?? {})[campo])}
                                            </td>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    )}
                </div>
            </div>
        </div>
    );
}

function formatVal(v: unknown): string {
    if (v === null || v === undefined) return '—';
    if (typeof v === 'object') return JSON.stringify(v);
    return String(v);
}

export function BitacoraTab() {
    const supabase = createClient();
    const [items, setItems] = useState<AuditLogItem[]>([]);
    const [total, setTotal] = useState(0);
    const [loading, setLoading] = useState(true);
    const [page, setPage] = useState(1);
    const [selected, setSelected] = useState<AuditLogItem | null>(null);
    const [filters, setFilters] = useState<AuditLogFilters>({ pageSize: 50 });

    const load = useCallback(async () => {
        setLoading(true);
        try {
            const res = await getAuditLog(supabase, { ...filters, page });
            setItems(res.data);
            setTotal(res.total);
        } finally {
            setLoading(false);
        }
    }, [filters, page]);

    useEffect(() => { load(); }, [load]);

    const totalPages = Math.max(1, Math.ceil(total / (filters.pageSize ?? 50)));

    return (
        <div className="space-y-4">
            {selected && <DiffModal item={selected} onClose={() => setSelected(null)} />}

            {/* Filtros */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Módulo</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-white outline-none"
                            value={filters.tabla ?? ''}
                            onChange={e => { setPage(1); setFilters(f => ({ ...f, tabla: e.target.value || undefined })); }}
                        >
                            <option value="">Todos</option>
                            {TABLAS_AUDITADAS.map(t => <option key={t} value={t}>{TABLA_LABELS[t]}</option>)}
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Operación</label>
                        <select
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-white outline-none"
                            value={filters.operacion ?? ''}
                            onChange={e => { setPage(1); setFilters(f => ({ ...f, operacion: e.target.value || undefined })); }}
                        >
                            <option value="">Todas</option>
                            <option value="INSERT">Creación</option>
                            <option value="UPDATE">Edición</option>
                            <option value="DELETE">Eliminación</option>
                        </select>
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Desde</label>
                        <DatePicker
                            selected={filters.desde ? new Date(filters.desde + 'T00:00:00') : null}
                            onChange={(d: Date | null) => { setPage(1); setFilters(f => ({ ...f, desde: d ? fmtDate(d) : undefined })); }}
                            dateFormat="dd/MM/yyyy" locale="es" isClearable
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-white outline-none"
                            wrapperClassName="w-full"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Hasta</label>
                        <DatePicker
                            selected={filters.hasta ? new Date(filters.hasta + 'T00:00:00') : null}
                            onChange={(d: Date | null) => { setPage(1); setFilters(f => ({ ...f, hasta: d ? fmtDate(d) : undefined })); }}
                            dateFormat="dd/MM/yyyy" locale="es" isClearable
                            className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-white outline-none"
                            wrapperClassName="w-full"
                        />
                    </div>
                </div>
            </div>

            {/* Tabla */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Registro de Cambios</h3>
                        <p className="text-sm text-gray-400">{total.toLocaleString()} eventos registrados</p>
                    </div>
                    <button onClick={load} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 transition-colors">
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3 text-left">Fecha y Hora</th>
                                <th className="px-5 py-3 text-left">Módulo</th>
                                <th className="px-5 py-3 text-left">Operación</th>
                                <th className="px-5 py-3 text-left">Registro</th>
                                <th className="px-5 py-3 text-left">Usuario</th>
                                <th className="px-5 py-3 text-center">Detalle</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {loading ? (
                                <tr><td colSpan={6} className="px-5 py-12 text-center text-gray-400">Cargando...</td></tr>
                            ) : items.length === 0 ? (
                                <tr>
                                    <td colSpan={6} className="px-5 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Sin eventos registrados</p>
                                        <p className="text-gray-400 text-xs mt-1">Los cambios en el sistema aparecerán aquí automáticamente</p>
                                    </td>
                                </tr>
                            ) : items.map(item => (
                                <tr key={item.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-3 text-gray-600 dark:text-gray-300 whitespace-nowrap">
                                        {new Date(item.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-200">
                                        {TABLA_LABELS[item.tabla] ?? item.tabla}
                                    </td>
                                    <td className="px-5 py-3">
                                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-semibold ${OP_COLORS[item.operacion]}`}>
                                            {OP_LABELS[item.operacion]}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 font-mono text-xs text-gray-500 dark:text-gray-400">#{item.registro_id}</td>
                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{item.usuario_email ?? '—'}</td>
                                    <td className="px-5 py-3 text-center">
                                        <button
                                            onClick={() => setSelected(item)}
                                            className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                            title="Ver cambios"
                                        >
                                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                            </svg>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
                {/* Paginación */}
                {totalPages > 1 && (
                    <div className="p-4 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
                        <span className="text-xs text-gray-400">Página {page} de {totalPages}</span>
                        <div className="flex gap-2">
                            <button disabled={page === 1} onClick={() => setPage(p => p - 1)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Anterior
                            </button>
                            <button disabled={page === totalPages} onClick={() => setPage(p => p + 1)}
                                className="px-3 py-1.5 text-xs rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 disabled:opacity-40 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">
                                Siguiente
                            </button>
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}

function fmtDate(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

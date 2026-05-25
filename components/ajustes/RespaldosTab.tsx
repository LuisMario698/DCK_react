'use client';

import { useState, useEffect, useCallback } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getBackups, crearRespaldo, eliminarBackup, descargarBackup, Backup, FormatoBackup } from '@/lib/services/backups';
import { useAuth } from '@/components/layout/AuthProvider';

const FORMATO_INFO: Record<FormatoBackup, { label: string; desc: string; icon: string }> = {
    json: { label: 'JSON', desc: 'Estructura completa, ideal para restaurar', icon: '{ }' },
    csv:  { label: 'CSV',  desc: 'Compatible con Excel y hojas de cálculo', icon: '⊞' },
    sql:  { label: 'SQL',  desc: 'Sentencias INSERT para reimportar en PostgreSQL', icon: '⌘' },
};

const ESTADO_COLORS: Record<string, string> = {
    completado:  'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    fallido:     'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    en_proceso:  'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
};

export function RespaldosTab() {
    const supabase = createClient();
    const { user } = useAuth();
    const [backups, setBackups] = useState<Backup[]>([]);
    const [loading, setLoading] = useState(true);
    const [creando, setCreando] = useState(false);
    const [formato, setFormato] = useState<FormatoBackup>('json');
    const [eliminandoId, setEliminandoId] = useState<number | null>(null);
    const [descargandoId, setDescargandoId] = useState<number | null>(null);
    const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

    const mostrarToast = (msg: string, tipo: 'ok' | 'err') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3500);
    };

    const cargar = useCallback(async () => {
        setLoading(true);
        try { setBackups(await getBackups(supabase)); }
        finally { setLoading(false); }
    }, [supabase]);

    useEffect(() => { cargar(); }, [cargar]);

    const handleCrear = async () => {
        setCreando(true);
        try {
            const { blob, filename } = await crearRespaldo(supabase, formato, 'manual', user?.email ?? undefined);
            // Descarga automática
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = filename; a.click();
            URL.revokeObjectURL(url);
            await cargar();
            mostrarToast('Respaldo creado y descargado correctamente', 'ok');
        } catch {
            mostrarToast('Error al crear el respaldo', 'err');
        } finally {
            setCreando(false);
        }
    };

    const handleDescargar = async (backup: Backup) => {
        if (!backup.storage_path) return;
        setDescargandoId(backup.id);
        try {
            const blob = await descargarBackup(supabase, backup.storage_path);
            const ext = backup.storage_path.split('.').pop() ?? 'json';
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url; a.download = `${backup.nombre}.${ext}`; a.click();
            URL.revokeObjectURL(url);
        } catch {
            mostrarToast('Error al descargar el respaldo', 'err');
        } finally {
            setDescargandoId(null);
        }
    };

    const handleEliminar = async (backup: Backup) => {
        if (!confirm(`¿Eliminar el respaldo "${backup.nombre}"? Esta acción no se puede deshacer.`)) return;
        setEliminandoId(backup.id);
        try {
            await eliminarBackup(supabase, backup.id, backup.storage_path);
            await cargar();
            mostrarToast('Respaldo eliminado', 'ok');
        } catch {
            mostrarToast('Error al eliminar el respaldo', 'err');
        } finally {
            setEliminandoId(null);
        }
    };

    const ultimo = backups.find(b => b.estado === 'completado');

    return (
        <div className="space-y-5">
            {/* Toast */}
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium transition-all ${toast.tipo === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Panel crear respaldo */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <h3 className="font-bold text-gray-800 dark:text-white mb-1">Crear respaldo manual</h3>
                <p className="text-sm text-gray-400 mb-5">Exporta todas las tablas del sistema en el formato que elijas</p>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-5">
                    {(Object.entries(FORMATO_INFO) as [FormatoBackup, typeof FORMATO_INFO[FormatoBackup]][]).map(([f, info]) => (
                        <button
                            key={f}
                            onClick={() => setFormato(f)}
                            className={`p-4 rounded-xl border-2 text-left transition-all ${formato === f
                                ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'}`}
                        >
                            <span className="text-2xl font-mono font-bold text-gray-600 dark:text-gray-300">{info.icon}</span>
                            <p className={`font-bold mt-1 ${formato === f ? 'text-blue-700 dark:text-blue-400' : 'text-gray-700 dark:text-gray-200'}`}>{info.label}</p>
                            <p className="text-xs text-gray-400 mt-0.5">{info.desc}</p>
                        </button>
                    ))}
                </div>

                <div className="flex items-center justify-between flex-wrap gap-3">
                    {ultimo && (
                        <p className="text-xs text-gray-400">
                            Último respaldo: <span className="font-medium text-gray-600 dark:text-gray-300">
                                {new Date(ultimo.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                            </span>
                        </p>
                    )}
                    <button
                        onClick={handleCrear}
                        disabled={creando}
                        className="flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all"
                    >
                        {creando ? (
                            <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Creando...</>
                        ) : (
                            <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                            </svg>Crear y descargar respaldo</>
                        )}
                    </button>
                </div>
            </div>

            {/* Historial */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Historial de respaldos</h3>
                        <p className="text-sm text-gray-400">{backups.length} respaldos almacenados</p>
                    </div>
                    <button onClick={cargar} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400">
                        <svg className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                    </button>
                </div>
                <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                        <thead className="bg-gray-50 dark:bg-gray-700/50 text-xs uppercase tracking-wider text-gray-500 dark:text-gray-400">
                            <tr>
                                <th className="px-5 py-3 text-left">Nombre</th>
                                <th className="px-5 py-3 text-left">Tipo</th>
                                <th className="px-5 py-3 text-left">Fecha</th>
                                <th className="px-5 py-3 text-left">Tamaño</th>
                                <th className="px-5 py-3 text-left">Estado</th>
                                <th className="px-5 py-3 text-left">Creado por</th>
                                <th className="px-5 py-3 text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50 dark:divide-gray-700/50">
                            {loading ? (
                                <tr><td colSpan={7} className="px-5 py-10 text-center text-gray-400">Cargando...</td></tr>
                            ) : backups.length === 0 ? (
                                <tr>
                                    <td colSpan={7} className="px-5 py-12 text-center">
                                        <p className="text-gray-500 dark:text-gray-400">Sin respaldos aún</p>
                                        <p className="text-gray-400 text-xs mt-1">Crea tu primer respaldo con el botón de arriba</p>
                                    </td>
                                </tr>
                            ) : backups.map(b => (
                                <tr key={b.id} className="hover:bg-gray-50/70 dark:hover:bg-gray-700/30 transition-colors">
                                    <td className="px-5 py-3 font-medium text-gray-700 dark:text-gray-200 max-w-[200px] truncate">{b.nombre}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${b.tipo === 'manual' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400' : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400'}`}>
                                            {b.tipo === 'manual' ? 'Manual' : 'Automático'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                                        {new Date(b.created_at).toLocaleString('es-MX', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                    </td>
                                    <td className="px-5 py-3 text-gray-500 dark:text-gray-400 text-xs">{b.tamanio_kb > 0 ? `${b.tamanio_kb} KB` : '—'}</td>
                                    <td className="px-5 py-3">
                                        <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${ESTADO_COLORS[b.estado]}`}>
                                            {b.estado === 'completado' ? 'Completado' : b.estado === 'fallido' ? 'Fallido' : 'En proceso'}
                                        </span>
                                    </td>
                                    <td className="px-5 py-3 text-gray-400 text-xs">{b.creado_por ?? '—'}</td>
                                    <td className="px-5 py-3">
                                        <div className="flex items-center justify-center gap-1">
                                            {b.storage_path && (
                                                <button
                                                    onClick={() => handleDescargar(b)}
                                                    disabled={descargandoId === b.id}
                                                    className="p-1.5 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/30 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors"
                                                    title="Descargar"
                                                >
                                                    {descargandoId === b.id
                                                        ? <div className="w-4 h-4 border-2 border-blue-400/30 border-t-blue-400 rounded-full animate-spin" />
                                                        : <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /></svg>
                                                    }
                                                </button>
                                            )}
                                            <button
                                                onClick={() => handleEliminar(b)}
                                                disabled={eliminandoId === b.id}
                                                className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 hover:text-red-500 dark:hover:text-red-400 transition-colors"
                                                title="Eliminar"
                                            >
                                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

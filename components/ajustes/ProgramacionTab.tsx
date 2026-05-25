'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { getSchedule, saveSchedule, BackupSchedule } from '@/lib/services/backups';

const DIAS = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];

function proximaEjecucion(schedule: BackupSchedule): string {
    if (!schedule.activo) return 'Programación desactivada';
    const [h, m] = schedule.hora.split(':').map(Number);
    const ahora = new Date();
    const prox = new Date();
    prox.setHours(h, m, 0, 0);

    if (schedule.frecuencia === 'diario') {
        if (prox <= ahora) prox.setDate(prox.getDate() + 1);
    } else {
        const diasHasta = (schedule.dia_semana - ahora.getDay() + 7) % 7 || 7;
        prox.setDate(prox.getDate() + diasHasta);
        if (diasHasta === 0 && prox <= ahora) prox.setDate(prox.getDate() + 7);
    }
    return prox.toLocaleString('es-MX', { weekday: 'long', day: '2-digit', month: 'long', hour: '2-digit', minute: '2-digit' });
}

export function ProgramacionTab() {
    const supabase = createClient();
    const [config, setConfig] = useState<BackupSchedule | null>(null);
    const [guardando, setGuardando] = useState(false);
    const [toast, setToast] = useState<{ msg: string; tipo: 'ok' | 'err' } | null>(null);

    const mostrarToast = (msg: string, tipo: 'ok' | 'err') => {
        setToast({ msg, tipo });
        setTimeout(() => setToast(null), 3000);
    };

    useEffect(() => {
        getSchedule(supabase).then(setConfig).catch(() => {});
    }, [supabase]);

    const handleGuardar = async () => {
        if (!config) return;
        setGuardando(true);
        try {
            await saveSchedule(supabase, {
                activo: config.activo,
                frecuencia: config.frecuencia,
                dia_semana: config.dia_semana,
                hora: config.hora,
            });
            mostrarToast('Configuración guardada', 'ok');
        } catch {
            mostrarToast('Error al guardar la configuración', 'err');
        } finally {
            setGuardando(false);
        }
    };

    if (!config) return (
        <div className="flex items-center justify-center py-20 text-gray-400">
            <div className="w-6 h-6 border-2 border-gray-200 border-t-blue-500 rounded-full animate-spin mr-3" />
            Cargando configuración...
        </div>
    );

    return (
        <div className="max-w-xl space-y-5">
            {toast && (
                <div className={`fixed top-5 right-5 z-50 px-5 py-3 rounded-xl shadow-lg text-sm font-medium ${toast.tipo === 'ok' ? 'bg-emerald-500 text-white' : 'bg-red-500 text-white'}`}>
                    {toast.msg}
                </div>
            )}

            {/* Activar/desactivar */}
            <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <h3 className="font-bold text-gray-800 dark:text-white">Respaldos automáticos</h3>
                        <p className="text-sm text-gray-400 mt-0.5">Se ejecutan vía Vercel Cron Jobs</p>
                    </div>
                    <button
                        onClick={() => setConfig(c => c ? { ...c, activo: !c.activo } : c)}
                        className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${config.activo ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    >
                        <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform ${config.activo ? 'translate-x-6' : 'translate-x-1'}`} />
                    </button>
                </div>
            </div>

            {/* Frecuencia */}
            <div className={`bg-white dark:bg-gray-800 p-6 rounded-2xl border border-gray-100 dark:border-gray-700 shadow-sm space-y-5 transition-opacity ${!config.activo ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Frecuencia</label>
                    <div className="flex gap-3">
                        {(['diario', 'semanal'] as const).map(f => (
                            <button
                                key={f}
                                onClick={() => setConfig(c => c ? { ...c, frecuencia: f } : c)}
                                className={`flex-1 py-3 rounded-xl border-2 font-medium text-sm transition-all capitalize ${config.frecuencia === f
                                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400'
                                    : 'border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:border-gray-300'}`}
                            >
                                {f === 'diario' ? '📅 Diario' : '📆 Semanal'}
                            </button>
                        ))}
                    </div>
                </div>

                {config.frecuencia === 'semanal' && (
                    <div>
                        <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Día de la semana</label>
                        <div className="grid grid-cols-7 gap-1">
                            {DIAS.map((dia, i) => (
                                <button
                                    key={i}
                                    onClick={() => setConfig(c => c ? { ...c, dia_semana: i } : c)}
                                    className={`py-2 rounded-lg text-xs font-medium transition-all ${config.dia_semana === i
                                        ? 'bg-blue-600 text-white'
                                        : 'bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-200 dark:hover:bg-gray-600'}`}
                                    title={dia}
                                >
                                    {dia.slice(0, 2)}
                                </button>
                            ))}
                        </div>
                        <p className="text-xs text-gray-400 mt-2">Día seleccionado: <span className="font-medium text-gray-600 dark:text-gray-300">{DIAS[config.dia_semana]}</span></p>
                    </div>
                )}

                <div>
                    <label className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider block mb-3">Hora de ejecución</label>
                    <input
                        type="time"
                        value={config.hora}
                        onChange={e => setConfig(c => c ? { ...c, hora: e.target.value } : c)}
                        className="px-4 py-2.5 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl text-sm text-gray-700 dark:text-white outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-400"
                    />
                    <p className="text-xs text-gray-400 mt-2">Zona horaria del servidor (UTC)</p>
                </div>
            </div>

            {/* Próxima ejecución */}
            <div className={`p-4 rounded-xl ${config.activo ? 'bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800' : 'bg-gray-50 dark:bg-gray-700/30 border border-gray-100 dark:border-gray-700'}`}>
                <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-1">Próxima ejecución estimada</p>
                <p className={`text-sm font-medium ${config.activo ? 'text-blue-700 dark:text-blue-300' : 'text-gray-400'}`}>
                    {proximaEjecucion(config)}
                </p>
                {config.activo && (
                    <p className="text-xs text-gray-400 mt-1">
                        El formato de respaldo automático es JSON. Los respaldos se almacenan en Supabase Storage y aparecen en el historial.
                    </p>
                )}
            </div>

            <button
                onClick={handleGuardar}
                disabled={guardando}
                className="w-full py-3 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white rounded-xl font-medium text-sm transition-all flex items-center justify-center gap-2"
            >
                {guardando
                    ? <><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />Guardando...</>
                    : 'Guardar configuración'}
            </button>
        </div>
    );
}

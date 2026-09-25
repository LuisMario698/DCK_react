'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { Search, MessageSquare, Mail } from 'lucide-react';
import { AsociacionRecolectora } from '@/types/database';
import { getAsociaciones } from '@/lib/services/asociaciones';
import { getResumenConversaciones, suscribirMensajes, type ResumenConversacion } from '@/lib/services/mensajes';
import { tiempoRelativo } from '@/lib/constants/residuos';
import { Conversacion } from './Conversacion';
import { Cargando } from './ui';

export function ChatTab({
    asociacionIdInicial,
    onCambio,
}: {
    asociacionIdInicial?: number | null;
    onCambio?: () => void;
}) {
    const [asociaciones, setAsociaciones] = useState<AsociacionRecolectora[]>([]);
    const [resumen, setResumen] = useState<ResumenConversacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [activa, setActiva] = useState<number | null>(asociacionIdInicial ?? null);
    const [busqueda, setBusqueda] = useState('');

    const cargarResumen = useCallback(async () => {
        try {
            setResumen(await getResumenConversaciones());
        } catch {
            // El resumen es informativo; si falla, la lista sigue funcionando
        }
    }, []);

    useEffect(() => {
        Promise.all([getAsociaciones(), getResumenConversaciones()])
            .then(([a, r]) => {
                setAsociaciones(a);
                setResumen(r);
                setActiva((actual) => actual ?? r[r.length - 1]?.asociacion_id ?? null);
            })
            .finally(() => setCargando(false));
        return suscribirMensajes(() => {
            cargarResumen();
            onCambio?.();
        });
    }, [cargarResumen, onCambio]);

    // Conversaciones con mensajes primero (la más reciente arriba), luego el resto
    const lista = useMemo(() => {
        const porId = new Map(resumen.map((r) => [r.asociacion_id, r]));
        const texto = busqueda.toLowerCase();
        return asociaciones
            .filter((a) => a.nombre_asociacion.toLowerCase().includes(texto))
            .map((a) => ({ asociacion: a, resumen: porId.get(a.id) }))
            .sort((x, y) => (y.resumen?.ultimo?.created_at ?? '').localeCompare(x.resumen?.ultimo?.created_at ?? ''));
    }, [asociaciones, resumen, busqueda]);

    const actual = asociaciones.find((a) => a.id === activa) ?? null;

    const alLeer = useCallback(() => {
        cargarResumen();
        onCambio?.();
    }, [cargarResumen, onCambio]);

    if (cargando) return <Cargando texto="Cargando conversaciones…" />;

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-300px)] min-h-[560px] grid grid-cols-1 md:grid-cols-[320px_1fr]">
            {/* Lista de conversaciones */}
            <aside className={`border-r border-gray-200 dark:border-gray-800 flex-col bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50 min-h-0 ${actual ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar asociación…"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {lista.map(({ asociacion: a, resumen: r }) => {
                        const esActiva = activa === a.id;
                        return (
                            <button
                                key={a.id}
                                onClick={() => setActiva(a.id)}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 ${
                                    esActiva ? 'bg-white dark:bg-gray-800 shadow-md ring-2 ring-blue-500/20' : 'hover:bg-white/70 dark:hover:bg-gray-800/50'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                        {a.nombre_asociacion.charAt(0)}
                                    </div>
                                    {!!r?.noLeidos && !esActiva && (
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm font-bold truncate ${esActiva ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                            {a.nombre_asociacion}
                                        </p>
                                        {r?.ultimo && (
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">
                                                {tiempoRelativo(r.ultimo.created_at).replace('Hace ', '')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {r?.ultimo ? (r.ultimo.autor_rol === 'admin' ? 'Tú: ' : '') + r.ultimo.texto : 'Sin mensajes aún'}
                                        </p>
                                        {!!r?.noLeidos && (
                                            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
                                                {r.noLeidos}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {lista.length === 0 && (
                        <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                            {asociaciones.length === 0 ? 'Registra una asociación para poder escribirle.' : 'No hay coincidencias.'}
                        </div>
                    )}
                </div>
            </aside>

            {/* Panel de chat */}
            <section className={`flex-col min-h-0 ${actual ? 'flex' : 'hidden md:flex'}`}>
                {actual ? (
                    <>
                        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 shadow-sm">
                            <button onClick={() => setActiva(null)} className="md:hidden text-sm text-blue-600 font-semibold mr-1">
                                ←
                            </button>
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {actual.nombre_asociacion.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{actual.nombre_asociacion}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" />
                                    {actual.email || actual.contacto_asociacion || 'Sin datos de contacto'}
                                </p>
                            </div>
                        </header>
                        <Conversacion asociacionId={actual.id} miRol="admin" onLeidos={alLeer} />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30 animate-fade-in">
                            <MessageSquare className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-base font-bold text-gray-900 dark:text-white">Selecciona una conversación</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Elige una asociación de la izquierda para ver los mensajes.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

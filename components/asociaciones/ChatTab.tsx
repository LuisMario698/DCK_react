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
        <div className="bg-simar-superficie border border-simar-borde rounded-2xl shadow-simar overflow-hidden h-[calc(100vh-300px)] min-h-[560px] grid grid-cols-1 md:grid-cols-[320px_1fr]">
            {/* Lista de conversaciones */}
            <aside className={`border-r border-simar-borde flex-col bg-simar-papel min-h-0 ${actual ? 'hidden md:flex' : 'flex'}`}>
                <div className="p-4 border-b border-simar-borde">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-simar-texto-2" />
                        <input
                            type="text"
                            placeholder="Buscar asociación…"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
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
                                    esActiva ? 'bg-simar-superficie shadow-simar ring-2 ring-simar-marea-tinta/20' : 'hover:bg-white/70'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className="w-11 h-11 rounded-xl bg-simar-marea flex items-center justify-center text-white font-bold text-base shadow-simar">
                                        {a.nombre_asociacion.charAt(0)}
                                    </div>
                                    {!!r?.noLeidos && !esActiva && (
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="absolute inline-flex h-full w-full rounded-full bg-simar-marea-suave opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-simar-marea" />
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-base font-bold truncate ${esActiva ? 'text-simar-marea-tinta' : 'text-simar-texto'}`}>
                                            {a.nombre_asociacion}
                                        </p>
                                        {r?.ultimo && (
                                            <span className="text-[15px] text-simar-texto-2 flex-shrink-0 font-medium">
                                                {tiempoRelativo(r.ultimo.created_at).replace('Hace ', '')}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="text-[15px] text-simar-texto-2 truncate">
                                            {r?.ultimo ? (r.ultimo.autor_rol === 'admin' ? 'Tú: ' : '') + r.ultimo.texto : 'Sin mensajes aún'}
                                        </p>
                                        {!!r?.noLeidos && (
                                            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[15px] font-bold text-white bg-simar-marea rounded-full shadow-simar">
                                                {r.noLeidos}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {lista.length === 0 && (
                        <div className="p-8 text-center text-[15px] text-simar-texto-2">
                            {asociaciones.length === 0 ? 'Registra una asociación para poder escribirle.' : 'No hay coincidencias.'}
                        </div>
                    )}
                </div>
            </aside>

            {/* Panel de chat */}
            <section className={`flex-col min-h-0 ${actual ? 'flex' : 'hidden md:flex'}`}>
                {actual ? (
                    <>
                        <header className="px-5 py-4 border-b border-simar-borde flex items-center gap-3 bg-simar-superficie shadow-simar">
                            <button onClick={() => setActiva(null)} className="md:hidden text-base text-simar-marea-tinta font-semibold mr-1">
                                ←
                            </button>
                            <div className="w-11 h-11 rounded-xl bg-simar-marea flex items-center justify-center text-white font-bold text-base shadow-simar">
                                {actual.nombre_asociacion.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-base font-bold text-simar-texto truncate">{actual.nombre_asociacion}</p>
                                <p className="text-[15px] text-simar-texto-2 truncate flex items-center gap-1.5">
                                    <Mail className="w-3 h-3" />
                                    {actual.email || actual.contacto_asociacion || 'Sin datos de contacto'}
                                </p>
                            </div>
                        </header>
                        <Conversacion asociacionId={actual.id} miRol="admin" onLeidos={alLeer} />
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-2xl bg-simar-marea flex items-center justify-center mb-4 shadow-simar">
                            <MessageSquare className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-base font-bold text-simar-texto">Selecciona una conversación</p>
                        <p className="text-base text-simar-texto-2 mt-1">
                            Elige una asociación de la izquierda para ver los mensajes.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

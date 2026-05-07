'use client';

import { useEffect, useRef, useState } from 'react';
import { Send, Search, MessageSquare } from 'lucide-react';
import {
    CONVERSACIONES_MOCK,
    EMPRESAS_MOCK,
    formatHaceMin,
    type ConversacionChat,
    type MensajeChat,
} from '@/lib/mock/asociaciones';

export function ChatTab({ empresaIdInicial }: { empresaIdInicial?: string | null }) {
    const [conversaciones, setConversaciones] = useState<ConversacionChat[]>(CONVERSACIONES_MOCK);
    const [empresaActiva, setEmpresaActiva] = useState<string | null>(
        empresaIdInicial || conversaciones[0]?.empresaId || null
    );
    const [busqueda, setBusqueda] = useState('');
    const [borrador, setBorrador] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        if (empresaIdInicial) {
            setEmpresaActiva(empresaIdInicial);
            setConversaciones((prev) => {
                if (prev.find((c) => c.empresaId === empresaIdInicial)) return prev;
                return [...prev, { empresaId: empresaIdInicial, mensajes: [], noLeidos: 0 }];
            });
        }
    }, [empresaIdInicial]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [empresaActiva, conversaciones]);

    const empresaDe = (id: string) => EMPRESAS_MOCK.find((e) => e.id === id);
    const conversacionActual = conversaciones.find((c) => c.empresaId === empresaActiva);
    const empresaActual = empresaActiva ? empresaDe(empresaActiva) : null;

    const conversacionesFiltradas = conversaciones.filter((c) => {
        const e = empresaDe(c.empresaId);
        return e?.nombre.toLowerCase().includes(busqueda.toLowerCase());
    });

    const enviar = () => {
        if (!borrador.trim() || !empresaActiva) return;
        const nuevo: MensajeChat = {
            id: `m${Date.now()}`,
            autor: 'admin',
            texto: borrador.trim(),
            enviadoHaceMin: 0,
        };
        setConversaciones((prev) =>
            prev.map((c) =>
                c.empresaId === empresaActiva
                    ? { ...c, mensajes: [...c.mensajes, nuevo], noLeidos: 0 }
                    : c
            )
        );
        setBorrador('');
    };

    const seleccionar = (id: string) => {
        setEmpresaActiva(id);
        setConversaciones((prev) =>
            prev.map((c) => (c.empresaId === id ? { ...c, noLeidos: 0 } : c))
        );
    };

    return (
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden h-[calc(100vh-300px)] min-h-[560px] grid grid-cols-1 md:grid-cols-[320px_1fr]">
            {/* Lista de conversaciones */}
            <aside className="border-r border-gray-200 dark:border-gray-800 flex flex-col bg-gradient-to-b from-gray-50 to-gray-100/50 dark:from-gray-900 dark:to-gray-900/50">
                <div className="p-4 border-b border-gray-200 dark:border-gray-800">
                    <div className="relative">
                        <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            placeholder="Buscar conversación…"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            className="w-full pl-10 pr-3 py-2.5 text-sm rounded-xl border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                        />
                    </div>
                </div>
                <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
                    {conversacionesFiltradas.map((c, idx) => {
                        const emp = empresaDe(c.empresaId);
                        if (!emp) return null;
                        const ultimo = c.mensajes[c.mensajes.length - 1];
                        const activo = empresaActiva === c.empresaId;
                        return (
                            <button
                                key={c.empresaId}
                                onClick={() => seleccionar(c.empresaId)}
                                style={{ animationDelay: `${idx * 50}ms` }}
                                className={`w-full flex items-start gap-3 p-3 rounded-xl text-left transition-all duration-200 animate-fade-in ${
                                    activo
                                        ? 'bg-white dark:bg-gray-800 shadow-md ring-2 ring-blue-500/20'
                                        : 'hover:bg-white/70 dark:hover:bg-gray-800/50'
                                }`}
                            >
                                <div className="relative flex-shrink-0">
                                    <div className={`w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md ${activo ? 'scale-105' : ''} transition-transform`}>
                                        {emp.nombre.charAt(0)}
                                    </div>
                                    {c.noLeidos > 0 && !activo && (
                                        <span className="absolute -top-1 -right-1 flex h-2 w-2">
                                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75" />
                                            <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500" />
                                        </span>
                                    )}
                                </div>
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <p className={`text-sm font-bold truncate ${activo ? 'text-blue-700 dark:text-blue-300' : 'text-gray-900 dark:text-white'}`}>
                                            {emp.nombre}
                                        </p>
                                        {ultimo && (
                                            <span className="text-[10px] text-gray-500 dark:text-gray-400 flex-shrink-0 font-medium">
                                                {formatHaceMin(ultimo.enviadoHaceMin)}
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex items-center justify-between gap-2 mt-0.5">
                                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                                            {ultimo ? (ultimo.autor === 'admin' ? 'Tú: ' : '') + ultimo.texto : 'Sin mensajes aún'}
                                        </p>
                                        {c.noLeidos > 0 && (
                                            <span className="flex-shrink-0 inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 text-[10px] font-bold text-white bg-blue-600 rounded-full shadow-sm">
                                                {c.noLeidos}
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </button>
                        );
                    })}
                    {conversacionesFiltradas.length === 0 && (
                        <div className="p-8 text-center text-xs text-gray-500 dark:text-gray-400">
                            No hay conversaciones.
                        </div>
                    )}
                </div>
            </aside>

            {/* Panel de chat */}
            <section className="flex flex-col min-h-0">
                {empresaActual && conversacionActual ? (
                    <>
                        <header className="px-5 py-4 border-b border-gray-200 dark:border-gray-800 flex items-center gap-3 bg-white dark:bg-gray-900 shadow-sm">
                            <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center text-white font-bold text-sm shadow-md">
                                {empresaActual.nombre.charAt(0)}
                            </div>
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{empresaActual.nombre}</p>
                                <p className="text-xs text-gray-500 dark:text-gray-400 truncate flex items-center gap-1.5">
                                    <span className="inline-block w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                    En línea · {empresaActual.email}
                                </p>
                            </div>
                        </header>

                        <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950/50 dark:to-gray-900 custom-scrollbar">
                            {conversacionActual.mensajes.length === 0 && (
                                <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">
                                    Inicia la conversación.
                                </div>
                            )}
                            {conversacionActual.mensajes.map((m, idx) => {
                                const mio = m.autor === 'admin';
                                return (
                                    <div
                                        key={m.id}
                                        className={`flex animate-fade-in ${mio ? 'justify-end' : 'justify-start'}`}
                                        style={{ animationDelay: `${Math.min(idx * 30, 200)}ms` }}
                                    >
                                        <div
                                            className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm transition-transform hover:scale-[1.01] ${
                                                mio
                                                    ? 'bg-gradient-to-br from-blue-600 to-blue-700 text-white rounded-br-md shadow-blue-600/20'
                                                    : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                                            }`}
                                        >
                                            <p className="leading-relaxed whitespace-pre-wrap">{m.texto}</p>
                                            <p className={`text-[10px] mt-1 font-medium ${mio ? 'text-blue-100' : 'text-gray-500 dark:text-gray-400'}`}>
                                                hace {formatHaceMin(m.enviadoHaceMin)}
                                            </p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>

                        <div className="p-4 border-t border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900">
                            <div className="flex items-end gap-2 bg-gray-50 dark:bg-gray-800 rounded-xl p-2 border border-gray-200 dark:border-gray-700 focus-within:border-blue-500 focus-within:ring-2 focus-within:ring-blue-500/20 transition-all">
                                <textarea
                                    value={borrador}
                                    onChange={(e) => setBorrador(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && !e.shiftKey) {
                                            e.preventDefault();
                                            enviar();
                                        }
                                    }}
                                    placeholder="Escribe un mensaje…"
                                    rows={1}
                                    className="flex-1 resize-none px-2 py-1.5 max-h-32 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                                />
                                <button
                                    onClick={enviar}
                                    disabled={!borrador.trim()}
                                    className="p-2.5 rounded-lg bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white shadow-md shadow-blue-600/20 hover:shadow-blue-600/40 transition-all hover:scale-105 active:scale-95 disabled:hover:scale-100"
                                    title="Enviar"
                                >
                                    <Send className="w-4 h-4" />
                                </button>
                            </div>
                            <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-2">
                                Presiona <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">Enter</kbd> para enviar · <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">Shift + Enter</kbd> para salto de línea
                            </p>
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex flex-col items-center justify-center text-center p-8">
                        <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center mb-4 shadow-lg shadow-blue-600/30 animate-fade-in">
                            <MessageSquare className="w-10 h-10 text-white" />
                        </div>
                        <p className="text-base font-bold text-gray-900 dark:text-white">Selecciona una conversación</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Elige una empresa de la izquierda para ver los mensajes.
                        </p>
                    </div>
                )}
            </section>
        </div>
    );
}

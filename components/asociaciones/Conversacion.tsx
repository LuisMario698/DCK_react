'use client';

import { useEffect, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Loader2, Send } from 'lucide-react';
import { Mensaje } from '@/types/database';
import { enviarMensaje, getMensajes, marcarMensajesLeidos, suscribirMensajes } from '@/lib/services/mensajes';
import { tiempoRelativo } from '@/lib/constants/residuos';
import { mensajeError } from './ui';

/**
 * Conversación entre el centro de acopio y una asociación, en tiempo real.
 * La usan el panel admin (ChatTab) y el portal recolector (Mensajes).
 */
export function Conversacion({
    asociacionId,
    miRol,
    acento = 'blue',
    onLeidos,
    vacio = 'Inicia la conversación.',
}: {
    asociacionId: number;
    miRol: 'admin' | 'recolector';
    acento?: 'blue' | 'emerald';
    onLeidos?: () => void;
    vacio?: string;
}) {
    const [mensajes, setMensajes] = useState<Mensaje[]>([]);
    const [cargando, setCargando] = useState(true);
    const [borrador, setBorrador] = useState('');
    const [enviando, setEnviando] = useState(false);
    const scrollRef = useRef<HTMLDivElement>(null);
    const onLeidosRef = useRef(onLeidos);
    useEffect(() => {
        onLeidosRef.current = onLeidos;
    });

    useEffect(() => {
        let activo = true;
        setCargando(true);

        const marcar = () =>
            marcarMensajesLeidos(asociacionId)
                .then(() => onLeidosRef.current?.())
                .catch(() => undefined);

        getMensajes(asociacionId)
            .then((m) => {
                if (!activo) return;
                setMensajes(m);
                marcar();
            })
            .catch((err) => toast.error(mensajeError(err, 'No se pudieron cargar los mensajes.')))
            .finally(() => activo && setCargando(false));

        const off = suscribirMensajes((nuevo) => {
            setMensajes((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]));
            if (nuevo.autor_rol !== miRol) marcar();
        }, asociacionId);

        return () => {
            activo = false;
            off();
        };
    }, [asociacionId, miRol]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [mensajes]);

    const enviar = async () => {
        const texto = borrador.trim();
        if (!texto || enviando) return;
        setEnviando(true);
        try {
            const nuevo = await enviarMensaje(asociacionId, texto);
            setMensajes((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]));
            setBorrador('');
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudo enviar el mensaje.'));
        } finally {
            setEnviando(false);
        }
    };

    const burbujaMia =
        acento === 'blue'
            ? 'bg-gradient-to-br from-blue-600 to-blue-700 shadow-blue-600/20'
            : 'bg-gradient-to-br from-emerald-600 to-teal-600 shadow-emerald-600/20';
    const boton =
        acento === 'blue'
            ? 'from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800'
            : 'from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700';

    return (
        <div className="flex flex-col min-h-0 flex-1">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-gradient-to-b from-gray-50 to-white dark:from-gray-950/50 dark:to-gray-900 custom-scrollbar">
                {cargando && (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400 gap-2">
                        <Loader2 className="w-4 h-4 animate-spin" /> Cargando mensajes…
                    </div>
                )}
                {!cargando && mensajes.length === 0 && (
                    <div className="h-full flex items-center justify-center text-sm text-gray-500 dark:text-gray-400">{vacio}</div>
                )}
                {mensajes.map((m) => {
                    const mio = m.autor_rol === miRol;
                    return (
                        <div key={m.id} className={`flex animate-fade-in ${mio ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${
                                    mio
                                        ? `${burbujaMia} text-white rounded-br-md`
                                        : 'bg-white dark:bg-gray-800 text-gray-900 dark:text-white border border-gray-200 dark:border-gray-700 rounded-bl-md'
                                }`}
                            >
                                <p className="leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
                                <p className={`text-[10px] mt-1 font-medium ${mio ? 'text-white/70' : 'text-gray-500 dark:text-gray-400'}`}>
                                    {tiempoRelativo(m.created_at)}
                                    {mio && m.leido_at && ' · Leído'}
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
                        maxLength={2000}
                        className="flex-1 resize-none px-2 py-1.5 max-h-32 text-sm bg-transparent text-gray-900 dark:text-white placeholder:text-gray-400 focus:outline-none"
                    />
                    <button
                        onClick={enviar}
                        disabled={!borrador.trim() || enviando}
                        className={`p-2.5 rounded-lg bg-gradient-to-br ${boton} disabled:from-gray-300 disabled:to-gray-400 dark:disabled:from-gray-700 dark:disabled:to-gray-700 disabled:cursor-not-allowed text-white shadow-md transition-all active:scale-95`}
                        title="Enviar"
                        aria-label="Enviar"
                    >
                        {enviando ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                    </button>
                </div>
                <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1.5 ml-2">
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">Enter</kbd> para enviar ·{' '}
                    <kbd className="px-1 py-0.5 rounded bg-gray-100 dark:bg-gray-800 font-mono text-[10px]">Shift + Enter</kbd> para salto de línea
                </p>
            </div>
        </div>
    );
}

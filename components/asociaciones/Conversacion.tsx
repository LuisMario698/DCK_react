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
    comoAsociacion = false,
}: {
    asociacionId: number;
    miRol: 'admin' | 'recolector';
    /** Superadmin en el portal recolector: escribe y marca leídos a nombre de su asociación. */
    comoAsociacion?: boolean;
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
            marcarMensajesLeidos(asociacionId, comoAsociacion)
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
    }, [asociacionId, miRol, comoAsociacion]);

    useEffect(() => {
        scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
    }, [mensajes]);

    const enviar = async () => {
        const texto = borrador.trim();
        if (!texto || enviando) return;
        setEnviando(true);
        try {
            const nuevo = await enviarMensaje(asociacionId, texto, comoAsociacion);
            setMensajes((prev) => (prev.some((m) => m.id === nuevo.id) ? prev : [...prev, nuevo]));
            setBorrador('');
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudo enviar el mensaje.'));
        } finally {
            setEnviando(false);
        }
    };

    // Colores sólidos del lenguaje SiMAR (sin degradados). Verde fijo #127A5D: 5.3:1 con blanco en ambos temas.
    const burbujaMia = acento === 'blue' ? 'bg-simar-marea' : 'bg-[#127A5D]';
    const boton = acento === 'blue' ? 'bg-simar-marea hover:bg-simar-marea-hover' : 'bg-[#127A5D] hover:bg-[#0E6A50]';

    return (
        <div className="flex flex-col min-h-0 flex-1">
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-5 space-y-3 bg-simar-papel custom-scrollbar">
                {cargando && (
                    <div className="h-full flex items-center justify-center text-lg text-simar-texto-2 gap-2.5">
                        <Loader2 className="w-5 h-5 animate-spin" /> Cargando mensajes…
                    </div>
                )}
                {!cargando && mensajes.length === 0 && (
                    <div className="h-full flex items-center justify-center text-lg text-simar-texto-2">{vacio}</div>
                )}
                {mensajes.map((m) => {
                    const mio = m.autor_rol === miRol;
                    return (
                        <div key={m.id} className={`flex ${mio ? 'justify-end' : 'justify-start'}`}>
                            <div
                                className={`max-w-[75%] px-4 py-3 rounded-2xl text-lg ${
                                    mio
                                        ? `${burbujaMia} text-white rounded-br-md`
                                        : 'bg-simar-superficie text-simar-texto border border-simar-borde rounded-bl-md'
                                }`}
                            >
                                <p className="leading-relaxed whitespace-pre-wrap break-words">{m.texto}</p>
                                <p className={`text-[15px] mt-1 ${mio ? 'text-white/85' : 'text-simar-texto-2'}`}>
                                    {tiempoRelativo(m.created_at)}
                                    {mio && m.leido_at && ' · Leído'}
                                </p>
                            </div>
                        </div>
                    );
                })}
            </div>

            <div className="p-4 border-t border-simar-borde bg-simar-superficie">
                <div className="flex items-end gap-2 bg-simar-superficie rounded-2xl p-2 border-2 border-simar-campo-borde focus-within:border-simar-marea-tinta transition-colors">
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
                        className="flex-1 resize-none px-2 py-2.5 max-h-32 text-lg bg-transparent text-simar-texto placeholder:text-simar-texto-3 focus:outline-none"
                    />
                    <button
                        onClick={enviar}
                        disabled={!borrador.trim() || enviando}
                        className={`w-12 h-12 flex-shrink-0 flex items-center justify-center rounded-xl ${boton} disabled:bg-simar-borde disabled:text-simar-texto-2 disabled:cursor-not-allowed text-white transition-colors`}
                        title="Enviar"
                        aria-label="Enviar"
                    >
                        {enviando ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
                    </button>
                </div>
                <p className="text-[15px] text-simar-texto-2 mt-2 ml-2">
                    <kbd className="px-1.5 py-0.5 rounded-md bg-simar-papel font-sans font-bold text-[15px]">Enter</kbd> para enviar ·{' '}
                    <kbd className="px-1.5 py-0.5 rounded-md bg-simar-papel font-sans font-bold text-[15px]">Shift + Enter</kbd> para salto de línea
                </p>
            </div>
        </div>
    );
}

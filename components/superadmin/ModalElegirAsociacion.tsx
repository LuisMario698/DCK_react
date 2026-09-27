'use client';

import { useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Recycle, Search } from 'lucide-react';
import { BotonPrimario, BotonSecundario, Cargando, Modal, inputCls, mensajeError } from '@/components/asociaciones/ui';
import { getAsociaciones } from '@/lib/services/asociaciones';
import { vincularMiAsociacion } from '@/lib/services/superadmin';
import type { AsociacionRecolectora } from '@/types/database';

/** Evento que avisa a los sidebars que cambió la asociación del superadmin. */
export const EVENTO_PERFIL_ACTUALIZADO = 'simar:perfil-actualizado';

/**
 * El superadmin elige con qué asociación usa el portal recolector. Lo que haga
 * ahí (solicitudes, mensajes, datos de contacto) queda a nombre de ella.
 */
export function ModalElegirAsociacion({
    actual,
    onClose,
    onElegida,
}: {
    actual: number | null;
    onClose: () => void;
    /** Se llama tras guardar; `null` si quitó el vínculo. */
    onElegida: (id: number | null) => void;
}) {
    const [asociaciones, setAsociaciones] = useState<AsociacionRecolectora[] | null>(null);
    const [elegida, setElegida] = useState<number | null>(actual);
    const [busqueda, setBusqueda] = useState('');
    const [guardando, setGuardando] = useState(false);

    useEffect(() => {
        getAsociaciones()
            .then(setAsociaciones)
            .catch((err) => toast.error(mensajeError(err, 'No se pudieron cargar las asociaciones.')));
    }, []);

    const filtradas = useMemo(() => {
        const q = busqueda.trim().toLowerCase();
        return (asociaciones ?? []).filter((a) => !q || `${a.nombre_asociacion} ${a.rfc ?? ''}`.toLowerCase().includes(q));
    }, [asociaciones, busqueda]);

    const guardar = async (id: number | null) => {
        setGuardando(true);
        try {
            await vincularMiAsociacion(id);
            window.dispatchEvent(new Event(EVENTO_PERFIL_ACTUALIZADO));
            onElegida(id);
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal
            titulo="Portal de asociación"
            subtitulo="Elige a nombre de qué asociación usarás el portal recolector."
            onClose={onClose}
        >
            {!asociaciones ? (
                <Cargando />
            ) : asociaciones.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 py-6 text-center">
                    No hay asociaciones registradas. Créalas en el recinto portuario → Asociaciones recolectoras.
                </p>
            ) : (
                <div className="space-y-4">
                    {asociaciones.length > 5 && (
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                className={`${inputCls} pl-9`}
                                placeholder="Buscar asociación"
                                value={busqueda}
                                onChange={(e) => setBusqueda(e.target.value)}
                                aria-label="Buscar asociación"
                            />
                        </div>
                    )}
                    <ul role="radiogroup" aria-label="Asociaciones" className="space-y-2 max-h-[45vh] overflow-y-auto">
                        {filtradas.map((a) => {
                            const activa = elegida === a.id;
                            return (
                                <li key={a.id}>
                                    <button
                                        type="button"
                                        role="radio"
                                        aria-checked={activa}
                                        onClick={() => setElegida(a.id)}
                                        className={`w-full flex items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                                            activa
                                                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/20'
                                                : 'border-gray-200 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50'
                                        }`}
                                    >
                                        <span className="w-9 h-9 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 flex items-center justify-center flex-shrink-0">
                                            <Recycle className="w-4 h-4" />
                                        </span>
                                        <span className="min-w-0 flex-1">
                                            <span className="block text-sm font-semibold text-gray-900 dark:text-white">{a.nombre_asociacion}</span>
                                            <span className="block text-xs text-gray-500 dark:text-gray-400">
                                                {a.estado !== 'Activo' ? `Asociación ${a.estado.toLowerCase()} · ` : ''}
                                                {a.rfc || 'Sin RFC'}
                                            </span>
                                        </span>
                                        {activa && <Check className="w-5 h-5 text-emerald-600 dark:text-emerald-400 flex-shrink-0" />}
                                    </button>
                                </li>
                            );
                        })}
                    </ul>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                        Sigues siendo administrador del recinto portuario. En el portal, las solicitudes y los mensajes que
                        envíes quedan a nombre de la asociación elegida.
                    </p>
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-1">
                        {actual ? (
                            <button
                                type="button"
                                onClick={() => guardar(null)}
                                disabled={guardando}
                                className="text-sm font-semibold text-red-600 dark:text-red-400 hover:underline disabled:opacity-50"
                            >
                                Quitar vínculo
                            </button>
                        ) : (
                            <span />
                        )}
                        <div className="flex gap-2">
                            <BotonSecundario type="button" onClick={onClose}>
                                Cancelar
                            </BotonSecundario>
                            <BotonPrimario onClick={() => elegida && guardar(elegida)} cargando={guardando} disabled={!elegida}>
                                Entrar al portal
                            </BotonPrimario>
                        </div>
                    </div>
                </div>
            )}
        </Modal>
    );
}

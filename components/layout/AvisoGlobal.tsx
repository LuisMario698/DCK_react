'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, Wrench, X } from 'lucide-react';
import { getConfiguracionPublica, type ConfiguracionPublica, type TipoAviso } from '@/lib/services/configuracion';

/** Evento que lanza /superadmin/sistema al guardar para refrescar el aviso sin recargar. */
export const EVENTO_CONFIG_ACTUALIZADA = 'simar:config-actualizada';

// Colores del lenguaje de diseño SiMAR (DISEÑO_SIMAR.md → "Avisos"). El texto siempre en color de texto;
// el tono va en el fondo y en el ícono.
const ESTILO: Record<TipoAviso, { Icono: typeof Info; cls: string; icono: string }> = {
    info: {
        Icono: Info,
        cls: 'border-transparent bg-simar-marea-suave',
        icono: 'text-simar-marea-tinta',
    },
    advertencia: {
        Icono: AlertTriangle,
        cls: 'border-transparent bg-simar-coral-suave',
        icono: 'text-simar-coral',
    },
    critico: {
        Icono: AlertOctagon,
        cls: 'border-simar-coral bg-simar-coral-suave',
        icono: 'text-simar-coral',
    },
};

const CLAVE_CERRADO = 'simar_aviso_cerrado';

/**
 * Banner con el aviso global que publica el superadmin. Se puede cerrar
 * (queda cerrado en esta pestaña hasta que cambie el mensaje).
 * Con `mostrarMantenimiento` avisa además de que el modo mantenimiento está activo.
 */
export function AvisoGlobal({
    mostrarMantenimiento = false,
    className = '',
}: {
    mostrarMantenimiento?: boolean;
    className?: string;
}) {
    const [config, setConfig] = useState<ConfiguracionPublica | null>(null);
    const [cerrado, setCerrado] = useState<string | null>(() => {
        try {
            return sessionStorage.getItem(CLAVE_CERRADO);
        } catch {
            // Sin sessionStorage (servidor o navegador que lo bloquea): no se recuerda el cierre
            return null;
        }
    });

    const cargar = useCallback(() => {
        getConfiguracionPublica().then(setConfig);
    }, []);

    useEffect(() => {
        cargar();
        window.addEventListener(EVENTO_CONFIG_ACTUALIZADA, cargar);
        return () => window.removeEventListener(EVENTO_CONFIG_ACTUALIZADA, cargar);
    }, [cargar]);

    const aviso = config?.aviso_global;
    const mensaje = aviso?.activo ? aviso.mensaje?.trim() : '';
    const verAviso = !!mensaje && cerrado !== mensaje;
    const verMantenimiento = mostrarMantenimiento && !!config?.mantenimiento.activo;

    if (!verAviso && !verMantenimiento) return null;

    const { Icono, cls, icono } = ESTILO[aviso?.tipo ?? 'info'] ?? ESTILO.info;

    const cerrar = () => {
        setCerrado(mensaje ?? null);
        try {
            sessionStorage.setItem(CLAVE_CERRADO, mensaje ?? '');
        } catch {
            // ignorado
        }
    };

    return (
        // relative z-10: el fondo decorativo del inicio del recinto es una capa fixed que lo tapaba
        <div className={`relative z-10 mb-5 space-y-3 ${className}`}>
            {verMantenimiento && (
                <div className="flex items-start gap-3 rounded-2xl bg-simar-violeta-suave p-5 text-base text-simar-texto">
                    <Wrench className="w-6 h-6 flex-shrink-0 text-simar-violeta" />
                    <p>
                        <strong>Modo mantenimiento activo.</strong> Sólo los superadministradores pueden entrar a los
                        paneles; el resto ve la página de mantenimiento.
                    </p>
                </div>
            )}
            {verAviso && (
                <div role="status" className={`flex items-start gap-3 rounded-2xl border-2 p-5 text-base text-simar-texto ${cls}`}>
                    <Icono className={`w-6 h-6 flex-shrink-0 ${icono}`} />
                    <p className="flex-1 self-center whitespace-pre-line">{mensaje}</p>
                    <button onClick={cerrar} className="-my-2 -mr-2 w-11 h-11 flex-shrink-0 rounded-xl flex items-center justify-center text-simar-texto-2 hover:text-simar-texto hover:bg-white/50 dark:hover:bg-white/10" aria-label="Cerrar aviso">
                        <X className="w-5 h-5" />
                    </button>
                </div>
            )}
        </div>
    );
}

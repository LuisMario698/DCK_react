'use client';

import { useCallback, useEffect, useState } from 'react';
import { AlertOctagon, AlertTriangle, Info, Wrench, X } from 'lucide-react';
import { getConfiguracionPublica, type ConfiguracionPublica, type TipoAviso } from '@/lib/services/configuracion';

/** Evento que lanza /superadmin/sistema al guardar para refrescar el aviso sin recargar. */
export const EVENTO_CONFIG_ACTUALIZADA = 'simar:config-actualizada';

const ESTILO: Record<TipoAviso, { Icono: typeof Info; cls: string }> = {
    info: {
        Icono: Info,
        cls: 'border-blue-200 dark:border-blue-900/40 bg-blue-50 dark:bg-blue-900/10 text-blue-800 dark:text-blue-300',
    },
    advertencia: {
        Icono: AlertTriangle,
        cls: 'border-amber-200 dark:border-amber-900/40 bg-amber-50 dark:bg-amber-900/10 text-amber-800 dark:text-amber-300',
    },
    critico: {
        Icono: AlertOctagon,
        cls: 'border-red-200 dark:border-red-900/40 bg-red-50 dark:bg-red-900/10 text-red-800 dark:text-red-300',
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

    const { Icono, cls } = ESTILO[aviso?.tipo ?? 'info'] ?? ESTILO.info;

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
                <div className="flex items-start gap-3 rounded-xl border border-violet-200 dark:border-violet-900/40 bg-violet-50 dark:bg-violet-900/10 p-4 text-sm text-violet-800 dark:text-violet-300">
                    <Wrench className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                        <strong>Modo mantenimiento activo.</strong> Sólo los superadministradores pueden entrar a los
                        paneles; el resto ve la página de mantenimiento.
                    </p>
                </div>
            )}
            {verAviso && (
                <div role="status" className={`flex items-start gap-3 rounded-xl border p-4 text-sm ${cls}`}>
                    <Icono className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p className="flex-1 whitespace-pre-line">{mensaje}</p>
                    <button onClick={cerrar} className="p-0.5 rounded opacity-70 hover:opacity-100" aria-label="Cerrar aviso">
                        <X className="w-4 h-4" />
                    </button>
                </div>
            )}
        </div>
    );
}

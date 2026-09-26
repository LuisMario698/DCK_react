'use client';

import { useEffect, useState } from 'react';
import { usePathname } from 'next/navigation';
import { LogOut, RefreshCw, Wrench } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { getConfiguracionPublica } from '@/lib/services/configuracion';

/**
 * Pantalla del modo mantenimiento. El middleware manda aquí a todos los que
 * entran a un panel mientras está activo (salvo los superadmins).
 */
export default function MantenimientoPage() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const [mensaje, setMensaje] = useState<string | null>(null);
    const [reintentando, setReintentando] = useState(false);

    useEffect(() => {
        getConfiguracionPublica().then((c) => setMensaje(c?.mantenimiento.mensaje?.trim() || null));
    }, [user]);

    const reintentar = () => {
        setReintentando(true);
        // El middleware decide a qué panel corresponde (o vuelve aquí si sigue en mantenimiento)
        window.location.href = `/${locale}/dashboard`;
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-gray-50 dark:bg-gray-950">
            <div className="w-full max-w-md bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-xl p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-violet-100 dark:bg-violet-900/30 text-violet-600 dark:text-violet-400 flex items-center justify-center mb-5">
                    <Wrench className="w-8 h-8" />
                </div>
                <h1 className="text-xl font-bold text-gray-900 dark:text-white">SiMAR está en mantenimiento</h1>
                <p className="text-sm text-gray-600 dark:text-gray-400 mt-3 leading-relaxed whitespace-pre-line">
                    {mensaje ?? 'Estamos haciendo mejoras en el sistema. Vuelve a intentarlo en unos minutos.'}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={reintentar}
                        disabled={reintentando}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-60 transition-colors"
                    >
                        <RefreshCw className={`w-4 h-4 ${reintentando ? 'animate-spin' : ''}`} />
                        Volver a intentar
                    </button>
                    {user && (
                        <button
                            onClick={signOut}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                        >
                            <LogOut className="w-4 h-4" />
                            Cerrar sesión
                        </button>
                    )}
                </div>
            </div>
        </main>
    );
}

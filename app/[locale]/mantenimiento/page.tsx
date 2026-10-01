'use client';

import { useEffect, useState } from 'react';
import { useTituloPestana } from '@/components/layout/useTituloPestana';
import { usePathname } from 'next/navigation';
import { LogOut, RefreshCw, Wrench } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';
import { getConfiguracionPublica } from '@/lib/services/configuracion';

/**
 * Pantalla del modo mantenimiento. El middleware manda aquí a todos los que
 * entran a un panel mientras está activo (salvo los superadmins).
 */
export default function MantenimientoPage() {
    useTituloPestana('En mantenimiento');
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
        <main className="min-h-screen flex items-center justify-center p-4 bg-simar-papel">
            <div className="simar-aparece w-full max-w-md bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar p-8 text-center">
                <div className="mx-auto w-16 h-16 rounded-2xl bg-simar-violeta-suave text-simar-violeta flex items-center justify-center mb-5">
                    <Wrench className="w-8 h-8" />
                </div>
                <h1 className="text-[22px] font-extrabold leading-tight text-simar-texto">SiMAR está en mantenimiento</h1>
                <p className="text-base text-simar-texto-2 mt-3 leading-relaxed whitespace-pre-line">
                    {mensaje ?? 'Estamos haciendo mejoras en el sistema. Vuelve a intentarlo en unos minutos.'}
                </p>

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={reintentar}
                        disabled={reintentando}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-60 transition-colors min-h-[52px]"
                    >
                        <RefreshCw className={`w-4 h-4 ${reintentando ? 'animate-spin' : ''}`} />
                        Volver a intentar
                    </button>
                    {user && (
                        <button
                            onClick={signOut}
                            className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold text-simar-texto border border-simar-borde hover:bg-simar-papel transition-colors min-h-[52px]"
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

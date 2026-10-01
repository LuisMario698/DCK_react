'use client';

import { Suspense, useState } from 'react';
import { useTituloPestana } from '@/components/layout/useTituloPestana';
import { usePathname, useSearchParams } from 'next/navigation';
import { Ban, Clock, LogOut, RefreshCw } from 'lucide-react';
import { useAuth } from '@/components/layout/AuthProvider';

/**
 * Pantalla para cuentas con rol 'pendiente': se registraron sin invitación o
 * el administrador les quitó el acceso. El middleware las envía aquí, y
 * también a las cuentas suspendidas por un superadmin (?motivo=suspendida).
 */
export default function AccesoPendientePage() {
    useTituloPestana('Acceso pendiente');
    // useSearchParams necesita un límite de Suspense para el prerender
    return (
        <Suspense>
            <AccesoPendiente />
        </Suspense>
    );
}

function AccesoPendiente() {
    const { user, signOut } = useAuth();
    const pathname = usePathname();
    const suspendida = useSearchParams().get('motivo') === 'suspendida';
    const locale = pathname.split('/')[1] || 'es';
    const [reintentando, setReintentando] = useState(false);

    const reintentar = () => {
        setReintentando(true);
        // El middleware decide a qué panel corresponde según el rol actual
        window.location.href = `/${locale}/dashboard`;
    };

    return (
        <main className="min-h-screen flex items-center justify-center p-4 bg-simar-papel">
            <div className="simar-aparece w-full max-w-md bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar p-8 text-center">
                {suspendida ? (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-simar-coral-suave text-simar-coral flex items-center justify-center mb-5">
                            <Ban className="w-8 h-8" />
                        </div>
                        <h1 className="text-[22px] font-extrabold leading-tight text-simar-texto">Tu cuenta está suspendida</h1>
                        <p className="text-base text-simar-texto-2 mt-3 leading-relaxed">
                            {user?.email ? (
                                <>
                                    La cuenta <strong className="text-simar-texto">{user.email}</strong> no tiene
                                    acceso a SiMAR por el momento.
                                </>
                            ) : (
                                'Esta cuenta no tiene acceso a SiMAR por el momento.'
                            )}
                        </p>
                        <p className="text-base text-simar-texto-2 mt-2 leading-relaxed">
                            Si crees que es un error, comunícate con el centro de acopio de Puerto Peñasco.
                        </p>
                    </>
                ) : (
                    <>
                        <div className="mx-auto w-16 h-16 rounded-2xl bg-simar-coral-suave text-simar-coral flex items-center justify-center mb-5">
                            <Clock className="w-8 h-8" />
                        </div>
                        <h1 className="text-[22px] font-extrabold leading-tight text-simar-texto">Tu cuenta está pendiente de aprobación</h1>
                        <p className="text-base text-simar-texto-2 mt-3 leading-relaxed">
                            {user?.email ? (
                                <>
                                    La cuenta <strong className="text-simar-texto">{user.email}</strong> todavía no
                                    está vinculada a una empresa recolectora ni tiene permisos de administrador.
                                </>
                            ) : (
                                'Tu cuenta todavía no tiene permisos asignados.'
                            )}
                        </p>
                        <p className="text-base text-simar-texto-2 mt-2 leading-relaxed">
                            Pide al centro de acopio de Puerto Peñasco que vincule tu correo desde el módulo de
                            Empresas. En cuanto lo haga podrás entrar.
                        </p>
                    </>
                )}

                <div className="mt-6 flex flex-col sm:flex-row gap-3">
                    <button
                        onClick={reintentar}
                        disabled={reintentando}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-60 transition-colors min-h-[52px]"
                    >
                        <RefreshCw className={`w-4 h-4 ${reintentando ? 'animate-spin' : ''}`} />
                        Volver a intentar
                    </button>
                    <button
                        onClick={signOut}
                        className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-base font-bold text-simar-texto border border-simar-borde hover:bg-simar-papel transition-colors min-h-[52px]"
                    >
                        <LogOut className="w-4 h-4" />
                        Cerrar sesión
                    </button>
                </div>
            </div>
        </main>
    );
}

'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { toast } from 'sonner';

interface LoginFormProps {
    onSuccess?: () => void;
    redirectTo?: string;
    showLogo?: boolean;
}

type AuthView = 'login' | 'register' | 'verify' | 'forgot_password' | 'reset_password';

export function LoginForm({ onSuccess, redirectTo = '/dashboard', showLogo = true }: LoginFormProps) {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [token, setToken] = useState(''); // Código de verificación

    // New states for pass reset
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({
                    email,
                    password,
                });
                if (error) throw error;

                if (onSuccess) onSuccess();
                router.push(redirectTo);
                router.refresh();

            } else if (view === 'register') {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: {
                        data: {
                            full_name: fullName,
                        },
                    },
                });
                if (error) throw error;

                if (data.session) {
                    if (onSuccess) onSuccess();
                    router.push(redirectTo);
                    router.refresh();
                } else {
                    setMessage('Registro exitoso. Hemos enviado un código a tu correo.');
                    setView('verify'); // Cambiar a vista de verificación
                }

            } else if (view === 'verify') {
                const { error, data } = await supabase.auth.verifyOtp({
                    email,
                    token,
                    type: 'signup',
                });
                if (error) throw error;

                if (data.session) {
                    if (onSuccess) onSuccess();
                    router.push(redirectTo);
                    router.refresh();
                } else {
                    setMessage('Cuenta verificada correctamente. Inicia sesión.');
                    setView('login');
                }
            } else if (view === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                setMessage('Hemos enviado un código o enlace a tu correo.');
                setView('reset_password');
            } else if (view === 'reset_password') {
                // 1. Verify Passwords match
                if (password !== confirmPassword) {
                    throw new Error("Las contraseñas no coinciden.");
                }

                // 2. Verify OTP for Recovery
                const { error: verifyError, data: sessionData } = await supabase.auth.verifyOtp({
                    email,
                    token,
                    type: 'recovery',
                });

                if (verifyError) throw verifyError;

                // 3. Update Password
                if (sessionData.session) {
                    const { error: updateError } = await supabase.auth.updateUser({
                        password: password
                    });

                    if (updateError) throw updateError;

                    setMessage('Contraseña actualizada correctamente. Inicia sesión.');
                    setView('login');
                    setPassword('');
                    setConfirmPassword('');
                    setToken('');
                } else {
                    throw new Error("No se pudo verificar la sesión para cambiar la contraseña.");
                }
            }

        } catch (err: any) {
            // Traducir error de usuario duplicado
            if (err.message === 'User already registered') {
                setError('Este correo ya está registrado. Por favor inicia sesión.');
            } else if (err.message?.includes("Password should be")) {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else {
                setError(err.message || 'Error en la operación');
            }

            // Si el error es de confirmación en login, sugerir verificar
            if (view === 'login' && err.message?.includes('Email not confirmed')) {
                setMessage('Tu correo no ha sido confirmado. Ingresa el código que te enviamos.');
                setView('verify');
                setError(null);
            }
        } finally {
            setLoading(false);
        }
    };

    const handleResend = async () => {
        setLoading(true);
        setError(null);
        setMessage(null);
        try {
            const { error } = await supabase.auth.resend({
                type: 'signup',
                email,
            });
            if (error) throw error;
            setMessage('Código reenviado. Revisa tu correo (y spam).');
        } catch (err: any) {
            setError(err.message || 'Error al reenviar código');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="w-full">
            {showLogo && (
                <div className="text-center mb-8">
                    <div className="mx-auto h-20 w-auto relative mb-4 flex items-center justify-center">
                        <h1 className="text-4xl font-black text-blue-900 dark:text-white tracking-tight">
                            DCK
                        </h1>
                    </div>
                    <h2 className="mt-2 text-center text-3xl font-extrabold text-gray-900 dark:text-white">
                        {view === 'login' && 'Iniciar Sesión'}
                        {view === 'register' && 'Crear Cuenta'}
                        {view === 'verify' && 'Verificar Cuenta'}
                        {view === 'forgot_password' && 'Recuperar Contraseña'}
                        {view === 'reset_password' && 'Nueva Contraseña'}
                    </h2>
                    <p className="mt-2 text-center text-sm text-gray-600 dark:text-gray-400">
                        {view === 'login' && 'Accede al sistema de gestión'}
                        {view === 'register' && 'Regístrate para comenzar'}
                        {view === 'verify' && 'Ingresa el código enviado a ' + email}
                        {view === 'forgot_password' && 'Ingresa tu correo para recibir un código'}
                        {view === 'reset_password' && 'Ingresa el código y tu nueva contraseña'}
                    </p>
                </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
                {error && (
                    <div className="bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 px-4 py-3 rounded-md text-sm">
                        {error}
                    </div>
                )}
                {message && (
                    <div className="bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 text-green-700 dark:text-green-300 px-4 py-3 rounded-md text-sm">
                        {message}
                    </div>
                )}

                {/* VISTA REGISTRO: Nombre */}
                {view === 'register' && (
                    <div>
                        <label htmlFor="fullname" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Nombre Completo
                        </label>
                        <div className="mt-1">
                            <input
                                id="fullname"
                                name="fullname"
                                type="text"
                                autoComplete="name"
                                required={view === 'register'}
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors"
                            />
                        </div>
                    </div>
                )}

                {/* EMAIL: Visible en la mayoría de vistas */}
                {(view === 'login' || view === 'register' || view === 'verify' || view === 'forgot_password' || view === 'reset_password') && (
                    <div className={(view === 'verify' || view === 'reset_password') ? 'hidden' : ''}>
                        <label htmlFor="email" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Correo Electrónico
                        </label>
                        <div className="mt-1">
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                readOnly={view === 'verify' || view === 'reset_password'}
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={`appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors ${(view === 'verify' || view === 'reset_password') ? 'bg-gray-100 dark:bg-gray-800 cursor-not-allowed opacity-75' : ''}`}
                            />
                        </div>
                    </div>
                )}

                {/* VISTA VERIFY o RESET: Token Input */}
                {(view === 'verify' || view === 'reset_password') && (
                    <div>
                        <label htmlFor="token" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Código de Verificación
                        </label>
                        <div className="mt-1">
                            <input
                                id="token"
                                name="token"
                                type="text"
                                placeholder="123456"
                                required={view === 'verify' || view === 'reset_password'}
                                value={token}
                                onChange={(e) => setToken(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-blue-300 dark:border-blue-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white text-center text-2xl tracking-widest transition-colors"
                            />
                        </div>
                        {view === 'verify' && (
                            <div className="mt-2 text-right">
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="text-xs text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline disabled:opacity-50"
                                >
                                    ¿No recibiste el código? Reenviar
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {/* PASSWORD: Login, Register, Reset */}
                {(view === 'login' || view === 'register' || view === 'reset_password') && (
                    <div>
                        <label htmlFor="password" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            {view === 'reset_password' ? 'Nueva Contraseña' : 'Contraseña'}
                        </label>
                        <div className="mt-1 relative">
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? "text" : "password"}
                                autoComplete={view === 'login' ? "current-password" : "new-password"}
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                            >
                                {showPassword ? (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                                    </svg>
                                ) : (
                                    <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                                    </svg>
                                )}
                            </button>
                        </div>
                    </div>
                )}

                {/* CONFIRM PASSWORD: Reset Only */}
                {view === 'reset_password' && (
                    <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                            Confirmar Contraseña
                        </label>
                        <div className="mt-1 relative">
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                autoComplete="new-password"
                                required
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className="appearance-none block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white text-gray-900 dark:bg-gray-700 dark:text-white sm:text-sm transition-colors"
                            />
                        </div>
                    </div>
                )}

                {/* Login Extras: Remember Me & Forgot Password */}
                {view === 'login' && (
                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <input
                                id="remember-me"
                                name="remember-me"
                                type="checkbox"
                                className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                            />
                            <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-900 dark:text-gray-300">
                                Recordarme
                            </label>
                        </div>

                        <div className="text-sm">
                            <button
                                type="button"
                                onClick={() => {
                                    setView('forgot_password');
                                    setError(null);
                                    setMessage(null);
                                }}
                                className="font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 bg-transparent border-none cursor-pointer"
                            >
                                ¿Olvidaste tu contraseña?
                            </button>
                        </div>
                    </div>
                )}

                <div>
                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-all transform active:scale-95"
                    >
                        {loading ? (
                            <span className="flex items-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {view === 'verify' ? 'Verificando...' : 'Procesando...'}
                            </span>
                        ) : (
                            <>
                                {view === 'login' && 'Iniciar Sesión'}
                                {view === 'register' && 'Registrarse'}
                                {view === 'verify' && 'Confirmar Código'}
                                {view === 'forgot_password' && 'Enviar Código'}
                                {view === 'reset_password' && 'Cambiar Contraseña'}
                            </>
                        )}
                    </button>
                </div>

                {view !== 'verify' && view !== 'reset_password' && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setView(view === 'login' ? 'register' : 'login');
                                setError(null);
                                setMessage(null);
                            }}
                            className="text-sm font-medium text-blue-600 hover:text-blue-500 dark:text-blue-400 hover:underline"
                        >
                            {view === 'login'
                                ? "¿No tienes cuenta? Regístrate"
                                : view === 'register'
                                    ? "¿Ya tienes cuenta? Inicia sesión"
                                    : "Volver a Iniciar Sesión" // Texto para forgot_password
                            }
                        </button>
                    </div>
                )}

                {/* Botón para volver atrás desde verificar o reset */}
                {(view === 'verify' || view === 'reset_password') && (
                    <div className="mt-4 text-center">
                        <button
                            type="button"
                            onClick={() => {
                                setView('login');
                                setError(null);
                                setMessage(null);
                            }}
                            className="text-sm font-medium text-gray-500 hover:text-gray-700 dark:text-gray-400 hover:underline"
                        >
                            Cancelar y volver
                        </button>
                    </div>
                )}
            </form>
        </div>
    );
}

'use client';

import { useState } from 'react';
import Image from 'next/image';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Mail, Lock, User, KeyRound, ArrowLeft } from 'lucide-react';

import logoSimar from '@/assets/logo_simar.png';

interface LoginFormProps {
    onSuccess?: () => void;
    redirectTo?: string;
    showLogo?: boolean;
}

type AuthView = 'login' | 'register' | 'verify' | 'forgot_password' | 'reset_password';

const TITULOS: Record<AuthView, { titulo: string; subtitulo: string }> = {
    login: { titulo: 'Iniciar sesión', subtitulo: 'Accede al sistema de gestión de residuos' },
    register: { titulo: 'Crear cuenta', subtitulo: 'Regístrate para comenzar a operar' },
    verify: { titulo: 'Verifica tu correo', subtitulo: 'Introduce el código de 6 dígitos que te enviamos' },
    forgot_password: { titulo: 'Recuperar contraseña', subtitulo: 'Te enviaremos un código para restablecerla' },
    reset_password: { titulo: 'Nueva contraseña', subtitulo: 'Introduce el código y tu nueva contraseña' },
};

export function LoginForm({ onSuccess, redirectTo = '/dashboard', showLogo = true }: LoginFormProps) {
    const [view, setView] = useState<AuthView>('login');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [fullName, setFullName] = useState('');
    const [token, setToken] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');

    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [message, setMessage] = useState<string | null>(null);
    const router = useRouter();
    const supabase = createClient();

    const cambiarVista = (siguiente: AuthView) => {
        setView(siguiente);
        setError(null);
        setMessage(null);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        setMessage(null);

        try {
            if (view === 'login') {
                const { error } = await supabase.auth.signInWithPassword({ email, password });
                if (error) throw error;

                if (onSuccess) onSuccess();
                router.push(redirectTo);
                router.refresh();

            } else if (view === 'register') {
                const { error, data } = await supabase.auth.signUp({
                    email,
                    password,
                    options: { data: { full_name: fullName } },
                });
                if (error) throw error;

                if (data.session) {
                    if (onSuccess) onSuccess();
                    router.push(redirectTo);
                    router.refresh();
                } else {
                    setMessage('Registro exitoso. Revisa tu correo para continuar.');
                    setView('verify');
                }

            } else if (view === 'verify') {
                const { error, data } = await supabase.auth.verifyOtp({ email, token, type: 'signup' });
                if (error) throw error;

                if (data.session) {
                    if (onSuccess) onSuccess();
                    router.push(redirectTo);
                    router.refresh();
                } else {
                    setMessage('Cuenta verificada correctamente. Ya puedes iniciar sesión.');
                    setView('login');
                }

            } else if (view === 'forgot_password') {
                const { error } = await supabase.auth.resetPasswordForEmail(email);
                if (error) throw error;
                setMessage('Te enviamos un código a tu correo.');
                setView('reset_password');

            } else if (view === 'reset_password') {
                if (password !== confirmPassword) {
                    throw new Error('Las contraseñas no coinciden.');
                }

                const { error: verifyError, data: sessionData } = await supabase.auth.verifyOtp({
                    email,
                    token,
                    type: 'recovery',
                });
                if (verifyError) throw verifyError;

                if (sessionData.session) {
                    const { error: updateError } = await supabase.auth.updateUser({ password });
                    if (updateError) throw updateError;

                    setMessage('Contraseña actualizada. Ya puedes iniciar sesión.');
                    setView('login');
                    setPassword('');
                    setConfirmPassword('');
                    setToken('');
                } else {
                    throw new Error('No se pudo verificar el código para cambiar la contraseña.');
                }
            }

        } catch (err: any) {
            const msg: string = err?.message ?? '';

            if (msg === 'User already registered') {
                setError('Este correo ya está registrado. Inicia sesión.');
            } else if (msg.includes('Password should be')) {
                setError('La contraseña debe tener al menos 6 caracteres.');
            } else if (msg.includes('Invalid login credentials')) {
                setError('Correo o contraseña incorrectos.');
            } else if (msg.includes('Token has expired') || msg.includes('invalid')) {
                setError('El código es incorrecto o ya caducó. Solicita uno nuevo.');
            } else if (msg.toLowerCase().includes('rate limit') || msg.toLowerCase().includes('too many')) {
                setError('Demasiados intentos. Espera unos minutos antes de volver a probar.');
            } else {
                setError(msg || 'Ocurrió un error. Inténtalo de nuevo.');
            }

            if (view === 'login' && msg.includes('Email not confirmed')) {
                setMessage('Tu correo aún no está confirmado. Introduce el código que te enviamos.');
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
            const { error } = await supabase.auth.resend({ type: 'signup', email });
            if (error) throw error;
            setMessage('Código reenviado. Revisa tu bandeja y la carpeta de spam.');
        } catch (err: any) {
            setError(err?.message || 'No se pudo reenviar el código.');
        } finally {
            setLoading(false);
        }
    };

    const inputBase =
        'w-full rounded-xl border bg-white/60 dark:bg-slate-900/60 border-slate-300 dark:border-slate-700 ' +
        'px-10 py-2.5 text-sm text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 ' +
        'outline-none transition-all duration-200 backdrop-blur-sm ' +
        'focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 dark:focus:border-cyan-400';

    const iconoCampo = 'pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 dark:text-slate-500';

    const { titulo, subtitulo } = TITULOS[view];
    const esFlujoCodigo = view === 'verify' || view === 'reset_password';

    return (
        <div className="w-full">
            {showLogo && (
                <div className="mb-7 flex flex-col items-center">
                    <Image
                        src={logoSimar}
                        alt="SiMAR"
                        priority
                        className="h-20 w-auto object-contain"
                    />
                </div>
            )}

            <div className="mb-6 text-center">
                <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{titulo}</h2>
                <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400">
                    {view === 'verify' ? (
                        <>
                            Enviado a <span className="font-medium text-slate-700 dark:text-slate-300">{email}</span>
                        </>
                    ) : (
                        subtitulo
                    )}
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div aria-live="polite" className="space-y-3 empty:hidden">
                    {error && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-red-200 dark:border-red-900/60 bg-red-50 dark:bg-red-950/40 px-3.5 py-3 text-sm text-red-700 dark:text-red-300">
                            <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div className="flex items-start gap-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 px-3.5 py-3 text-sm text-emerald-700 dark:text-emerald-300">
                            <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                            <span>{message}</span>
                        </div>
                    )}
                </div>

                {view === 'register' && (
                    <div>
                        <label htmlFor="fullname" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                            Nombre completo
                        </label>
                        <div className="relative">
                            <User className={iconoCampo} />
                            <input
                                id="fullname"
                                name="fullname"
                                type="text"
                                autoComplete="name"
                                required
                                placeholder="Juan Pérez"
                                value={fullName}
                                onChange={(e) => setFullName(e.target.value)}
                                className={inputBase}
                            />
                        </div>
                    </div>
                )}

                {!esFlujoCodigo && (
                    <div>
                        <label htmlFor="email" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                            Correo electrónico
                        </label>
                        <div className="relative">
                            <Mail className={iconoCampo} />
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                placeholder="tucorreo@ejemplo.com"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className={inputBase}
                            />
                        </div>
                    </div>
                )}

                {esFlujoCodigo && (
                    <div>
                        <label htmlFor="token" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                            Código de verificación
                        </label>
                        <input
                            id="token"
                            name="token"
                            type="text"
                            inputMode="numeric"
                            autoComplete="one-time-code"
                            maxLength={6}
                            placeholder="000000"
                            required
                            value={token}
                            onChange={(e) => setToken(e.target.value.replace(/\D/g, ''))}
                            className="w-full rounded-xl border border-slate-300 dark:border-slate-700 bg-white/60 dark:bg-slate-900/60 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-slate-900 dark:text-slate-100 placeholder-slate-300 dark:placeholder-slate-700 outline-none backdrop-blur-sm transition-all duration-200 focus:border-cyan-500 focus:ring-4 focus:ring-cyan-500/15 dark:focus:border-cyan-400"
                        />
                        {view === 'verify' && (
                            <div className="mt-2 flex items-center justify-between text-xs">
                                <span className="text-slate-400 dark:text-slate-500">¿No llegó? Revisa spam.</span>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="font-medium text-cyan-600 dark:text-cyan-400 hover:underline disabled:opacity-50"
                                >
                                    Reenviar código
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {(view === 'login' || view === 'register' || view === 'reset_password') && (
                    <div>
                        <label htmlFor="password" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                            {view === 'reset_password' ? 'Nueva contraseña' : 'Contraseña'}
                        </label>
                        <div className="relative">
                            <Lock className={iconoCampo} />
                            <input
                                id="password"
                                name="password"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete={view === 'login' ? 'current-password' : 'new-password'}
                                required
                                placeholder="••••••••"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className={`${inputBase} pr-10`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-300 transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                            </button>
                        </div>
                        {view === 'register' && (
                            <p className="mt-1.5 text-xs text-slate-400 dark:text-slate-500">Mínimo 6 caracteres.</p>
                        )}
                    </div>
                )}

                {view === 'reset_password' && (
                    <div>
                        <label htmlFor="confirmPassword" className="block text-xs font-semibold uppercase tracking-wide text-slate-500 dark:text-slate-400 mb-1.5">
                            Confirmar contraseña
                        </label>
                        <div className="relative">
                            <KeyRound className={iconoCampo} />
                            <input
                                id="confirmPassword"
                                name="confirmPassword"
                                type={showPassword ? 'text' : 'password'}
                                autoComplete="new-password"
                                required
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                className={inputBase}
                            />
                        </div>
                    </div>
                )}

                {view === 'login' && (
                    <div className="flex justify-end -mt-1">
                        <button
                            type="button"
                            onClick={() => cambiarVista('forgot_password')}
                            className="text-sm font-medium text-cyan-600 dark:text-cyan-400 hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-cyan-600 to-emerald-600 px-4 py-3 text-sm font-semibold text-white shadow-lg shadow-cyan-600/20 transition-all duration-200 hover:from-cyan-500 hover:to-emerald-500 hover:shadow-cyan-500/30 focus:outline-none focus:ring-4 focus:ring-cyan-500/30 active:scale-[0.98] disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            {view === 'verify' ? 'Verificando…' : 'Procesando…'}
                        </>
                    ) : (
                        <>
                            {view === 'login' && 'Iniciar sesión'}
                            {view === 'register' && 'Crear cuenta'}
                            {view === 'verify' && 'Confirmar código'}
                            {view === 'forgot_password' && 'Enviar código'}
                            {view === 'reset_password' && 'Cambiar contraseña'}
                        </>
                    )}
                </button>

                <div className="pt-1 text-center">
                    {view === 'login' && (
                        <button
                            type="button"
                            onClick={() => cambiarVista('register')}
                            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            ¿No tienes cuenta?{' '}
                            <span className="font-semibold text-cyan-600 dark:text-cyan-400">Regístrate</span>
                        </button>
                    )}
                    {view === 'register' && (
                        <button
                            type="button"
                            onClick={() => cambiarVista('login')}
                            className="text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            ¿Ya tienes cuenta?{' '}
                            <span className="font-semibold text-cyan-600 dark:text-cyan-400">Inicia sesión</span>
                        </button>
                    )}
                    {(view === 'verify' || view === 'reset_password' || view === 'forgot_password') && (
                        <button
                            type="button"
                            onClick={() => cambiarVista('login')}
                            className="inline-flex items-center gap-1.5 text-sm text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200 transition-colors"
                        >
                            <ArrowLeft className="w-3.5 h-3.5" />
                            Volver a iniciar sesión
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

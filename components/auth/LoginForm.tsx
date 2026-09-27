'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AlertCircle, Eye, EyeOff, Loader2, Mail, Lock, User, KeyRound, ArrowLeft } from 'lucide-react';
import { PalomitaAnimada } from '@/components/ui/movimiento';

import { LogoSimar } from '@/components/layout/LogoSimar';

interface LoginFormProps {
    onSuccess?: () => void;
    redirectTo?: string;
    showLogo?: boolean;
    /** Muestra el enlace «Regístrate» (no aplica al acceso de desarrollador). */
    permitirRegistro?: boolean;
}

type AuthView = 'login' | 'register' | 'verify' | 'forgot_password' | 'reset_password';

const TITULOS: Record<AuthView, { titulo: string; subtitulo: string }> = {
    login: { titulo: 'Iniciar sesión', subtitulo: 'Accede al sistema de gestión de residuos' },
    register: { titulo: 'Crear cuenta', subtitulo: 'Usa el correo con el que te invitó el centro de acopio' },
    verify: { titulo: 'Verifica tu correo', subtitulo: 'Introduce el código de 6 dígitos que te enviamos' },
    forgot_password: { titulo: 'Recuperar contraseña', subtitulo: 'Te enviaremos un código para restablecerla' },
    reset_password: { titulo: 'Nueva contraseña', subtitulo: 'Introduce el código y tu nueva contraseña' },
};

export function LoginForm({ onSuccess, redirectTo = '/dashboard', showLogo = true, permitirRegistro = true }: LoginFormProps) {
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

    // Lenguaje de diseño SiMAR (DISEÑO_SIMAR.md): campos de 60 px, letra 18 px, sólo tokens (sin dark:)
    const inputBase =
        'w-full min-h-[60px] rounded-[14px] border-2 bg-simar-superficie border-simar-campo-borde ' +
        'pl-12 pr-4 text-lg text-simar-texto placeholder:text-simar-texto-3 ' +
        'outline-none transition-colors duration-200 focus:border-simar-marea-tinta';

    const iconoCampo = 'pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-[22px] h-[22px] text-simar-texto-2';

    const { titulo, subtitulo } = TITULOS[view];
    const esFlujoCodigo = view === 'verify' || view === 'reset_password';

    return (
        <div className="w-full">
            {showLogo && (
                <div className="mb-4 flex flex-col items-center">
                    <LogoSimar variante="simbolo" tamano={64} />
                </div>
            )}

            {/* El título entra de nuevo al cambiar de paso (entrar, crear cuenta, código…) */}
            <div key={view} className="simar-aparece mb-6 text-center">
                <h2 className="text-[28px] font-extrabold text-simar-texto">{titulo}</h2>
                <p className="mt-1.5 text-lg text-simar-texto-2">
                    {view === 'verify' ? (
                        <>
                            Enviado a <span className="font-bold text-simar-texto">{email}</span>
                        </>
                    ) : (
                        subtitulo
                    )}
                </p>
            </div>

            <form className="space-y-5" onSubmit={handleSubmit} noValidate>
                <div aria-live="polite" className="space-y-3 empty:hidden">
                    {error && (
                        <div key={error} className="simar-aparece flex items-start gap-2.5 rounded-[14px] bg-simar-coral-suave px-4 py-3 text-base font-semibold text-simar-coral">
                            <AlertCircle className="w-5 h-5 mt-0.5 flex-shrink-0" />
                            <span>{error}</span>
                        </div>
                    )}
                    {message && (
                        <div key={message} className="simar-aparece flex items-start gap-2.5 rounded-[14px] bg-simar-arrecife-suave px-4 py-3 text-base font-semibold text-simar-arrecife-tinta">
                            <PalomitaAnimada tamano={20} className="mt-0.5" />
                            <span>{message}</span>
                        </div>
                    )}
                </div>

                {view === 'register' && (
                    <p className="text-base text-simar-texto-2 leading-relaxed">
                        El acceso se habilita cuando el administrador del centro de acopio vincula tu correo a tu
                        asociación. Si te registras con otro correo, tu cuenta quedará pendiente de aprobación.
                    </p>
                )}

                {view === 'register' && (
                    <div>
                        <label htmlFor="fullname" className="block mb-2 text-[17px] font-bold text-simar-texto">
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
                        <label htmlFor="email" className="block mb-2 text-[17px] font-bold text-simar-texto">
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
                        <label htmlFor="token" className="block mb-2 text-[17px] font-bold text-simar-texto">
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
                            className="w-full min-h-[64px] rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie px-4 text-center font-mono text-2xl tracking-[0.5em] text-simar-texto placeholder:text-simar-texto-3 outline-none transition-colors focus:border-simar-marea-tinta"
                        />
                        {view === 'verify' && (
                            <div className="mt-2 flex items-center justify-between text-base">
                                <span className="text-simar-texto-2">¿No llegó? Revisa spam.</span>
                                <button
                                    type="button"
                                    onClick={handleResend}
                                    disabled={loading}
                                    className="min-h-[44px] font-bold text-simar-marea-tinta hover:underline disabled:opacity-50"
                                >
                                    Reenviar código
                                </button>
                            </div>
                        )}
                    </div>
                )}

                {(view === 'login' || view === 'register' || view === 'reset_password') && (
                    <div>
                        <label htmlFor="password" className="block mb-2 text-[17px] font-bold text-simar-texto">
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
                                className={`${inputBase} pr-14`}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                aria-label={showPassword ? 'Ocultar contraseña' : 'Mostrar contraseña'}
                                className="absolute right-2 top-1/2 -translate-y-1/2 w-11 h-11 flex items-center justify-center rounded-xl text-simar-texto-2 hover:text-simar-texto transition-colors"
                            >
                                {showPassword ? <EyeOff className="w-[22px] h-[22px]" /> : <Eye className="w-[22px] h-[22px]" />}
                            </button>
                        </div>
                        {view === 'register' && (
                            <p className="mt-1.5 text-base text-simar-texto-2">Mínimo 6 caracteres.</p>
                        )}
                    </div>
                )}

                {view === 'reset_password' && (
                    <div>
                        <label htmlFor="confirmPassword" className="block mb-2 text-[17px] font-bold text-simar-texto">
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
                            className="min-h-[44px] text-base font-bold text-simar-marea-tinta hover:underline"
                        >
                            ¿Olvidaste tu contraseña?
                        </button>
                    </div>
                )}

                <button
                    type="submit"
                    disabled={loading}
                    className="w-full min-h-[62px] flex items-center justify-center gap-2 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover px-4 text-xl font-extrabold text-white transition-colors duration-200 disabled:cursor-not-allowed disabled:opacity-60"
                >
                    {loading ? (
                        <>
                            <Loader2 className="w-5 h-5 animate-spin" />
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
                    {view === 'login' && permitirRegistro && (
                        <button
                            type="button"
                            onClick={() => cambiarVista('register')}
                            className="min-h-[44px] text-base text-simar-texto-2 hover:text-simar-texto transition-colors"
                        >
                            ¿No tienes cuenta?{' '}
                            <span className="font-bold text-simar-marea-tinta">Regístrate</span>
                        </button>
                    )}
                    {view === 'register' && (
                        <button
                            type="button"
                            onClick={() => cambiarVista('login')}
                            className="min-h-[44px] text-base text-simar-texto-2 hover:text-simar-texto transition-colors"
                        >
                            ¿Ya tienes cuenta?{' '}
                            <span className="font-bold text-simar-marea-tinta">Inicia sesión</span>
                        </button>
                    )}
                    {(view === 'verify' || view === 'reset_password' || view === 'forgot_password') && (
                        <button
                            type="button"
                            onClick={() => cambiarVista('login')}
                            className="min-h-[44px] inline-flex items-center gap-1.5 text-base text-simar-texto-2 hover:text-simar-texto transition-colors"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Volver a iniciar sesión
                        </button>
                    )}
                </div>
            </form>
        </div>
    );
}

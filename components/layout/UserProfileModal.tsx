'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import { toast } from 'sonner';

interface UserProfileModalProps {
    isOpen: boolean;
    onClose: () => void;
}

export function UserProfileModal({ isOpen, onClose }: UserProfileModalProps) {
    const { user } = useAuth();
    const supabase = createClient();
    const [loading, setLoading] = useState(false);

    // Form States
    const [fullName, setFullName] = useState('');
    const [email, setEmail] = useState('');

    // Modes
    const [mode, setMode] = useState<'view' | 'edit_name' | 'edit_email' | 'reset_password'>('view');
    const [step, setStep] = useState(1); // For multi-step flows (email/password)

    // Inputs for Email Change
    const [currentPassword, setCurrentPassword] = useState('');
    const [newEmail, setNewEmail] = useState('');

    // Inputs for Password Reset
    const [resetToken, setResetToken] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmNewPassword, setConfirmNewPassword] = useState('');
    const [showNewPassword, setShowNewPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    useEffect(() => {
        if (user) {
            setFullName(user.user_metadata?.full_name || '');
            setEmail(user.email || '');
        }
    }, [user, isOpen]);

    if (!isOpen) return null;

    // --- HANDLERS ---

    // 1. Update Name
    const handleUpdateName = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({
                data: { full_name: fullName }
            });
            if (error) throw error;
            toast.success('Nombre actualizado correctamente');
            setMode('view');
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    // 2. Update Email
    const handleVerifyPasswordForEmail = async () => {
        setLoading(true);
        try {
            // Verify password by signing in (re-auth)
            const { error } = await supabase.auth.signInWithPassword({
                email: user?.email!,
                password: currentPassword
            });
            if (error) throw error;

            setStep(2); // Move to input new email
        } catch (error: any) {
            toast.error('Contraseña incorrecta');
        } finally {
            setLoading(false);
        }
    };

    const handleUpdateEmail = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.updateUser({ email: newEmail });
            if (error) throw error;

            // setMode('view'); // DO NOT CLOSE YET
            setStep(3); // Show verification instructions
            setCurrentPassword('');
            // setNewEmail(''); // Keep to show in message
        } catch (error: any) {
            let msg = error.message;
            if (msg.includes('already registered') || msg.includes('assigned to another user')) {
                msg = 'Este correo electrónico ya está registrado por otro usuario.';
            }
            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    // 3. Update Password (Reset Flow)
    const handleSendResetCode = async () => {
        setLoading(true);
        try {
            const { error } = await supabase.auth.resetPasswordForEmail(user?.email!);
            if (error) throw error;
            toast.success('Código enviado a tu correo');
            setStep(2); // Move to verify code
        } catch (error: any) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    const handleResetPassword = async () => {
        if (newPassword !== confirmNewPassword) {
            toast.error('Las contraseñas no coinciden');
            return;
        }
        setLoading(true);
        try {
            // Verify OTP
            const { error: verifyError, data } = await supabase.auth.verifyOtp({
                email: user?.email!,
                token: resetToken,
                type: 'recovery'
            });

            if (verifyError) throw verifyError;

            if (data.session) {
                // Update Password
                const { error: updateError } = await supabase.auth.updateUser({
                    password: newPassword
                });
                if (updateError) throw updateError;

                toast.success('Contraseña actualizada correctamente');
                setMode('view');
                setStep(1);
                setResetToken('');
                setNewPassword('');
                setConfirmNewPassword('');
                setShowNewPassword(false);
                setShowConfirmPassword(false);
            }
        } catch (error: any) {
            let msg = error.message || 'Error al restablecer contraseña';

            // Translate common errors
            if (msg.includes('New password should be different from the old password')) {
                msg = 'La nueva contraseña debe ser diferente a la anterior.';
            } else if (msg.includes('Password should be at least')) {
                msg = 'La contraseña debe tener al menos 6 caracteres.';
            } else if (msg.includes('Token has expired or is invalid')) {
                msg = 'El código es inválido o ha expirado.';
            }

            toast.error(msg);
        } finally {
            setLoading(false);
        }
    };

    const resetState = () => {
        setMode('view');
        setStep(1);
        setCurrentPassword('');
        setNewEmail('');
        setResetToken('');
        setNewPassword('');
        setConfirmNewPassword('');
        setShowNewPassword(false);
        setShowConfirmPassword(false);
    };

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-gray-200 dark:border-slate-800 animate-in zoom-in-95 duration-200">
                {/* Header */}
                <div className="px-6 py-4 border-b border-gray-100 dark:border-slate-800 flex justify-between items-center bg-gray-50/50 dark:bg-slate-900/50">
                    <h2 className="text-xl font-bold text-slate-800 dark:text-white">Mi Perfil</h2>
                    <button onClick={onClose} className="p-1 rounded-full hover:bg-gray-200 dark:hover:bg-slate-800 text-gray-500 transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="p-6 space-y-6">
                    {/* AVATAR & BASIC INFO */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 text-2xl font-bold border-2 border-white dark:border-slate-800 shadow-md">
                            {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center">
                            <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Usuario</p>
                        </div>
                    </div>

                    {/* --- VIEW MODE --- */}
                    {mode === 'view' && (
                        <div className="space-y-4">
                            {/* Nombre */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center group">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Nombre</label>
                                    <div className="font-medium text-gray-900 dark:text-white">{fullName}</div>
                                </div>
                                <button onClick={() => setMode('edit_name')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors text-sm font-medium opacity-0 group-hover:opacity-100 focus:opacity-100">
                                    Editar
                                </button>
                            </div>

                            {/* Email */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center group">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Correo</label>
                                    <div className="font-medium text-gray-900 dark:text-white truncate max-w-[200px]">{email}</div>
                                </div>
                                <button onClick={() => setMode('edit_email')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors text-sm font-medium opacity-0 group-hover:opacity-100 focus:opacity-100">
                                    Editar
                                </button>
                            </div>

                            {/* Contraseña */}
                            <div className="bg-gray-50 dark:bg-slate-800/50 p-3 rounded-lg border border-gray-100 dark:border-slate-700 flex justify-between items-center group">
                                <div>
                                    <label className="text-xs font-semibold text-gray-400 uppercase tracking-wider">Contraseña</label>
                                    <div className="font-medium text-gray-900 dark:text-white tracking-widest">••••••••</div>
                                </div>
                                <button onClick={() => setMode('reset_password')} className="p-2 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-md transition-colors text-sm font-medium opacity-0 group-hover:opacity-100 focus:opacity-100">
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- EDIT NAME MODE --- */}
                    {mode === 'edit_name' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nuevo Nombre</label>
                                <input
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                />
                            </div>
                            <div className="flex gap-2 justify-end">
                                <button onClick={resetState} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                <button onClick={handleUpdateName} disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- EDIT EMAIL MODE --- */}
                    {mode === 'edit_email' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            {step === 1 ? (
                                <>
                                    <div className="bg-yellow-50 dark:bg-yellow-900/20 p-3 rounded-lg text-sm text-yellow-800 dark:text-yellow-200 mb-2">
                                        Por seguridad, confirma tu contraseña actual para cambiar el correo.
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Contraseña Actual (para verificar)</label>
                                        <input
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={resetState} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                        <button onClick={handleVerifyPasswordForEmail} disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                            {loading ? 'Verificando...' : 'Continuar'}
                                        </button>
                                    </div>
                                </>
                            ) : step === 2 ? (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nuevo Correo Electrónico</label>
                                        <input
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all"
                                        />
                                    </div>
                                    <div className="flex gap-2 justify-end">
                                        <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Atrás</button>
                                        <button onClick={handleUpdateEmail} disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                            {loading ? 'Actualizando...' : 'Actualizar Correo'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // STEP 3: SUCCESS & VERIFICATION INSTRUCTIONS
                                <>
                                    <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-lg text-green-800 dark:text-green-200 mb-4 flex flex-col items-center text-center gap-3 animate-in zoom-in-95 duration-300">
                                        <div className="bg-green-100 dark:bg-green-800 p-3 rounded-full">
                                            <svg className="w-8 h-8 text-green-600 dark:text-green-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">¡Solicitud Enviada!</h3>
                                            <p className="text-sm">
                                                Hemos enviado un enlace de confirmación a: <br />
                                                <span className="font-bold text-green-700 dark:text-green-300">{newEmail}</span>
                                            </p>
                                            <p className="text-xs mt-3 opacity-90 border-t border-green-200 dark:border-green-800 pt-2">
                                                Para completar el cambio, por favor revisa tu bandeja y haz clic en el enlace.
                                                <br />
                                                <span className="italic">(Si no lo ves, revisa Spam)</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={resetState} className="px-6 py-2 text-sm text-white bg-green-600 hover:bg-green-700 rounded-lg shadow-sm transition-all hover:scale-105">
                                            Entendido, cerrar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* --- RESET PASSWORD MODE --- */}
                    {mode === 'reset_password' && (
                        <div className="space-y-4 animate-in slide-in-from-right-4 duration-200">
                            {step === 1 ? (
                                <>
                                    <div className="text-sm text-gray-600 dark:text-gray-300 mb-4">
                                        Para cambiar tu contraseña, enviaremos un código de verificación a: <strong>{user?.email}</strong>.
                                    </div>

                                    <div className="flex gap-2 justify-end">
                                        <button onClick={resetState} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Cancelar</button>
                                        <button onClick={handleSendResetCode} disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                            {loading ? 'Enviando...' : 'Enviar Código'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Código de Verificación</label>
                                            <input
                                                type="text"
                                                value={resetToken}
                                                onChange={(e) => setResetToken(e.target.value)}
                                                placeholder="123456"
                                                className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all tracking-widest text-center text-lg"
                                            />
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nueva Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                                                >
                                                    {showNewPassword ? (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                        <div>
                                            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Confirmar Contraseña</label>
                                            <div className="relative">
                                                <input
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmNewPassword}
                                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                    className="w-full px-3 py-2 bg-white dark:bg-slate-800 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:outline-none transition-all pr-10"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 focus:outline-none"
                                                >
                                                    {showConfirmPassword ? (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" /></svg>
                                                    ) : (
                                                        <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" /></svg>
                                                    )}
                                                </button>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex gap-2 justify-end mt-4">
                                        <button onClick={() => setStep(1)} className="px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-slate-800 rounded-lg">Atrás</button>
                                        <button onClick={handleResetPassword} disabled={loading} className="px-4 py-2 text-sm text-white bg-blue-600 hover:bg-blue-700 rounded-lg disabled:opacity-50">
                                            {loading ? 'Verificando...' : 'Cambiar Contraseña'}
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

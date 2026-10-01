'use client';

import { useState, useEffect, useRef } from 'react';
import { detalleDe } from '@/lib/utils/errores';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { createClient } from '@/lib/supabase/client';
import { useAuth } from '@/components/layout/AuthProvider';
import { toast } from 'sonner';
import { usePresencia } from '@/components/ui/movimiento';

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

    // Se queda montada mientras hace la salida (ver DISEÑO_SIMAR.md → Movimiento)
    // Foco adentro al abrir, Tab no se sale y al cerrar regresa al botón que la abrió
    const panelRef = useRef<HTMLDivElement>(null);
    useVentanaAccesible(panelRef, isOpen, { alEscape: () => !loading && onClose() });
    const { montado, saliendo } = usePresencia(isOpen);
    if (!montado) return null;

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
        } catch (causa) {
            const error = detalleDe(causa);
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
                email: user?.email ?? '',
                password: currentPassword
            });
            if (error) throw error;

            setStep(2); // Move to input new email
        } catch (causa) {
            const error = detalleDe(causa);
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
        } catch (causa) {
            const error = detalleDe(causa);
            let msg = error.message ?? 'No se pudo cambiar el correo. Inténtalo de nuevo.';
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
            const { error } = await supabase.auth.resetPasswordForEmail(user?.email ?? '');
            if (error) throw error;
            toast.success('Código enviado a tu correo');
            setStep(2); // Move to verify code
        } catch (causa) {
            const error = detalleDe(causa);
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
                email: user?.email ?? '',
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
        } catch (causa) {
            const error = detalleDe(causa);
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
        <div className={`${saliendo ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,34,54,0.55)] p-4`}>
            <div ref={panelRef} tabIndex={-1} role="dialog" aria-modal="true" aria-label="Mi perfil" className={`${saliendo ? 'simar-ventana-sale' : 'simar-ventana'} bg-simar-superficie rounded-[28px] shadow-2xl w-full max-w-md overflow-hidden border border-simar-borde outline-none`}>
                {/* Header */}
                <div className="px-7 pt-7 pb-2 flex justify-between items-center gap-4">
                    <h2 className="text-[22px] font-extrabold text-simar-texto">Mi perfil</h2>
                    <button onClick={onClose} aria-label="Cerrar" className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                    </button>
                </div>

                <div className="px-7 pb-7 pt-4 space-y-6">
                    {/* AVATAR & BASIC INFO */}
                    <div className="flex flex-col items-center gap-3">
                        <div className="h-20 w-20 rounded-full bg-simar-marea-suave flex items-center justify-center text-simar-marea-tinta text-2xl font-extrabold border-2 border-simar-superficie shadow-simar">
                            {fullName?.charAt(0).toUpperCase() || user?.email?.charAt(0).toUpperCase()}
                        </div>
                        <div className="text-center">
                            <p className="text-base font-medium text-simar-texto-2">Usuario</p>
                        </div>
                    </div>

                    {/* --- VIEW MODE --- */}
                    {mode === 'view' && (
                        <div className="space-y-4">
                            {/* Nombre */}
                            <div className="bg-simar-papel p-4 rounded-2xl flex justify-between items-center gap-3">
                                <div>
                                    <label className="text-[15px] font-bold text-simar-texto-2">Nombre</label>
                                    <div className="text-lg font-bold text-simar-texto">{fullName}</div>
                                </div>
                                <button onClick={() => setMode('edit_name')} className="min-h-[44px] px-4 rounded-xl text-base font-bold text-simar-marea-tinta border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">
                                    Editar
                                </button>
                            </div>

                            {/* Email */}
                            <div className="bg-simar-papel p-4 rounded-2xl flex justify-between items-center gap-3">
                                <div>
                                    <label className="text-[15px] font-bold text-simar-texto-2">Correo</label>
                                    <div className="text-lg font-bold text-simar-texto truncate max-w-[200px]">{email}</div>
                                </div>
                                <button onClick={() => setMode('edit_email')} className="min-h-[44px] px-4 rounded-xl text-base font-bold text-simar-marea-tinta border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">
                                    Editar
                                </button>
                            </div>

                            {/* Contraseña */}
                            <div className="bg-simar-papel p-4 rounded-2xl flex justify-between items-center gap-3">
                                <div>
                                    <label className="text-[15px] font-bold text-simar-texto-2">Contraseña</label>
                                    <div className="text-lg font-bold text-simar-texto">••••••••</div>
                                </div>
                                <button onClick={() => setMode('reset_password')} className="min-h-[44px] px-4 rounded-xl text-base font-bold text-simar-marea-tinta border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">
                                    Cambiar
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- EDIT NAME MODE --- */}
                    {mode === 'edit_name' && (
                        <div className="space-y-4 simar-aparece">
                            <div>
                                <label htmlFor="user-profile-modal-1" className="block text-[17px] font-bold text-simar-texto mb-2">Nuevo nombre</label>
                                <input id="user-profile-modal-1"
                                    type="text"
                                    value={fullName}
                                    onChange={(e) => setFullName(e.target.value)}
                                    className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                />
                            </div>
                            <div className="flex flex-wrap gap-3 justify-end">
                                <button onClick={resetState} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">Cancelar</button>
                                <button onClick={handleUpdateName} disabled={loading} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 transition-colors">
                                    {loading ? 'Guardando...' : 'Guardar'}
                                </button>
                            </div>
                        </div>
                    )}

                    {/* --- EDIT EMAIL MODE --- */}
                    {mode === 'edit_email' && (
                        <div className="space-y-4 simar-aparece">
                            {step === 1 ? (
                                <>
                                    <div className="bg-simar-coral-suave p-3 rounded-lg text-base text-simar-coral mb-2">
                                        Por seguridad, confirma tu contraseña actual para cambiar el correo.
                                    </div>
                                    <div>
                                        <label htmlFor="user-profile-modal-2" className="block text-[17px] font-bold text-simar-texto mb-2">Contraseña actual (para verificar)</label>
                                        <input id="user-profile-modal-2"
                                            type="password"
                                            value={currentPassword}
                                            onChange={(e) => setCurrentPassword(e.target.value)}
                                            className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3 justify-end">
                                        <button onClick={resetState} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">Cancelar</button>
                                        <button onClick={handleVerifyPasswordForEmail} disabled={loading} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 transition-colors">
                                            {loading ? 'Verificando...' : 'Continuar'}
                                        </button>
                                    </div>
                                </>
                            ) : step === 2 ? (
                                <>
                                    <div>
                                        <label htmlFor="user-profile-modal-3" className="block text-[17px] font-bold text-simar-texto mb-2">Nuevo correo electrónico</label>
                                        <input id="user-profile-modal-3"
                                            type="email"
                                            value={newEmail}
                                            onChange={(e) => setNewEmail(e.target.value)}
                                            className="w-full px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                        />
                                    </div>
                                    <div className="flex flex-wrap gap-3 justify-end">
                                        <button onClick={() => setStep(1)} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">Atrás</button>
                                        <button onClick={handleUpdateEmail} disabled={loading} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 transition-colors">
                                            {loading ? 'Actualizando...' : 'Actualizar Correo'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                // STEP 3: SUCCESS & VERIFICATION INSTRUCTIONS
                                <>
                                    <div className="bg-simar-arrecife-suave p-4 rounded-lg text-simar-arrecife-tinta mb-4 flex flex-col items-center text-center gap-3 simar-confirma">
                                        <div className="bg-simar-arrecife-suave p-3 rounded-full">
                                            <svg className="w-8 h-8 text-simar-arrecife-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>
                                        </div>
                                        <div>
                                            <h3 className="font-bold text-lg mb-1">¡Solicitud enviada!</h3>
                                            <p className="text-base">
                                                Hemos enviado un enlace de confirmación a: <br />
                                                <span className="font-bold text-simar-arrecife-tinta">{newEmail}</span>
                                            </p>
                                            <p className="text-[15px] mt-3 opacity-90 border-t border-simar-arrecife/30 pt-2">
                                                Para completar el cambio, por favor revisa tu bandeja y haz clic en el enlace.
                                                <br />
                                                <span className="italic">(Si no lo ves, revisa Spam)</span>
                                            </p>
                                        </div>
                                    </div>
                                    <div className="flex gap-2 justify-center">
                                        <button onClick={resetState} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 transition-colors">
                                            Entendido, cerrar
                                        </button>
                                    </div>
                                </>
                            )}
                        </div>
                    )}

                    {/* --- RESET PASSWORD MODE --- */}
                    {mode === 'reset_password' && (
                        <div className="space-y-4 simar-aparece">
                            {step === 1 ? (
                                <>
                                    <div className="text-base text-simar-texto-2 mb-4">
                                        Para cambiar tu contraseña, enviaremos un código de verificación a: <strong>{user?.email}</strong>.
                                    </div>

                                    <div className="flex flex-wrap gap-3 justify-end">
                                        <button onClick={resetState} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">Cancelar</button>
                                        <button onClick={handleSendResetCode} disabled={loading} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 transition-colors">
                                            {loading ? 'Enviando...' : 'Enviar Código'}
                                        </button>
                                    </div>
                                </>
                            ) : (
                                <>
                                    <div className="space-y-3">
                                        <div>
                                            <label htmlFor="user-profile-modal-4" className="block text-[17px] font-bold text-simar-texto mb-2">Código de verificación</label>
                                            <input id="user-profile-modal-4"
                                                type="text"
                                                value={resetToken}
                                                onChange={(e) => setResetToken(e.target.value)}
                                                placeholder="123456"
                                                className="w-full text-center px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                            />
                                        </div>
                                        <div>
                                            <label htmlFor="user-profile-modal-5" className="block text-[17px] font-bold text-simar-texto mb-2">Nueva contraseña</label>
                                            <div className="relative">
                                                <input id="user-profile-modal-5"
                                                    type={showNewPassword ? "text" : "password"}
                                                    value={newPassword}
                                                    onChange={(e) => setNewPassword(e.target.value)}
                                                    className="w-full pr-12 pl-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowNewPassword(!showNewPassword)}
                                                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-simar-texto-2 hover:text-simar-texto"
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
                                            <label htmlFor="user-profile-modal-6" className="block text-[17px] font-bold text-simar-texto mb-2">Confirmar contraseña</label>
                                            <div className="relative">
                                                <input id="user-profile-modal-6"
                                                    type={showConfirmPassword ? "text" : "password"}
                                                    value={confirmNewPassword}
                                                    onChange={(e) => setConfirmNewPassword(e.target.value)}
                                                    className="w-full pr-12 pl-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                    className="absolute inset-y-0 right-0 w-12 flex items-center justify-center text-simar-texto-2 hover:text-simar-texto"
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

                                    <div className="flex flex-wrap gap-3 justify-end mt-4">
                                        <button onClick={() => setStep(1)} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors">Atrás</button>
                                        <button onClick={handleResetPassword} disabled={loading} className="min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 transition-colors">
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

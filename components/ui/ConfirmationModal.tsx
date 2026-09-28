'use client';

import { Button } from './Button';
import { usePresencia } from './movimiento';

interface ConfirmationModalProps {
    isOpen: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    isLoading?: boolean;
}

export function ConfirmationModal({
    isOpen,
    onClose,
    onConfirm,
    title,
    message,
    confirmText = 'Confirmar',
    cancelText = 'Cancelar',
    isLoading = false
}: ConfirmationModalProps) {
    // Se queda montada mientras hace la salida (ver DISEÑO_SIMAR.md → Movimiento)
    const { montado, saliendo } = usePresencia(isOpen);
    if (!montado) return null;

    return (
        <div className={`${saliendo ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 z-50 flex items-center justify-center bg-[rgba(11,34,54,0.55)] p-4`}>
            <div role="alertdialog" aria-modal="true" className={`${saliendo ? 'simar-ventana-sale' : 'simar-ventana'} bg-simar-superficie rounded-[28px] shadow-2xl max-w-md w-full overflow-hidden`}>
                <div className="p-7">
                    <h3 className="text-[22px] font-extrabold text-simar-texto leading-tight mb-2">{title}</h3>
                    <p className="text-lg text-simar-texto-2">{message}</p>
                </div>
                <div className="px-7 pb-7 flex flex-wrap justify-end gap-3">
                    <Button variant="secondary" onClick={onClose} disabled={isLoading}>
                        {cancelText}
                    </Button>
                    <Button variant="danger" onClick={onConfirm} disabled={isLoading}>
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                <span>Procesando...</span>
                            </div>
                        ) : (
                            confirmText
                        )}
                    </Button>
                </div>
            </div>
        </div>
    );
}

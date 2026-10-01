'use client';

import { useEffect, useState } from 'react';
import { BotonSecundario, Modal } from '@/components/asociaciones/ui';

/**
 * Confirmación propia de SiMAR, en lugar de `window.confirm()` (una cajita del navegador que no
 * sigue el diseño, no se lee bien en letra grande y en celular parece un error). Se usa como una
 * función:
 *
 *     if (!(await confirmar({ titulo: '¿Eliminar este recibo?', accion: 'Eliminar', peligro: true }))) return;
 *
 * `<Confirmador />` va montado una sola vez en app/[locale]/layout.tsx, junto a `<Avisos />`. Si por
 * algo no estuviera montado, cae al `window.confirm()` de siempre.
 */
export interface OpcionesConfirmar {
    /** La pregunta: "¿Eliminar este manifiesto?" */
    titulo: string;
    /** Qué pasa si se confirma, en una o dos frases */
    mensaje?: string;
    /** Palabra del botón que confirma: "Eliminar", "Cancelar solicitud"… (por omisión "Aceptar") */
    accion?: string;
    /** Palabra del botón que se arrepiente (por omisión "Cancelar") */
    volver?: string;
    /** Borra o deshace algo: el botón va en coral y el foco empieza en "Cancelar" */
    peligro?: boolean;
}

type Pendiente = OpcionesConfirmar & { responder: (ok: boolean) => void };

let mostrar: ((p: Pendiente) => void) | null = null;

export function confirmar(opciones: OpcionesConfirmar): Promise<boolean> {
    return new Promise((responder) => {
        if (!mostrar) {
            responder(window.confirm([opciones.titulo, opciones.mensaje].filter(Boolean).join('\n\n')));
            return;
        }
        mostrar({ ...opciones, responder });
    });
}

export function Confirmador() {
    const [pendiente, setPendiente] = useState<Pendiente | null>(null);

    useEffect(() => {
        mostrar = (p) =>
            setPendiente((anterior) => {
                // Si ya había una pregunta abierta, ésa se toma como "no"
                anterior?.responder(false);
                return p;
            });
        return () => {
            mostrar = null;
        };
    }, []);

    if (!pendiente) return null;
    const responder = (ok: boolean) => {
        pendiente.responder(ok);
        setPendiente(null);
    };

    return (
        <Modal titulo={pendiente.titulo} onClose={() => responder(false)} ancho="max-w-md">
            {pendiente.mensaje && <p className="-mt-1 text-[17px] leading-relaxed text-simar-texto-2 whitespace-pre-line">{pendiente.mensaje}</p>}
            <div className="mt-6 grid grid-cols-2 gap-3">
                <BotonSecundario onClick={() => responder(false)} autoFocus={pendiente.peligro}>
                    {pendiente.volver ?? 'Cancelar'}
                </BotonSecundario>
                <button
                    type="button"
                    onClick={() => responder(true)}
                    autoFocus={!pendiente.peligro}
                    className={`simar-presiona inline-flex items-center justify-center gap-2 min-h-[52px] px-5 rounded-2xl text-[17px] font-bold text-white transition-colors ${
                        pendiente.peligro ? 'bg-[#A63F0E] hover:bg-[#8A3409]' : 'bg-simar-marea hover:bg-simar-marea-hover'
                    }`}
                >
                    {pendiente.accion ?? 'Aceptar'}
                </button>
            </div>
        </Modal>
    );
}

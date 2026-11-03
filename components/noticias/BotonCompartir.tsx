'use client';

import { Share2 } from 'lucide-react';
import { toast } from 'sonner';

/**
 * Compartir una noticia: en el celular abre el menú de compartir del teléfono; donde no hay, copia
 * el enlace y lo avisa.
 */
export function BotonCompartir({ titulo, texto }: { titulo: string; texto: string }) {
    const compartir = async () => {
        const url = window.location.href;
        if (typeof navigator.share === 'function') {
            try {
                await navigator.share({ title: titulo, text: texto, url });
                return;
            } catch (causa) {
                // Cerrar el menú sin elegir no es un error
                if (causa instanceof DOMException && causa.name === 'AbortError') return;
            }
        }
        try {
            await navigator.clipboard.writeText(url);
            toast.success('Enlace copiado', { description: 'Pégalo donde quieras compartir la noticia.' });
        } catch {
            toast.error('No se pudo copiar el enlace', { description: 'Cópialo desde la barra de direcciones.' });
        }
    };
    return (
        <button
            type="button"
            onClick={compartir}
            className="simar-presiona min-h-[48px] px-5 rounded-full border-2 border-simar-campo-borde text-simar-texto text-[17px] font-bold inline-flex items-center gap-2 hover:bg-simar-texto/5 transition-colors cursor-pointer movil:min-h-[44px] movil:px-4 movil:text-[15px]"
        >
            <Share2 aria-hidden="true" className="w-[18px] h-[18px]" />
            Compartir
        </button>
    );
}

import type { ReactNode } from 'react';
import { SCRIPT_AJUSTES } from '@/components/noticias/ajustesLecturaBase';

/**
 * Noticias y sus artículos: antes de pintar, aplica los ajustes de lectura que la persona guardó
 * (tamaño, contraste, renglones, movimiento, enlaces; ver components/noticias/ajustesLectura.ts).
 */
export default function NoticiasLayout({ children }: { children: ReactNode }) {
    return (
        <>
            <script dangerouslySetInnerHTML={{ __html: SCRIPT_AJUSTES }} />
            {children}
        </>
    );
}

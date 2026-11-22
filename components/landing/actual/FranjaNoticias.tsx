'use client';

import { type ReactNode } from 'react';
import { useScrollReveal } from '../useScrollReveal';
import { OlaSeparador } from '../OlaSeparador';

/**
 * Noticias (#noticias): una franja oscura propia (olas arriba y abajo) para que no se confunda con la
 * escena 3D de arriba; tarjetas claras encima. La más reciente en grande y cuatro en lista.
 * `noticias` son las tarjetas armadas en el servidor (NoticiasPortada)
 */
export function FranjaNoticias({ noticias }: { noticias: ReactNode }) {
    const noticiasRef = useScrollReveal<HTMLElement>();

    return (
        <section id="noticias" ref={noticiasRef} aria-labelledby="noticias-titulo" className="relative pt-28 pb-28 md:pt-36 md:pb-36 px-6 bg-simar-abismo text-white overflow-clip movil:pt-20 movil:pb-20 movil:px-5">
            <OlaSeparador color="var(--simar-superficie)" lado="arriba" />
            <OlaSeparador color="var(--simar-papel)" lado="abajo" />
            {/* La hoja del periódico (NoticiasDiario): la misma portada que Noticias, con su cabecera */}
            <div className="relative max-w-[1248px] mx-auto">
                {noticias}
            </div>
        </section>
    );
}

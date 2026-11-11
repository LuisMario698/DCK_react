'use client';

import { useEffect, useState } from 'react';

/**
 * En una nota, cuando su título ya subió fuera de la pantalla, la barra lo muestra (tema y título,
 * en una línea): así siempre se sabe qué se está leyendo. Mira al `#titulo-nota` del artículo.
 */
export function TituloAlLeer({ tema, titulo }: { tema: string; titulo: string }) {
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const h1 = document.getElementById('titulo-nota');
        if (!h1) return;
        // Cuenta como «se fue» cuando pasa por debajo de la barra (unos 110 px)
        const observador = new IntersectionObserver(([e]) => setVisible(!e.isIntersecting && e.boundingClientRect.top < 0), { rootMargin: '-110px 0px 0px 0px' });
        observador.observe(h1);
        return () => observador.disconnect();
    }, []);

    return (
        <p
            aria-hidden={!visible}
            className={`min-w-0 flex-1 truncate pl-3 text-[16px] font-bold text-simar-texto transition-[opacity,transform] duration-300 ease-out max-md:hidden ${
                visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-1 pointer-events-none'
            }`}
        >
            <span className="mr-2 text-[13px] font-extrabold uppercase tracking-[0.1em] text-simar-texto-2">{tema}</span>
            <span className="font-titular text-[19px] font-semibold">{titulo}</span>
        </p>
    );
}

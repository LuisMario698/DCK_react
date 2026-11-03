'use client';

import { useEffect, useRef, useState } from 'react';

/**
 * Las secciones de la página de Noticias, en la barra de arriba (va pegada al bajar). Se marca la
 * sección que se está leyendo; en celular la lista se corre de lado para que la marcada se vea.
 */
export function NavSecciones({ secciones }: { secciones: { id: string; texto: string }[] }) {
    const [activa, setActiva] = useState(secciones[0]?.id ?? '');
    const lista = useRef<HTMLUListElement>(null);

    useEffect(() => {
        let cuadro = 0;
        const medir = () => {
            cuadro = 0;
            // La activa es la última cuya parte de arriba ya pasó el tercio de la pantalla
            const linea = window.innerHeight / 3;
            let actual = secciones[0]?.id ?? '';
            for (const s of secciones) {
                const el = document.getElementById(s.id);
                if (el && el.getBoundingClientRect().top <= linea) actual = s.id;
            }
            setActiva(actual);
        };
        const pedir = () => {
            if (!cuadro) cuadro = requestAnimationFrame(medir);
        };
        medir();
        window.addEventListener('scroll', pedir, { passive: true });
        window.addEventListener('resize', pedir);
        return () => {
            window.removeEventListener('scroll', pedir);
            window.removeEventListener('resize', pedir);
            cancelAnimationFrame(cuadro);
        };
    }, [secciones]);

    // La marcada, a la vista dentro de la lista (sin mover la página)
    useEffect(() => {
        const ul = lista.current;
        const el = ul?.querySelector<HTMLElement>(`[data-seccion="${activa}"]`);
        if (!ul || !el || ul.scrollWidth <= ul.clientWidth) return;
        ul.scrollTo({ left: el.offsetLeft - ul.clientWidth / 2 + el.offsetWidth / 2, behavior: 'smooth' });
    }, [activa]);

    return (
        <div className="border-t border-simar-borde/70">
            <ul ref={lista} aria-label="En esta página" className="flex gap-1 overflow-x-auto [scrollbar-width:none] px-2 py-2 md:px-3 movil:px-1.5">
                {secciones.map((s) => {
                    const marcada = s.id === activa;
                    return (
                        <li key={s.id} className="flex-shrink-0">
                            <a
                                href={`#${s.id}`}
                                data-seccion={s.id}
                                aria-current={marcada ? 'location' : undefined}
                                className={`min-h-[46px] px-4 rounded-full inline-flex items-center text-[17px] font-bold whitespace-nowrap transition-colors movil:min-h-[44px] movil:px-3.5 movil:text-[15px] ${
                                    marcada ? 'bg-simar-texto text-simar-papel' : 'text-simar-texto-2 hover:bg-simar-texto/5 hover:text-simar-texto'
                                }`}
                            >
                                {s.texto}
                            </a>
                        </li>
                    );
                })}
            </ul>
        </div>
    );
}

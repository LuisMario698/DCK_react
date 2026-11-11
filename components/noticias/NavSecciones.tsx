'use client';

import { useEffect, useState, type CSSProperties } from 'react';
import { useIndicador } from './useIndicador';

/**
 * Las secciones de la página de Noticias, en la barra de arriba (va pegada al bajar). La sección
 * que se lee lleva una píldora que se desliza de una a otra con un resorte (no salta) y, abajo de
 * la barra, una línea dice cuánto falta de la página. En celular la fila se corre de lado para que
 * la marcada se vea.
 */
export function NavSecciones({ secciones }: { secciones: { id: string; texto: string }[] }) {
    const [activa, setActiva] = useState(secciones[0]?.id ?? '');
    const lista = useIndicador<HTMLUListElement>(activa);

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
    }, [activa, lista]);

    return (
        // Al llegar a Noticias la isla se alarga y estas secciones salen de ella una tras otra
        // (isla-con-fila en globals.css): la línea se dibuja desde el centro y cada una baja con rebote
        <div className="relative">
            <span aria-hidden="true" className="isla-fila-linea absolute inset-x-0 top-0 h-px bg-simar-borde/70" />
            <ul
                ref={lista}
                aria-label="En esta página"
                className="n-sin-medir relative flex gap-1 overflow-x-auto [scrollbar-width:none] px-2 py-2 md:px-3 movil:px-1.5"
                style={{ '--n-y': '8px' } as CSSProperties}
            >
                <span aria-hidden="true" className="n-indicador bg-simar-texto shadow-[0_6px_16px_-10px_rgba(11,34,54,0.8)]" />
                {secciones.map((s, i) => {
                    const marcada = s.id === activa;
                    return (
                        // El <li> sin posición: así el enlace se mide contra la lista (offsetLeft)
                        <li key={s.id} className="flex-shrink-0">
                            <a
                                href={`#${s.id}`}
                                data-seccion={s.id}
                                data-activo={marcada}
                                aria-current={marcada ? 'location' : undefined}
                                style={{ '--i': i } as CSSProperties}
                                className={`isla-ficha relative min-h-[46px] px-4 rounded-full inline-flex items-center text-[17px] font-bold whitespace-nowrap transition-colors duration-300 movil:min-h-[44px] movil:px-3.5 movil:text-[15px] ${
                                    marcada ? 'text-simar-papel' : 'text-simar-texto-2 hover:text-simar-texto'
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

'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const pendientes = new Set(
            [node, ...Array.from(node.querySelectorAll<HTMLElement>('.reveal'))].filter((t) =>
                t.classList.contains('reveal')
            )
        );

        const revelar = (el: HTMLElement) => {
            const delay = el.dataset.delay ?? '0';
            // Variable y no transitionDelay: la heredan las palabras de TextoEnfoca
            el.style.setProperty('--retraso', `${delay}ms`);
            el.classList.add('reveal--visible');
            observer.unobserve(el);
            pendientes.delete(el);
            if (pendientes.size === 0) window.removeEventListener('scroll', alDesplazar);
        };

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) revelar(entry.target as HTMLElement);
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
        );

        // Un salto (Ctrl+Fin, buscar en la página) puede pasar un elemento de abajo a arriba de
        // la pantalla sin que cruce el observador: lo que ya quedó arriba se revela igual.
        let cuadro = 0;
        const alDesplazar = () => {
            if (cuadro) return;
            cuadro = requestAnimationFrame(() => {
                cuadro = 0;
                pendientes.forEach((el) => {
                    if (el.getBoundingClientRect().bottom < 0) revelar(el);
                });
            });
        };

        pendientes.forEach((t) => observer.observe(t));
        window.addEventListener('scroll', alDesplazar, { passive: true });

        return () => {
            observer.disconnect();
            window.removeEventListener('scroll', alDesplazar);
            cancelAnimationFrame(cuadro);
        };
    }, []);

    return ref;
}

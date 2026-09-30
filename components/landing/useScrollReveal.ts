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

        // Navegador que ata animaciones al scroll: el CSS lo hace todo según la posición (ver
        // .reveal en globals.css). Aquí sólo el escalonado: data-delay (ms) → el rango empieza
        // un poco más arriba (650 ms ≈ 16 % del recorrido). Números fijos, sin var(): así el
        // navegador no descarta el rango.
        const atadoAlScroll =
            CSS.supports('animation-timeline: view()') &&
            !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        if (atadoAlScroll) {
            pendientes.forEach((el) => {
                const desfase = Math.min(Number(el.dataset.delay ?? 0) / 40, 16);
                if (!desfase) return;
                const largo = el.dataset.efecto === 'foto' ? 30 : 26;
                el.style.setProperty('animation-range', `cover ${desfase}% cover ${desfase + largo}%`);
            });
            return;
        }

        const revelar = (el: HTMLElement) => {
            // Retraso más corto que el escrito: al bajar rápido nada se queda esperando
            const delay = Number(el.dataset.delay ?? 0) * 0.6;
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
            { threshold: 0.05, rootMargin: '0px 0px -6% 0px' }
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

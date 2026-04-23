'use client';

import { useEffect, useRef } from 'react';

export function useScrollReveal<T extends HTMLElement = HTMLDivElement>() {
    const ref = useRef<T | null>(null);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const targets = [node, ...Array.from(node.querySelectorAll<HTMLElement>('.reveal'))];

        const observer = new IntersectionObserver(
            (entries) => {
                entries.forEach((entry) => {
                    if (entry.isIntersecting) {
                        const el = entry.target as HTMLElement;
                        const delay = el.dataset.delay ?? '0';
                        el.style.transitionDelay = `${delay}ms`;
                        el.classList.add('reveal--visible');
                        observer.unobserve(el);
                    }
                });
            },
            { threshold: 0.15, rootMargin: '0px 0px -80px 0px' }
        );

        targets.forEach((t) => {
            if (t.classList.contains('reveal')) observer.observe(t);
        });

        return () => observer.disconnect();
    }, []);

    return ref;
}

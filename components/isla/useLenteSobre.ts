'use client';

import { useCallback, useRef, type FocusEvent, type PointerEvent } from 'react';
import { moverLente, tramoDe } from './lente';
import { movimientoQuieto } from './viaje';

/**
 * Una lente líquida (lente.ts) que sigue al cursor sobre un grupo de enlaces o botones: se desliza de
 * uno a otro estirándose y, al salir del grupo, se desvanece. Al volver a entrar aparece ya en su
 * lugar (no viaja desde donde se quedó). También sigue al foco del teclado.
 *
 *   const { lente, ...oyentes } = useLenteSobre();
 *   <div className="relative" {...oyentes}><span ref={lente} className="isla-lente-enlaces" />…</div>
 *
 * `holgura`: cuánto sobresale la lente de cada lado. Con 'mitad', la mitad del espacio entre los
 * elementos del grupo (hasta 14 px): así no toca al vecino cuando el espacio se achica.
 */
export function useLenteSobre(selector = 'a, button', holgura: number | 'mitad' = 14) {
    const lente = useRef<HTMLSpanElement>(null);
    const visible = useRef(false);

    const ir = useCallback(
        (objetivo: EventTarget | null, grupo: HTMLElement) => {
            const capa = lente.current;
            const el = (objetivo as Element | null)?.closest?.(selector) as HTMLElement | null;
            if (!capa || !el || !grupo.contains(el)) return;
            const h = holgura === 'mitad' ? Math.min(14, (parseFloat(getComputedStyle(grupo).columnGap) || 28) / 2) : holgura;
            moverLente(capa, tramoDe(capa, el, h), { quieto: !visible.current || movimientoQuieto(), ms: 400 });
            visible.current = true;
            capa.dataset.visible = 'true';
        },
        [selector, holgura],
    );

    const ocultar = useCallback(() => {
        visible.current = false;
        if (lente.current) lente.current.dataset.visible = 'false';
    }, []);

    return {
        lente,
        onPointerOver: (e: PointerEvent<HTMLElement>) => {
            if (e.pointerType === 'mouse' || e.pointerType === 'pen') ir(e.target, e.currentTarget);
        },
        onPointerLeave: ocultar,
        onFocus: (e: FocusEvent<HTMLElement>) => {
            if (e.target.matches(':focus-visible')) ir(e.target, e.currentTarget);
        },
        onBlur: (e: FocusEvent<HTMLElement>) => {
            if (!e.currentTarget.contains(e.relatedTarget as Node | null)) ocultar();
        },
    };
}

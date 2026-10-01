'use client';

import { useEffect, useRef, type RefObject } from 'react';

const ENFOCABLES =
    'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

// Los últimos elementos que tuvieron el foco. El autoFocus de lo de adentro se aplica antes que el
// efecto del hook, así que al abrir `document.activeElement` ya puede ser un botón de la ventana:
// entonces "lo anterior" es el último de esta lista que queda fuera de ella. Se escucha desde que
// carga el módulo (lo importa el Modal que va en el layout), antes de que se abra cualquier ventana.
const recientes: HTMLElement[] = [];
if (typeof document !== 'undefined') {
    document.addEventListener(
        'focusin',
        (e) => {
            if (!(e.target instanceof HTMLElement)) return;
            recientes.push(e.target);
            if (recientes.length > 8) recientes.shift();
        },
        true
    );
}

/** Las ventanas abiertas ahora mismo (cada apertura con su propio turno) */
const abiertas = new WeakMap<HTMLElement, object>();
/** En el orden en que se abrieron: Escape sólo cierra la de hasta arriba */
const pila: HTMLElement[] = [];

/** Lo que tenía el foco antes de abrir la ventana (fuera de ella) */
function focoFueraDe(panel: HTMLElement): HTMLElement | null {
    const actual = document.activeElement as HTMLElement | null;
    if (actual && actual !== document.body && !panel.contains(actual)) return actual;
    for (let i = recientes.length - 1; i >= 0; i--) {
        const el = recientes[i];
        if (!panel.contains(el) && document.contains(el)) return el;
    }
    return null;
}

/**
 * Lo que toda ventana (modal u hoja) necesita para usarse con teclado y lector de pantalla:
 * - al abrir, el foco entra a la ventana (al primer elemento, o a la ventana misma si no hay), salvo
 *   que algo de adentro ya lo haya pedido con autoFocus;
 * - Tab y Mayús+Tab dan la vuelta dentro de la ventana y no se escapan a la página de atrás;
 * - al cerrar, el foco regresa a lo que lo tenía (normalmente el botón que la abrió);
 * - con `alEscape`, Escape la cierra (si hay una ventana encima de otra, sólo la de arriba).
 *
 * `ref` es el panel de la ventana (lleva `tabIndex={-1}` para poder recibir el foco). Con
 * `enfocar: false` no mueve el foco al abrir (la ventana ya lo hace por su cuenta).
 */
export function useVentanaAccesible(
    ref: RefObject<HTMLElement | null>,
    abierto = true,
    { enfocar = true, alEscape }: { enfocar?: boolean; alEscape?: () => void } = {}
) {
    // La función más reciente sin volver a armar el efecto en cada render
    const escapeRef = useRef(alEscape);
    useEffect(() => {
        escapeRef.current = alEscape;
    });

    useEffect(() => {
        if (!abierto) return;
        const panel = ref.current;
        if (!panel) return;
        const previo = focoFueraDe(panel);
        const turno = {};
        abiertas.set(panel, turno);
        pila.push(panel);

        const enfocables = () => [...panel.querySelectorAll<HTMLElement>(ENFOCABLES)].filter((e) => e.getClientRects().length > 0);

        // Un cuadro después, para respetar el autoFocus de lo de adentro (se aplica al montar)
        const cuadro = requestAnimationFrame(() => {
            if (enfocar && !panel.contains(document.activeElement)) (enfocables()[0] ?? panel).focus({ preventScroll: true });
        });

        const alTeclear = (e: KeyboardEvent) => {
            if (e.key !== 'Tab') return;
            const lista = enfocables();
            if (lista.length === 0) {
                e.preventDefault();
                return;
            }
            const primero = lista[0];
            const ultimo = lista[lista.length - 1];
            const actual = document.activeElement;
            if (e.shiftKey && (actual === primero || actual === panel)) {
                e.preventDefault();
                ultimo.focus();
            } else if (!e.shiftKey && actual === ultimo) {
                e.preventDefault();
                primero.focus();
            }
        };
        panel.addEventListener('keydown', alTeclear);

        const alEscapar = (e: KeyboardEvent) => {
            if (e.key !== 'Escape' || !escapeRef.current || pila[pila.length - 1] !== panel) return;
            e.preventDefault();
            escapeRef.current();
        };
        document.addEventListener('keydown', alEscapar);

        return () => {
            cancelAnimationFrame(cuadro);
            panel.removeEventListener('keydown', alTeclear);
            document.removeEventListener('keydown', alEscapar);
            const lugar = pila.lastIndexOf(panel);
            if (lugar >= 0) pila.splice(lugar, 1);
            if (abiertas.get(panel) === turno) abiertas.delete(panel);
            // Un instante después: en desarrollo React (StrictMode) quita y vuelve a poner los efectos
            // al montar; si la ventana se volvió a abrir, el foco se queda donde está
            queueMicrotask(() => {
                if (abiertas.has(panel) && panel.isConnected) return;
                if (previo && document.contains(previo)) previo.focus({ preventScroll: true });
            });
        };
    }, [ref, abierto, enfocar]);
}

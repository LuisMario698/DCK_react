'use client';

import { useEffect, useLayoutEffect, useRef, type PointerEvent, type ReactNode } from 'react';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { usePresencia, usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { HOLGURA, Muestras, animarResorte, resistir, seCierra, soltarEstilos, tomarDesdeDondeVa } from '@/components/ui/arrastreHoja';

/**
 * Hoja que sube desde abajo (celular y tableta; desde 1024 px no se muestra). La usan el menú
 * "Más" de la barra inferior, los avisos y el selector de fecha y hora. Se cierra tocando el fondo,
 * con Escape o jalándola hacia abajo, desde la agarradera o desde el contenido cuando está hasta
 * arriba. Al soltarla decide con la velocidad del dedo (un tirón corto y rápido la cierra) y sigue
 * a esa misma velocidad; el velo se aclara mientras baja. Hacia arriba resiste en vez de frenarse
 * en seco. Mientras está abierta la página de atrás no se desplaza y, al cerrarse, el foco vuelve
 * al botón que la abrió. Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
export function HojaInferior({
    abierto,
    onCerrar,
    etiqueta,
    children,
}: {
    abierto: boolean;
    onCerrar: () => void;
    /** Nombre de la hoja para el lector de pantalla ("Más opciones") */
    etiqueta: string;
    children: ReactNode;
}) {
    const { montado, saliendo } = usePresencia(abierto, 200);
    const reducir = usePrefiereMenosMovimiento();
    const panelRef = useRef<HTMLDivElement>(null);
    const veloRef = useRef<HTMLDivElement>(null);
    const contenidoRef = useRef<HTMLDivElement>(null);
    const cerrarRef = useRef(onCerrar);
    const reducirRef = useRef(reducir);
    const saliendoRef = useRef(saliendo);
    // La hoja se mueve fuera de React (sin renders en cada cuadro): su desplazamiento, el arrastre en
    // curso (dónde estaban la hoja y el dedo al empezar y las últimas posiciones, para la velocidad) y
    // el resorte que la lleva a su lugar al soltarla (física en components/ui/arrastreHoja.ts)
    const posicion = useRef(0);
    const gesto = useRef<{ desde: number; dedo: number; muestras: Muestras } | null>(null);
    const detenerResorte = useRef(() => {});

    useEffect(() => {
        cerrarRef.current = onCerrar;
        reducirRef.current = reducir;
        saliendoRef.current = saliendo;
    }, [onCerrar, reducir, saliendo]);

    // Tab da la vuelta dentro de la hoja (el foco inicial y el regreso los hace el efecto de abajo). Va
    // antes de ese efecto para que al cerrar los dos regresen el foco al mismo botón
    useVentanaAccesible(panelRef, abierto, { enfocar: false, alEscape: () => cerrarRef.current() });

    // Al abrir: foco en la hoja y la página de atrás quieta (Escape lo maneja useVentanaAccesible)
    useEffect(() => {
        if (!abierto) return;
        const previo = document.activeElement as HTMLElement | null;
        const html = document.documentElement;
        const overflowPrevio = html.style.overflow;
        html.style.overflow = 'hidden';
        panelRef.current?.focus({ preventScroll: true });
        return () => {
            html.style.overflow = overflowPrevio;
            previo?.focus?.({ preventScroll: true });
        };
    }, [abierto]);

    // Al volver a abrir, la hoja empieza en su lugar aunque se haya cerrado arrastrándola. Antes de
    // pintar, para que su entrada no arranque desde donde se quedó
    useLayoutEffect(() => {
        if (!abierto) return;
        detenerResorte.current();
        gesto.current = null;
        posicion.current = 0;
        soltarEstilos(panelRef.current, veloRef.current);
    }, [abierto]);

    useEffect(() => () => detenerResorte.current(), []);

    const pintar = (y: number) => {
        posicion.current = y;
        const panel = panelRef.current;
        if (!panel) return;
        const velo = veloRef.current;
        // En su lugar no lleva transform: con uno, lo fixed de adentro quedaría atado a la hoja
        if (y === 0) {
            soltarEstilos(panel, velo);
            return;
        }
        // Mientras la mueve el dedo (o el resorte) sin la transición de su clase, que la retrasaría
        panel.style.transition = 'none';
        panel.style.transform = `translateY(${y}px)`;
        // El velo se aclara conforme la hoja baja
        if (velo) {
            velo.style.transition = 'none';
            velo.style.opacity = String(Math.min(1, Math.max(0, 1 - y / panel.offsetHeight)));
        }
    };

    const empezar = (dedo: number) => {
        const panel = panelRef.current;
        if (!panel || saliendoRef.current) return;
        detenerResorte.current();
        // Si todavía va entrando, se toma desde donde va (no desde su lugar final)
        const desde = tomarDesdeDondeVa(panel, veloRef.current);
        gesto.current = { desde, dedo, muestras: new Muestras() };
        gesto.current.muestras.agregar(dedo);
        pintar(desde);
    };

    const mover = (dedo: number) => {
        const g = gesto.current;
        const panel = panelRef.current;
        if (!g || !panel) return;
        g.muestras.agregar(dedo);
        // 1:1 con el dedo, desde donde se tomó; hacia arriba, con resistencia
        const y = g.desde + dedo - g.dedo;
        pintar(y >= 0 ? y : -resistir(-y, panel.offsetHeight));
    };

    // Lleva la hoja a `meta` con un resorte sin rebote que arranca a la velocidad del dedo (sin costura
    // entre arrastrar y soltar). Al cerrar basta con que salga de la pantalla
    const llevar = (meta: number, velocidad: number, alSalir?: () => void) => {
        detenerResorte.current();
        const panel = panelRef.current;
        if (!panel) return;
        const alto = panel.offsetHeight;
        if (reducirRef.current) {
            pintar(alSalir ? alto : 0);
            alSalir?.();
            return;
        }
        detenerResorte.current = animarResorte(posicion.current, velocidad, meta, pintar, (y, v) => {
            if (alSalir ? y < alto : Math.abs(y - meta) >= 0.5 || Math.abs(v) >= 20) return false;
            pintar(alSalir ? alto : meta);
            alSalir?.();
            return true;
        });
    };

    const soltar = () => {
        const g = gesto.current;
        const panel = panelRef.current;
        gesto.current = null;
        if (!g || !panel) return;
        const velocidad = g.muestras.velocidad();
        // Se decide con a dónde va (la posición más el impulso), no sólo con dónde está
        if (seCierra(posicion.current, velocidad, panel.offsetHeight)) {
            // La meta queda un poco más allá del borde para que salga sin frenar al final
            llevar(panel.offsetHeight * 1.15, velocidad, () => cerrarRef.current());
        } else {
            llevar(0, velocidad);
        }
    };

    // Jalar desde el contenido: sólo hacia abajo y con la lista hasta arriba (si no, es desplazar la
    // lista). Con eventos táctiles para poder detener el desplazamiento del navegador desde el primer
    // movimiento; las filas que se deslizan de lado no cuentan
    useEffect(() => {
        const contenido = contenidoRef.current;
        if (!montado || !contenido) return;
        let inicio: number | null = null;
        let arrastrando = false;
        const alTocar = (e: TouchEvent) => {
            arrastrando = false;
            const lateral = (e.target as Element | null)?.closest('.simar-desliza, .simar-carrusel');
            inicio = e.touches.length === 1 && contenido.scrollTop <= 0 && !lateral ? e.touches[0].clientY : null;
        };
        const alMover = (e: TouchEvent) => {
            if (inicio === null) return;
            const y = e.touches[0].clientY;
            if (!arrastrando) {
                if (y < inicio || contenido.scrollTop > 0) {
                    inicio = null;
                    return;
                }
                if (e.cancelable) e.preventDefault();
                if (y - inicio < HOLGURA) return;
                arrastrando = true;
                empezar(y);
            }
            if (e.cancelable) e.preventDefault();
            mover(y);
        };
        const alSoltar = () => {
            if (arrastrando) soltar();
            inicio = null;
            arrastrando = false;
        };
        contenido.addEventListener('touchstart', alTocar, { passive: true });
        contenido.addEventListener('touchmove', alMover, { passive: false });
        contenido.addEventListener('touchend', alSoltar);
        contenido.addEventListener('touchcancel', alSoltar);
        return () => {
            contenido.removeEventListener('touchstart', alTocar);
            contenido.removeEventListener('touchmove', alMover);
            contenido.removeEventListener('touchend', alSoltar);
            contenido.removeEventListener('touchcancel', alSoltar);
        };
        // empezar, mover y soltar sólo leen refs
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [montado]);

    if (!montado) return null;

    // La agarradera: con el dedo, el mouse o el lápiz
    const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        e.currentTarget.setPointerCapture(e.pointerId);
        empezar(e.clientY);
    };

    return (
        <div className="fixed inset-0 z-[60] lg:hidden">
            <div
                ref={veloRef}
                aria-hidden="true"
                onClick={onCerrar}
                className={`${saliendo ? 'simar-velo-sale' : 'simar-velo'} absolute inset-0 bg-[rgba(11,34,54,0.5)]`}
            />
            <div
                ref={panelRef}
                role="dialog"
                aria-modal="true"
                aria-label={etiqueta}
                tabIndex={-1}
                className={`${saliendo ? 'simar-hoja-sale' : 'simar-hoja'} absolute inset-x-0 bottom-0 mx-auto max-w-xl max-h-[88dvh] flex flex-col rounded-t-[28px] bg-simar-superficie shadow-[0_-24px_60px_-24px_rgba(11,34,54,0.55)] outline-none`}
            >
                {/* Al jalarla hacia arriba no se ve el hueco de abajo: la hoja sigue hasta el borde */}
                <span aria-hidden="true" className="absolute inset-x-0 top-full h-24 bg-simar-superficie" />
                {/* Agarradera de 44 px de alto (mínimo de tacto); también se jala desde el contenido */}
                <div
                    onPointerDown={alPresionar}
                    onPointerMove={(e) => mover(e.clientY)}
                    onPointerUp={soltar}
                    onPointerCancel={soltar}
                    style={{ minHeight: 44 }}
                    className="flex-shrink-0 flex items-start justify-center pt-2.5 touch-none cursor-grab active:cursor-grabbing"
                >
                    <span aria-hidden="true" className="block w-11 h-[5px] rounded-full bg-simar-borde" />
                </div>
                <div
                    ref={contenidoRef}
                    className="-mt-[18px] overflow-y-auto overscroll-contain px-4 pb-[max(18px,env(safe-area-inset-bottom))]"
                >
                    {children}
                </div>
            </div>
        </div>
    );
}

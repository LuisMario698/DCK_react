'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Liquid } from 'liquid-gooey';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { useTiendaIsla } from './islaTienda';
import { movimientoQuieto } from './viaje';
import { MARGEN, SEPARACION, type GotaIsla, type Zona } from './tipos';

/**
 * La capa líquida de la isla dinámica (IslaDinamica): el brote, la gotita y el panel, con
 * liquid-gooey. Va en su propio archivo y la isla lo carga cuando la página ya está en reposo (o al
 * abrir la primera gota): liquid-gooey no baja con la página ni retrasa su primer cuadro.
 * Ver IslaDinamica.tsx y DISEÑO_SIMAR.md §8.6.
 */

/**
 * La gota va en tres fases: `dentro` (escondida en la isla), `gotita` (una gotita que cuelga del
 * brote, justo bajo la isla) y `abierta` (el panel). De `gotita` a `abierta` la gota se hincha
 * colgada de su borde de arriba (que casi no se mueve), así se ve que crece desde la isla.
 */
type Fase = 'dentro' | 'gotita' | 'abierta';
/** La gotita sale del brote (rápida), el panel se hincha (con un rebote corto) */
const GOTEA = { stiffness: 900, damping: 38, mass: 0.6 };
const ABRE = { stiffness: 430, damping: 31, mass: 0.8 };
/** Al cerrar: el panel se encoge a gotita sin rebote y la isla se la sorbe */
const CIERRA = { stiffness: 620, damping: 46, mass: 0.8 };
const SORBE = { stiffness: 720, damping: 48, mass: 0.6 };
/** El brote: sale rápido con un rebote chico; regresa sin rebote */
const BROTA = { stiffness: 780, damping: 30, mass: 0.6 };
const SUME = { stiffness: 640, damping: 44, mass: 0.6 };
const SIN_ANIMAR = { duration: 1 };
/** La gotita espera a que la orilla empiece a abombarse */
const RETRASO_GOTITA = 20;
/** Cuándo la gotita se vuelve panel (al abrir) y cuándo la gotita sube a la isla (al cerrar) */
const GOTITA_MS = 110;
const ENCOGE_MS = 190;
/** Cuándo regresa el brote a la isla: al abrir, cuando el panel ya casi llegó (el cuello se corta);
 *  al cerrar, junto con la gotita */
const BROTE_ABRE_MS = 300;
const BROTE_CIERRA_MS = 250;
/** Alto del brote y cuánto se asoma bajo la isla */
const BROTE_ALTO = 34;
const BROTE_SALE = 25;

function Gota({
    gota,
    abierta,
    altoIsla,
    zona,
    anchoBrote,
    quieto,
}: {
    gota: GotaIsla;
    abierta: boolean;
    altoIsla: number;
    zona: Zona;
    anchoBrote: number;
    quieto: boolean;
}) {
    const tienda = useTiendaIsla();
    const caja = useRef<HTMLDivElement>(null);
    const [cajaEl, setCajaEl] = useState<HTMLDivElement | null>(null);
    const [alto, setAlto] = useState(0);
    const ponerCaja = useCallback((el: HTMLDivElement | null) => {
        caja.current = el;
        setCajaEl(el);
        // Se mide al montarse (antes de pintar): con un alto inventado, la gota cerrada quedaría
        // fuera de la isla y se vería un momento suelta
        // Un alto de 0 no cuenta (el contenido que llega por portal todavía no se pinta): se queda el último
        if (el) setAlto((antes) => el.offsetHeight || antes);
    }, []);
    // Primero se monta cerrada (dentro de la isla) y, ya medida, al siguiente cuadro sale
    const [lista, setLista] = useState(false);
    const visible = abierta && lista;
    const [fase, setFase] = useState<Fase>('dentro');
    const faseActual = useRef<Fase>('dentro');
    useEffect(() => {
        faseActual.current = fase;
    });
    const cerrar = useCallback(() => tienda?.cerrar(gota.id), [tienda, gota.id]);
    // Ref de callback estable: si cambiara en cada render, React la soltaría y volvería a avisar a la tienda
    const ponerDestino = useCallback((el: HTMLDivElement | null) => tienda?.ponerDestino(gota.id, el), [tienda, gota.id]);
    useVentanaAccesible(caja, visible && !gota.libre, { alEscape: cerrar });

    useLayoutEffect(() => {
        if (!cajaEl) return;
        const medir = () => setAlto((antes) => cajaEl.offsetHeight || antes);
        const ro = new ResizeObserver(medir);
        ro.observe(cajaEl);
        let segundo = 0;
        const primero = requestAnimationFrame(() => {
            medir();
            segundo = requestAnimationFrame(() => setLista(true));
        });
        return () => {
            ro.disconnect();
            cancelAnimationFrame(primero);
            cancelAnimationFrame(segundo);
        };
    }, [cajaEl]);

    // Las fases: al abrir, gotita y luego panel; al cerrar, gotita y luego adentro de la isla
    useEffect(() => {
        if (!lista) return;
        const pasos: number[] = [];
        const ir = (siguiente: Fase, ms: number) => pasos.push(window.setTimeout(() => setFase(siguiente), ms));
        if (quieto) ir(abierta ? 'abierta' : 'dentro', 0);
        else if (abierta) {
            ir('gotita', 0);
            ir('abierta', GOTITA_MS);
        } else if (faseActual.current !== 'dentro') {
            ir('gotita', 0);
            ir('dentro', ENCOGE_MS);
        }
        return () => pasos.forEach((t) => window.clearTimeout(t));
    }, [abierta, lista, quieto]);

    const width = zona.angosta ? zona.width : Math.min(gota.ancho ?? 400, zona.width - MARGEN * 2);
    const left = zona.angosta ? 0 : Math.min(Math.max(MARGEN, zona.ancla.x - width / 2), zona.width - width - MARGEN);
    const top = altoIsla + SEPARACION;
    // Sin medida todavía, se supone alta: así, cerrada, queda de más arriba (escondida), nunca abajo
    const altoReal = alto || 900;
    // La gotita: del tamaño del brote (en paneles altos, más chica: no un tubo), bajo el botón.
    // Dentro: escondida en la isla (arriba del recorte). Gotita: colgando del brote, con su borde de
    // arriba casi donde quedará el del panel (así, al hincharse, crece hacia abajo desde la isla)
    const s = Math.max(0.03, Math.min(1, anchoBrote / width, (BROTE_ALTO * 1.3) / altoReal));
    const altoGotita = altoReal * s;
    const centro = top + altoReal / 2;
    const x = zona.ancla.x - (left + width / 2);
    const yDentro = altoIsla - 2 - altoGotita / 2 - centro;
    const yGotita = altoIsla + 4 + altoGotita / 2 - centro;
    const abriendo = abierta;
    const transicion = quieto ? SIN_ANIMAR : fase === 'abierta' ? ABRE : fase === 'gotita' ? (abriendo ? GOTEA : CIERRA) : SORBE;

    return (
        <Liquid.Item
            // liquid-gooey mide dónde está la gota al montarla y al cambiar de tamaño, no al moverla; y
            // anima desde donde estaba: al conocer su alto se vuelve a montar ya en su lugar (si no,
            // saldría desde el lugar calculado con el alto supuesto)
            key={`${Math.round(left)}:${Math.round(width)}:${top}:${alto > 0}`}
            x={fase === 'abierta' ? 0 : x}
            y={fase === 'abierta' ? 0 : fase === 'gotita' ? yGotita : yDentro}
            scale={fase === 'abierta' ? 1 : s}
            transition={transicion}
            delay={!quieto && fase === 'gotita' && abriendo ? RETRASO_GOTITA : 0}
            style={{ position: 'absolute', top, left, width, pointerEvents: fase === 'abierta' ? 'auto' : 'none' }}
        >
            <div
                ref={ponerCaja}
                role="dialog"
                aria-modal="false"
                aria-label={gota.etiqueta}
                aria-hidden={!visible}
                inert={!visible}
                data-isla-gota={gota.id}
                data-abierta={fase === 'abierta'}
                className="isla-gota rounded-[26px] movil:rounded-[22px]"
            >
                <div className="isla-gota-contenido">{gota.contenido ?? <div ref={ponerDestino} />}</div>
            </div>
        </Liquid.Item>
    );
}

/**
 * La capa líquida de una gota viva: su columna, recortada en la orilla de abajo de la isla. Lleva el
 * labio (una franja escondida dentro de la isla: el filtro la funde con el brote y la orilla se curva
 * hacia afuera, como líquido que sale), el brote (la orilla que se abomba bajo el botón) y la gota.
 */
export default function CapaGota({ gota, abierta, altoIsla, zona }: { gota: GotaIsla; abierta: boolean; altoIsla: number; zona: Zona }) {
    const [quieto] = useState(movimientoQuieto);
    const [brote, setBrote] = useState(false);

    // El brote sale (dos cuadros después de montarse, para que se vea salir) y regresa cuando la gota
    // ya se soltó; al cerrar, sale a recogerla y regresa con ella
    useEffect(() => {
        if (quieto) return;
        let segundo = 0;
        const primero = requestAnimationFrame(() => {
            segundo = requestAnimationFrame(() => setBrote(true));
        });
        const regresa = window.setTimeout(() => setBrote(false), abierta ? BROTE_ABRE_MS : BROTE_CIERRA_MS);
        return () => {
            cancelAnimationFrame(primero);
            cancelAnimationFrame(segundo);
            window.clearTimeout(regresa);
        };
    }, [abierta, quieto]);

    const anchoBrote = Math.round(Math.min(64, Math.max(36, zona.ancla.w * 0.78)));
    const anchoLabio = Math.min(zona.width, anchoBrote + 96);
    const labioIzq = Math.min(Math.max(0, zona.ancla.x - anchoLabio / 2), zona.width - anchoLabio);
    // Todo lo que queda arriba de esta línea (dentro de la isla) no se ve
    const corte = altoIsla - 1;

    return (
        <Liquid
            blur={6}
            contrast={16}
            // El color sale del tema (globals.css): la isla toma el mismo mientras la gota vive
            fill="var(--isla-liquido)"
            filterPadding={8}
            className="isla-liquido"
            style={{
                position: 'absolute',
                left: zona.left,
                width: zona.width,
                top: 0,
                height: zona.height,
                pointerEvents: 'none',
                clipPath: `polygon(-48px ${corte}px, calc(100% + 48px) ${corte}px, calc(100% + 48px) calc(100% + 96px), -48px calc(100% + 96px))`,
            }}
        >
            {!quieto && (
                <>
                    {/* El labio: el borde de abajo de la isla, escondido; sólo se nota en la curva que hace con el brote */}
                    <Liquid.Item radius={8} style={{ position: 'absolute', left: labioIzq, top: altoIsla - 18, width: anchoLabio, height: 16 }}>
                        <div style={{ width: '100%', height: '100%', borderRadius: 8 }} />
                    </Liquid.Item>
                    {/* El brote: la orilla se abomba bajo el botón; de ahí sale la gota y ahí regresa */}
                    <Liquid.Item
                        y={brote ? BROTE_SALE : 0}
                        transition={brote ? BROTA : SUME}
                        radius={BROTE_ALTO / 2}
                        style={{ position: 'absolute', left: zona.ancla.x - anchoBrote / 2, top: altoIsla - BROTE_ALTO - 2, width: anchoBrote, height: BROTE_ALTO }}
                    >
                        <div style={{ width: '100%', height: '100%', borderRadius: 999 }} />
                    </Liquid.Item>
                </>
            )}
            <Gota gota={gota} abierta={abierta} altoIsla={altoIsla} zona={zona} anchoBrote={anchoBrote} quieto={quieto} />
        </Liquid>
    );
}


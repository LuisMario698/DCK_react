'use client';

import { useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import { IslaProveedor, useEstadoIsla, useTiendaIsla } from './islaTienda';
import { MARGEN, type GotaIsla, type Zona } from './tipos';

export type { GotaIsla } from './tipos';

/** La capa líquida (liquid-gooey) llega aparte: se pide en reposo o al abrir la primera gota */
const pedirCapa = () => import('./CapaGota');
const CapaGota = dynamic(pedirCapa, { ssr: false });

/**
 * La isla dinámica del portal público: la barra de arriba (Noticias, la landing) como la Dynamic
 * Island, en vidrio líquido.
 *
 *  - **La isla** es la barra de siempre, en vidrio (`simar-vidrio-fuerte`) con su borde de luz.
 *  - **Las gotas** (`gotas`): paneles que salen de la isla por su orilla de abajo, justo debajo del
 *    botón que los abre. Primero la orilla se abomba (el brote), de ahí se estira la gota, cae a su
 *    lugar y el brote regresa: el cuello se corta y la gota queda flotando. Al cerrarse, la orilla
 *    vuelve a abombarse, la gota sube, se funde con ella y la isla se la traga. Una a la vez; Esc,
 *    un clic afuera o su botón la cierran, y el foco entra y regresa (useVentanaAccesible).
 *  - Si el botón está fuera de la isla (en la nota), primero una gotita viaja de él a la isla
 *    (viaje.ts, useGota().abrirDesde) y la gota cae de ahí.
 *  - **La ranura de actividad** (RanuraActividad): un lugar dentro de la isla donde otra parte de la
 *    página pone su cápsula viva (el reproductor de la nota).
 *
 * El líquido es liquid-gooey (una silueta SVG con el filtro «goo» debajo del contenido, que queda
 * nítido), en CapaGota.tsx: se baja aparte, en reposo, así no pesa en la carga de la página. La
 * capa líquida va ENCIMA de la isla pero recortada en su orilla de abajo: lo que está dentro de la
 * isla no se ve, así que la gota de verdad sale de ella (y la isla no tiene que volver a difuminar
 * su fondo mientras el líquido se mueve). Para que nunca se trabe:
 *  - la capa líquida **sólo existe mientras una gota está abierta o cerrándose**, y sólo en la
 *    columna de esa gota (no en toda la barra): el filtro trabaja sobre poca área y, quieta, no cuesta;
 *  - el filtro es el mínimo (desenfoque + contraste); el borde de luz y la sombra van en CSS;
 *  - todo se mueve con transform: liquid-gooey escribe en cada cuadro (requestAnimationFrame) el
 *    mismo transform en la caja y en su silueta, y nada se mide a media animación;
 *  - la gota es de un solo material de principio a fin: el líquido y la isla (mientras sale una
 *    gota) toman el mismo color sólido (`--isla-liquido`), sin vidrio que se encienda al final
 *    (antes salía translúcida y al detenerse se volvía sólida: se notaba el cambio);
 *  - el contenido sólo se desvanece (opacidad), sin desenfoques animados.
 * Las gotas pintan su `contenido` o, si no lo traen, dejan un destino para que alguien pinte con un
 * portal (useGota().destino). Con «reducir movimiento» no hay brote ni viaje: la gota aparece.
 */

/** Lo que tarda en cerrarse una gota: después se quita su capa líquida */
const CIERRE_MS = 460;

/** La columna donde cae la gota: alrededor de su botón (en celular, todo el ancho) */
function medirZona(isla: HTMLElement, ancla: HTMLElement | null, ancho: number, altoIsla: number): Zona {
    const caja = isla.getBoundingClientRect();
    const angosta = caja.width < 640;
    const a = ancla?.getBoundingClientRect();
    const centro = a ? a.left + a.width / 2 - caja.left : caja.width - ancho / 2 - 8;
    const width = angosta ? caja.width : Math.min(caja.width, ancho + MARGEN * 2);
    const left = angosta ? 0 : Math.min(Math.max(0, centro - width / 2), caja.width - width);
    return {
        left,
        width,
        height: Math.min(window.innerHeight, 900),
        ancla: {
            x: centro - left,
            y: a ? a.top + a.height / 2 - caja.top : altoIsla / 2,
            w: a?.width ?? 48,
            h: a?.height ?? 48,
        },
        angosta,
        sinAncla: !a,
    };
}

interface Viva {
    id: string;
    zona: Zona;
}

function Isla({
    className = '',
    style,
    radio = 26,
    fuerte = true,
    etiqueta = 'Principal',
    gotas = [],
    children,
}: {
    className?: string;
    style?: CSSProperties;
    radio?: number;
    /** Vidrio más opaco (al bajar, en la landing) */
    fuerte?: boolean;
    etiqueta?: string;
    gotas?: GotaIsla[];
    children: ReactNode;
}) {
    const tienda = useTiendaIsla();
    const estado = useEstadoIsla();
    const raiz = useRef<HTMLDivElement>(null);
    const nav = useRef<HTMLElement>(null);
    const [altoIsla, setAltoIsla] = useState(0);
    // Las gotas que viven ahora (abiertas o cerrándose), cada una con su columna; sin gotas, no hay capa líquida
    const [vivas, setVivas] = useState<Viva[]>([]);
    const vivasActuales = useRef<Viva[]>([]);
    const abierta = estado.abierta && gotas.some((g) => g.id === estado.abierta) ? estado.abierta : null;
    // Las gotas más recientes, sin volver a suscribirse a la tienda en cada render (la landing se
    // vuelve a dibujar al bajar; resuscribirse cortaría el cierre de una gota)
    const gotasActuales = useRef(gotas);
    useEffect(() => {
        gotasActuales.current = gotas;
    });

    useLayoutEffect(() => {
        const el = nav.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setAltoIsla(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
    }, []);

    // La capa líquida se baja cuando la página ya está en reposo: la primera gota sale sin esperar
    useEffect(() => {
        const pedir = () => void pedirCapa();
        if (typeof window.requestIdleCallback === 'function') {
            const id = window.requestIdleCallback(pedir, { timeout: 4000 });
            return () => window.cancelIdleCallback(id);
        }
        const t = window.setTimeout(pedir, 2000);
        return () => window.clearTimeout(t);
    }, []);

    // Al abrir una gota se mide su columna (en el aviso de la tienda: así no hay setState en un efecto);
    // al cerrarse, su capa líquida se queda lo que tarda en subir y luego se quita. Si se abre otra
    // mientras una se cierra, conviven un momento (cada una en su columna)
    useEffect(() => {
        if (!tienda) return;
        const quitar = new Map<string, number>();
        const poner = (lista: Viva[]) => {
            vivasActuales.current = lista;
            setVivas(lista);
        };
        const alCambiar = () => {
            const { abierta: id, anclas } = tienda.leer();
            const gota = gotasActuales.current.find((g) => g.id === id);
            let lista = vivasActuales.current;
            if (gota && raiz.current && nav.current) {
                window.clearTimeout(quitar.get(gota.id));
                quitar.delete(gota.id);
                const ya = lista.find((v) => v.id === gota.id);
                const ancla = anclas[gota.id] ?? null;
                if (!ya || (ya.zona.sinAncla && ancla)) {
                    const zona = medirZona(raiz.current, ancla, gota.ancho ?? 400, nav.current.offsetHeight);
                    lista = [...lista.filter((v) => v.id !== gota.id), { id: gota.id, zona }];
                    poner(lista);
                }
            }
            for (const v of lista) {
                if (v.id === id || quitar.has(v.id)) continue;
                quitar.set(
                    v.id,
                    window.setTimeout(() => {
                        quitar.delete(v.id);
                        poner(vivasActuales.current.filter((x) => x.id !== v.id));
                    }, CIERRE_MS),
                );
            }
        };
        const soltar = tienda.suscribir(alCambiar);
        return () => {
            soltar();
            quitar.forEach((t) => window.clearTimeout(t));
        };
    }, [tienda]);

    // Un clic afuera de la gota abierta (y de los botones que la abren) la cierra
    const libre = gotas.find((g) => g.id === abierta)?.libre ?? false;
    useEffect(() => {
        if (!abierta || !tienda || libre) return;
        const alPulsar = (e: PointerEvent) => {
            const t = e.target as Node;
            const gota = document.querySelector(`[data-isla-gota="${abierta}"]`);
            const ancla = estado.anclas[abierta];
            if (gota?.contains(t) || ancla?.contains(t)) return;
            // Otro botón que abre la misma gota (el «Letra» de la nota): él mismo la alterna
            if (t instanceof Element && t.closest(`[data-isla-abre="${abierta}"]`)) return;
            tienda.cerrar();
        };
        document.addEventListener('pointerdown', alPulsar);
        return () => document.removeEventListener('pointerdown', alPulsar);
    }, [abierta, tienda, estado.anclas, libre]);

    return (
        <div
            ref={raiz}
            className={`isla ${className.includes('fixed') || className.includes('absolute') ? '' : 'relative'} ${className}`}
            style={style}
            data-actividad={estado.actividad}
            data-gota={vivas.length > 0}
        >
            <nav
                ref={nav}
                aria-label={etiqueta}
                // Mientras sale una gota la isla se vuelve más densa (el líquido que sale es de ella)
                className={`isla-cristal relative ${fuerte || vivas.length > 0 ? 'simar-vidrio-fuerte' : 'simar-vidrio'} transition-[background-color] duration-300`}
                style={{ borderRadius: radio }}
            >
                {children}
            </nav>
            {vivas.map((v) => {
                const gota = gotas.find((g) => g.id === v.id);
                if (!gota) return null;
                return <CapaGota key={v.id} gota={gota} abierta={abierta === v.id} altoIsla={altoIsla} zona={v.zona} />;
            })}
        </div>
    );
}

/** La isla; si la página no trae IslaProveedor, se pone el suyo */
export function IslaDinamica(props: Parameters<typeof Isla>[0]) {
    const tienda = useTiendaIsla();
    if (tienda) return <Isla {...props} />;
    return (
        <IslaProveedor>
            <Isla {...props} />
        </IslaProveedor>
    );
}

/** El lugar dentro de la isla donde otra parte de la página pone su cápsula (useRanuraIsla) */
export function RanuraActividad({ className = '' }: { className?: string }) {
    const tienda = useTiendaIsla();
    const poner = useCallback((el: HTMLDivElement | null) => tienda?.ponerRanura(el), [tienda]);
    return <div ref={poner} className={`flex items-center empty:hidden ${className}`} />;
}

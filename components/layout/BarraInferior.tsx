'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useLayoutEffect, useRef, useState, type MouseEvent, type PointerEvent, type RefObject } from 'react';
import { Menu, type LucideIcon } from 'lucide-react';
import { useOcultarAlBajar } from './useOcultarAlBajar';
import { useRefraccion } from '@/components/ui/vidrioLiquido';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';

export interface ItemBarraInferior {
    label: string;
    href: string;
    icon: LucideIcon;
    activo: boolean;
    /** Contador (mensajes, pendientes). Se muestra con número, nunca sólo un punto. */
    contador?: number;
}

/**
 * Barra de navegación inferior para celular y tableta (se oculta desde 1024 px, donde está el menú
 * lateral). Es una cápsula de **cristal líquido** plano, como la barra de pestañas de iOS 26, que
 * flota sobre el contenido (ver vidrioLiquido):
 *
 * - Al bajar por la página se **minimiza**: quedan sólo los íconos, más baja y angosta. Al subir
 *   (o al abrir "Más") vuelve a su tamaño.
 * - Una **gota** (tinte plano) marca la sección activa y se desliza a la nueva con física de resorte: la
 *   orilla que va adelante tira y la de atrás la sigue, así se estira, se aplana y se asienta con un
 *   vaivén corto. También se puede arrastrar con el dedo sobre la barra y soltar en otra sección.
 * - Al final va un botón que abre el resto ("Más" abre la hoja del recinto; "Menú", el menú lateral).
 *
 * Con "reducir movimiento" la gota salta sin vaivén y la barra cambia de tamaño al instante.
 * Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
export function BarraInferior({
    items,
    onAbrirMenu,
    contadorMenu = 0,
    etiquetaMenu = 'Menú',
    iconoMenu: IconoMenu = Menu,
    menuAbierto = false,
}: {
    items: ItemBarraInferior[];
    onAbrirMenu: () => void;
    /** Pendientes que viven en secciones del menú (p. ej. mensajes sin leer) */
    contadorMenu?: number;
    etiquetaMenu?: string;
    iconoMenu?: LucideIcon;
    /** El menú o la hoja que abre este botón está abierto (la gota se va a ese botón) */
    menuAbierto?: boolean;
}) {
    const router = useRouter();
    const reducir = usePrefiereMenosMovimiento();
    const [bajando] = useOcultarAlBajar();
    const [arrastrando, setArrastrando] = useState(false);
    const minimizada = bajando && !menuAbierto && !arrastrando;

    // Refracción sutil: el fondo sólo se dobla un poco en la orilla de la cápsula
    const [refCristal, cristal] = useRefraccion<HTMLDivElement>({ radio: 999, bisel: 12, fuerza: 18, desenfoque: 4 });
    const refGota = useRef<HTMLSpanElement>(null);

    // Sección activa: la de la ruta, o "Más" con la hoja abierta. Al tocar otra, la gota se va de
    // inmediato (pendiente) sin esperar a que cargue la pantalla.
    const indiceRuta = menuAbierto ? items.length : items.findIndex((i) => i.activo);
    const [pendiente, setPendiente] = useState<number | null>(null);
    const [rutaAntes, setRutaAntes] = useState(indiceRuta);
    if (indiceRuta !== rutaAntes) {
        setRutaAntes(indiceRuta);
        setPendiente(null);
    }
    const indice = pendiente ?? indiceRuta;

    // Arrastre con el dedo: posición x relativa a la barra y la sección que queda debajo
    const botones = useRef<(HTMLElement | null)[]>([]);
    const dedoX = useRef<number | null>(null);
    const toque = useRef<{ x: number; id: number; activo: boolean } | null>(null);
    const huboArrastre = useRef(false);
    const [indiceArrastre, setIndiceArrastre] = useState(-1);
    const indiceVisible = arrastrando ? indiceArrastre : indice;

    const despertarGota = useGotaLiquida({
        contenedor: refCristal,
        gota: refGota,
        botones,
        dedoX,
        indice,
        reducir,
        levantada: arrastrando,
    });

    // Ancho real de la barra: así el cambio a minimizada se anima de px a px (sin retraso)
    const navRef = useRef<HTMLElement>(null);
    const [anchoNav, setAnchoNav] = useState(0);
    useEffect(() => {
        const nav = navRef.current;
        if (!nav) return;
        const observador = new ResizeObserver(() => setAnchoNav(nav.clientWidth));
        observador.observe(nav);
        return () => observador.disconnect();
    }, []);
    const total = items.length + 1;
    // Todos los botones miden lo mismo (flex-1): minimizada, 52 px por botón
    const anchoMaximo = minimizada ? total * 52 + 10 : Math.min(576, anchoNav || 576);

    // Las barras pegadas abajo (guardar manifiesto) bajan junto con la barra minimizada
    useEffect(() => {
        const html = document.documentElement;
        html.toggleAttribute('data-barra-mini', minimizada);
        return () => html.removeAttribute('data-barra-mini');
    }, [minimizada]);

    const masCercano = (x: number) => {
        let mejor = -1;
        let distancia = Infinity;
        botones.current.forEach((b, i) => {
            if (!b) return;
            const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - x);
            if (d < distancia) {
                distancia = d;
                mejor = i;
            }
        });
        return mejor;
    };

    const elegir = (i: number) => {
        if (i < 0) return;
        if (i === items.length) {
            onAbrirMenu();
            return;
        }
        setPendiente(i);
        router.push(items[i].href);
    };

    const alPresionar = (e: PointerEvent<HTMLDivElement>) => {
        if (e.pointerType === 'mouse' && e.button !== 0) return;
        toque.current = { x: e.clientX, id: e.pointerId, activo: false };
        huboArrastre.current = false;
    };
    const alMover = (e: PointerEvent<HTMLDivElement>) => {
        const t = toque.current;
        const barra = refCristal.current;
        if (!t || t.id !== e.pointerId || !barra) return;
        if (!t.activo) {
            // Un toque normal abre la sección; sólo si el dedo se desliza de lado es arrastre
            if (Math.abs(e.clientX - t.x) < 10) return;
            t.activo = true;
            barra.setPointerCapture(e.pointerId);
            setArrastrando(true);
        }
        dedoX.current = e.clientX - barra.getBoundingClientRect().left;
        const i = masCercano(dedoX.current);
        setIndiceArrastre((antes) => (antes === i ? antes : i));
        despertarGota();
    };
    const alSoltar = (e: PointerEvent<HTMLDivElement>) => {
        const t = toque.current;
        toque.current = null;
        if (!t?.activo) return;
        const cancelado = e.type === 'pointercancel';
        const i = dedoX.current === null ? -1 : masCercano(dedoX.current);
        dedoX.current = null;
        huboArrastre.current = !cancelado;
        setArrastrando(false);
        if (!cancelado) elegir(i);
        despertarGota();
    };
    // Tras arrastrar, el "clic" que manda el navegador al soltar no debe abrir otra sección
    const alClicCaptura = (e: MouseEvent<HTMLDivElement>) => {
        if (!huboArrastre.current) return;
        huboArrastre.current = false;
        e.preventDefault();
        e.stopPropagation();
    };

    return (
        <nav
            ref={navRef}
            aria-label="Navegación principal"
            className="simar-barra-inferior lg:hidden fixed z-30 inset-x-2 bottom-[max(10px,env(safe-area-inset-bottom))] sm:inset-x-4 pointer-events-none"
        >
            {cristal.filtro}
            <div
                ref={refCristal}
                data-refraccion={cristal.activo || undefined}
                data-mini={minimizada || undefined}
                style={{ ...cristal.estilo, maxWidth: anchoMaximo }}
                onPointerDown={alPresionar}
                onPointerMove={alMover}
                onPointerUp={alSoltar}
                onPointerCancel={alSoltar}
                onClickCapture={alClicCaptura}
                className="simar-cristal simar-barra-cristal pointer-events-auto mx-auto rounded-full flex items-stretch touch-pan-y select-none"
            >
                {/* La gota: decorativa, detrás de los íconos */}
                <span
                    ref={refGota}
                    aria-hidden="true"
                    data-levantada={arrastrando || undefined}
                    className="simar-gota"
                />
                {items.map((item, i) => (
                    <Link
                        key={item.href}
                        ref={(el) => {
                            botones.current[i] = el;
                        }}
                        href={item.href}
                        onClick={() => setPendiente(i)}
                        aria-current={item.activo ? 'page' : undefined}
                        draggable={false}
                        className="simar-barra-boton group flex-1 basis-0 min-w-0 rounded-full px-px flex flex-col items-center justify-center"
                    >
                        <Contenido Icono={item.icon} label={item.label} activo={indiceVisible === i} contador={item.contador} />
                    </Link>
                ))}
                <button
                    ref={(el) => {
                        botones.current[items.length] = el;
                    }}
                    type="button"
                    onClick={onAbrirMenu}
                    aria-expanded={menuAbierto}
                    aria-label={contadorMenu > 0 ? `${etiquetaMenu} (${contadorMenu} pendientes)` : etiquetaMenu}
                    className="simar-barra-boton group flex-1 basis-0 min-w-0 rounded-full px-px flex flex-col items-center justify-center"
                >
                    <Contenido Icono={IconoMenu} label={etiquetaMenu} activo={indiceVisible === items.length} contador={contadorMenu} />
                </button>
            </div>
        </nav>
    );
}

function Contenido({ Icono, label, activo, contador }: { Icono: LucideIcon; label: string; activo: boolean; contador?: number }) {
    const color = activo ? 'text-simar-marea-tinta' : 'text-simar-texto';
    return (
        <>
            <span className={`relative h-[24px] flex items-center justify-center transition-colors duration-200 ${color}`}>
                <Icono className="w-[23px] h-[23px]" strokeWidth={activo ? 2.3 : 2} />
                {!!contador && contador > 0 && <Contador valor={contador} />}
            </span>
            {/* Al minimizar, la palabra se cierra (ancho y alto) y quedan sólo los íconos. Mide de
                10 a 12 px según la pantalla para que "Estadísticas" quepa con aire dentro de la gota en
                un botón de igual ancho que los demás (360 px); el mismo peso activa o no, para que no salte al moverse la gota. */}
            <span
                className={`simar-barra-etiqueta text-[clamp(10px,2.9vw,12px)] leading-[15px] font-bold whitespace-nowrap text-ellipsis transition-colors duration-200 ${
                    activo ? 'text-simar-marea-tinta' : 'text-simar-texto'
                }`}
            >
                {label}
            </span>
        </>
    );
}

function Contador({ valor }: { valor: number }) {
    return (
        <span className="absolute -top-1.5 -right-3 min-w-[20px] h-[20px] px-1 rounded-full bg-[#A63F0E] text-white text-[12px] font-bold flex items-center justify-center ring-2 ring-simar-superficie">
            {valor > 9 ? '9+' : valor}
        </span>
    );
}

/**
 * Física de la gota. Cada orilla (izquierda y derecha) es un resorte con poco amortiguamiento:
 * la que va adelante es más rígida y la de atrás más blanda, así la gota se estira al viajar y se
 * encoge al llegar, con un vaivén corto. Al estirarse se aplana (conserva su "volumen"). La altura
 * y la posición vertical siguen a la sección (cambian al minimizar). Se pinta con transform en cada
 * cuadro, sin renders de React. Devuelve una función para despertar la animación.
 */
function useGotaLiquida({
    contenedor,
    gota,
    botones,
    dedoX,
    indice,
    reducir,
    levantada,
}: {
    contenedor: RefObject<HTMLDivElement | null>;
    gota: RefObject<HTMLSpanElement | null>;
    botones: RefObject<(HTMLElement | null)[]>;
    dedoX: RefObject<number | null>;
    indice: number;
    reducir: boolean;
    levantada: boolean;
}) {
    const despertarRef = useRef<() => void>(() => {});
    const parametros = useRef({ indice, reducir, levantada });

    useLayoutEffect(() => {
        parametros.current = { indice, reducir, levantada };
        despertarRef.current();
    }, [indice, reducir, levantada]);

    useEffect(() => {
        const barra = contenedor.current;
        const el = gota.current;
        if (!barra || !el) return;

        const s = { L: 0, R: 0, vL: 0, vR: 0, T: 0, H: 0, vT: 0, vH: 0, iniciada: false, visible: false, baseW: 0, baseH: 0 };
        let cuadro = 0;
        let ultimo = 0;
        let activaHasta = 0;

        const objetivo = () => {
            const lista = botones.current;
            const x = dedoX.current;
            let i = parametros.current.indice;
            if (x !== null) {
                let distancia = Infinity;
                lista.forEach((b, j) => {
                    if (!b) return;
                    const d = Math.abs(b.offsetLeft + b.offsetWidth / 2 - x);
                    if (d < distancia) {
                        distancia = d;
                        i = j;
                    }
                });
            }
            const b = i >= 0 ? lista[i] : null;
            if (!b) return null;
            const h = b.offsetHeight;
            // Con la barra completa la gota (cápsula) es 6 px más ancha por lado que su botón: así su
            // curva queda fuera de las letras y "Estadísticas" cabe entera. Minimizada (46 px de alto,
            // sólo íconos) mide lo mismo que el botón; en medio, pasa de una a otra sin saltos.
            const extra = Math.min(1, Math.max(0, (h - 46) / 12)) * 6;
            const w = b.offsetWidth + extra * 2;
            // En las orillas se recorre hacia adentro: nunca pasa del primer ni del último botón, así
            // queda concéntrica con la cápsula de la barra
            const primero = lista.find(Boolean);
            const ultimo = [...lista].reverse().find(Boolean);
            const minX = primero ? primero.offsetLeft : 0;
            const maxX = ultimo ? ultimo.offsetLeft + ultimo.offsetWidth : barra.clientWidth;
            // Arrastrando, la gota va bajo el dedo
            const centro = Math.min(Math.max(x ?? b.offsetLeft + b.offsetWidth / 2, minX + w / 2), maxX - w / 2);
            return { centro, w, top: b.offsetTop, h };
        };

        const resorte = (x: number, v: number, meta: number, k: number, z: number, dt: number) => {
            const a = -k * (x - meta) - 2 * z * Math.sqrt(k) * v;
            const v2 = v + a * dt;
            return [x + v2 * dt, v2] as const;
        };

        const pintar = (o: { w: number; h: number }) => {
            if (s.baseW !== o.w || s.baseH !== o.h) {
                s.baseW = o.w;
                s.baseH = o.h;
                el.style.width = `${o.w}px`;
                el.style.height = `${o.h}px`;
            }
            const ancho = Math.max(8, s.R - s.L);
            const estiramiento = ancho - o.w;
            const aplastada = Math.min(1.05, Math.max(0.86, 1 - (estiramiento / o.w) * 0.28));
            const alzada = parametros.current.levantada ? 1.04 : 1;
            const sx = (ancho / o.w) * alzada;
            const sy = (s.H / o.h) * aplastada * alzada;
            const cx = s.L + ancho / 2;
            const cy = s.T + s.H / 2;
            el.style.transform = `translate3d(${cx - o.w / 2}px, ${cy - o.h / 2}px, 0) scale(${sx.toFixed(4)}, ${sy.toFixed(4)})`;
        };

        const avanzar = (ahora: number) => {
            cuadro = 0;
            const o = objetivo();
            if (!o) {
                if (s.visible) {
                    el.style.opacity = '0';
                    s.visible = false;
                }
                s.iniciada = false;
                ultimo = ahora;
                return;
            }
            const metaL = o.centro - o.w / 2;
            const metaR = o.centro + o.w / 2;
            if (!s.iniciada || parametros.current.reducir) {
                s.L = metaL;
                s.R = metaR;
                s.T = o.top;
                s.H = o.h;
                s.vL = s.vR = s.vT = s.vH = 0;
                s.iniciada = true;
            } else {
                // Tiempo real aunque el navegador salte cuadros (p. ej. mientras carga la pantalla nueva)
                const dt = Math.min(0.1, Math.max(0.001, (ahora - ultimo) / 1000));
                const aLaDerecha = metaL + metaR > s.L + s.R;
                const conDedo = dedoX.current !== null;
                const kLider = conDedo ? 900 : 420;
                const kCola = conDedo ? 560 : 240;
                const pasos = Math.max(2, Math.ceil(dt / 0.004));
                const h = dt / pasos;
                for (let p = 0; p < pasos; p++) {
                    [s.L, s.vL] = resorte(s.L, s.vL, metaL, aLaDerecha ? kCola : kLider, aLaDerecha ? 0.78 : 0.55, h);
                    [s.R, s.vR] = resorte(s.R, s.vR, metaR, aLaDerecha ? kLider : kCola, aLaDerecha ? 0.55 : 0.78, h);
                    [s.T, s.vT] = resorte(s.T, s.vT, o.top, 360, 0.82, h);
                    [s.H, s.vH] = resorte(s.H, s.vH, o.h, 360, 0.82, h);
                }
            }
            ultimo = ahora;
            if (!s.visible) {
                el.style.opacity = '1';
                s.visible = true;
            }
            pintar(o);
            const quieta =
                Math.abs(s.L - metaL) < 0.15 &&
                Math.abs(s.R - metaR) < 0.15 &&
                Math.abs(s.T - o.top) < 0.15 &&
                Math.abs(s.H - o.h) < 0.15 &&
                Math.abs(s.vL) + Math.abs(s.vR) < 3;
            if (!quieta || ahora < activaHasta || dedoX.current !== null) cuadro = requestAnimationFrame(avanzar);
        };

        const despertar = () => {
            // Sigue midiendo un rato: la barra puede estar cambiando de tamaño (minimizar)
            activaHasta = performance.now() + 480;
            if (!cuadro) {
                ultimo = performance.now();
                cuadro = requestAnimationFrame(avanzar);
            }
        };
        despertarRef.current = despertar;

        const observador = new ResizeObserver(despertar);
        observador.observe(barra);
        botones.current.forEach((b) => b && observador.observe(b));
        despertar();

        return () => {
            observador.disconnect();
            cancelAnimationFrame(cuadro);
            despertarRef.current = () => {};
        };
    }, [contenedor, gota, botones, dedoX]);

    return () => despertarRef.current();
}

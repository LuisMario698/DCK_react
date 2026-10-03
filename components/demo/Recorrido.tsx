'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowDown, ArrowLeft, ArrowRight, ArrowUp, Droplets, FileText, Hand, Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { NumeroAnimado, PalomitaAnimada, usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { createClient } from '@/lib/supabase/client';
import { getLandingStats, type LandingStats } from '@/lib/services/landing_stats';
import { aguaProtegidaL } from '@/lib/utils/equivalencias';
import type { VistaDemo } from '@/lib/demo/config';
import { EVENTO_RECORRIDO, guardarRecorrido, leerRecorrido } from '@/lib/demo/estadoRecorrido';
import { EVENTO_CAMBIO_DETENIDO } from '@/lib/demo/avisos';
import { RECORRIDOS, type PruebaPaso, type TonoPaso } from './recorridos';

/**
 * Recorrido guiado de la demostración. La pantalla real queda detrás de un velo que la oscurece un poco
 * y la desenfoca; la parte de la que se habla queda nítida en un hueco que se desliza de un paso al
 * siguiente. Una tarjeta, con una flechita hacia el hueco, cuenta una idea por paso.
 *
 * "Pruébalo tú": se ilumina sólo lo que se va a probar y es lo único que responde; una burbuja con
 * flecha dice qué hacer y, cuando se hizo (un número escrito, "Firmado", una ventana que se abrió y se
 * cerró), cambia a "¡Listo!". Si la pantalla abre una ventana (firmar, solicitar), el recorrido se
 * hace a un lado para que se pueda usar.
 *
 * Se avanza con botones, con las flechas del teclado, deslizando la tarjeta (celular) o tocando los
 * segmentos de arriba. Termina con lo que la demo lleva registrado. Con "reducir movimiento" nada se
 * desliza. Lo monta el layout de cada área sólo en modo demostración.
 */

const TONO: Record<TonoPaso, string> = {
    marea: 'bg-simar-marea-suave text-simar-marea-tinta',
    arrecife: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
    violeta: 'bg-simar-violeta-suave text-simar-violeta',
};

// Medidas (px)
const HOLGURA = 10;
const HOLGURA_PRUEBA = 8;
const RADIO = 20;
const MARGEN = 16;
const ANCHO_TARJETA = 440;
const ANCHO_BURBUJA = 400;
// Lo que tapa arriba la píldora del encabezado en celular y tableta
const ARRIBA_CELULAR = 84;
// Deslizar la tarjeta: cuánto hay que mover el dedo de lado (y no tanto hacia arriba o abajo)
const DESLIZ_MIN = 60;
const DESLIZ_MAX_VERTICAL = 50;
// Cuánto se acerca el hueco a su lugar en cada cuadro mientras se desliza (frena al llegar)
const SUAVIDAD = 0.2;
// Las ventanas de las pantallas (firma, solicitar, ver una solicitud)
const VENTANAS = '[aria-modal="true"], .simar-ventana, .simar-hoja';

interface Caja {
    top: number;
    left: number;
    width: number;
    height: number;
}

const sinHueco = (vp: { w: number; h: number }): Caja => ({ top: vp.h / 2, left: vp.w / 2, width: 0, height: 0 });

function aLaVista(el: Element) {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
}

/** El primer elemento a la vista de la lista de selectores (en celular algunas partes se ocultan) */
function buscarObjetivo(selectores: string[]): HTMLElement | null {
    for (const selector of selectores) {
        for (const el of document.querySelectorAll<HTMLElement>(selector)) {
            if (aLaVista(el)) return el;
        }
    }
    return null;
}

/** La ruta sin el idioma ni la diagonal final: "/es/dashboard/manifiesto/" → "/dashboard/manifiesto" */
function rutaSinIdioma(pathname: string) {
    return ('/' + pathname.split('/').filter(Boolean).slice(1).join('/')).replace(/\/$/, '') || '/';
}

/** "Lo que va entre **dobles asteriscos** sale en negritas" */
function conNegritas(texto: string): ReactNode[] {
    return texto.split('**').map((parte, i) =>
        i % 2 ? (
            <strong key={i} className="font-bold text-simar-texto">
                {parte}
            </strong>
        ) : (
            parte
        )
    );
}

/** ¿El teclado está escribiendo en un campo? (ahí las flechas mueven el cursor, no el recorrido) */
function escribiendo(e: KeyboardEvent) {
    const el = e.target as HTMLElement | null;
    return !!el && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName));
}

/** Máscara del velo: todo cubierto menos un rectángulo de esquinas redondeadas (el hueco) */
function mascaraConHueco(h: Caja, w: number, alto: number): string {
    const r = Math.min(RADIO, h.width / 2, h.height / 2);
    const { top: y, left: x, width: a, height: b } = h;
    const hueco =
        `M${x + r} ${y}H${x + a - r}A${r} ${r} 0 0 1 ${x + a} ${y + r}V${y + b - r}A${r} ${r} 0 0 1 ${x + a - r} ${y + b}` +
        `H${x + r}A${r} ${r} 0 0 1 ${x} ${y + b - r}V${y + r}A${r} ${r} 0 0 1 ${x + r} ${y}Z`;
    const svg = `<svg xmlns='http://www.w3.org/2000/svg' width='${w}' height='${alto}' viewBox='0 0 ${w} ${alto}'><path fill='#fff' fill-rule='evenodd' d='M0 0H${w}V${alto}H0Z${hueco}'/></svg>`;
    return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/** Acerca la caja que se ve a la de destino (o la pone de una vez); la misma si no cambió */
function acercar(antes: Caja | null, destino: Caja, deUnaVez: boolean): Caja {
    if (!antes) return destino;
    const iguales =
        Math.abs(antes.top - destino.top) < 0.5 &&
        Math.abs(antes.left - destino.left) < 0.5 &&
        Math.abs(antes.width - destino.width) < 0.5 &&
        Math.abs(antes.height - destino.height) < 0.5;
    if (iguales) return antes.top === destino.top && antes.left === destino.left && antes.width === destino.width && antes.height === destino.height ? antes : destino;
    if (deUnaVez) return destino;
    return {
        top: antes.top + (destino.top - antes.top) * SUAVIDAD,
        left: antes.left + (destino.left - antes.left) * SUAVIDAD,
        width: antes.width + (destino.width - antes.width) * SUAVIDAD,
        height: antes.height + (destino.height - antes.height) * SUAVIDAD,
    };
}

/** La flechita de una tarjeta o burbuja hacia el hueco (un cuadro girado del color de la tarjeta) */
function Flechita({ lado, pos }: { lado: 'arriba' | 'abajo' | 'izquierda' | 'derecha'; pos: number }) {
    const base = 'absolute w-4 h-4 rotate-45 bg-simar-superficie border-simar-borde/60';
    const estilos: Record<typeof lado, [string, CSSProperties]> = {
        arriba: ['border-l border-t', { top: -8, left: pos - 8 }],
        abajo: ['border-r border-b', { bottom: -8, left: pos - 8 }],
        izquierda: ['border-l border-b', { left: -8, top: pos - 8 }],
        derecha: ['border-t border-r', { right: -8, top: pos - 8 }],
    };
    const [bordes, estilo] = estilos[lado];
    return <span aria-hidden="true" className={`${base} ${bordes}`} style={estilo} />;
}

const limitar = (n: number, min: number, max: number) => Math.min(Math.max(n, min), Math.max(min, max));

export function Recorrido({ vista }: { vista: VistaDemo }) {
    const recorrido = RECORRIDOS[vista];
    const total = recorrido.pasos.length;
    const router = useRouter();
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const rutaActual = rutaSinIdioma(pathname);
    const reducirMovimiento = usePrefiereMenosMovimiento();

    // null = cerrado; 0 = bienvenida; 1…total = pasos; total + 1 = final
    const [paso, setPaso] = useState<number | null>(null);
    // "Pruébalo tú": sólo lo que se prueba responde y el recorrido espera en una burbuja
    const [probando, setProbando] = useState(false);
    const [hecho, setHecho] = useState(false);
    // Probando, la pantalla abrió una ventana (firmar, solicitar…): el recorrido se hace a un lado
    const [hayVentana, setHayVentana] = useState(false);
    // Tocar fuera de lo que se prueba (o Enter sin número): el aro vuelve a latir (ahí es)
    const [latido, setLatido] = useState(0);
    const datos = paso !== null && paso >= 1 && paso <= total ? recorrido.pasos[paso - 1] : null;
    const prueba: PruebaPaso | undefined = datos?.prueba;
    const enBienvenida = paso === 0;
    const enFinal = paso === total + 1;

    // Se abre si al entrar a la demo (o con "Repetir recorrido") quedó guardado para esta vista
    useEffect(() => {
        const abrir = () => {
            const estado = leerRecorrido();
            if (estado && estado.vista === vista) {
                setProbando(false);
                setPaso(Math.min(Math.max(estado.paso, 0), total + 1));
            }
        };
        abrir();
        window.addEventListener(EVENTO_RECORRIDO, abrir);
        return () => window.removeEventListener(EVENTO_RECORRIDO, abrir);
    }, [vista, total]);

    useEffect(() => {
        if (paso !== null) guardarRecorrido({ vista, paso });
    }, [paso, vista]);

    const cerrar = useCallback(() => {
        guardarRecorrido(null);
        setProbando(false);
        setPaso(null);
    }, []);
    const irA = useCallback(
        (n: number) => {
            setProbando(false);
            setPaso(Math.min(Math.max(n, 0), total + 1));
        },
        [total]
    );
    const siguiente = useCallback(() => {
        setProbando(false);
        setPaso((p) => (p === null ? p : Math.min(p + 1, total + 1)));
    }, [total]);
    const anterior = useCallback(() => {
        setProbando(false);
        setPaso((p) => (p === null ? p : Math.max(p - 1, 0)));
    }, []);
    const probar = () => {
        setHecho(false);
        setProbando(true);
    };

    // Tamaño de la ventana del navegador
    const [vp, setVp] = useState({ w: 1280, h: 800 });
    useEffect(() => {
        const medir = () => setVp({ w: window.innerWidth, h: window.innerHeight });
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);
    const celular = vp.w < 640;

    // Alto de la tarjeta y de la burbuja (para acomodarlas)
    const abierto = paso !== null;
    const conTarjeta = abierto && !probando;
    const tarjetaRef = useRef<HTMLDivElement>(null);
    const burbujaRef = useRef<HTMLDivElement>(null);
    const [altoTarjeta, setAltoTarjeta] = useState(280);
    const [altoBurbuja, setAltoBurbuja] = useState(120);
    useLayoutEffect(() => {
        const el = probando ? burbujaRef.current : tarjetaRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => (probando ? setAltoBurbuja : setAltoTarjeta)(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
        // La burbuja se vuelve a montar al cerrar una ventana y cambia de alto al terminar la prueba
    }, [abierto, probando, hayVentana, hecho]);

    // Ir a la pantalla del paso
    useEffect(() => {
        if (datos && rutaActual !== datos.ruta) router.push(`/${locale}${datos.ruta}`, { scroll: false });
    }, [datos, rutaActual, locale, router]);

    // Lo que se ilumina: la parte del paso o, probando, lo que se va a probar. Las pantallas cargan sus
    // datos a su ritmo: se reintenta un rato; si no aparece, la tarjeta queda al centro
    const colocacion = useRef({ celular, altoTarjeta, reducirMovimiento });
    useEffect(() => {
        colocacion.current = { celular, altoTarjeta, reducirMovimiento };
    });
    const [objetivo, setObjetivo] = useState<HTMLElement | null>(null);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- el elemento sólo existe en la página ya pintada
        setObjetivo(null);
        if (!datos || rutaActual !== datos.ruta) return;
        const selectores = probando && datos.prueba ? datos.prueba.objetivo : datos.objetivo;
        let vigente = true;
        let reintento: ReturnType<typeof setTimeout>;
        const inicio = Date.now();
        const intentar = () => {
            if (!vigente) return;
            const el = buscarObjetivo(selectores);
            if (el) {
                setObjetivo(el);
                const { celular: cel, altoTarjeta: alto, reducirMovimiento: quieto } = colocacion.current;
                // Si está dentro de algo que se desplaza de lado (una tabla ancha), primero a la vista
                // completa; lo de arriba y abajo lo acomoda la página en seguida
                el.scrollIntoView({ block: 'nearest', inline: 'nearest' });
                const r = el.getBoundingClientRect();
                const arriba = cel ? ARRIBA_CELULAR : 24;
                let destino: number;
                if (probando) {
                    // Lo que se prueba, un poco arriba del centro: debajo va la burbuja
                    const centro = arriba + (window.innerHeight - arriba - 170) / 2;
                    destino = window.scrollY + r.top + r.height / 2 - centro;
                    // En computadora, el cursor ya en el campo (en celular abriría el teclado de golpe)
                    if (window.innerWidth >= 640) el.querySelector<HTMLInputElement>('input')?.focus({ preventScroll: true });
                } else {
                    const disponible = window.innerHeight - arriba - (cel ? alto + 28 : 24);
                    // En computadora, si la parte y la tarjeta caben una debajo de la otra, se centran juntas
                    const juntas = r.height + 2 * HOLGURA + MARGEN + alto;
                    const alturaUtil = !cel && juntas <= disponible ? juntas : r.height;
                    destino =
                        alturaUtil <= disponible
                            ? window.scrollY + r.top - arriba - (disponible - alturaUtil) / 2
                            : window.scrollY + r.top - arriba;
                }
                window.scrollTo({ top: Math.max(0, destino), behavior: quieto ? 'auto' : 'smooth' });
                return;
            }
            if (Date.now() - inicio < 6000) reintento = setTimeout(intentar, 120);
        };
        // Un cuadro después: la pantalla nueva ya está montada
        reintento = setTimeout(intentar, 60);
        return () => {
            vigente = false;
            clearTimeout(reintento);
        };
    }, [datos, probando, rutaActual]);

    // El hueco se desliza al cambiar de paso (o al empezar a probar); al desplazarse la página lo sigue
    // sin retraso
    const [moviendo, setMoviendo] = useState(false);
    useEffect(() => {
        if (paso === null) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- marca el cambio de paso
        setMoviendo(true);
        const t = setTimeout(() => setMoviendo(false), 900);
        return () => clearTimeout(t);
    }, [paso, probando, objetivo]);

    // Un solo cuadro por cuadro: mide lo iluminado, calcula el hueco y lo acerca
    const geometria = useRef({ vp, celular, altoTarjeta, probando, objetivo, moviendo, reducirMovimiento });
    useEffect(() => {
        geometria.current = { vp, celular, altoTarjeta, probando, objetivo, moviendo, reducirMovimiento };
    });
    const [foco, setFoco] = useState<Caja | null>(null);
    useEffect(() => {
        if (!abierto) return;
        let cuadro = 0;
        const medir = () => {
            const g = geometria.current;
            let destino = sinHueco(g.vp);
            if (g.objetivo?.isConnected) {
                const r = g.objetivo.getBoundingClientRect();
                const holgura = g.probando ? HOLGURA_PRUEBA : HOLGURA;
                const limiteAbajo = !g.probando && g.celular ? g.vp.h - g.altoTarjeta - 24 : g.vp.h - 8;
                const top = Math.max(r.top - holgura, 8);
                const bottom = Math.min(r.bottom + holgura, limiteAbajo);
                const left = Math.max(r.left - holgura, 8);
                const right = Math.min(r.right + holgura, g.vp.w - 8);
                if (r.width > 0 && bottom - top > 24 && right - left > 24) destino = { top, left, width: right - left, height: bottom - top };
            }
            setFoco((antes) => acercar(antes, destino, g.reducirMovimiento || !g.moviendo));
            cuadro = requestAnimationFrame(medir);
        };
        medir();
        return () => cancelAnimationFrame(cuadro);
    }, [abierto]);

    // Teclado: flechas para avanzar y regresar; nunca mientras se escribe en un campo ni mientras se
    // prueba. Probando, Escape regresa a la explicación (Escape en la tarjeta lo maneja la ventana)
    useEffect(() => {
        if (paso === null) return;
        const tecla = (e: KeyboardEvent) => {
            if (probando) {
                if (e.key === 'Escape' && !document.querySelector(VENTANAS)) setProbando(false);
                return;
            }
            if (escribiendo(e)) return;
            if (e.key === 'ArrowRight' && paso <= total) {
                e.preventDefault();
                siguiente();
            } else if (e.key === 'ArrowLeft' && paso > 0) {
                e.preventDefault();
                anterior();
            }
        };
        window.addEventListener('keydown', tecla);
        return () => window.removeEventListener('keydown', tecla);
    }, [paso, probando, total, siguiente, anterior]);

    // Deslizar la tarjeta en celular: a la izquierda avanza, a la derecha regresa
    const toque = useRef<{ x: number; y: number } | null>(null);
    const alTocar = (e: TouchEvent) => {
        const t = e.touches[0];
        toque.current = { x: t.clientX, y: t.clientY };
    };
    const alSoltar = (e: TouchEvent) => {
        const inicio = toque.current;
        toque.current = null;
        if (!inicio || paso === null) return;
        const t = e.changedTouches[0];
        const dx = t.clientX - inicio.x;
        const dy = t.clientY - inicio.y;
        if (Math.abs(dx) < DESLIZ_MIN || Math.abs(dy) > DESLIZ_MAX_VERTICAL) return;
        if (dx < 0 && paso <= total) siguiente();
        else if (dx > 0 && paso > 0) anterior();
    };

    useVentanaAccesible(tarjetaRef, conTarjeta, { alEscape: cerrar });
    // En cada paso el foco va al botón principal (sin mover la página)
    const principalRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (conTarjeta) principalRef.current?.focus({ preventScroll: true });
    }, [paso, conTarjeta]);

    // Probando: ¿la pantalla abrió una ventana? (el recorrido se hace a un lado) ¿ya se probó?
    const objetivoRef = useRef<HTMLElement | null>(null);
    useEffect(() => {
        objetivoRef.current = objetivo;
    }, [objetivo]);
    useEffect(() => {
        if (!probando || !prueba) return;
        let vioVentana = false;
        let ultimoValor = '';
        let desde = 0;
        let envio = false;
        let cierre: ReturnType<typeof setTimeout> | undefined;
        const revisar = () => {
            const ventana = !!document.querySelector(VENTANAS);
            setHayVentana(ventana);
            const { listo } = prueba;
            let ya = false;
            if (listo.tipo === 'ventana') {
                if (ventana) vioVentana = true;
                else ya = vioVentana;
            } else if (listo.tipo === 'envio') {
                // Enviar (aunque la demo no lo guarde) es probar; cancelar no cuenta
                ya = envio && !ventana;
            } else if (listo.tipo === 'texto') {
                ya = !ventana && !!document.querySelector(listo.selector)?.textContent?.includes(listo.texto);
            } else {
                // Un número mayor que cero que ya no cambió en un momento (que termine de escribir)
                const valor = document.querySelector<HTMLInputElement>(listo.selector)?.value ?? '';
                if (Number(valor) > 0) {
                    if (valor !== ultimoValor) {
                        ultimoValor = valor;
                        desde = Date.now();
                    } else ya = Date.now() - desde > 900;
                }
            }
            if (ya) setHecho(true);
        };

        // Se intentó guardar: la demo ya avisó que no se guarda. Un momento después (para leer el aviso)
        // se cierra la ventana como con Escape, y sale el "¡Listo!"
        const alDetener = () => {
            if (prueba.listo.tipo !== 'envio') return;
            envio = true;
            clearTimeout(cierre);
            cierre = setTimeout(() => {
                if (document.querySelector(VENTANAS)) {
                    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
                }
            }, 1400);
        };
        window.addEventListener(EVENTO_CAMBIO_DETENIDO, alDetener);

        // El cursor no sale de lo que se prueba: Enter o Tab no lo mandan a otro campo (en el manifiesto
        // Enter pasa al siguiente). Con un número escrito, Enter es "listo"
        const alTeclear = (e: KeyboardEvent) => {
            const el = objetivoRef.current;
            if (!el || !el.contains(e.target as Node) || document.querySelector(VENTANAS)) return;
            if (e.key === 'Enter' && prueba.listo.tipo === 'valor' && (e.target as HTMLElement).tagName === 'INPUT') {
                e.preventDefault();
                e.stopPropagation();
                if (Number((e.target as HTMLInputElement).value) > 0) setHecho(true);
                else setLatido((n) => n + 1);
            }
        };
        const alEnfocar = (e: FocusEvent) => {
            const el = objetivoRef.current;
            const destino = e.target as Node;
            if (!el || document.querySelector(VENTANAS)) return;
            if (el.contains(destino) || burbujaRef.current?.contains(destino)) return;
            (el.querySelector<HTMLElement>('input, button, [tabindex]') ?? el).focus({ preventScroll: true });
        };
        // En captura: antes que los manejadores de la pantalla
        window.addEventListener('keydown', alTeclear, true);
        document.addEventListener('focusin', alEnfocar);

        revisar();
        const intervalo = setInterval(revisar, 250);
        return () => {
            clearInterval(intervalo);
            clearTimeout(cierre);
            window.removeEventListener(EVENTO_CAMBIO_DETENIDO, alDetener);
            window.removeEventListener('keydown', alTeclear, true);
            document.removeEventListener('focusin', alEnfocar);
        };
    }, [probando, prueba]);

    // Al terminar la prueba, "Seguir" queda listo para el teclado
    const seguirRef = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        if (probando && hecho) seguirRef.current?.focus({ preventScroll: true });
    }, [probando, hecho]);


    // Lo que la demo lleva registrado, para el cierre
    const [cifras, setCifras] = useState<LandingStats | null>(null);
    useEffect(() => {
        if (!enFinal || cifras) return;
        let vigente = true;
        getLandingStats(createClient())
            .then((c) => vigente && setCifras(c))
            .catch(() => {});
        return () => {
            vigente = false;
        };
    }, [enFinal, cifras]);

    if (paso === null) return null;
    // Probando con una ventana de la pantalla abierta: que se use la ventana
    if (probando && hayVentana) return null;

    const hueco = foco && foco.width > 1 && foco.height > 1 ? foco : null;
    const mascara = hueco ? mascaraConHueco(hueco, vp.w, vp.h) : undefined;
    const centroHueco = hueco ? { x: hueco.left + hueco.width / 2, y: hueco.top + hueco.height / 2 } : null;

    // ── Velo, aro y lo que no se puede tocar ──
    const velo = (
        <>
            <div
                aria-hidden="true"
                className="simar-recorrido-velo simar-velo fixed inset-0 pointer-events-none"
                style={mascara ? { maskImage: mascara, WebkitMaskImage: mascara } : undefined}
            />
            {hueco && (
                <div
                    aria-hidden="true"
                    className="fixed pointer-events-none"
                    style={{ ...hueco, borderRadius: RADIO, boxShadow: '0 0 0 2px rgba(255, 255, 255, 0.95), 0 0 0 7px rgba(32, 178, 196, 0.32)' }}
                />
            )}
            {hueco && probando && !hecho && (
                <div key={`latido-${paso}-${latido}`} aria-hidden="true" className="simar-recorrido-late fixed pointer-events-none" style={{ ...hueco, borderRadius: RADIO }} />
            )}
            {/* Fuera del hueco no se toca nada; probando, el hueco sí responde (la raíz deja pasar los toques:
                sólo bloquean estas piezas) */}
            {probando && hueco ? (
                <>
                    {[
                        { left: 0, right: 0, top: 0, height: hueco.top },
                        { left: 0, right: 0, top: hueco.top + hueco.height, bottom: 0 },
                        { left: 0, top: hueco.top, height: hueco.height, width: hueco.left },
                        { right: 0, top: hueco.top, height: hueco.height, left: hueco.left + hueco.width },
                    ].map((estilo, i) => (
                        <div key={i} aria-hidden="true" className="fixed pointer-events-auto" style={estilo} onClick={() => setLatido((n) => n + 1)} />
                    ))}
                </>
            ) : (
                <div aria-hidden="true" className="fixed inset-0 pointer-events-auto" />
            )}
        </>
    );

    // ── Probando: la burbuja con flecha, junto a lo que se prueba ──
    if (probando && prueba) {
        const ancho = celular ? vp.w - 24 : Math.min(ANCHO_BURBUJA, vp.w - 2 * MARGEN);
        const debajo = !hueco || vp.h - (hueco.top + hueco.height) >= altoBurbuja + 28;
        const left = centroHueco ? limitar(centroHueco.x - ancho / 2, 12, vp.w - ancho - 12) : (vp.w - ancho) / 2;
        const top = hueco
            ? debajo
                ? hueco.top + hueco.height + 16
                : Math.max(12, hueco.top - 16 - altoBurbuja)
            : (vp.h - altoBurbuja) / 2;
        const Flecha = debajo ? ArrowUp : ArrowDown;
        return createPortal(
            <div className="simar-compacto fixed inset-0 z-[60] pointer-events-none">
                {velo}
                <div
                    ref={burbujaRef}
                    role="dialog"
                    aria-label="Pruébalo tú"
                    className="simar-aparece pointer-events-auto fixed bg-simar-superficie border border-simar-borde/60 rounded-[22px] p-4 shadow-[0_24px_64px_-24px_rgba(11,34,54,0.55)] movil:p-3.5"
                    style={{ top, left, width: ancho }}
                >
                    {centroHueco && <Flechita lado={debajo ? 'arriba' : 'abajo'} pos={limitar(centroHueco.x - left, 26, ancho - 26)} />}
                    {!hecho ? (
                        <div className="flex items-start gap-3">
                            <span className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-marea text-white flex items-center justify-center movil:w-9 movil:h-9">
                                <Flecha className="w-5 h-5" strokeWidth={2.4} />
                            </span>
                            <div className="flex-1 min-w-0">
                                <p className="text-[17px] leading-snug text-simar-texto movil:text-[15px]">
                                    <strong className="font-bold">Pruébalo tú.</strong> {prueba.texto}
                                </p>
                                <div className="mt-1.5 -ml-2 flex items-center gap-1">
                                    <button
                                        type="button"
                                        onClick={() => setProbando(false)}
                                        className="min-h-[40px] px-2 rounded-xl text-[15px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave transition-colors movil:text-[14px]"
                                    >
                                        Volver
                                    </button>
                                    <button
                                        type="button"
                                        onClick={siguiente}
                                        className="min-h-[40px] px-2 rounded-xl text-[15px] font-bold text-simar-texto-2 hover:bg-simar-papel transition-colors movil:text-[14px]"
                                    >
                                        Saltar
                                    </button>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-wrap items-center gap-3">
                            <PalomitaAnimada tamano={40} className="flex-shrink-0 text-simar-arrecife-tinta" />
                            <p className="flex-1 min-w-[180px] text-[17px] leading-snug text-simar-texto movil:text-[15px]">
                                <strong className="font-bold">¡Listo!</strong> {prueba.hecho}
                            </p>
                            <Button ref={seguirRef} onClick={siguiente} className="movil:basis-full">
                                Seguir
                                <ArrowRight className="w-5 h-5" />
                            </Button>
                        </div>
                    )}
                </div>
            </div>,
            document.body
        );
    }

    // ── La tarjeta: en celular, abajo a todo lo ancho; en computadora, junto al hueco (abajo, arriba, a un
    //    lado o, si no cabe, en la esquina con más espacio), con su flechita hacia el hueco ──
    let posicion: CSSProperties;
    let flechita: { lado: 'arriba' | 'abajo' | 'izquierda' | 'derecha'; pos: number } | null = null;
    if (celular) {
        posicion = { left: 12, right: 12, bottom: 'max(12px, env(safe-area-inset-bottom))' };
        const topTarjeta = vp.h - altoTarjeta - 12;
        if (hueco && centroHueco && hueco.top + hueco.height <= topTarjeta - 6) flechita = { lado: 'arriba', pos: limitar(centroHueco.x - 12, 26, vp.w - 24 - 26) };
    } else if (!hueco || !centroHueco) {
        posicion = { top: Math.max(MARGEN, (vp.h - altoTarjeta) / 2), left: (vp.w - ANCHO_TARJETA) / 2, width: ANCHO_TARJETA };
    } else {
        const ancho = Math.min(ANCHO_TARJETA, vp.w - 2 * MARGEN);
        const abajo = vp.h - (hueco.top + hueco.height);
        let top: number;
        let left = limitar(hueco.left, MARGEN, vp.w - ancho - MARGEN);
        if (abajo >= altoTarjeta + 2 * MARGEN) {
            top = hueco.top + hueco.height + MARGEN;
            flechita = { lado: 'arriba', pos: limitar(centroHueco.x - left, 26, ancho - 26) };
        } else if (hueco.top >= altoTarjeta + 2 * MARGEN) {
            top = hueco.top - MARGEN - altoTarjeta;
            flechita = { lado: 'abajo', pos: limitar(centroHueco.x - left, 26, ancho - 26) };
        } else {
            top = limitar(centroHueco.y - altoTarjeta / 2, MARGEN, vp.h - altoTarjeta - MARGEN);
            if (vp.w - (hueco.left + hueco.width) >= ancho + 2 * MARGEN) {
                left = hueco.left + hueco.width + MARGEN;
                flechita = { lado: 'izquierda', pos: limitar(centroHueco.y - top, 26, altoTarjeta - 26) };
            } else if (hueco.left >= ancho + 2 * MARGEN) {
                left = hueco.left - MARGEN - ancho;
                flechita = { lado: 'derecha', pos: limitar(centroHueco.y - top, 26, altoTarjeta - 26) };
            } else {
                // No cabe en ningún lado: en la esquina del lado con más espacio libre, para tapar lo menos
                top = hueco.top > abajo ? MARGEN : vp.h - altoTarjeta - MARGEN;
                left = vp.w - ancho - MARGEN;
            }
        }
        posicion = { top, left, width: ancho };
    }

    const Icono = datos?.icono;
    const otra = recorrido.final.otraVista;

    return createPortal(
        // simar-compacto: en celular, la misma escala compacta de los paneles
        <div className="simar-compacto fixed inset-0 z-[60] pointer-events-none">
            {velo}
            <div
                ref={tarjetaRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="recorrido-titulo"
                aria-describedby="recorrido-texto"
                tabIndex={-1}
                onTouchStart={alTocar}
                onTouchEnd={alSoltar}
                className="simar-ventana pointer-events-auto fixed outline-none bg-simar-superficie border border-simar-borde/60 rounded-[26px] p-6 shadow-[0_28px_70px_-24px_rgba(11,34,54,0.6)] movil:p-4 movil:rounded-[22px]"
                style={posicion}
            >
                {flechita && <Flechita lado={flechita.lado} pos={flechita.pos} />}
                {/* Cada paso entra con un leve fundido (la tarjeta no se vuelve a montar) */}
                <div key={paso} className="simar-aparece">
                    <div className="flex items-center gap-3">
                        {datos ? (
                            <>
                                {/* El avance en segmentos; cada uno lleva a su paso */}
                                <div role="group" aria-label={`Paso ${paso} de ${total}`} className="flex-1 flex items-center gap-1.5">
                                    {recorrido.pasos.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => irA(i + 1)}
                                            aria-label={`Ir al paso ${i + 1}: ${p.titulo}`}
                                            aria-current={i + 1 === paso ? 'step' : undefined}
                                            className="flex-1 h-6 flex items-center"
                                        >
                                            <span
                                                className={`h-1.5 w-full rounded-full transition-colors ${i + 1 === paso ? 'bg-simar-marea' : i + 1 < paso ? 'bg-simar-marea/40' : 'bg-simar-borde'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                                <span aria-hidden="true" className="text-[15px] font-bold tabular-nums text-simar-texto-2">
                                    {paso}/{total}
                                </span>
                            </>
                        ) : (
                            <span className="flex-1">
                                {enBienvenida ? (
                                    <LogoSimar variante="simbolo" tamano={celular ? 44 : 52} />
                                ) : (
                                    <PalomitaAnimada tamano={celular ? 40 : 46} className="text-simar-arrecife-tinta" />
                                )}
                            </span>
                        )}
                        <button
                            type="button"
                            onClick={cerrar}
                            aria-label="Salir del recorrido"
                            title="Salir del recorrido"
                            className="-mr-2 w-10 h-10 flex-shrink-0 rounded-full text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto flex items-center justify-center transition-colors"
                        >
                            <X className="w-5 h-5" />
                        </button>
                    </div>

                    {datos && Icono ? (
                        <div className="mt-4 flex items-center gap-3 movil:mt-3">
                            <span className={`w-11 h-11 flex-shrink-0 rounded-full flex items-center justify-center movil:w-10 movil:h-10 ${TONO[datos.tono ?? 'marea']}`}>
                                <Icono className="w-[22px] h-[22px] movil:w-5 movil:h-5" />
                            </span>
                            <h2 id="recorrido-titulo" className="text-[23px] font-extrabold leading-tight text-simar-texto">
                                {datos.titulo}
                            </h2>
                        </div>
                    ) : (
                        <h2 id="recorrido-titulo" className="mt-4 text-[26px] font-extrabold leading-tight text-simar-texto movil:mt-3">
                            {enBienvenida ? recorrido.bienvenida.titulo : recorrido.final.titulo}
                        </h2>
                    )}

                    <p id="recorrido-texto" className="mt-2.5 text-lg leading-relaxed text-simar-texto-2 movil:mt-2">
                        {conNegritas(datos ? datos.texto : enBienvenida ? recorrido.bienvenida.texto : recorrido.final.texto)}
                    </p>

                    {/* Bienvenida: el camino completo de un vistazo, con el ícono de cada paso */}
                    {enBienvenida && (
                        <>
                            <div aria-hidden="true" className="mt-5 flex items-center movil:mt-4">
                                {recorrido.pasos.map((p, i) => {
                                    const IconoPaso = p.icono;
                                    return (
                                        <Fragment key={i}>
                                            {i > 0 && <span className="h-0.5 flex-1 min-w-2 bg-simar-borde" />}
                                            <span className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center movil:w-9 movil:h-9 ${TONO[p.tono ?? 'marea']}`}>
                                                <IconoPaso className="w-5 h-5 movil:w-[18px] movil:h-[18px]" />
                                            </span>
                                        </Fragment>
                                    );
                                })}
                            </div>
                            <p className="mt-3 text-[15px] font-bold text-simar-texto-2">
                                {total} pasos · unos 2 minutos · puedes probar en el camino
                            </p>
                        </>
                    )}

                    {/* Final: lo que la demo lleva registrado (datos de ejemplo), con su agua protegida */}
                    {enFinal && cifras && cifras.totalManifiestos > 0 && (
                        <div className="mt-5 movil:mt-4">
                            <p className="text-[15px] font-bold text-simar-texto-2">En esta demostración, SiMAR lleva:</p>
                            <div className="mt-2.5 grid grid-cols-3 gap-2.5 movil:gap-2">
                                {[
                                    { icono: FileText, valor: cifras.totalManifiestos, decimales: 0, texto: 'manifiestos sin papel', tono: TONO.marea },
                                    { icono: Droplets, valor: cifras.totalAceiteUsado, decimales: 0, texto: 'litros de aceite recuperados', tono: TONO.arrecife },
                                    { icono: Waves, valor: aguaProtegidaL(cifras.totalAceiteUsado) / 1_000_000, decimales: 1, texto: 'millones de litros de agua protegida', tono: TONO.violeta },
                                ].map((c) => {
                                    const IconoCifra = c.icono;
                                    return (
                                        <div key={c.texto} className="rounded-2xl bg-simar-papel px-3 py-3 movil:px-2.5 movil:py-2.5">
                                            <span className={`w-8 h-8 rounded-full flex items-center justify-center ${c.tono} movil:w-7 movil:h-7`}>
                                                <IconoCifra className="w-[18px] h-[18px] movil:w-4 movil:h-4" />
                                            </span>
                                            <p className="mt-2 text-[24px] font-extrabold leading-none text-simar-texto tabular-nums movil:text-[19px]">
                                                <NumeroAnimado valor={c.valor} decimales={c.decimales} />
                                            </p>
                                            <p className="mt-1 text-[14px] leading-snug text-simar-texto-2 movil:text-[12px]">{c.texto}</p>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    )}

                    {/* Botones. En la bienvenida y el final, en celular, uno debajo del otro */}
                    {datos ? (
                        <div className="mt-6 flex items-center gap-2.5 movil:mt-4 movil:gap-2">
                            <button
                                type="button"
                                onClick={anterior}
                                aria-label="Paso anterior"
                                title="Atrás"
                                className="simar-presiona w-[52px] h-[52px] flex-shrink-0 rounded-full border-2 border-simar-campo-borde text-simar-texto flex items-center justify-center hover:border-simar-marea-tinta transition-colors"
                            >
                                <ArrowLeft className="w-[22px] h-[22px]" />
                            </button>
                            {prueba && (
                                <Button variant="secondary" onClick={probar} className="flex-shrink-0 whitespace-nowrap px-4 movil:px-3">
                                    <Hand className="w-5 h-5 flex-shrink-0" />
                                    <span className="movil:hidden">Pruébalo tú</span>
                                    <span className="hidden movil:inline">Probar</span>
                                </Button>
                            )}
                            <Button ref={principalRef} onClick={siguiente} className="flex-1 min-w-0 whitespace-nowrap px-4 movil:px-3">
                                {paso === total ? 'Terminar' : 'Siguiente'}
                                <ArrowRight className="w-5 h-5 flex-shrink-0" />
                            </Button>
                        </div>
                    ) : (
                        <div className="mt-6 flex flex-wrap items-center gap-3 movil:mt-4 movil:gap-2 movil:flex-col movil:items-stretch">
                            {enBienvenida && (
                                <>
                                    <Button ref={principalRef} size="lg" onClick={siguiente} className="flex-1 min-w-[200px] movil:min-w-0 movil:flex-none movil:w-full">
                                        Empezar recorrido
                                        <ArrowRight className="w-[22px] h-[22px]" />
                                    </Button>
                                    <Button variant="secondary" size="lg" onClick={cerrar} className="flex-1 min-w-[200px] movil:min-w-0 movil:flex-none movil:w-full">
                                        Explorar por mi cuenta
                                    </Button>
                                </>
                            )}
                            {enFinal && (
                                <>
                                    <Button ref={principalRef} size="lg" onClick={cerrar} className="flex-1 min-w-[200px] movil:min-w-0 movil:flex-none movil:w-full">
                                        Explorar por mi cuenta
                                    </Button>
                                    <Button
                                        variant="secondary"
                                        size="lg"
                                        onClick={() => {
                                            guardarRecorrido(null);
                                            window.location.assign(`/${locale}/demo?vista=${otra.vista}`);
                                        }}
                                        className="flex-1 min-w-[200px] movil:min-w-0 movil:flex-none movil:w-full"
                                    >
                                        {otra.texto}
                                    </Button>
                                </>
                            )}
                        </div>
                    )}
                    {paso === 1 && (
                        <p className="mt-4 text-[15px] text-simar-texto-2 movil:mt-3 movil:text-[13px]">
                            {celular ? 'También puedes deslizar la tarjeta para avanzar.' : 'También puedes avanzar con las flechas del teclado.'}
                        </p>
                    )}
                </div>
            </div>
        </div>,
        document.body
    );
}

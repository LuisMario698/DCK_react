'use client';

import { Fragment, useCallback, useEffect, useLayoutEffect, useRef, useState, type CSSProperties, type ReactNode, type TouchEvent } from 'react';
import { createPortal } from 'react-dom';
import { usePathname, useRouter } from 'next/navigation';
import { ArrowLeft, ArrowRight, Droplets, FileText, Hand, Waves, X } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { NumeroAnimado, PalomitaAnimada, usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { createClient } from '@/lib/supabase/client';
import { getLandingStats, type LandingStats } from '@/lib/services/landing_stats';
import { aguaProtegidaL } from '@/lib/utils/equivalencias';
import type { VistaDemo } from '@/lib/demo/config';
import { EVENTO_RECORRIDO, guardarRecorrido, leerRecorrido } from '@/lib/demo/estadoRecorrido';
import { RECORRIDOS, type TonoPaso } from './recorridos';

/**
 * Recorrido guiado de la demostración: una tarjeta con una idea por paso y, detrás, la pantalla real
 * oscurecida con la parte de la que se habla iluminada. Cambia de pantalla solo y se maneja con
 * botones, con las flechas del teclado o deslizando la tarjeta (celular). En los pasos con
 * "Pruébalo tú" la pantalla se libera para tocarla de verdad y el recorrido queda en una pastilla
 * con "Seguir". Termina con lo que la demo lleva registrado (agua protegida incluida). Con "reducir
 * movimiento" nada se desliza. Lo monta el layout de cada área sólo en modo demostración.
 */

const TONO: Record<TonoPaso, string> = {
    marea: 'bg-simar-marea-suave text-simar-marea-tinta',
    arrecife: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
    violeta: 'bg-simar-violeta-suave text-simar-violeta',
};

// Medidas del recuadro y de la tarjeta (px)
const HOLGURA = 10;
const MARGEN = 16;
const ANCHO_TARJETA = 440;
// Lo que tapa arriba la píldora del encabezado en celular y tableta
const ARRIBA_CELULAR = 84;
// Deslizar la tarjeta: cuánto hay que mover el dedo de lado (y no tanto hacia arriba o abajo)
const DESLIZ_MIN = 60;
const DESLIZ_MAX_VERTICAL = 50;

interface Caja {
    top: number;
    left: number;
    width: number;
    height: number;
}

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
    // "Pruébalo tú": la pantalla queda libre y el recorrido espera en una pastilla
    const [probando, setProbando] = useState(false);
    const datos = paso !== null && paso >= 1 && paso <= total ? recorrido.pasos[paso - 1] : null;
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

    // Tamaño de la ventana del navegador
    const [vp, setVp] = useState({ w: 1280, h: 800 });
    useEffect(() => {
        const medir = () => setVp({ w: window.innerWidth, h: window.innerHeight });
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, []);
    const celular = vp.w < 640;

    // Alto de la tarjeta (para acomodarla y, en celular, para dejar a la vista lo de arriba)
    const tarjetaRef = useRef<HTMLDivElement>(null);
    const [altoTarjeta, setAltoTarjeta] = useState(280);
    const abierto = paso !== null;
    const conTarjeta = abierto && !probando;
    useLayoutEffect(() => {
        const el = tarjetaRef.current;
        if (!el) return;
        const ro = new ResizeObserver(() => setAltoTarjeta(el.offsetHeight));
        ro.observe(el);
        return () => ro.disconnect();
    }, [conTarjeta]);

    // Lo que el paso necesita para colocar la página sin volver a correr la búsqueda
    const colocacion = useRef({ celular, altoTarjeta, reducirMovimiento });
    useEffect(() => {
        colocacion.current = { celular, altoTarjeta, reducirMovimiento };
    });

    // Ir a la pantalla del paso (mientras se prueba, la persona va a donde quiera)
    useEffect(() => {
        if (datos && !probando && rutaActual !== datos.ruta) router.push(`/${locale}${datos.ruta}`, { scroll: false });
    }, [datos, probando, rutaActual, locale, router]);

    // Buscar la parte de la que habla el paso y traerla a la vista (las pantallas cargan sus datos a su
    // ritmo: se reintenta un rato; si no aparece, la tarjeta queda al centro)
    const [objetivo, setObjetivo] = useState<HTMLElement | null>(null);
    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- el elemento sólo existe en la página ya pintada
        setObjetivo(null);
        if (!datos || probando || rutaActual !== datos.ruta) return;
        let vigente = true;
        let reintento: ReturnType<typeof setTimeout>;
        const inicio = Date.now();
        const intentar = () => {
            if (!vigente) return;
            const el = buscarObjetivo(datos.objetivo);
            if (el) {
                setObjetivo(el);
                const { celular: cel, altoTarjeta: alto, reducirMovimiento: quieto } = colocacion.current;
                const r = el.getBoundingClientRect();
                const arriba = cel ? ARRIBA_CELULAR : 24;
                const disponible = window.innerHeight - arriba - (cel ? alto + 28 : 24);
                // En computadora, si la parte y la tarjeta caben una debajo de la otra, se centran juntas
                // (así la tarjeta no la tapa); en celular la tarjeta ya tiene su lugar abajo
                const juntas = r.height + 2 * HOLGURA + MARGEN + alto;
                const alturaUtil = !cel && juntas <= disponible ? juntas : r.height;
                const destino =
                    alturaUtil <= disponible
                        ? window.scrollY + r.top - arriba - (disponible - alturaUtil) / 2
                        : window.scrollY + r.top - arriba;
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

    // Seguir al objetivo mientras la página se desplaza o se acomoda
    const [caja, setCaja] = useState<Caja | null>(null);
    useEffect(() => {
        if (!objetivo) {
            // eslint-disable-next-line react-hooks/set-state-in-effect -- sin objetivo no hay recuadro
            setCaja(null);
            return;
        }
        let cuadro = 0;
        let previa = '';
        const medir = () => {
            const r = objetivo.getBoundingClientRect();
            const clave = `${Math.round(r.top)},${Math.round(r.left)},${Math.round(r.width)},${Math.round(r.height)}`;
            if (clave !== previa) {
                previa = clave;
                setCaja(r.width > 0 && r.height > 0 ? { top: r.top, left: r.left, width: r.width, height: r.height } : null);
            }
            cuadro = requestAnimationFrame(medir);
        };
        medir();
        return () => cancelAnimationFrame(cuadro);
    }, [objetivo]);

    // El recuadro y la tarjeta se deslizan sólo al cambiar de paso; al desplazarse la página, sin retraso
    const [moviendo, setMoviendo] = useState(false);
    useEffect(() => {
        if (paso === null) return;
        // eslint-disable-next-line react-hooks/set-state-in-effect -- marca el cambio de paso
        setMoviendo(true);
        const t = setTimeout(() => setMoviendo(false), 900);
        return () => clearTimeout(t);
    }, [paso, objetivo]);

    // Teclado: flechas para avanzar y regresar (Escape lo maneja la ventana). Nunca mientras se escribe
    // en un campo ni mientras se prueba la pantalla
    useEffect(() => {
        if (paso === null || probando) return;
        const tecla = (e: KeyboardEvent) => {
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

    // Mientras se prueba, si la pantalla abre una ventana (firmar, solicitar…) la pastilla se esconde
    // para no tapar sus botones
    const [hayVentana, setHayVentana] = useState(false);
    useEffect(() => {
        if (!probando) return;
        const revisar = () => setHayVentana(!!document.querySelector('[aria-modal="true"], .simar-ventana, .simar-hoja'));
        revisar();
        const intervalo = setInterval(revisar, 400);
        return () => clearInterval(intervalo);
    }, [probando]);

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

    // ── Probando: sólo la pastilla, arriba y al centro (debajo del encabezado en celular). Abajo taparía
    //    las barras de guardar (manifiesto) y la barra inferior ──
    if (probando && datos) {
        if (hayVentana) return null;
        return createPortal(
            <div className="simar-compacto fixed inset-x-0 z-[60] flex justify-center px-3 pointer-events-none top-[calc(env(safe-area-inset-top)+72px)] lg:top-5">
                <div
                    role="region"
                    aria-label="Recorrido en pausa"
                    className="simar-vidrio-fuerte simar-aparece pointer-events-auto relative w-full max-w-[600px] rounded-[24px] p-2.5 pl-4 flex items-center gap-3 movil:p-2 movil:pl-3 movil:gap-2"
                >
                    <span className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center movil:w-8 movil:h-8">
                        <Hand className="w-5 h-5 movil:w-4 movil:h-4" />
                    </span>
                    <p className="flex-1 min-w-0 text-[15px] leading-snug text-simar-texto movil:text-[13px]">
                        <strong className="font-bold">Pruébalo:</strong> {datos.prueba}
                    </p>
                    <Button onClick={siguiente} className="flex-shrink-0 movil:px-3.5">
                        Seguir
                        <ArrowRight className="w-5 h-5" />
                    </Button>
                    <button
                        type="button"
                        onClick={cerrar}
                        aria-label="Salir del recorrido"
                        title="Salir del recorrido"
                        className="w-10 h-10 flex-shrink-0 rounded-xl text-simar-texto-2 hover:bg-white/60 dark:hover:bg-white/10 flex items-center justify-center transition-colors movil:w-8 movil:h-8"
                    >
                        <X className="w-5 h-5" />
                    </button>
                </div>
            </div>,
            document.body
        );
    }

    // Recuadro iluminado: la parte de la pantalla con su holgura, recortada a lo que se ve (en celular,
    // a lo que queda arriba de la tarjeta). Sin objetivo, un punto al centro: todo queda oscurecido y
    // al llegar el objetivo el recuadro se abre desde ahí.
    const limiteAbajo = celular ? vp.h - altoTarjeta - 24 : vp.h - 8;
    let foco: Caja = { top: vp.h / 2, left: vp.w / 2, width: 0, height: 0 };
    if (datos && caja) {
        const top = Math.max(caja.top - HOLGURA, 8);
        const bottom = Math.min(caja.top + caja.height + HOLGURA, limiteAbajo);
        const left = Math.max(caja.left - HOLGURA, 8);
        const right = Math.min(caja.left + caja.width + HOLGURA, vp.w - 8);
        if (bottom - top > 24 && right - left > 24) foco = { top, left, width: right - left, height: bottom - top };
    }
    const hayFoco = foco.width > 0;

    // Tarjeta: en celular, abajo a todo lo ancho; en computadora, junto al recuadro (abajo, arriba, a un
    // lado o, si el recuadro llena la pantalla, en la esquina del lado con más espacio)
    let posicion: CSSProperties;
    if (celular) {
        posicion = { left: 12, right: 12, bottom: 'max(12px, env(safe-area-inset-bottom))' };
    } else if (!hayFoco) {
        posicion = { top: Math.max(MARGEN, (vp.h - altoTarjeta) / 2), left: (vp.w - ANCHO_TARJETA) / 2, width: ANCHO_TARJETA };
    } else {
        const ancho = Math.min(ANCHO_TARJETA, vp.w - 2 * MARGEN);
        const izquierdaAlineada = Math.min(Math.max(foco.left, MARGEN), vp.w - ancho - MARGEN);
        const abajo = vp.h - (foco.top + foco.height);
        let top: number;
        let left = izquierdaAlineada;
        if (abajo >= altoTarjeta + 2 * MARGEN) top = foco.top + foco.height + MARGEN;
        else if (foco.top >= altoTarjeta + 2 * MARGEN) top = foco.top - MARGEN - altoTarjeta;
        else {
            top = Math.min(Math.max(foco.top, MARGEN), vp.h - altoTarjeta - MARGEN);
            if (vp.w - (foco.left + foco.width) >= ancho + 2 * MARGEN) left = foco.left + foco.width + MARGEN;
            else if (foco.left >= ancho + 2 * MARGEN) left = foco.left - MARGEN - ancho;
            else {
                const libreArriba = foco.top;
                const libreAbajo = vp.h - (foco.top + foco.height);
                top = libreArriba > libreAbajo ? MARGEN : vp.h - altoTarjeta - MARGEN;
                left = vp.w - ancho - MARGEN;
            }
        }
        posicion = { top, left, width: ancho };
    }

    const Icono = datos?.icono;
    const otra = recorrido.final.otraVista;

    return createPortal(
        // simar-compacto: en celular, la misma escala compacta de los paneles
        <div className="simar-compacto fixed inset-0 z-[60]">
            {/* Mientras dura el recorrido la pantalla de atrás no responde: se ve, no se toca */}
            <div aria-hidden="true" className="absolute inset-0" />
            <div
                aria-hidden="true"
                data-moviendo={moviendo || undefined}
                className="simar-recorrido-foco fixed pointer-events-none rounded-[22px]"
                style={{
                    ...foco,
                    // La sombra oscurece el resto: del tamaño justo para cubrir la ventana desde cualquier
                    // punto (una de 9999 px es una capa enorme que algunos navegadores no pintan)
                    boxShadow: `0 0 0 ${Math.ceil(Math.hypot(vp.w, vp.h))}px rgba(11, 34, 54, 0.6)${hayFoco ? ', 0 0 0 3px var(--simar-golfo)' : ''}`,
                }}
            />
            <div
                ref={tarjetaRef}
                role="dialog"
                aria-modal="true"
                aria-labelledby="recorrido-titulo"
                aria-describedby="recorrido-texto"
                tabIndex={-1}
                data-moviendo={(moviendo && !celular) || undefined}
                onTouchStart={alTocar}
                onTouchEnd={alSoltar}
                className="simar-recorrido-tarjeta simar-ventana fixed outline-none bg-simar-superficie border border-simar-borde rounded-[28px] shadow-2xl p-6 md:p-7 movil:p-4 movil:rounded-[22px]"
                style={posicion}
            >
                {/* Cada paso entra con un leve fundido (la tarjeta no se vuelve a montar) */}
                <div key={paso} className="simar-aparece">
                    <div className="flex items-start justify-between gap-3">
                        {datos ? (
                            <div className="flex items-center gap-2.5 pt-1.5 movil:pt-1">
                                <p className="text-[15px] font-bold text-simar-texto-2 whitespace-nowrap">
                                    Paso {paso} de {total}
                                </p>
                                {/* Los puntos también llevan a cada paso */}
                                <div className="flex items-center">
                                    {recorrido.pasos.map((p, i) => (
                                        <button
                                            key={i}
                                            type="button"
                                            onClick={() => irA(i + 1)}
                                            aria-label={`Ir al paso ${i + 1}: ${p.titulo}`}
                                            aria-current={i + 1 === paso ? 'step' : undefined}
                                            className="h-6 px-[3px] flex items-center"
                                        >
                                            <span
                                                className={`h-2 rounded-full transition-colors ${i + 1 === paso ? 'w-5 bg-simar-marea' : i + 1 < paso ? 'w-2 bg-simar-marea-tinta/50' : 'w-2 bg-simar-borde'}`}
                                            />
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ) : enBienvenida ? (
                            <LogoSimar variante="simbolo" tamano={celular ? 44 : 56} />
                        ) : (
                            <PalomitaAnimada tamano={celular ? 40 : 48} className="text-simar-arrecife-tinta" />
                        )}
                        <button
                            type="button"
                            onClick={cerrar}
                            aria-label="Salir del recorrido"
                            title="Salir del recorrido"
                            className="-mr-2 -mt-1 w-11 h-11 flex-shrink-0 rounded-2xl text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto flex items-center justify-center transition-colors"
                        >
                            <X className="w-6 h-6" />
                        </button>
                    </div>

                    {datos && Icono ? (
                        <div className="mt-3 flex items-center gap-3.5 movil:mt-2 movil:gap-3">
                            <span className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center movil:w-10 movil:h-10 ${TONO[datos.tono ?? 'marea']}`}>
                                <Icono className="w-6 h-6 movil:w-5 movil:h-5" />
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

                    <p id="recorrido-texto" className="mt-3 text-lg leading-relaxed text-simar-texto-2 movil:mt-2">
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

                    {/* Pruébalo tú: libera la pantalla para tocarla de verdad */}
                    {datos?.prueba && (
                        <div className="mt-4 flex items-center gap-3 rounded-2xl bg-simar-marea-suave px-4 py-3 movil:mt-3 movil:px-3 movil:py-2.5 movil:gap-2.5">
                            <Hand aria-hidden="true" className="w-6 h-6 flex-shrink-0 text-simar-marea-tinta movil:w-5 movil:h-5" />
                            <p className="flex-1 min-w-0 text-[15px] leading-snug text-simar-texto movil:text-[13px]">
                                <strong className="font-bold">Pruébalo tú.</strong> {datos.prueba}
                            </p>
                            <Button variant="secondary" size="sm" onClick={() => setProbando(true)} className="flex-shrink-0">
                                Probar
                            </Button>
                        </div>
                    )}

                    {/* En celular, en la bienvenida y el final, un botón debajo del otro (lado a lado se parten en dos renglones) */}
                    <div className={`mt-6 flex flex-wrap items-center gap-3 movil:mt-4 movil:gap-2 ${datos ? '' : 'movil:flex-col movil:items-stretch'}`}>
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
                        {datos && (
                            <>
                                <Button variant="secondary" onClick={anterior}>
                                    <ArrowLeft className="w-[22px] h-[22px]" />
                                    Atrás
                                </Button>
                                <Button ref={principalRef} onClick={siguiente} className="flex-1">
                                    {paso === total ? 'Terminar' : 'Siguiente'}
                                    <ArrowRight className="w-[22px] h-[22px]" />
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

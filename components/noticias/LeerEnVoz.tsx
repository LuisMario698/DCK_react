'use client';

import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';
import { createPortal } from 'react-dom';
import { ChevronUp, Headphones, LocateFixed, Pause, Play, Repeat1, SkipBack, SkipForward, StepBack, X } from 'lucide-react';
import { useGota, useRanuraIsla } from '@/components/isla/islaTienda';
import { movimientoQuieto } from './ajustesLectura';

/**
 * «Escuchar la nota»: la voz del propio navegador (speechSynthesis, sin servicios de fuera) lee lo
 * marcado con `data-leer` dentro de `#nota` (título, entrada, el dato y cada párrafo), en español
 * (de México si el aparato la tiene).
 *
 * Mientras lee, el reproductor **vive en la isla dinámica** (components/isla): una cápsula viva en
 * la barra (ondas que se mueven mientras habla, «3/6» y pausar) y, debajo, su gota con la frase
 * que dice como subtítulo (en letra de titular), una barra con un segmento por párrafo (tocar uno
 * salta ahí) y los controles: desde el inicio, anterior, pausar / seguir, siguiente, repetir, la
 * velocidad, guardar en la isla (sube la gota y queda la cápsula) y cerrar. Sin isla, la misma
 * tarjeta va abajo de la pantalla. El texto **se va siguiendo solo** (centra el párrafo en lo que
 * queda libre bajo la isla y su gota); si la persona baja o sube por su cuenta, deja de seguirlo y
 * aparece «Volver a donde va».
 * **Tocar un párrafo** lo lee desde ahí. El párrafo que se lee se marca (`n-leyendo`) y la frase,
 * más fuerte (CSS Custom Highlight API, `::highlight(n-frase)`; donde no existe, sólo el párrafo).
 *
 * Se dice frase por frase (algunos navegadores cortan las largas) y la pausa es «callar y recordar
 * la frase» (en Android, pause() de la voz no sirve): al seguir, repite la frase en que iba. Cada
 * frase lleva un turno: lo que avisa una frase vieja (por cancelar o saltar) se ignora.
 * Si el navegador no puede hablar, el botón no aparece.
 */

const nada = () => () => {};
const puedeHablar = () => 'speechSynthesis' in window;

const VELOCIDADES = [
    { valor: 0.8, nombre: 'Lenta' },
    { valor: 0.95, nombre: 'Normal' },
    { valor: 1.15, nombre: 'Rápida' },
] as const;

type Frase = { texto: string; inicio: number; fin: number };
type Parte = { el: HTMLElement; frases: Frase[] };

/** Las frases de un párrafo, con dónde empieza y termina cada una en su texto */
function frasesDe(el: HTMLElement): Frase[] {
    const texto = el.textContent ?? '';
    const frases: Frase[] = [];
    const patron = /[^.!?…]+[.!?…]*["»”)]*/g;
    let m: RegExpExecArray | null;
    while ((m = patron.exec(texto))) {
        const crudo = m[0];
        const antes = crudo.length - crudo.trimStart().length;
        const limpio = crudo.trim();
        if (limpio) frases.push({ texto: limpio, inicio: m.index + antes, fin: m.index + antes + limpio.length });
    }
    return frases.length ? frases : [{ texto: texto.trim(), inicio: 0, fin: texto.length }];
}

/** Un Range sobre el texto de `el` entre dos posiciones (recorre sus nodos de texto) */
function rangoDe(el: HTMLElement, inicio: number, fin: number): Range | null {
    const caminante = document.createTreeWalker(el, NodeFilter.SHOW_TEXT);
    const rango = document.createRange();
    let visto = 0;
    let empezado = false;
    for (let nodo = caminante.nextNode(); nodo; nodo = caminante.nextNode()) {
        const largo = nodo.textContent?.length ?? 0;
        if (!empezado && inicio <= visto + largo) {
            rango.setStart(nodo, Math.max(0, inicio - visto));
            empezado = true;
        }
        if (empezado && fin <= visto + largo) {
            rango.setEnd(nodo, Math.max(0, fin - visto));
            return rango;
        }
        visto += largo;
    }
    return null;
}

/** La frase que se dice, resaltada (CSS Custom Highlight API). Va aquí y no en globals.css porque el
 *  compilador de CSS del proyecto todavía no reconoce `::highlight()` y la descartaría */
const ESTILO_FRASE = '::highlight(n-frase){background-color:color-mix(in srgb,var(--simar-espuma) 70%,transparent);color:var(--simar-texto)}';

const resaltes = () => (typeof CSS !== 'undefined' && 'highlights' in CSS ? CSS.highlights : null);

/** Las ondas de la cápsula: se mueven mientras habla */
function Ondas({ activas }: { activas: boolean }) {
    return (
        <span aria-hidden="true" className="isla-ondas" data-activas={activas}>
            <span />
            <span />
            <span />
            <span />
        </span>
    );
}

interface Controles {
    estado: 'leyendo' | 'pausa';
    actual: number;
    total: number;
    avance: number;
    frase: string;
    velocidad: string;
    siguiendo: boolean;
    alInicio: () => void;
    alAnterior: () => void;
    alAlternar: () => void;
    alSiguiente: () => void;
    alRepetir: () => void;
    alIr: (i: number) => void;
    alVelocidad: () => void;
    alVolver: () => void;
    alCerrar: () => void;
    /** En la isla: guardar la gota (queda la cápsula) */
    alGuardar?: () => void;
}

/** El reproductor: la frase que dice, un segmento por párrafo y los controles */
function PanelLector(c: Controles) {
    const control =
        'w-12 h-12 rounded-full inline-flex items-center justify-center text-simar-texto-2 hover:text-simar-texto hover:bg-simar-texto/[0.06] active:scale-95 transition cursor-pointer focus-visible:outline-2 focus-visible:outline-simar-marea focus-visible:outline-offset-2 disabled:opacity-30 disabled:cursor-not-allowed';
    const chico =
        'h-10 min-w-10 px-2 rounded-full inline-flex items-center justify-center text-simar-texto-2 hover:text-simar-texto hover:bg-simar-texto/[0.06] cursor-pointer focus-visible:outline-2 focus-visible:outline-simar-marea';
    return (
        <div className="p-5 movil:p-4">
            <div className="isla-escalon flex items-center gap-2">
                <p className="flex-1 inline-flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-simar-texto-2">
                    <span aria-hidden="true" className={c.estado === 'leyendo' ? 'simar-en-vivo' : 'w-2 h-2 rounded-full bg-simar-texto-3'} />
                    {c.estado === 'leyendo' ? 'Escuchando la nota' : 'En pausa'}
                </p>
                <button type="button" onClick={c.alVelocidad} aria-label={`Velocidad: ${c.velocidad}. Cambiar`} className={`${chico} text-[14px] font-bold ring-1 ring-inset ring-simar-borde`}>
                    {c.velocidad}
                </button>
                {c.alGuardar && (
                    <button type="button" onClick={c.alGuardar} aria-label="Guardar el reproductor en la isla" title="Guardar en la isla" className={chico}>
                        <ChevronUp aria-hidden="true" className="w-5 h-5" />
                    </button>
                )}
                <button type="button" onClick={c.alCerrar} aria-label="Dejar de escuchar" title="Dejar de escuchar" className={chico}>
                    <X aria-hidden="true" className="w-5 h-5" />
                </button>
            </div>

            {/* La frase que se dice, como subtítulo */}
            <p aria-live="off" style={{ '--i': 1 } as CSSProperties} className="isla-escalon mt-3 min-h-[3.6em] font-titular text-[21px] leading-[1.25] text-simar-texto line-clamp-3 movil:text-[19px]">
                <span key={c.frase} className="isla-frase">
                    {c.frase}
                </span>
            </p>

            {/* Un segmento por párrafo: lo leído, lo que va (con su avance) y lo que falta */}
            <div style={{ '--i': 2 } as CSSProperties} className="isla-escalon mt-4 flex items-center gap-1" role="group" aria-label={`Párrafo ${c.actual} de ${c.total}`}>
                {Array.from({ length: c.total }, (_, i) => {
                    const n = i + 1;
                    const lleno = n < c.actual ? 1 : n === c.actual ? c.avance : 0;
                    return (
                        <button
                            key={i}
                            type="button"
                            onClick={() => c.alIr(i)}
                            aria-label={`Escuchar el párrafo ${n}`}
                            aria-current={n === c.actual ? 'step' : undefined}
                            className="group/seg flex-1 py-2 cursor-pointer focus-visible:outline-2 focus-visible:outline-simar-marea rounded-full"
                        >
                            <span className="block h-[5px] rounded-full bg-simar-borde overflow-hidden transition-[height] group-hover/seg:h-[8px]">
                                <span
                                    className={`block h-full rounded-full transition-[width] duration-500 ${n === c.actual ? 'bg-simar-marea' : 'bg-simar-texto'}`}
                                    style={{ width: `${lleno * 100}%` }}
                                />
                            </span>
                        </button>
                    );
                })}
            </div>
            <p className="mt-1 flex justify-between text-[13px] font-bold text-simar-texto-3 tabular-nums">
                <span>
                    Párrafo {c.actual} de {c.total}
                </span>
                {!c.siguiendo && (
                    <button type="button" onClick={c.alVolver} className="inline-flex items-center gap-1 font-extrabold text-simar-marea-tinta hover:underline cursor-pointer">
                        <LocateFixed aria-hidden="true" className="w-3.5 h-3.5" />
                        Volver a donde va
                    </button>
                )}
            </p>

            {/* Los controles */}
            <div style={{ '--i': 3 } as CSSProperties} className="isla-escalon mt-3 flex items-center justify-center gap-2 movil:gap-1">
                <button type="button" onClick={c.alInicio} aria-label="Desde el inicio" title="Desde el inicio" className={control}>
                    <SkipBack aria-hidden="true" className="w-5 h-5" />
                </button>
                <button type="button" onClick={c.alAnterior} disabled={c.actual <= 1} aria-label="Párrafo anterior" title="Párrafo anterior" className={control}>
                    <StepBack aria-hidden="true" className="w-5 h-5" />
                </button>
                <button
                    type="button"
                    onClick={c.alAlternar}
                    aria-label={c.estado === 'leyendo' ? 'Pausar' : 'Seguir'}
                    className="mx-2 w-[64px] h-[64px] flex-shrink-0 rounded-full bg-simar-texto text-simar-papel inline-flex items-center justify-center shadow-[0_12px_28px_-12px_rgba(11,34,54,0.7)] hover:scale-[1.04] isla-pulsa cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-marea focus-visible:outline-offset-2"
                >
                    {c.estado === 'leyendo' ? <Pause aria-hidden="true" className="w-7 h-7" fill="currentColor" /> : <Play aria-hidden="true" className="w-7 h-7 translate-x-0.5" fill="currentColor" />}
                </button>
                <button type="button" onClick={c.alSiguiente} disabled={c.actual >= c.total} aria-label="Párrafo siguiente" title="Párrafo siguiente" className={control}>
                    <SkipForward aria-hidden="true" className="w-5 h-5" />
                </button>
                <button type="button" onClick={c.alRepetir} aria-label="Repetir este párrafo" title="Repetir este párrafo" className={control}>
                    <Repeat1 aria-hidden="true" className="w-5 h-5" />
                </button>
            </div>
            <p className="mt-2 text-center text-[13px] text-simar-texto-3">Toca un párrafo de la nota para escucharlo desde ahí.</p>
        </div>
    );
}

export function LeerEnVoz() {
    const soportado = useSyncExternalStore(nada, puedeHablar, () => false);
    const [estado, setEstado] = useState<'quieto' | 'leyendo' | 'pausa'>('quieto');
    const [actual, setActual] = useState(0);
    const [total, setTotal] = useState(0);
    const [velocidad, setVelocidad] = useState(1);
    const [siguiendo, setSiguiendo] = useState(true);
    const [fraseTexto, setFraseTexto] = useState('');
    const [avance, setAvance] = useState(0);
    const cola = useRef<Parte[]>([]);
    const indice = useRef(0);
    const frase = useRef(0);
    const voz = useRef<SpeechSynthesisVoice | null>(null);
    const turno = useRef(0);
    const ritmo = useRef<number>(VELOCIDADES[1].valor);
    const sigue = useRef(true);
    const desplazandoYo = useRef(false);
    const gota = useGota('lector');
    const { ranura, ponerActividad } = useRanuraIsla();
    // Con isla, el reproductor vive ahí (su gota sólo existe abierta: el panel va cuando hay destino)
    const enIsla = gota.hayIsla;

    // La voz en español (las voces llegan tarde en algunos navegadores)
    useEffect(() => {
        if (!soportado) return;
        const elegir = () => {
            const voces = speechSynthesis.getVoices();
            voz.current =
                voces.find((v) => v.lang === 'es-MX') ?? voces.find((v) => v.lang === 'es-US') ?? voces.find((v) => v.lang.toLowerCase().startsWith('es')) ?? null;
        };
        elegir();
        speechSynthesis.addEventListener('voiceschanged', elegir);
        const turnoAlSalir = turno;
        const partes = cola;
        return () => {
            speechSynthesis.removeEventListener('voiceschanged', elegir);
            turnoAlSalir.current += 1;
            speechSynthesis.cancel();
            partes.current.forEach((p) => p.el.classList.remove('n-leyendo', 'n-leible'));
            resaltes()?.delete('n-frase');
            document.body.classList.remove('n-con-reproductor');
        };
    }, [soportado]);

    // La isla sabe que hay una actividad (en celular encoge el enlace de volver para que quepa la cápsula)
    useEffect(() => {
        ponerActividad(estado !== 'quieto');
        // ponerActividad cambia con el estado de la isla: sólo importa el del reproductor
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estado]);

    const marcar = (parte: Parte, f: Frase) => {
        cola.current.forEach((p) => p.el.classList.toggle('n-leyendo', p === parte));
        const registro = resaltes();
        if (registro && typeof Highlight !== 'undefined') {
            const r = rangoDe(parte.el, f.inicio, f.fin);
            if (r) registro.set('n-frase', new Highlight(r));
        }
    };

    /** Lo de arriba que tapa la nota: la isla y, si está abierta, la gota del reproductor (ya caída: su
     *  caja sin transformar, aunque todavía venga cayendo) */
    const bordeLibre = () => {
        const isla = document.querySelector<HTMLElement>('.isla');
        const abajoIsla = isla?.getBoundingClientRect().bottom ?? 0;
        const gotaEl = document.querySelector<HTMLElement>('[data-isla-gota="lector"][aria-hidden="false"]');
        const lugar = gotaEl?.parentElement;
        if (!isla || !lugar) return abajoIsla;
        return Math.max(abajoIsla, isla.getBoundingClientRect().top + lugar.offsetTop + lugar.offsetHeight);
    };

    /** Centra el párrafo en lo que queda libre bajo la isla (y su gota, si está abierta) */
    const centrar = (el: HTMLElement) => {
        if (!sigue.current) return;
        desplazandoYo.current = true;
        const arriba = Math.max(0, bordeLibre()) + 16;
        const r = el.getBoundingClientRect();
        const libre = window.innerHeight - arriba;
        const destino = window.scrollY + r.top - arriba - Math.max(0, (libre - r.height) / 2);
        window.scrollTo({ top: destino, behavior: movimientoQuieto() ? 'auto' : 'smooth' });
        window.setTimeout(() => (desplazandoYo.current = false), 900);
    };

    const terminar = () => {
        turno.current += 1;
        speechSynthesis.cancel();
        cola.current.forEach((p) => {
            p.el.classList.remove('n-leyendo', 'n-leible');
            p.el.removeAttribute('title');
        });
        resaltes()?.delete('n-frase');
        document.body.classList.remove('n-con-reproductor');
        gota.cerrar();
        setEstado('quieto');
        setActual(0);
        setFraseTexto('');
    };

    /** Dice la frase en que va y, al acabar, la siguiente */
    const decir = () => {
        const mio = ++turno.current;
        const parte = cola.current[indice.current];
        if (!parte) {
            terminar();
            return;
        }
        const f = parte.frases[frase.current];
        if (frase.current === 0) centrar(parte.el);
        setActual(indice.current + 1);
        setFraseTexto(f.texto);
        setAvance(frase.current / parte.frases.length);
        marcar(parte, f);
        const dicho = new SpeechSynthesisUtterance(f.texto);
        dicho.lang = voz.current?.lang ?? 'es-MX';
        if (voz.current) dicho.voice = voz.current;
        dicho.rate = ritmo.current;
        dicho.onend = () => {
            if (mio !== turno.current) return;
            frase.current += 1;
            if (frase.current >= parte.frases.length) {
                frase.current = 0;
                indice.current += 1;
            }
            if (indice.current >= cola.current.length) {
                terminar();
                return;
            }
            decir();
        };
        dicho.onerror = (e) => {
            if (mio !== turno.current || e.error === 'interrupted' || e.error === 'canceled') return;
            terminar();
        };
        speechSynthesis.speak(dicho);
    };

    /** Calla lo que se está diciendo y empieza en el párrafo `i` (Chrome necesita un respiro tras cancelar) */
    const irA = (i: number) => {
        indice.current = Math.min(Math.max(0, i), cola.current.length - 1);
        frase.current = 0;
        turno.current += 1;
        speechSynthesis.cancel();
        sigue.current = true;
        setSiguiendo(true);
        setEstado('leyendo');
        window.setTimeout(decir, 60);
    };

    const pausar = () => {
        turno.current += 1;
        speechSynthesis.cancel();
        setEstado('pausa');
    };

    const seguir = () => {
        setEstado('leyendo');
        window.setTimeout(decir, 60);
    };

    /**
     * Empieza a leer. Con isla, la cápsula entra a la isla con la gotita que sale del botón
     * («Escuchar» → la isla) y de ahí cae el reproductor; la voz empieza ya con él abierto (así el
     * párrafo se centra bajo él y no queda tapado).
     */
    const empezar = (desde = 0, origen?: HTMLElement | null) => {
        const elementos = [...document.querySelectorAll<HTMLElement>('#nota [data-leer]')];
        cola.current = elementos.map((el) => ({ el, frases: frasesDe(el) }));
        cola.current.forEach((p) => {
            p.el.classList.add('n-leible');
            p.el.title = 'Escuchar desde aquí';
        });
        setTotal(cola.current.length);
        if (!gota.hayIsla) {
            document.body.classList.add('n-con-reproductor');
            irA(desde);
            return;
        }
        setActual(desde + 1);
        setEstado('leyendo');
        const mio = ++turno.current;
        void gota.abrirDesde(origen, { aparece: true }).then(() => {
            // Si mientras viajaba lo cerraron o eligieron otro párrafo, no se empieza otra vez
            if (turno.current === mio) window.setTimeout(() => turno.current === mio && irA(desde), 90);
        });
    };

    const cambiarVelocidad = () => {
        const siguiente = (velocidad + 1) % VELOCIDADES.length;
        setVelocidad(siguiente);
        ritmo.current = VELOCIDADES[siguiente].valor;
        // Se nota en la frase que va: la vuelve a decir con el ritmo nuevo
        if (estado === 'leyendo') {
            turno.current += 1;
            speechSynthesis.cancel();
            window.setTimeout(decir, 60);
        }
    };

    // Mientras está abierto: tocar un párrafo lo lee desde ahí; bajar o subir a mano deja de seguir el texto
    useEffect(() => {
        if (estado === 'quieto') return;
        const nota = document.getElementById('nota');
        const alTocar = (e: MouseEvent) => {
            const el = (e.target as HTMLElement).closest<HTMLElement>('[data-leer]');
            if (!el || (e.target as HTMLElement).closest('a, button')) return;
            if (window.getSelection()?.toString()) return; // estaba seleccionando texto
            const i = cola.current.findIndex((p) => p.el === el);
            if (i >= 0) irA(i);
        };
        const aMano = () => {
            if (desplazandoYo.current || !sigue.current) return;
            sigue.current = false;
            setSiguiendo(false);
        };
        const alTeclear = (e: KeyboardEvent) => {
            if (['ArrowDown', 'ArrowUp', 'PageDown', 'PageUp', 'Home', 'End', ' '].includes(e.key)) aMano();
        };
        nota?.addEventListener('click', alTocar);
        window.addEventListener('wheel', aMano, { passive: true });
        window.addEventListener('touchmove', aMano, { passive: true });
        window.addEventListener('keydown', alTeclear);
        return () => {
            nota?.removeEventListener('click', alTocar);
            window.removeEventListener('wheel', aMano);
            window.removeEventListener('touchmove', aMano);
            window.removeEventListener('keydown', alTeclear);
        };
        // irA usa refs: no hace falta volver a armar los oyentes en cada render
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [estado]);

    if (!soportado) return null;

    const boton =
        'min-h-[48px] rounded-full inline-flex items-center gap-2 text-[17px] font-bold transition-colors cursor-pointer focus-visible:outline-2 focus-visible:outline-simar-marea focus-visible:outline-offset-2 movil:min-h-[44px] movil:text-[15px]';
    const alternar = estado === 'leyendo' ? pausar : seguir;
    const controles: Controles | null =
        estado === 'quieto'
            ? null
            : {
                  estado,
                  actual,
                  total,
                  avance,
                  frase: fraseTexto,
                  velocidad: VELOCIDADES[velocidad].nombre,
                  siguiendo,
                  alInicio: () => irA(0),
                  alAnterior: () => irA(indice.current - 1),
                  alAlternar: alternar,
                  alSiguiente: () => irA(indice.current + 1),
                  alRepetir: () => irA(indice.current),
                  alIr: irA,
                  alVelocidad: cambiarVelocidad,
                  alVolver: () => {
                      sigue.current = true;
                      setSiguiendo(true);
                      const parte = cola.current[indice.current];
                      if (parte) centrar(parte.el);
                  },
                  alCerrar: terminar,
                  alGuardar: enIsla ? gota.cerrar : undefined,
              };

    return (
        <>
            <style>{ESTILO_FRASE}</style>
            {estado === 'quieto' ? (
                <button type="button" onClick={(e) => empezar(0, e.currentTarget)} data-vidrio="" className={`simar-presiona ${boton} px-5 bg-simar-texto text-simar-papel hover:opacity-90 movil:px-4`}>
                    <Headphones aria-hidden="true" className="w-[18px] h-[18px]" />
                    Escuchar
                </button>
            ) : (
                <button
                    type="button"
                    onClick={(e) => (enIsla ? gota.alternarDesde(e.currentTarget) : alternar())}
                    aria-expanded={enIsla ? gota.abierta : undefined}
                    data-isla-abre="lector"
                    className={`simar-presiona ${boton} px-5 bg-simar-marea-suave text-simar-marea-tinta ring-2 ring-inset ring-simar-marea/40 movil:px-4`}
                >
                    <Ondas activas={estado === 'leyendo'} />
                    {estado === 'leyendo' ? 'Escuchando' : 'En pausa'}
                </button>
            )}

            {/* En la isla: la cápsula viva en la barra y el panel en su gota */}
            {controles && enIsla && ranura &&
                createPortal(
                    <span ref={gota.ancla} className="isla-capsula inline-flex items-center gap-1 h-[44px] rounded-full bg-simar-texto text-simar-papel pl-1 pr-1 movil:h-[40px]">
                        <button
                            type="button"
                            onClick={gota.alternar}
                            aria-expanded={gota.abierta}
                            aria-label={gota.abierta ? 'Guardar los controles de la lectura' : 'Ver los controles de la lectura'}
                            className="h-full pl-3 pr-2 rounded-full inline-flex items-center gap-2 cursor-pointer hover:bg-white/10 dark:hover:bg-black/10 focus-visible:outline-2 focus-visible:outline-simar-marea"
                        >
                            <Ondas activas={estado === 'leyendo'} />
                            <span className="text-[14px] font-extrabold tabular-nums max-md:hidden">
                                {actual}/{total}
                            </span>
                        </button>
                        <button
                            type="button"
                            onClick={alternar}
                            aria-label={estado === 'leyendo' ? 'Pausar' : 'Seguir'}
                            className="w-9 h-9 rounded-full inline-flex items-center justify-center bg-white/15 dark:bg-black/10 hover:bg-white/25 dark:hover:bg-black/20 cursor-pointer focus-visible:outline-2 focus-visible:outline-simar-marea movil:w-8 movil:h-8"
                        >
                            {estado === 'leyendo' ? <Pause aria-hidden="true" className="w-4 h-4" fill="currentColor" /> : <Play aria-hidden="true" className="w-4 h-4 translate-x-px" fill="currentColor" />}
                        </button>
                    </span>,
                    ranura,
                )}
            {controles && enIsla && gota.destino && createPortal(<PanelLector {...controles} />, gota.destino)}

            {/* Sin isla: la misma tarjeta, abajo de la pantalla */}
            {controles &&
                !enIsla &&
                createPortal(
                    <div className="n-reproductor fixed inset-x-0 bottom-0 z-[55] flex justify-center px-3 pb-[max(12px,env(safe-area-inset-bottom))] pointer-events-none font-sans antialiased">
                        <div role="region" aria-label="Lectura en voz alta" className="simar-vidrio-fuerte pointer-events-auto w-full max-w-[520px] rounded-[28px] text-simar-texto">
                            <PanelLector {...controles} />
                        </div>
                    </div>,
                    document.body,
                )}
        </>
    );
}

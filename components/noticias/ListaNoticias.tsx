'use client';

import { useEffect, useId, useMemo, useRef, useState, type CSSProperties, type KeyboardEvent, type ReactNode } from 'react';
import { flushSync } from 'react-dom';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, LayoutGrid, Rows3, Search, SearchX, X } from 'lucide-react';
import type { CategoriaNoticia } from '@/lib/constants/noticias';
import { MarcaNueva } from '@/components/landing/MarcaNueva';
import { PUNTO_TEMA, TarjetaEditorial, TemaVersalitas, type DatosEditorial } from './TarjetaEditorial';
import { DibujoPortada } from './ilustraciones';
import { useIndicador } from './useIndicador';

/**
 * El archivo: todas las noticias y artículos, de la más nueva a la más vieja.
 *
 *  - Una barra que se queda pegada mientras se baja por la lista: el buscador (sin acentos ni
 *    mayúsculas; resalta lo encontrado y dice cuántas hay), las pestañas por tema (control
 *    segmentado: la píldora se desliza con un resorte) y la vista: cuadrícula o lista por mes.
 *  - Al cambiar de tema, de vista o al mostrar más, las notas se reacomodan con View Transitions
 *    (el navegador las desliza a su lugar; las que entran suben y las que salen se encogen). Donde no
 *    hay View Transitions, o con «reducir movimiento», el cambio es inmediato.
 *  - Primero 6; «Mostrar más» con su avance. Sin resultados, sugerencias para buscar.
 *  - El tema y la búsqueda viven en la dirección (?tema=…&q=…), así un enlace abre el archivo ya
 *    filtrado (la landing lo usa) y se puede compartir.
 * Las notas llegan resueltas del servidor (datosEditorial), sin el texto de los artículos.
 */

/** Sin acentos ni mayúsculas, para buscar «vaquita» o «tratado» como sea que se escriba */
const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PRIMERAS = 6;
const SUGERENCIAS = ['vaquita', 'aceite', 'MARPOL', 'redes', 'basura'];

/** El texto con las palabras encontradas en <mark> (sin importar acentos ni mayúsculas) */
function resaltar(texto: string, palabras: string[]): ReactNode {
    if (!palabras.length) return texto;
    // Cada letra de la versión sin acentos corresponde a una del texto original
    const plano = [...texto].map((c) => normal(c)).join('');
    const marcas = new Array(texto.length).fill(false);
    for (const p of palabras) {
        let i = plano.indexOf(p);
        while (i >= 0) {
            for (let k = i; k < i + p.length; k++) marcas[k] = true;
            i = plano.indexOf(p, i + p.length);
        }
    }
    const partes: ReactNode[] = [];
    let desde = 0;
    for (let i = 1; i <= texto.length; i++) {
        if (i === texto.length || marcas[i] !== marcas[desde]) {
            const trozo = texto.slice(desde, i);
            partes.push(marcas[desde] ? <mark key={desde} className="n-encontrada">{trozo}</mark> : trozo);
            desde = i;
        }
    }
    return partes;
}

/** «Noviembre de 2026» para agrupar la lista */
const mesDe = (fecha: string) => {
    const [a, m] = fecha.split('-').map(Number);
    const texto = new Date(Date.UTC(a, m - 1, 15)).toLocaleDateString('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
    return texto.charAt(0).toUpperCase() + texto.slice(1);
};

/** Cambia el estado y, si se puede, que el navegador anime el reacomodo (View Transitions) */
function conTransicion(cambio: () => void) {
    const doc = document as Document & { startViewTransition?: (fn: () => void) => { ready: Promise<void>; finished: Promise<void> } };
    const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.nMovimiento === 'quieto';
    if (!doc.startViewTransition || quieto || doc.visibilityState !== 'visible') {
        cambio();
        return;
    }
    const transicion = doc.startViewTransition(() => flushSync(cambio));
    // Si el navegador la salta (otra transición, la pestaña se oculta), el cambio ya quedó hecho
    transicion.ready.catch(() => {});
    transicion.finished.catch(() => {});
}

/** El nombre de cada nota para View Transitions (sólo letras, números y guiones) */
const nombreVT = (slug: string): CSSProperties =>
    ({ viewTransitionName: `n-${slug.replace(/[^a-z0-9-]/gi, '')}`, viewTransitionClass: 'n-nota' }) as CSSProperties;

type Vista = 'cuadricula' | 'lista';

/** Cuadrícula o lista por mes: control segmentado con su píldora que se desliza (en celular, sólo íconos) */
function SelectorVista({ vista, alCambiar, className = '' }: { vista: Vista; alCambiar: (v: Vista) => void; className?: string }) {
    const caja = useIndicador<HTMLDivElement>(vista);
    return (
        <div
            ref={caja}
            role="radiogroup"
            aria-label="Cómo ver las noticias"
            className={`n-sin-medir relative flex-shrink-0 p-1 rounded-full bg-simar-superficie ring-1 ring-inset ring-simar-borde ${className}`}
            style={{ '--n-y': '4px' } as CSSProperties}
        >
            <span aria-hidden="true" className="n-indicador bg-simar-texto" />
            {(
                [
                    ['cuadricula', 'Cuadrícula', LayoutGrid],
                    ['lista', 'Lista', Rows3],
                ] as const
            ).map(([valor, nombre, Icono]) => {
                const elegida = vista === valor;
                return (
                    <button
                        key={valor}
                        type="button"
                        role="radio"
                        aria-checked={elegida}
                        data-activo={elegida}
                        onClick={() => alCambiar(valor)}
                        className={`relative min-h-[46px] px-4 movil:px-3 rounded-full inline-flex items-center gap-2 text-[16px] font-bold transition-colors duration-300 cursor-pointer active:scale-[0.96] ${
                            elegida ? 'text-simar-papel' : 'text-simar-texto-2 hover:text-simar-texto'
                        }`}
                    >
                        <Icono aria-hidden="true" className="w-[18px] h-[18px]" />
                        <span className="movil:sr-only">{nombre}</span>
                    </button>
                );
            })}
        </div>
    );
}

function Fila({ nota, locale, palabras }: { nota: DatosEditorial; locale: string; palabras: string[] }) {
    const [a, m, d] = nota.fecha.split('-').map(Number);
    const fecha = new Date(Date.UTC(a, m - 1, d));
    const mesCorto = fecha.toLocaleDateString('es-MX', { month: 'short', timeZone: 'UTC' }).replace('.', '');
    // El día grande y el mes chico; si sólo se sabe el mes, el mes grande y el año chico
    const [grande, chico] = nota.soloMes ? [mesCorto, String(a)] : [String(d), mesCorto];
    return (
        <Link
            href={`/${locale}/noticias/${nota.slug}`}
            className="group grid grid-cols-[64px_minmax(0,1fr)_auto] items-center gap-5 rounded-[22px] px-4 py-4 transition-colors hover:bg-simar-superficie focus-visible:outline-3 focus-visible:outline-simar-golfo movil:grid-cols-[minmax(0,1fr)_auto] movil:gap-3 movil:px-2"
        >
            <span aria-hidden="true" className="text-center movil:hidden">
                <span className="block text-[34px] font-extrabold leading-none tracking-[-0.03em] tabular-nums first-letter:uppercase">{grande}</span>
                <span className="block mt-1 text-[13px] font-extrabold uppercase tracking-[0.1em] text-simar-texto-2">{chico}</span>
            </span>
            <span className="min-w-0">
                <span className="flex flex-wrap items-center gap-x-3 gap-y-1">
                    <MarcaNueva fecha={nota.fecha} />
                    <TemaVersalitas categoria={nota.categoria} />
                    <span className="text-[14px] font-semibold text-simar-texto-2">{nota.minutos} min</span>
                </span>
                <span className="mt-1.5 block font-titular text-[24px] font-semibold leading-[1.15] tracking-[-0.01em] text-simar-texto movil:text-[19px]">
                    <span className="n-subraya">{resaltar(nota.titulo, palabras)}</span>
                </span>
                <span className="mt-1 text-[17px] leading-relaxed text-simar-texto-2 line-clamp-2 text-pretty movil:hidden">{resaltar(nota.resumen, palabras)}</span>
            </span>
            <span className="relative w-[148px] h-[96px] overflow-hidden rounded-[16px] bg-simar-abismo movil:w-[92px] movil:h-[72px] movil:rounded-[14px]">
                <span aria-hidden="true" className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.06]">
                    {nota.imagen ? (
                        <Image src={nota.imagen.src} alt="" fill sizes="148px" className="object-cover" style={{ objectPosition: nota.imagen.posicion ?? '50% 50%' }} />
                    ) : (
                        <DibujoPortada tipo={nota.ilustracion} />
                    )}
                </span>
                <span className="absolute right-2 bottom-2 w-8 h-8 rounded-full bg-simar-superficie text-simar-marea-tinta flex items-center justify-center opacity-0 -translate-x-1 transition-[opacity,transform] duration-300 group-hover:opacity-100 group-hover:translate-x-0 movil:hidden">
                    <ArrowRight aria-hidden="true" className="w-4 h-4" strokeWidth={2.4} />
                </span>
            </span>
        </Link>
    );
}

export function ListaNoticias({
    notas,
    temas,
    locale,
    temaInicial = null,
    busquedaInicial = '',
}: {
    notas: DatosEditorial[];
    temas: CategoriaNoticia[];
    locale: string;
    temaInicial?: CategoriaNoticia | null;
    busquedaInicial?: string;
}) {
    const [tema, setTema] = useState<CategoriaNoticia | null>(temaInicial);
    const [busqueda, setBusqueda] = useState(busquedaInicial);
    const [vista, setVista] = useState<Vista>('cuadricula');
    const cambiarVista = (v: Vista) => conTransicion(() => setVista(v));
    const [cuantas, setCuantas] = useState(PRIMERAS);
    const campo = useRef<HTMLInputElement>(null);
    const botones = useRef<(HTMLButtonElement | null)[]>([]);
    const id = useId();
    const pestanas = useIndicador<HTMLDivElement>(tema);

    const palabras = useMemo(() => normal(busqueda).split(/\s+/).filter(Boolean), [busqueda]);
    // Primero la búsqueda (los números de cada tema la siguen) y luego el tema
    const encontradas = palabras.length
        ? notas.filter((n) => {
              const texto = normal(`${n.titulo} ${n.resumen} ${n.categoria}`);
              return palabras.every((p) => texto.includes(p));
          })
        : notas;
    const filtradas = tema ? encontradas.filter((n) => n.categoria === tema) : encontradas;
    const visibles = filtradas.slice(0, cuantas);
    const faltan = filtradas.length - visibles.length;

    const opciones: { valor: CategoriaNoticia | null; nombre: string; cuantas: number }[] = [
        { valor: null, nombre: 'Todas', cuantas: encontradas.length },
        ...temas.map((t) => ({ valor: t, nombre: t, cuantas: encontradas.filter((n) => n.categoria === t).length })),
    ];
    const activa = Math.max(0, opciones.findIndex((o) => o.valor === tema));

    // El tema y la búsqueda, en la dirección (sin navegar ni dejar historial)
    const guardarEnDireccion = (t: CategoriaNoticia | null, q: string) => {
        const url = new URL(window.location.href);
        if (t) url.searchParams.set('tema', t);
        else url.searchParams.delete('tema');
        if (q.trim()) url.searchParams.set('q', q.trim());
        else url.searchParams.delete('q');
        window.history.replaceState(null, '', url);
    };

    const elegirTema = (i: number, enfocar = false) => {
        const valor = opciones[i].valor;
        conTransicion(() => {
            setTema(valor);
            setCuantas(PRIMERAS);
        });
        guardarEnDireccion(valor, busqueda);
        const boton = botones.current[i];
        if (enfocar) boton?.focus();
        centrarPestana(i, true);
    };
    // La pestaña elegida, a la vista dentro de su fila (sin mover la página)
    const centrarPestana = (i: number, suave: boolean) => {
        const boton = botones.current[i];
        const fila = boton?.parentElement?.parentElement;
        if (!boton || !fila || fila.scrollWidth <= fila.clientWidth) return;
        fila.scrollTo({ left: boton.offsetLeft - fila.clientWidth / 2 + boton.offsetWidth / 2, behavior: suave ? 'smooth' : 'auto' });
    };
    // Si el archivo abre con un tema (?tema=…), su pestaña se ve desde el principio
    useEffect(() => {
        if (!temaInicial) return;
        const centrar = () => centrarPestana(Math.max(0, opciones.findIndex((o) => o.valor === temaInicial)), false);
        centrar();
        // Otra vez cuando termina de cargar la letra (cambia el ancho de las pestañas)
        document.fonts?.ready.then(centrar);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const alTeclear = (e: KeyboardEvent<HTMLButtonElement>, i: number) => {
        const n = opciones.length;
        const destino = { ArrowRight: (i + 1) % n, ArrowLeft: (i - 1 + n) % n, Home: 0, End: n - 1 }[e.key];
        if (destino === undefined) return;
        e.preventDefault();
        elegirTema(destino, true);
    };
    const buscar = (q: string) => {
        setBusqueda(q);
        setCuantas(PRIMERAS);
        guardarEnDireccion(tema, q);
    };
    const limpiar = () => {
        conTransicion(() => {
            setBusqueda('');
            setTema(null);
            setCuantas(PRIMERAS);
        });
        guardarEnDireccion(null, '');
        campo.current?.focus();
    };

    // La lista, agrupada por mes
    const porMes: { mes: string; notas: DatosEditorial[] }[] = [];
    for (const n of visibles) {
        const mes = mesDe(n.fecha);
        const ultimo = porMes[porMes.length - 1];
        if (ultimo?.mes === mes) ultimo.notas.push(n);
        else porMes.push({ mes, notas: [n] });
    }

    const panel = `${id}-panel`;

    return (
        <>
            {/* Arriba, cuántas hay (se anuncia al cambiar) y el buscador */}
            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 movil:mt-6">
                <p aria-live="polite" className="text-[17px] font-bold text-simar-texto-2 movil:order-2 movil:flex-1">
                    <span className="tabular-nums text-simar-texto">{filtradas.length === 1 ? '1 nota' : `${filtradas.length} notas`}</span>
                    {busqueda.trim() ? ` con «${busqueda.trim()}»` : ''}
                    {tema ? ` de ${tema}` : ''}
                    {!busqueda.trim() && !tema ? ', de la más nueva a la más vieja' : ''}
                </p>
                <label className="relative w-full max-w-[440px] movil:max-w-none">
                    <span className="sr-only">Buscar en las noticias</span>
                    <Search aria-hidden="true" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-simar-texto-2 pointer-events-none" />
                    <input
                        ref={campo}
                        type="search"
                        value={busqueda}
                        onChange={(e) => buscar(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Escape' && busqueda) {
                                e.preventDefault();
                                buscar('');
                            }
                        }}
                        placeholder="Busca: vaquita, aceite, MARPOL…"
                        className="w-full min-h-[54px] pl-13 pr-14 rounded-full bg-simar-superficie ring-1 ring-inset ring-simar-borde text-[17px] text-simar-texto placeholder:text-simar-texto-3 shadow-[0_10px_30px_-24px_rgba(11,34,54,0.6)] transition-shadow focus:outline-none focus:ring-2 focus:ring-simar-marea [&::-webkit-search-cancel-button]:hidden movil:min-h-[52px]"
                    />
                    {busqueda && (
                        <button
                            type="button"
                            onClick={() => {
                                buscar('');
                                campo.current?.focus();
                            }}
                            aria-label="Borrar la búsqueda"
                            className="absolute right-2 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full inline-flex items-center justify-center text-simar-texto-2 hover:bg-simar-texto/5 active:scale-95 transition-transform cursor-pointer"
                        >
                            <X aria-hidden="true" className="w-5 h-5" />
                        </button>
                    )}
                </label>
                <SelectorVista vista={vista} alCambiar={cambiarVista} className="hidden movil:order-3 movil:inline-flex" />
            </div>

            {/* Los temas y la vista: se quedan pegados abajo de la barra de arriba mientras se baja */}
            <div className="sticky top-[calc(151px/var(--n-zoom,1))] md:top-[calc(167px/var(--n-zoom,1))] z-20 mt-4 flex items-center gap-3 rounded-full simar-vidrio-fuerte p-1.5 movil:static movil:mt-4">
                {/* Los temas: control segmentado; si no caben, se deslizan de lado */}
                <div className="flex-1 min-w-0 overflow-x-auto [scrollbar-width:none] max-lg:[mask-image:linear-gradient(90deg,black_calc(100%-28px),transparent)]">
                    <div
                        ref={pestanas}
                        role="tablist"
                        aria-label="Temas"
                        className="n-sin-medir relative inline-flex gap-1"
                        style={{ '--n-y': '0px' } as CSSProperties}
                    >
                        <span aria-hidden="true" className="n-indicador bg-simar-texto shadow-[0_8px_18px_-10px_rgba(11,34,54,0.8)]" />
                        {opciones.map((o, i) => {
                            const elegida = i === activa;
                            return (
                                <button
                                    key={o.nombre}
                                    ref={(b) => {
                                        botones.current[i] = b;
                                    }}
                                    id={`${id}-tema-${i}`}
                                    type="button"
                                    role="tab"
                                    aria-selected={elegida}
                                    aria-controls={panel}
                                    tabIndex={elegida ? 0 : -1}
                                    data-activo={elegida}
                                    onClick={() => elegirTema(i)}
                                    onKeyDown={(e) => alTeclear(e, i)}
                                    className={`relative flex-shrink-0 min-h-[46px] px-[18px] rounded-full inline-flex items-center gap-2 text-[16px] font-bold whitespace-nowrap cursor-pointer transition-[color,background-color] duration-300 active:scale-[0.96] focus-visible:outline-2 focus-visible:outline-simar-marea focus-visible:outline-offset-2 ${
                                        elegida ? 'text-simar-papel' : 'text-simar-texto-2 hover:text-simar-texto hover:bg-simar-texto/[0.05]'
                                    }`}
                                >
                                    {o.valor && <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PUNTO_TEMA[o.valor]}`} />}
                                    {o.nombre}
                                    <span className={`text-[13px] font-extrabold tabular-nums transition-opacity ${elegida ? 'opacity-60' : o.cuantas ? 'text-simar-texto-3' : 'text-simar-texto-3 opacity-50'}`}>{o.cuantas}</span>
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* La vista (en celular va junto al conteo) */}
                <SelectorVista vista={vista} alCambiar={cambiarVista} className="inline-flex movil:hidden" />
            </div>

            <div id={panel} role="tabpanel" aria-labelledby={`${id}-tema-${activa}`} className="mt-8 movil:mt-6">
                {filtradas.length === 0 ? (
                    <div className="n-entra rounded-[32px] bg-simar-superficie ring-1 ring-simar-borde px-6 py-14 text-center movil:py-10">
                        <span className="mx-auto w-16 h-16 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center">
                            <SearchX aria-hidden="true" className="w-8 h-8" />
                        </span>
                        <p className="mt-5 text-[22px] font-extrabold tracking-[-0.01em] movil:text-[19px]">
                            Nada con «{busqueda.trim()}»{tema ? ` en ${tema}` : ''}.
                        </p>
                        <p className="mt-2 text-[17px] text-simar-texto-2">Prueba con otra palabra:</p>
                        <ul className="mt-5 flex flex-wrap justify-center gap-2">
                            {SUGERENCIAS.map((s) => (
                                <li key={s}>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setTema(null);
                                            buscar(s);
                                        }}
                                        className="min-h-[46px] px-5 rounded-full bg-simar-papel ring-1 ring-inset ring-simar-borde text-[16px] font-bold hover:ring-simar-campo-borde active:scale-[0.96] transition-transform cursor-pointer"
                                    >
                                        {s}
                                    </button>
                                </li>
                            ))}
                        </ul>
                        <button type="button" onClick={limpiar} className="mt-6 min-h-[48px] px-5 text-[17px] font-extrabold text-simar-marea-tinta hover:underline cursor-pointer">
                            Ver todas las noticias
                        </button>
                    </div>
                ) : vista === 'cuadricula' ? (
                    <ul className="grid grid-cols-2 lg:grid-cols-3 gap-5 movil:gap-3">
                        {visibles.map((n, i) => (
                            <li key={n.slug} className="flex" style={nombreVT(n.slug)}>
                                <TarjetaEditorial
                                    nota={n}
                                    locale={locale}
                                    prioridad={i < 3}
                                    insignia={<MarcaNueva fecha={n.fecha} />}
                                    titulo={palabras.length ? resaltar(n.titulo, palabras) : undefined}
                                />
                            </li>
                        ))}
                    </ul>
                ) : (
                    <div className="space-y-8">
                        {porMes.map(({ mes, notas: delMes }) => (
                            <section key={mes} aria-label={mes}>
                                <h3 className="flex items-center gap-4 text-[15px] font-extrabold uppercase tracking-[0.14em] text-simar-texto-2">
                                    {mes}
                                    <span aria-hidden="true" className="flex-1 h-px bg-simar-borde" />
                                    <span className="tabular-nums">{delMes.length}</span>
                                </h3>
                                <ul className="mt-2 divide-y divide-simar-borde-suave">
                                    {delMes.map((n) => (
                                        <li key={n.slug} style={nombreVT(n.slug)}>
                                            <Fila nota={n} locale={locale} palabras={palabras} />
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        ))}
                    </div>
                )}

                {filtradas.length > 0 && (
                    <div className="mt-10 flex flex-col items-center gap-4 movil:mt-8">
                        <div className="w-full max-w-[320px]">
                            <p className="text-center text-[15px] font-bold text-simar-texto-2 tabular-nums">
                                Ves {visibles.length} de {filtradas.length}
                            </p>
                            <span aria-hidden="true" className="mt-2 block h-1 rounded-full bg-simar-borde overflow-hidden">
                                <span
                                    className="block h-full rounded-full bg-simar-marea transition-[width] duration-700"
                                    style={{ width: `${(visibles.length / filtradas.length) * 100}%`, transitionTimingFunction: 'var(--n-resorte)' }}
                                />
                            </span>
                        </div>
                        {faltan > 0 && (
                            <button
                                type="button"
                                onClick={() => conTransicion(() => setCuantas((c) => c + PRIMERAS))}
                                className="simar-presiona min-h-[56px] px-7 rounded-full bg-simar-texto text-simar-papel text-[17px] font-extrabold inline-flex items-center gap-2 hover:opacity-90 transition-opacity cursor-pointer movil:w-full movil:justify-center movil:min-h-[52px]"
                            >
                                Mostrar {Math.min(PRIMERAS, faltan)} más
                            </button>
                        )}
                    </div>
                )}
            </div>
        </>
    );
}


'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import dynamic from 'next/dynamic';
import Image from 'next/image';
import { Globe2, Landmark, Map as IconoMapa } from 'lucide-react';
import { textoCredito, type CreditoFoto } from '@/lib/constants/fotos';
import { sinMovimiento } from './movimiento';

/** El mapa real (MapLibre, ~250 KB): sólo baja cuando la sección se acerca */
const MapaInteractivo = dynamic(() => import('./MapaInteractivo'), { ssr: false, loading: () => null });

export interface CapituloMapa {
    id: string;
    nombre: string;
    detalle: string;
    /** [lon, lat] de su marca en el mapa real; sin centro (México, el mundo) el mapa se aleja */
    centro?: [number, number];
    /** En % del mapa dibujado (el de respaldo); sin posición, el dibujado se aparta y sale `capa` */
    pos?: { x: number; y: number };
    /** Cuánto se acerca el mapa dibujado (1 = el golfo entero) */
    zoom?: number;
    cuantas: number;
    /** La foto del lugar, arriba de su tarjeta (sin crédito, es de SiMAR) */
    foto?: { src: string; alt: string; posicion?: string; credito?: CreditoFoto };
    /** Las noticias del lugar (de servidor: así las tarjetas y sus fotos no bajan al navegador) */
    noticias: ReactNode;
    /** El dibujo que tapa el mapa dibujado en los lugares sin posición */
    capa?: ReactNode;
}

const ICONO_FUERA: Record<string, typeof Globe2> = { mundo: Globe2, mexico: Landmark };
const cuantasTexto = (n: number) => (n === 1 ? '1 noticia' : `${n} noticias`);
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * «En el mapa», contado con el scroll: un **mapa real** (MapaInteractivo: MapLibre + OpenFreeMap, en
 * español, claro u oscuro) se queda fijo (a un lado en computadora, arriba en celular) y, al bajar,
 * cada capítulo lo hace volar a su lugar y enciende su marca; México y el mundo lo alejan. Las
 * marcas llevan el número de noticias y, al tocarlas, la página baja a su capítulo. Se puede mover y
 * acercar (Ctrl + rueda, dos dedos o los botones). La zona de la vaquita va marcada (aproximada).
 * Cada capítulo es una tarjeta con la foto del lugar, su nombre, de qué trata y sus noticias.
 * Mientras llega el mapa real (o si el aparato no puede mostrarlo), se ve el dibujado (MapaGolfo,
 * de servidor), que también se acerca a cada lugar.
 */
export function MapaHistoria({ mapa, capitulos }: { mapa: ReactNode; capitulos: CapituloMapa[] }) {
    const [activo, setActivo] = useState(0);
    const [cargar, setCargar] = useState(false);
    const [listo, setListo] = useState(false);
    const [fallo, setFallo] = useState(false);
    const caja = useRef<HTMLDivElement>(null);
    const tarjetas = useRef<(HTMLElement | null)[]>([]);

    // La línea de lectura: el centro de la pantalla en computadora; en celular, abajo del mapa
    const lineaDeLectura = () => {
        const r = caja.current?.getBoundingClientRect();
        if (window.matchMedia('(min-width: 1024px)').matches || !r) return window.innerHeight * 0.5;
        return r.bottom + (window.innerHeight - r.bottom) * 0.42;
    };

    // El capítulo que se lee, al bajar
    useEffect(() => {
        let cuadro = 0;
        const medir = () => {
            cuadro = 0;
            const linea = lineaDeLectura();
            let mejor = 0;
            let menor = Infinity;
            tarjetas.current.forEach((t, i) => {
                if (!t) return;
                const r = t.getBoundingClientRect();
                const d = Math.abs(r.top + Math.min(r.height, 360) / 2 - linea);
                if (d < menor) {
                    menor = d;
                    mejor = i;
                }
            });
            setActivo(mejor);
        };
        const pedir = () => {
            if (!cuadro) cuadro = requestAnimationFrame(medir);
        };
        medir();
        window.addEventListener('scroll', pedir, { passive: true });
        window.addEventListener('resize', pedir);
        return () => {
            window.removeEventListener('scroll', pedir);
            window.removeEventListener('resize', pedir);
            cancelAnimationFrame(cuadro);
        };
    }, []);

    // El mapa real baja cuando la sección está cerca (no antes: pesa)
    useEffect(() => {
        const el = caja.current;
        if (!el) return;
        const observador = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setCargar(true);
                    observador.disconnect();
                }
            },
            { rootMargin: '800px 0px' },
        );
        observador.observe(el);
        return () => observador.disconnect();
    }, []);

    const irA = (i: number) => {
        const t = tarjetas.current[i];
        if (!t) return;
        const r = t.getBoundingClientRect();
        const destino = window.scrollY + r.top + Math.min(r.height, 360) / 2 - lineaDeLectura();
        window.scrollTo({ top: destino, behavior: sinMovimiento() ? 'auto' : 'smooth' });
    };

    // El mapa dibujado (respaldo): se acerca al lugar sin que se vea la orilla del lienzo
    const c = capitulos[activo];
    const fuera = !c.pos;
    const z = c.pos ? (c.zoom ?? 1) : 1;
    const foco = c.pos && z > 1 ? c.pos : { x: 50, y: 50 };
    const tx = limitar(50 - z * foco.x, 100 - 100 * z, 0);
    const ty = limitar(50 - z * foco.y, 100 - 100 * z, 0);
    const lienzo = { '--n-z': z, '--n-tx': tx, '--n-ty': ty } as CSSProperties;
    const real = cargar && !fallo;

    return (
        <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] gap-x-12 items-start movil:mt-7">
            {/* El mapa, fijo mientras se baja */}
            <div className="sticky z-10 top-[calc(133px/var(--n-zoom,1))] sm:top-[calc(143px/var(--n-zoom,1))] lg:top-[calc(184px/var(--n-zoom,1))] lg:order-2 -mx-5 px-5 pt-2 pb-3 bg-simar-papel sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 lg:bg-transparent">
                <div
                    ref={caja}
                    className="n-mapa-caja relative h-[calc(42svh/var(--n-zoom,1))] min-h-[280px] lg:h-[min(740px,calc((100svh-212px)/var(--n-zoom,1)))] rounded-[28px] overflow-hidden bg-simar-mar-2 ring-1 ring-simar-borde shadow-simar movil:rounded-[20px]"
                >
                    {/* El dibujado: se ve mientras llega el real (o si no se puede) */}
                    <div aria-hidden={real && listo} className="absolute inset-0">
                        <div className="n-mapa-lienzo" style={{ ...lienzo, opacity: fuera ? 0.35 : 1 }}>
                            {mapa}
                        </div>
                        {capitulos.map((l, i) =>
                            l.pos || !l.capa ? null : (
                                <div key={l.id} aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${i === activo ? 'opacity-100' : 'opacity-0'}`}>
                                    {l.capa}
                                </div>
                            ),
                        )}
                    </div>

                    {/* El real, encima, cuando termina de cargar */}
                    {real && (
                        <div className="n-mapa-real absolute inset-0" data-listo={listo}>
                            <MapaInteractivo
                                lugares={capitulos.map((l) => ({ id: l.id, nombre: l.nombre, cuantas: l.cuantas, centro: l.centro }))}
                                activo={activo}
                                alElegir={irA}
                                alCargar={() => setListo(true)}
                                alFallar={() => setFallo(true)}
                            />
                        </div>
                    )}

                    {/* Dónde vamos */}
                    <p aria-hidden="true" className="pointer-events-none absolute left-4 top-4 inline-flex items-center gap-2 rounded-full bg-simar-abismo/80 backdrop-blur-md px-4 py-2 text-[15px] font-bold text-white tabular-nums movil:left-3 movil:top-3 movil:text-[14px]">
                        <IconoMapa className="w-4 h-4 text-simar-espuma" />
                        {activo + 1} de {capitulos.length} · {c.nombre}
                    </p>

                    {/* Los lugares sin marca (México, el mundo) y la leyenda */}
                    <div className="absolute left-4 bottom-4 flex gap-2 movil:left-3 movil:bottom-3">
                        {capitulos.map((l, i) => {
                            if (l.centro) return null;
                            const Icono = ICONO_FUERA[l.id] ?? Globe2;
                            const encendida = i === activo;
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    aria-current={encendida ? 'location' : undefined}
                                    aria-label={`${l.nombre}: ${cuantasTexto(l.cuantas)}. Ir a sus noticias`}
                                    onClick={() => irA(i)}
                                    className={`min-h-[46px] px-4 rounded-full inline-flex items-center justify-center gap-2 text-[15px] font-bold shadow-[0_8px_20px_-10px_rgba(11,34,54,0.6)] transition-colors cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-golfo movil:min-h-[44px] movil:px-3 ${
                                        encendida ? 'bg-simar-aceite text-[#0B2236]' : 'bg-simar-superficie text-simar-texto ring-1 ring-simar-borde hover:bg-simar-papel'
                                    }`}
                                >
                                    <Icono aria-hidden="true" className="w-[18px] h-[18px]" />
                                    <span aria-hidden="true" className="max-sm:hidden">
                                        {l.nombre}
                                    </span>
                                </button>
                            );
                        })}
                    </div>
                    {real && listo && (
                        <p className="pointer-events-none absolute right-3 bottom-9 max-sm:hidden inline-flex items-center gap-2 rounded-full bg-simar-superficie/90 px-3 py-1.5 text-[13px] font-bold text-simar-texto ring-1 ring-simar-borde">
                            <span aria-hidden="true" className="w-3.5 h-3.5 rounded-full border-2 border-dashed border-simar-arrecife bg-simar-espuma/30" />
                            Zona de la vaquita (aprox.)
                        </p>
                    )}
                </div>
                <p className="mt-2 text-[14px] leading-snug text-simar-texto-2 max-lg:hidden">Ubicaciones aproximadas. Usa Ctrl + rueda para acercar, o los botones + y −.</p>
            </div>

            {/* Los capítulos: uno por lugar */}
            <ol className="lg:order-1 lg:py-[14vh]">
                {capitulos.map((l, i) => {
                    const encendido = i === activo;
                    return (
                        <li key={l.id} className="py-6 lg:min-h-[64svh] lg:flex lg:items-center movil:py-4">
                            <article
                                ref={(el) => {
                                    tarjetas.current[i] = el;
                                }}
                                aria-labelledby={`lugar-${l.id}`}
                                className={`w-full overflow-hidden rounded-[28px] bg-simar-superficie ring-1 transition-[opacity,box-shadow,transform] duration-500 movil:rounded-[22px] ${
                                    encendido ? 'ring-simar-campo-borde shadow-simar opacity-100' : 'ring-simar-borde opacity-60 lg:scale-[0.985]'
                                }`}
                            >
                                {l.foto && (
                                    <figure className="relative aspect-[21/9] overflow-hidden simar-cargando movil:aspect-[16/9]">
                                        <Image src={l.foto.src} alt={l.foto.alt} fill sizes="(min-width: 1024px) 560px, 100vw" className="object-cover" style={{ objectPosition: l.foto.posicion ?? '50% 50%' }} />
                                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent" />
                                        <span className="absolute left-4 top-4 rounded-full bg-simar-abismo/70 backdrop-blur-md px-3 py-1 text-[14px] font-bold text-white tabular-nums">
                                            Lugar {i + 1} de {capitulos.length}
                                        </span>
                                        <figcaption className="absolute right-4 bottom-2.5 left-4 text-right text-[12px] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.7)]">
                                            {l.foto.credito ? textoCredito(l.foto.credito) : 'Foto: SiMAR'}
                                        </figcaption>
                                    </figure>
                                )}
                                <div className="p-6 md:p-7 movil:p-5">
                                    <p className="text-[14px] font-extrabold uppercase tracking-[0.12em] text-simar-marea-tinta">{cuantasTexto(l.cuantas)}</p>
                                    <h3 id={`lugar-${l.id}`} className="mt-1 font-titular text-[34px] font-semibold leading-[1.05] tracking-[-0.02em] movil:text-[28px]">
                                        {l.nombre}
                                    </h3>
                                    <p className="mt-2 text-[18px] leading-relaxed text-simar-texto-2 movil:text-[17px]">{l.detalle}</p>
                                    <div className="mt-5">{l.noticias}</div>
                                </div>
                            </article>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

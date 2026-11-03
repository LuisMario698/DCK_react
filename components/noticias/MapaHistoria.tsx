'use client';

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from 'react';
import { Globe2, Landmark } from 'lucide-react';
import { Vaquita } from './Vaquita';
import { PausaFuera } from './PausaFuera';
import { sinMovimiento } from './movimiento';

export interface CapituloMapa {
    id: string;
    nombre: string;
    detalle: string;
    /** En % del lienzo del mapa; sin posición (México, el mundo) el mapa se aparta y sale `capa` */
    pos?: { x: number; y: number };
    /** Cuánto se acerca el mapa a este lugar (1 = el golfo entero) */
    zoom?: number;
    lado?: 'derecha' | 'izquierda' | 'abajo';
    cuantas: number;
    /** Las noticias del lugar (de servidor: así las tarjetas y sus dibujos no bajan al navegador) */
    noticias: ReactNode;
    /** El dibujo que tapa el mapa en los lugares sin posición */
    capa?: ReactNode;
}

const LADO = {
    derecha: 'left-full ml-2 top-1/2 -translate-y-1/2',
    izquierda: 'right-full mr-2 top-1/2 -translate-y-1/2',
    abajo: 'top-full mt-2 left-0',
};

const ICONO_FUERA: Record<string, typeof Globe2> = { mundo: Globe2, mexico: Landmark };
const cuantasTexto = (n: number) => (n === 1 ? '1 noticia' : `${n} noticias`);
const limitar = (n: number, min: number, max: number) => Math.min(max, Math.max(min, n));

/**
 * «En el mapa», contado con el scroll: el mapa del golfo se queda fijo (a un lado en computadora,
 * arriba en celular) y, al bajar, cada capítulo lo lleva a su lugar: se acerca, se enciende su
 * marca y se leen sus noticias. Sin clics; si se toca una marca, la página baja a su capítulo.
 * La vaquita nada en el Alto Golfo y una panga sale de Puerto Peñasco. Con «reducir movimiento»
 * el mapa cambia de lugar sin animarse. El mapa (MapaGolfo) se dibuja en el servidor.
 */
export function MapaHistoria({ mapa, capitulos, vaquita, panga }: { mapa: ReactNode; capitulos: CapituloMapa[]; vaquita: { x: number; y: number }; panga: { x: number; y: number } }) {
    const [activo, setActivo] = useState(0);
    const caja = useRef<HTMLDivElement>(null);
    const tarjetas = useRef<(HTMLElement | null)[]>([]);

    // La línea de lectura: el centro de la pantalla en computadora; en celular, abajo del mapa
    const lineaDeLectura = () => {
        const r = caja.current?.getBoundingClientRect();
        if (window.matchMedia('(min-width: 1024px)').matches || !r) return window.innerHeight * 0.5;
        return r.bottom + (window.innerHeight - r.bottom) * 0.42;
    };

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

    const irA = (i: number) => {
        const t = tarjetas.current[i];
        if (!t) return;
        const r = t.getBoundingClientRect();
        const destino = window.scrollY + r.top + Math.min(r.height, 360) / 2 - lineaDeLectura();
        window.scrollTo({ top: destino, behavior: sinMovimiento() ? 'auto' : 'smooth' });
    };

    const c = capitulos[activo];
    const fuera = !c.pos;
    // Acercar al lugar sin que se vea la orilla del lienzo
    const z = c.pos ? (c.zoom ?? 1) : 1;
    const foco = c.pos && z > 1 ? c.pos : { x: 50, y: 50 };
    const tx = limitar(50 - z * foco.x, 100 - 100 * z, 0);
    const ty = limitar(50 - z * foco.y, 100 - 100 * z, 0);
    const lienzo = { '--n-z': z, '--n-tx': tx, '--n-ty': ty } as CSSProperties;

    return (
        <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)] gap-x-12 items-start movil:mt-7">
            {/* El mapa, fijo mientras se baja */}
            <div className="sticky z-10 top-[133px] sm:top-[143px] lg:top-[184px] lg:order-2 -mx-5 px-5 pt-2 pb-3 bg-simar-papel sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 lg:pt-0 lg:pb-0 lg:bg-transparent">
                <div
                    ref={caja}
                    className="n-mapa-caja relative h-[40svh] min-h-[260px] lg:h-[min(720px,calc(100svh-212px))] rounded-[32px] overflow-hidden bg-simar-mar-2 shadow-simar movil:rounded-[22px]"
                >
                    <PausaFuera className="absolute inset-0">
                        <div className="n-mapa-lienzo" style={{ ...lienzo, opacity: fuera ? 0.35 : 1 }}>
                            {mapa}
                            {/* La vaquita, en el Alto Golfo, va y viene */}
                            <div aria-hidden="true" className="absolute w-[7%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${vaquita.x}%`, top: `${vaquita.y}%` }}>
                                <div className="n-patrulla">
                                    <Vaquita className="w-full" />
                                </div>
                            </div>
                            {/* Una panga sale de Puerto Peñasco */}
                            <div aria-hidden="true" className="absolute w-[3.4%] -translate-x-1/2 -translate-y-1/2" style={{ left: `${panga.x}%`, top: `${panga.y}%` }}>
                                <svg viewBox="0 0 40 20" className="n-flota w-full">
                                    <path d="M2 10 H38 L33 17 H8 Z" fill="#fff" />
                                    <path d="M14 10 V4 H24 L27 10 Z" fill="#7FE0D6" />
                                    <path d="M0 18 C8 16 30 16 40 18" stroke="#7FE0D6" strokeOpacity="0.7" strokeWidth="1.4" fill="none" />
                                </svg>
                            </div>
                            {capitulos.map((l, i) => {
                                if (!l.pos) return null;
                                const encendida = i === activo;
                                return (
                                    <button
                                        key={l.id}
                                        type="button"
                                        aria-current={encendida ? 'location' : undefined}
                                        aria-label={`${l.nombre}: ${cuantasTexto(l.cuantas)}. Ir a sus noticias`}
                                        onClick={() => irA(i)}
                                        style={{ left: `${l.pos.x}%`, top: `${l.pos.y}%` }}
                                        className={`n-mapa-marca group absolute rounded-full cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-espuma focus-visible:outline-offset-4 ${encendida ? 'z-10' : ''}`}
                                    >
                                        {encendida && <span aria-hidden="true" className="n-pulso absolute inset-0 rounded-full bg-simar-aceite" />}
                                        <span
                                            aria-hidden="true"
                                            className={`relative w-12 h-12 rounded-full flex items-center justify-center text-[18px] font-extrabold tabular-nums shadow-[0_6px_18px_rgba(0,0,0,0.35)] ring-4 transition-[transform,background-color] duration-300 movil:w-11 movil:h-11 movil:text-[16px] ${
                                                encendida ? 'bg-simar-aceite text-simar-abismo ring-simar-aceite/30 scale-110' : 'bg-white text-simar-abismo ring-white/20 group-hover:scale-105'
                                            }`}
                                        >
                                            {l.cuantas}
                                        </span>
                                        <span
                                            aria-hidden="true"
                                            className={`absolute ${LADO[l.lado ?? 'derecha']} whitespace-nowrap rounded-full px-3.5 py-1.5 text-[15px] font-bold border transition-colors ${
                                                encendida ? 'bg-simar-aceite text-simar-abismo border-simar-aceite' : 'max-sm:hidden bg-simar-abismo/85 text-white border-white/15 group-hover:bg-simar-abismo'
                                            }`}
                                        >
                                            {l.nombre}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </PausaFuera>

                    {/* México y el mundo: el mapa se aparta y entra su dibujo */}
                    {capitulos.map((l, i) =>
                        l.pos || !l.capa ? null : (
                            <div key={l.id} aria-hidden="true" className={`pointer-events-none absolute inset-0 transition-opacity duration-700 ${i === activo ? 'opacity-100' : 'opacity-0'}`}>
                                {l.capa}
                            </div>
                        ),
                    )}

                    {/* Dónde vamos y, abajo, los lugares sin marca */}
                    <p aria-hidden="true" className="max-sm:hidden absolute left-4 top-4 rounded-full bg-simar-abismo/70 border border-white/15 backdrop-blur-md px-4 py-2 text-[15px] font-bold text-white tabular-nums">
                        {activo + 1} de {capitulos.length} · {c.nombre}
                    </p>
                    <div className="absolute left-4 bottom-4 flex gap-2 movil:left-3 movil:bottom-3">
                        {capitulos.map((l, i) => {
                            if (l.pos) return null;
                            const Icono = ICONO_FUERA[l.id] ?? Globe2;
                            const encendida = i === activo;
                            return (
                                <button
                                    key={l.id}
                                    type="button"
                                    aria-current={encendida ? 'location' : undefined}
                                    aria-label={`${l.nombre}: ${cuantasTexto(l.cuantas)}. Ir a sus noticias`}
                                    onClick={() => irA(i)}
                                    className={`min-h-[48px] px-4 rounded-full inline-flex items-center justify-center gap-2 text-[15px] font-bold border backdrop-blur-md transition-colors cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-espuma movil:min-h-[44px] movil:px-3 ${
                                        encendida ? 'bg-simar-aceite text-simar-abismo border-simar-aceite' : 'bg-simar-abismo/70 text-white border-white/15 hover:bg-simar-abismo'
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
                </div>
            </div>

            {/* Los capítulos: uno por lugar */}
            <ol className="lg:order-1 lg:py-[16vh]">
                {capitulos.map((l, i) => {
                    const encendido = i === activo;
                    return (
                        <li key={l.id} className="py-6 lg:min-h-[62svh] lg:flex lg:items-center movil:py-4">
                            <article
                                ref={(el) => {
                                    tarjetas.current[i] = el;
                                }}
                                aria-labelledby={`lugar-${l.id}`}
                                className={`w-full rounded-[28px] border p-6 md:p-8 transition-[opacity,border-color,box-shadow] duration-500 movil:rounded-[22px] movil:p-5 ${
                                    encendido ? 'bg-simar-superficie border-simar-campo-borde shadow-simar opacity-100' : 'bg-simar-superficie/70 border-simar-borde opacity-55'
                                }`}
                            >
                                <p className="text-[15px] font-bold text-simar-marea-tinta tabular-nums">
                                    {i + 1} de {capitulos.length} · {cuantasTexto(l.cuantas)}
                                </p>
                                <h3 id={`lugar-${l.id}`} className="mt-1 text-[30px] font-extrabold leading-[1.1] tracking-[-0.02em] movil:text-[24px]">
                                    {l.nombre}
                                </h3>
                                <p className="mt-2 text-[18px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{l.detalle}</p>
                                <div className="mt-5">{l.noticias}</div>
                            </article>
                        </li>
                    );
                })}
            </ol>
        </div>
    );
}

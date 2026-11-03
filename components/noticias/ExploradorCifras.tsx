'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { ArrowRight, Droplet, Fish, Ship, Waypoints, type LucideIcon } from 'lucide-react';
import type { Ilustracion } from '@/lib/constants/noticias';
import { DibujoPortada } from './ilustraciones';
import { moverConTeclas, sinMovimiento } from './pestanas';

export interface TemaCifra {
    id: string;
    tema: string;
    corto: string;
    dibujo: Ilustracion;
    titulo: string;
    texto: string;
    cifra: string;
    nota: string;
    articulos: { slug: string; titulo: string }[];
}

const ICONO: Record<string, LucideIcon> = { aceite: Droplet, basura: Ship, redes: Waypoints, mar: Fish };

/**
 * La cifra sube de cero cuando se ve (sólo el primer número: «1,000,000 L», «11 millones t»).
 * Los lectores de pantalla leen la cifra final; con «reducir movimiento» no se anima.
 */
function CifraAnimada({ texto }: { texto: string }) {
    const ref = useRef<HTMLSpanElement>(null);
    useEffect(() => {
        const el = ref.current;
        const partes = texto.match(/^([\d,]+)(\D*)$/);
        if (!el || !partes || sinMovimiento()) return;
        const fin = Number(partes[1].replace(/,/g, ''));
        const resto = partes[2];
        const formato = (n: number) => Math.round(n).toLocaleString('es-MX') + resto;
        el.textContent = formato(0);
        let cuadro = 0;
        let inicio = 0;
        const paso = (t: number) => {
            if (!inicio) inicio = t;
            const p = Math.min(1, (t - inicio) / 900);
            el.textContent = formato(fin * (1 - Math.pow(1 - p, 3)));
            if (p < 1) cuadro = requestAnimationFrame(paso);
        };
        const vista = new IntersectionObserver(
            ([entrada]) => {
                if (!entrada.isIntersecting) return;
                vista.disconnect();
                cuadro = requestAnimationFrame(paso);
            },
            { threshold: 0.5 },
        );
        vista.observe(el);
        return () => {
            vista.disconnect();
            cancelAnimationFrame(cuadro);
            el.textContent = texto;
        };
    }, [texto]);
    return (
        <>
            <span ref={ref} aria-hidden="true">
                {texto}
            </span>
            <span className="sr-only">{texto}</span>
        </>
    );
}

/**
 * «En cifras» (fondo oscuro): el problema en cuatro temas. Se elige un tema arriba y abajo sale
 * su cifra en grande, una frase, su dibujo y los artículos que lo explican. Así se lee un tema a
 * la vez, no cuatro bloques de texto.
 */
export function ExploradorCifras({ temas, locale }: { temas: TemaCifra[]; locale: string }) {
    const [elegido, setElegido] = useState(0);
    const t = temas[elegido];

    return (
        <div className="mt-10 md:mt-12 movil:mt-7">
            <div role="tablist" aria-label="Temas" className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                {temas.map((tema, i) => {
                    const activo = i === elegido;
                    const Icono = ICONO[tema.id] ?? Droplet;
                    return (
                        <button
                            key={tema.id}
                            type="button"
                            role="tab"
                            id={`cifra-${tema.id}`}
                            aria-selected={activo}
                            aria-controls="cifra-panel"
                            tabIndex={activo ? 0 : -1}
                            onClick={() => setElegido(i)}
                            onKeyDown={(e) => moverConTeclas(e, i, temas.length, setElegido)}
                            className={`simar-presiona text-left rounded-[22px] p-4 md:p-5 min-h-[84px] flex items-center gap-3 md:gap-4 border-2 transition-colors cursor-pointer focus-visible:outline-3 focus-visible:outline-simar-espuma focus-visible:outline-offset-2 movil:rounded-[18px] movil:p-3 movil:min-h-[72px] movil:gap-2.5 ${
                                activo ? 'bg-white text-simar-abismo border-white' : 'bg-white/[0.06] text-white border-white/12 hover:bg-white/[0.11]'
                            }`}
                        >
                            <span
                                className={`w-12 h-12 rounded-[16px] flex items-center justify-center flex-shrink-0 transition-colors movil:w-10 movil:h-10 movil:rounded-[13px] ${
                                    activo ? 'bg-simar-abismo text-simar-espuma' : 'bg-white/10 text-simar-espuma'
                                }`}
                            >
                                <Icono aria-hidden="true" className="w-6 h-6 movil:w-5 movil:h-5" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[19px] font-extrabold leading-tight movil:text-[16px]">{tema.corto}</span>
                                <span className={`mt-0.5 block text-[15px] font-bold tabular-nums whitespace-nowrap movil:text-[14px] ${activo ? 'text-simar-abismo/70' : 'text-simar-franja-texto-3'}`}>
                                    {tema.cifra}
                                </span>
                            </span>
                        </button>
                    );
                })}
            </div>

            <div
                key={t.id}
                role="tabpanel"
                id="cifra-panel"
                aria-labelledby={`cifra-${t.id}`}
                className="simar-aparece mt-5 md:mt-6 grid grid-cols-1 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,1fr)] gap-7 lg:gap-14 items-center rounded-[32px] bg-white/[0.05] border border-white/10 p-6 md:p-10 movil:rounded-[24px] movil:p-5 movil:gap-5"
            >
                <div className="relative aspect-[16/10] lg:aspect-[4/3] rounded-[24px] overflow-hidden lg:order-2 movil:rounded-[18px]">
                    <DibujoPortada tipo={t.dibujo} />
                </div>
                <div className="lg:order-1">
                    <p className="text-[17px] font-bold text-simar-espuma movil:text-[15px]">{t.tema}</p>
                    <p
                        className={`mt-2 text-[clamp(52px,6.4vw,96px)] font-extrabold leading-[0.95] tracking-[-0.04em] tabular-nums whitespace-nowrap movil:text-[46px] ${
                            t.id === 'aceite' ? 'text-simar-aceite' : 'text-white'
                        }`}
                    >
                        <CifraAnimada texto={t.cifra} />
                    </p>
                    <p className="mt-3 text-[19px] font-bold leading-snug text-simar-franja-texto-2 movil:text-[16px]">{t.nota}</p>

                    <h3 className="mt-7 pt-6 border-t border-white/10 text-[28px] font-extrabold leading-[1.15] tracking-[-0.015em] text-white movil:mt-5 movil:pt-5 movil:text-[22px]">{t.titulo}</h3>
                    <p className="mt-2 text-[18px] leading-relaxed text-simar-franja-texto-2 movil:text-[16px]">{t.texto}</p>

                    <ul className="mt-5 space-y-1">
                        {t.articulos.map((a) => (
                            <li key={a.slug}>
                                <Link
                                    href={`/${locale}/noticias/${a.slug}`}
                                    className="group -mx-3 px-3 min-h-[52px] py-2 rounded-[14px] flex items-center justify-between gap-3 text-[17px] font-bold leading-snug text-white hover:bg-white/[0.07] transition-colors focus-visible:outline-3 focus-visible:outline-simar-espuma movil:text-[16px]"
                                >
                                    {a.titulo}
                                    <ArrowRight aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-simar-espuma transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
}

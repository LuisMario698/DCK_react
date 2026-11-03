'use client';

import { useState } from 'react';
import { CATEGORIAS, type CategoriaNoticia, type ResumenNoticia } from '@/lib/constants/noticias';
import { TarjetaNoticia } from './TarjetaNoticia';

/**
 * Todas las noticias y artículos (de la más nueva a la más vieja), con filtro por tema: en
 * cuadrícula y, en celular, en renglones. Las tarjetas llegan sin el texto de los artículos
 * (resumenDe).
 */
export function ListaNoticias({ noticias, locale }: { noticias: ResumenNoticia[]; locale: string }) {
    const [tema, setTema] = useState<CategoriaNoticia | null>(null);
    const filtradas = tema ? noticias.filter((n) => n.categoria === tema) : noticias;
    const opciones: { valor: CategoriaNoticia | null; texto: string; cuantas: number }[] = [
        { valor: null, texto: 'Todas', cuantas: noticias.length },
        ...CATEGORIAS.map((c) => ({ valor: c, texto: c, cuantas: noticias.filter((n) => n.categoria === c).length })).filter((o) => o.cuantas > 0),
    ];

    return (
        <>
            <div role="group" aria-label="Filtrar por tema" className="mt-8 -mx-5 px-5 flex gap-2 overflow-x-auto [scrollbar-width:none] md:mx-0 md:px-0 md:flex-wrap movil:mt-7">
                {opciones.map((o) => {
                    const activa = tema === o.valor;
                    return (
                        <button
                            key={o.texto}
                            type="button"
                            aria-pressed={activa}
                            onClick={() => setTema(o.valor)}
                            className={`simar-presiona flex-shrink-0 min-h-[48px] px-5 rounded-full text-[17px] font-bold inline-flex items-center gap-2 border-2 transition-colors cursor-pointer movil:min-h-[44px] movil:px-4 movil:text-[15px] ${
                                activa
                                    ? 'bg-simar-texto text-simar-papel border-simar-texto'
                                    : 'bg-simar-superficie text-simar-texto border-simar-borde hover:border-simar-campo-borde'
                            }`}
                        >
                            {o.texto}
                            <span className={`text-[15px] font-semibold ${activa ? 'opacity-75' : 'text-simar-texto-2'}`}>{o.cuantas}</span>
                        </button>
                    );
                })}
            </div>
            <p aria-live="polite" className="sr-only">
                {tema ? `${filtradas.length} de ${tema}` : `${filtradas.length} noticias`}
            </p>

            {/* En celular, renglones con la portada chica (la lista no se hace kilométrica) */}
            <ul className="sm:hidden mt-5 divide-y divide-simar-borde">
                {filtradas.map((n) => (
                    <li key={n.slug} className="py-4">
                        <TarjetaNoticia noticia={n} locale={locale} variante="fila" />
                    </li>
                ))}
            </ul>
            <ul className="max-sm:hidden mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                {filtradas.map((n) => (
                    <li key={n.slug} className="flex">
                        <TarjetaNoticia noticia={n} locale={locale} className="w-full" />
                    </li>
                ))}
            </ul>
        </>
    );
}

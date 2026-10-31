'use client';

import { useState } from 'react';
import { CATEGORIAS, type CategoriaNoticia, type ResumenNoticia } from '@/lib/constants/noticias';
import { TarjetaNoticia } from './TarjetaNoticia';

/**
 * Todas las noticias, con filtro por tema. La primera de la lista (la destacada, o la más nueva
 * del tema elegido) va a lo grande; las demás en cuadrícula.
 */
export function ListaNoticias({ noticias, locale }: { noticias: ResumenNoticia[]; locale: string }) {
    const [tema, setTema] = useState<CategoriaNoticia | null>(null);
    const filtradas = tema ? noticias.filter((n) => n.categoria === tema) : noticias;
    const [primera, ...resto] = filtradas;
    const opciones: { valor: CategoriaNoticia | null; texto: string; cuantas: number }[] = [
        { valor: null, texto: 'Todas', cuantas: noticias.length },
        ...CATEGORIAS.map((c) => ({ valor: c, texto: c, cuantas: noticias.filter((n) => n.categoria === c).length })).filter((o) => o.cuantas > 0),
    ];

    return (
        <>
            <div role="group" aria-label="Filtrar por tema" className="mt-10 -mx-5 px-5 flex gap-2 overflow-x-auto [scrollbar-width:none] md:mx-0 md:px-0 md:flex-wrap movil:mt-7">
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

            {primera && (
                <div className="mt-8 movil:mt-6">
                    <TarjetaNoticia key={primera.slug} noticia={primera} locale={locale} variante="portada" prioridad />
                </div>
            )}
            {resto.length > 0 && (
                <div className="mt-6 grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6 movil:mt-4 movil:gap-4">
                    {resto.map((n) => (
                        <TarjetaNoticia key={n.slug} noticia={n} locale={locale} />
                    ))}
                </div>
            )}
        </>
    );
}

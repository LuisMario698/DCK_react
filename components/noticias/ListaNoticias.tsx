'use client';

import { useState } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { CATEGORIAS, type CategoriaNoticia, type ResumenNoticia } from '@/lib/constants/noticias';
import { TarjetaNoticia } from './TarjetaNoticia';

/** Sin acentos ni mayúsculas, para buscar «vaquita» o «tratado» como sea que se escriba */
const normal = (texto: string) => texto.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();

const PRIMERAS = 6;

/**
 * Todas las noticias y artículos (de la más nueva a la más vieja): buscador, filtro por tema y las
 * primeras seis; el resto, con «Ver más». En cuadrícula sin resumen (menos texto) y, en celular,
 * en renglones. Las tarjetas llegan sin el texto de los artículos (resumenDe).
 */
export function ListaNoticias({ noticias, locale }: { noticias: ResumenNoticia[]; locale: string }) {
    const [tema, setTema] = useState<CategoriaNoticia | null>(null);
    const [busqueda, setBusqueda] = useState('');
    const [todas, setTodas] = useState(false);

    const palabras = normal(busqueda).split(/\s+/).filter(Boolean);
    const filtradas = noticias.filter((n) => {
        if (tema && n.categoria !== tema) return false;
        if (!palabras.length) return true;
        const texto = normal(`${n.titulo} ${n.resumen} ${n.categoria}`);
        return palabras.every((p) => texto.includes(p));
    });
    const visibles = todas || palabras.length || tema ? filtradas : filtradas.slice(0, PRIMERAS);
    const faltan = filtradas.length - visibles.length;

    const opciones: { valor: CategoriaNoticia | null; texto: string; cuantas: number }[] = [
        { valor: null, texto: 'Todas', cuantas: noticias.length },
        ...CATEGORIAS.map((c) => ({ valor: c, texto: c, cuantas: noticias.filter((n) => n.categoria === c).length })).filter((o) => o.cuantas > 0),
    ];

    return (
        <>
            <div className="mt-8 flex flex-col lg:flex-row lg:items-center gap-4 movil:mt-7">
                <label className="relative block w-full lg:w-[360px] flex-shrink-0">
                    <span className="sr-only">Buscar una noticia</span>
                    <Search aria-hidden="true" className="absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-simar-texto-2 pointer-events-none" />
                    <input
                        type="search"
                        value={busqueda}
                        onChange={(e) => setBusqueda(e.target.value)}
                        placeholder="Buscar: vaquita, aceite, MARPOL…"
                        className="w-full min-h-[56px] pl-13 pr-14 rounded-full bg-simar-superficie border-2 border-simar-campo-borde text-[17px] text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea [&::-webkit-search-cancel-button]:hidden movil:min-h-[52px]"
                    />
                    {busqueda && (
                        <button
                            type="button"
                            onClick={() => setBusqueda('')}
                            aria-label="Borrar la búsqueda"
                            className="absolute right-1.5 top-1/2 -translate-y-1/2 w-11 h-11 rounded-full inline-flex items-center justify-center text-simar-texto-2 hover:bg-simar-texto/5 cursor-pointer"
                        >
                            <X aria-hidden="true" className="w-5 h-5" />
                        </button>
                    )}
                </label>
                <div role="group" aria-label="Filtrar por tema" className="-mx-5 px-5 flex gap-2 overflow-x-auto [scrollbar-width:none] md:mx-0 md:px-0 md:flex-wrap">
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
            </div>
            <p aria-live="polite" className="sr-only">
                {filtradas.length === 1 ? '1 noticia' : `${filtradas.length} noticias`}
            </p>

            {filtradas.length === 0 ? (
                <div className="mt-8 rounded-[28px] border-2 border-dashed border-simar-borde px-6 py-12 text-center">
                    <p className="text-[20px] font-extrabold">No hay noticias con «{busqueda.trim()}»{tema ? ` en ${tema}` : ''}.</p>
                    <button
                        type="button"
                        onClick={() => {
                            setBusqueda('');
                            setTema(null);
                        }}
                        className="mt-5 min-h-[52px] px-6 rounded-full border-2 border-simar-campo-borde text-[17px] font-bold hover:bg-simar-texto/5 transition-colors cursor-pointer"
                    >
                        Ver todas
                    </button>
                </div>
            ) : (
                <>
                    {/* En celular, renglones con la portada chica (la lista no se hace kilométrica) */}
                    <ul className="sm:hidden mt-5 divide-y divide-simar-borde">
                        {visibles.map((n) => (
                            <li key={n.slug} className="py-4">
                                <TarjetaNoticia noticia={n} locale={locale} variante="fila" />
                            </li>
                        ))}
                    </ul>
                    <ul className="max-sm:hidden mt-8 grid md:grid-cols-2 lg:grid-cols-3 gap-5 md:gap-6">
                        {visibles.map((n) => (
                            <li key={n.slug} className="flex">
                                <TarjetaNoticia noticia={n} locale={locale} breve className="w-full" />
                            </li>
                        ))}
                    </ul>
                </>
            )}

            {faltan > 0 && (
                <div className="mt-8 flex justify-center movil:mt-6">
                    <button
                        type="button"
                        onClick={() => setTodas(true)}
                        className="simar-presiona min-h-[56px] px-7 rounded-full border-2 border-simar-campo-borde bg-simar-superficie text-[17px] font-extrabold inline-flex items-center gap-2 hover:bg-simar-texto/5 transition-colors cursor-pointer movil:w-full movil:justify-center movil:min-h-[52px]"
                    >
                        Ver {faltan} más
                        <ChevronDown aria-hidden="true" className="w-5 h-5" />
                    </button>
                </div>
            )}
        </>
    );
}

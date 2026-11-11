import type { ReactNode } from 'react';
import Link from 'next/link';
import { ArrowRight, Clock } from 'lucide-react';
import type { CategoriaNoticia, Ilustracion, Noticia } from '@/lib/constants/noticias';
import { DibujoPortada } from './ilustraciones';
import { FotoNota } from './FotoNota';

/**
 * Las tarjetas editoriales de Noticias (el mosaico de «Lo último» y el archivo en cuadrícula), con el
 * mismo lenguaje que las noticias de la landing Actual:
 *  - el tema en versalitas con su punto, la fecha relativa con su reloj;
 *  - la portada se descubre de arriba abajo al entrar (`n-descubre`, atada al scroll) y, mientras
 *    llega la foto, un brillo de carga (`simar-cargando`, debajo de la imagen);
 *  - al pasar el cursor, la tarjeta se levanta, la portada se acerca y el título se subraya de
 *    izquierda a derecha (`n-subraya`).
 * Sin JavaScript propio: se dibujan en el servidor y también dentro de componentes de cliente. De
 * lib/constants/noticias sólo importa tipos (los datos llegan resueltos: `datosEditorial`), así
 * en un componente de cliente no baja el texto de todos los artículos.
 */

export type DatosEditorial = Pick<Noticia, 'slug' | 'titulo' | 'categoria' | 'fecha' | 'soloMes' | 'resumen' | 'imagen'> & {
    /** El dibujo de la portada si no hay foto (ya resuelto: el suyo o el de su tema) */
    ilustracion: Ilustracion;
    minutos: number;
    /** «Hoy», «Ayer», «Hace 3 días» o la fecha corta (cuandoFue) */
    cuando: string;
    /** La fecha larga, para el título del reloj */
    fechaTexto: string;
    /** La vista previa difuminada de la foto (lib/constants/previas.ts) */
    previa?: string;
};

export const PUNTO_TEMA: Record<CategoriaNoticia, string> = {
    SiMAR: 'bg-simar-marea',
    'Mar de Cortés': 'bg-simar-golfo',
    Océanos: 'bg-simar-arrecife',
    Normativa: 'bg-simar-texto-2',
    Conciencia: 'bg-simar-aceite',
};

const ENFOQUE = 'focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-4';

export function TemaVersalitas({ categoria, claro = false }: { categoria: CategoriaNoticia; claro?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-2 text-[13px] font-extrabold uppercase tracking-[0.1em] movil:tracking-[0.04em] ${claro ? 'text-white/80' : 'text-simar-texto-2'}`}>
            <span aria-hidden="true" className={`w-2 h-2 rounded-full ${PUNTO_TEMA[categoria]}`} />
            {categoria}
        </span>
    );
}

export function Cuando({ nota, claro = false }: { nota: DatosEditorial; claro?: boolean }) {
    return (
        <span className={`inline-flex items-center gap-1.5 text-[15px] font-semibold ${claro ? 'text-white/75' : 'text-simar-texto-2'}`}>
            <Clock aria-hidden="true" className="w-4 h-4" strokeWidth={2.2} />
            <time dateTime={nota.fecha} title={nota.fechaTexto}>
                {nota.cuando}
            </time>
        </span>
    );
}

/** La portada que se descubre al entrar, con el brillo de carga debajo (lo tapa la foto al llegar) */
function Portada({ nota, sizes, prioridad }: { nota: DatosEditorial; sizes: string; prioridad?: boolean }) {
    return (
        // El marco recorta; la capa baja y su contenido sube lo mismo (globals.css, n-descubre)
        <div className="absolute inset-0 overflow-clip">
            <div className="n-descubre absolute inset-0 bg-simar-abismo">
                <div className="n-descubre-contra absolute inset-0">
                    <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                        {nota.imagen ? (
                            <FotoNota
                                src={nota.imagen.src}
                                alt={nota.imagen.alt}
                                posicion={nota.imagen.posicion}
                                previa={nota.previa}
                                sizes={sizes}
                                prioridad={prioridad}
                                className="absolute! inset-0"
                            />
                        ) : (
                            <div aria-hidden="true" className="absolute inset-0">
                                <DibujoPortada tipo={nota.ilustracion} />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}

export function TarjetaEditorial({
    nota,
    locale,
    variante = 'chica',
    etiqueta,
    prioridad = false,
    insignia,
    titulo,
    className = '',
}: {
    nota: DatosEditorial;
    locale: string;
    variante?: 'grande' | 'chica';
    /** Una etiqueta sobre la portada («Lo más reciente») */
    etiqueta?: string;
    prioridad?: boolean;
    /** Algo que va antes del tema (la marca «Nueva», que es de cliente) */
    insignia?: ReactNode;
    /** El título con las palabras encontradas resaltadas (el buscador del archivo) */
    titulo?: ReactNode;
    className?: string;
}) {
    const href = `/${locale}/noticias/${nota.slug}`;

    if (variante === 'grande') {
        return (
            <Link
                href={href}
                className={`simar-tarjeta-accion group flex h-full flex-col overflow-clip rounded-[28px] bg-simar-superficie ring-1 ring-simar-borde shadow-simar movil:rounded-[22px] ${ENFOQUE} ${className}`}
            >
                <div className="relative aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[320px]">
                    <Portada nota={nota} sizes="(min-width: 1024px) 640px, 100vw" prioridad={prioridad} />
                    {etiqueta && (
                        <span className="absolute left-5 top-5 inline-flex items-center gap-2 rounded-full bg-simar-superficie/95 px-3.5 py-1.5 text-[14px] font-extrabold text-simar-texto movil:left-4 movil:top-4">
                            <span aria-hidden="true" className="simar-en-vivo" />
                            {etiqueta}
                        </span>
                    )}
                </div>
                <div className="p-7 md:p-8 movil:p-5">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
                        {insignia}
                        <TemaVersalitas categoria={nota.categoria} />
                    </div>
                    <h3 className="mt-3 max-w-[24ch] font-titular text-[clamp(30px,2.8vw,42px)] font-semibold leading-[1.05] tracking-[-0.02em] text-simar-texto text-balance movil:mt-2 movil:text-[27px]">
                        <span className="n-subraya">{titulo ?? nota.titulo}</span>
                    </h3>
                    <p className="mt-3 max-w-[56ch] text-[18px] leading-relaxed text-simar-texto-2 line-clamp-2 text-pretty movil:text-[16px]">{nota.resumen}</p>
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <span className="flex flex-wrap items-center gap-x-4 gap-y-1">
                            <Cuando nota={nota} />
                            <span className="text-[15px] font-semibold text-simar-texto-2">{nota.minutos} min de lectura</span>
                        </span>
                        <span className="inline-flex items-center gap-2 text-[17px] font-extrabold text-simar-marea-tinta">
                            Leer la nota
                            <span className="w-9 h-9 rounded-full bg-simar-marea-suave flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-1">
                                <ArrowRight aria-hidden="true" className="w-[18px] h-[18px]" strokeWidth={2.4} />
                            </span>
                        </span>
                    </div>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={`simar-tarjeta-accion group flex h-full w-full flex-col overflow-clip rounded-[24px] bg-simar-superficie ring-1 ring-simar-borde shadow-simar movil:rounded-[18px] ${ENFOQUE} ${className}`}
        >
            <div className="relative aspect-[4/3]">
                <Portada nota={nota} sizes="(min-width: 1024px) 300px, 50vw" prioridad={prioridad} />
                {insignia && <span className="absolute left-3 top-3">{insignia}</span>}
            </div>
            <div className="flex flex-1 flex-col p-5 movil:p-3.5">
                <TemaVersalitas categoria={nota.categoria} />
                <h3 className="mt-2 font-titular text-[22px] font-semibold leading-[1.15] tracking-[-0.01em] text-simar-texto line-clamp-3 text-pretty movil:text-[19px] movil:leading-[1.15]">
                    <span className="n-subraya">{titulo ?? nota.titulo}</span>
                </h3>
                <span className="mt-auto pt-3">
                    <Cuando nota={nota} />
                </span>
            </div>
        </Link>
    );
}

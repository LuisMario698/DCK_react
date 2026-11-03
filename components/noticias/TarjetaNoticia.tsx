import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { fechaNoticia, type CategoriaNoticia, type Noticia } from '@/lib/constants/noticias';
import { PortadaNoticia } from './PortadaNoticia';

type DatosTarjeta = Omit<Noticia, 'cuerpo' | 'galeria' | 'fuentes'> & { minutos?: number };

/** Un punto de color por tema (los cuatro con tokens de SiMAR) */
const PUNTO: Record<CategoriaNoticia, string> = {
    SiMAR: 'bg-simar-marea',
    'Mar de Cortés': 'bg-simar-golfo',
    Océanos: 'bg-simar-arrecife',
    Normativa: 'bg-simar-texto-2',
    Conciencia: 'bg-simar-aceite',
};

/**
 * Tema · fecha · minutos. Cada parte lleva su punto adelante y la fila se corre a la izquierda lo
 * que mide un punto, con la orilla recortada: cuando una parte baja de renglón, su punto queda
 * fuera y ningún renglón empieza con «·».
 */
export function MetaNoticia({ noticia, claro = false, className = '' }: { noticia: DatosTarjeta; claro?: boolean; className?: string }) {
    const tenue = claro ? 'text-white/80' : 'text-simar-texto-2';
    const separador = (
        <span aria-hidden="true" className={`w-6 flex-shrink-0 text-center ${claro ? 'text-white/50' : 'text-simar-texto-3'}`}>
            ·
        </span>
    );
    return (
        <div className={`overflow-hidden ${className}`}>
            <p className="-ml-6 flex flex-wrap items-center gap-y-1 text-[15px] font-bold">
                <span className={`inline-flex items-center ${claro ? 'text-white' : 'text-simar-texto'}`}>
                    {separador}
                    <span aria-hidden="true" className={`mr-2 w-2.5 h-2.5 rounded-full ${PUNTO[noticia.categoria]}`} />
                    {noticia.categoria}
                </span>
                <span className={`inline-flex items-center font-semibold ${tenue}`}>
                    {separador}
                    <time dateTime={noticia.fecha}>{fechaNoticia(noticia)}</time>
                </span>
                {noticia.minutos !== undefined && (
                    <span className={`inline-flex items-center font-semibold ${tenue}`}>
                        {separador}
                        {noticia.minutos} min de lectura
                    </span>
                )}
            </p>
        </div>
    );
}

const ENFOQUE = 'focus-visible:outline-3 focus-visible:outline-simar-golfo focus-visible:outline-offset-4';

/**
 * Tarjeta de una noticia. Toda la tarjeta es el enlace.
 *  - `normal`: portada arriba y el texto abajo.
 *  - `portada`: la destacada, grande, con la foto (o el dibujo) arriba y el texto abajo.
 *  - `fila`: compacta, con la portada chica a un lado (listas).
 *  - `mosaico`: como la portada pero chica y sin resumen (el mosaico de arriba de Noticias).
 * `breve` quita el resumen de la normal (la lista de todas: menos texto).
 */
export function TarjetaNoticia({
    noticia,
    locale,
    variante = 'normal',
    prioridad = false,
    etiqueta,
    breve = false,
    className = '',
}: {
    noticia: DatosTarjeta;
    locale: string;
    variante?: 'normal' | 'portada' | 'fila' | 'mosaico';
    breve?: boolean;
    prioridad?: boolean;
    /** En la portada, una etiqueta arriba del título («Lo más reciente») */
    etiqueta?: string;
    className?: string;
}) {
    const href = `/${locale}/noticias/${noticia.slug}`;

    if (variante === 'portada') {
        // La portada arriba y el texto abajo, sin encimarse: un dibujo con nombres (un mapa) no
        // compite con el título
        return (
            <Link
                href={href}
                className={`simar-tarjeta-accion group flex flex-col overflow-hidden rounded-[32px] bg-simar-abismo text-white shadow-simar movil:rounded-[24px] ${ENFOQUE} ${className}`}
            >
                <div className="relative overflow-hidden aspect-[16/10] lg:aspect-auto lg:flex-1 lg:min-h-[280px]">
                    <div className="absolute inset-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.02]">
                        <PortadaNoticia noticia={noticia} prioridad={prioridad} sizes="(min-width: 1024px) 620px, 100vw" className="w-full h-full" />
                    </div>
                    {etiqueta && (
                        <span className="absolute left-5 top-5 inline-flex rounded-full bg-simar-abismo/80 backdrop-blur-md border border-white/20 px-3.5 py-1.5 text-[15px] font-bold movil:left-4 movil:top-4">
                            {etiqueta}
                        </span>
                    )}
                </div>
                <div className="p-7 md:p-9 movil:p-5">
                    <MetaNoticia noticia={noticia} claro />
                    <h3 className="mt-3 max-w-[24ch] text-[clamp(28px,2.7vw,40px)] font-extrabold leading-[1.08] tracking-[-0.025em] movil:mt-2 movil:text-[25px] movil:leading-[1.12]">
                        {noticia.titulo}
                    </h3>
                    <p className="mt-3 max-w-[56ch] text-[18px] leading-relaxed text-white/80 line-clamp-2 movil:text-[16px]">{noticia.resumen}</p>
                </div>
            </Link>
        );
    }

    if (variante === 'mosaico') {
        return (
            <Link
                href={href}
                className={`simar-tarjeta-accion group relative isolate flex flex-col justify-end overflow-hidden rounded-[28px] bg-simar-abismo text-white shadow-simar min-h-[260px] movil:min-h-[280px] movil:rounded-[22px] ${ENFOQUE} ${className}`}
            >
                <div className="absolute inset-0 -z-10 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.03]">
                    <PortadaNoticia noticia={noticia} sizes="(min-width: 1024px) 400px, 85vw" className="w-full h-full" />
                </div>
                <div aria-hidden="true" className="absolute inset-0 -z-10 bg-gradient-to-t from-simar-abismo via-simar-abismo/70 to-transparent to-[78%]" />
                <div className="p-6 movil:p-5">
                    <MetaNoticia noticia={{ ...noticia, minutos: undefined }} claro />
                    <h3 className="mt-2 max-w-[30ch] text-[22px] font-extrabold leading-[1.15] tracking-[-0.015em] line-clamp-3 movil:text-[20px]">{noticia.titulo}</h3>
                </div>
            </Link>
        );
    }

    if (variante === 'fila') {
        return (
            <Link href={href} className={`group flex items-center gap-4 md:gap-5 rounded-[22px] p-2 -m-2 transition-colors hover:bg-simar-texto/[0.04] ${ENFOQUE} ${className}`}>
                <PortadaNoticia
                    noticia={noticia}
                    sizes="160px"
                    className="w-[120px] h-[90px] md:w-[148px] md:h-[104px] flex-shrink-0 rounded-[16px] movil:w-[96px] movil:h-[80px] movil:rounded-[14px]"
                />
                <div className="min-w-0">
                    <MetaNoticia noticia={noticia} />
                    <h3 className="mt-1.5 text-[20px] font-extrabold leading-[1.2] tracking-[-0.01em] text-simar-texto line-clamp-3 group-hover:text-simar-marea-tinta transition-colors movil:text-[17px]">
                        {noticia.titulo}
                    </h3>
                </div>
            </Link>
        );
    }

    return (
        <Link
            href={href}
            className={`simar-tarjeta-accion group flex flex-col overflow-hidden rounded-[28px] border border-simar-borde bg-simar-superficie shadow-simar movil:rounded-[22px] ${ENFOQUE} ${className}`}
        >
            <PortadaNoticia noticia={noticia} prioridad={prioridad} sizes="(min-width: 1024px) 400px, 85vw" className="aspect-[16/10]" />
            <div className="flex flex-1 flex-col p-6 md:p-7 movil:p-5">
                <MetaNoticia noticia={noticia} />
                <h3 className="mt-3 text-[22px] md:text-[24px] font-extrabold leading-[1.15] tracking-[-0.015em] text-simar-texto movil:text-[20px]">{noticia.titulo}</h3>
                {!breve && <p className="mt-3 text-[17px] leading-relaxed text-simar-texto-2 line-clamp-3 movil:text-[16px]">{noticia.resumen}</p>}
                <span className="mt-auto pt-5 inline-flex items-center gap-1.5 text-[17px] font-bold text-simar-marea-tinta">
                    Leer
                    <span className="sr-only">: {noticia.titulo}</span>
                    <ArrowRight aria-hidden="true" className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5" />
                </span>
            </div>
        </Link>
    );
}

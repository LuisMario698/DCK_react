import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ExternalLink, FileCheck2, PenLine, Sigma, type LucideIcon } from 'lucide-react';
import { HITOS, minutosDeLectura, todasLasFuentes, type Noticia } from '@/lib/constants/noticias';
import { TarjetaNoticia } from './TarjetaNoticia';
import { HistoriaProyecto } from './HistoriaProyecto';

/**
 * Las partes de servidor de la página de Noticias (/[locale]/noticias). Las que se tocan (cifras,
 * mapa, historia, glosario y la lista) son componentes de cliente aparte. Los datos están en
 * lib/constants/noticias.ts.
 */

const conMinutos = (n: Noticia) => ({ ...n, minutos: minutosDeLectura(n) });

/** Antetítulo, título y una línea de texto (mismo tamaño en toda la página) */
export function EncabezadoSeccion({ id, antetitulo, titulo, texto, oscuro = false }: { id: string; antetitulo: string; titulo: string; texto?: string; oscuro?: boolean }) {
    return (
        <div className="max-w-3xl">
            <p className={`text-lg md:text-xl font-bold movil:text-[15px] ${oscuro ? 'text-simar-espuma' : 'text-simar-marea-tinta'}`}>{antetitulo}</p>
            <h2 id={id} className="mt-2 text-[clamp(34px,3.8vw,54px)] font-extrabold leading-[1.05] tracking-[-0.03em] text-balance movil:text-[30px] movil:leading-[1.1] movil:tracking-[-0.02em]">
                {titulo}
            </h2>
            {texto && <p className={`mt-3 text-xl leading-relaxed text-pretty movil:text-[17px] ${oscuro ? 'text-simar-franja-texto-2' : 'text-simar-texto-2'}`}>{texto}</p>}
        </div>
    );
}

/**
 * La portada, en mosaico: la más reciente a lo grande y tres más, sólo con foto (o dibujo) y
 * título. En celular, las tres van en un carrusel que se desliza de lado.
 */
export function PortadaNoticias({ locale, principal, siguientes }: { locale: string; principal: Noticia; siguientes: Noticia[] }) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 md:gap-6">
            <TarjetaNoticia noticia={conMinutos(principal)} locale={locale} variante="portada" etiqueta="Lo más reciente" prioridad className="lg:h-full" />
            <ul aria-label="También en las noticias (en celular, desliza de lado)" className="simar-carrusel grid sm:grid-cols-3 lg:grid-cols-2 lg:grid-rows-2 gap-5 md:gap-6">
                {siguientes.slice(0, 3).map((n, i) => (
                    <li key={n.slug} className={`flex ${i === 0 ? 'lg:col-span-2' : ''}`}>
                        <TarjetaNoticia noticia={n} locale={locale} variante="mosaico" className="w-full" />
                    </li>
                ))}
            </ul>
        </div>
    );
}

const LO_QUE_HACE: { Icono: LucideIcon; titulo: string; texto: string }[] = [
    { Icono: PenLine, titulo: 'Se firma ahí', texto: 'En la pantalla, sin hojas.' },
    { Icono: FileCheck2, titulo: 'Queda en PDF', texto: 'Guardado y listo para imprimir.' },
    { Icono: Sigma, titulo: 'Se suma solo', texto: 'Litros y kilos, al día.' },
];

const CON_QUIEN = ['ITSPP', 'DCK Conciencia y Cultura', 'SEMARNAT', 'Centro de acopio del puerto'];

/** «El proyecto»: qué es SiMAR en tres ideas, con quién se hizo y su historia, paso a paso */
export function ElProyecto({ locale }: { locale: string }) {
    return (
        <>
            <div className="mt-10 md:mt-12 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-8 lg:gap-14 items-center movil:mt-7 movil:gap-6">
                <div className="relative aspect-[4/3] rounded-[32px] overflow-hidden border border-simar-borde movil:rounded-[24px]">
                    <Image
                        src="/assets/images/img3.jpeg"
                        alt="Entrega de reconocimientos en el módulo de la CONANP, en Puerto Peñasco"
                        fill
                        sizes="(min-width: 1024px) 600px, 100vw"
                        className="object-cover"
                        style={{ objectPosition: '50% 40%' }}
                    />
                    <span className="absolute left-4 bottom-4 rounded-full simar-vidrio-fuerte px-4 py-2 text-[15px] font-bold text-simar-texto">Puerto Peñasco, Sonora</span>
                </div>
                <div>
                    <p className="text-[clamp(22px,2vw,28px)] font-bold leading-snug text-simar-texto text-pretty movil:text-[19px]">
                        SiMAR registra lo que cada embarcación entrega en el centro de acopio del puerto.
                    </p>
                    <ul className="mt-7 grid sm:grid-cols-3 gap-3 movil:mt-5">
                        {LO_QUE_HACE.map(({ Icono, titulo, texto }) => (
                            <li key={titulo} className="rounded-[22px] bg-simar-superficie border border-simar-borde p-5 movil:p-4 movil:flex movil:items-center movil:gap-4">
                                <span className="w-12 h-12 rounded-[16px] bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center flex-shrink-0">
                                    <Icono aria-hidden="true" className="w-6 h-6" />
                                </span>
                                <span className="block sm:mt-4">
                                    <span className="block text-[18px] font-extrabold leading-tight">{titulo}</span>
                                    <span className="mt-1 block text-[16px] leading-snug text-simar-texto-2">{texto}</span>
                                </span>
                            </li>
                        ))}
                    </ul>
                    <p className="mt-6 text-[15px] font-bold text-simar-texto-2">Hecho con</p>
                    <ul className="mt-2 flex flex-wrap gap-2">
                        {CON_QUIEN.map((q) => (
                            <li key={q} className="rounded-full border border-simar-borde bg-simar-superficie px-4 py-2 text-[16px] font-bold">
                                {q}
                            </li>
                        ))}
                    </ul>
                    <Link
                        href={`/${locale}?landing=3d#producto`}
                        className="mt-7 min-h-[56px] px-7 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center gap-2 transition-colors movil:min-h-[52px] movil:text-[17px]"
                    >
                        Ver cómo funciona
                        <ArrowRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                    </Link>
                </div>
            </div>

            <h3 className="mt-16 text-[24px] font-extrabold tracking-[-0.01em] movil:mt-12 movil:text-[20px]">Su historia, año por año</h3>
            <div className="mt-5">
                <HistoriaProyecto hitos={HITOS} locale={locale} />
            </div>
        </>
    );
}

/** «FAO. Las redes fantasma…» → «FAO» (quién publica la fuente) */
const quienPublica = (texto: string) => texto.split('. ')[0];

/**
 * Las fuentes: primero quién las publica (de un vistazo) y, en un desplegable cerrado, la lista
 * completa con el artículo que cita cada una (sin JavaScript).
 */
export function Fuentes({ locale }: { locale: string }) {
    const fuentes = todasLasFuentes();
    const quienes = [...new Set(fuentes.map((f) => quienPublica(f.texto)))];
    return (
        <div className="mt-8 movil:mt-6">
            <ul aria-label="Quién publica las fuentes" className="flex flex-wrap gap-2">
                {quienes.map((q) => (
                    <li key={q} className="rounded-full bg-simar-superficie border border-simar-borde px-4 py-2 text-[16px] font-bold movil:text-[15px]">
                        {q}
                    </li>
                ))}
            </ul>
            <details className="group mt-6">
                <summary className="min-h-[56px] px-6 rounded-full border-2 border-simar-campo-borde bg-simar-superficie inline-flex items-center gap-2 text-[17px] font-extrabold cursor-pointer list-none hover:bg-simar-texto/5 transition-colors [&::-webkit-details-marker]:hidden movil:min-h-[52px] movil:text-[16px]">
                    <span className="group-open:hidden">Ver las {fuentes.length} fuentes</span>
                    <span className="hidden group-open:inline">Ocultar las fuentes</span>
                    <ChevronDown aria-hidden="true" className="w-5 h-5 transition-transform group-open:rotate-180" />
                </summary>
                <ol className="mt-6 grid lg:grid-cols-2 gap-x-12">
                    {fuentes.map((f, i) => (
                        <li key={f.url} className="flex gap-4 border-t border-simar-borde py-5 movil:gap-3 movil:py-4">
                            <span className="w-8 flex-shrink-0 text-[17px] font-extrabold tabular-nums text-simar-texto-3">{i + 1}</span>
                            <div className="min-w-0">
                                <a
                                    href={f.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="inline-flex gap-1.5 text-[17px] font-bold leading-snug text-simar-texto hover:text-simar-marea-tinta hover:underline movil:text-[16px]"
                                >
                                    <span className="break-words">{f.texto}</span>
                                    <span className="sr-only">(abre en otra pestaña)</span>
                                    <ExternalLink aria-hidden="true" className="w-4 h-4 mt-1 flex-shrink-0 text-simar-marea-tinta" />
                                </a>
                                <p className="mt-1.5 text-[15px] text-simar-texto-2">
                                    En{' '}
                                    <Link href={`/${locale}/noticias/${f.articulo.slug}`} className="font-semibold text-simar-marea-tinta hover:underline">
                                        {f.articulo.titulo}
                                    </Link>
                                </p>
                            </div>
                        </li>
                    ))}
                </ol>
            </details>
        </div>
    );
}

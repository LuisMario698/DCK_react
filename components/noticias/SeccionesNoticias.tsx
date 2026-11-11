import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, ExternalLink, FileCheck2, PenLine, Sigma, type LucideIcon } from 'lucide-react';
import { HITOS, todasLasFuentes } from '@/lib/constants/noticias';
import { FOTOS } from '@/lib/constants/fotos';
import { MarcaNueva, RecordarVisita } from '@/components/landing/MarcaNueva';
import { TarjetaEditorial, type DatosEditorial } from './TarjetaEditorial';
import { HistoriaProyecto } from './HistoriaProyecto';

/**
 * Las partes de servidor de la página de Noticias (/[locale]/noticias). Las que se tocan (cifras,
 * mapa, historia, glosario y la lista) son componentes de cliente aparte. Los datos están en
 * lib/constants/noticias.ts.
 */

/**
 * El encabezado de cada sección, como el índice de una revista: número y nombre en versalitas con
 * una raya fina, y el título grande. Sube y se enfoca al entrar (`n-entra`, atado al scroll).
 */
export function EncabezadoSeccion({
    id,
    numero,
    antetitulo,
    titulo,
    texto,
    oscuro = false,
}: {
    id: string;
    /** «01», «02»… el lugar de la sección en la página */
    numero?: string;
    antetitulo: string;
    titulo: string;
    texto?: string;
    oscuro?: boolean;
}) {
    return (
        <div className="n-entra max-w-3xl">
            <p className={`inline-flex items-center gap-3 text-[15px] font-extrabold uppercase tracking-[0.14em] ${oscuro ? 'text-simar-espuma' : 'text-simar-marea-tinta'}`}>
                {numero && <span className="tabular-nums">{numero}</span>}
                {numero && <span aria-hidden="true" className="w-10 h-px bg-current opacity-50" />}
                <span>{antetitulo}</span>
            </p>
            <h2 id={id} className="mt-3 font-titular text-[clamp(38px,4.2vw,62px)] font-semibold leading-[1.02] tracking-[-0.025em] text-balance movil:text-[34px] movil:leading-[1.06]">
                {titulo}
            </h2>
            {texto && <p className={`mt-3 text-xl leading-relaxed text-pretty movil:text-[17px] ${oscuro ? 'text-simar-franja-texto-2' : 'text-simar-texto-2'}`}>{texto}</p>}
        </div>
    );
}

/**
 * La portada de la página, en mosaico editorial (como «Lo último del mar» de la landing): la más
 * reciente en grande (2 × 2) y cuatro chicas. Cada tarjeta entra en escalonado (`n-entra-hijos`) y
 * su portada se descubre de arriba abajo; «Nueva» marca lo publicado desde la última visita.
 */
export function PortadaNoticias({ locale, notas }: { locale: string; notas: DatosEditorial[] }) {
    const [principal, ...siguientes] = notas;
    if (!principal) return null;
    return (
        <ul className="n-entra-hijos grid grid-cols-2 lg:grid-cols-4 gap-5 movil:gap-3">
            <li className="col-span-2 lg:row-span-2">
                <TarjetaEditorial nota={principal} locale={locale} variante="grande" etiqueta="Lo más reciente" prioridad insignia={<MarcaNueva fecha={principal.fecha} />} />
            </li>
            {siguientes.slice(0, 4).map((n) => (
                <li key={n.slug} className="flex">
                    <TarjetaEditorial nota={n} locale={locale} insignia={<MarcaNueva fecha={n.fecha} />} />
                </li>
            ))}
            <RecordarVisita />
        </ul>
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
                        href={`/${locale}#como-funciona`}
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
            <ul aria-label="Quién publica las fuentes" className="n-entra flex flex-wrap gap-2">
                {quienes.map((q) => (
                    <li key={q} className="rounded-full bg-simar-superficie border border-simar-borde px-4 py-2 text-[16px] font-bold movil:text-[15px]">
                        {q}
                    </li>
                ))}
            </ul>
            <details className="n-desplegable group mt-6">
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

            {/* Las fotos que no son de SiMAR: quién las tomó y con qué licencia */}
            <details className="n-desplegable group/fotos mt-4">
                <summary className="min-h-[56px] px-6 rounded-full border-2 border-simar-campo-borde bg-simar-superficie inline-flex items-center gap-2 text-[17px] font-extrabold cursor-pointer list-none hover:bg-simar-texto/5 transition-colors [&::-webkit-details-marker]:hidden movil:min-h-[52px] movil:text-[16px]">
                    <span className="group-open/fotos:hidden">Ver los créditos de las {Object.keys(FOTOS).length} fotos</span>
                    <span className="hidden group-open/fotos:inline">Ocultar los créditos</span>
                    <ChevronDown aria-hidden="true" className="w-5 h-5 transition-transform group-open/fotos:rotate-180" />
                </summary>
                <ul className="mt-6 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10">
                    {Object.values(FOTOS).map((foto) => (
                        <li key={foto.src} className="flex gap-4 border-t border-simar-borde py-4">
                            <span className="relative w-16 h-16 flex-shrink-0 overflow-hidden rounded-[12px] simar-cargando">
                                <Image src={foto.src} alt="" fill sizes="64px" className="object-cover" />
                            </span>
                            <span className="min-w-0">
                                <span className="block text-[16px] font-bold leading-snug">{foto.que}</span>
                                <a href={foto.credito.pagina} target="_blank" rel="noopener noreferrer" className="block text-[15px] leading-snug text-simar-texto-2 hover:text-simar-marea-tinta hover:underline">
                                    {foto.credito.autor}
                                    <span className="sr-only"> (abre en otra pestaña)</span>
                                </a>
                                {foto.credito.licenciaUrl ? (
                                    <a href={foto.credito.licenciaUrl} target="_blank" rel="noopener noreferrer" className="text-[14px] font-bold text-simar-texto-2 underline decoration-simar-borde underline-offset-4 hover:text-simar-texto">
                                        {foto.credito.licencia}
                                        <span className="sr-only"> (abre en otra pestaña)</span>
                                    </a>
                                ) : (
                                    <span className="text-[14px] font-bold text-simar-texto-2">{foto.credito.licencia}</span>
                                )}
                            </span>
                        </li>
                    ))}
                </ul>
                <p className="mt-4 max-w-3xl text-[15px] leading-relaxed text-simar-texto-2">
                    Todas salen de Wikimedia Commons. Las de licencia CC BY-SA se muestran recortadas y reducidas (adaptadas) y conservan su licencia. Las demás fotos son de SiMAR.
                </p>
            </details>
        </div>
    );
}

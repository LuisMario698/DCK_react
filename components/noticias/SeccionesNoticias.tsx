import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, ChevronDown, Droplet, ExternalLink, Fish, Ship, Waypoints, type LucideIcon } from 'lucide-react';
import { GLOSARIO, HITOS, TEMAS, minutosDeLectura, noticiaPorSlug, todasLasFuentes, type Noticia } from '@/lib/constants/noticias';
import { TarjetaNoticia } from './TarjetaNoticia';

/**
 * Las partes de la página de Noticias (/[locale]/noticias). Todas son de servidor: sólo el filtro
 * de la lista (ListaNoticias) baja JavaScript. Los datos están en lib/constants/noticias.ts.
 */

const conMinutos = (n: Noticia) => ({ ...n, minutos: minutosDeLectura(n) });

/** Antetítulo, título y texto de cada sección (mismo tamaño en toda la página) */
export function EncabezadoSeccion({ id, antetitulo, titulo, texto, oscuro = false }: { id: string; antetitulo: string; titulo: string; texto?: string; oscuro?: boolean }) {
    return (
        <div className="max-w-3xl">
            <p className={`text-lg md:text-xl font-bold movil:text-[15px] ${oscuro ? 'text-simar-espuma' : 'text-simar-marea-tinta'}`}>{antetitulo}</p>
            <h2 id={id} className="mt-3 text-[clamp(34px,3.8vw,56px)] font-extrabold leading-[1.05] tracking-[-0.03em] movil:mt-2 movil:text-[30px] movil:leading-[1.1] movil:tracking-[-0.02em]">
                {titulo}
            </h2>
            {texto && <p className={`mt-4 text-xl leading-relaxed movil:mt-3 movil:text-[17px] ${oscuro ? 'text-simar-franja-texto-2' : 'text-simar-texto-2'}`}>{texto}</p>}
        </div>
    );
}

/** La portada: la noticia más reciente a lo grande y, al lado, las que siguen */
export function PortadaNoticias({ locale, principal, siguientes }: { locale: string; principal: Noticia; siguientes: Noticia[] }) {
    return (
        <div className="grid lg:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)] gap-8 lg:gap-12 items-start">
            <TarjetaNoticia noticia={conMinutos(principal)} locale={locale} variante="portada" etiqueta="Lo más reciente" prioridad />
            <div>
                <h3 className="text-[17px] font-extrabold text-simar-texto-2">También en las noticias</h3>
                <ul className="mt-3 divide-y divide-simar-borde">
                    {siguientes.map((n) => (
                        <li key={n.slug} className="py-5 first:pt-2">
                            <TarjetaNoticia noticia={conMinutos(n)} locale={locale} variante="fila" />
                        </li>
                    ))}
                </ul>
            </div>
        </div>
    );
}

const ICONO_TEMA: Record<string, LucideIcon> = { aceite: Droplet, basura: Ship, redes: Waypoints, mar: Fish };

/** «La problemática»: cuatro temas, cada uno con su cifra y los artículos que lo explican */
export function LaProblematica({ locale }: { locale: string }) {
    return (
        <ul className="mt-12 grid md:grid-cols-2 gap-5 md:gap-6 movil:mt-8 movil:gap-4">
            {TEMAS.map((t) => {
                const Icono = ICONO_TEMA[t.id] ?? Droplet;
                const articulos = t.articulos.map(noticiaPorSlug).filter((n): n is Noticia => n !== null);
                return (
                    <li key={t.id} id={`tema-${t.id}`} className="scroll-mt-28 flex flex-col rounded-[28px] bg-simar-superficie border border-simar-borde shadow-simar p-7 md:p-9 movil:rounded-[22px] movil:p-6">
                        <p className="flex items-center gap-3 text-[17px] font-bold text-simar-marea-tinta">
                            <span className="w-11 h-11 rounded-[14px] bg-simar-marea-suave flex items-center justify-center">
                                <Icono aria-hidden="true" className="w-[22px] h-[22px]" />
                            </span>
                            {t.tema}
                        </p>
                        <h3 className="mt-5 text-[28px] font-extrabold leading-[1.12] tracking-[-0.02em] movil:mt-4 movil:text-[23px]">{t.titulo}</h3>
                        <p className="mt-3 text-[18px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{t.texto}</p>
                        <p className="mt-6 border-t border-simar-borde pt-5 movil:mt-5 movil:pt-4">
                            <span className="block whitespace-nowrap text-[clamp(32px,3vw,42px)] font-extrabold leading-none tracking-[-0.025em] tabular-nums text-simar-texto movil:text-[30px]">{t.cifra}</span>
                            <span className="mt-2 block text-[15px] leading-snug text-simar-texto-2">{t.nota}</span>
                        </p>
                        <ul className="mt-6 space-y-1 movil:mt-5">
                            {articulos.map((a) => (
                                <li key={a.slug}>
                                    <Link
                                        href={`/${locale}/noticias/${a.slug}`}
                                        className="group -mx-3 px-3 min-h-[52px] py-2.5 rounded-[14px] flex items-center justify-between gap-3 text-[17px] font-bold leading-snug text-simar-texto hover:bg-simar-texto/[0.04] transition-colors focus-visible:outline-3 focus-visible:outline-simar-golfo movil:text-[16px]"
                                    >
                                        {a.titulo}
                                        <ArrowRight aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-simar-marea-tinta transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </li>
                );
            })}
        </ul>
    );
}

/** «El proyecto»: qué es SiMAR, quién lo hace y su historia, con las noticias del proyecto */
export function ElProyecto({ locale, notas }: { locale: string; notas: Noticia[] }) {
    return (
        <>
            <div className="mt-12 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 lg:gap-16 items-start movil:mt-8 movil:gap-8">
                <div>
                    <div className="relative aspect-[4/3] rounded-[28px] overflow-hidden border border-simar-borde movil:rounded-[22px]">
                        <Image
                            src="/assets/images/img3.jpeg"
                            alt="Entrega de reconocimientos en el módulo de la CONANP, en Puerto Peñasco"
                            fill
                            sizes="(min-width: 1024px) 600px, 100vw"
                            className="object-cover"
                            style={{ objectPosition: '50% 40%' }}
                        />
                    </div>
                    <div className="mt-8 space-y-4 text-[19px] leading-relaxed text-simar-texto-2 movil:mt-6 movil:text-[17px]">
                        <p>
                            <strong className="text-simar-texto">SiMAR</strong> (Sistema de Manejo Ambiental de Residuos Marinos) digitaliza los manifiestos del centro de acopio del recinto portuario de Puerto Peñasco: lo que cada embarcación pesquera entrega, firmado ahí mismo y guardado en PDF.
                        </p>
                        <p>
                            Nació como residencia profesional del Instituto Tecnológico Superior de Puerto Peñasco (ITSPP), para DCK Conciencia y Cultura, con la SEMARNAT y con quien opera el centro de acopio desde hace 25 años.
                        </p>
                    </div>
                    <Link
                        href={`/${locale}?landing=3d#producto`}
                        className="mt-7 min-h-[56px] px-7 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center gap-2 transition-colors movil:min-h-[52px] movil:text-[17px]"
                    >
                        Ver cómo funciona
                        <ArrowRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                    </Link>
                </div>

                {/* La historia, de arriba abajo */}
                <div>
                    <h3 className="text-[17px] font-extrabold text-simar-texto-2">La historia</h3>
                    <ol className="mt-5 relative">
                        {HITOS.map((h, i) => {
                            const ultimo = i === HITOS.length - 1;
                            const contenido = (
                                <>
                                    <span className="block text-[15px] font-bold text-simar-marea-tinta">{h.fecha}</span>
                                    <span className="mt-1 block text-[21px] font-extrabold leading-snug tracking-[-0.01em] text-simar-texto movil:text-[19px]">{h.titulo}</span>
                                    <span className="mt-1.5 block text-[17px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{h.texto}</span>
                                    {h.articulo && (
                                        <span className="mt-2 inline-flex items-center gap-1.5 text-[16px] font-bold text-simar-marea-tinta">
                                            Leer la noticia
                                            <ArrowRight aria-hidden="true" className="w-4 h-4 transition-transform group-hover:translate-x-0.5" />
                                        </span>
                                    )}
                                </>
                            );
                            return (
                                <li key={h.titulo} className="relative pl-10 pb-8 last:pb-0 movil:pl-9">
                                    {!ultimo && <span aria-hidden="true" className="absolute left-[11px] top-7 bottom-0 w-[2px] bg-simar-borde" />}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute left-0 top-1 w-6 h-6 rounded-full border-[3px] ${ultimo ? 'bg-simar-marea border-simar-marea' : 'bg-simar-superficie border-simar-marea'}`}
                                    />
                                    {h.articulo ? (
                                        <Link
                                            href={`/${locale}/noticias/${h.articulo}`}
                                            className="group block -m-2 p-2 rounded-[16px] hover:bg-simar-texto/[0.04] transition-colors focus-visible:outline-3 focus-visible:outline-simar-golfo"
                                        >
                                            {contenido}
                                        </Link>
                                    ) : (
                                        <div>{contenido}</div>
                                    )}
                                </li>
                            );
                        })}
                    </ol>
                </div>
            </div>

            <h3 className="mt-16 text-[17px] font-extrabold text-simar-texto-2 movil:mt-12">Noticias del proyecto</h3>
            <ul aria-label="Noticias del proyecto (en celular, desliza de lado)" className="simar-carrusel mt-4 grid md:grid-cols-3 gap-5 md:gap-6">
                {notas.map((n) => (
                    <li key={n.slug} className="flex">
                        <TarjetaNoticia noticia={conMinutos(n)} locale={locale} className="w-full" />
                    </li>
                ))}
            </ul>
        </>
    );
}

/** Las palabras que más se repiten */
export function Glosario() {
    return (
        <dl className="mt-12 grid sm:grid-cols-2 lg:grid-cols-3 gap-x-10 gap-y-8 movil:mt-8 movil:gap-y-6">
            {GLOSARIO.map((g) => (
                <div key={g.termino} className="border-t-2 border-simar-texto pt-4">
                    <dt className="text-[20px] font-extrabold tracking-[-0.01em] movil:text-[18px]">{g.termino}</dt>
                    <dd className="mt-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{g.definicion}</dd>
                </div>
            ))}
        </dl>
    );
}

/** Una fuente, con el artículo que la cita */
function Fuente({ f, i, locale }: { f: ReturnType<typeof todasLasFuentes>[number]; i: number; locale: string }) {
    return (
        <li className="flex gap-4 border-t border-simar-borde py-5 movil:gap-3 movil:py-4">
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
    );
}

/** Todas las fuentes: las primeras a la vista y las demás en un desplegable (sin JavaScript) */
export function Fuentes({ locale }: { locale: string }) {
    const fuentes = todasLasFuentes();
    const VISIBLES = 6;
    const lista = 'grid lg:grid-cols-2 gap-x-12';
    return (
        <div className="mt-10 movil:mt-6">
            <ol className={lista}>
                {fuentes.slice(0, VISIBLES).map((f, i) => (
                    <Fuente key={f.url} f={f} i={i} locale={locale} />
                ))}
            </ol>
            {fuentes.length > VISIBLES && (
                <details className="group">
                    <summary className="mt-4 min-h-[52px] px-6 rounded-full border-2 border-simar-campo-borde inline-flex items-center gap-2 text-[17px] font-bold cursor-pointer list-none hover:bg-simar-texto/5 transition-colors [&::-webkit-details-marker]:hidden movil:min-h-[48px] movil:text-[16px]">
                        <span className="group-open:hidden">Ver las {fuentes.length - VISIBLES} fuentes que faltan</span>
                        <span className="hidden group-open:inline">Ocultar las demás fuentes</span>
                        <ChevronDown aria-hidden="true" className="w-5 h-5 transition-transform group-open:rotate-180" />
                    </summary>
                    <ol start={VISIBLES + 1} className={`${lista} mt-4`}>
                        {fuentes.slice(VISIBLES).map((f, i) => (
                            <Fuente key={f.url} f={f} i={i + VISIBLES} locale={locale} />
                        ))}
                    </ol>
                </details>
            )}
        </div>
    );
}

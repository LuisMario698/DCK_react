import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ExternalLink, Info } from 'lucide-react';
import { fechaNoticia, minutosDeLectura, noticiaPorSlug, relacionadas, vecinas } from '@/lib/constants/noticias';
import { hoyPuerto } from '@/lib/utils/fechas';
import { tituloPantalla } from '@/lib/constants/titulo';
import { textoCredito } from '@/lib/constants/fotos';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { PortadaNoticia } from '@/components/noticias/PortadaNoticia';
import { FotoNota } from '@/components/noticias/FotoNota';
import { previaDe } from '@/lib/constants/previas';
import { TarjetaEditorial, PUNTO_TEMA } from '@/components/noticias/TarjetaEditorial';
import { datosEditorial } from '@/components/noticias/datosEditorial';
import { MarcaNueva } from '@/components/landing/MarcaNueva';
import { letraTitular } from '@/components/noticias/letraTitular';
import { BotonCompartir } from '@/components/noticias/BotonCompartir';
import { BotonAjustesLectura } from '@/components/noticias/PanelLectura';
import { LeerEnVoz } from '@/components/noticias/LeerEnVoz';
import { IslaProveedor } from '@/components/isla/islaTienda';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const n = noticiaPorSlug(slug);
    return n
        ? { title: tituloPantalla(n.titulo), description: n.resumen, openGraph: { title: n.titulo, description: n.resumen, images: n.imagen ? [n.imagen.src] : undefined } }
        : { title: tituloPantalla('Noticias') };
}

/**
 * Una nota, para leerla con calma (como la de un medio):
 *  - arriba, el tema (lleva al archivo de ese tema), el titular en letra de periódico, la entrada y
 *    la firma (Redacción SiMAR, fecha, lugar y minutos) con «Escuchar» (la voz del navegador la lee
 *    y marca el párrafo), «Letra» (los ajustes de lectura) y «Compartir»;
 *  - la foto a lo ancho, con lo que se ve y su crédito;
 *  - el texto a una columna de ~65 caracteres, con letra capital; «El dato» destacado; las fotos;
 *    un cuadrito al final; las fuentes numeradas y «Sobre esta nota»;
 *  - la anterior y la siguiente, y «Sigue leyendo».
 * Al bajar, el título pasa a la barra de arriba. Lo que se lee en voz alta lleva `data-leer`.
 */
export default async function NoticiaPage({ params }: Props) {
    const { locale, slug } = await params;
    const n = noticiaPorSlug(slug);
    if (!n) notFound();
    const { anterior, siguiente } = vecinas(n);
    const hoy = hoyPuerto();
    const otras = relacionadas(n).map((o) => datosEditorial(o, hoy));
    const [entrada, ...parrafos] = n.cuerpo;
    const minutos = minutosDeLectura(n);
    const archivoDelTema = `/${locale}/noticias?tema=${encodeURIComponent(n.categoria)}#todas`;
    const fin = <span aria-hidden="true" className="ml-2 inline-block w-[0.55em] h-[0.55em] rounded-[2px] bg-simar-marea align-baseline" />;

    return (
        <IslaProveedor>
            <div className={`simar-landing n-pagina ${letraTitular.variable} min-h-screen bg-simar-papel font-sans text-simar-texto antialiased`}>
                <EncabezadoNoticias locale={locale} enArticulo nota={{ tema: n.categoria, titulo: n.titulo }} />
                <main className="px-6 pt-10 pb-24 md:pt-16 md:pb-32 movil:px-5 movil:pt-6 movil:pb-16">
                    <article id="nota" className="max-w-[1180px] mx-auto">
                        <header className="n-llega max-w-[780px] mx-auto">
                            <p className="flex flex-wrap items-center gap-x-3 gap-y-1 text-[15px] font-extrabold uppercase tracking-[0.12em] movil:gap-x-2 movil:text-[13px] movil:tracking-[0.07em]">
                                <Link href={archivoDelTema} className="inline-flex items-center gap-2 text-simar-texto hover:text-simar-marea-tinta hover:underline underline-offset-4">
                                    <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${PUNTO_TEMA[n.categoria]}`} />
                                    {n.categoria}
                                </Link>
                                <span aria-hidden="true" className="text-simar-texto-3">
                                    ·
                                </span>
                                <span className="text-simar-texto-2">{n.explica ? 'Para entender' : 'Noticia'}</span>
                            </p>
                            <h1
                                id="titulo-nota"
                                data-leer
                                className="mt-4 font-titular text-[clamp(42px,5.2vw,72px)] font-semibold leading-[1.02] tracking-[-0.025em] text-balance movil:mt-3 movil:text-[36px] movil:leading-[1.06]"
                            >
                                {n.titulo}
                            </h1>
                            <p data-leer className="mt-6 text-[22px] md:text-[25px] leading-[1.5] text-simar-texto-2 text-pretty movil:mt-4 movil:text-[19px]">
                                {n.resumen}
                            </p>

                            {/* La firma y lo que se puede hacer con la nota */}
                            <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-5 border-y border-simar-borde py-5 movil:mt-6 movil:py-4">
                                <div className="flex items-center gap-4 min-w-0">
                                    <span className="w-[52px] h-[52px] flex-shrink-0 rounded-full bg-simar-superficie ring-1 ring-simar-borde flex items-center justify-center">
                                        <LogoSimar variante="simbolo" tamano={32} />
                                    </span>
                                    <div className="min-w-0">
                                        <p className="text-[17px] font-extrabold leading-tight">Redacción SiMAR</p>
                                        <p className="mt-1 text-[15px] leading-snug text-simar-texto-2">
                                            <time dateTime={n.fecha}>{fechaNoticia(n)}</time>
                                            <span aria-hidden="true"> · </span>
                                            Puerto Peñasco, Sonora
                                            <span aria-hidden="true"> · </span>
                                            {minutos} min de lectura
                                        </p>
                                    </div>
                                </div>
                                <div className="flex flex-wrap items-center gap-2">
                                    <LeerEnVoz />
                                    <BotonAjustesLectura className="ring-2 ring-inset ring-simar-campo-borde">
                                        <span>Letra</span>
                                    </BotonAjustesLectura>
                                    <BotonCompartir titulo={n.titulo} texto={n.resumen} />
                                </div>
                            </div>
                        </header>

                        <figure className="mt-10 movil:mt-6">
                            {/* La foto no se descubre ni salta: en su lugar (el mismo del esqueleto) aparece al
                                instante difuminada y se enfoca cuando de verdad llegó (FotoNota) */}
                            {n.imagen ? (
                                <FotoNota
                                    src={n.imagen.src}
                                    alt={n.imagen.alt}
                                    posicion={n.imagen.posicion}
                                    previa={previaDe(n.imagen.src)}
                                    prioridad
                                    sizes="(min-width: 1180px) 1180px, 100vw"
                                    className="aspect-[16/9] rounded-[28px] movil:aspect-[4/3] movil:-mx-5 movil:rounded-none"
                                />
                            ) : (
                                <PortadaNoticia
                                    noticia={n}
                                    sizes="(min-width: 1180px) 1180px, 100vw"
                                    className="aspect-[16/9] rounded-[28px] movil:aspect-[4/3] movil:-mx-5 movil:rounded-none"
                                />
                            )}
                            {n.imagen && (
                                <figcaption className="n-pie-llega mt-3 max-w-[780px] mx-auto flex flex-wrap justify-between gap-x-6 gap-y-1 text-[15px] leading-snug text-simar-texto-2">
                                    <span>{n.imagen.alt}.</span>
                                    {n.imagen.credito ? (
                                        <a href={n.imagen.credito.pagina} target="_blank" rel="noopener noreferrer" className="hover:text-simar-texto hover:underline">
                                            {textoCredito(n.imagen.credito)}
                                            <span className="sr-only"> (abre en otra pestaña)</span>
                                        </a>
                                    ) : (
                                        <span>Foto: SiMAR</span>
                                    )}
                                </figcaption>
                            )}
                        </figure>

                        {/* El texto: una columna cómoda (unos 65 caracteres por renglón) */}
                        <div className="max-w-[700px] mx-auto mt-12 text-[20px] md:text-[21px] leading-[1.78] text-simar-texto movil:mt-8 movil:text-[18px] movil:leading-[1.72]">
                            <p data-leer className="n-capital text-[23px] md:text-[25px] leading-[1.62] text-pretty movil:text-[20px]">
                                {entrada}
                                {parrafos.length === 0 && !n.dato && fin}
                            </p>

                            {n.dato && (
                                <aside aria-label="El dato" className="my-12 border-l-4 border-simar-marea pl-7 py-1 movil:my-9 movil:pl-5">
                                    <p className="text-[14px] font-extrabold uppercase tracking-[0.14em] text-simar-marea-tinta">El dato</p>
                                    <p className="mt-2 font-titular text-[clamp(56px,6.6vw,92px)] font-semibold leading-none tracking-[-0.03em] tabular-nums text-simar-texto movil:text-[50px]">
                                        {n.dato.cifra}
                                    </p>
                                    <p data-leer className="mt-3 text-[20px] leading-relaxed text-simar-texto-2 movil:text-[18px]">
                                        {n.dato.texto}
                                    </p>
                                </aside>
                            )}

                            <div className="mt-7 space-y-7 movil:mt-6 movil:space-y-6">
                                {parrafos.map((p, i) => (
                                    <p key={i} data-leer className="text-pretty">
                                        {p}
                                        {i === parrafos.length - 1 && fin}
                                    </p>
                                ))}
                            </div>

                            {n.galeria && n.galeria.length > 0 && (
                                <div className={`mt-12 grid gap-5 movil:mt-9 ${n.galeria.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                                    {n.galeria.map((g) => (
                                        <figure key={g.src}>
                                            <Image
                                                src={g.src}
                                                alt={g.alt}
                                                width={g.ancho}
                                                height={g.alto}
                                                sizes={n.galeria!.length > 1 ? '(min-width: 700px) 340px, 100vw' : '(min-width: 700px) 700px, 100vw'}
                                                className="w-full h-auto rounded-[20px] border border-simar-borde"
                                            />
                                            <figcaption className="mt-2.5 text-[15px] leading-snug text-simar-texto-2">{g.pie}</figcaption>
                                        </figure>
                                    ))}
                                </div>
                            )}

                            {n.fuentes && n.fuentes.length > 0 && (
                                <section aria-labelledby="fuentes-nota" className="mt-14 border-t-2 border-simar-texto pt-6 movil:mt-11">
                                    <h2 id="fuentes-nota" className="text-[15px] font-extrabold uppercase tracking-[0.14em]">
                                        Fuentes de esta nota
                                    </h2>
                                    <ol className="mt-4 space-y-4">
                                        {n.fuentes.map((f, i) => (
                                            <li key={f.texto} className="flex gap-4 text-[17px] leading-relaxed text-simar-texto-2 movil:gap-3 movil:text-[16px]">
                                                <span className="w-7 flex-shrink-0 font-titular text-[22px] font-semibold leading-[1.2] tabular-nums text-simar-texto-3">{i + 1}</span>
                                                {f.url ? (
                                                    <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1.5 font-semibold text-simar-marea-tinta hover:underline">
                                                        <span>{f.texto}</span>
                                                        <span className="sr-only">(abre en otra pestaña)</span>
                                                        <ExternalLink aria-hidden="true" className="w-4 h-4 mt-1.5 flex-shrink-0" />
                                                    </a>
                                                ) : (
                                                    <span>{f.texto}</span>
                                                )}
                                            </li>
                                        ))}
                                    </ol>
                                </section>
                            )}

                            <aside aria-label="Sobre esta nota" className="mt-10 flex gap-4 rounded-[22px] bg-simar-superficie ring-1 ring-simar-borde p-6 movil:p-5">
                                <Info aria-hidden="true" className="w-6 h-6 flex-shrink-0 mt-0.5 text-simar-marea-tinta" />
                                <div className="text-[16px] leading-relaxed text-simar-texto-2">
                                    <p className="font-extrabold text-simar-texto">Sobre esta nota</p>
                                    <p className="mt-1">
                                        La escribió la redacción de SiMAR, el sistema de registro de residuos del puerto de Puerto Peñasco, con base en las fuentes de arriba. Cada cifra lleva la suya.
                                    </p>
                                    <Link href={archivoDelTema} className="mt-3 inline-flex items-center gap-1.5 min-h-[44px] font-bold text-simar-marea-tinta hover:underline">
                                        Más de {n.categoria}
                                        <ArrowRight aria-hidden="true" className="w-4 h-4" />
                                    </Link>
                                </div>
                            </aside>
                        </div>
                    </article>

                    {/* La anterior y la siguiente */}
                    {(anterior || siguiente) && (
                        <nav aria-label="Otras noticias" className="max-w-[780px] mx-auto mt-16 grid sm:grid-cols-2 gap-4 movil:mt-12">
                            {anterior ? (
                                <Link
                                    href={`/${locale}/noticias/${anterior.slug}`}
                                    className="simar-tarjeta-accion group rounded-[22px] ring-1 ring-simar-borde bg-simar-superficie p-6 flex flex-col gap-2 movil:p-5"
                                >
                                    <span className="inline-flex items-center gap-1.5 text-[14px] font-extrabold uppercase tracking-[0.12em] text-simar-texto-2">
                                        <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                                        Anterior
                                    </span>
                                    <span className="font-titular text-[22px] font-semibold leading-[1.18] line-clamp-3 group-hover:text-simar-marea-tinta transition-colors">{anterior.titulo}</span>
                                </Link>
                            ) : (
                                <span className="max-sm:hidden" />
                            )}
                            {siguiente && (
                                <Link
                                    href={`/${locale}/noticias/${siguiente.slug}`}
                                    className="simar-tarjeta-accion group rounded-[22px] ring-1 ring-simar-borde bg-simar-superficie p-6 flex flex-col gap-2 sm:text-right sm:items-end movil:p-5"
                                >
                                    <span className="inline-flex items-center gap-1.5 text-[14px] font-extrabold uppercase tracking-[0.12em] text-simar-texto-2">
                                        Siguiente
                                        <ArrowRight aria-hidden="true" className="w-4 h-4" />
                                    </span>
                                    <span className="font-titular text-[22px] font-semibold leading-[1.18] line-clamp-3 group-hover:text-simar-marea-tinta transition-colors">{siguiente.titulo}</span>
                                </Link>
                            )}
                        </nav>
                    )}

                    <section aria-labelledby="mas-noticias" className="max-w-[1248px] mx-auto mt-24 movil:mt-16">
                        <div className="flex flex-wrap items-end justify-between gap-4 border-t-2 border-simar-texto pt-6">
                            <h2 id="mas-noticias" className="font-titular text-[clamp(34px,3.4vw,48px)] font-semibold tracking-[-0.02em] movil:text-[30px]">
                                Sigue leyendo
                            </h2>
                            <Link href={`/${locale}/noticias`} className="inline-flex items-center gap-1.5 min-h-[48px] text-[17px] font-bold text-simar-marea-tinta hover:underline">
                                Todas las noticias
                                <ArrowRight aria-hidden="true" className="w-[18px] h-[18px]" />
                            </Link>
                        </div>
                        <ul className="n-entra-hijos mt-8 grid grid-cols-2 md:grid-cols-3 gap-5 md:gap-6 movil:mt-5 movil:gap-3">
                            {otras.map((o, i) => (
                                <li key={o.slug} className={`flex ${i === 2 ? 'max-md:hidden' : ''}`}>
                                    <TarjetaEditorial nota={o} locale={locale} insignia={<MarcaNueva fecha={o.fecha} />} />
                                </li>
                            ))}
                        </ul>
                    </section>
                </main>
            </div>
        </IslaProveedor>
    );
}

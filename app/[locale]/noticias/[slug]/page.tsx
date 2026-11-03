import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, ArrowRight, ChevronRight, ExternalLink } from 'lucide-react';
import { minutosDeLectura, noticiaPorSlug, relacionadas, vecinas } from '@/lib/constants/noticias';
import { tituloPantalla } from '@/lib/constants/titulo';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { PortadaNoticia } from '@/components/noticias/PortadaNoticia';
import { MetaNoticia, TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';
import { BotonCompartir } from '@/components/noticias/BotonCompartir';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const n = noticiaPorSlug(slug);
    return n
        ? { title: tituloPantalla(n.titulo), description: n.resumen, openGraph: { title: n.titulo, description: n.resumen, images: n.imagen ? [n.imagen.src] : undefined } }
        : { title: tituloPantalla('Noticias') };
}

/**
 * Un artículo: encabezado, portada, el texto a una columna cómoda de leer (el primer párrafo más
 * grande y la cifra principal destacada), fotos, fuentes, la anterior y la siguiente, y otras del
 * mismo tema.
 */
export default async function NoticiaPage({ params }: Props) {
    const { locale, slug } = await params;
    const n = noticiaPorSlug(slug);
    if (!n) notFound();
    const { anterior, siguiente } = vecinas(n);
    const otras = relacionadas(n);
    const [entrada, ...parrafos] = n.cuerpo;

    return (
        <div className="simar-landing min-h-screen bg-simar-papel font-sans text-simar-texto antialiased">
            <EncabezadoNoticias locale={locale} enArticulo />
            <main className="px-6 pt-10 pb-24 md:pt-14 md:pb-32 movil:px-5 movil:pt-6 movil:pb-16">
                <article className="max-w-[1080px] mx-auto">
                    <header className="max-w-[760px] mx-auto">
                        <nav aria-label="Estás en" className="text-[15px] font-bold">
                            <ol className="flex flex-wrap items-center gap-1.5 text-simar-texto-2">
                                <li>
                                    <Link href={`/${locale}/noticias`} className="text-simar-marea-tinta hover:underline">
                                        Noticias
                                    </Link>
                                </li>
                                <li aria-hidden="true">
                                    <ChevronRight className="w-4 h-4" />
                                </li>
                                <li aria-current="page">{n.categoria}</li>
                            </ol>
                        </nav>
                        <h1 className="mt-4 text-[clamp(36px,4.6vw,60px)] font-extrabold leading-[1.06] tracking-[-0.03em] movil:mt-3 movil:text-[30px] movil:leading-[1.12] movil:tracking-[-0.015em]">
                            {n.titulo}
                        </h1>
                        <p className="mt-5 text-xl md:text-[23px] leading-relaxed text-simar-texto-2 movil:mt-4 movil:text-[18px]">{n.resumen}</p>
                        <div className="mt-6 flex flex-wrap items-center justify-between gap-4 border-y border-simar-borde py-4 movil:mt-5 movil:py-3">
                            <MetaNoticia noticia={{ ...n, minutos: minutosDeLectura(n) }} />
                            <BotonCompartir titulo={n.titulo} texto={n.resumen} />
                        </div>
                    </header>

                    <PortadaNoticia noticia={n} prioridad sizes="(min-width: 1080px) 1080px, 100vw" className="mt-10 aspect-[16/9] rounded-[32px] movil:mt-6 movil:aspect-[4/3] movil:rounded-[22px]" />

                    <div className="max-w-[700px] mx-auto mt-12 text-[19px] md:text-[21px] leading-[1.7] text-simar-texto movil:mt-8 movil:text-[17px]">
                        <p className="text-[22px] md:text-[25px] leading-[1.55] font-medium tracking-[-0.005em] movil:text-[19px]">{entrada}</p>

                        {n.dato && (
                            <aside aria-label="El dato" className="my-10 rounded-[28px] bg-simar-superficie border border-simar-borde p-7 md:p-9 movil:my-8 movil:p-6 movil:rounded-[22px]">
                                <p className="text-[clamp(48px,6vw,80px)] font-extrabold leading-none tracking-[-0.035em] tabular-nums text-simar-marea-tinta movil:text-[44px]">
                                    {n.dato.cifra}
                                </p>
                                <p className="mt-3 text-[19px] leading-relaxed text-simar-texto-2 movil:text-[17px]">{n.dato.texto}</p>
                            </aside>
                        )}

                        <div className="space-y-6 mt-6 movil:space-y-5 movil:mt-5">
                            {parrafos.map((p, i) => (
                                <p key={i}>{p}</p>
                            ))}
                        </div>

                        {n.galeria && n.galeria.length > 0 && (
                            <div className={`mt-10 grid gap-4 movil:mt-8 ${n.galeria.length > 1 ? 'sm:grid-cols-2' : ''}`}>
                                {n.galeria.map((g) => (
                                    <figure key={g.src}>
                                        <Image
                                            src={g.src}
                                            alt={g.alt}
                                            width={g.ancho}
                                            height={g.alto}
                                            sizes={n.galeria!.length > 1 ? '(min-width: 700px) 340px, 100vw' : '(min-width: 700px) 700px, 100vw'}
                                            className="w-full h-auto rounded-[22px] border border-simar-borde"
                                        />
                                        <figcaption className="mt-2.5 text-[15px] leading-snug text-simar-texto-2">{g.pie}</figcaption>
                                    </figure>
                                ))}
                            </div>
                        )}

                        {n.fuentes && n.fuentes.length > 0 && (
                            <section aria-labelledby="fuentes" className="mt-12 rounded-[24px] bg-simar-superficie border border-simar-borde p-6 movil:mt-10 movil:p-5">
                                <h2 id="fuentes" className="text-[20px] font-extrabold">
                                    Fuentes
                                </h2>
                                <ul className="mt-3 space-y-3 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[15px]">
                                    {n.fuentes.map((f) => (
                                        <li key={f.texto}>
                                            {f.url ? (
                                                <a href={f.url} target="_blank" rel="noopener noreferrer" className="inline-flex gap-1.5 text-simar-marea-tinta font-semibold hover:underline">
                                                    {f.texto}
                                                    <span className="sr-only">(abre en otra pestaña)</span>
                                                    <ExternalLink aria-hidden="true" className="w-4 h-4 mt-1.5 flex-shrink-0" />
                                                </a>
                                            ) : (
                                                f.texto
                                            )}
                                        </li>
                                    ))}
                                </ul>
                            </section>
                        )}
                    </div>
                </article>

                {/* La anterior y la siguiente */}
                {(anterior || siguiente) && (
                    <nav aria-label="Otras noticias" className="max-w-[700px] mx-auto mt-14 grid sm:grid-cols-2 gap-4 movil:mt-10">
                        {anterior ? (
                            <Link
                                href={`/${locale}/noticias/${anterior.slug}`}
                                className="simar-tarjeta-accion group rounded-[22px] border border-simar-borde bg-simar-superficie p-5 flex flex-col gap-1.5"
                            >
                                <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-simar-texto-2">
                                    <ArrowLeft aria-hidden="true" className="w-4 h-4" />
                                    Anterior
                                </span>
                                <span className="text-[18px] font-extrabold leading-snug line-clamp-2 group-hover:text-simar-marea-tinta transition-colors">{anterior.titulo}</span>
                            </Link>
                        ) : (
                            <span className="max-sm:hidden" />
                        )}
                        {siguiente && (
                            <Link
                                href={`/${locale}/noticias/${siguiente.slug}`}
                                className="simar-tarjeta-accion group rounded-[22px] border border-simar-borde bg-simar-superficie p-5 flex flex-col gap-1.5 sm:text-right sm:items-end"
                            >
                                <span className="inline-flex items-center gap-1.5 text-[15px] font-bold text-simar-texto-2">
                                    Siguiente
                                    <ArrowRight aria-hidden="true" className="w-4 h-4" />
                                </span>
                                <span className="text-[18px] font-extrabold leading-snug line-clamp-2 group-hover:text-simar-marea-tinta transition-colors">{siguiente.titulo}</span>
                            </Link>
                        )}
                    </nav>
                )}

                <section aria-labelledby="mas-noticias" className="max-w-[1248px] mx-auto mt-24 movil:mt-16">
                    <div className="flex flex-wrap items-end justify-between gap-4">
                        <h2 id="mas-noticias" className="text-[clamp(30px,3vw,42px)] font-extrabold tracking-[-0.02em] movil:text-[26px]">
                            Sigue leyendo
                        </h2>
                        <Link href={`/${locale}/noticias`} className="inline-flex items-center gap-1.5 min-h-[48px] text-[17px] font-bold text-simar-marea-tinta hover:underline">
                            Todas las noticias
                            <ArrowRight aria-hidden="true" className="w-[18px] h-[18px]" />
                        </Link>
                    </div>
                    <div className="mt-8 grid md:grid-cols-3 gap-5 md:gap-6 movil:mt-5 movil:gap-4">
                        {otras.map((o) => (
                            <TarjetaNoticia key={o.slug} noticia={{ ...o, minutos: minutosDeLectura(o) }} locale={locale} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

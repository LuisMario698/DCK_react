import type { Metadata } from 'next';
import Image from 'next/image';
import { notFound } from 'next/navigation';
import { ExternalLink } from 'lucide-react';
import { NOTICIAS, fechaNoticia, minutosDeLectura, noticiaPorSlug } from '@/lib/constants/noticias';
import { tituloPantalla } from '@/lib/constants/titulo';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { PortadaNoticia } from '@/components/noticias/PortadaNoticia';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
    const { slug } = await params;
    const n = noticiaPorSlug(slug);
    return n ? { title: tituloPantalla(n.titulo), description: n.resumen } : { title: tituloPantalla('Noticias') };
}

/** Un artículo: portada, texto a una columna cómoda de leer, fuentes y otras noticias */
export default async function NoticiaPage({ params }: Props) {
    const { locale, slug } = await params;
    const n = noticiaPorSlug(slug);
    if (!n) notFound();
    const otras = NOTICIAS.filter((o) => o.slug !== n.slug).slice(0, 3);

    return (
        <div className="simar-landing min-h-screen bg-simar-papel font-sans text-simar-texto antialiased">
            <EncabezadoNoticias locale={locale} enArticulo />
            <main className="px-6 pt-12 pb-24 md:pt-16 md:pb-32 movil:px-5 movil:pt-8 movil:pb-16">
                <article className="max-w-[1080px] mx-auto">
                    <header className="max-w-[760px] mx-auto text-center">
                        <p className="flex flex-wrap justify-center items-center gap-x-2.5 gap-y-1 text-[17px] font-bold movil:text-[15px]">
                            <span className="text-simar-marea-tinta">{n.categoria}</span>
                            <span aria-hidden="true" className="text-simar-texto-3">·</span>
                            <time dateTime={n.fecha} className="text-simar-texto-2 font-semibold">
                                {fechaNoticia(n)}
                            </time>
                            <span aria-hidden="true" className="text-simar-texto-3">·</span>
                            <span className="text-simar-texto-2 font-semibold">{minutosDeLectura(n)} min de lectura</span>
                        </p>
                        <h1 className="mt-4 text-[clamp(36px,4.6vw,62px)] font-extrabold leading-[1.06] tracking-[-0.03em] movil:text-[30px] movil:leading-[1.12] movil:tracking-[-0.015em]">
                            {n.titulo}
                        </h1>
                        <p className="mt-5 text-xl md:text-[23px] leading-relaxed text-simar-texto-2 movil:text-[18px]">{n.resumen}</p>
                    </header>

                    <PortadaNoticia noticia={n} prioridad sizes="(min-width: 1080px) 1080px, 100vw" className="mt-10 aspect-[16/9] rounded-[32px] movil:mt-7 movil:rounded-[22px]" />

                    <div className="max-w-[700px] mx-auto mt-12 space-y-6 text-[19px] md:text-[21px] leading-[1.7] text-simar-texto movil:mt-8 movil:space-y-5 movil:text-[17px]">
                        {n.cuerpo.map((p, i) => (
                            <p key={i}>{p}</p>
                        ))}
                        {n.imagenInterior && (
                            <figure className="pt-2">
                                <Image
                                    src={n.imagenInterior.src}
                                    alt={n.imagenInterior.alt}
                                    width={1080}
                                    height={1440}
                                    sizes="(min-width: 700px) 700px, 100vw"
                                    className="w-full h-auto rounded-[24px] border border-simar-borde"
                                />
                                <figcaption className="mt-3 text-[15px] text-simar-texto-2">{n.imagenInterior.pie}</figcaption>
                            </figure>
                        )}
                        {n.fuentes && n.fuentes.length > 0 && (
                            <section aria-labelledby="fuentes" className="mt-10 rounded-[24px] bg-simar-superficie border border-simar-borde p-6 movil:p-5">
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

                <section aria-labelledby="mas-noticias" className="max-w-[1248px] mx-auto mt-24 movil:mt-16">
                    <h2 id="mas-noticias" className="text-[clamp(30px,3vw,42px)] font-extrabold tracking-[-0.02em] movil:text-[26px]">
                        Más noticias
                    </h2>
                    <div className="mt-8 grid md:grid-cols-3 gap-5 md:gap-6 movil:mt-6 movil:gap-4">
                        {otras.map((o) => (
                            <TarjetaNoticia key={o.slug} noticia={o} locale={locale} />
                        ))}
                    </div>
                </section>
            </main>
        </div>
    );
}

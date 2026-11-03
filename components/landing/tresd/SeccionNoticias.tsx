import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { minutosDeLectura, recientes } from '@/lib/constants/noticias';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';

/**
 * Un adelanto de Noticias en la landing 3D: las tres más recientes y el enlace a la página, que es
 * donde vive todo (el proyecto, la problemática, el glosario y las fuentes). En celular, las
 * tarjetas van en un carrusel que se desliza de lado (no alarga el scroll).
 *
 * Es un componente de servidor: la página lo arma y se lo pasa a LandingTresD, así los artículos
 * no bajan con el JavaScript de la landing.
 */
export function SeccionNoticias({ locale }: { locale: string }) {
    const ultimas = recientes(3).map((n) => ({ ...n, minutos: minutosDeLectura(n) }));
    const boton =
        'min-h-[56px] px-7 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center justify-center gap-2 transition-colors movil:min-h-[52px] movil:text-[17px]';

    return (
        <section id="noticias" aria-labelledby="noticias-titulo" className="relative bg-simar-superficie px-6 py-24 md:py-32 overflow-clip movil:px-5 movil:py-16">
            <div className="max-w-[1248px] mx-auto">
                <div className="flex flex-wrap items-end justify-between gap-6">
                    <div className="max-w-3xl">
                        <p className="t3-enfoca text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">Noticias</p>
                        <h2
                            id="noticias-titulo"
                            className="t3-enfoca mt-3 text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]"
                        >
                            El puerto, el mar y sus fuentes.
                        </h2>
                        <p className="t3-enfoca mt-4 max-w-2xl text-xl leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[17px]">
                            Lo que pasa en el Alto Golfo y en los océanos, lo que explica el problema y la historia del proyecto. Todo con sus fuentes.
                        </p>
                    </div>
                    <Link href={`/${locale}/noticias`} className={`t3-enfoca max-sm:hidden ${boton}`}>
                        Ir a Noticias
                        <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                    </Link>
                </div>

                <ul aria-label="Las más recientes (en celular, desliza de lado)" className="t3-enfoca simar-carrusel mt-12 grid md:grid-cols-3 gap-5 md:gap-6 movil:mt-8">
                    {ultimas.map((n) => (
                        <li key={n.slug} className="flex">
                            <TarjetaNoticia noticia={n} locale={locale} className="w-full" />
                        </li>
                    ))}
                </ul>

                <Link href={`/${locale}/noticias`} className={`sm:hidden mt-6 flex ${boton}`}>
                    Ir a Noticias
                    <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                </Link>
            </div>
        </section>
    );
}

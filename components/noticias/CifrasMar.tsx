import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { FOTOS, textoCredito, type FotoNoticia } from '@/lib/constants/fotos';
import { CifraAnimada } from './CifraAnimada';
import { FilaVaquitas } from './MarAnimado';
import { PausaFuera } from './PausaFuera';

/** La foto de cada tema (lib/constants/fotos.ts), con su encuadre */
const FOTO_DE: Record<string, { foto: FotoNoticia; alt: string; posicion: string }> = {
    aceite: { foto: FOTOS.aceiteDeMotor, alt: 'Aceite de motor que cae de su envase', posicion: '40% 55%' },
    basura: { foto: FOTOS.plasticoEnLaPlaya, alt: 'Botellas, latas y bolsas de plástico juntadas en una playa', posicion: '50% 50%' },
    redes: { foto: FOTOS.tortugaEnRed, alt: 'Una tortuga marina atrapada en una red de pesca abandonada', posicion: '50% 45%' },
    mar: { foto: FOTOS.vaquitaYCria, alt: 'Una vaquita marina y su cría', posicion: '50% 50%' },
};

export interface TemaCifra {
    id: string;
    tema: string;
    titulo: string;
    cifra: string;
    nota: string;
    articulos: { slug: string; titulo: string }[];
}

/**
 * «En cifras» (fondo oscuro): los cuatro temas a la vista, sin pestañas. Cada tarjeta lleva su
 * foto real con su crédito (se descubre al bajar y se acerca al pasar el cursor), la cifra en letra
 * de titular que sube al verse, una línea y qué leer. En celular van una debajo de otra.
 */
export function CifrasMar({ temas, locale }: { temas: TemaCifra[]; locale: string }) {
    return (
        <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 movil:mt-7 movil:gap-4">
            {temas.map((t, i) => (
                <article
                    key={t.id}
                    aria-labelledby={`cifra-${t.id}`}
                    className={`t3-enfoca ${i % 2 ? 't3-enfoca-2' : ''} group flex flex-col rounded-[32px] overflow-clip bg-white/[0.05] border border-white/10 movil:rounded-[24px]`}
                >
                    <figure className="relative aspect-[16/9] overflow-clip simar-cargando">
                        {FOTO_DE[t.id] && (
                            // La figura recorta; la capa baja y su contenido sube lo mismo (globals.css)
                            <div className="n-descubre absolute inset-0">
                                <div className="n-descubre-contra absolute inset-0">
                                    <div className="absolute inset-0 transition-transform duration-[900ms] ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:scale-[1.04]">
                                        <Image
                                            src={FOTO_DE[t.id].foto.src}
                                            alt={FOTO_DE[t.id].alt}
                                            fill
                                            sizes="(min-width: 768px) 620px, 100vw"
                                            className="object-cover"
                                            style={{ objectPosition: FOTO_DE[t.id].posicion }}
                                        />
                                    </div>
                                </div>
                            </div>
                        )}
                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />
                        <span className="absolute left-4 top-4 rounded-full bg-simar-abismo/75 border border-white/15 px-3.5 py-1.5 text-[15px] font-bold text-white">{t.tema}</span>
                        {FOTO_DE[t.id] && (
                            <figcaption className="absolute right-4 bottom-3 left-4 text-right text-[13px] leading-snug text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
                                <a href={FOTO_DE[t.id].foto.credito.pagina} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                                    {textoCredito(FOTO_DE[t.id].foto.credito)}
                                    <span className="sr-only"> (abre en otra pestaña)</span>
                                </a>
                            </figcaption>
                        )}
                    </figure>
                    <div className="flex flex-col flex-1 p-7 md:p-8 movil:p-5">
                        <h3 id={`cifra-${t.id}`} className="font-titular text-[26px] font-medium italic leading-tight text-simar-franja-texto-2 movil:text-[21px]">
                            {t.titulo}
                        </h3>
                        <p
                            className={`mt-2 font-titular text-[clamp(54px,5.8vw,86px)] font-semibold leading-[0.95] tracking-[-0.03em] tabular-nums whitespace-nowrap movil:text-[48px] ${
                                t.id === 'aceite' ? 'text-simar-aceite' : 'text-white'
                            }`}
                        >
                            <CifraAnimada texto={t.cifra} />
                        </p>
                        <p className="mt-2 text-[18px] font-bold leading-snug text-simar-franja-texto-2 movil:text-[16px]">{t.nota}</p>
                        {t.id === 'mar' && (
                            <PausaFuera className="mt-4">
                                <FilaVaquitas />
                            </PausaFuera>
                        )}
                        <ul className="mt-auto pt-5 space-y-1">
                            {t.articulos.slice(0, 2).map((a) => (
                                <li key={a.slug}>
                                    <Link
                                        href={`/${locale}/noticias/${a.slug}`}
                                        className="group -mx-3 px-3 min-h-[52px] py-2 rounded-[14px] flex items-center justify-between gap-3 text-[17px] font-bold leading-snug text-white hover:bg-white/[0.07] transition-colors focus-visible:outline-3 focus-visible:outline-simar-espuma movil:text-[16px]"
                                    >
                                        {a.titulo}
                                        <ArrowRight aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-simar-espuma transition-transform group-hover:translate-x-0.5" />
                                    </Link>
                                </li>
                            ))}
                        </ul>
                    </div>
                </article>
            ))}
        </div>
    );
}

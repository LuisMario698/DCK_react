import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CifraAnimada } from './CifraAnimada';
import { EscenaCifra, FilaVaquitas } from './MarAnimado';
import { PausaFuera } from './PausaFuera';

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
 * escena animada (la gota de aceite, la basura que flota, la red que sigue pescando, la vaquita
 * y su cría), la cifra que sube al verse, una línea y qué leer. En celular van una debajo de otra.
 */
export function CifrasMar({ temas, locale }: { temas: TemaCifra[]; locale: string }) {
    return (
        <div className="mt-10 md:mt-12 grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6 movil:mt-7 movil:gap-4">
            {temas.map((t, i) => (
                <article
                    key={t.id}
                    aria-labelledby={`cifra-${t.id}`}
                    className={`t3-enfoca ${i % 2 ? 't3-enfoca-2' : ''} flex flex-col rounded-[32px] overflow-hidden bg-white/[0.05] border border-white/10 movil:rounded-[24px]`}
                >
                    <div className="relative aspect-[16/9] overflow-hidden">
                        {/* Cada escena se pausa sola fuera de la pantalla (no la tarjeta: su entrada va atada al scroll) */}
                        <PausaFuera oculto className="absolute inset-0">
                            <EscenaCifra tema={t.id} />
                        </PausaFuera>
                        <span className="absolute left-4 top-4 rounded-full bg-simar-abismo/60 border border-white/15 backdrop-blur-md px-3.5 py-1.5 text-[15px] font-bold text-white">{t.tema}</span>
                    </div>
                    <div className="flex flex-col flex-1 p-7 md:p-8 movil:p-5">
                        <h3 id={`cifra-${t.id}`} className="text-[22px] font-extrabold leading-tight tracking-[-0.01em] text-simar-franja-texto-2 movil:text-[18px]">
                            {t.titulo}
                        </h3>
                        <p
                            className={`mt-2 text-[clamp(48px,5.2vw,78px)] font-extrabold leading-[0.95] tracking-[-0.04em] tabular-nums whitespace-nowrap movil:text-[44px] ${
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

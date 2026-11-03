import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { PausaFuera } from './PausaFuera';
import { Algas, Burbujas, Cardumen, FondoMarino, NadoVaquitas, RayosDeLuz } from './MarAnimado';

/**
 * La portada de Noticias, bajo el mar: entra la luz, pasa un cardumen y la vaquita marina nada con
 * su cría entre las algas. Encima, el título, cuántas noticias, lugares y fuentes hay y un «¿Sabías
 * que...?» de la vaquita. Se mete debajo de la barra de arriba (que es de vidrio), así el mar
 * empieza desde arriba. Con «reducir movimiento» todo se queda quieto, a la vista.
 */
export function PortadaMar({ locale, cuantas }: { locale: string; cuantas: { cifra: number; texto: string }[] }) {
    return (
        <section
            aria-labelledby="noticias-titulo"
            className="relative isolate overflow-hidden text-white -mt-[133px] pt-[133px] sm:-mt-[143px] sm:pt-[143px] md:-mt-[159px] md:pt-[159px]"
        >
            <PausaFuera oculto className="absolute inset-0 -z-10 n-agua">
                <RayosDeLuz className="opacity-90" />
                <Cardumen arriba="34%" />
                <Cardumen arriba="58%" dura={52} espera={-40} ancho="clamp(90px,10vw,150px)" opacidad={0.28} />
                <Burbujas
                    burbujas={[
                        { x: '7%', abajo: '16%', tam: 10, sube: 340, dura: 7, espera: -1 },
                        { x: '9%', abajo: '14%', tam: 6, sube: 300, dura: 6, espera: -4 },
                        { x: '91%', abajo: '18%', tam: 12, sube: 380, dura: 8, espera: -2.5 },
                        { x: '94%', abajo: '15%', tam: 7, sube: 320, dura: 6.5, espera: -5 },
                        { x: '58%', abajo: '10%', tam: 8, sube: 260, dura: 7.5, espera: -6 },
                    ]}
                />
                <NadoVaquitas className="bottom-[64px] movil:bottom-[52px]" ancho="clamp(270px,34vw,500px)" />
                <FondoMarino className="bottom-0 h-[110px] movil:h-[80px]" />
                <Algas className="left-[-24px] bottom-[18px] h-[clamp(200px,30vw,340px)]" />
                <Algas className="right-[-30px] bottom-[18px] h-[clamp(170px,24vw,280px)]" espejo />
            </PausaFuera>

            <div className="relative max-w-[1248px] mx-auto px-6 pt-12 md:pt-16 pb-[clamp(250px,30vw,380px)] movil:px-5 movil:pt-7 movil:pb-[210px]">
                <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-10 items-end movil:gap-6">
                    <div>
                        <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">Noticias · SiMAR</p>
                        <h1
                            id="noticias-titulo"
                            className="mt-2 text-[clamp(48px,6.4vw,92px)] font-extrabold leading-[0.98] tracking-[-0.04em] text-balance drop-shadow-[0_4px_24px_rgba(0,0,0,0.25)] movil:text-[40px] movil:leading-[1.03]"
                        >
                            El mar, en noticias.
                        </h1>
                        <p className="mt-4 max-w-xl text-xl md:text-[23px] leading-relaxed text-simar-franja-texto-2 text-pretty movil:mt-3 movil:text-[17px]">
                            Lo que pasa en el Alto Golfo y en los océanos, con su fuente.
                        </p>
                        <dl className="mt-7 flex flex-wrap gap-3 movil:mt-5 movil:gap-2">
                            {cuantas.map((c) => (
                                <div key={c.texto} className="relative rounded-[20px] bg-simar-abismo/45 border border-white/15 backdrop-blur-md px-5 py-3 movil:flex-1 movil:px-3.5 movil:py-2.5">
                                    <dt className="sr-only">{c.texto}</dt>
                                    <dd className="flex items-baseline gap-2 movil:block">
                                        <span className="text-[32px] font-extrabold leading-none tracking-[-0.03em] tabular-nums movil:block movil:text-[26px]">{c.cifra}</span>
                                        <span aria-hidden="true" className="text-[17px] font-bold text-simar-franja-texto-2 movil:block movil:mt-1 movil:text-[15px]">
                                            {c.texto}
                                        </span>
                                    </dd>
                                </div>
                            ))}
                        </dl>
                    </div>

                    {/* ¿Sabías que...? La vaquita, que nada aquí abajo */}
                    <aside aria-label="¿Sabías que...?" className="relative rounded-[28px] bg-simar-abismo/50 border border-white/15 backdrop-blur-md p-6 shadow-[0_24px_60px_-30px_rgba(0,0,0,0.6)] movil:rounded-[22px] movil:p-5">
                        <p className="text-[15px] font-bold text-simar-espuma">¿Sabías que...?</p>
                        <p className="mt-2 text-[clamp(40px,4vw,54px)] font-extrabold leading-none tracking-[-0.03em] text-simar-aceite tabular-nums movil:text-[38px]">7 a 10</p>
                        <p className="mt-2 text-[18px] font-bold leading-snug movil:text-[16px]">vaquitas marinas quedan. Sólo viven en el Alto Golfo, junto a Puerto Peñasco.</p>
                        <Link
                            href={`/${locale}/noticias/vaquita-marina-2025`}
                            className="group mt-4 min-h-[52px] px-5 rounded-full bg-white text-simar-abismo text-[17px] font-extrabold inline-flex items-center gap-2 hover:bg-white/90 transition-colors movil:min-h-[48px] movil:text-[16px]"
                        >
                            Conoce a la vaquita
                            <ArrowRight aria-hidden="true" className="w-5 h-5 transition-transform group-hover:translate-x-0.5" strokeWidth={2.4} />
                        </Link>
                    </aside>
                </div>
            </div>

            {/* La orilla de abajo, en ola, hacia la sección de lo último */}
            <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="absolute inset-x-0 -bottom-px w-full h-[40px] movil:h-[24px] fill-simar-papel" aria-hidden="true">
                <path d="M0 26 C180 6 360 6 540 22 C720 38 900 40 1080 24 C1260 8 1350 10 1440 18 V48 H0 Z" />
            </svg>
        </section>
    );
}

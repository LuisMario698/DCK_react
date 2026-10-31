'use client';

import { useId } from 'react';
import { ArrowDown, ArrowRight, PlayCircle } from 'lucide-react';
import { NumeroAnimado } from '@/components/ui/movimiento';

/**
 * La gota: cae junto a un barco camaronero, toca el agua, la mancha se extiende y se encoge sobre
 * la cifra de litros que ya no llegaron al mar. Es decorativa (el lector de pantalla la salta). Las
 * clases ln-* de app/globals.css la animan una sola vez; con "reducir movimiento" queda en su
 * estado final (el barco en el agua, sin gota).
 * Medidas del dibujo (480 × 380): el agua está en y = 300 (80 abajo del borde) y la gota cae en
 * x = 300. `left` pone esa x sobre el centro de la columna (donde va la cifra) y `bottom`, el agua a
 * la altura de la cresta de la ola de la superficie: 24 px arriba del final del cielo.
 */
function GotaQueCae() {
    const id = useId();
    return (
        <svg
            viewBox="0 0 480 380"
            className="absolute left-[calc(50%-300px)] bottom-[-56px] w-[480px] h-[380px] pointer-events-none movil:left-[calc(50%-187.5px)] movil:bottom-[-26px] movil:w-[300px] movil:h-[237.5px]"
            aria-hidden="true"
        >
            <defs>
                <linearGradient id={`${id}-gota`} x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0" stopColor="#FFE29A" />
                    <stop offset="0.55" stopColor="#F2C14E" />
                    <stop offset="1" stopColor="#B7791F" />
                </linearGradient>
                {/* Película de aceite: tornasol, como se ve en el agua */}
                <linearGradient id={`${id}-pelicula`} x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" stopColor="#F2C14E" stopOpacity="0" />
                    <stop offset="0.18" stopColor="#F2C14E" />
                    <stop offset="0.42" stopColor="#C9A3F5" />
                    <stop offset="0.62" stopColor="#7FE0D6" />
                    <stop offset="0.82" stopColor="#F2C14E" />
                    <stop offset="1" stopColor="#F2C14E" stopOpacity="0" />
                </linearGradient>
                {/* Lo que queda bajo el agua no se dibuja: ahí ya está la ola */}
                <clipPath id={`${id}-flota`}>
                    <rect x="0" y="0" width="480" height="303" />
                </clipPath>
            </defs>
            {/* Barco camaronero a contraluz, meciéndose */}
            <g clipPath={`url(#${id}-flota)`}>
                <g className="ln-mece" fill="#081B2E" stroke="#081B2E" strokeLinecap="round">
                    <path d="M28 276 L214 270 C210 290 198 304 178 308 L58 308 C42 304 32 292 28 276 Z" stroke="none" />
                    <rect x="118" y="244" width="58" height="30" rx="3" stroke="none" />
                    <rect x="128" y="232" width="38" height="14" rx="2" stroke="none" />
                    <line x1="88" y1="276" x2="88" y2="176" strokeWidth="4" />
                    <line x1="88" y1="188" x2="24" y2="236" strokeWidth="3" />
                    <line x1="88" y1="188" x2="160" y2="226" strokeWidth="3" />
                    <line x1="88" y1="178" x2="30" y2="274" strokeWidth="1.2" />
                    <line x1="88" y1="178" x2="206" y2="270" strokeWidth="1.2" />
                    <g fill="#7FE0D6" fillOpacity="0.55" stroke="none">
                        <rect x="126" y="252" width="10" height="8" rx="1.5" />
                        <rect x="142" y="252" width="10" height="8" rx="1.5" />
                        <rect x="158" y="252" width="10" height="8" rx="1.5" />
                    </g>
                    <circle cx="88" cy="174" r="3.5" fill="#F2C14E" stroke="none" />
                </g>
            </g>
            {/* Ondas */}
            <ellipse className="ln-onda" cx="300" cy="300" rx="150" ry="16" fill="none" stroke="#7FE0D6" strokeWidth="2" />
            <ellipse className="ln-onda" style={{ '--ln-retraso': '1.12s' } as React.CSSProperties} cx="300" cy="300" rx="110" ry="12" fill="none" stroke="#FFFFFF" strokeOpacity="0.7" strokeWidth="1.5" />
            {/* Mancha */}
            <ellipse className="ln-mancha" cx="300" cy="301" rx="140" ry="9" fill={`url(#${id}-pelicula)`} />
            {/* Gota (el óvalo blanco es el brillo) */}
            <g className="ln-gota">
                <path d="M300 256 C300 256 286 274 286 284 a14 14 0 0 0 28 0 C314 274 300 256 300 256 Z" fill={`url(#${id}-gota)`} />
                <ellipse cx="294" cy="282" rx="3" ry="5" fill="#FFFFFF" fillOpacity="0.75" />
            </g>
        </svg>
    );
}

/** El borde del agua: dos capas de oleaje que se cruzan despacio (se repiten a lo ancho) */
function Superficie() {
    const ola = 'M0 24 C60 14 120 14 180 24 C240 34 300 34 360 24 C420 14 480 14 540 24 C600 34 660 34 720 24 V48 H0 Z';
    return (
        <div aria-hidden="true" className="relative h-12 -mt-12 overflow-hidden pointer-events-none">
            <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="ln-oleaje-lento absolute inset-y-0 left-0 w-[200%] h-full">
                <path d={ola} transform="translate(0 -4)" fill="#13708A" fillOpacity="0.55" />
                <path d={ola} transform="translate(720 -4)" fill="#13708A" fillOpacity="0.55" />
            </svg>
            <svg viewBox="0 0 1440 48" preserveAspectRatio="none" className="ln-oleaje absolute inset-y-0 left-0 w-[200%] h-full">
                <path d={ola} fill="#13708A" />
                <path d={ola} transform="translate(720 0)" fill="#13708A" />
                <path d="M0 24 C60 14 120 14 180 24 C240 34 300 34 360 24 C420 14 480 14 540 24 C600 34 660 34 720 24" fill="none" stroke="#7FE0D6" strokeOpacity="0.5" strokeWidth="1.5" />
                <path d="M0 24 C60 14 120 14 180 24 C240 34 300 34 360 24 C420 14 480 14 540 24 C600 34 660 34 720 24" transform="translate(720 0)" fill="none" stroke="#7FE0D6" strokeOpacity="0.5" strokeWidth="1.5" />
            </svg>
        </div>
    );
}

/**
 * 1 · Hero «Una gota». Lo primero que se lee es el problema y la cifra real; el logo ya está en la
 * barra de arriba. El título se ve desde el primer cuadro (es el elemento LCP): sólo la gota se
 * anima. `litros` es el aceite que ya llegó al centro de acopio (null sin datos).
 */
export function HeroGota({ litros, rutaDemo }: { litros: number | null; rutaDemo: string | null }) {
    return (
        <header id="inicio" className="relative isolate overflow-clip text-white bg-simar-abismo">
            {/* Cielo de madrugada */}
            <div className="ln-cielo pt-[132px] md:pt-[170px] px-6 movil:pt-[104px] movil:px-5">
                <div className="max-w-[1248px] mx-auto grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-x-12">
                    <div className="relative z-20 pb-14 lg:pb-20 movil:pb-4">
                        <p className="text-lg font-bold text-simar-espuma movil:text-[15px]">Puerto Peñasco · Alto Golfo de California</p>
                        <h1 className="mt-4 text-[44px] md:text-[60px] xl:text-[66px] font-extrabold leading-[1.04] tracking-[-0.02em] movil:mt-3 movil:text-[34px] movil:leading-[1.08]">
                            Un litro de aceite puede contaminar hasta un millón de litros de mar.
                        </h1>
                    </div>
                    {/* La gota cae sobre la cifra (en celular, entre el título y la cifra) */}
                    <div className="relative z-10 h-[120px] lg:h-auto movil:h-[96px]">
                        <GotaQueCae />
                    </div>
                </div>
            </div>

            <Superficie />

            {/* El mar: la cifra justo donde cayó la gota, y las acciones */}
            <div className="ln-mar px-6 pt-8 pb-16 md:pb-20 movil:px-5 movil:pt-6 movil:pb-10">
                <div className="max-w-[1248px] mx-auto grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,0.8fr)] gap-x-12 gap-y-8 items-start movil:gap-y-6">
                    <div className="order-2 lg:order-1">
                        <p className="max-w-xl text-lg md:text-[21px] leading-relaxed text-simar-franja-texto-2 movil:text-[16px]">
                            SiMAR registra cada litro, filtro y kilo de basura que los barcos entregan en el muelle, para que
                            llegue al reciclaje y no al Golfo.
                        </p>
                        <div className="mt-7 flex flex-wrap gap-3 movil:mt-5 movil:flex-col">
                            <a
                                href="#viaje"
                                className="simar-presiona group min-h-[60px] px-7 rounded-[20px] bg-simar-espuma text-simar-abismo text-lg md:text-xl font-extrabold inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px]"
                            >
                                Ver cómo lo hacemos
                                <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                            </a>
                            {rutaDemo && (
                                <a
                                    href={rutaDemo}
                                    className="simar-presiona min-h-[60px] px-7 rounded-[20px] border-2 border-white/80 text-white text-lg md:text-xl font-bold hover:bg-white/10 inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px]"
                                >
                                    <PlayCircle className="w-[22px] h-[22px]" />
                                    Probar la demostración
                                </a>
                            )}
                        </div>
                    </div>

                    <div className="order-1 lg:order-2 text-center">
                        {litros !== null ? (
                            <>
                                <p className="text-lg font-bold text-simar-espuma movil:text-[15px]">En Puerto Peñasco ya evitamos que</p>
                                <p className="relative mt-1 inline-flex items-baseline justify-center gap-3 font-extrabold leading-none text-simar-aceite">
                                    {/* Lo que deja la mancha al encogerse */}
                                    <span aria-hidden="true" className="ln-brillo absolute -inset-x-6 -inset-y-4 rounded-full border-2 border-simar-aceite/70" />
                                    <NumeroAnimado valor={litros} duracion={1600} className="text-[84px] md:text-[96px] tracking-[-0.03em] movil:text-[64px]" />
                                    <span className="text-[30px] md:text-[34px] movil:text-[24px]">litros</span>
                                </p>
                                <p className="mt-2 text-xl md:text-[22px] font-bold movil:text-[17px]">de aceite usado llegaran al Golfo.</p>
                                <a href="#fuentes" className="mt-2 inline-flex min-h-[44px] items-center text-[17px] text-simar-franja-texto-2 underline underline-offset-4 hover:text-white movil:text-[15px]">
                                    ¿De dónde sale esta cifra?
                                </a>
                            </>
                        ) : (
                            <p className="text-2xl md:text-[28px] font-extrabold leading-snug movil:text-[20px]">
                                Cada litro que se entrega en el muelle es un litro que no llega al Golfo.
                            </p>
                        )}
                    </div>
                </div>

                <a
                    href="#problema"
                    className="mt-12 mx-auto flex w-fit min-h-[52px] items-center gap-2 px-4 rounded-full text-[17px] font-bold text-simar-franja-texto-2 hover:text-white movil:mt-8 movil:min-h-[44px] movil:text-[15px]"
                >
                    <ArrowDown className="w-5 h-5" />
                    Baja al fondo del mar
                </a>
            </div>
        </header>
    );
}

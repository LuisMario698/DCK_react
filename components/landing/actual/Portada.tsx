import { type CSSProperties } from 'react';
import Image from 'next/image';
import { ArrowDown, ArrowRight } from 'lucide-react';
import simboloGrande from '@/public/assets/simar/simbolo-grande.png';
import nombreGrandeOscuro from '@/public/assets/simar/nombre-grande-oscuro.png';
import { MODO_DEMO } from '@/lib/demo/config';
import { OlaSeparador } from '../OlaSeparador';
import { CarruselPortada } from './CarruselPortada';
import { TextoEnfoca } from './comun';

/** Hero: las fotos del proyecto de fondo (CarruselPortada) y el logo grande al centro */
export function Portada({ alAbrirAcceso, rutaDemo }: { alAbrirAcceso: () => void; rutaDemo: string | null }) {
    // overflow-clip y no -hidden: lo decorativo que sobresale no vuelve "desplazable" la franja (al enfocar un botón se corría)
    return (
        <header id="top" className="simar-hero relative isolate overflow-clip bg-simar-abismo text-white">
            <CarruselPortada>
                {/* Entrada escalonada: lugar, símbolo (gira hasta su lugar), nombre, qué es, para qué, acciones.
                    Al bajar, todo se difumina (simar-hero-sale) */}
                <div className="simar-hero-sale relative max-w-[1100px] mx-auto px-6 md:px-12 pt-32 md:pt-36 pb-40 md:pb-44 min-h-[100svh] md:min-h-[max(100svh,780px)] flex flex-col items-center justify-center text-center movil:px-5 movil:pt-28 movil:pb-36">
                    <p className="simar-enfoca text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]" style={{ animationDelay: '0.2s' }}>
                        Puerto Peñasco · Sonora · México
                    </p>
                    <h1 className="mt-9 flex flex-col items-center font-extrabold movil:mt-7">
                        <span className="relative flex items-center justify-center">
                            {/* Curvas de profundidad alrededor del símbolo: se trazan al cargar, de adentro hacia afuera */}
                            <svg
                                aria-hidden="true"
                                viewBox="320 -125 500 340"
                                className="absolute left-1/2 top-1/2 w-[205%] max-w-none h-auto -translate-x-1/2 -translate-y-1/2 pointer-events-none overflow-visible"
                                style={{ fill: 'none', stroke: 'var(--simar-espuma)', strokeWidth: 1.4, opacity: 0.4 }}
                            >
                                <path
                                    pathLength={1}
                                    className="simar-dibuja"
                                    style={{ '--simar-trazo-dur': '2.2s', animationDelay: '0.6s' } as CSSProperties}
                                    d="M722 40 C718 57 690 72 674 86 C659 100 648 115 629 124 C610 133 585 136 560 139 C535 142 498 149 478 141 C457 132 448 106 438 89 C429 73 424 57 421 40 C419 23 412 -1 423 -15 C435 -30 466 -40 488 -47 C511 -55 537 -62 560 -60 C583 -59 601 -46 625 -39 C648 -32 685 -30 701 -17 C717 -4 726 23 722 40 Z"
                                />
                                <path
                                    pathLength={1}
                                    className="simar-dibuja"
                                    style={{ '--simar-trazo-dur': '2.6s', animationDelay: '0.9s', opacity: 0.6 } as CSSProperties}
                                    d="M800 40 C791 66 745 84 724 107 C702 130 698 161 671 176 C644 192 598 197 560 198 C522 200 473 199 442 185 C412 171 394 139 377 115 C361 91 349 67 343 40 C337 13 324 -28 343 -49 C362 -70 421 -76 457 -86 C494 -96 525 -107 560 -107 C595 -108 630 -100 666 -90 C702 -81 754 -70 776 -49 C799 -27 809 14 800 40 Z"
                                />
                            </svg>
                            <Image
                                src={simboloGrande}
                                alt=""
                                loading="eager"
                                fetchPriority="high"
                                sizes="(max-width: 639px) 136px, 240px"
                                className="simar-enfoca-simbolo relative h-[clamp(128px,24svh,240px)] w-auto movil:h-[132px]"
                                style={{ animationDelay: '0.1s' }}
                            />
                        </span>
                        <Image
                            src={nombreGrandeOscuro}
                            alt="SiMAR"
                            loading="eager"
                            fetchPriority="high"
                            sizes="(max-width: 639px) 290px, 600px"
                            className="simar-enfoca mt-5 w-[clamp(280px,44vw,600px)] h-auto movil:mt-4 movil:w-[280px]"
                            style={{ animationDelay: '0.6s' }}
                        />
                        <span
                            className="simar-enfoca-palabras mt-6 block text-2xl md:text-[30px] leading-tight movil:mt-4 movil:text-[20px]"
                            style={{ '--retraso': '0.9s' } as CSSProperties}
                        >
                            <TextoEnfoca texto="Sistema Integral de Manejo Ambiental de Residuos" />
                        </span>
                    </h1>
                    <p className="simar-enfoca mt-5 max-w-2xl text-lg md:text-[22px] leading-relaxed text-[#C7D3DD] movil:mt-3 movil:text-[16px]" style={{ animationDelay: '1.3s' }}>
                        Transformando la gestión de residuos marinos con <strong className="text-white">trazabilidad digital</strong> y
                        compromiso con el <strong className="text-white">Mar de Cortés</strong>.
                    </p>
                    <div className="simar-enfoca mt-9 w-full sm:w-auto flex flex-col sm:flex-row sm:flex-wrap sm:justify-center gap-3.5 movil:mt-6 movil:gap-2.5" style={{ animationDelay: '1.45s' }}>
                        <button
                            onClick={alAbrirAcceso}
                            data-vidrio=""
                            className="simar-presiona whitespace-nowrap min-h-[64px] px-7 rounded-[20px] bg-simar-marea hover:bg-simar-marea-hover text-white text-lg md:text-xl font-extrabold flex items-center justify-center gap-2.5 cursor-pointer group shadow-[0_18px_40px_-18px_rgba(27,95,201,0.9)] movil:min-h-[54px] movil:rounded-[17px] movil:text-[17px]"
                        >
                            {MODO_DEMO ? 'Probar la demostración' : 'Acceder a la plataforma'}
                            <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                        </button>
                        <a
                            href="#proyecto"
                            data-vidrio=""
                            className="simar-presiona whitespace-nowrap min-h-[64px] px-7 rounded-[20px] border-2 border-white/80 text-white text-lg md:text-xl font-bold hover:bg-white/10 flex items-center justify-center movil:min-h-[50px] movil:rounded-[17px] movil:text-[16px]"
                        >
                            Conocer el proyecto
                        </a>
                    </div>
                    {!MODO_DEMO && rutaDemo && (
                        <a
                            href={rutaDemo}
                            className="simar-enfoca group mt-5 inline-flex min-h-[48px] items-center gap-2 px-3 text-[17px] md:text-lg font-bold text-simar-espuma underline-offset-4 hover:underline movil:mt-3 movil:text-[15px]"
                            style={{ animationDelay: '1.6s' }}
                        >
                            ¿Sin cuenta? Prueba la demostración
                            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                        </a>
                    )}
                </div>
            </CarruselPortada>

            <div aria-hidden="true" className="simar-enfoca hidden lg:flex absolute left-24 bottom-[112px] items-center gap-2.5 text-base font-semibold text-white/75" style={{ animationDelay: '1.9s' }}>
                <ArrowDown className="w-5 h-5" />
                Desliza
            </div>

            <OlaSeparador color="var(--simar-superficie)" lado="abajo" />
        </header>
    );
}

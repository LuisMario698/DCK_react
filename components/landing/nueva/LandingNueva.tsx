'use client';

import { useEffect, useState } from 'react';
import { ArrowRight, MapPin, PlayCircle } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { MODO_DEMO } from '@/lib/demo/config';
import type { LandingStats } from '@/lib/services/landing_stats';
import { SeccionMapaPuertos } from '../mapa/SeccionMapaPuertos';
import type { VarianteMapa } from '../mapa/puertos';
import { OlaSeparador } from '../OlaSeparador';
import { useAccesoLanding } from '../acceso/useAccesoLanding';
import { HeroGota } from './HeroGota';
import { BajarAlFondo } from './BajarAlFondo';
import { AntesDespues } from './AntesDespues';
import { ViajeDeUnLitro } from './ViajeDeUnLitro';
import { LoQueLogramos } from './LoQueLogramos';
import { QuienesSomos } from './QuienesSomos';
import { CalculaTuImpacto } from './CalculaTuImpacto';
import { Encabezado } from './comunes';

const ENLACES = [
    { href: '#problema', texto: 'El problema' },
    { href: '#antes-despues', texto: 'Antes y después' },
    { href: '#viaje', texto: 'El viaje' },
    { href: '#logros', texto: 'Logros' },
    { href: '#puertos', texto: 'Puertos' },
    { href: '#calcula', texto: 'Calcula' },
];

/**
 * La landing nueva: una historia en cinco actos (sentir, entender, ver cómo, comprobar y actuar)
 * en nueve secciones. Ver el plan «Plan de pulido de SiMAR para el nacional» y
 * components/landing/nueva/*. Convive con la actual (VariantCinematic) mientras se decide: se ve con
 * ?landing=nueva (SelectorVersionLanding).
 */
export function LandingNueva({ stats, varianteMapa }: { stats: LandingStats | null; varianteMapa: VarianteMapa }) {
    // `stats` llega con ceros si RLS no dejó leer nada: entonces no se afirma ninguna cifra
    const hayDatos = stats !== null && stats.totalManifiestos > 0;
    const statsReales = hayDatos ? stats : null;

    const { abrirAcceso, rutaDemo, ventana } = useAccesoLanding();
    const textoEntrar = MODO_DEMO ? 'Probar la demo' : 'Iniciar sesión';

    // La barra se vuelve más sólida al bajar; en celular, después del hero aparece "Probar la demo"
    const [bajo, setBajo] = useState(false);
    const [pasoHero, setPasoHero] = useState(false);
    useEffect(() => {
        const medir = () => {
            setBajo(window.scrollY > 60);
            setPasoHero(window.scrollY > window.innerHeight * 0.9);
        };
        medir();
        window.addEventListener('scroll', medir, { passive: true });
        return () => window.removeEventListener('scroll', medir);
    }, []);

    return (
        <div className="simar-landing relative min-h-screen w-full overflow-x-clip bg-simar-papel font-sans text-simar-texto antialiased">
            {/* Barra de arriba: vidrio flotante. El logo vive aquí; "Iniciar sesión" sólo aquí y al final */}
            <nav
                aria-label="Principal"
                className={`fixed top-3 md:top-5 inset-x-3 md:inset-x-8 z-50 rounded-[28px] transition-[background-color] duration-300 ${
                    bajo ? 'simar-vidrio-fuerte' : 'simar-vidrio'
                }`}
            >
                <span aria-hidden="true" className="absolute left-7 right-7 bottom-0 h-[3px] overflow-hidden rounded-full">
                    <span className="simar-progreso h-full w-full bg-simar-golfo" />
                </span>
                <div className="h-[72px] md:h-[80px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-3 movil:h-[62px] movil:pl-2.5">
                    <a href="#inicio" className="flex items-center rounded-2xl min-w-0" aria-label="SiMAR - Inicio">
                        <LogoSimar variante="simbolo" tamano={42} className="sm:hidden" />
                        <LogoSimar tamano={46} className="hidden sm:inline-flex" />
                    </a>
                    <div className="hidden xl:flex items-center gap-6 ml-auto">
                        {ENLACES.map((e) => (
                            <a
                                key={e.href}
                                href={e.href}
                                className="min-h-[48px] flex items-center whitespace-nowrap text-[17px] font-semibold text-simar-texto hover:text-simar-marea-tinta transition-colors"
                            >
                                {e.texto}
                            </a>
                        ))}
                    </div>
                    <div className="ml-auto xl:ml-2 flex items-center gap-2">
                        <BotonTemaIcono className="movil:w-[46px] movil:h-[46px] movil:rounded-[15px]" />
                        <button
                            type="button"
                            onClick={() => abrirAcceso()}
                            className="simar-presiona min-h-[54px] md:min-h-[58px] px-5 md:px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-base md:text-lg font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap movil:min-h-[46px] movil:px-3.5 movil:rounded-[15px] movil:text-[15px]"
                        >
                            {textoEntrar}
                            <ArrowRight className="w-5 h-5 movil:hidden" strokeWidth={2.4} />
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                {/* Sentir */}
                <HeroGota litros={statsReales ? statsReales.totalAceiteUsado : null} rutaDemo={rutaDemo} />
                <BajarAlFondo />

                {/* Entender */}
                <div className="relative">
                    <OlaSeparador color="var(--simar-abismo)" lado="arriba" />
                    <AntesDespues manifiestos={statsReales ? statsReales.totalManifiestos : null} />
                </div>

                {/* Ver cómo */}
                <ViajeDeUnLitro />

                {/* Comprobar */}
                <LoQueLogramos stats={statsReales} />

                <section id="puertos" className="relative bg-simar-abismo text-white px-6 pt-24 md:pt-36 pb-20 md:pb-28 overflow-clip movil:px-5 movil:pt-16 movil:pb-14">
                    <OlaSeparador color="var(--simar-papel)" lado="arriba" />
                    <div className="relative max-w-[1248px] mx-auto">
                        <Encabezado
                            oscuro
                            className="mb-10 md:mb-12 movil:mb-6"
                            antetitulo="Puertos"
                            titulo="Hoy, Puerto Peñasco. Mañana, otros puertos."
                            texto="Puerto Peñasco es el primero. Estos son puertos pesqueros de México donde el modelo de SiMAR puede replicarse."
                        />
                        <SeccionMapaPuertos variante={varianteMapa} nombreFuturos="Puede sumarse" resumenFuturos="Pueden sumarse" />
                    </div>
                </section>

                <div className="relative">
                    <OlaSeparador color="var(--simar-abismo)" lado="arriba" />
                    <QuienesSomos />
                </div>

                {/* Actuar */}
                <CalculaTuImpacto alRegistrarEmpresa={() => abrirAcceso('recolector')} />

                <section className="relative bg-simar-abismo text-white px-6 pt-24 md:pt-32 pb-24 md:pb-32 overflow-clip text-center movil:px-5 movil:pt-16 movil:pb-20">
                    <OlaSeparador color="var(--simar-papel)" lado="arriba" />
                    <div className="relative max-w-3xl mx-auto">
                        <LogoSimar variante="simbolo" tamano={72} prioridad={false} />
                        <h2 className="mt-4 text-4xl md:text-[52px] font-extrabold leading-tight movil:text-[30px]">
                            Cada dato cuenta. <br />
                            <span className="text-simar-espuma">Cada mar lo agradece.</span>
                        </h2>
                        <p className="mt-4 text-lg md:text-[21px] text-simar-franja-texto-2 leading-relaxed movil:mt-3 movil:text-[16px]">
                            Conoce SiMAR por dentro o entra con tu cuenta.
                        </p>
                        <div className="mt-8 flex flex-wrap justify-center gap-3 movil:mt-6 movil:flex-col">
                            {rutaDemo && !MODO_DEMO && (
                                <a
                                    href={rutaDemo}
                                    className="simar-presiona min-h-[60px] px-7 rounded-[20px] bg-simar-espuma text-simar-abismo text-lg md:text-xl font-extrabold inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px]"
                                >
                                    <PlayCircle className="w-[22px] h-[22px]" />
                                    Probar la demostración
                                </a>
                            )}
                            <button
                                type="button"
                                onClick={() => abrirAcceso()}
                                className={`simar-presiona min-h-[60px] px-7 rounded-[20px] text-lg md:text-xl font-extrabold inline-flex items-center justify-center gap-2.5 cursor-pointer movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px] ${
                                    rutaDemo && !MODO_DEMO ? 'border-2 border-white/80 text-white hover:bg-white/10' : 'bg-simar-espuma text-simar-abismo'
                                }`}
                            >
                                {MODO_DEMO ? 'Probar la demostración' : 'Iniciar sesión'}
                                <ArrowRight className="w-[22px] h-[22px]" strokeWidth={2.4} />
                            </button>
                        </div>
                    </div>
                </section>
            </main>

            <footer className="bg-simar-superficie px-6 py-12 md:py-14 movil:px-5 movil:py-10 movil:pb-28">
                <div className="max-w-[1248px] mx-auto grid md:grid-cols-[auto_minmax(0,1fr)_auto] gap-8 md:gap-14 items-start movil:gap-6">
                    <LogoSimar tamano={60} prioridad={false} className="flex-shrink-0" />
                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <h3 className="text-lg font-extrabold">Centro de acopio</h3>
                            <p className="mt-2 flex gap-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[15px]">
                                <MapPin className="w-5 h-5 mt-1 flex-shrink-0" />
                                Av. La Dársena entre 7 y 8, recinto portuario, Puerto Peñasco, Sonora
                            </p>
                        </div>
                        <div>
                            <h3 className="text-lg font-extrabold">Instituciones</h3>
                            <ul className="mt-2 space-y-1 text-[17px] text-simar-texto-2 movil:text-[15px]">
                                <li>DCK Conciencia y Cultura</li>
                                <li>ITSPP</li>
                                <li>SEMARNAT</li>
                            </ul>
                        </div>
                    </div>
                    <p className="text-[17px] text-simar-texto-2 md:text-right movil:text-[15px]">
                        © {new Date().getFullYear()} SiMAR · DCK / ITSPP
                    </p>
                </div>
            </footer>

            {/* Celular: después del hero, "Probar la demo" siempre a la mano (abajo a la derecha: a la
                izquierda va el botón para comparar las dos landings) */}
            {rutaDemo && (
                <a
                    href={rutaDemo}
                    aria-hidden={!pasoHero}
                    tabIndex={pasoHero ? undefined : -1}
                    className={`sm:hidden fixed right-3 z-40 min-h-[48px] px-4 rounded-full bg-simar-marea text-white text-[15px] font-extrabold inline-flex items-center gap-2 shadow-[0_14px_30px_-12px_rgba(11,34,54,0.8)] transition-[opacity,transform] duration-300 bottom-[max(12px,env(safe-area-inset-bottom))] ${
                        pasoHero ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4 pointer-events-none'
                    }`}
                >
                    <PlayCircle className="w-5 h-5" />
                    Probar la demo
                </a>
            )}

            {ventana}
        </div>
    );
}

'use client';

import { Suspense, useEffect, useState, type ReactNode } from 'react';
import { ArrowRight, MapPin } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { MODO_DEMO } from '@/lib/demo/config';
import type { LandingStats } from '@/lib/services/landing_stats';
import type { VarianteMapa } from '../mapa/puertos';
import { useAccesoLanding } from '../acceso/useAccesoLanding';
import { MarDeParticulas } from './MarDeParticulas';
import { ProductoEnEscena } from './ProductoEnEscena';
import { CifrasEnVivo } from './CifrasEnVivo';
import { SeccionNoticias } from './SeccionNoticias';
import { Cierre } from './Cierre';
import { SeccionMapaPuertos } from '../mapa/SeccionMapaPuertos';

const ENLACES = [
    { href: '#inicio', texto: 'Historia' },
    { href: '#producto', texto: 'Cómo funciona' },
    { href: '#impacto', texto: 'Impacto' },
    { href: '#noticias', texto: 'Noticias' },
    { href: '#puertos', texto: 'Puertos' },
];

/**
 * La landing 3D: dos actos y lo demás sencillo.
 *
 *  1. «Mar de partículas» (oscuro): una figura de luz que cambia con el scroll y cuenta el problema.
 *  2. «SiMAR, en tus manos» (claro, al estilo de las páginas de producto de Apple): una laptop y un
 *     celular en 3D con las pantallas reales.
 *  Luego: cifras en vivo, noticias, puertos y el llamado final.
 *
 * Se ve con ?landing=3d (SelectorVersionLanding). Ver DISEÑO_SIMAR.md §8.6.
 */
export function LandingTresD({ stats, varianteMapa }: { stats: LandingStats | null; varianteMapa: VarianteMapa }) {
    const hayDatos = stats !== null && stats.totalManifiestos > 0;
    const statsReales = hayDatos ? stats : null;

    const { abrirAcceso, rutaDemo, ventana } = useAccesoLanding();
    const textoEntrar = MODO_DEMO ? 'Probar la demo' : 'Iniciar sesión';

    // La barra es oscura sobre el primer acto y toma el tema después
    const [sobreOscuro, setSobreOscuro] = useState(true);
    const [seccion, setSeccion] = useState<string | null>(null);
    useEffect(() => {
        const oscuras = Array.from(document.querySelectorAll('[data-tono="oscuro"]'));
        const visibles = new Set<Element>();
        const tono = new IntersectionObserver(
            (entradas) => {
                for (const e of entradas) {
                    if (e.isIntersecting) visibles.add(e.target);
                    else visibles.delete(e.target);
                }
                setSobreOscuro(visibles.size > 0);
            },
            // Sólo cuenta lo que pasa por debajo de la barra (los primeros 80 px)
            { rootMargin: '0px 0px -92% 0px' }
        );
        oscuras.forEach((el) => tono.observe(el));
        const vistas = new IntersectionObserver(
            (entradas) => {
                for (const e of entradas) if (e.isIntersecting) setSeccion(`#${e.target.id}`);
            },
            { rootMargin: '-50% 0px -50% 0px' }
        );
        for (const { href } of ENLACES) {
            const el = document.querySelector(href);
            if (el) vistas.observe(el);
        }
        return () => {
            tono.disconnect();
            vistas.disconnect();
        };
    }, []);

    return (
        <div className="simar-landing t3 relative min-h-screen w-full overflow-x-clip bg-simar-papel font-sans text-simar-texto antialiased">
            <nav
                aria-label="Principal"
                data-oscuro={sobreOscuro ? 'true' : 'false'}
                className="t3-barra fixed top-3 md:top-5 inset-x-3 md:inset-x-8 z-50 rounded-[26px]"
            >
                <div className="h-[68px] md:h-[76px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-3 movil:h-[60px] movil:pl-2.5">
                    <a href="#inicio" className="flex items-center rounded-2xl min-w-0" aria-label="SiMAR - Inicio">
                        <LogoSimar variante="simbolo" tamano={40} className="sm:hidden" />
                        <LogoSimar tamano={44} tono={sobreOscuro ? 'oscuro' : 'auto'} className="hidden sm:inline-flex" />
                    </a>
                    <div className="hidden xl:flex items-center gap-7 ml-auto">
                        {ENLACES.map((e) => {
                            const activa = seccion === e.href;
                            return (
                                <a
                                    key={e.href}
                                    href={e.href}
                                    aria-current={activa ? 'location' : undefined}
                                    className="t3-enlace relative min-h-[48px] flex items-center whitespace-nowrap text-[17px] font-semibold transition-colors"
                                >
                                    {e.texto}
                                    <span
                                        aria-hidden="true"
                                        className={`absolute inset-x-0 bottom-1.5 h-[3px] rounded-full bg-simar-golfo transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] ${
                                            activa ? 'scale-x-100' : 'scale-x-0'
                                        }`}
                                    />
                                </a>
                            );
                        })}
                    </div>
                    <div className="ml-auto xl:ml-3 flex items-center gap-2">
                        <BotonTemaIcono className="t3-tema movil:w-[46px] movil:h-[46px] movil:rounded-[15px]" />
                        <button
                            type="button"
                            onClick={() => abrirAcceso()}
                            className="simar-presiona min-h-[52px] md:min-h-[56px] px-5 md:px-6 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-base md:text-lg font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap movil:min-h-[46px] movil:px-4 movil:text-[15px]"
                        >
                            {textoEntrar}
                            <ArrowRight className="w-5 h-5 movil:hidden" strokeWidth={2.4} />
                        </button>
                    </div>
                </div>
            </nav>

            <main>
                <div data-tono="oscuro">
                    <MarDeParticulas textoEntrar={textoEntrar} alEntrar={() => abrirAcceso()} rutaDemo={rutaDemo} />
                </div>
                <PorPartes>
                    <ProductoEnEscena />
                </PorPartes>
                <PorPartes>
                    <CifrasEnVivo stats={statsReales} />
                </PorPartes>
                <PorPartes>
                    <SeccionNoticias />
                </PorPartes>
                <PorPartes>
                    <section id="puertos" data-tono="oscuro" className="relative bg-simar-abismo text-white px-6 py-24 md:py-36 overflow-clip movil:px-5 movil:py-16">
                        <div className="relative max-w-[1248px] mx-auto">
                            <div className="max-w-4xl mb-12 md:mb-16 movil:mb-8">
                                <p className="t3-enfoca text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">Puertos</p>
                                <h2 className="t3-enfoca mt-3 text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]">
                                    Hoy, Puerto Peñasco. Mañana, otros puertos.
                                </h2>
                                <p className="t3-enfoca mt-5 max-w-3xl text-xl md:text-[22px] leading-relaxed text-simar-franja-texto-2 movil:mt-3 movil:text-[17px]">
                                    Puerto Peñasco es el primero. Estos son puertos pesqueros de México donde el modelo de SiMAR puede replicarse.
                                </p>
                            </div>
                            <div className="t3-enfoca">
                                <SeccionMapaPuertos variante={varianteMapa} nombreFuturos="Puede sumarse" resumenFuturos="Pueden sumarse" />
                            </div>
                        </div>
                    </section>
                </PorPartes>
                <PorPartes>
                    <div data-tono="oscuro">
                        <Cierre textoEntrar={textoEntrar} rutaDemo={rutaDemo} alEntrar={() => abrirAcceso()} alRegistrarEmpresa={() => abrirAcceso('recolector')} />
                    </div>
                </PorPartes>
            </main>

            <footer className="bg-simar-superficie border-t border-simar-borde px-6 py-12 md:py-14 movil:px-5 movil:py-10 movil:pb-28">
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
                    <p className="text-[17px] text-simar-texto-2 md:text-right movil:text-[15px]">© {new Date().getFullYear()} SiMAR · DCK / ITSPP</p>
                </div>
            </footer>

            {ventana}
        </div>
    );
}

/** Cada parte después de la portada se hidrata por su cuenta (tareas cortas: la portada responde antes) */
function PorPartes({ children }: { children: ReactNode }) {
    return <Suspense fallback={null}>{children}</Suspense>;
}

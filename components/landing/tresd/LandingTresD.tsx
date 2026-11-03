'use client';

import { Suspense, useEffect, useRef, useState, type ReactNode } from 'react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, Droplets, Map as IconoMapa, MapPin, Menu, MonitorSmartphone, Newspaper, Waves, X, type LucideIcon } from 'lucide-react';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { MODO_DEMO } from '@/lib/demo/config';
import type { LandingStats } from '@/lib/services/landing_stats';
import type { VarianteMapa } from '../mapa/puertos';
import { useAccesoLanding } from '../acceso/useAccesoLanding';
import { ProductoEnEscena } from './ProductoEnEscena';
import { PorQueImporta } from './PorQueImporta';
import { CifrasEnVivo } from './CifrasEnVivo';
import { Cierre } from './Cierre';
import { SeccionMapaPuertos } from '../mapa/SeccionMapaPuertos';

/** Las secciones de la página y, aparte, la página de Noticias (`pagina`: una dirección, no un ancla) */
const ENLACES: { href: string; texto: string; detalle: string; Icono: LucideIcon; pagina?: boolean }[] = [
    { href: '#producto', texto: 'Cómo funciona', detalle: 'Manifiestos, firmas y cifras', Icono: MonitorSmartphone },
    { href: '#por-que', texto: 'Por qué importa', detalle: 'El aceite, la basura y el mar', Icono: Waves },
    { href: '#impacto', texto: 'Impacto', detalle: 'Lo que se ha registrado', Icono: Droplets },
    { href: '#puertos', texto: 'Puertos', detalle: 'Dónde puede llegar', Icono: IconoMapa },
    { href: '/noticias', texto: 'Noticias', detalle: 'El proyecto, el mar y sus fuentes', Icono: Newspaper, pagina: true },
];

/**
 * La landing 3D, sencilla y en orden:
 *
 *  1. Portada y «Cómo funciona» (al estilo de las páginas de producto de Apple): el título y una
 *     laptop cerrada que se abre al bajar; luego la cámara recorre las pantallas reales y entra el
 *     celular con el portal de las empresas.
 *  2. «Por qué importa» (oscuro): la cifra del aceite, tres temas, el antes y después del papel.
 *  Luego: cifras en vivo, un adelanto de Noticias (que es una página aparte), puertos y el cierre.
 *
 * Se ve con ?landing=3d (SelectorVersionLanding). Ver DISEÑO_SIMAR.md §8.6.
 */
export function LandingTresD({
    stats,
    varianteMapa,
    noticias,
}: {
    stats: LandingStats | null;
    varianteMapa: VarianteMapa;
    /** La sección de noticias, armada en el servidor (SeccionNoticias) */
    noticias: ReactNode;
}) {
    const hayDatos = stats !== null && stats.totalManifiestos > 0;
    const statsReales = hayDatos ? stats : null;

    const { abrirAcceso, rutaDemo, ventana } = useAccesoLanding();
    const textoEntrar = MODO_DEMO ? 'Probar la demo' : 'Iniciar sesión';
    const { locale } = useParams<{ locale: string }>();

    // Menú de secciones (bajo 1280 px los enlaces no caben en la barra)
    const [menu, setMenu] = useState(false);
    const menuRef = useRef<HTMLDivElement>(null);
    const botonMenuRef = useRef<HTMLButtonElement>(null);
    useVentanaAccesible(menuRef, menu, { alEscape: () => setMenu(false) });
    useEffect(() => {
        if (!menu) return;
        // Se cierra al tocar fuera de la barra
        const fuera = (e: PointerEvent) => {
            const t = e.target as Node;
            if (!menuRef.current?.contains(t) && !botonMenuRef.current?.contains(t)) setMenu(false);
        };
        document.addEventListener('pointerdown', fuera);
        return () => document.removeEventListener('pointerdown', fuera);
    }, [menu]);

    // Cuánto falta de toda la página (una línea en la orilla de abajo de la barra) y en qué sección
    // está la mitad de la pantalla (el enlace activo). «Cómo funciona» empieza en su ancla
    // (#producto, después de la portada) y llega hasta el final de la escena (#inicio).
    const avanceRef = useRef<HTMLSpanElement>(null);
    const [seccion, setSeccion] = useState<string | null>(null);
    useEffect(() => {
        let cuadro = 0;
        const pintar = () => {
            cuadro = 0;
            const el = avanceRef.current;
            const total = document.documentElement.scrollHeight - window.innerHeight;
            if (el) el.style.transform = `scaleX(${total > 0 ? Math.min(1, window.scrollY / total).toFixed(4) : 0})`;
            const mitad = window.innerHeight / 2;
            let activa: string | null = null;
            for (const { href, pagina } of ENLACES) {
                if (pagina) continue;
                const destino = document.querySelector(href);
                if (!destino) continue;
                const arriba = destino.getBoundingClientRect().top;
                const abajo = (href === '#producto' ? document.querySelector('#inicio') ?? destino : destino).getBoundingClientRect().bottom;
                if (arriba <= mitad && abajo > mitad) activa = href;
            }
            setSeccion(activa);
        };
        const alMover = () => {
            if (!cuadro) cuadro = requestAnimationFrame(pintar);
        };
        pintar();
        window.addEventListener('scroll', alMover, { passive: true });
        window.addEventListener('resize', alMover);
        return () => {
            cancelAnimationFrame(cuadro);
            window.removeEventListener('scroll', alMover);
            window.removeEventListener('resize', alMover);
        };
    }, []);

    // La barra toma el tema y se vuelve oscura sobre las secciones oscuras
    const [sobreOscuro, setSobreOscuro] = useState(false);
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
        return () => tono.disconnect();
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
                            const Enlace = e.pagina ? Link : 'a';
                            return (
                                <Enlace
                                    key={e.href}
                                    href={e.pagina ? `/${locale}${e.href}` : e.href}
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
                                </Enlace>
                            );
                        })}
                    </div>
                    <div className="ml-auto xl:ml-3 flex items-center gap-2">
                        <BotonTemaIcono className="t3-tema movil:w-[46px] movil:h-[46px] movil:rounded-[15px]" />
                        <button
                            ref={botonMenuRef}
                            type="button"
                            onClick={() => setMenu((v) => !v)}
                            aria-expanded={menu}
                            aria-controls="t3-menu"
                            aria-label={menu ? 'Cerrar el menú de secciones' : 'Abrir el menú de secciones'}
                            className="t3-tema xl:hidden simar-presiona w-[54px] h-[54px] md:w-[58px] md:h-[58px] flex-shrink-0 rounded-[18px] border border-simar-texto/15 bg-white/50 dark:bg-white/5 flex items-center justify-center cursor-pointer movil:w-[46px] movil:h-[46px] movil:rounded-[15px]"
                        >
                            {menu ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
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

                {/* El menú de secciones: renglones grandes con lo que hay en cada una; se cierra al elegir */}
                {menu && (
                    <div ref={menuRef} id="t3-menu" tabIndex={-1} className="xl:hidden simar-aparece px-2.5 pb-3 md:px-3 outline-none">
                        <ul className="grid sm:grid-cols-2 gap-1 pt-2 border-t border-current/10">
                            {ENLACES.map(({ href, texto, detalle, Icono, pagina }) => {
                                const activa = seccion === href;
                                const Enlace = pagina ? Link : 'a';
                                return (
                                    <li key={href}>
                                        <Enlace
                                            href={pagina ? `/${locale}${href}` : href}
                                            onClick={() => setMenu(false)}
                                            aria-current={activa ? 'location' : undefined}
                                            className={`t3-opcion min-h-[64px] px-3 rounded-[18px] flex items-center gap-3.5 transition-colors movil:min-h-[58px] ${activa ? 't3-opcion-activa' : ''}`}
                                        >
                                            <span className="t3-opcion-icono w-11 h-11 rounded-[14px] flex-shrink-0 flex items-center justify-center">
                                                <Icono className="w-[22px] h-[22px]" strokeWidth={2} />
                                            </span>
                                            <span className="min-w-0">
                                                <span className="block text-[18px] font-extrabold leading-tight movil:text-[17px]">{texto}</span>
                                                <span className="t3-opcion-detalle block text-[15px] leading-snug">{detalle}</span>
                                            </span>
                                        </Enlace>
                                    </li>
                                );
                            })}
                        </ul>
                    </div>
                )}

                {/* Cuánto falta de la página */}
                <span aria-hidden="true" className="pointer-events-none absolute left-6 right-6 bottom-0 h-[2px] rounded-full overflow-hidden">
                    <span ref={avanceRef} className="t3-avance absolute inset-0 origin-left" style={{ transform: 'scaleX(0)' }} />
                </span>
            </nav>

            <main>
                <ProductoEnEscena textoEntrar={textoEntrar} alEntrar={() => abrirAcceso()} rutaDemo={rutaDemo} />
                <PorPartes>
                    <div data-tono="oscuro">
                        <PorQueImporta locale={locale} />
                    </div>
                </PorPartes>
                <PorPartes>
                    <CifrasEnVivo stats={statsReales} />
                </PorPartes>
                {noticias}
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

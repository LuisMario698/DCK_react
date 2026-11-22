'use client';

import { useEffect, useRef, useState, type CSSProperties } from 'react';
import Image from 'next/image';
import { ArrowRight, Menu, X } from 'lucide-react';
import logoItspp from '@/public/assets/logo_ITSPP.png';
import logoIcs from '@/public/assets/logo_ICS.png';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { LineaMarea } from '@/components/layout/LineaMarea';
import { MODO_DEMO } from '@/lib/demo/config';
import { IslaDinamica } from '@/components/isla/IslaDinamica';
import { useGota } from '@/components/isla/islaTienda';
import { useLenteSobre } from '@/components/isla/useLenteSobre';
import { SwitchVersionLanding } from '@/components/landing/SwitchVersionLanding';

/** El botón del menú de secciones: abre su gota de la isla (y es de donde nace) */
function BotonSecciones() {
    const { ancla, alternar, abierta } = useGota('secciones');
    return (
        <button
            ref={ancla}
            type="button"
            onClick={alternar}
            aria-expanded={abierta}
            aria-haspopup="dialog"
            aria-label={abierta ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
            data-vidrio="claro"
            className="xl:hidden simar-presiona w-[54px] h-[54px] md:w-[58px] md:h-[58px] flex-shrink-0 rounded-[18px] border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto flex items-center justify-center movil:w-[46px] movil:h-[46px] movil:rounded-[15px]"
        >
            {abierta ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
    );
}

/** Las secciones, en la gota que cae del botón del menú: renglones grandes, se cierra al elegir */
function MenuSecciones({ activa }: { activa: string | null }) {
    const gota = useGota('secciones');
    return (
        <nav aria-label="Secciones" className="p-3">
            <p className="isla-escalon px-3 pt-1 pb-2 text-[13px] font-extrabold uppercase tracking-[0.12em] text-simar-texto-2">En esta página</p>
            <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                {NAV_LINKS.map((link, i) => (
                    // Los renglones llegan uno tras otro cuando la gota ya casi cayó
                    <li key={link.href} className="isla-escalon" style={{ '--i': i + 1 } as CSSProperties}>
                        <a
                            href={link.href}
                            onClick={gota.cerrar}
                            aria-current={activa === link.href ? 'location' : undefined}
                            data-vidrio="claro"
                            className={`min-h-[56px] px-4 rounded-2xl flex items-center justify-between text-lg font-bold transition-colors movil:min-h-[50px] movil:text-[17px] ${
                                activa === link.href ? 'bg-simar-texto text-simar-papel' : 'text-simar-texto hover:bg-simar-texto/[0.06]'
                            }`}
                        >
                            {link.label}
                            <ArrowRight className={`w-5 h-5 ${activa === link.href ? 'text-simar-papel/70' : 'text-simar-texto-2'}`} />
                        </a>
                    </li>
                ))}
            </ul>
        </nav>
    );
}

const NAV_LINKS = [
    // En el orden de la página: así la línea de marea sólo avanza
    { href: '#como-funciona', label: 'Cómo funciona' },
    { href: '#noticias', label: 'Noticias' },
    { href: '#impacto', label: 'Impacto' },
    { href: '#don-francisco', label: 'Don Francisco' },
    { href: '#mapa', label: 'Puertos' },
    { href: '#proyecto', label: 'Quiénes' },
];

/**
 * Navbar — la isla dinámica del portal (components/isla): vidrio líquido; el menú de secciones cae
 * como gota de su botón. Lleva su propio estado (scroll, sección activa, línea de marea): al cambiar
 * no redibuja las secciones de la landing.
 */
export function IslaActual({ alAbrirAcceso }: { alAbrirAcceso: () => void }) {
    const [scrolled, setScrolled] = useState(false);

    // Sección visible en pantalla: la línea de marea del menú se desliza bajo su enlace
    const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
    const { lente: lenteEnlaces, ...oyentesLente } = useLenteSobre('a', 'mitad');
    const enlacesRef = useRef<HTMLDivElement>(null);
    const [marcaMenu, setMarcaMenu] = useState<{ x: number; visible: boolean }>({ x: 0, visible: false });

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Qué sección cruza el centro de la pantalla
    useEffect(() => {
        const secciones = NAV_LINKS.map((l) => document.querySelector<HTMLElement>(l.href)).filter(
            (s): s is HTMLElement => s !== null
        );
        const obs = new IntersectionObserver(
            (entradas) => {
                for (const e of entradas) {
                    if (e.isIntersecting) setSeccionActiva(`#${e.target.id}`);
                    else if (e.boundingClientRect.top > 0 && e.target === secciones[0]) setSeccionActiva(null);
                }
            },
            { rootMargin: '-45% 0px -50% 0px' }
        );
        secciones.forEach((s) => obs.observe(s));
        return () => obs.disconnect();
    }, []);

    // Posición de la línea de marea bajo el enlace activo (y al cambiar el tamaño de la ventana)
    useEffect(() => {
        const medir = () => {
            const contenedor = enlacesRef.current;
            const enlace = seccionActiva ? contenedor?.querySelector<HTMLElement>(`a[href="${seccionActiva}"]`) : null;
            setMarcaMenu((m) => (enlace ? { x: enlace.offsetLeft, visible: true } : { ...m, visible: false }));
        };
        const id = requestAnimationFrame(medir);
        window.addEventListener('resize', medir);
        return () => {
            cancelAnimationFrame(id);
            window.removeEventListener('resize', medir);
        };
    }, [seccionActiva]);

    return (
        <IslaDinamica
            etiqueta="Principal"
            radio={30}
            fuerte={scrolled}
            // De 1280 a 1439 px la isla se abre un poco más (inset 20 px) para que quepan los enlaces
            className="simar-entra fixed top-3 md:top-6 inset-x-3 min-[768px]:inset-x-8 min-[1280px]:inset-x-5 min-[1440px]:inset-x-8 z-50"
            style={{ animationDuration: '0.7s' }}
            gotas={[{ id: 'secciones', etiqueta: 'Secciones de la página', ancho: 560, contenido: <MenuSecciones activa={seccionActiva} /> }]}
        >
            {/* Avance de lectura: la marea sube con el scroll (sólo navegadores que lo soportan) */}
            <span aria-hidden="true" className="absolute left-7 right-7 bottom-0 h-[3px] overflow-hidden rounded-full">
                <span className="simar-progreso h-full w-full bg-simar-golfo" />
            </span>
            <div className="h-[72px] md:h-[84px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-2 sm:gap-5 movil:h-[62px] movil:pl-2.5">
                {/* flex-shrink-0: si la fila se aprieta, el logo no se encoge (el nombre se salía y
                    quedaba encima de «Proyecto» a 1280 px) */}
                <a href="#top" className="flex items-center gap-4 rounded-2xl flex-shrink-0" aria-label="SiMAR - Inicio">
                    {/* En celular sólo el símbolo: el nombre ya está grande en el hero */}
                    <LogoSimar variante="simbolo" tamano={42} className="sm:hidden" />
                    <LogoSimar tamano={46} className="hidden sm:inline-flex" />
                    <span aria-hidden="true" className="hidden min-[768px]:block min-[1280px]:hidden min-[1440px]:block h-9 w-px bg-simar-texto/20" />
                    {/* Logos institucionales: en oscuro van sobre una pastilla clara (tienen letras negras).
                        De 1280 a 1439 px no van: ahí aparecen los enlaces de las secciones y con los logos
                        ya no caben en un renglón (laptops de 1366 px y proyectores). Los cortes van todos
                        como min-[…]: Tailwind pone los arbitrarios antes que md/xl y xl:hidden les ganaría */}
                    <span className="hidden min-[768px]:flex min-[1280px]:hidden min-[1440px]:flex items-center gap-3 rounded-xl dark:bg-white/90 dark:px-2.5 dark:py-1">
                        {/* Con next/image (diferidas) no se descargan donde no se ven: en celular el PNG
                            original del ITSPP pesaba 264 KB y bajaba aunque estuviera oculto */}
                        <Image src={logoItspp} alt="ITSPP" width={35} height={40} className="h-10 w-auto object-contain" />
                        <Image src={logoIcs} alt="ICS" width={48} height={36} className="h-9 w-auto object-contain" />
                    </span>
                </a>

                {/* Entre enlaces, 14 px hasta 1439 px y 24 px de ahí en adelante: con 24 px los siete
                    enlaces no cabían junto al logo y los botones en una pantalla de 1280 px */}
                <div ref={enlacesRef} className="relative hidden xl:flex items-center gap-3.5 min-[1440px]:gap-6 ml-auto" {...oyentesLente}>
                    {/* Una lente de vidrio que sigue al cursor de un enlace a otro */}
                    <span ref={lenteEnlaces} aria-hidden="true" className="isla-lente-enlaces" />
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.href}
                            href={link.href}
                            aria-current={seccionActiva === link.href ? 'location' : undefined}
                            className="min-h-[48px] flex items-center whitespace-nowrap text-[17px] font-semibold text-simar-texto hover:text-simar-marea-tinta transition-colors"
                        >
                            {link.label}
                        </a>
                    ))}
                    {/* Línea de marea: se desliza bajo la sección que se está leyendo */}
                    <span
                        aria-hidden="true"
                        className="absolute left-0 bottom-[3px] pointer-events-none transition-[transform,opacity] duration-500"
                        style={{
                            transform: `translateX(${marcaMenu.x}px)`,
                            opacity: marcaMenu.visible ? 1 : 0,
                            transitionTimingFunction: 'var(--simar-frena)',
                        }}
                    >
                        <LineaMarea key={seccionActiva ?? 'ninguna'} className="block" />
                    </span>
                </div>

                <div className="ml-auto xl:ml-0 flex items-center gap-2">
                    {/* Sólo en la demo: volver a la landing de antes del rediseño */}
                    <SwitchVersionLanding actual="nueva" vidrio />
                    <BotonTemaIcono vidrio className="movil:w-[46px] movil:h-[46px] movil:rounded-[15px]" />
                    {/* Menú de secciones (bajo 1280 px los enlaces no caben en la barra): cae como gota */}
                    <BotonSecciones />
                    <button
                        onClick={alAbrirAcceso}
                        data-vidrio=""
                        className="simar-presiona min-h-[54px] md:min-h-[58px] px-4 sm:px-5 md:px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-base md:text-lg font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap movil:min-h-[46px] movil:px-3.5 movil:rounded-[15px] movil:text-[15px]"
                    >
                        {MODO_DEMO ? 'Probar la demo' : 'Iniciar sesión'}
                        <ArrowRight className="hidden sm:block w-5 h-5" strokeWidth={2.4} />
                    </button>
                </div>
            </div>

        </IslaDinamica>
    );
}

'use client';

import { useState, useEffect, useRef, type CSSProperties } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { SeccionMapaPuertos } from './mapa/SeccionMapaPuertos';
import type { VarianteMapa } from './mapa/puertos';
import { useScrollReveal } from './useScrollReveal';
import type { LandingStats } from '@/lib/services/landing_stats';
import {
    ArrowDown,
    ArrowRight,
    BookOpen,
    Clock,
    Droplets,
    Fish,
    Recycle,
    FileCheck,
    ShieldCheck,
    Sprout,
    TreePine,
    Waves,
    Anchor,
    LineChart,
    Quote,
    Globe2,
    X,
    ArrowLeft,
    SquareTerminal,
    Pause,
    Play,
    Menu,
    type LucideIcon,
} from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { BotonTemaIcono } from '@/components/layout/ThemeToggle';
import { LineaMarea } from '@/components/layout/LineaMarea';
import { NumeroAnimado, usePrefiereMenosMovimiento, usePresencia } from '@/components/ui/movimiento';

/** Segundos que se queda cada fotografía del carrusel (la píldora activa se llena en ese tiempo) */
const SEGUNDOS_POR_FOTO = 6;

/** Ola del logo, larga, bajo la palabra SiMAR del hero (se dibuja al cargar) */
const OLA_TITULO = `M2 7 Q9.4 1 16.75 7 ${Array.from({ length: 15 }, (_, i) => `T${(2 + (i + 2) * 14.75).toFixed(2)} 7`).join(' ')}`;

/**
 * Borde de ola entre una franja clara y una oscura. `color` es el de la franja vecina;
 * `lado` dice si la ola cuelga desde arriba o sube desde abajo de la sección.
 */
function OlaSeparador({ color, lado }: { color: string; lado: 'arriba' | 'abajo' }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
            className={`absolute inset-x-0 h-10 md:h-16 w-full pointer-events-none ${lado === 'arriba' ? 'top-0' : 'bottom-0 rotate-180'}`}
        >
            <path
                d="M0 0 H1440 V22 C1320 44 1190 54 1060 40 C930 26 820 6 700 14 C580 22 470 50 340 52 C210 54 110 36 0 26 Z"
                style={{ fill: color, opacity: 0.45 }}
            />
            <path
                d="M0 0 H1440 V14 C1300 30 1180 38 1040 28 C900 18 800 2 680 8 C560 14 450 36 320 38 C190 40 100 26 0 18 Z"
                style={{ fill: color }}
            />
        </svg>
    );
}

type RolGuardado = 'admin' | 'recolector';
// 'superadmin' = acceso de desarrollador (enlace discreto del footer); no se
// ofrece en el selector ni se recuerda.
type ModalRole = RolGuardado | 'superadmin';

const DESTINO_POR_ROL: Record<ModalRole, string> = {
    admin: '/dashboard',
    recolector: '/dashboard-recolector',
    superadmin: '/superadmin',
};

// Sólo recuerda la opción elegida en el modal. El acceso real lo decide
// `profiles.rol` en el middleware (utils/supabase/middleware.ts).
function saveRole(r: RolGuardado) {
    document.cookie = `simar_user_role=${r}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem('simar_user_role', r);
}

function readSavedRole(): RolGuardado | null {
    try {
        const v = localStorage.getItem('simar_user_role');
        return v === 'admin' || v === 'recolector' ? v : null;
    } catch {
        return null;
    }
}

interface MediaItem {
    type: 'image' | 'video';
    src: string;
    poster?: string;
}

const MEDIA: MediaItem[] = [
    { type: 'image', src: '/assets/images/img1.jpeg' },
    { type: 'image', src: '/assets/images/img2.jpeg' },
    { type: 'image', src: '/assets/images/img3.jpeg' },
    { type: 'image', src: '/assets/images/img4.jpeg' },
    { type: 'image', src: '/assets/images/img5.jpeg' },
    { type: 'image', src: '/assets/images/img6.jpeg' },
    { type: 'image', src: '/assets/images/img7.jpeg' },
];

const NAV_LINKS = [
    { href: '#proyecto', label: 'Proyecto' },
    { href: '#don-francisco', label: 'Don Francisco' },
    { href: '#conciencia', label: 'Conciencia Azul' },
    { href: '#equivalencias', label: 'Equivalencias' },
    { href: '#mapa', label: 'Puertos' },
    { href: '#impacto', label: 'Impacto' },
];

// color = círculo del ícono, accent = cifra (franja oscura). Ver DISEÑO_SIMAR.md
// cifra/sufijo: si la cifra es un número, cuenta al aparecer.
const AWARENESS_PANELS: {
    icon: LucideIcon;
    title: string;
    stat: string;
    cifra?: number;
    sufijo?: string;
    statLabel: string;
    desc: string;
    color: string;
    accent: string;
}[] = [
    {
        icon: Droplets,
        title: 'Aceites y combustibles',
        stat: '1 L',
        statLabel: 'contamina hasta 1,000,000 L de agua',
        desc: 'Los aceites usados y residuos de diésel derramados en el mar forman películas que impiden el intercambio de oxígeno y afectan toda la cadena alimentaria marina.',
        color: 'bg-[rgba(242,193,78,0.16)] text-[#F2C14E]',
        accent: 'text-[#F2C14E]',
    },
    {
        icon: Fish,
        title: 'Biodiversidad marina',
        stat: '2,000+',
        cifra: 2000,
        sufijo: '+',
        statLabel: 'especies en el Mar de Cortés',
        desc: 'El Alto Golfo de California es santuario de la vaquita marina y hogar de una de las biodiversidades marinas más ricas del planeta. Cada registro cuenta.',
        color: 'bg-[rgba(127,224,214,0.16)] text-[#7FE0D6]',
        accent: 'text-[#7FE0D6]',
    },
    {
        icon: Recycle,
        title: 'Economía circular',
        stat: '100%',
        cifra: 100,
        sufijo: '%',
        statLabel: 'de residuos con destino verificado',
        desc: 'Cada filtro, cada litro de aceite y cada bolsa de basura es rastreada desde la embarcación hasta su disposición final certificada, cerrando el ciclo.',
        color: 'bg-[rgba(95,209,160,0.16)] text-[#6FD9AE]',
        accent: 'text-[#6FD9AE]',
    },
    {
        icon: ShieldCheck,
        title: 'Cumplimiento MARPOL',
        stat: 'Anexo V',
        statLabel: 'Convenio Internacional',
        desc: 'MARPOL es la norma internacional que regula la contaminación generada por buques. Nuestro sistema garantiza su cumplimiento con evidencia digital trazable.',
        color: 'bg-[rgba(138,180,248,0.16)] text-[#9DBEF7]',
        accent: 'text-[#9DBEF7]',
    },
];

interface EquivalenciaCard {
    icon: LucideIcon;
    label: string;
    inputValue: number;
    inputDecimals: number;
    inputUnit: string;
    inputCaption: string;
    impactValue: number;
    impactDecimals: number;
    impactUnit: string;
    impactDescription: string;
    /** Clases del círculo del ícono (ver DISEÑO_SIMAR.md) */
    tono: string;
    featured?: boolean;
}

function ModalRoleCard({
    title,
    desc,
    accent,
    Icon,
    onClick,
}: {
    title: string;
    desc: string;
    accent: 'blue' | 'emerald';
    Icon: React.ComponentType<{ className?: string }>;
    onClick: () => void;
}) {
    const s =
        accent === 'blue'
            ? { wrap: 'hover:border-simar-marea-tinta', icon: 'bg-simar-marea-suave text-simar-marea-tinta', arrow: 'text-simar-marea-tinta' }
            : { wrap: 'hover:border-simar-arrecife', icon: 'bg-simar-arrecife-suave text-simar-arrecife-tinta', arrow: 'text-simar-arrecife-tinta' };
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group text-left w-full rounded-3xl border-2 border-simar-borde bg-simar-superficie p-5 md:p-6 flex flex-col gap-2.5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 ${s.wrap}`}
        >
            <span className={`w-14 h-14 rounded-full flex items-center justify-center ${s.icon}`}>
                <Icon className="w-7 h-7" />
            </span>
            <span className="text-xl md:text-[21px] font-extrabold text-simar-texto">{title}</span>
            <span className="text-[17px] leading-snug text-simar-texto-2">{desc}</span>
            <span className={`mt-1 flex items-center gap-1.5 text-[17px] font-bold ${s.arrow}`}>
                Continuar <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-0.5 transition-transform" />
            </span>
        </button>
    );
}

function buildEquivalencias(stats: LandingStats | null): EquivalenciaCard[] {
    const aceite       = stats?.totalAceiteUsado ?? 0;
    const basuraKg     = (stats?.totalBasura ?? 0) + (stats?.totalBasuron ?? 0);
    const totalFiltros = (stats?.filtrosAceite ?? 0) + (stats?.filtrosDiesel ?? 0) + (stats?.filtrosAire ?? 0);
    const manifiestos  = stats?.totalManifiestos ?? 0;

    const piscinas   = (aceite * 1_000_000) / 2_500_000;
    const hojas      = manifiestos * 3;
    const arboles    = hojas / 10_000;
    const sueloL     = totalFiltros * 40;
    const bolsas     = basuraKg * 125;
    const horas      = (manifiestos * 25) / 60;

    return [
        {
            icon: Waves,
            label: 'Agua protegida',
            inputValue: aceite,
            inputDecimals: 1,
            inputUnit: 'L',
            inputCaption: 'de aceite recopilado',
            impactValue: piscinas,
            impactDecimals: piscinas >= 100 ? 0 : 1,
            impactUnit: 'piscinas olímpicas',
            impactDescription: 'de agua que no se contaminó',
            tono: 'bg-white text-[#1B5FC9]',
            featured: true,
        },
        {
            icon: Fish,
            label: 'Mar limpio',
            inputValue: basuraKg,
            inputDecimals: 1,
            inputUnit: 'kg',
            inputCaption: 'de basura gestionada',
            impactValue: bolsas,
            impactDecimals: 0,
            impactUnit: 'bolsas de plástico',
            impactDescription: 'que no llegaron al océano',
            tono: 'bg-[#E4F5F7] text-[#0E7C8A] dark:bg-[rgba(32,178,196,0.2)] dark:text-[#7FE0D6]',
        },
        {
            icon: TreePine,
            label: 'Árboles en pie',
            inputValue: hojas,
            inputDecimals: 0,
            inputUnit: 'hojas',
            inputCaption: 'de papel evitadas',
            impactValue: arboles,
            impactDecimals: arboles >= 10 ? 0 : 2,
            impactUnit: 'árboles',
            impactDescription: 'que siguen absorbiendo CO₂',
            tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        },
        {
            icon: Sprout,
            label: 'Suelo protegido',
            inputValue: totalFiltros,
            inputDecimals: 0,
            inputUnit: 'filtros',
            inputCaption: 'de motor recibidos',
            impactValue: sueloL,
            impactDecimals: 0,
            impactUnit: 'litros de tierra',
            impactDescription: 'libres de contaminación',
            tono: 'bg-simar-coral-suave text-simar-coral',
        },
        {
            icon: Clock,
            label: 'Tiempo liberado',
            inputValue: manifiestos,
            inputDecimals: 0,
            inputUnit: 'registros',
            inputCaption: 'digitales, no en papel',
            impactValue: horas,
            impactDecimals: 0,
            impactUnit: 'horas',
            impactDescription: 'devueltas al cuidado del mar',
            tono: 'bg-simar-marea-suave text-simar-marea-tinta',
        },
        {
            icon: BookOpen,
            label: 'Historia viva',
            inputValue: manifiestos,
            inputDecimals: 0,
            inputUnit: 'puntos',
            inputCaption: 'de datos ambientales',
            impactValue: 11,
            impactDecimals: 0,
            impactUnit: 'años',
            impactDescription: 'del Mar de Cortés en evidencia',
            tono: 'bg-simar-violeta-suave text-simar-violeta',
        },
    ];
}

export function VariantCinematic({
    stats,
    varianteMapa,
    compararMapas = false,
}: {
    stats: LandingStats | null;
    varianteMapa: VarianteMapa;
    compararMapas?: boolean;
}) {
    // `stats` puede llegar relleno de ceros si la consulta no devolvió filas
    // (RLS bloquea al visitante anónimo). En ese caso la página debe usar el
    // texto de referencia, no afirmar que son datos reales de la BD.
    const hayDatos = stats !== null && stats.totalManifiestos > 0;
    const statsReales = hayDatos ? stats : null;

    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    // null = mostrar selector, 'admin'/'recolector' = ir directo al form
    const [modalRole, setModalRole] = useState<ModalRole | null>(null);
    // Página protegida que se pidió sin sesión (?siguiente=...), para volver tras el login
    const [siguiente, setSiguiente] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [menuMovil, setMenuMovil] = useState(false);
    // La ventana de acceso se queda montada mientras hace su salida
    const ventanaAcceso = usePresencia(showLoginModal, 200);

    // Carrusel: se puede pausar (botón, o al pasar el cursor / enfocar la foto).
    // Con "reducir movimiento" no avanza solo.
    const reducirMovimiento = usePrefiereMenosMovimiento();
    const [pausadoPorUsuario, setPausadoPorUsuario] = useState(false);
    const [pausaMomentanea, setPausaMomentanea] = useState(false);
    const carruselPausado = pausadoPorUsuario || pausaMomentanea;

    // Sección visible en pantalla: la línea de marea del menú se desliza bajo su enlace
    const [seccionActiva, setSeccionActiva] = useState<string | null>(null);
    const enlacesRef = useRef<HTMLDivElement>(null);
    const [marcaMenu, setMarcaMenu] = useState<{ x: number; visible: boolean }>({ x: 0, visible: false });

    const openLoginModal = () => {
        setModalRole(readSavedRole()); // null si no hay guardado → selector
        setShowLoginModal(true);
    };

    // El middleware manda aquí con ?login=1 cuando se pide /dashboard sin sesión.
    // Solo abrimos el modal: NO tocamos la URL aquí, porque un replaceState en el
    // mismo commit provoca un re-render que descartaba el estado y el modal no salía.
    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        if (params.get('login') === '1') {
            // Sólo rutas internas: evita redirecciones abiertas a otros dominios
            const param = params.get('siguiente');
            const destino = param && /^\/(?!\/)[\w\-/]*$/.test(param) ? param : null;
            // Si se pidió el panel de superadmin, el modal abre directo en el acceso de desarrollador
            setModalRole(destino && /^\/(\w{2}\/)?superadmin(\/|$)/.test(destino) ? 'superadmin' : readSavedRole());
            setShowLoginModal(true);
            if (destino) setSiguiente(destino);
        }
    }, []);

    const abrirAccesoDesarrollador = () => {
        setModalRole('superadmin');
        setShowLoginModal(true);
    };

    const cerrarLoginModal = () => {
        setShowLoginModal(false);
        // Ya con el modal cerrado, quitamos el parámetro para que un refresco no lo reabra.
        const params = new URLSearchParams(window.location.search);
        if (params.has('login')) {
            params.delete('login');
            const qs = params.toString();
            window.history.replaceState(null, '', window.location.pathname + (qs ? `?${qs}` : ''));
        }
    };

    const selectModalRole = (r: RolGuardado) => {
        saveRole(r);
        setModalRole(r);
    };

    const clearModalRole = () => {
        setModalRole(null);
    };

    const projectRef = useScrollReveal<HTMLElement>();
    const francoRef = useScrollReveal<HTMLElement>();
    const awarenessRef = useScrollReveal<HTMLElement>();
    const equivRef = useScrollReveal<HTMLElement>();
    const statsRef = useScrollReveal<HTMLElement>();
    const mapRef = useScrollReveal<HTMLElement>();
    const ctaRef = useScrollReveal<HTMLElement>();

    // Cambia de foto: la anterior se queda debajo mientras la nueva se funde encima
    const irAFoto = (indice: number) => {
        if (indice === currentIndex) return;
        setPrevIndex(currentIndex);
        setCurrentIndex(indice);
    };
    // El avance lo marca la barra de la píldora activa: al terminar de llenarse, sigue la próxima.
    // Así la pausa detiene la barra y el cambio a la vez.
    const alTerminarAvance = () => irAFoto((currentIndex + 1) % MEDIA.length);

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

    useEffect(() => {
        if (showLoginModal) {
            const prevOverflow = document.body.style.overflow;
            document.body.style.overflow = 'hidden';
            return () => {
                document.body.style.overflow = prevOverflow;
            };
        }
    }, [showLoginModal]);

    return (
        <div className="simar-landing relative min-h-screen w-full overflow-x-clip bg-simar-papel font-sans text-simar-texto antialiased">
            {/* Navbar — vidrio flotante */}
            <nav
                aria-label="Principal"
                className={`simar-entra fixed top-3 md:top-6 inset-x-3 md:inset-x-8 z-50 rounded-[30px] transition-[background-color] duration-300 ${
                    scrolled ? 'simar-vidrio-fuerte' : 'simar-vidrio'
                }`}
                style={{ animationDuration: '0.7s' }}
            >
                {/* Avance de lectura: la marea sube con el scroll (sólo navegadores que lo soportan) */}
                <span aria-hidden="true" className="absolute left-7 right-7 bottom-0 h-[3px] overflow-hidden rounded-full">
                    <span className="simar-progreso h-full w-full bg-simar-golfo" />
                </span>
                <div className="h-[72px] md:h-[84px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-2 sm:gap-5">
                    <a href="#top" className="flex items-center gap-4 rounded-2xl min-w-0" aria-label="SiMAR - Inicio">
                        {/* En celular sólo el símbolo: el nombre ya está grande en el hero */}
                        <LogoSimar variante="simbolo" tamano={46} className="sm:hidden" />
                        <LogoSimar tamano={46} className="hidden sm:inline-flex" />
                        <span aria-hidden="true" className="hidden md:block h-9 w-px bg-simar-texto/20" />
                        {/* Logos institucionales: en oscuro van sobre una pastilla clara (tienen letras negras) */}
                        <span className="hidden md:flex items-center gap-3 rounded-xl dark:bg-white/90 dark:px-2.5 dark:py-1">
                            <img src="/assets/logo_ITSPP.png" alt="ITSPP" className="h-10 w-auto object-contain" />
                            <img src="/assets/logo_ICS.png" alt="ICS" className="h-9 w-auto object-contain" />
                        </span>
                    </a>

                    <div ref={enlacesRef} className="relative hidden xl:flex items-center gap-6 ml-auto">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                aria-current={seccionActiva === link.href ? 'location' : undefined}
                                className="min-h-[48px] flex items-center text-[17px] font-semibold text-simar-texto hover:text-simar-marea-tinta transition-colors"
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
                        <BotonTemaIcono />
                        {/* Menú de secciones (bajo 1280 px los enlaces no caben en la barra) */}
                        <button
                            type="button"
                            onClick={() => setMenuMovil((v) => !v)}
                            aria-expanded={menuMovil}
                            aria-controls="menu-secciones"
                            aria-label={menuMovil ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
                            className="xl:hidden simar-presiona w-[54px] h-[54px] md:w-[58px] md:h-[58px] flex-shrink-0 rounded-[18px] border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto flex items-center justify-center"
                        >
                            {menuMovil ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={openLoginModal}
                            className="simar-presiona min-h-[54px] md:min-h-[58px] px-4 sm:px-5 md:px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-base md:text-lg font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap"
                        >
                            Iniciar sesión
                            <ArrowRight className="hidden sm:block w-5 h-5" strokeWidth={2.4} />
                        </button>
                    </div>
                </div>

                {/* Menú de secciones para celular y tableta: renglones grandes, se cierra al elegir */}
                {menuMovil && (
                    <div id="menu-secciones" className="xl:hidden simar-aparece px-3 pb-3">
                        <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 pt-1 border-t border-simar-texto/10">
                            {NAV_LINKS.map((link) => (
                                <li key={link.href}>
                                    <a
                                        href={link.href}
                                        onClick={() => setMenuMovil(false)}
                                        aria-current={seccionActiva === link.href ? 'location' : undefined}
                                        className={`min-h-[56px] px-4 rounded-2xl flex items-center justify-between text-lg font-bold transition-colors ${
                                            seccionActiva === link.href
                                                ? 'bg-simar-superficie text-simar-texto'
                                                : 'text-simar-texto hover:bg-white/60 dark:hover:bg-white/10'
                                        }`}
                                    >
                                        {link.label}
                                        <ArrowRight className="w-5 h-5 text-simar-texto-2" />
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                )}
            </nav>

            {/* Hero */}
            {/* overflow-clip y no -hidden: lo decorativo que sobresale no vuelve "desplazable" la franja (al enfocar un botón se corría) */}
            <header id="top" className="relative overflow-clip">
                <svg
                    aria-hidden="true"
                    width="900"
                    height="760"
                    viewBox="300 -200 600 520"
                    className="absolute -right-32 top-10 pointer-events-none"
                >
                    {/* Manchas de luz y curvas de profundidad: las curvas se trazan al cargar, de adentro hacia afuera */}
                    <ellipse className="simar-mancha" cx="560" cy="40" rx="230" ry="170" style={{ fill: 'var(--simar-blob-1)' }} />
                    <ellipse className="simar-mancha" cx="700" cy="200" rx="160" ry="120" style={{ fill: 'var(--simar-blob-2)', animationDelay: '0.3s' }} />
                    <g style={{ fill: 'none', stroke: 'var(--simar-curva)', strokeWidth: 1.5 }}>
                        <path
                            pathLength={1}
                            className="simar-dibuja"
                            style={{ '--simar-trazo-dur': '2.2s', animationDelay: '0.35s' } as CSSProperties}
                            d="M722 40 C718 57 690 72 674 86 C659 100 648 115 629 124 C610 133 585 136 560 139 C535 142 498 149 478 141 C457 132 448 106 438 89 C429 73 424 57 421 40 C419 23 412 -1 423 -15 C435 -30 466 -40 488 -47 C511 -55 537 -62 560 -60 C583 -59 601 -46 625 -39 C648 -32 685 -30 701 -17 C717 -4 726 23 722 40 Z"
                        />
                        <path
                            pathLength={1}
                            className="simar-dibuja"
                            style={{ '--simar-trazo-dur': '2.6s', animationDelay: '0.7s' } as CSSProperties}
                            d="M800 40 C791 66 745 84 724 107 C702 130 698 161 671 176 C644 192 598 197 560 198 C522 200 473 199 442 185 C412 171 394 139 377 115 C361 91 349 67 343 40 C337 13 324 -28 343 -49 C362 -70 421 -76 457 -86 C494 -96 525 -107 560 -107 C595 -108 630 -100 666 -90 C702 -81 754 -70 776 -49 C799 -27 809 14 800 40 Z"
                        />
                    </g>
                </svg>

                <div className="relative max-w-[1340px] mx-auto px-6 md:px-12 lg:px-24 pt-32 md:pt-44 pb-16 md:pb-24 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center min-h-[100svh] lg:min-h-[900px]">
                    {/* Entrada escalonada: lugar, nombre (y su ola), qué es, para qué, acciones */}
                    <div>
                        <p className="simar-entra text-lg md:text-xl font-bold text-simar-marea-tinta" style={{ animationDelay: '0.1s' }}>
                            Puerto Peñasco · Sonora · México
                        </p>
                        <h1 className="mt-3.5 font-extrabold leading-none">
                            <span className="simar-entra relative inline-block text-7xl md:text-[104px] tracking-tight" style={{ animationDelay: '0.2s' }}>
                                SiMAR
                                <svg
                                    aria-hidden="true"
                                    viewBox="0 0 240 14"
                                    className="absolute left-1 -bottom-3 md:-bottom-4 w-[92%] h-auto overflow-visible"
                                >
                                    <path
                                        d={OLA_TITULO}
                                        pathLength={1}
                                        className="simar-dibuja"
                                        style={{
                                            fill: 'none',
                                            stroke: 'var(--simar-golfo)',
                                            strokeWidth: 3,
                                            strokeLinecap: 'round',
                                            '--simar-trazo-dur': '1.4s',
                                            animationDelay: '0.75s',
                                        } as CSSProperties}
                                    />
                                </svg>
                            </span>
                            <span className="simar-entra block mt-6 md:mt-7 text-2xl md:text-[30px] leading-tight" style={{ animationDelay: '0.3s' }}>
                                Sistema Integral de Manejo Ambiental de Residuos
                            </span>
                        </h1>
                        <p className="simar-entra mt-6 text-lg md:text-[22px] leading-relaxed text-simar-texto-2 max-w-xl" style={{ animationDelay: '0.4s' }}>
                            Transformando la gestión de residuos marinos con <strong className="text-simar-texto">trazabilidad digital</strong> y
                            compromiso con el <strong className="text-simar-texto">Mar de Cortés</strong>.
                        </p>
                        <div className="simar-entra mt-8 md:mt-9 flex flex-col sm:flex-row sm:flex-wrap gap-3.5" style={{ animationDelay: '0.5s' }}>
                            <button
                                onClick={openLoginModal}
                                className="simar-presiona whitespace-nowrap min-h-[64px] px-7 rounded-[20px] bg-simar-marea hover:bg-simar-marea-hover text-white text-lg md:text-xl font-extrabold flex items-center justify-center gap-2.5 cursor-pointer group"
                            >
                                Acceder a la plataforma
                                <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                            </button>
                            <a
                                href="#proyecto"
                                className="simar-presiona whitespace-nowrap min-h-[64px] px-7 rounded-[20px] border-2 border-simar-texto text-simar-texto text-lg md:text-xl font-bold hover:bg-simar-superficie flex items-center justify-center"
                            >
                                Conocer el proyecto
                            </a>
                        </div>
                    </div>

                    {/* Carrusel de fotografías del proyecto. Se pausa con el botón, al pasar el cursor o al enfocarlo */}
                    <figure
                        className="simar-entra relative m-0 h-[420px] sm:h-[520px] lg:h-[660px] rounded-[40px] overflow-hidden shadow-[0_30px_60px_-36px_rgba(11,34,54,0.6)]"
                        style={{ animationDelay: '0.3s', animationDuration: '1.1s' }}
                        onMouseEnter={() => setPausaMomentanea(true)}
                        onMouseLeave={() => setPausaMomentanea(false)}
                        onFocus={() => setPausaMomentanea(true)}
                        onBlur={() => setPausaMomentanea(false)}
                    >
                        {MEDIA.map((item, index) => {
                            const isActive = index === currentIndex;
                            const isPrev = index === prevIndex;
                            let zIndex = 0;
                            let opacity = 'opacity-0';
                            if (isActive) {
                                zIndex = 20;
                                opacity = 'opacity-100';
                            } else if (isPrev) {
                                zIndex = 10;
                                opacity = 'opacity-100';
                            }
                            return (
                                <img
                                    key={index}
                                    src={item.src}
                                    alt=""
                                    aria-hidden="true"
                                    className={`absolute inset-0 h-full w-full object-cover transition-opacity duration-[2000ms] ease-in-out ${opacity}`}
                                    style={{ zIndex }}
                                />
                            );
                        })}
                        <div
                            role="group"
                            aria-label={`Fotografía ${currentIndex + 1} de ${MEDIA.length}`}
                            className="simar-vidrio-fuerte absolute left-1/2 bottom-5 -translate-x-1/2 z-30 rounded-full pl-1.5 pr-3 py-1.5 flex items-center gap-1"
                        >
                            {!reducirMovimiento && (
                                <button
                                    type="button"
                                    onClick={() => setPausadoPorUsuario((p) => !p)}
                                    aria-label={pausadoPorUsuario ? 'Reanudar fotografías' : 'Pausar fotografías'}
                                    title={pausadoPorUsuario ? 'Reanudar' : 'Pausar'}
                                    className="simar-presiona w-11 h-11 rounded-full flex items-center justify-center text-simar-texto hover:bg-simar-texto/10 cursor-pointer"
                                >
                                    {pausadoPorUsuario ? (
                                        <Play className="w-[18px] h-[18px] ml-0.5" strokeWidth={2.4} />
                                    ) : (
                                        <Pause className="w-[18px] h-[18px]" strokeWidth={2.4} />
                                    )}
                                </button>
                            )}
                            {MEDIA.map((_, index) => {
                                const activa = index === currentIndex;
                                return (
                                    <button
                                        key={index}
                                        type="button"
                                        onClick={() => irAFoto(index)}
                                        aria-label={`Ver fotografía ${index + 1}`}
                                        aria-current={activa ? 'true' : undefined}
                                        className="h-11 px-[5px] flex items-center cursor-pointer group/punto"
                                    >
                                        <span
                                            className={`relative block h-2.5 rounded-full overflow-hidden transition-[width,background-color] duration-500 ${
                                                activa ? 'w-10 bg-simar-texto/25' : 'w-2.5 bg-simar-texto/30 group-hover/punto:bg-simar-texto/60'
                                            }`}
                                        >
                                            {/* La barra se llena mientras corre la foto; al llenarse pasa a la siguiente. En pausa se detiene donde va */}
                                            {activa && (
                                                <span
                                                    key={currentIndex}
                                                    className={`absolute inset-0 rounded-full bg-simar-texto ${reducirMovimiento ? '' : 'simar-avance'}`}
                                                    style={{
                                                        '--simar-avance-dur': `${SEGUNDOS_POR_FOTO}s`,
                                                        animationPlayState: carruselPausado ? 'paused' : 'running',
                                                    } as CSSProperties}
                                                    onAnimationEnd={alTerminarAvance}
                                                />
                                            )}
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </figure>
                </div>

                <div aria-hidden="true" className="simar-entra hidden lg:flex absolute left-24 bottom-10 items-center gap-2.5 text-base text-simar-texto-2" style={{ animationDelay: '1.1s' }}>
                    <ArrowDown className="w-5 h-5" />
                    Desliza
                </div>
            </header>

            {/* Sección Proyecto */}
            <section id="proyecto" ref={projectRef} className="relative py-20 md:py-28 px-6 bg-simar-superficie overflow-clip">
                <div className="max-w-[1248px] mx-auto grid lg:grid-cols-[1fr_540px] gap-12 lg:gap-16 items-center">
                    <div className="reveal" data-direction="left">
                        <p className="text-lg font-bold text-simar-marea-tinta">El proyecto</p>
                        <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08]">Tecnología al servicio del mar.</h2>
                        <div className="mt-6 space-y-4 text-lg md:text-xl leading-relaxed text-simar-texto-2">
                            <p>
                                Nace de la colaboración entre{' '}
                                <strong className="text-simar-texto">DCK Conciencia y Cultura</strong> —formada por
                                Dayanara, Coral y Karitza— y el{' '}
                                <strong className="text-simar-texto">Instituto Tecnológico Superior de Puerto Peñasco</strong>,
                                bajo el respaldo de <strong className="text-simar-texto">SEMARNAT</strong>.
                            </p>
                            <p>
                                Desarrollamos un sistema web que <strong className="text-simar-texto">digitaliza y centraliza</strong> el
                                registro de residuos generados por embarcaciones pesqueras —aceites usados, filtros,
                                plásticos y basura general— reemplazando procesos manuales que durante años
                                dificultaron la trazabilidad.
                            </p>
                            <p>
                                Cada manifiesto que antes era un papel deteriorado en un archivero hoy es
                                un dato que cuenta una historia: la historia del compromiso de Puerto Peñasco
                                con su mar.
                            </p>
                        </div>

                        <div className="mt-8 pt-6 border-t border-simar-borde grid grid-cols-3 gap-5">
                            <div>
                                <div className="text-3xl md:text-[40px] font-extrabold">3</div>
                                <div className="text-base md:text-[17px] text-simar-texto-2">Instituciones</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-[40px] font-extrabold">
                                    {stats?.totalManifiestos ? (
                                        <>
                                            <NumeroAnimado valor={stats.totalManifiestos} duracion={1400} />
                                            {stats.totalManifiestos >= 1000 ? '+' : ''}
                                        </>
                                    ) : (
                                        '5,000+'
                                    )}
                                </div>
                                <div className="text-base md:text-[17px] text-simar-texto-2">Manifiestos</div>
                            </div>
                            <div>
                                <div className="text-3xl md:text-[40px] font-extrabold">1</div>
                                <div className="text-base md:text-[17px] text-simar-texto-2">Puerto pionero</div>
                            </div>
                        </div>
                    </div>

                    <figure className="reveal relative m-0 h-[420px] md:h-[560px] rounded-[36px] overflow-hidden" data-direction="right" data-delay="150">
                        <img
                            src="/assets/images/img3.jpeg"
                            alt="Puerto Peñasco, Sonora"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <figcaption className="simar-vidrio-fuerte absolute left-4 right-4 bottom-4 rounded-3xl px-5 py-4">
                            <span className="block text-xl font-extrabold">Alto Golfo de California</span>
                            <span className="block mt-0.5 text-[17px] text-simar-texto-2">
                                Una de las regiones marinas más biodiversas y frágiles del planeta.
                            </span>
                        </figcaption>
                    </figure>
                </div>
            </section>

            {/* Don Francisco */}
            <section id="don-francisco" ref={francoRef} className="relative py-20 md:py-28 px-6 overflow-clip">
                <div className="max-w-[1248px] mx-auto">
                    <div className="reveal">
                        <p className="text-lg font-bold text-simar-marea-tinta">El protagonista</p>
                        <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08]">Conoce a Don Francisco</h2>
                    </div>

                    <div className="mt-10 grid lg:grid-cols-[600px_1fr] gap-10 lg:gap-16 items-start">
                        <figure className="reveal relative m-0 h-[360px] md:h-[440px] rounded-[36px] overflow-hidden" data-direction="left">
                            <img
                                src="/assets/images/img5.jpeg"
                                alt="Don Francisco en Puerto Peñasco"
                                className="absolute inset-0 w-full h-full object-cover object-[60%_40%]"
                            />
                            <figcaption className="simar-vidrio-fuerte absolute left-4 bottom-4 rounded-[22px] px-5 py-3.5">
                                <span className="block text-lg md:text-[19px] font-extrabold">Francisco Javier Bojórquez Ochoa</span>
                                <span className="block text-base text-simar-texto-2">SEMARNAT · Puerto Peñasco</span>
                            </figcaption>
                        </figure>

                        <div className="reveal" data-direction="right" data-delay="150">
                            <blockquote className="m-0 flex gap-3 text-2xl md:text-[26px] leading-snug font-bold">
                                <Quote className="w-8 h-8 flex-shrink-0 mt-1 text-simar-marea-tinta" />
                                <span>“Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre de Puerto Peñasco.”</span>
                            </blockquote>
                            <div className="mt-5 space-y-4 text-lg md:text-[19px] leading-relaxed text-simar-texto-2">
                                <p>
                                    Don Francisco es responsable del área de residuos del recinto portuario de Puerto Peñasco.
                                    Durante años llenó manifiestos a mano, hoja por hoja, archivando papeles que el tiempo
                                    deterioraba hasta volverlos ilegibles.
                                </p>
                                <p>
                                    Esta plataforma fue diseñada <strong className="text-simar-texto">con él y para él</strong>: con botones grandes,
                                    flujos lineales y lenguaje claro. Porque la tecnología solo sirve si llega a quien
                                    la necesita.
                                </p>
                                <p>
                                    Gracias a su experiencia de décadas cuidando el puerto, hoy más de{' '}
                                    <strong className="text-simar-texto">
                                        {stats?.totalManifiestos
                                            ? stats.totalManifiestos.toLocaleString('es-MX')
                                            : '5,000'}
                                    </strong>{' '}
                                    reportes históricos se están recuperando de las hojas que se desgastaban,
                                    convirtiéndose en evidencia digital permanente.
                                </p>
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4">
                                <div className="rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar px-5 py-4">
                                    <div className="text-3xl font-extrabold">2014</div>
                                    <div className="text-base md:text-[17px] text-simar-texto-2">Histórico desde</div>
                                </div>
                                <div className="rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar px-5 py-4">
                                    <div className="text-3xl font-extrabold">SEMARNAT</div>
                                    <div className="text-base md:text-[17px] text-simar-texto-2">Respaldo institucional</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Conciencia Azul — franja oscura */}
            <section id="conciencia" ref={awarenessRef} className="relative py-24 md:py-36 px-6 bg-simar-abismo text-white overflow-clip">
                <OlaSeparador color="var(--simar-papel)" lado="arriba" />
                <OlaSeparador color="var(--simar-papel)" lado="abajo" />
                <div className="relative max-w-[1248px] mx-auto">
                    <div className="max-w-3xl reveal">
                        <p className="text-lg font-bold text-simar-espuma">Conciencia Azul</p>
                        <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08]">¿Por qué importan los datos del mar?</h2>
                        <p className="mt-4 text-lg md:text-[21px] leading-relaxed text-[#C7D3DD]">
                            Detrás de cada cifra hay un ecosistema. Detrás de cada manifiesto, una decisión
                            que puede proteger —o dañar— al Mar de Cortés por generaciones.
                        </p>
                    </div>

                    <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {AWARENESS_PANELS.map((panel, i) => {
                            const Icon = panel.icon;
                            return (
                                <article
                                    key={panel.title}
                                    className="reveal rounded-[26px] bg-[#12304A] border border-white/10 p-6"
                                    data-delay={`${i * 100}`}
                                >
                                    <span className={`w-[52px] h-[52px] rounded-full flex items-center justify-center ${panel.color}`}>
                                        <Icon className="w-[26px] h-[26px]" />
                                    </span>
                                    <h3 className="mt-4 text-xl md:text-[21px] font-extrabold">{panel.title}</h3>
                                    <div className={`mt-2.5 text-[38px] font-extrabold leading-tight ${panel.accent}`}>
                                        {panel.cifra !== undefined ? (
                                            <>
                                                <NumeroAnimado valor={panel.cifra} duracion={1600} />
                                                {panel.sufijo}
                                            </>
                                        ) : (
                                            panel.stat
                                        )}
                                    </div>
                                    <div className="text-base text-[#C7D3DD]">{panel.statLabel}</div>
                                    <p className="mt-3 text-base leading-relaxed text-[#C7D3DD]">{panel.desc}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Equivalencias */}
            <section id="equivalencias" ref={equivRef} className="relative py-20 md:py-28 px-6 overflow-clip">
                <div className="max-w-[1248px] mx-auto">
                    <div className="max-w-4xl reveal">
                        <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-simar-marea-suave text-simar-marea-tinta text-base font-bold">
                            <span className="w-2 h-2 rounded-full bg-simar-marea-tinta" />
                            {hayDatos ? 'Datos reales de nuestra base de datos' : 'Datos de referencia ambiental'}
                        </span>
                        <p className="mt-5 text-lg font-bold text-simar-marea-tinta">¿Cuánto es cuánto?</p>
                        <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08]">Equivalencias que te van a sorprender</h2>
                        <p className="mt-4 text-lg md:text-[21px] leading-relaxed text-simar-texto-2">
                            {hayDatos
                                ? 'Estos números vienen directamente de los registros que se están capturando en el sistema. Cada cifra es real, viva y crece con cada manifiesto que se registra.'
                                : 'Los números por sí solos dicen poco. Aquí te mostramos lo que realmente significa cada residuo registrado, en cosas que conoces y entiendes.'}
                        </p>
                    </div>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5">
                        {buildEquivalencias(statsReales).map((eq, i) => {
                            const Icon = eq.icon;
                            if (eq.featured) {
                                return (
                                    <article
                                        key={eq.label}
                                        data-delay={`${i * 70}`}
                                        className="reveal md:col-span-2 lg:col-span-3 rounded-[30px] bg-simar-marea text-white p-7 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-8"
                                    >
                                        <span className="w-[72px] h-[72px] flex-shrink-0 rounded-full bg-white text-[#1B5FC9] flex items-center justify-center">
                                            <Icon className="w-[34px] h-[34px]" />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-lg md:text-[19px] font-bold text-[#DCE8FB]">{eq.label}</div>
                                            <div className="mt-1 text-5xl md:text-[56px] font-extrabold leading-tight">
                                                <NumeroAnimado valor={eq.impactValue} decimales={eq.impactDecimals} duracion={2400} />{' '}
                                                <span className="text-2xl md:text-[26px]">{eq.impactUnit}</span>
                                            </div>
                                            <div className="mt-1 text-lg md:text-[19px] text-[#E6EEFB]">{eq.impactDescription}</div>
                                        </div>
                                        <div className="md:w-[240px] md:pl-7 md:border-l border-white/30">
                                            <div className="text-base text-[#DCE8FB]">Basado en</div>
                                            <div className="text-2xl md:text-[26px] font-extrabold">
                                                <NumeroAnimado valor={eq.inputValue} decimales={eq.inputDecimals} duracion={1200} /> {eq.inputUnit}
                                            </div>
                                            <div className="text-base text-[#DCE8FB]">{eq.inputCaption}</div>
                                        </div>
                                    </article>
                                );
                            }
                            return (
                                <article
                                    key={eq.label}
                                    data-delay={`${i * 70}`}
                                    className="reveal rounded-[26px] bg-simar-superficie border border-simar-borde shadow-simar p-6"
                                >
                                    <span className={`w-[52px] h-[52px] rounded-full flex items-center justify-center ${eq.tono}`}>
                                        <Icon className="w-[26px] h-[26px]" />
                                    </span>
                                    <div className="mt-3.5 text-lg font-bold text-simar-texto-2">{eq.label}</div>
                                    <div className="text-[38px] font-extrabold leading-tight">
                                        <NumeroAnimado valor={eq.impactValue} decimales={eq.impactDecimals} duracion={1800} />
                                    </div>
                                    <div className="text-lg font-bold">{eq.impactUnit}</div>
                                    <div className="text-[17px] text-simar-texto-2">{eq.impactDescription}</div>
                                    <div className="mt-3 pt-3 border-t border-simar-borde-suave text-base text-simar-texto-2">
                                        Basado en{' '}
                                        <strong className="text-simar-texto">
                                            <NumeroAnimado valor={eq.inputValue} decimales={eq.inputDecimals} duracion={1200} /> {eq.inputUnit}
                                        </strong>{' '}
                                        {eq.inputCaption}
                                    </div>
                                </article>
                            );
                        })}
                        <p className="reveal self-center px-2 text-base md:text-lg leading-relaxed text-simar-texto-2" data-delay="200">
                            Cifras calculadas en tiempo real con estándares internacionales (MARPOL · SEMARNAT).
                            Cada registro que se captura hace crecer estos números.
                        </p>
                    </div>
                </div>
            </section>

            {/* Impacto / Stats */}
            <section id="impacto" ref={statsRef} className="relative py-20 md:py-24 px-6 bg-simar-superficie overflow-clip">
                <div className="max-w-[1248px] mx-auto">
                    <div className="reveal">
                        <p className="text-lg font-bold text-simar-marea-tinta">Impacto medible</p>
                        <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08]">Nuestro avance hasta hoy</h2>
                    </div>

                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5">
                        {[
                            {
                                icon: FileCheck,
                                value: stats?.totalManifiestos ? (
                                    <>
                                        <NumeroAnimado valor={stats.totalManifiestos} duracion={1400} />
                                        {stats.totalManifiestos >= 1000 ? '+' : ''}
                                    </>
                                ) : (
                                    '5,000+'
                                ),
                                label: 'Reportes digitalizados',
                                detail: stats?.totalManifiestos
                                    ? `${stats.totalManifiestos.toLocaleString('es-MX')} registros capturados en el sistema.`
                                    : 'Recuperados de hojas físicas deterioradas.',
                            },
                            {
                                icon: LineChart,
                                value: '100%',
                                label: 'Trazabilidad digital',
                                detail: 'Cada residuo rastreable de inicio a fin.',
                            },
                            {
                                icon: Globe2,
                                value: '2014 – 2025',
                                label: 'Histórico recuperado',
                                detail: '11 años de datos ambientales preservados.',
                            },
                        ].map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="reveal rounded-[26px] bg-simar-papel p-7"
                                    data-delay={`${i * 120}`}
                                >
                                    <Icon className="w-8 h-8 text-simar-marea-tinta" />
                                    <div className="mt-4 text-4xl md:text-5xl font-extrabold leading-none">{stat.value}</div>
                                    <div className="mt-2 text-xl font-extrabold">{stat.label}</div>
                                    <div className="mt-1 text-[17px] text-simar-texto-2">{stat.detail}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Mapa de puertos — franja oscura (el mapa interactivo está pensado para fondo oscuro) */}
            <section id="mapa" ref={mapRef} className="relative pt-24 md:pt-36 pb-20 md:pb-28 px-6 bg-simar-abismo text-white overflow-clip">
                <OlaSeparador color="var(--simar-superficie)" lado="arriba" />
                <div className="relative max-w-[1248px] mx-auto">
                    <div className="max-w-3xl mb-10 md:mb-12 reveal">
                        <p className="text-lg font-bold text-simar-espuma">Mapa de puertos</p>
                        <h2 className="mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08]">Dónde estamos, a dónde vamos.</h2>
                        <p className="mt-4 text-lg md:text-[21px] leading-relaxed text-[#C7D3DD]">
                            El modelo está listo para escalar. Cada puerto pesquero de México puede sumarse
                            a una red nacional de trazabilidad ambiental.
                        </p>
                    </div>

                    <div className="reveal" data-delay="100">
                        <SeccionMapaPuertos variante={varianteMapa} mostrarSelector={compararMapas} />
                    </div>
                </div>
            </section>

            {/* Llamado final */}
            <section ref={ctaRef} className="relative pt-20 md:pt-24 pb-28 md:pb-36 px-6 bg-simar-abismo text-white border-t border-white/10 overflow-clip">
                <OlaSeparador color="var(--simar-superficie)" lado="abajo" />
                <div className="relative max-w-4xl mx-auto text-center reveal">
                    <h2 className="text-4xl md:text-[50px] font-extrabold leading-tight">
                        Cada dato cuenta. <br />
                        <span className="text-simar-espuma">Cada mar lo agradece.</span>
                    </h2>
                    <p className="mt-4 text-lg md:text-[21px] text-[#C7D3DD] leading-relaxed max-w-2xl mx-auto">
                        Accede a la plataforma y sé parte del cambio en la gestión de residuos marinos.
                    </p>
                    <button
                        onClick={openLoginModal}
                        className="simar-presiona group mt-7 min-h-[64px] px-8 rounded-[20px] bg-simar-espuma hover:bg-[#A5ECE4] text-[#0B2236] text-lg md:text-xl font-extrabold inline-flex items-center gap-2.5 cursor-pointer"
                    >
                        Iniciar sesión
                        <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-simar-superficie py-12 md:py-14 px-6">
                <div className="max-w-[1248px] mx-auto flex flex-col md:flex-row md:items-center gap-8 md:gap-14">
                    <LogoSimar tamano={60} />
                    <div>
                        <h3 className="text-lg font-extrabold">Instituciones</h3>
                        <ul className="mt-2 space-y-1 text-lg text-simar-texto-2">
                            <li>ITSPP</li>
                            <li>DCK Conciencia y Cultura</li>
                            <li>SEMARNAT</li>
                        </ul>
                    </div>
                    <div className="md:ml-auto md:text-right">
                        <p className="text-[17px] text-simar-texto-2">© 2025 DCK / ITSPP. Todos los derechos reservados.</p>
                        {/* Acceso interno al panel de superadmin: discreto a propósito */}
                        <button
                            type="button"
                            onClick={abrirAccesoDesarrollador}
                            className="mt-1 min-h-[44px] inline-flex items-center gap-2 text-base font-bold text-simar-texto-2 hover:text-simar-texto transition-colors cursor-pointer"
                        >
                            <SquareTerminal className="w-[18px] h-[18px]" />
                            Acceso desarrollador
                        </button>
                    </div>
                </div>
            </footer>

            {/* Login Modal: entra y sale (usePresencia); cada paso entra con simar-ventana */}
            {ventanaAcceso.montado && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Iniciar sesión"
                >
                    <div
                        className={`${ventanaAcceso.saliendo ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 bg-[rgba(11,34,54,0.42)] backdrop-blur-[6px]`}
                        onClick={cerrarLoginModal}
                    />

                    {/* PASO 1 — Selector de rol */}
                    {modalRole === null && (
                        <div className={`${ventanaAcceso.saliendo ? 'simar-ventana-sale' : 'simar-ventana'} simar-vidrio-fuerte relative w-full max-w-[640px] rounded-[34px] p-7 md:p-9`}>
                            <button
                                onClick={cerrarLoginModal}
                                className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto flex items-center justify-center transition-colors z-10"
                                aria-label="Cerrar"
                            >
                                <X className="w-[22px] h-[22px]" />
                            </button>
                            <div className="text-center">
                                <LogoSimar variante="simbolo" tamano={64} />
                                <h2 className="mt-2 text-[28px] md:text-[32px] font-extrabold text-simar-texto">¿Cómo deseas ingresar?</h2>
                                <p className="mt-1.5 text-lg text-simar-texto-2">Selecciona tu tipo de usuario</p>
                            </div>
                            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <ModalRoleCard
                                    title="Administrador Portuario"
                                    desc="Manifiestos, embarcaciones y estadísticas del puerto."
                                    accent="blue"
                                    Icon={Anchor}
                                    onClick={() => selectModalRole('admin')}
                                />
                                <ModalRoleCard
                                    title="Empresa Recolectora"
                                    desc="Residuos disponibles, solicitudes de recolección, historial e impacto."
                                    accent="emerald"
                                    Icon={Recycle}
                                    onClick={() => selectModalRole('recolector')}
                                />
                            </div>
                        </div>
                    )}

                    {/* PASO 2 — Formulario de login */}
                    {modalRole !== null && (
                        <div className={`${ventanaAcceso.saliendo ? 'simar-ventana-sale' : 'simar-ventana'} simar-vidrio-fuerte relative w-full max-w-[520px] rounded-[34px] p-7 md:p-9`}>
                            <button
                                onClick={cerrarLoginModal}
                                className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto flex items-center justify-center transition-colors z-10"
                                aria-label="Cerrar"
                            >
                                <X className="w-[22px] h-[22px]" />
                            </button>
                            {/* Rol elegido + volver (pr-14: deja libre el botón de cerrar) */}
                            <div className="flex flex-wrap items-center gap-3 mb-4 pr-14">
                                {modalRole !== 'superadmin' && (
                                    <button
                                        onClick={clearModalRole}
                                        className="min-h-[48px] px-3.5 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto text-[17px] font-bold flex items-center gap-2 transition-colors"
                                    >
                                        <ArrowLeft className="w-5 h-5" />
                                        Cambiar
                                    </button>
                                )}
                                <span className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-full text-base font-bold ${
                                    modalRole === 'recolector'
                                        ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta'
                                        : modalRole === 'superadmin'
                                            ? 'bg-simar-violeta-suave text-simar-violeta'
                                            : 'bg-simar-marea-suave text-simar-marea-tinta'
                                }`}>
                                    {modalRole === 'recolector'
                                        ? <><Recycle className="w-[18px] h-[18px]" /> Empresa Recolectora</>
                                        : modalRole === 'superadmin'
                                            ? <><SquareTerminal className="w-[18px] h-[18px]" /> Acceso de desarrollador</>
                                            : <><Anchor className="w-[18px] h-[18px]" /> Administrador Portuario</>
                                    }
                                </span>
                            </div>
                            <LoginForm
                                showLogo={true}
                                // El desarrollador no se registra aquí: su cuenta ya existe y se marca como superadmin en la BD
                                permitirRegistro={modalRole !== 'superadmin'}
                                redirectTo={siguiente ?? DESTINO_POR_ROL[modalRole]}
                                // Tras iniciar sesión sólo se oculta el modal: tocar la URL aquí
                                // (replaceState de cerrarLoginModal) cancelaba la navegación
                                // al panel y el usuario se quedaba en la landing.
                                onSuccess={() => setShowLoginModal(false)}
                            />
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

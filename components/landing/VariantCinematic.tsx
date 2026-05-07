'use client';

import { useState, useEffect } from 'react';
import { LoginForm } from '@/components/auth/LoginForm';
import { InteractiveMexicoMap } from './InteractiveMexicoMap';
import { useScrollReveal } from './useScrollReveal';
import { CountUpNumber } from './CountUpNumber';
import type { LandingStats } from '@/lib/services/landing_stats';
import {
    ArrowRight,
    Droplets,
    Fish,
    Recycle,
    FileCheck,
    ShieldCheck,
    Waves,
    Users,
    Anchor,
    LineChart,
    Quote,
    Globe2,
    X,
    ArrowLeft,
} from 'lucide-react';

type ModalRole = 'admin' | 'recolector';

function saveRole(r: ModalRole) {
    document.cookie = `dck_user_role=${r}; path=/; max-age=${60 * 60 * 24 * 365}; SameSite=Lax`;
    localStorage.setItem('dck_user_role', r);
}

function readSavedRole(): ModalRole | null {
    try {
        const v = localStorage.getItem('dck_user_role');
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

const AWARENESS_PANELS = [
    {
        icon: Droplets,
        title: 'Aceites y combustibles',
        stat: '1 L',
        statLabel: 'contamina hasta 1,000,000 L de agua',
        desc: 'Los aceites usados y residuos de diésel derramados en el mar forman películas que impiden el intercambio de oxígeno y afectan toda la cadena alimentaria marina.',
        color: 'from-amber-500/20 to-orange-500/20',
        accent: 'text-amber-300',
    },
    {
        icon: Fish,
        title: 'Biodiversidad marina',
        stat: '2,000+',
        statLabel: 'especies en el Mar de Cortés',
        desc: 'El Alto Golfo de California es santuario de la vaquita marina y hogar de una de las biodiversidades marinas más ricas del planeta. Cada registro cuenta.',
        color: 'from-cyan-500/20 to-blue-500/20',
        accent: 'text-cyan-300',
    },
    {
        icon: Recycle,
        title: 'Economía circular',
        stat: '100%',
        statLabel: 'de residuos con destino verificado',
        desc: 'Cada filtro, cada litro de aceite y cada bolsa de basura es rastreada desde la embarcación hasta su disposición final certificada, cerrando el ciclo.',
        color: 'from-emerald-500/20 to-teal-500/20',
        accent: 'text-emerald-300',
    },
    {
        icon: ShieldCheck,
        title: 'Cumplimiento MARPOL',
        stat: 'Anexo V',
        statLabel: 'Convenio Internacional',
        desc: 'MARPOL es la norma internacional que regula la contaminación generada por buques. Nuestro sistema garantiza su cumplimiento con evidencia digital trazable.',
        color: 'from-blue-500/20 to-indigo-500/20',
        accent: 'text-blue-300',
    },
];

interface EquivalenciaCard {
    emoji: string;
    label: string;
    inputValue: number;
    inputDecimals: number;
    inputUnit: string;
    inputCaption: string;
    impactValue: number;
    impactDecimals: number;
    impactUnit: string;
    impactDescription: string;
    gradient: string;
    glowColor: string;
    accent: string;
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
            ? { wrap: 'hover:border-blue-500/60 hover:bg-blue-500/5', icon: 'bg-blue-500/10 text-blue-300', arrow: 'text-blue-400' }
            : { wrap: 'hover:border-emerald-500/60 hover:bg-emerald-500/5', icon: 'bg-emerald-500/10 text-emerald-300', arrow: 'text-emerald-400' };
    return (
        <button
            type="button"
            onClick={onClick}
            className={`group text-left w-full border border-white/10 rounded-2xl p-5 transition-all duration-200 ${s.wrap} focus:outline-none`}
        >
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${s.icon}`}>
                <Icon className="w-5 h-5" />
            </div>
            <p className="text-sm font-bold text-white mb-1">{title}</p>
            <p className="text-xs text-slate-400 leading-snug">{desc}</p>
            <div className={`flex items-center gap-1 mt-3 text-xs font-semibold ${s.arrow}`}>
                Continuar <ArrowRight className="w-3 h-3 group-hover:translate-x-0.5 transition-transform" />
            </div>
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
            emoji: '🌊',
            label: 'Agua protegida',
            inputValue: aceite,
            inputDecimals: 1,
            inputUnit: 'L',
            inputCaption: 'de aceite recopilado',
            impactValue: piscinas,
            impactDecimals: piscinas >= 100 ? 0 : 1,
            impactUnit: 'piscinas olímpicas',
            impactDescription: 'de agua que no se contaminó',
            gradient: 'from-amber-400 via-orange-400 to-amber-500',
            glowColor: 'shadow-amber-500/40',
            accent: 'text-amber-300',
            featured: true,
        },
        {
            emoji: '🐢',
            label: 'Mar limpio',
            inputValue: basuraKg,
            inputDecimals: 1,
            inputUnit: 'kg',
            inputCaption: 'de basura gestionada',
            impactValue: bolsas,
            impactDecimals: 0,
            impactUnit: 'bolsas de plástico',
            impactDescription: 'que no llegaron al océano',
            gradient: 'from-cyan-400 via-teal-400 to-cyan-500',
            glowColor: 'shadow-cyan-500/40',
            accent: 'text-cyan-300',
        },
        {
            emoji: '🌳',
            label: 'Árboles en pie',
            inputValue: hojas,
            inputDecimals: 0,
            inputUnit: 'hojas',
            inputCaption: 'de papel evitadas',
            impactValue: arboles,
            impactDecimals: arboles >= 10 ? 0 : 2,
            impactUnit: 'árboles',
            impactDescription: 'que siguen absorbiendo CO₂',
            gradient: 'from-emerald-400 via-green-400 to-emerald-500',
            glowColor: 'shadow-emerald-500/40',
            accent: 'text-emerald-300',
        },
        {
            emoji: '🌱',
            label: 'Suelo protegido',
            inputValue: totalFiltros,
            inputDecimals: 0,
            inputUnit: 'filtros',
            inputCaption: 'de motor recibidos',
            impactValue: sueloL,
            impactDecimals: 0,
            impactUnit: 'litros de tierra',
            impactDescription: 'libres de contaminación',
            gradient: 'from-orange-400 via-red-400 to-orange-500',
            glowColor: 'shadow-orange-500/40',
            accent: 'text-orange-300',
        },
        {
            emoji: '⏳',
            label: 'Tiempo liberado',
            inputValue: manifiestos,
            inputDecimals: 0,
            inputUnit: 'registros',
            inputCaption: 'digitales, no en papel',
            impactValue: horas,
            impactDecimals: 0,
            impactUnit: 'horas',
            impactDescription: 'devueltas al cuidado del mar',
            gradient: 'from-blue-400 via-indigo-400 to-blue-500',
            glowColor: 'shadow-blue-500/40',
            accent: 'text-blue-300',
        },
        {
            emoji: '📖',
            label: 'Historia viva',
            inputValue: manifiestos,
            inputDecimals: 0,
            inputUnit: 'puntos',
            inputCaption: 'de datos ambientales',
            impactValue: 11,
            impactDecimals: 0,
            impactUnit: 'años',
            impactDescription: 'del Mar de Cortés en evidencia',
            gradient: 'from-violet-400 via-purple-400 to-violet-500',
            glowColor: 'shadow-violet-500/40',
            accent: 'text-violet-300',
        },
    ];
}

export function VariantCinematic({ stats }: { stats: LandingStats | null }) {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [prevIndex, setPrevIndex] = useState(0);
    const [showLoginModal, setShowLoginModal] = useState(false);
    // null = mostrar selector, 'admin'/'recolector' = ir directo al form
    const [modalRole, setModalRole] = useState<ModalRole | null>(null);
    const [scrolled, setScrolled] = useState(false);

    const openLoginModal = () => {
        setModalRole(readSavedRole()); // null si no hay guardado → selector
        setShowLoginModal(true);
    };

    const selectModalRole = (r: ModalRole) => {
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

    useEffect(() => {
        const interval = setInterval(() => {
            setPrevIndex(currentIndex);
            setCurrentIndex((prev) => (prev + 1) % MEDIA.length);
        }, 6000);
        return () => clearInterval(interval);
    }, [currentIndex]);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 60);
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

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
        <div className="relative min-h-screen w-full overflow-x-hidden bg-slate-950 font-sans text-white selection:bg-cyan-500 selection:text-white antialiased">
            {/* Navbar */}
            <nav
                className={`fixed top-0 w-full z-50 transition-all duration-500 ${
                    scrolled
                        ? 'bg-slate-950/85 backdrop-blur-md border-b border-white/10'
                        : 'bg-gradient-to-b from-black/80 via-black/30 to-transparent'
                }`}
            >
                <div className="max-w-7xl mx-auto px-4 sm:px-6 h-20 md:h-24 flex items-center justify-between">
                    <a
                        href="#top"
                        className="group flex items-center gap-4 rounded-full px-3 py-2 transition-all duration-300 hover:bg-white/95 hover:shadow-xl cursor-pointer"
                        aria-label="SiMAR - Inicio"
                    >
                        <img
                            src="/assets/logo_DCK.png"
                            alt="SiMAR"
                            className="h-12 md:h-14 w-auto object-contain drop-shadow-lg"
                        />
                        <div className="h-8 w-px bg-white/30 transition-colors duration-300 group-hover:bg-black/10 hidden sm:block" />
                        <div className="hidden sm:flex items-center gap-3">
                            <img src="/assets/logo_ITSPP.png" alt="ITSPP" className="h-10 w-auto object-contain" />
                            <img src="/assets/logo_ICS.png" alt="ICS" className="h-10 w-auto object-contain" />
                        </div>
                    </a>

                    <div className="hidden lg:flex items-center gap-8 text-sm font-semibold tracking-wide text-white/85">
                        {NAV_LINKS.map((link) => (
                            <a
                                key={link.href}
                                href={link.href}
                                className="hover:text-cyan-300 transition-colors relative after:content-[''] after:absolute after:left-0 after:-bottom-1 after:w-0 after:h-[2px] after:bg-cyan-300 after:transition-all hover:after:w-full"
                            >
                                {link.label}
                            </a>
                        ))}
                    </div>

                    <button
                        onClick={openLoginModal}
                        className="px-5 py-2.5 md:px-6 md:py-3 bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-sm md:text-base font-bold rounded-full transition-all shadow-lg shadow-cyan-500/30 hover:scale-105 active:scale-95 cursor-pointer flex items-center gap-2"
                    >
                        Iniciar sesión
                        <ArrowRight className="w-4 h-4" />
                    </button>
                </div>
            </nav>

            {/* Hero */}
            <header id="top" className="relative h-screen min-h-[640px] flex flex-col justify-center items-center text-center px-6 overflow-hidden">
                <div className="absolute inset-0 z-0 bg-black">
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
                            <div
                                key={index}
                                className={`absolute inset-0 transition-opacity duration-[2000ms] ease-in-out ${opacity}`}
                                style={{ zIndex }}
                            >
                                <img
                                    src={item.src}
                                    alt=""
                                    aria-hidden="true"
                                    className="h-full w-full object-cover animate-ken-burns"
                                />
                                <div className="absolute inset-0 bg-gradient-to-b from-slate-950/60 via-slate-950/45 to-slate-950/85" />
                            </div>
                        );
                    })}
                </div>

                <div className="relative z-30 max-w-5xl space-y-8 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full backdrop-blur-md">
                        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                        <span className="text-cyan-200 text-xs md:text-sm font-semibold tracking-[0.2em] uppercase">
                            Puerto Peñasco · Sonora · México
                        </span>
                    </div>

                    <h1 className="text-5xl sm:text-7xl md:text-[7.5rem] font-extrabold leading-[0.95] tracking-tight text-white drop-shadow-2xl">
                        SiMAR
                        <span className="block mt-3 text-2xl sm:text-4xl md:text-6xl font-light text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 via-blue-300 to-cyan-200 animate-shimmer-text">
                            Sistema Integral de Manejo Ambiental de Residuos
                        </span>
                    </h1>

                    <p className="text-lg sm:text-xl md:text-2xl text-slate-100 font-light max-w-3xl mx-auto leading-relaxed">
                        Transformando la gestión de residuos marinos con <strong className="text-cyan-300 font-semibold">trazabilidad digital</strong> y
                        compromiso con el <strong className="text-cyan-300 font-semibold">Mar de Cortés</strong>.
                    </p>

                    <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
                        <button
                            onClick={openLoginModal}
                            className="group px-8 py-4 bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold tracking-wide transition-all shadow-xl shadow-cyan-500/30 flex items-center justify-center gap-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 text-base"
                        >
                            Acceder a la plataforma
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
                        <a
                            href="#proyecto"
                            className="px-8 py-4 bg-white/10 hover:bg-white/20 border border-white/20 text-white font-semibold tracking-wide transition-all backdrop-blur-sm flex items-center justify-center gap-2 rounded-full cursor-pointer hover:scale-105 active:scale-95 text-base"
                        >
                            Conocer el proyecto
                        </a>
                    </div>
                </div>

                <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 text-white/60 flex flex-col items-center gap-2">
                    <span className="text-xs tracking-widest uppercase">Desliza</span>
                    <div className="w-[2px] h-12 bg-gradient-to-b from-cyan-300 to-transparent animate-pulse" />
                </div>
            </header>

            {/* Sección Proyecto */}
            <section id="proyecto" ref={projectRef} className="relative py-24 md:py-32 px-6 bg-slate-950 overflow-hidden">
                <div
                    aria-hidden="true"
                    className="absolute top-1/2 -left-40 w-[500px] h-[500px] rounded-full bg-cyan-500/10 blur-3xl"
                />
                <div
                    aria-hidden="true"
                    className="absolute bottom-0 -right-40 w-[500px] h-[500px] rounded-full bg-blue-500/10 blur-3xl"
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl mb-16 reveal">
                        <p className="text-cyan-400 text-sm font-bold tracking-[0.25em] uppercase mb-4">
                            El Proyecto
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                            Tecnología al servicio <br />
                            del <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">mar</span>.
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-2 gap-12 md:gap-16 items-center">
                        <div className="space-y-6 text-lg leading-relaxed text-slate-300 reveal" data-direction="left">
                            <p>
                                Nace de la colaboración entre{' '}
                                <strong className="text-white">DCK Conciencia y Cultura</strong> —formada por
                                Dayanara, Coral y Karitza— y el{' '}
                                <strong className="text-white">Instituto Tecnológico Superior de Puerto Peñasco</strong>,
                                bajo el respaldo de <strong className="text-white">SEMARNAT</strong>.
                            </p>
                            <p>
                                Desarrollamos un sistema web que <strong className="text-cyan-300">digitaliza y centraliza</strong> el
                                registro de residuos generados por embarcaciones pesqueras —aceites usados, filtros,
                                plásticos y basura general— reemplazando procesos manuales que durante años
                                dificultaron la trazabilidad.
                            </p>
                            <p>
                                Cada manifiesto que antes era un papel deteriorado en un archivero hoy es
                                un dato que cuenta una historia: la historia del compromiso de Puerto Peñasco
                                con su mar.
                            </p>

                            <div className="grid grid-cols-3 gap-6 pt-8 border-t border-white/10">
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Users className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">3</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                                        Instituciones
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <FileCheck className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">
                                        {stats?.totalManifiestos
                                            ? stats.totalManifiestos.toLocaleString('es-MX') + (stats.totalManifiestos >= 1000 ? '+' : '')
                                            : '5,000+'}
                                    </div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                                        Manifiestos
                                    </div>
                                </div>
                                <div>
                                    <div className="flex items-center gap-2 mb-2">
                                        <Anchor className="w-5 h-5 text-cyan-400" />
                                    </div>
                                    <div className="text-2xl font-bold text-white">1</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider">
                                        Puerto pionero
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="reveal relative h-[520px] rounded-3xl overflow-hidden shadow-2xl group" data-direction="right" data-delay="150">
                            <img
                                src="/assets/images/img3.jpeg"
                                alt="Puerto Peñasco, Sonora"
                                className="absolute inset-0 w-full h-full object-cover group-hover:scale-110 transition-transform duration-[1500ms]"
                            />
                            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent" />
                            <div className="absolute bottom-0 left-0 right-0 p-8">
                                <div className="flex items-center gap-3 text-cyan-300 mb-3">
                                    <Waves className="w-5 h-5" />
                                    <span className="text-sm font-semibold tracking-widest uppercase">
                                        Alto Golfo de California
                                    </span>
                                </div>
                                <p className="text-white text-lg font-light">
                                    Una de las regiones marinas más biodiversas y frágiles del planeta.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Don Francisco */}
            <section
                id="don-francisco"
                ref={francoRef}
                className="relative py-24 md:py-32 px-6 bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 overflow-hidden"
            >
                <div className="max-w-6xl mx-auto relative z-10">
                    <div className="text-center mb-16 reveal">
                        <p className="text-cyan-400 text-sm font-bold tracking-[0.25em] uppercase mb-4">
                            El Protagonista
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-tight">
                            Conoce a <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-300 to-cyan-300">Don Francisco</span>
                        </h2>
                    </div>

                    <div className="grid md:grid-cols-[1fr_1.3fr] gap-12 items-center">
                        <div className="reveal" data-direction="left">
                            <div className="relative">
                                <div className="absolute -inset-4 bg-gradient-to-br from-cyan-500/30 to-blue-500/20 rounded-3xl blur-2xl" />
                                <div className="relative aspect-[4/5] rounded-3xl overflow-hidden bg-gradient-to-br from-slate-800 to-slate-900 border border-white/10 shadow-2xl">
                                    <img
                                        src="/assets/images/img5.jpeg"
                                        alt="Don Francisco en Puerto Peñasco"
                                        className="absolute inset-0 w-full h-full object-cover"
                                    />
                                    <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/30 to-transparent" />
                                    <div className="absolute bottom-0 left-0 right-0 p-6">
                                        <p className="text-2xl font-bold text-white leading-tight">
                                            Francisco Javier Bojórquez Ochoa
                                        </p>
                                        <p className="text-cyan-300 text-sm mt-1 font-medium">
                                            SEMARNAT · Puerto Peñasco
                                        </p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-6 reveal" data-direction="right" data-delay="150">
                            <div className="flex items-start gap-4">
                                <Quote className="w-10 h-10 text-cyan-400 flex-shrink-0 mt-1" />
                                <p className="text-xl md:text-2xl font-light text-slate-100 italic leading-relaxed">
                                    "Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre
                                    de Puerto Peñasco."
                                </p>
                            </div>

                            <div className="pl-14 space-y-5 text-base md:text-lg leading-relaxed text-slate-300">
                                <p>
                                    Don Francisco es responsable del área de residuos del recinto portuario de Puerto Peñasco.
                                    Durante años llenó manifiestos a mano, hoja por hoja, archivando papeles que el tiempo
                                    deterioraba hasta volverlos ilegibles.
                                </p>
                                <p>
                                    Esta plataforma fue diseñada <strong className="text-white">con él y para él</strong>: con botones grandes,
                                    flujos lineales y lenguaje claro. Porque la tecnología solo sirve si llega a quien
                                    la necesita.
                                </p>
                                <p>
                                    Gracias a su experiencia de décadas cuidando el puerto, hoy más de{' '}
                                    <strong className="text-white">
                                        {stats?.totalManifiestos
                                            ? stats.totalManifiestos.toLocaleString('es-MX')
                                            : '5,000'}
                                    </strong>{' '}
                                    reportes históricos se están recuperando de las hojas que se desgastaban,
                                    convirtiéndose en evidencia digital permanente.
                                </p>
                            </div>

                            <div className="pl-14 pt-6 grid grid-cols-2 gap-4">
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-3xl font-bold text-cyan-300">2014</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                                        Histórico desde
                                    </div>
                                </div>
                                <div className="p-4 rounded-2xl bg-white/5 border border-white/10">
                                    <div className="text-3xl font-bold text-cyan-300">SEMARNAT</div>
                                    <div className="text-xs text-slate-400 uppercase tracking-wider mt-1">
                                        Respaldo institucional
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Conciencia Azul — Paneles */}
            <section
                id="conciencia"
                ref={awarenessRef}
                className="relative py-24 md:py-32 px-6 bg-slate-950 overflow-hidden"
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-30 pointer-events-none"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 80% 20%, rgba(34,211,238,0.18), transparent 50%), radial-gradient(circle at 20% 80%, rgba(59,130,246,0.12), transparent 50%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl mb-16 reveal">
                        <p className="text-cyan-400 text-sm font-bold tracking-[0.25em] uppercase mb-4">
                            Conciencia Azul
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                            ¿Por qué importan <br />
                            los datos del mar?
                        </h2>
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
                            Detrás de cada cifra hay un ecosistema. Detrás de cada manifiesto, una decisión
                            que puede proteger —o dañar— al Mar de Cortés por generaciones.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-2 gap-6 md:gap-8">
                        {AWARENESS_PANELS.map((panel, i) => {
                            const Icon = panel.icon;
                            return (
                                <article
                                    key={panel.title}
                                    className="reveal group relative p-8 md:p-10 rounded-3xl bg-white/[0.04] border border-white/10 hover:border-white/20 transition-all duration-500 hover:-translate-y-1 overflow-hidden"
                                    data-delay={`${i * 100}`}
                                >
                                    <div
                                        className={`absolute inset-0 bg-gradient-to-br ${panel.color} opacity-0 group-hover:opacity-100 transition-opacity duration-500`}
                                    />

                                    <div className="relative z-10">
                                        <div className="flex items-start justify-between mb-6">
                                            <div className="w-16 h-16 rounded-2xl bg-white/10 border border-white/10 flex items-center justify-center group-hover:scale-110 transition-transform duration-500">
                                                <Icon className={`w-8 h-8 ${panel.accent}`} />
                                            </div>
                                            <div className="text-right">
                                                <div className={`text-4xl md:text-5xl font-extrabold ${panel.accent} leading-none`}>
                                                    {panel.stat}
                                                </div>
                                                <div className="text-xs text-slate-400 mt-1 uppercase tracking-wider max-w-[160px]">
                                                    {panel.statLabel}
                                                </div>
                                            </div>
                                        </div>
                                        <h3 className="text-2xl md:text-3xl font-bold text-white mb-4">
                                            {panel.title}
                                        </h3>
                                        <p className="text-base md:text-lg text-slate-300 leading-relaxed">
                                            {panel.desc}
                                        </p>
                                    </div>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Impacto / Stats */}
            {/* Equivalencias */}
            <section
                id="equivalencias"
                ref={equivRef}
                className="relative py-24 md:py-32 px-6 bg-slate-900 overflow-hidden"
            >
                {/* Fondo decorativo */}
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-40 pointer-events-none"
                    style={{
                        backgroundImage:
                            'radial-gradient(circle at 10% 50%, rgba(34,211,238,0.12), transparent 45%), radial-gradient(circle at 90% 50%, rgba(139,92,246,0.10), transparent 45%)',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    {/* Encabezado */}
                    <div className="max-w-3xl mx-auto text-center mb-16 reveal">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-cyan-500/10 border border-cyan-400/30 rounded-full backdrop-blur-md mb-6">
                            <span className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
                            <span className="text-cyan-200 text-xs font-semibold tracking-widest uppercase">
                                {stats ? 'Datos reales de nuestra base de datos' : 'Datos de referencia ambiental'}
                            </span>
                        </div>
                        <p className="text-cyan-400 text-sm font-bold tracking-[0.25em] uppercase mb-4">
                            ¿Cuánto es cuánto?
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05] mb-6">
                            Equivalencias que{' '}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-violet-300">
                                te van a sorprender
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed">
                            {stats
                                ? 'Estos números vienen directamente de los registros que se están capturando en el sistema. Cada cifra es real, viva y crece con cada manifiesto que se registra.'
                                : 'Los números por sí solos dicen poco. Aquí te mostramos lo que realmente significa cada residuo registrado, en cosas que conoces y entiendes.'}
                        </p>
                    </div>

                    {/* Grid asimétrico: 1 card hero + 5 cards secundarios */}
                    <div className="grid grid-cols-1 md:grid-cols-6 gap-4 md:gap-5 auto-rows-auto">
                        {buildEquivalencias(stats).map((eq, i) => {
                            const isFeatured = eq.featured;
                            return (
                                <article
                                    key={eq.label}
                                    data-delay={`${i * 70}`}
                                    className={`reveal group relative overflow-hidden rounded-3xl bg-slate-900/70 border border-white/10 backdrop-blur-sm transition-all duration-500 hover:-translate-y-1 hover:border-white/25 ${eq.glowColor} hover:shadow-2xl
                                        ${isFeatured
                                            ? 'md:col-span-6 lg:col-span-6'
                                            : 'md:col-span-3 lg:col-span-2'
                                        }`}
                                >
                                    {/* Gradiente de acento en borde superior */}
                                    <div
                                        aria-hidden="true"
                                        className={`absolute inset-x-0 top-0 h-[3px] bg-gradient-to-r ${eq.gradient} opacity-70 group-hover:opacity-100 transition-opacity`}
                                    />

                                    {/* Emoji gigante de fondo */}
                                    <div
                                        aria-hidden="true"
                                        className={`absolute select-none pointer-events-none transition-all duration-700 group-hover:scale-110
                                            ${isFeatured
                                                ? 'right-6 md:right-12 top-1/2 -translate-y-1/2 text-[180px] md:text-[260px] opacity-10 group-hover:opacity-15'
                                                : 'right-4 top-4 text-7xl opacity-10 group-hover:opacity-20'
                                            }`}
                                    >
                                        {eq.emoji}
                                    </div>

                                    {/* Glow radial sutil */}
                                    <div
                                        aria-hidden="true"
                                        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                                        style={{
                                            background: isFeatured
                                                ? 'radial-gradient(circle at 20% 50%, rgba(251,191,36,0.08), transparent 60%)'
                                                : 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.04), transparent 60%)',
                                        }}
                                    />

                                    <div className={`relative z-10 ${isFeatured ? 'p-8 md:p-12' : 'p-6 md:p-7'}`}>
                                        {/* Label superior */}
                                        <div className="flex items-center gap-2 mb-4">
                                            <span className={`inline-block w-1.5 h-1.5 rounded-full bg-gradient-to-r ${eq.gradient}`} />
                                            <span className={`text-[11px] font-bold tracking-[0.25em] uppercase ${eq.accent}`}>
                                                {eq.label}
                                            </span>
                                        </div>

                                        {/* CIFRA MASIVA: la equivalencia */}
                                        <div className={isFeatured ? 'mb-6' : 'mb-5'}>
                                            <div className={`font-black leading-[0.9] tracking-tight text-transparent bg-clip-text bg-gradient-to-br ${eq.gradient} ${
                                                isFeatured
                                                    ? 'text-7xl sm:text-8xl md:text-[10rem] lg:text-[12rem]'
                                                    : 'text-5xl md:text-6xl'
                                            }`}>
                                                <CountUpNumber
                                                    value={eq.impactValue}
                                                    decimals={eq.impactDecimals}
                                                    duration={isFeatured ? 2400 : 1800}
                                                />
                                            </div>
                                            <p className={`font-semibold text-white mt-2 ${
                                                isFeatured
                                                    ? 'text-2xl md:text-3xl'
                                                    : 'text-lg md:text-xl'
                                            }`}>
                                                {eq.impactUnit}
                                            </p>
                                            <p className={`text-slate-400 mt-1 ${
                                                isFeatured ? 'text-base md:text-lg max-w-md' : 'text-sm'
                                            }`}>
                                                {eq.impactDescription}
                                            </p>
                                        </div>

                                        {/* Input real (footer) */}
                                        <div className="flex items-baseline gap-2 pt-4 border-t border-white/10">
                                            <span className="text-xs text-slate-500 uppercase tracking-wider">Basado en</span>
                                            <span className={`text-base md:text-lg font-bold ${eq.accent}`}>
                                                <CountUpNumber
                                                    value={eq.inputValue}
                                                    decimals={eq.inputDecimals}
                                                    duration={1200}
                                                />{' '}
                                                {eq.inputUnit}
                                            </span>
                                            <span className="text-xs text-slate-500 truncate">
                                                {eq.inputCaption}
                                            </span>
                                        </div>
                                    </div>
                                </article>
                            );
                        })}
                    </div>

                    {/* Nota al pie */}
                    <p className="text-center text-xs md:text-sm text-slate-500 mt-12 reveal max-w-2xl mx-auto leading-relaxed" data-delay="200">
                        Cifras calculadas en tiempo real con estándares internacionales (MARPOL · SEMARNAT).
                        Cada registro que se captura hace crecer estos números.
                    </p>
                </div>
            </section>

            {/* Impacto / Stats */}
            <section
                id="impacto"
                ref={statsRef}
                className="relative py-24 md:py-32 px-6 overflow-hidden bg-gradient-to-br from-blue-950 via-slate-900 to-cyan-950"
            >
                <div
                    aria-hidden="true"
                    className="absolute inset-0 opacity-[0.08]"
                    style={{
                        backgroundImage:
                            "url('https://images.unsplash.com/photo-1518837695005-2083093ee35b?auto=format&fit=crop&q=80')",
                        backgroundSize: 'cover',
                        backgroundPosition: 'center',
                        mixBlendMode: 'overlay',
                    }}
                />

                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="text-center max-w-3xl mx-auto mb-16 reveal">
                        <p className="text-cyan-300 text-sm font-bold tracking-[0.25em] uppercase mb-4">
                            Impacto Medible
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight text-white leading-tight">
                            Nuestro avance hasta hoy
                        </h2>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        {[
                            {
                                icon: FileCheck,
                                value: stats?.totalManifiestos
                                    ? stats.totalManifiestos.toLocaleString('es-MX') + '+'
                                    : '5,000+',
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
                                    className="reveal p-8 md:p-10 backdrop-blur-md bg-white/[0.06] rounded-3xl border border-white/15 hover:bg-white/[0.09] transition-colors"
                                    data-delay={`${i * 120}`}
                                >
                                    <Icon className="w-10 h-10 text-cyan-300 mb-6" />
                                    <div className="text-5xl md:text-6xl font-extrabold text-white mb-3 leading-none">
                                        {stat.value}
                                    </div>
                                    <div className="text-lg md:text-xl text-cyan-100 font-semibold mb-2">
                                        {stat.label}
                                    </div>
                                    <div className="text-sm text-slate-300">{stat.detail}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Mapa Interactivo */}
            <section id="mapa" ref={mapRef} className="relative py-24 md:py-32 px-6 bg-slate-950 overflow-hidden">
                <div className="max-w-7xl mx-auto relative z-10">
                    <div className="max-w-3xl mb-16 reveal">
                        <p className="text-cyan-400 text-sm font-bold tracking-[0.25em] uppercase mb-4">
                            Mapa de Puertos
                        </p>
                        <h2 className="text-4xl md:text-6xl font-bold tracking-tight leading-[1.05]">
                            Dónde estamos, <br />
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400">
                                a dónde vamos.
                            </span>
                        </h2>
                        <p className="text-lg md:text-xl text-slate-300 leading-relaxed mt-6">
                            El modelo está listo para escalar. Cada puerto pesquero de México puede sumarse
                            a una red nacional de trazabilidad ambiental.
                        </p>
                    </div>

                    <div className="reveal" data-delay="100">
                        <InteractiveMexicoMap />
                    </div>
                </div>
            </section>

            {/* Call to action final */}
            <section
                ref={ctaRef}
                className="relative py-24 md:py-32 px-6 overflow-hidden bg-gradient-to-br from-cyan-950 via-blue-950 to-slate-950"
            >
                <div className="max-w-4xl mx-auto text-center relative z-10 reveal">
                    <Waves className="w-14 h-14 text-cyan-300 mx-auto mb-8" />
                    <h2 className="text-4xl md:text-6xl font-bold text-white leading-tight mb-6">
                        Cada dato cuenta. <br />
                        <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-300 to-blue-300">
                            Cada mar lo agradece.
                        </span>
                    </h2>
                    <p className="text-lg md:text-xl text-slate-200 mb-10 leading-relaxed max-w-2xl mx-auto">
                        Accede a la plataforma y sé parte del cambio en la gestión de residuos marinos.
                    </p>
                    <button
                        onClick={openLoginModal}
                        className="group px-10 py-5 bg-cyan-400 hover:bg-cyan-300 text-slate-950 font-bold tracking-wide transition-all shadow-2xl shadow-cyan-500/30 inline-flex items-center gap-3 rounded-full cursor-pointer hover:scale-105 active:scale-95 text-lg"
                    >
                        Iniciar sesión
                        <ArrowRight className="w-6 h-6 group-hover:translate-x-1 transition-transform" />
                    </button>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-slate-950 py-16 md:py-20 px-6 border-t border-white/10">
                <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-10">
                    <div className="md:col-span-2">
                        <img
                            src="/assets/logo_DCK.png"
                            alt="SiMAR Logo"
                            className="h-14 w-auto object-contain mb-6"
                        />
            
                    </div>

                    <div>
                        <h4 className="text-base font-bold mb-5 text-white uppercase tracking-widest">
                            Créditos
                        </h4>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li>Michelle Jacquelinne Díaz Aguirre</li>
                            <li>Darien Alejandro Verdugo Reyna</li>
                            <li>Abrham Sayd Martínez Corrales</li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="text-base font-bold mb-5 text-white uppercase tracking-widest">
                            Instituciones
                        </h4>
                        <ul className="space-y-3 text-slate-400 text-sm">
                            <li>ITSPP</li>
                            <li>DCK Conciencia y Cultura</li>
                            <li>SEMARNAT</li>
                        </ul>
                    </div>
                </div>

                <div className="max-w-7xl mx-auto mt-16 pt-8 border-t border-white/5 text-center text-slate-500 text-xs md:text-sm">
                    © 2025 DCK / ITSPP. Todos los derechos reservados.
                </div>
            </footer>

            {/* Login Modal */}
            {showLoginModal && (
                <div
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-label="Iniciar sesión"
                >
                    <div
                        className="absolute inset-0 bg-black/70 backdrop-blur-md animate-fade-in"
                        onClick={() => setShowLoginModal(false)}
                    />

                    {/* PASO 1 — Selector de rol */}
                    {modalRole === null && (
                        <div className="relative bg-slate-900 w-full max-w-xl rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-white/10">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-2 rounded-full hover:bg-white/10"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="p-8">
                                <div className="text-center mb-8">
                                    <h2 className="text-2xl font-extrabold text-white">¿Cómo deseas ingresar?</h2>
                                    <p className="text-sm text-slate-400 mt-2">
                                        Selecciona tu tipo de usuario
                                    </p>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                    <ModalRoleCard
                                        title="Administrador Portuario"
                                        desc="Manifiestos, embarcaciones y estadísticas del puerto."
                                        accent="blue"
                                        Icon={Anchor}
                                        onClick={() => selectModalRole('admin')}
                                    />
                                    <ModalRoleCard
                                        title="Empresa Recolectora"
                                        desc="Consulta residuos, solicita recolecciones y mide tu impacto."
                                        accent="emerald"
                                        Icon={Recycle}
                                        onClick={() => selectModalRole('recolector')}
                                    />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* PASO 2 — Formulario de login */}
                    {modalRole !== null && (
                        <div className="relative bg-slate-900 w-full max-w-md rounded-3xl shadow-2xl overflow-hidden animate-scale-in border border-white/10 dark">
                            <button
                                onClick={() => setShowLoginModal(false)}
                                className="absolute top-4 right-4 text-slate-400 hover:text-white transition-colors z-10 p-2 rounded-full hover:bg-white/10"
                                aria-label="Cerrar"
                            >
                                <X className="w-5 h-5" />
                            </button>
                            <div className="p-8">
                                {/* Badge de rol + botón volver */}
                                <div className="flex items-center justify-between mb-5">
                                    <button
                                        onClick={clearModalRole}
                                        className="flex items-center gap-1.5 text-xs font-semibold text-slate-400 hover:text-white transition-colors"
                                    >
                                        <ArrowLeft className="w-3.5 h-3.5" />
                                        Cambiar
                                    </button>
                                    <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-bold border ${
                                        modalRole === 'recolector'
                                            ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                            : 'bg-blue-500/10 border-blue-500/30 text-blue-300'
                                    }`}>
                                        {modalRole === 'recolector'
                                            ? <><Recycle className="w-3.5 h-3.5" /> Empresa Recolectora</>
                                            : <><Anchor className="w-3.5 h-3.5" /> Administrador Portuario</>
                                        }
                                    </span>
                                </div>
                                <LoginForm
                                    showLogo={true}
                                    redirectTo={modalRole === 'recolector' ? '/dashboard-recolector' : '/dashboard'}
                                    onSuccess={() => setShowLoginModal(false)}
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}

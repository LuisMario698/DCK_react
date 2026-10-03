'use client';

import { Fragment, useState, useEffect, useRef, type CSSProperties } from 'react';
import Image from 'next/image';
import simboloGrande from '@/public/assets/simar/simbolo-grande.png';
import nombreGrandeOscuro from '@/public/assets/simar/nombre-grande-oscuro.png';
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
    TreePine,
    Wrench,
    Waves,
    Anchor,
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
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { useParams } from 'next/navigation';
import { MODO_DEMO, URL_DEMO } from '@/lib/demo/config';
import {
    aguaProtegidaL,
    co2EvitadoKg,
    decimalesEquivalencia,
    equivalenciaAgua,
    equivalenciaBasura,
    equivalenciaCO2,
    esUno,
    type Equivalencia,
} from '@/lib/utils/equivalencias';

/** Segundos que se queda cada fotografía del carrusel (la píldora activa se llena en ese tiempo) */
const SEGUNDOS_POR_FOTO = 6;

/**
 * Texto que se enfoca palabra por palabra: dentro de un `.reveal-palabras` lo hace al
 * aparecer con el scroll; dentro de `.simar-enfoca-palabras`, al cargar. `desde` sigue la
 * cascada de un texto anterior. El lector de pantalla oye la frase entera, una sola vez.
 */
function TextoEnfoca({ texto, desde = 0 }: { texto: string; desde?: number }) {
    return (
        <>
            <span aria-hidden="true">
                {texto.split(' ').map((palabra, i) => (
                    <Fragment key={i}>
                        {i > 0 && ' '}
                        <span className="palabra" style={{ '--i': desde + i } as CSSProperties}>
                            {palabra}
                        </span>
                    </Fragment>
                ))}
            </span>
            <span className="sr-only">{texto}</span>
        </>
    );
}

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

/**
 * Fotografías de fondo del hero. `encuadre` = object-position (dónde recortar las verticales).
 * Los reconocimientos (img6, img7) no van aquí: su texto grande pelea con el logo.
 */
const MEDIA: { src: string; encuadre?: string }[] = [
    { src: '/assets/images/img1.jpeg' },
    { src: '/assets/images/img2.jpeg' },
    { src: '/assets/images/img3.jpeg', encuadre: '50% 30%' },
    { src: '/assets/images/img5.jpeg', encuadre: '50% 35%' },
    { src: '/assets/images/img4.jpeg', encuadre: '50% 20%' },
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
        // Mismo factor que las equivalencias y Estadísticas (LITROS_AGUA_POR_LITRO_ACEITE)
        statLabel: 'puede contaminar 1,000 L de agua',
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
        // Lo que el sistema de verdad registra (antes: "100% de residuos con destino verificado")
        stat: '3 pasos',
        cifra: 3,
        sufijo: ' pasos',
        statLabel: 'del barco al reciclaje o al relleno',
        desc: 'Cada filtro, litro de aceite y kilo de basura queda registrado: la embarcación que lo entregó, lo que hay en el centro de acopio y la empresa que se lo llevó a reciclar o el viaje al relleno sanitario.',
        color: 'bg-[rgba(95,209,160,0.16)] text-[#6FD9AE]',
        accent: 'text-[#6FD9AE]',
    },
    {
        icon: ShieldCheck,
        title: 'Cumplimiento MARPOL',
        stat: 'Anexo V',
        statLabel: 'Convenio Internacional',
        desc: 'MARPOL es la norma internacional que regula la contaminación generada por buques. SiMAR guarda la evidencia digital que ayuda a demostrar que se cumple.',
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
            // En celular es un renglón: ícono, título y descripción, y la flecha a la derecha
            className={`group text-left w-full rounded-3xl border-2 border-simar-borde bg-simar-superficie p-5 md:p-6 flex flex-col gap-2.5 transition-[border-color,transform] duration-200 hover:-translate-y-0.5 movil:grid movil:grid-cols-[auto_1fr_auto] movil:items-center movil:gap-x-3 movil:gap-y-0.5 movil:p-4 movil:rounded-[20px] ${s.wrap}`}
        >
            <span className={`w-14 h-14 rounded-full flex items-center justify-center movil:w-12 movil:h-12 movil:row-span-2 ${s.icon}`}>
                <Icon className="w-7 h-7 movil:w-6 movil:h-6" />
            </span>
            <span className="text-xl md:text-[21px] font-extrabold text-simar-texto movil:text-[17px] movil:leading-tight">{title}</span>
            <span className="text-[17px] leading-snug text-simar-texto-2 movil:col-start-2 movil:text-[14px]">{desc}</span>
            <span className={`mt-1 flex items-center gap-1.5 text-[17px] font-bold movil:mt-0 movil:col-start-3 movil:row-start-1 movil:row-span-2 ${s.arrow}`}>
                <span className="movil:sr-only">Continuar</span> <ArrowRight className="w-[18px] h-[18px] group-hover:translate-x-0.5 transition-transform movil:w-[22px] movil:h-[22px]" />
            </span>
        </button>
    );
}

/** Año del manifiesto más antiguo recuperado ("Histórico desde", sección de Don Francisco) */
const ANIO_INICIO_HISTORICO = 2014;
/** Minutos de papeleo a mano que se estima que ahorra cada manifiesto digital */
const MINUTOS_POR_MANIFIESTO = 25;

/**
 * Las equivalencias de "¿Cuánto es cuánto?". Las cuentas son las mismas de Estadísticas
 * (lib/utils/equivalencias.ts): mismos factores y misma forma de decirlo (albercas, árboles,
 * camiones). Antes la landing usaba otras (1 L de aceite = 1,000,000 L de agua, bolsas de
 * plástico a partir de toda la basura, 0.02 árboles por hojas de papel, 40 L de tierra por filtro)
 * y sumaba la basura de los barcos con la del basurón, que es la misma basura camino al relleno.
 */
function buildEquivalencias(stats: LandingStats | null): EquivalenciaCard[] {
    const aceite       = stats?.totalAceiteUsado ?? 0;
    // Sólo lo que entregaron los barcos: el basurón es esa misma basura camino al relleno
    const basuraKg     = stats?.totalBasura ?? 0;
    const basuronKg    = stats?.totalBasuron ?? 0;
    const totalFiltros = (stats?.filtrosAceite ?? 0) + (stats?.filtrosDiesel ?? 0) + (stats?.filtrosAire ?? 0);
    const manifiestos  = stats?.totalManifiestos ?? 0;

    const agua  = aguaProtegidaL(aceite);
    const co2   = co2EvitadoKg(aceite, basuronKg);
    const horas = (manifiestos * MINUTOS_POR_MANIFIESTO) / 60;
    const anios = new Date().getFullYear() - ANIO_INICIO_HISTORICO;

    // Lo grande de la tarjeta sale de la equivalencia; sin datos, ceros con el nombre de siempre
    const impacto = (eq: Equivalencia | null, porDefecto: { unidad: string; descripcion: string }) =>
        eq
            ? {
                  impactValue: eq.valor,
                  impactDecimals: decimalesEquivalencia(eq.valor),
                  impactUnit: esUno(eq.valor) ? eq.nombre[0] : eq.nombre[1],
                  impactDescription: eq.descripcion,
              }
            : { impactValue: 0, impactDecimals: 0, impactUnit: porDefecto.unidad, impactDescription: porDefecto.descripcion };
    const eqAgua = equivalenciaAgua(agua);
    const eqBasura = equivalenciaBasura(basuraKg);
    const eqCO2 = equivalenciaCO2(co2);

    return [
        {
            icon: eqAgua?.icono ?? Waves,
            label: 'Agua protegida',
            inputValue: aceite,
            inputDecimals: 1,
            inputUnit: 'L',
            inputCaption: 'de aceite recolectado',
            ...impacto(eqAgua, { unidad: 'albercas olímpicas', descripcion: 'de agua que no se contaminó con aceite' }),
            tono: 'bg-white text-[#1B5FC9]',
            featured: true,
        },
        {
            icon: eqBasura?.icono ?? Fish,
            label: 'Mar limpio',
            inputValue: basuraKg,
            inputDecimals: 0,
            inputUnit: 'kg',
            inputCaption: 'de basura que entregaron las embarcaciones',
            ...impacto(eqBasura, { unidad: 'bolsas de basura', descripcion: 'llenas que no terminaron en el mar' }),
            tono: 'bg-[#E4F5F7] text-[#0E7C8A] dark:bg-[rgba(32,178,196,0.2)] dark:text-[#7FE0D6]',
        },
        {
            icon: eqCO2?.icono ?? TreePine,
            label: 'Aire más limpio',
            inputValue: co2,
            inputDecimals: 0,
            inputUnit: 'kg',
            inputCaption: 'de CO₂ que se evitó (estimado)',
            ...impacto(eqCO2, { unidad: 'árboles', descripcion: 'absorberían en un año el CO₂ que se evitó' }),
            tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        },
        {
            icon: Wrench,
            label: 'Filtros de motor',
            inputValue: manifiestos,
            inputDecimals: 0,
            inputUnit: 'manifiestos',
            inputCaption: 'capturados',
            impactValue: totalFiltros,
            impactDecimals: 0,
            impactUnit: totalFiltros === 1 ? 'filtro' : 'filtros',
            impactDescription: 'de aceite, diésel y aire entregados en el puerto',
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
            impactDescription: 'de papeleo que ya no se hace a mano',
            tono: 'bg-simar-marea-suave text-simar-marea-tinta',
        },
        {
            icon: BookOpen,
            label: 'Historia viva',
            inputValue: manifiestos,
            inputDecimals: 0,
            inputUnit: 'registros',
            inputCaption: 'de datos ambientales',
            impactValue: anios,
            impactDecimals: 0,
            impactUnit: 'años',
            impactDescription: 'del Mar de Cortés en evidencia digital',
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
    // Sólo en celular: los textos largos muestran el primer párrafo y "Leer más"
    const [leerProyecto, setLeerProyecto] = useState(false);
    const [leerFrancisco, setLeerFrancisco] = useState(false);
    // null = mostrar selector, 'admin'/'recolector' = ir directo al form
    const [modalRole, setModalRole] = useState<ModalRole | null>(null);
    // Página protegida que se pidió sin sesión (?siguiente=...), para volver tras el login
    const [siguiente, setSiguiente] = useState<string | null>(null);
    const [scrolled, setScrolled] = useState(false);
    const [menuMovil, setMenuMovil] = useState(false);
    // La ventana de acceso se queda montada mientras hace su salida
    const ventanaAcceso = usePresencia(showLoginModal, 200);
    // Foco adentro al abrir, Tab no se sale y al cerrar regresa al botón "Iniciar sesión"
    const accesoRef = useRef<HTMLDivElement>(null);
    useVentanaAccesible(accesoRef, showLoginModal);

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

    // La demostración (supabase/demo/README.md): en su despliegue, los botones de acceso llevan a ella;
    // en producción, si existe, un enlace discreto bajo los botones del inicio
    const { locale } = useParams<{ locale: string }>();
    const rutaDemo = MODO_DEMO ? `/${locale}/demo` : URL_DEMO ? `${URL_DEMO}/${locale}/demo` : null;

    const openLoginModal = () => {
        if (MODO_DEMO && rutaDemo) {
            window.location.assign(rutaDemo);
            return;
        }
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
            // eslint-disable-next-line react-hooks/set-state-in-effect -- la URL sólo existe en el navegador
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

    // Escape cierra la ventana de acceso, como todas las ventanas de SiMAR
    const cerrarLoginRef = useRef(cerrarLoginModal);
    useEffect(() => {
        cerrarLoginRef.current = cerrarLoginModal;
    });
    useEffect(() => {
        if (!showLoginModal) return;
        const alTeclear = (e: KeyboardEvent) => {
            if (e.key === 'Escape') cerrarLoginRef.current();
        };
        document.addEventListener('keydown', alTeclear);
        return () => document.removeEventListener('keydown', alTeclear);
    }, [showLoginModal]);

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
                <div className="h-[72px] md:h-[84px] pl-3 md:pl-5 pr-2 md:pr-3 flex items-center gap-2 sm:gap-5 movil:h-[62px] movil:pl-2.5">
                    <a href="#top" className="flex items-center gap-4 rounded-2xl min-w-0" aria-label="SiMAR - Inicio">
                        {/* En celular sólo el símbolo: el nombre ya está grande en el hero */}
                        <LogoSimar variante="simbolo" tamano={42} className="sm:hidden" />
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
                        <BotonTemaIcono className="movil:w-[46px] movil:h-[46px] movil:rounded-[15px]" />
                        {/* Menú de secciones (bajo 1280 px los enlaces no caben en la barra) */}
                        <button
                            type="button"
                            onClick={() => setMenuMovil((v) => !v)}
                            aria-expanded={menuMovil}
                            aria-controls="menu-secciones"
                            aria-label={menuMovil ? 'Cerrar menú de secciones' : 'Abrir menú de secciones'}
                            className="xl:hidden simar-presiona w-[54px] h-[54px] md:w-[58px] md:h-[58px] flex-shrink-0 rounded-[18px] border border-simar-texto/15 bg-white/50 dark:bg-white/5 text-simar-texto flex items-center justify-center movil:w-[46px] movil:h-[46px] movil:rounded-[15px]"
                        >
                            {menuMovil ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
                        </button>
                        <button
                            onClick={openLoginModal}
                            className="simar-presiona min-h-[54px] md:min-h-[58px] px-4 sm:px-5 md:px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover text-white text-base md:text-lg font-extrabold flex items-center gap-2 cursor-pointer whitespace-nowrap movil:min-h-[46px] movil:px-3.5 movil:rounded-[15px] movil:text-[15px]"
                        >
                            {MODO_DEMO ? 'Probar la demo' : 'Iniciar sesión'}
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
                                        className={`min-h-[56px] px-4 rounded-2xl flex items-center justify-between text-lg font-bold transition-colors movil:min-h-[46px] movil:text-[16px] ${
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

            {/* Hero: las fotos del proyecto de fondo y el logo grande al centro */}
            {/* overflow-clip y no -hidden: lo decorativo que sobresale no vuelve "desplazable" la franja (al enfocar un botón se corría) */}
            <header id="top" className="simar-hero relative isolate overflow-clip bg-simar-abismo text-white">
                {/* Fondo: las fotografías se funden y se enfocan una sobre otra. Son decorativas
                    (el texto no depende de ellas); el velo oscurece para que todo se lea */}
                <div aria-hidden="true" className="simar-enfoca absolute inset-0 -z-10" style={{ animationDuration: '1.6s' }}>
                    {MEDIA.map((foto, index) => (
                        <Image
                            key={foto.src}
                            src={foto.src}
                            alt=""
                            fill
                            sizes="100vw"
                            // Todas están en pantalla (una sobre otra): cualquiera puede ser el LCP
                            priority={index === 0}
                            loading={index === 0 ? undefined : 'eager'}
                            data-estado={index === currentIndex ? 'activa' : index === prevIndex ? 'anterior' : undefined}
                            className="simar-hero-foto object-cover"
                            style={{ objectPosition: foto.encuadre }}
                        />
                    ))}
                    <div className="simar-hero-tinte absolute inset-0 z-[5]" />
                    <div className="simar-hero-velo absolute inset-0 z-10" />
                </div>

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
                                priority
                                sizes="(max-width: 639px) 136px, 240px"
                                className="simar-enfoca-simbolo relative h-[clamp(128px,24svh,240px)] w-auto movil:h-[132px]"
                                style={{ animationDelay: '0.1s' }}
                            />
                        </span>
                        <Image
                            src={nombreGrandeOscuro}
                            alt="SiMAR"
                            priority
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
                            onClick={openLoginModal}
                            className="simar-presiona whitespace-nowrap min-h-[64px] px-7 rounded-[20px] bg-simar-marea hover:bg-simar-marea-hover text-white text-lg md:text-xl font-extrabold flex items-center justify-center gap-2.5 cursor-pointer group shadow-[0_18px_40px_-18px_rgba(27,95,201,0.9)] movil:min-h-[54px] movil:rounded-[17px] movil:text-[17px]"
                        >
                            {MODO_DEMO ? 'Probar la demostración' : 'Acceder a la plataforma'}
                            <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                        </button>
                        <a
                            href="#proyecto"
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

                {/* Controles de las fotografías. Se pausan con el botón o al pasar el cursor / enfocar los controles
                    (el cursor sobre el fondo no las detiene: están detrás de todo el hero) */}
                <div className="absolute z-20 inset-x-0 bottom-16 md:bottom-24 px-6 md:px-12 lg:px-24 flex justify-center lg:justify-end pointer-events-none movil:bottom-12">
                    <div
                        role="group"
                        aria-label={`Fotografía ${currentIndex + 1} de ${MEDIA.length}`}
                        className="simar-enfoca simar-vidrio-fuerte pointer-events-auto relative rounded-full pl-1.5 pr-3 py-1.5 flex items-center gap-1"
                        style={{ animationDelay: '1.7s' }}
                        onMouseEnter={() => setPausaMomentanea(true)}
                        onMouseLeave={() => setPausaMomentanea(false)}
                        onFocus={() => setPausaMomentanea(true)}
                        onBlur={() => setPausaMomentanea(false)}
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
                </div>

                <div aria-hidden="true" className="simar-enfoca hidden lg:flex absolute left-24 bottom-[112px] items-center gap-2.5 text-base font-semibold text-white/75" style={{ animationDelay: '1.9s' }}>
                    <ArrowDown className="w-5 h-5" />
                    Desliza
                </div>

                <OlaSeparador color="var(--simar-superficie)" lado="abajo" />
            </header>

            {/* Sección Proyecto */}
            <section id="proyecto" ref={projectRef} className="relative py-20 md:py-28 px-6 bg-simar-superficie overflow-clip movil:py-14 movil:px-5">
                <div className="max-w-[1248px] mx-auto grid lg:grid-cols-[1fr_440px] xl:grid-cols-[1fr_540px] gap-12 lg:gap-16 items-center movil:gap-8">
                    {/* Cada bloque se enfoca por separado: antetítulo, título palabra por palabra, texto y cifras */}
                    <div>
                        <p className="reveal text-lg font-bold text-simar-marea-tinta movil:text-[15px]">El proyecto</p>
                        <h2 className="reveal reveal-palabras mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]" data-delay="80">
                            <TextoEnfoca texto="Tecnología al servicio del mar." />
                        </h2>
                        <div className="reveal mt-6 space-y-4 text-lg md:text-xl leading-relaxed text-simar-texto-2 movil:mt-4 movil:space-y-3 movil:text-[16px]" data-delay="300">
                            <p>
                                Nace de la colaboración entre{' '}
                                <strong className="text-simar-texto">DCK Conciencia y Cultura</strong> —formada por
                                Dayanara, Coral y Karitza— y el{' '}
                                <strong className="text-simar-texto">Instituto Tecnológico Superior de Puerto Peñasco</strong>,
                                bajo el respaldo de <strong className="text-simar-texto">SEMARNAT</strong>.
                            </p>
                            <p className={leerProyecto ? '' : 'movil:hidden'}>
                                Desarrollamos un sistema web que <strong className="text-simar-texto">digitaliza y centraliza</strong> el
                                registro de residuos generados por embarcaciones pesqueras —aceites usados, filtros,
                                plásticos y basura general— reemplazando procesos manuales que durante años
                                dificultaron la trazabilidad.
                            </p>
                            <p className={leerProyecto ? '' : 'movil:hidden'}>
                                Cada manifiesto que antes era un papel deteriorado en un archivero hoy es
                                un dato que cuenta una historia: la historia del compromiso de Puerto Peñasco
                                con su mar.
                            </p>
                            {!leerProyecto && (
                                <button type="button" onClick={() => setLeerProyecto(true)} className="hidden movil:inline-flex min-h-[44px] items-center gap-1.5 text-[16px] font-bold text-simar-marea-tinta">
                                    Leer más <ArrowDown className="w-[18px] h-[18px]" />
                                </button>
                            )}
                        </div>

                        <div className="reveal mt-8 pt-6 border-t border-simar-borde grid grid-cols-3 gap-5 movil:mt-5 movil:pt-5 movil:gap-3" data-delay="150">
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
                                        '—'
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

                    <figure className="reveal relative m-0 h-[420px] md:h-[560px] rounded-[36px] overflow-hidden movil:h-[260px] movil:rounded-[26px]" data-efecto="foto" data-delay="150">
                        <img
                            src="/assets/images/img3.jpeg"
                            alt="Puerto Peñasco, Sonora"
                            className="absolute inset-0 w-full h-full object-cover"
                        />
                        <figcaption className="simar-vidrio-fuerte absolute left-4 right-4 bottom-4 rounded-3xl px-5 py-4 movil:left-3 movil:right-3 movil:bottom-3 movil:px-4 movil:py-3 movil:rounded-[18px]">
                            <span className="block text-xl font-extrabold movil:text-[17px]">Alto Golfo de California</span>
                            <span className="block mt-0.5 text-[17px] text-simar-texto-2 movil:text-[14px]">
                                Una de las regiones marinas más biodiversas y frágiles del planeta.
                            </span>
                        </figcaption>
                    </figure>
                </div>
            </section>

            {/* Don Francisco */}
            <section id="don-francisco" ref={francoRef} className="relative py-20 md:py-28 px-6 overflow-clip movil:py-14 movil:px-5">
                <div className="max-w-[1248px] mx-auto">
                    <div>
                        <p className="reveal text-lg font-bold text-simar-marea-tinta movil:text-[15px]">El protagonista</p>
                        <h2 className="reveal reveal-palabras mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]" data-delay="80">
                            <TextoEnfoca texto="Conoce a Don Francisco" />
                        </h2>
                    </div>

                    <div className="mt-10 grid lg:grid-cols-[600px_1fr] gap-10 lg:gap-16 items-start movil:mt-6 movil:gap-6">
                        <figure className="reveal relative m-0 h-[360px] md:h-[440px] rounded-[36px] overflow-hidden movil:h-[270px] movil:rounded-[26px]" data-efecto="foto">
                            <img
                                src="/assets/images/img5.jpeg"
                                alt="Don Francisco en Puerto Peñasco"
                                className="absolute inset-0 w-full h-full object-cover object-[60%_40%]"
                            />
                            <figcaption className="simar-vidrio-fuerte absolute left-4 bottom-4 rounded-[22px] px-5 py-3.5 movil:left-3 movil:right-3 movil:bottom-3 movil:px-4 movil:py-3 movil:rounded-[18px]">
                                <span className="block text-lg md:text-[19px] font-extrabold movil:text-[16px]">Francisco Javier Bojórquez Ochoa</span>
                                <span className="block text-base text-simar-texto-2 movil:text-[14px]">SEMARNAT · Puerto Peñasco</span>
                            </figcaption>
                        </figure>

                        <div className="reveal" data-direction="right" data-delay="150">
                            <blockquote className="m-0 flex gap-3 text-2xl md:text-[26px] leading-snug font-bold movil:text-[20px] movil:gap-2.5">
                                <Quote className="w-8 h-8 flex-shrink-0 mt-1 text-simar-marea-tinta movil:w-7 movil:h-7" />
                                <span>“Son datos que tienen mucha importancia en el medio ambiente marítimo y terrestre de Puerto Peñasco.”</span>
                            </blockquote>
                            <div className="mt-5 space-y-4 text-lg md:text-[19px] leading-relaxed text-simar-texto-2 movil:mt-4 movil:space-y-3 movil:text-[16px]">
                                <p>
                                    Don Francisco es responsable del área de residuos del recinto portuario de Puerto Peñasco.
                                    Durante años llenó manifiestos a mano, hoja por hoja, archivando papeles que el tiempo
                                    deterioraba hasta volverlos ilegibles.
                                </p>
                                <p className={leerFrancisco ? '' : 'movil:hidden'}>
                                    Esta plataforma fue diseñada <strong className="text-simar-texto">con él y para él</strong>: con botones grandes,
                                    flujos lineales y lenguaje claro. Porque la tecnología solo sirve si llega a quien
                                    la necesita.
                                </p>
                                <p className={leerFrancisco ? '' : 'movil:hidden'}>
                                    Gracias a su experiencia de décadas cuidando el puerto, hoy más de{' '}
                                    <strong className="text-simar-texto">
                                        {stats?.totalManifiestos
                                            ? stats.totalManifiestos.toLocaleString('es-MX')
                                            : '5,000'}
                                    </strong>{' '}
                                    reportes históricos se están recuperando de las hojas que se desgastaban,
                                    convirtiéndose en evidencia digital permanente.
                                </p>
                                {!leerFrancisco && (
                                    <button type="button" onClick={() => setLeerFrancisco(true)} className="hidden movil:inline-flex min-h-[44px] items-center gap-1.5 text-[16px] font-bold text-simar-marea-tinta">
                                        Leer más <ArrowDown className="w-[18px] h-[18px]" />
                                    </button>
                                )}
                            </div>

                            <div className="mt-6 grid grid-cols-2 gap-4 movil:mt-4 movil:gap-3">
                                <div className="rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar px-5 py-4 movil:px-4 movil:py-3 min-w-0">
                                    <div className="text-3xl font-extrabold movil:text-[24px]">{ANIO_INICIO_HISTORICO}</div>
                                    <div className="text-base md:text-[17px] text-simar-texto-2">Histórico desde</div>
                                </div>
                                <div className="rounded-[22px] bg-simar-superficie border border-simar-borde shadow-simar px-5 py-4 movil:px-4 movil:py-3 min-w-0">
                                    <div className="text-3xl font-extrabold movil:text-[20px] movil:leading-[36px]">SEMARNAT</div>
                                    <div className="text-base md:text-[17px] text-simar-texto-2">Respaldo institucional</div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </section>

            {/* Conciencia Azul — franja oscura */}
            <section id="conciencia" ref={awarenessRef} className="relative py-24 md:py-36 px-6 bg-simar-abismo text-white overflow-clip movil:py-16 movil:px-5">
                <OlaSeparador color="var(--simar-papel)" lado="arriba" />
                <OlaSeparador color="var(--simar-papel)" lado="abajo" />
                <div className="relative max-w-[1248px] mx-auto">
                    <div className="max-w-3xl">
                        <p className="reveal text-lg font-bold text-simar-espuma movil:text-[15px]">Conciencia Azul</p>
                        <h2 className="reveal reveal-palabras mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]" data-delay="80">
                            <TextoEnfoca texto="¿Por qué importan los datos del mar?" />
                        </h2>
                        <p className="reveal mt-4 text-lg md:text-[21px] leading-relaxed text-[#C7D3DD] movil:mt-3 movil:text-[16px]" data-delay="350">
                            Detrás de cada cifra hay un ecosistema. Detrás de cada manifiesto, una decisión
                            que puede proteger —o dañar— al Mar de Cortés por generaciones.
                        </p>
                    </div>

                    {/* En celular, carrusel que se desliza de lado (cada tarjeta ocupa casi el ancho) */}
                    <p className="hidden movil:flex mt-5 items-center gap-1.5 text-[14px] font-bold text-simar-espuma">
                        Desliza para ver las {AWARENESS_PANELS.length} <ArrowRight className="w-4 h-4" />
                    </p>
                    <div className="simar-carrusel mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 movil:mt-3">
                        {AWARENESS_PANELS.map((panel, i) => {
                            const Icon = panel.icon;
                            return (
                                <article
                                    key={panel.title}
                                    className="reveal rounded-[26px] bg-[#12304A] border border-white/10 p-6 movil:p-5 movil:rounded-[22px]"
                                    data-delay={`${i * 100}`}
                                >
                                    <span className={`w-[52px] h-[52px] rounded-full flex items-center justify-center ${panel.color}`}>
                                        <Icon className="w-[26px] h-[26px]" />
                                    </span>
                                    <h3 className="mt-4 text-xl md:text-[21px] font-extrabold movil:mt-3 movil:text-[18px]">{panel.title}</h3>
                                    <div className={`mt-2.5 text-[38px] font-extrabold leading-tight movil:mt-1.5 movil:text-[32px] ${panel.accent}`}>
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
                                    <p className="mt-3 text-base leading-relaxed text-[#C7D3DD] movil:mt-2 movil:text-[15px]">{panel.desc}</p>
                                </article>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Equivalencias */}
            <section id="equivalencias" ref={equivRef} className="relative py-20 md:py-28 px-6 overflow-clip movil:py-14 movil:px-5">
                <div className="max-w-[1248px] mx-auto">
                    <div className="max-w-4xl">
                        <span className="reveal inline-flex items-center gap-2 px-4 py-2 rounded-full bg-simar-marea-suave text-simar-marea-tinta text-base font-bold movil:text-[14px] movil:px-3 movil:py-1.5">
                            <span className="w-2 h-2 rounded-full bg-simar-marea-tinta" />
                            {hayDatos ? 'Datos reales de nuestra base de datos' : 'Datos de referencia ambiental'}
                        </span>
                        <p className="reveal mt-5 text-lg font-bold text-simar-marea-tinta movil:mt-4 movil:text-[15px]" data-delay="60">¿Cuánto es cuánto?</p>
                        <h2 className="reveal reveal-palabras mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]" data-delay="120">
                            <TextoEnfoca texto="Equivalencias que te van a sorprender" />
                        </h2>
                        <p className="reveal mt-4 text-lg md:text-[21px] leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[16px]" data-delay="400">
                            {hayDatos
                                ? 'Salen de los registros reales que se capturan en el sistema, traducidos a cosas que conoces. Crecen con cada manifiesto que se registra.'
                                : 'Los números por sí solos dicen poco. Aquí te mostramos lo que realmente significa cada residuo registrado, en cosas que conoces y entiendes.'}
                        </p>
                    </div>

                    {/* En celular: la tarjeta destacada a lo ancho y las demás de dos en dos */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-5 movil:mt-6 movil:grid-cols-2 movil:gap-2.5">
                        {buildEquivalencias(statsReales).map((eq, i) => {
                            const Icon = eq.icon;
                            if (eq.featured) {
                                return (
                                    <article
                                        key={eq.label}
                                        data-delay={`${i * 70}`}
                                        className="reveal md:col-span-2 lg:col-span-3 rounded-[30px] bg-simar-marea text-white p-7 md:p-8 flex flex-col md:flex-row md:items-center gap-6 md:gap-8 movil:col-span-2 movil:p-5 movil:gap-4 movil:rounded-[24px]"
                                    >
                                        <span className="w-[72px] h-[72px] flex-shrink-0 rounded-full bg-white text-[#1B5FC9] flex items-center justify-center movil:w-[52px] movil:h-[52px]">
                                            <Icon className="w-[34px] h-[34px] movil:w-[26px] movil:h-[26px]" />
                                        </span>
                                        <div className="flex-1">
                                            <div className="text-lg md:text-[19px] font-bold text-[#DCE8FB] movil:text-[15px]">{eq.label}</div>
                                            <div className="mt-1 text-5xl md:text-[56px] font-extrabold leading-tight movil:text-[38px]">
                                                <NumeroAnimado valor={eq.impactValue} decimales={eq.impactDecimals} duracion={2400} />{' '}
                                                <span className="text-2xl md:text-[26px]">{eq.impactUnit}</span>
                                            </div>
                                            <div className="mt-1 text-lg md:text-[19px] text-[#E6EEFB] movil:text-[15px]">{eq.impactDescription}</div>
                                        </div>
                                        <div className="md:w-[240px] md:pl-7 md:border-l border-white/30 movil:pt-3 movil:border-t">
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
                                    className="reveal rounded-[26px] bg-simar-superficie border border-simar-borde shadow-simar p-6 movil:p-3.5 movil:rounded-[20px] min-w-0"
                                >
                                    <span className={`w-[52px] h-[52px] rounded-full flex items-center justify-center movil:w-9 movil:h-9 ${eq.tono}`}>
                                        <Icon className="w-[26px] h-[26px] movil:w-[18px] movil:h-[18px]" />
                                    </span>
                                    <div className="mt-3.5 text-lg font-bold text-simar-texto-2 movil:mt-2.5 movil:text-[14px] movil:leading-tight">{eq.label}</div>
                                    <div className="text-[38px] font-extrabold leading-tight movil:mt-1 movil:text-[22px] movil:break-all">
                                        <NumeroAnimado valor={eq.impactValue} decimales={eq.impactDecimals} duracion={1800} />
                                    </div>
                                    <div className="text-lg font-bold movil:text-[14px] movil:leading-tight">{eq.impactUnit}</div>
                                    <div className="text-[17px] text-simar-texto-2 movil:text-[13px] movil:leading-snug">{eq.impactDescription}</div>
                                    <div className="mt-3 pt-3 border-t border-simar-borde-suave text-base text-simar-texto-2 movil:mt-2 movil:pt-2 movil:text-[12.5px] movil:leading-snug">
                                        Basado en{' '}
                                        <strong className="text-simar-texto">
                                            <NumeroAnimado valor={eq.inputValue} decimales={eq.inputDecimals} duracion={1200} /> {eq.inputUnit}
                                        </strong>{' '}
                                        {eq.inputCaption}
                                    </div>
                                </article>
                            );
                        })}
                        <p className="reveal self-center px-2 text-base md:text-lg leading-relaxed text-simar-texto-2 movil:px-1 movil:text-[13px]" data-delay="200">
                            Estimaciones con los registros reales del sistema y factores aproximados: 1 L de aceite
                            contamina unos 1,000 L de agua y cada manifiesto ahorra unos {MINUTOS_POR_MANIFIESTO} min de
                            papeleo. Cada registro que se captura hace crecer estos números.
                        </p>
                    </div>
                </div>
            </section>

            {/* Impacto / Stats */}
            <section id="impacto" ref={statsRef} className="relative py-20 md:py-24 px-6 bg-simar-superficie overflow-clip movil:py-14 movil:px-5">
                <div className="max-w-[1248px] mx-auto">
                    <div>
                        <p className="reveal text-lg font-bold text-simar-marea-tinta movil:text-[15px]">Impacto medible</p>
                        <h2 className="reveal reveal-palabras mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]" data-delay="80">
                            <TextoEnfoca texto="Nuestro avance hasta hoy" />
                        </h2>
                    </div>

                    {/* En celular cada cifra es un renglón: ícono a la izquierda, cifra, nombre y detalle */}
                    <div className="mt-10 grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-5 movil:mt-6 movil:gap-2.5">
                        {[
                            {
                                icon: FileCheck,
                                value: stats?.totalManifiestos ? (
                                    <>
                                        <NumeroAnimado valor={stats.totalManifiestos} duracion={1400} />
                                        {stats.totalManifiestos >= 1000 ? '+' : ''}
                                    </>
                                ) : (
                                    '—'
                                ),
                                label: 'Reportes digitalizados',
                                detail: stats?.totalManifiestos
                                    ? `${stats.totalManifiestos.toLocaleString('es-MX')} registros capturados en el sistema.`
                                    : 'Recuperados de hojas físicas deterioradas.',
                            },
                            // Un dato real en lugar de "100% · Cada residuo rastreable de inicio a fin"
                            {
                                icon: Droplets,
                                value: stats?.totalAceiteUsado ? (
                                    <>
                                        <NumeroAnimado valor={stats.totalAceiteUsado} duracion={1400} /> L
                                    </>
                                ) : (
                                    '—'
                                ),
                                label: 'Aceite usado recuperado',
                                detail: 'Litros que las embarcaciones entregaron en el puerto en lugar de tirarlos al mar.',
                            },
                            {
                                icon: Globe2,
                                value: `${ANIO_INICIO_HISTORICO} – ${new Date().getFullYear()}`,
                                label: 'Histórico recuperado',
                                detail: `${new Date().getFullYear() - ANIO_INICIO_HISTORICO} años de datos ambientales preservados.`,
                            },
                        ].map((stat, i) => {
                            const Icon = stat.icon;
                            return (
                                <div
                                    key={stat.label}
                                    className="reveal rounded-[26px] bg-simar-papel p-7 movil:p-4 movil:rounded-[20px] movil:grid movil:grid-cols-[auto_1fr] movil:gap-x-3.5 movil:items-center"
                                    data-delay={`${i * 120}`}
                                >
                                    <Icon className="w-8 h-8 text-simar-marea-tinta movil:row-span-3 movil:w-7 movil:h-7" />
                                    <div className="mt-4 text-4xl md:text-5xl font-extrabold leading-none movil:mt-0 movil:text-[26px]">{stat.value}</div>
                                    <div className="mt-2 text-xl font-extrabold movil:mt-1 movil:text-[16px]">{stat.label}</div>
                                    <div className="mt-1 text-[17px] text-simar-texto-2 movil:mt-0 movil:text-[14px]">{stat.detail}</div>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Mapa de puertos — franja oscura (el mapa interactivo está pensado para fondo oscuro) */}
            <section id="mapa" ref={mapRef} className="relative pt-24 md:pt-36 pb-20 md:pb-28 px-6 bg-simar-abismo text-white overflow-clip movil:pt-16 movil:pb-14 movil:px-5">
                <OlaSeparador color="var(--simar-superficie)" lado="arriba" />
                <div className="relative max-w-[1248px] mx-auto">
                    <div className="max-w-3xl mb-10 md:mb-12 movil:mb-6">
                        <p className="reveal text-lg font-bold text-simar-espuma movil:text-[15px]">Mapa de puertos</p>
                        <h2 className="reveal reveal-palabras mt-3 text-4xl md:text-[52px] font-extrabold leading-[1.08] movil:mt-2 movil:text-[30px]" data-delay="80">
                            <TextoEnfoca texto="Dónde estamos, a dónde vamos." />
                        </h2>
                        <p className="reveal mt-4 text-lg md:text-[21px] leading-relaxed text-[#C7D3DD] movil:mt-3 movil:text-[16px]" data-delay="350">
                            El modelo está listo para escalar. Cada puerto pesquero de México puede sumarse
                            a una red nacional de trazabilidad ambiental.
                        </p>
                    </div>

                    <div className="reveal" data-efecto="foto" data-delay="100">
                        <SeccionMapaPuertos variante={varianteMapa} mostrarSelector={compararMapas} />
                    </div>
                </div>
            </section>

            {/* Llamado final */}
            <section ref={ctaRef} className="relative pt-20 md:pt-24 pb-28 md:pb-36 px-6 bg-simar-abismo text-white border-t border-white/10 overflow-clip movil:pt-14 movil:pb-20 movil:px-5">
                <OlaSeparador color="var(--simar-superficie)" lado="abajo" />
                <div className="relative max-w-4xl mx-auto text-center">
                    <h2 className="reveal reveal-palabras text-4xl md:text-[50px] font-extrabold leading-tight movil:text-[30px]">
                        <TextoEnfoca texto="Cada dato cuenta." /> <br />
                        <span className="text-simar-espuma">
                            <TextoEnfoca texto="Cada mar lo agradece." desde={4} />
                        </span>
                    </h2>
                    <p className="reveal mt-4 text-lg md:text-[21px] text-[#C7D3DD] leading-relaxed max-w-2xl mx-auto movil:mt-3 movil:text-[16px]" data-delay="500">
                        Accede a la plataforma y sé parte del cambio en la gestión de residuos marinos.
                    </p>
                    {/* El enfoque va en un envoltorio: simar-presiona redefine las transiciones del botón */}
                    <div className="reveal" data-delay="650">
                        <button
                            onClick={openLoginModal}
                            className="simar-presiona group mt-7 min-h-[64px] px-8 rounded-[20px] bg-simar-espuma hover:bg-[#A5ECE4] text-[#0B2236] text-lg md:text-xl font-extrabold inline-flex items-center gap-2.5 cursor-pointer movil:mt-6 movil:min-h-[54px] movil:rounded-[17px] movil:text-[17px]"
                        >
                            {MODO_DEMO ? 'Probar la demostración' : 'Iniciar sesión'}
                            <ArrowRight className="w-[22px] h-[22px] transition-transform duration-200 group-hover:translate-x-1" strokeWidth={2.4} />
                        </button>
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-simar-superficie py-12 md:py-14 px-6 movil:py-10 movil:px-5">
                <div className="max-w-[1248px] mx-auto flex flex-col md:flex-row md:items-center gap-8 md:gap-14 movil:gap-6">
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
                        <p className="text-[17px] text-simar-texto-2">© {new Date().getFullYear()} SiMAR · DCK / ITSPP. Todos los derechos reservados.</p>
                        {/* Acceso interno al panel de superadmin: discreto a propósito (texto chico y gris, sin
                            ícono; el área que se toca sigue siendo de 44 px). También se llega entrando a
                            /es/superadmin sin sesión */}
                        <button
                            type="button"
                            onClick={abrirAccesoDesarrollador}
                            className="mt-1 min-h-[44px] inline-flex items-center text-[14px] text-simar-texto-3 hover:text-simar-texto-2 hover:underline underline-offset-2 transition-colors cursor-pointer"
                        >
                            Acceso desarrollador
                        </button>
                    </div>
                </div>
            </footer>

            {/* Login Modal: entra y sale (usePresencia); cada paso entra con simar-ventana */}
            {ventanaAcceso.montado && (
                <div
                    ref={accesoRef}
                    tabIndex={-1}
                    className="fixed inset-0 z-[100] flex items-center justify-center p-4 overflow-y-auto outline-none"
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
                        <div className={`${ventanaAcceso.saliendo ? 'simar-ventana-sale' : 'simar-ventana'} simar-vidrio-fuerte relative w-full max-w-[640px] rounded-[34px] p-7 md:p-9 movil:p-5 movil:pt-6`}>
                            <button
                                onClick={cerrarLoginModal}
                                className="absolute top-4 right-4 w-12 h-12 rounded-2xl bg-simar-texto/5 hover:bg-simar-texto/10 text-simar-texto flex items-center justify-center transition-colors z-10"
                                aria-label="Cerrar"
                            >
                                <X className="w-[22px] h-[22px]" />
                            </button>
                            <div className="text-center">
                                <LogoSimar variante="simbolo" tamano={64} />
                                <h2 className="mt-2 text-[28px] md:text-[32px] font-extrabold text-simar-texto movil:mt-1 movil:text-[22px]">¿Cómo deseas ingresar?</h2>
                                <p className="mt-1.5 text-lg text-simar-texto-2 movil:mt-0.5 movil:text-[15px]">Selecciona tu tipo de usuario</p>
                            </div>
                            <div className="mt-7 grid grid-cols-1 sm:grid-cols-2 gap-4 movil:mt-5 movil:gap-2.5">
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
                        <div className={`${ventanaAcceso.saliendo ? 'simar-ventana-sale' : 'simar-ventana'} simar-vidrio-fuerte relative w-full max-w-[520px] rounded-[34px] p-7 md:p-9 movil:p-5 movil:pt-6`}>
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

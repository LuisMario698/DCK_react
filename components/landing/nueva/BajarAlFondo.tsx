'use client';

import { useId, useState, type CSSProperties } from 'react';
import { Droplets, Fish, Waves, type LucideIcon } from 'lucide-react';
import { useMotionValueEvent, type MotionValue } from 'motion/react';
import * as m from 'motion/react-m';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { Encabezado } from './comunes';
import { TextoQueSeEnciende, useEscena, useRango, useTramo } from './escena';

// Paleta del dibujo (sólo vive aquí: es una ilustración sobre la franja de mar, no interfaz)
const P = {
    cielo1: '#16324D',
    cielo2: '#2D5D7E',
    sol: '#F2A37C',
    agua0: '#1A7C93',
    agua1: '#0E5A72',
    agua2: '#0C3D5C',
    agua3: '#081B2E',
    espuma: '#7FE0D6',
    aceite: '#F2C14E',
    violeta: '#C9A3F5',
    arena: '#2A4A5E',
    arenaBorde: '#3C6478',
    alga: '#1E9B77',
    alga2: '#127A5D',
    coral: '#F2A37C',
    vaquita: '#A9BCCB',
    vaquitaPanza: '#C9D6E0',
    tinta: '#1C2B38',
    filtro: '#C9CED6',
    filtroRaya: '#8F99A5',
    tortuga: '#2F7F6F',
    tortugaPiel: '#4FA38E',
};

const PEZ = 'M0 0 C8 -7 24 -7 32 0 C24 7 8 7 0 0 Z M30 0 L41 -7 L39 0 L41 7 Z';

/** Lo que se mueve dentro del dibujo mientras se baja (sólo en la escena, no en las tarjetas) */
interface MovimientoMar {
    pelicula: MotionValue<string>;
    rayos: MotionValue<number>;
    filtro: MotionValue<string>;
    tortuga: MotionValue<string>;
    vaquita: MotionValue<string>;
}

// Una figura del dibujo que se mueve con su propia caja (para escalar desde su borde)
const CAJA: CSSProperties = { transformBox: 'fill-box' };

/**
 * El corte del mar, de la superficie al fondo, en un dibujo de 400 × 1200 (tres franjas de 400).
 * `franja` recorta una sola (las tarjetas de "reducir movimiento"); sin ella se ve completo (la
 * escena, que lo recorre con el scroll). `mov`: la película que se extiende y tapa la luz, el filtro
 * que se hunde, la tortuga que va hacia la bolsa y la vaquita que nada.
 */
function EscenaMar({ franja, className = '', style, mov }: { franja?: 0 | 1 | 2; className?: string; style?: CSSProperties; mov?: MovimientoMar }) {
    const id = useId();
    const vista = franja === undefined ? '0 0 400 1200' : `0 ${franja * 400} 400 400`;
    // En las tarjetas apaisadas se recorta arriba y abajo: la superficie se ancla arriba (para que
    // se vea el cielo y la película); las otras, al centro (en el fondo así sale la vaquita)
    const ancla = franja === 0 ? 'xMidYMin' : 'xMidYMid';
    return (
        <svg viewBox={vista} preserveAspectRatio={`${ancla} slice`} className={className} style={style} aria-hidden="true">
            <defs>
                <linearGradient id={`${id}-cielo`} x1="0" y1="0" x2="0" y2="70" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={P.cielo1} />
                    <stop offset="1" stopColor={P.cielo2} />
                </linearGradient>
                <linearGradient id={`${id}-agua`} x1="0" y1="66" x2="0" y2="1200" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={P.agua0} />
                    <stop offset="0.3" stopColor={P.agua1} />
                    <stop offset="0.62" stopColor={P.agua2} />
                    <stop offset="1" stopColor={P.agua3} />
                </linearGradient>
                <linearGradient id={`${id}-rayo`} x1="0" y1="70" x2="0" y2="400" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#FFFFFF" stopOpacity="0.2" />
                    <stop offset="1" stopColor="#FFFFFF" stopOpacity="0" />
                </linearGradient>
                <linearGradient id={`${id}-pelicula`} x1="175" y1="0" x2="392" y2="0" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor={P.aceite} />
                    <stop offset="0.35" stopColor={P.violeta} />
                    <stop offset="0.65" stopColor={P.espuma} />
                    <stop offset="1" stopColor={P.aceite} />
                </linearGradient>
                <radialGradient id={`${id}-sombra`} cx="0.5" cy="0" r="1">
                    <stop offset="0" stopColor="#000000" stopOpacity="0.42" />
                    <stop offset="1" stopColor="#000000" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${id}-sol`}>
                    <stop offset="0" stopColor={P.sol} stopOpacity="0.75" />
                    <stop offset="1" stopColor={P.sol} stopOpacity="0" />
                </radialGradient>
            </defs>

            {/* ── Superficie (0–400) ── */}
            <rect width="400" height="72" fill={`url(#${id}-cielo)`} />
            <circle cx="320" cy="62" r="70" fill={`url(#${id}-sol)`} />
            <rect y="66" width="400" height="1134" fill={`url(#${id}-agua)`} />
            <path d="M0 70 C25 64 50 64 75 70 C100 76 125 76 150 70 C175 64 200 64 225 70 C250 76 275 76 300 70 C325 64 350 64 375 70 C388 73 396 74 400 72" fill="none" stroke={P.espuma} strokeOpacity="0.55" strokeWidth="2" />
            {/* La luz entra donde no hay aceite (y se apaga mientras la película se extiende) */}
            <m.path style={{ opacity: mov?.rayos }} d="M18 72 L48 72 L92 400 L30 400 Z M70 72 L96 72 L150 400 L100 400 Z M118 72 L150 72 L196 330 L150 330 Z" fill={`url(#${id}-rayo)`} />
            {/* Bajo la película: sombra y oxígeno que no pasa */}
            <ellipse cx="300" cy="76" rx="150" ry="230" fill={`url(#${id}-sombra)`} />
            <m.path
                style={mov && { ...CAJA, transformOrigin: '100% 50%', transform: mov.pelicula }}
                d="M174 70 C210 63 250 76 290 69 C330 62 364 75 392 69 L392 79 C360 86 322 77 286 83 C246 89 206 81 174 80 Z"
                fill={`url(#${id}-pelicula)`}
                fillOpacity="0.92"
            />
            <g fill="none" stroke={P.espuma} strokeOpacity="0.6" strokeWidth="1.5">
                {[
                    [40, 330, 4.5],
                    [58, 262, 3],
                    [34, 196, 5],
                    [62, 140, 3.5],
                    [46, 98, 2.5],
                    [120, 280, 3],
                    [132, 170, 4],
                ].map(([cx, cy, r]) => (
                    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} />
                ))}
            </g>
            <g fill="none" stroke={P.espuma} strokeOpacity="0.45" strokeWidth="1.5">
                {[200, 224, 250, 276, 304, 332, 360].map((cx, i) => (
                    <circle key={cx} cx={cx} cy={i % 2 ? 90 : 95} r={i % 3 ? 3 : 4} />
                ))}
            </g>

            {/* ── Media agua (400–800) ── */}
            <g fill={P.espuma} fillOpacity="0.5">
                {[
                    [62, 470, 1],
                    [98, 452, 0.85],
                    [88, 502, 1.1],
                    [134, 478, 0.9],
                    [124, 524, 0.8],
                    [166, 500, 1],
                ].map(([x, y, e]) => (
                    <path key={`${x}-${y}`} d={PEZ} transform={`translate(${x} ${y}) scale(${e})`} />
                ))}
            </g>
            {/* Filtro de motor que se hunde soltando aceite */}
            <m.g style={mov && { transform: mov.filtro }}>
            <ellipse cx="262" cy="575" rx="58" ry="40" fill={P.aceite} fillOpacity="0.1" />
            <g transform="translate(262 590) rotate(-18)">
                <rect x="-22" y="-36" width="44" height="72" rx="10" fill={P.filtro} />
                <rect x="-22" y="-36" width="44" height="12" rx="6" fill="#E3E7EC" />
                {[-14, -2, 10, 22].map((y) => (
                    <line key={y} x1="-20" y1={y} x2="20" y2={y} stroke={P.filtroRaya} strokeWidth="2" />
                ))}
            </g>
            <g fill={P.aceite}>
                <circle cx="268" cy="536" r="4" />
                <circle cx="257" cy="516" r="3" />
                <circle cx="272" cy="496" r="2.5" />
            </g>
            </m.g>
            {/* Bolsa de plástico entre dos aguas */}
            <g transform="translate(86 660)">
                <path d="M0 18 C6 -8 44 -10 52 16 C58 42 46 70 26 74 C6 70 -6 44 0 18 Z" fill="#FFFFFF" fillOpacity="0.14" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
                <path d="M12 6 C10 -10 22 -14 24 0 M30 0 C32 -14 44 -10 40 6" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
            </g>
            {/* Tortuga que confunde la bolsa con comida */}
            <m.g style={mov && { transform: mov.tortuga }}>
            <g transform="translate(250 722)">
                <ellipse cx="-30" cy="-22" rx="12" ry="5" transform="rotate(-35 -30 -22)" fill={P.tortugaPiel} />
                <ellipse cx="-30" cy="22" rx="12" ry="5" transform="rotate(35 -30 22)" fill={P.tortugaPiel} />
                <ellipse cx="22" cy="-18" rx="9" ry="4" transform="rotate(30 22 -18)" fill={P.tortugaPiel} />
                <ellipse cx="22" cy="18" rx="9" ry="4" transform="rotate(-30 22 18)" fill={P.tortugaPiel} />
                <circle cx="-44" cy="0" r="9" fill={P.tortugaPiel} />
                <ellipse cx="0" cy="0" rx="34" ry="22" fill={P.tortuga} />
                <path d="M-18 -12 L0 -6 L18 -12 M-18 12 L0 6 L18 12 M0 -6 L0 6" fill="none" stroke={P.tortugaPiel} strokeWidth="2" />
            </g>
            </m.g>

            {/* ── Fondo (800–1200) ── */}
            <g fill="#FFFFFF" fillOpacity="0.14">
                {[
                    [40, 830],
                    [150, 860],
                    [300, 840],
                    [360, 900],
                    [80, 960],
                    [330, 990],
                    [210, 1020],
                ].map(([cx, cy]) => (
                    <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="1.8" />
                ))}
            </g>
            {/* La vaquita marina: sólo vive en el Alto Golfo */}
            <m.g style={mov && { transform: mov.vaquita }}>
            <g transform="translate(96 918) scale(1.55)">
                <path d="M62 5 C66 -4 71 -10 78 -13 C77 -5 78 1 83 7 Z" fill={P.vaquita} />
                <path d="M0 24 C1 11 14 3 32 2 C58 0 88 5 112 13 C124 17 133 19 140 17 L153 7 C151 14 150 19 152 24 C150 29 151 34 153 41 L140 31 C130 30 120 32 108 35 C80 44 44 47 22 42 C7 38 -1 32 0 24 Z" fill={P.vaquita} />
                <path d="M8 33 C30 42 70 42 106 33 C80 40 44 42 22 39 Z" fill={P.vaquitaPanza} />
                <path d="M36 36 C40 45 46 50 54 51 C50 45 48 40 48 36 Z" fill="#8FA5B6" />
                <ellipse cx="15" cy="17" rx="5.5" ry="4.5" fill={P.tinta} />
                <path d="M1 27 C5 30 10 30 15 28" fill="none" stroke={P.tinta} strokeWidth="3" strokeLinecap="round" />
            </g>
            </m.g>
            {/* Lecho: arena, rocas, algas, un abanico de coral y un filtro que sí llegó al fondo */}
            <path d="M0 1092 C80 1072 150 1102 230 1086 C300 1073 350 1092 400 1080 L400 1200 L0 1200 Z" fill={P.arena} />
            <path d="M0 1092 C80 1072 150 1102 230 1086 C300 1073 350 1092 400 1080" fill="none" stroke={P.arenaBorde} strokeWidth="3" />
            <ellipse cx="120" cy="1100" rx="26" ry="12" fill="#1F3A4C" />
            <ellipse cx="300" cy="1090" rx="18" ry="9" fill="#1F3A4C" />
            <g fill="none" strokeLinecap="round" strokeWidth="5">
                <path d="M52 1096 C42 1062 64 1036 52 1004" stroke={P.alga} />
                <path d="M68 1094 C78 1066 60 1046 72 1022" stroke={P.alga2} />
                <path d="M196 1090 C186 1060 206 1040 196 1012" stroke={P.alga} />
            </g>
            <g fill="none" stroke={P.coral} strokeOpacity="0.8" strokeWidth="3" strokeLinecap="round">
                <path d="M350 1084 L350 1050 M350 1062 L332 1040 M350 1058 L368 1036 M332 1040 L326 1024 M332 1040 L340 1024 M368 1036 L362 1020 M368 1036 L378 1022" />
            </g>
            <g transform="translate(246 1086) rotate(70)" opacity="0.75">
                <rect x="-12" y="-20" width="24" height="40" rx="6" fill={P.filtro} />
                <line x1="-11" y1="-6" x2="11" y2="-6" stroke={P.filtroRaya} strokeWidth="2" />
                <line x1="-11" y1="6" x2="11" y2="6" stroke={P.filtroRaya} strokeWidth="2" />
            </g>
        </svg>
    );
}

const PARADAS: {
    profundidad: string;
    icono: LucideIcon;
    titulo: string;
    texto: string;
    dato: string;
}[] = [
    {
        profundidad: 'Superficie',
        icono: Droplets,
        titulo: 'Una película que no deja respirar al mar.',
        texto:
            'El aceite usado flota y forma una capa delgada que tapa la luz y no deja que el oxígeno del aire pase al agua. Debajo, las algas y los peces se quedan sin lo que necesitan.',
        dato: 'Un litro de aceite puede contaminar hasta un millón de litros de agua.',
    },
    {
        profundidad: 'Media agua',
        icono: Fish,
        titulo: 'Lo que se hunde no desaparece.',
        texto:
            'Los filtros de motor siguen soltando el aceite que traen por dentro mientras bajan. Los plásticos se quedan flotando entre dos aguas, y peces y tortugas los confunden con comida.',
        dato: 'Por eso SiMAR también cuenta los filtros y la basura que entrega cada barco.',
    },
    {
        profundidad: 'Fondo del Golfo',
        icono: Waves,
        titulo: 'El hogar de la vaquita marina.',
        texto:
            'El Alto Golfo de California es el único lugar del mundo donde vive la vaquita marina, y el Mar de Cortés tiene más de 2,000 especies. Todo lo que no se recoge en el muelle termina aquí.',
        dato: 'Cada residuo que se registra en el muelle es uno menos en el fondo.',
    },
];


/** El texto de una parada (en la escena y en las tarjetas) */
function TextoParada({ parada, tamano }: { parada: (typeof PARADAS)[number]; tamano: 'escena' | 'tarjeta' }) {
    const Icono = parada.icono;
    const escena = tamano === 'escena';
    return (
        <>
            <p className={`inline-flex items-center gap-2.5 font-bold text-simar-espuma ${escena ? 'text-lg movil:text-[15px]' : 'text-[17px] movil:text-[15px]'}`}>
                <Icono className="w-6 h-6 movil:w-5 movil:h-5" />
                {parada.profundidad}
            </p>
            <h3
                className={`font-extrabold ${
                    escena
                        ? 'mt-3 text-[clamp(36px,3.4vw,52px)] leading-[1.06] tracking-[-0.025em] movil:mt-2 movil:text-[24px] movil:leading-[1.12] movil:tracking-[-0.01em]'
                        : 'mt-2 text-[28px] leading-tight movil:text-[22px]'
                }`}
            >
                {parada.titulo}
            </h3>
            <p className={`leading-relaxed text-simar-franja-texto-2 ${escena ? 'mt-4 text-xl movil:mt-2.5 movil:text-[16px]' : 'mt-3 text-lg movil:text-[16px]'}`}>
                {parada.texto}
            </p>
            <p className={`border-l-4 border-simar-aceite font-bold leading-snug ${escena ? 'mt-6 pl-4 text-[19px] movil:mt-3.5 movil:pl-3 movil:text-[16px]' : 'mt-4 pl-3.5 text-lg movil:text-[16px]'}`}>
                {parada.dato}
            </p>
        </>
    );
}

// Tramos de la escena (0 a 1): la cámara se detiene en cada parada mientras se lee su texto
const CAMARA = { entradas: [0.21, 0.38, 0.58, 0.76], salidas: ['translateY(0%)', 'translateY(-33.3333%)', 'translateY(-33.3333%)', 'translateY(-66.6667%)'] };
const TEXTOS: [number, number, number, number][] = [
    [0, 0, 0.16, 0.21],
    [0.38, 0.43, 0.53, 0.58],
    [0.76, 0.81, 1, 1],
];
// Sale despacio, avanza y frena: como una cámara que baja y se detiene
const suave = (t: number) => (t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2);

/**
 * La inmersión: una escena fija de pantalla completa. El fondo se oscurece mientras se baja, el
 * dibujo del mar (a la derecha en computadora, arriba en celular) lo recorre una "cámara" que se
 * detiene en cada parada, y el texto de cada parada aparece mientras la cámara está quieta.
 */
function Inmersion() {
    const [ref, p] = useEscena<HTMLDivElement>();
    const camara = useRango(p, CAMARA.entradas, CAMARA.salidas, { ease: suave });
    const media = useRango(p, [0.21, 0.38], [0, 1]);
    const fondo = useRango(p, [0.58, 0.76], [0, 1]);
    const textos = [useTramo(p, TEXTOS[0]), useTramo(p, TEXTOS[1]), useTramo(p, TEXTOS[2])];
    const profundimetro = useRango(p, [0, 1], ['scaleY(0)', 'scaleY(1)']);
    const mov: MovimientoMar = {
        pelicula: useRango(p, [0, 0.18], ['scaleX(0.4)', 'scaleX(1)']),
        rayos: useRango(p, [0, 0.18], [1, 0.25]),
        filtro: useRango(p, [0.28, 0.62], ['translateY(-60px)', 'translateY(36px)']),
        tortuga: useRango(p, [0.28, 0.62], ['translateX(80px)', 'translateX(0px)']),
        vaquita: useRango(p, [0.66, 1], ['translateX(-46px)', 'translateX(30px)']),
    };
    const [activa, setActiva] = useState(0);
    useMotionValueEvent(p, 'change', (v) => setActiva(v < 0.3 ? 0 : v < 0.68 ? 1 : 2));

    return (
        <div ref={ref} className="relative h-[420svh]">
            <div className="sticky top-0 h-[100svh] overflow-hidden isolate">
                {/* El agua: de la superficie al abismo */}
                <div aria-hidden="true" className="absolute inset-0 bg-[linear-gradient(180deg,#0E4E66_0%,#0C3D5C_100%)]" />
                <m.div aria-hidden="true" style={{ opacity: media }} className="absolute inset-0 bg-[linear-gradient(180deg,#0C3D5C_0%,#0A2C46_100%)]" />
                <m.div aria-hidden="true" style={{ opacity: fondo }} className="absolute inset-0 bg-[linear-gradient(180deg,#0A2C46_0%,var(--simar-abismo)_100%)]" />

                {/* El dibujo, recorrido por la cámara. Se funde con el agua por el lado del texto */}
                <div
                    aria-hidden="true"
                    className="absolute inset-y-0 right-0 w-[58%] [mask-image:linear-gradient(90deg,transparent_0%,#000_24%)] max-lg:inset-x-0 max-lg:w-auto max-lg:bottom-auto max-lg:h-[50svh] max-lg:[mask-image:linear-gradient(180deg,#000_72%,transparent_100%)]"
                >
                    <m.div style={{ transform: camara }} className="absolute inset-x-0 top-0 h-[300%]">
                        <EscenaMar className="w-full h-full" mov={mov} />
                    </m.div>
                </div>

                {/* Profundímetro: se llena al bajar */}
                <div aria-hidden="true" className="absolute right-8 top-[22svh] bottom-[22svh] w-1.5 rounded-full bg-white/20 max-lg:right-4 max-lg:top-[96px] max-lg:bottom-auto max-lg:h-[calc(50svh-140px)]">
                    <m.span style={{ transform: profundimetro }} className="absolute inset-0 rounded-full bg-simar-espuma origin-top" />
                    {PARADAS.map((parada, i) => (
                        <span key={parada.profundidad} className="absolute right-[-5px] -mt-2 flex items-center gap-3" style={{ top: `${i * 50}%` }}>
                            <span
                                className={`hidden xl:block whitespace-nowrap text-[15px] font-bold transition-colors duration-300 ${
                                    i === activa ? 'text-white' : 'text-white/50'
                                }`}
                            >
                                {parada.profundidad}
                            </span>
                            <span
                                className={`w-4 h-4 rounded-full border-[3px] border-simar-abismo transition-colors duration-300 ${
                                    i <= activa ? 'bg-simar-espuma' : 'bg-white/40'
                                }`}
                            />
                        </span>
                    ))}
                </div>

                {/* El texto de cada parada, en el mismo lugar */}
                <div className="relative h-full max-w-[1248px] mx-auto px-6 movil:px-5">
                    {PARADAS.map((parada, i) => (
                        <m.div
                            key={parada.profundidad}
                            style={textos[i]}
                            className="absolute left-6 w-[44%] top-1/2 -translate-y-1/2 max-lg:left-6 max-lg:right-6 max-lg:w-auto max-lg:top-[calc(50svh+8px)] max-lg:translate-y-0 movil:left-5 movil:right-5"
                        >
                            <TextoParada parada={parada} tamano="escena" />
                        </m.div>
                    ))}
                </div>
            </div>
        </div>
    );
}

/** Con "reducir movimiento": una tarjeta por profundidad, sin escena */
function Tarjetas() {
    return (
        <ol className="max-w-[1248px] mx-auto px-6 pb-24 grid lg:grid-cols-3 gap-6 movil:px-5 movil:pb-16 movil:gap-5">
            {PARADAS.map((parada, i) => (
                <li key={parada.profundidad} className="rounded-[28px] overflow-hidden border border-white/15 bg-white/[0.06] movil:rounded-[24px]">
                    <EscenaMar franja={i as 0 | 1 | 2} className="block w-full aspect-[16/10]" />
                    <div className="p-6 movil:p-5">
                        <TextoParada parada={parada} tamano="tarjeta" />
                    </div>
                </li>
            ))}
        </ol>
    );
}

/**
 * 2 · El problema: bajar al fondo del mar, en tres paradas (superficie, media agua y fondo). Lo de
 * adentro de la escena es texto normal: el lector de pantalla lo oye en orden.
 */
export function BajarAlFondo() {
    const reducir = usePrefiereMenosMovimiento();
    return (
        <section id="problema" className="relative text-white bg-[#0E4E66]">
            <div className="bg-[linear-gradient(180deg,#0B3A52_0%,#0E4E66_100%)] px-6 pt-24 md:pt-36 pb-10 md:pb-16 movil:px-5 movil:pt-16 movil:pb-8">
                <div className="max-w-[1248px] mx-auto">
                    <Encabezado
                        oscuro
                        antetitulo="El problema"
                        titulo={<TextoQueSeEnciende texto="Lo que no se ve desde el muelle." />}
                        texto="Baja con nosotros: esto le pasa al mar cuando un residuo no llega al centro de acopio."
                    />
                </div>
            </div>
            {reducir ? <Tarjetas /> : <Inmersion />}
        </section>
    );
}

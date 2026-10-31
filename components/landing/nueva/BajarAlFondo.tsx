'use client';

import { useId, type CSSProperties } from 'react';
import { Droplets, Fish, Waves, type LucideIcon } from 'lucide-react';
import { Encabezado, useProgresoScroll } from './comunes';

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

/**
 * El corte del mar, de la superficie al fondo, en un dibujo de 400 × 1200 (tres franjas de 400).
 * `franja` recorta una sola (las tarjetas del celular); sin ella se ve completo (la ventana de la
 * computadora, que lo recorre con el scroll).
 */
function EscenaMar({ franja, className = '', style }: { franja?: 0 | 1 | 2; className?: string; style?: CSSProperties }) {
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
                <linearGradient id={`${id}-sombra`} x1="0" y1="78" x2="0" y2="320" gradientUnits="userSpaceOnUse">
                    <stop offset="0" stopColor="#000000" stopOpacity="0.38" />
                    <stop offset="1" stopColor="#000000" stopOpacity="0" />
                </linearGradient>
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
            {/* La luz entra donde no hay aceite */}
            <path d="M18 72 L48 72 L92 400 L30 400 Z M70 72 L96 72 L150 400 L100 400 Z M118 72 L150 72 L196 330 L150 330 Z" fill={`url(#${id}-rayo)`} />
            {/* Bajo la película: sombra y oxígeno que no pasa */}
            <rect x="172" y="76" width="228" height="250" fill={`url(#${id}-sombra)`} />
            <path d="M174 70 C210 63 250 76 290 69 C330 62 364 75 392 69 L392 79 C360 86 322 77 286 83 C246 89 206 81 174 80 Z" fill={`url(#${id}-pelicula)`} fillOpacity="0.92" />
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
            {/* Bolsa de plástico entre dos aguas */}
            <g transform="translate(86 660)">
                <path d="M0 18 C6 -8 44 -10 52 16 C58 42 46 70 26 74 C6 70 -6 44 0 18 Z" fill="#FFFFFF" fillOpacity="0.14" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
                <path d="M12 6 C10 -10 22 -14 24 0 M30 0 C32 -14 44 -10 40 6" fill="none" stroke="#FFFFFF" strokeOpacity="0.4" strokeWidth="1.5" />
            </g>
            {/* Tortuga que confunde la bolsa con comida */}
            <g transform="translate(250 722)">
                <ellipse cx="-30" cy="-22" rx="12" ry="5" transform="rotate(-35 -30 -22)" fill={P.tortugaPiel} />
                <ellipse cx="-30" cy="22" rx="12" ry="5" transform="rotate(35 -30 22)" fill={P.tortugaPiel} />
                <ellipse cx="22" cy="-18" rx="9" ry="4" transform="rotate(30 22 -18)" fill={P.tortugaPiel} />
                <ellipse cx="22" cy="18" rx="9" ry="4" transform="rotate(-30 22 18)" fill={P.tortugaPiel} />
                <circle cx="-44" cy="0" r="9" fill={P.tortugaPiel} />
                <ellipse cx="0" cy="0" rx="34" ry="22" fill={P.tortuga} />
                <path d="M-18 -12 L0 -6 L18 -12 M-18 12 L0 6 L18 12 M0 -6 L0 6" fill="none" stroke={P.tortugaPiel} strokeWidth="2" />
            </g>

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
            <g transform="translate(96 918) scale(1.55)">
                <path d="M62 5 C66 -4 71 -10 78 -13 C77 -5 78 1 83 7 Z" fill={P.vaquita} />
                <path d="M0 24 C1 11 14 3 32 2 C58 0 88 5 112 13 C124 17 133 19 140 17 L153 7 C151 14 150 19 152 24 C150 29 151 34 153 41 L140 31 C130 30 120 32 108 35 C80 44 44 47 22 42 C7 38 -1 32 0 24 Z" fill={P.vaquita} />
                <path d="M8 33 C30 42 70 42 106 33 C80 40 44 42 22 39 Z" fill={P.vaquitaPanza} />
                <path d="M36 36 C40 45 46 50 54 51 C50 45 48 40 48 36 Z" fill="#8FA5B6" />
                <ellipse cx="15" cy="17" rx="5.5" ry="4.5" fill={P.tinta} />
                <path d="M1 27 C5 30 10 30 15 28" fill="none" stroke={P.tinta} strokeWidth="3" strokeLinecap="round" />
            </g>
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

/**
 * 2 · El problema: bajar al fondo del mar. Al bajar, el fondo pasa de la superficie al abismo en
 * tres paradas. En computadora el dibujo se queda fijo a la derecha y lo recorre la "cámara"; en
 * celular, una tarjeta por profundidad.
 */
export function BajarAlFondo() {
    const [paradasRef, activa] = useProgresoScroll<HTMLDivElement>(PARADAS.length, 'centro');

    return (
        <section id="problema" className="ln-profundidad relative text-white px-6 pt-20 md:pt-28 pb-24 md:pb-36 movil:px-5 movil:pt-14 movil:pb-20">
            <div className="max-w-[1248px] mx-auto">
                <Encabezado
                    oscuro
                    antetitulo="El problema"
                    titulo="Lo que no se ve desde el muelle."
                    texto="Baja con nosotros: esto le pasa al mar cuando un residuo no llega al centro de acopio."
                />

                {/* Computadora: texto a la izquierda, dibujo fijo a la derecha */}
                {/* --ln-progreso (useProgresoScroll) llega a las dos columnas. La cámara va de la primera
                    parada (su centro está a 1/6 del recorrido) a la última (a 5/6) */}
                <div
                    ref={paradasRef}
                    className="hidden lg:grid grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-16 mt-8"
                    style={{ '--ln-progreso': 0, '--ln-camara': 'clamp(0, (var(--ln-progreso) - 0.1667) * 1.5, 1)' } as CSSProperties}
                >
                    <div>
                        {PARADAS.map((p, i) => {
                            const Icono = p.icono;
                            return (
                                <div key={p.profundidad} className="min-h-[78vh] flex flex-col justify-center py-10">
                                    <div className={`transition-opacity duration-500 ${activa === i ? 'opacity-100' : 'opacity-55'}`}>
                                        <p className="inline-flex items-center gap-2.5 text-lg font-bold text-simar-espuma">
                                            <Icono className="w-6 h-6" />
                                            {p.profundidad}
                                        </p>
                                        <h3 className="mt-3 text-[38px] font-extrabold leading-[1.12]">{p.titulo}</h3>
                                        <p className="mt-4 text-xl leading-relaxed text-simar-franja-texto-2">{p.texto}</p>
                                        <p className="mt-6 pl-4 border-l-4 border-simar-aceite text-[19px] font-bold leading-snug">{p.dato}</p>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                    <div className="relative">
                        <div className="sticky top-[14vh] h-[72vh] flex items-center justify-center">
                            <div className="relative h-full max-h-[620px] aspect-square max-w-full rounded-[36px] overflow-hidden border border-white/15 shadow-[0_40px_80px_-40px_rgba(0,0,0,0.8)]">
                                {/* La "cámara" baja con el scroll: el dibujo mide tres ventanas */}
                                <div
                                    className="absolute inset-x-0 top-0 h-[300%] will-change-transform"
                                    style={{ transform: 'translateY(calc(var(--ln-camara) * -66.6667%))' }}
                                >
                                    <EscenaMar className="w-full h-full" />
                                </div>
                                <p className="simar-vidrio-fuerte absolute left-4 top-4 rounded-full px-4 py-2 text-[17px] font-bold text-simar-texto">
                                    {PARADAS[activa].profundidad}
                                </p>
                                {/* Profundímetro */}
                                <div aria-hidden="true" className="absolute right-5 top-6 bottom-6 w-1.5 rounded-full bg-white/20">
                                    <span
                                        className="absolute -left-[7px] w-5 h-5 rounded-full bg-simar-espuma border-4 border-simar-abismo"
                                        style={{ top: 'calc(var(--ln-camara) * (100% - 20px))' }}
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Celular y tableta: una tarjeta por profundidad */}
                <ol className="lg:hidden mt-10 space-y-6 movil:mt-8 movil:space-y-5">
                    {PARADAS.map((p, i) => {
                        const Icono = p.icono;
                        return (
                            <li key={p.profundidad} className="ln-sube rounded-[28px] overflow-hidden border border-white/15 bg-white/[0.06] movil:rounded-[24px]">
                                <EscenaMar franja={i as 0 | 1 | 2} className="block w-full aspect-[16/10] sm:aspect-[2/1]" />
                                <div className="p-6 movil:p-5">
                                    <p className="inline-flex items-center gap-2 text-[17px] font-bold text-simar-espuma movil:text-[15px]">
                                        <Icono className="w-5 h-5" />
                                        {p.profundidad}
                                    </p>
                                    <h3 className="mt-2 text-[28px] font-extrabold leading-tight movil:text-[22px]">{p.titulo}</h3>
                                    <p className="mt-3 text-lg leading-relaxed text-simar-franja-texto-2 movil:text-[16px]">{p.texto}</p>
                                    <p className="mt-4 pl-3.5 border-l-4 border-simar-aceite text-lg font-bold leading-snug movil:text-[16px]">{p.dato}</p>
                                </div>
                            </li>
                        );
                    })}
                </ol>
            </div>
        </section>
    );
}

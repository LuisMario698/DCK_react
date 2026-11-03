import { useId, type ReactNode } from 'react';
import type { Ilustracion } from '@/lib/constants/noticias';
import { CAJA_GOLFO, PUERTO_PENASCO, TIERRA_GOLFO } from './golfo';

/**
 * Portadas dibujadas para las noticias sin foto: ilustraciones planas, de trazo limpio, con los
 * colores de SiMAR. No se inventan fotos. Son SVG (se dibujan en el servidor, no bajan JavaScript).
 *
 *  - `mapa`: el Golfo de California, con Puerto Peñasco.
 *  - `altogolfo`: el Alto Golfo de cerca, con Puerto Peñasco y San Felipe.
 *  - `carta`: el norte del golfo como carta náutica (papel claro y cuadrícula de grados).
 *  - `gota`: una gota de aceite que cae y deja su mancha en el agua.
 *  - `hojas`: hojas de manifiesto, como las del papel de antes.
 *  - `simbolo`: el símbolo de SiMAR.
 *  - `red`: una red a la deriva bajo el agua.
 *  - `globo`: el océano del planeta.
 *  - `costa`: una playa al atardecer, con basura en la arena.
 *  - `botella`: una botella de plástico flotando.
 *  - `horizonte`: mar abierto al amanecer, con una panga.
 *
 * Todas usan un viewBox de 400 × 250 (16:10) y `preserveAspectRatio="xMidYMid slice"`: se recortan
 * para llenar cualquier formato sin deformarse (lo importante va cerca del centro).
 */

const ABISMO = '#0B2236';
const MAR_1 = '#0E5A72';
const MAR_2 = '#0C3D5C';
const ESPUMA = '#7FE0D6';
const GOLFO = '#20B2C4';
const ACEITE = '#F2C14E';
const PAPEL = '#EFE9DC';
const ARENA = '#E2D2AE';
const TIERRA = '#1D4664';

// ── El mapa: se arma una sola vez, en grados (lon, −lat) ─────────────────────────────────────
const K_LAT = Math.cos(((CAJA_GOLFO.sur + CAJA_GOLFO.norte) / 2) * (Math.PI / 180));
/** De grados a unidades del mapa (1 unidad = 1° de latitud; la longitud se acorta) */
const aMapa = (lon: number, lat: number): [number, number] => [(lon - CAJA_GOLFO.oeste) * K_LAT, CAJA_GOLFO.norte - lat];

const MAPA = (() => {
    let tierra = '';
    let costa = '';
    const enOrilla = (lon: number, lat: number) =>
        Math.abs(lon - CAJA_GOLFO.oeste) < 0.02 || Math.abs(lon - CAJA_GOLFO.este) < 0.02 || Math.abs(lat - CAJA_GOLFO.sur) < 0.02 || Math.abs(lat - CAJA_GOLFO.norte) < 0.02;
    for (const anillo of TIERRA_GOLFO) {
        let previo: [number, number] | null = null;
        let enTrazo = false;
        for (let k = 0; k <= anillo.length; k += 2) {
            const i = k % anillo.length;
            const lon = anillo[i];
            const lat = anillo[i + 1];
            const [x, y] = aMapa(lon, lat);
            const p = `${x.toFixed(3)} ${y.toFixed(3)}`;
            if (k < anillo.length) tierra += `${k === 0 ? 'M' : 'L'}${p} `;
            // La costa no sigue las orillas de la caja (ahí la tierra está recortada, no es costa)
            const recortado = previo !== null && enOrilla(previo[0], previo[1]) && enOrilla(lon, lat);
            costa += `${previo === null || recortado || !enTrazo ? 'M' : 'L'}${p} `;
            enTrazo = !recortado;
            previo = [lon, lat];
        }
        tierra += 'Z ';
    }
    return { tierra, costa };
})();

const SAN_FELIPE = { lon: -114.84, lat: 31.02 };
const SANTA_CLARA = { lon: -114.94, lat: 31.69 };

/**
 * Un encuadre del mapa: `centro` (lon, lat) va al punto (cx, cy) del dibujo, a `escala` px por
 * grado. Devuelve el transform del grupo y cómo llevar un lugar a coordenadas del dibujo (para
 * poner marcas y nombres sin escalarlos).
 */
function encuadre(centro: { lon: number; lat: number }, cx: number, cy: number, escala: number) {
    const [mx, my] = aMapa(centro.lon, centro.lat);
    const tx = cx - mx * escala;
    const ty = cy - my * escala;
    return {
        transform: `translate(${tx.toFixed(2)} ${ty.toFixed(2)}) scale(${escala})`,
        en: (lugar: { lon: number; lat: number }): [number, number] => {
            const [x, y] = aMapa(lugar.lon, lugar.lat);
            return [tx + x * escala, ty + y * escala];
        },
    };
}

/** Un lugar en el mapa: punto con halo y su nombre */
function Lugar({ x, y, nombre, lado = 'derecha', color = '#fff', principal = false }: { x: number; y: number; nombre: string; lado?: 'derecha' | 'izquierda'; color?: string; principal?: boolean }) {
    const der = lado === 'derecha';
    return (
        <g>
            {principal && <circle cx={x} cy={y} r="9" fill={color} fillOpacity="0.18" />}
            <circle cx={x} cy={y} r={principal ? 4 : 3} fill={color} />
            <text
                x={der ? x + 9 : x - 9}
                y={y + 4}
                textAnchor={der ? 'start' : 'end'}
                fontSize={principal ? 12.5 : 11}
                fontWeight={principal ? 800 : 700}
                fill={color}
                style={{ letterSpacing: '0.01em' }}
            >
                {nombre}
            </text>
        </g>
    );
}

/** Fondo oscuro con una luz suave (casi todas las portadas) */
function FondoNoche({ u, luz = GOLFO, x = '62%', y = '40%' }: { u: (n: string) => string; luz?: string; x?: string; y?: string }) {
    return (
        <>
            <defs>
                <linearGradient id={u('noche')} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#0F2E48" />
                    <stop offset="100%" stopColor={ABISMO} />
                </linearGradient>
                <radialGradient id={u('luz')} cx={x} cy={y} r="70%">
                    <stop offset="0%" stopColor={luz} stopOpacity="0.28" />
                    <stop offset="100%" stopColor={luz} stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="400" height="250" fill={`url(#${u('noche')})`} />
            <rect width="400" height="250" fill={`url(#${u('luz')})`} />
        </>
    );
}

export function DibujoPortada({ tipo }: { tipo: Ilustracion }) {
    // Un id por dibujo (la misma noticia puede salir dos veces en una página, una de ellas oculta:
    // si sus degradados compartieran id, el visible tomaría los del oculto y no se pintaría)
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const u = (n: string) => `${n}-${id}`;
    const dibujo: Record<Ilustracion, () => ReactNode> = {
        mapa: () => {
            const v = encuadre({ lon: -111.4, lat: 27.6 }, 205, 128, 27);
            const [px, py] = v.en(PUERTO_PENASCO);
            return (
                <>
                    <FondoNoche u={u} x="45%" y="30%" />
                    <g transform={v.transform}>
                        <path d={MAPA.tierra} fill={TIERRA} />
                        <path d={MAPA.costa} fill="none" stroke={ESPUMA} strokeOpacity="0.55" strokeWidth={1.1 / 27} strokeLinejoin="round" strokeLinecap="round" />
                    </g>
                    <text x="236" y="168" fontSize="11" fontWeight="700" fill={ESPUMA} fillOpacity="0.75" style={{ letterSpacing: '0.18em' }} transform="rotate(-52 236 168)">
                        GOLFO DE CALIFORNIA
                    </text>
                    <Lugar x={px} y={py} nombre="Puerto Peñasco" principal />
                </>
            );
        },
        altogolfo: () => {
            const v = encuadre({ lon: -114.15, lat: 31.15 }, 200, 122, 112);
            const [px, py] = v.en(PUERTO_PENASCO);
            const [sx, sy] = v.en(SAN_FELIPE);
            return (
                <>
                    <FondoNoche u={u} x="40%" y="60%" />
                    <g transform={v.transform}>
                        <path d={MAPA.tierra} fill={TIERRA} />
                        <path d={MAPA.costa} fill="none" stroke={ESPUMA} strokeOpacity="0.6" strokeWidth={1.3 / 112} strokeLinejoin="round" strokeLinecap="round" />
                    </g>
                    <text x="214" y="190" textAnchor="middle" fontSize="12" fontWeight="700" fill={ESPUMA} fillOpacity="0.8" style={{ letterSpacing: '0.2em' }}>
                        ALTO GOLFO
                    </text>
                    <Lugar x={px} y={py} nombre="Puerto Peñasco" principal />
                    <Lugar x={sx} y={sy} nombre="San Felipe" lado="izquierda" />
                </>
            );
        },
        carta: () => {
            const escala = 120;
            const v = encuadre({ lon: -114.22, lat: 31.3 }, 200, 125, escala);
            const [px, py] = v.en(PUERTO_PENASCO);
            const [sx, sy] = v.en(SAN_FELIPE);
            const [cx, cy] = v.en(SANTA_CLARA);
            // La cuadrícula: cada cuarto de grado
            const lineas: ReactNode[] = [];
            for (let lat = 30.5; lat <= 32.01; lat += 0.25) {
                const [, y] = v.en({ lon: -114, lat });
                lineas.push(<path key={`la${lat}`} d={`M0 ${y.toFixed(1)} H400`} />);
            }
            for (let lon = -115.5; lon <= -112.99; lon += 0.25) {
                const [x] = v.en({ lon, lat: 31 });
                lineas.push(<path key={`lo${lon}`} d={`M${x.toFixed(1)} 0 V250`} />);
            }
            const [, y31] = v.en({ lon: -114, lat: 31 });
            const [x114] = v.en({ lon: -114, lat: 31 });
            return (
                <>
                    <rect width="400" height="250" fill="#CFE2EA" />
                    <g transform={v.transform}>
                        <path d={MAPA.tierra} fill={PAPEL} />
                        <path d={MAPA.costa} fill="none" stroke={ABISMO} strokeOpacity="0.55" strokeWidth={1 / escala} strokeLinejoin="round" />
                    </g>
                    <g stroke={ABISMO} strokeOpacity="0.14" strokeWidth="0.8">
                        {lineas}
                    </g>
                    <g fontSize="9.5" fontWeight="700" fill={ABISMO} fillOpacity="0.55">
                        <text x="66" y={y31 - 4}>
                            31° N
                        </text>
                        <text x={x114 + 4} y="238">
                            114° O
                        </text>
                    </g>
                    {/* Rosa de los vientos */}
                    <g transform="translate(318 200)" stroke={ABISMO} strokeOpacity="0.5" fill="none" strokeWidth="1">
                        <circle r="20" />
                        <circle r="14" strokeOpacity="0.3" />
                        <path d="M0 -26 L4 0 L0 26 L-4 0 Z" fill={ABISMO} fillOpacity="0.55" stroke="none" />
                        <path d="M-26 0 L0 3 L26 0 L0 -3 Z" fill={ABISMO} fillOpacity="0.3" stroke="none" />
                        <text y="-30" textAnchor="middle" fontSize="9" fontWeight="800" fill={ABISMO} fillOpacity="0.7" stroke="none">
                            N
                        </text>
                    </g>
                    <Lugar x={px} y={py} nombre="Puerto Peñasco" lado="izquierda" color={ABISMO} principal />
                    <Lugar x={sx} y={sy} nombre="San Felipe" color={ABISMO} />
                    <Lugar x={cx} y={cy} nombre="Golfo de Santa Clara" color={ABISMO} />
                </>
            );
        },
        gota: () => (
            <>
                <FondoNoche u={u} luz={ACEITE} x="60%" y="35%" />
                <defs>
                    <linearGradient id={u('agua')} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAR_1} />
                        <stop offset="100%" stopColor={ABISMO} />
                    </linearGradient>
                    <linearGradient id={u('aceite')} x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" stopColor="#F8DA87" />
                        <stop offset="55%" stopColor={ACEITE} />
                        <stop offset="100%" stopColor="#B57B12" />
                    </linearGradient>
                    <radialGradient id={u('mancha')} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={ACEITE} stopOpacity="0.75" />
                        <stop offset="60%" stopColor="#B57B12" stopOpacity="0.35" />
                        <stop offset="100%" stopColor="#B57B12" stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect y="182" width="400" height="68" fill={`url(#${u('agua')})`} />
                <path d="M0 182 H400" stroke={ESPUMA} strokeOpacity="0.45" strokeWidth="1.2" />
                <ellipse cx="248" cy="192" rx="118" ry="18" fill={`url(#${u('mancha')})`} />
                {[0, 1, 2].map((k) => (
                    <ellipse key={k} cx="248" cy="190" rx={44 + k * 34} ry={7 + k * 5} fill="none" stroke="#fff" strokeOpacity={0.4 - k * 0.11} strokeWidth="1.2" />
                ))}
                <path d="M248 40 C 248 40 210 96 210 124 C 210 147 227 164 248 164 C 269 164 286 147 286 124 C 286 96 248 40 248 40 Z" fill={`url(#${u('aceite')})`} />
                <path d="M228 122 C 228 108 235 94 241 86" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="4" strokeLinecap="round" />
            </>
        ),
        hojas: () => (
            <>
                <FondoNoche u={u} x="68%" y="45%" />
                <g fill="none" stroke={PAPEL} strokeLinecap="round" strokeLinejoin="round">
                    {[
                        { x: 150, y: 44, r: -9, o: 0.35 },
                        { x: 186, y: 36, r: -2, o: 0.6 },
                        { x: 222, y: 44, r: 6, o: 1 },
                    ].map((h, k) => (
                        <g key={k} transform={`translate(${h.x} ${h.y}) rotate(${h.r} 60 80)`} strokeOpacity={h.o}>
                            <rect width="120" height="160" rx="5" fill={ABISMO} fillOpacity="0.92" strokeWidth="1.6" />
                            <circle cx="18" cy="20" r="7" strokeWidth="1.3" />
                            <path d="M32 17 H92 M32 25 H72" strokeWidth="1.6" />
                            <rect x="10" y="40" width="100" height="66" strokeWidth="1" />
                            {[51, 62, 73, 84, 95].map((yy) => (
                                <path key={yy} d={`M10 ${yy} H110`} strokeWidth="0.8" strokeOpacity="0.7" />
                            ))}
                            <path d="M52 40 V106 M76 40 V106" strokeWidth="0.8" strokeOpacity="0.7" />
                            <path d="M16 126 q 8 -8 16 0 t 16 0 t 16 -2" strokeWidth="1.4" />
                            <path d="M14 140 H58 M66 140 H106" strokeWidth="1" />
                        </g>
                    ))}
                </g>
            </>
        ),
        simbolo: () => (
            <>
                <FondoNoche u={u} x="50%" y="50%" />
                {[0, 1, 2, 3].map((k) => (
                    <circle key={k} cx="200" cy="125" r={52 + k * 26} fill="none" stroke={ESPUMA} strokeOpacity={0.32 - k * 0.07} strokeWidth="1.2" />
                ))}
                <circle cx="200" cy="125" r="46" fill={ABISMO} />
                <image href="/assets/simar/simbolo-grande.png" x="164" y="89" width="72" height="72" />
            </>
        ),
        red: () => {
            // Una malla de rombos dentro de una forma suelta (la red a la deriva)
            const hilos: string[] = [];
            for (let k = -260; k <= 420; k += 15) {
                hilos.push(`M${k} 0 L${k + 250} 250`, `M${k + 250} 0 L${k} 250`);
            }
            const forma = 'M70 40 C 150 18 260 30 330 56 C 352 104 340 176 300 214 C 230 236 140 226 92 196 C 58 150 52 92 70 40 Z';
            return (
                <>
                    <FondoNoche u={u} x="50%" y="0%" />
                    <defs>
                        <clipPath id={u('red')}>
                            <path d={forma} />
                        </clipPath>
                    </defs>
                    {/* Rayos de luz desde la superficie */}
                    <g fill="#fff" fillOpacity="0.035">
                        <path d="M140 0 L190 0 L120 250 L40 250 Z" />
                        <path d="M240 0 L270 0 L320 250 L250 250 Z" />
                    </g>
                    <g clipPath={`url(#${u('red')})`}>
                        <path d={hilos.join(' ')} stroke={ESPUMA} strokeOpacity="0.5" strokeWidth="1" fill="none" />
                    </g>
                    <path d={forma} fill="none" stroke={ESPUMA} strokeOpacity="0.75" strokeWidth="2" />
                    {/* Los flotadores de la orilla de arriba */}
                    {[
                        [92, 34],
                        [150, 24],
                        [210, 25],
                        [270, 36],
                        [322, 52],
                    ].map(([x, y]) => (
                        <ellipse key={x} cx={x} cy={y} rx="9" ry="6" fill={ACEITE} />
                    ))}
                </>
            );
        },
        globo: () => {
            const meridianos = [0.2, 0.45, 0.7, 0.92];
            return (
                <>
                    <FondoNoche u={u} x="70%" y="60%" />
                    <defs>
                        <radialGradient id={u('globo')} cx="38%" cy="32%" r="75%">
                            <stop offset="0%" stopColor="#2A7FC9" />
                            <stop offset="55%" stopColor={MAR_2} />
                            <stop offset="100%" stopColor={ABISMO} />
                        </radialGradient>
                        <clipPath id={u('esfera')}>
                            <circle cx="250" cy="150" r="128" />
                        </clipPath>
                    </defs>
                    <circle cx="250" cy="150" r="128" fill={`url(#${u('globo')})`} />
                    <g clipPath={`url(#${u('esfera')})`} fill="none" stroke="#fff" strokeOpacity="0.16" strokeWidth="1">
                        {meridianos.map((m) => (
                            <ellipse key={m} cx="250" cy="150" rx={128 * m} ry="128" />
                        ))}
                        {[-90, -45, 0, 45, 90].map((d) => (
                            <path key={d} d={`M100 ${150 + d} H400`} />
                        ))}
                    </g>
                    <circle cx="250" cy="150" r="128" fill="none" stroke={ESPUMA} strokeOpacity="0.5" strokeWidth="1.5" />
                    <circle cx="250" cy="150" r="146" fill="none" stroke={ESPUMA} strokeOpacity="0.14" strokeWidth="1" />
                </>
            );
        },
        costa: () => (
            <>
                <defs>
                    <linearGradient id={u('cielo')} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ABISMO} />
                        <stop offset="100%" stopColor={MAR_1} />
                    </linearGradient>
                    <radialGradient id={u('sol')} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={ACEITE} stopOpacity="0.45" />
                        <stop offset="100%" stopColor={ACEITE} stopOpacity="0" />
                    </radialGradient>
                    <linearGradient id={u('arena')} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ARENA} />
                        <stop offset="100%" stopColor="#C9B58C" />
                    </linearGradient>
                </defs>
                <rect width="400" height="122" fill={`url(#${u('cielo')})`} />
                <circle cx="252" cy="122" r="90" fill={`url(#${u('sol')})`} />
                <path d="M216 122 A36 36 0 0 1 288 122 Z" fill={ACEITE} />
                <rect y="122" width="400" height="128" fill={MAR_2} />
                <g stroke={ACEITE} strokeOpacity="0.55" strokeWidth="2" strokeLinecap="round">
                    <path d="M226 134 H278 M236 146 H268 M244 158 H262" />
                </g>
                <path d="M0 176 C 60 166 110 182 170 172 C 230 162 300 180 400 166 L400 250 L0 250 Z" fill="#fff" fillOpacity="0.18" />
                <path d="M0 186 C 70 174 130 194 200 182 C 270 170 330 190 400 178 L400 250 L0 250 Z" fill={`url(#${u('arena')})`} />
                <path d="M0 186 C 70 174 130 194 200 182 C 270 170 330 190 400 178" fill="none" stroke="#fff" strokeOpacity="0.7" strokeWidth="2" />
                {/* Lo que quedó en la arena: una botella, una lata y una bolsa */}
                <g fill={ABISMO} fillOpacity="0.55">
                    <path d="M110 214 l30 -8 l2 6 l6 -2 l2 6 l-6 2 l2 6 l-30 8 Z" />
                    <rect x="250" y="206" width="12" height="18" rx="2" transform="rotate(20 256 215)" />
                    <path d="M300 222 c 6 -14 22 -16 30 -6 c 6 8 -2 16 -14 14 c -8 -1 -12 -2 -16 -8 Z" fillOpacity="0.35" />
                </g>
            </>
        ),
        botella: () => (
            <>
                <defs>
                    <linearGradient id={u('fondo')} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={MAR_1} />
                        <stop offset="100%" stopColor={ABISMO} />
                    </linearGradient>
                </defs>
                <rect width="400" height="250" fill={`url(#${u('fondo')})`} />
                {/* La superficie, vista desde abajo */}
                <path d="M0 74 C 50 66 100 82 150 74 C 200 66 250 82 300 74 C 350 66 380 78 400 72 L400 0 L0 0 Z" fill="#fff" fillOpacity="0.1" />
                <path d="M0 74 C 50 66 100 82 150 74 C 200 66 250 82 300 74 C 350 66 380 78 400 72" fill="none" stroke="#fff" strokeOpacity="0.55" strokeWidth="1.6" />
                <g fill="#fff" fillOpacity="0.04">
                    <path d="M120 74 L170 74 L110 250 L40 250 Z" />
                    <path d="M260 74 L290 74 L340 250 L270 250 Z" />
                </g>
                {/* La botella, medio hundida */}
                <g transform="rotate(-14 206 92)">
                    <path
                        d="M150 78 h86 c 14 0 22 8 30 14 l 18 0 c 4 0 6 2 6 6 v 8 c 0 4 -2 6 -6 6 h -18 c -8 6 -16 14 -30 14 h -86 c -12 0 -18 -8 -18 -24 c 0 -16 6 -24 18 -24 Z"
                        fill="#fff"
                        fillOpacity="0.14"
                        stroke="#fff"
                        strokeOpacity="0.75"
                        strokeWidth="2"
                    />
                    <rect x="290" y="94" width="12" height="16" rx="2" fill={ACEITE} />
                    <path d="M150 92 h80" stroke="#fff" strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round" />
                </g>
                {/* Una bolsa a la deriva, más abajo */}
                <path d="M96 170 c 10 -18 36 -20 46 -4 c 6 10 -2 22 -16 26 c 4 10 -2 20 -12 16 c -8 -3 -6 -12 -2 -16 c -12 -2 -20 -10 -16 -22 Z" fill="#fff" fillOpacity="0.1" stroke="#fff" strokeOpacity="0.35" strokeWidth="1.4" />
            </>
        ),
        horizonte: () => (
            <>
                <defs>
                    <linearGradient id={u('cielo')} x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={ABISMO} />
                        <stop offset="70%" stopColor={MAR_2} />
                        <stop offset="100%" stopColor="#3E7F96" />
                    </linearGradient>
                    <radialGradient id={u('sol')} cx="50%" cy="50%" r="50%">
                        <stop offset="0%" stopColor={ACEITE} stopOpacity="0.4" />
                        <stop offset="100%" stopColor={ACEITE} stopOpacity="0" />
                    </radialGradient>
                </defs>
                <rect width="400" height="140" fill={`url(#${u('cielo')})`} />
                <circle cx="120" cy="140" r="80" fill={`url(#${u('sol')})`} />
                <path d="M92 140 A28 28 0 0 1 148 140 Z" fill={ACEITE} />
                <rect y="140" width="400" height="110" fill={MAR_2} />
                <path d="M0 140 H400" stroke="#fff" strokeOpacity="0.5" strokeWidth="1.2" />
                <g stroke={ACEITE} strokeOpacity="0.5" strokeWidth="2" strokeLinecap="round">
                    <path d="M98 152 H142 M106 164 H134" />
                </g>
                <path d="M0 196 C 60 186 120 202 200 192 C 280 182 340 198 400 190 L400 250 L0 250 Z" fill={MAR_1} />
                <path d="M0 222 C 70 212 140 228 210 218 C 280 208 340 224 400 216 L400 250 L0 250 Z" fill={ABISMO} fillOpacity="0.5" />
                {/* Una panga a lo lejos */}
                <g transform="translate(262 160)">
                    <path d="M-34 0 H34 L26 10 H-28 Z" fill="#fff" />
                    <path d="M-6 0 V-14 M4 0 V-10" stroke="#fff" strokeWidth="2.4" strokeLinecap="round" />
                    <circle cx="-6" cy="-17" r="3" fill="#fff" />
                    <circle cx="4" cy="-13" r="3" fill="#fff" />
                </g>
            </>
        ),
    };

    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true" style={{ fontFamily: 'inherit' }}>
            {dibujo[tipo]()}
        </svg>
    );
}

/* ── El mapa de «En el mapa» (ExploradorMapa) ─────────────────────────────────────────────── */

/** Encuadre del mapa grande: el golfo de Puerto Peñasco a Sinaloa, en un cuadro de 400 × 400 */
const ESCALA_EXPLORADOR = 58;
const EXPLORADOR = encuadre({ lon: -111.95, lat: 28.95 }, 200, 200, ESCALA_EXPLORADOR);

/** Dónde cae un lugar en el mapa grande, en % del cuadro (para poner encima sus botones) */
export function enMapaGolfo(lugar: { lon: number; lat: number }) {
    const [x, y] = EXPLORADOR.en(lugar);
    return { x: (x / 400) * 100, y: (y / 400) * 100 };
}

/**
 * El mapa del Golfo de California para «En el mapa»: tierra, costa, cuadrícula de grados y los
 * nombres de los estados. Sin marcas: los botones de cada lugar van encima, en HTML (se pueden
 * tocar y enfocar con el teclado). Es de servidor y llega al explorador como prop.
 */
export function MapaGolfo() {
    const v = EXPLORADOR;
    const lineas: ReactNode[] = [];
    for (let lat = 26; lat <= 32; lat += 1) {
        const [, y] = v.en({ lon: -112, lat });
        lineas.push(<path key={`la${lat}`} d={`M0 ${y.toFixed(1)} H400`} />);
    }
    for (let lon = -115; lon <= -108; lon += 1) {
        const [x] = v.en({ lon, lat: 29 });
        lineas.push(<path key={`lo${lon}`} d={`M${x.toFixed(1)} 0 V400`} />);
    }
    const nombre = (texto: string, lugar: { lon: number; lat: number }, giro = 0, opacidad = 0.5) => {
        const [x, y] = v.en(lugar);
        return (
            <text
                x={x}
                y={y}
                textAnchor="middle"
                fontSize="10"
                fontWeight="800"
                fill={ESPUMA}
                fillOpacity={opacidad}
                transform={giro ? `rotate(${giro} ${x.toFixed(1)} ${y.toFixed(1)})` : undefined}
                style={{ letterSpacing: '0.22em' }}
            >
                {texto}
            </text>
        );
    };
    return (
        <svg viewBox="0 0 400 400" className="absolute inset-0 w-full h-full" aria-hidden="true" style={{ fontFamily: 'inherit' }}>
            <defs>
                <radialGradient id="mapa-golfo-luz" cx="50%" cy="55%" r="70%">
                    <stop offset="0%" stopColor={MAR_1} stopOpacity="0.9" />
                    <stop offset="100%" stopColor={MAR_1} stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* El mar en azul verdoso y la tierra oscura: se ve de inmediato dónde está el agua */}
            <rect width="400" height="400" fill={MAR_2} />
            <rect width="400" height="400" fill="url(#mapa-golfo-luz)" />
            <g stroke="#fff" strokeOpacity="0.07" strokeWidth="1">
                {lineas}
            </g>
            <g transform={v.transform}>
                <path d={MAPA.tierra} fill={ABISMO} />
                <path d={MAPA.costa} fill="none" stroke={ESPUMA} strokeOpacity="0.6" strokeWidth={1.2 / ESCALA_EXPLORADOR} strokeLinejoin="round" strokeLinecap="round" />
            </g>
            {nombre('SONORA', { lon: -110.6, lat: 29.9 })}
            {nombre('SINALOA', { lon: -108.3, lat: 25.75 })}
            {nombre('BAJA CALIFORNIA', { lon: -115.25, lat: 29.35 }, 62, 0.4)}
            {nombre('BAJA CALIFORNIA SUR', { lon: -112.75, lat: 26.75 }, 58, 0.4)}
            {nombre('OCÉANO PACÍFICO', { lon: -114.9, lat: 26.6 }, 58, 0.35)}
        </svg>
    );
}

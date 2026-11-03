import type { CSSProperties } from 'react';
import { Vaquita } from './Vaquita';

/**
 * Las piezas del mar animado de Noticias: la luz que entra, las burbujas, las algas, un cardumen
 * y la vaquita con su cría. Son de servidor (SVG y CSS, sin JavaScript); el movimiento está en
 * globals.css (clases n-*) y se detiene con «reducir movimiento». Van dentro de una escena con
 * PausaFuera, que las pausa fuera de la pantalla. Ver DISEÑO_SIMAR.md §8.6.
 */

const ABISMO = '#0B2236';
const MAR_1 = '#0E5A72';
const MAR_2 = '#0C3D5C';
const ESPUMA = '#7FE0D6';
const ALGA_1 = '#0F5C4C';
const ALGA_2 = '#127A5D';

/** Variables de CSS en `style` (TypeScript no conoce las propias) */
const v = (vars: Record<string, string | number>) => vars as CSSProperties;

/** Rayos de luz que bajan desde la superficie y se mecen despacio */
export function RayosDeLuz({ className = '' }: { className?: string }) {
    const rayos = [
        { x: 0.1, ancho: 0.07, espera: '0s' },
        { x: 0.27, ancho: 0.11, espera: '-2.5s' },
        { x: 0.48, ancho: 0.06, espera: '-4s' },
        { x: 0.63, ancho: 0.1, espera: '-1.2s' },
        { x: 0.84, ancho: 0.08, espera: '-5.5s' },
    ];
    return (
        <svg viewBox="0 0 1000 600" preserveAspectRatio="none" className={`absolute inset-0 w-full h-full ${className}`} aria-hidden="true">
            <defs>
                <linearGradient id="rayo-luz" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity="0.32" />
                    <stop offset="100%" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
            </defs>
            {rayos.map((r) => {
                const x = r.x * 1000;
                const a = r.ancho * 1000;
                return (
                    <polygon
                        key={r.x}
                        className="n-rayo"
                        points={`${x},0 ${x + a},0 ${x + a * 2.6 + 90},600 ${x + 90},600`}
                        fill="url(#rayo-luz)"
                        style={{ ...v({ '--espera': r.espera }), transformBox: 'fill-box', transformOrigin: '50% 0%' }}
                    />
                );
            })}
        </svg>
    );
}

/** Burbujas que suben (pocas y con su brillo: se leen como burbujas, no como puntos) */
export function Burbujas({ burbujas }: { burbujas: { x: string; abajo: string; tam: number; sube: number; dura: number; espera: number }[] }) {
    return (
        <>
            {burbujas.map((b, i) => (
                <span
                    key={i}
                    aria-hidden="true"
                    className="n-burbuja absolute rounded-full border border-white/60 bg-white/10 opacity-60 shadow-[inset_-2px_-2px_0_rgba(255,255,255,0.25)]"
                    style={{
                        left: b.x,
                        bottom: b.abajo,
                        width: b.tam,
                        height: b.tam,
                        ...v({ '--sube': `${b.sube}px`, '--dura': `${b.dura}s`, '--espera': `${b.espera}s`, '--lado': `${i % 2 ? -10 : 10}px` }),
                    }}
                />
            ))}
        </>
    );
}

/** Un mechón de algas (sargazo gigante) que se mece desde el fondo */
export function Algas({ className = '', espejo = false }: { className?: string; espejo?: boolean }) {
    const hojas = [
        { d: 'M40 300 C30 240 52 200 38 150 C26 108 46 70 36 20 C52 64 50 110 58 150 C66 196 50 240 56 300 Z', color: ALGA_1, dura: '5.5s', espera: '0s' },
        { d: 'M70 300 C64 250 84 214 74 170 C66 134 82 100 78 60 C92 100 90 140 94 176 C98 220 84 258 88 300 Z', color: ALGA_2, dura: '4.6s', espera: '-1.8s' },
        { d: 'M14 300 C10 262 24 236 16 200 C10 172 20 148 16 118 C28 146 30 176 32 204 C34 240 26 268 30 300 Z', color: ALGA_2, dura: '6.2s', espera: '-3.1s' },
        { d: 'M100 300 C98 270 108 250 104 222 C100 200 108 180 106 160 C116 182 118 206 118 228 C118 256 112 276 114 300 Z', color: ALGA_1, dura: '5s', espera: '-0.9s' },
    ];
    return (
        <svg viewBox="0 0 130 300" className={`absolute ${className}`} style={espejo ? { transform: 'scaleX(-1)' } : undefined} aria-hidden="true">
            {hojas.map((h, i) => (
                <path key={i} className="n-alga" d={h.d} fill={h.color} fillOpacity="0.9" style={v({ '--dura': h.dura, '--espera': h.espera })} />
            ))}
        </svg>
    );
}

/** Un pez visto de lado, mirando a la izquierda (24 × 10) */
const PEZ = 'M0 5 C4 0.5 12 0 17 3.8 L24 0 L22 5 L24 10 L17 6.2 C12 10 4 9.5 0 5 Z';

/**
 * Un cardumen que cruza de derecha a izquierda, al fondo. La caja mide lo que la escena; `arriba`
 * dice a qué altura pasa.
 */
export function Cardumen({ arriba, dura = 40, espera = -14, ancho = 'clamp(120px,14vw,200px)', opacidad = 0.4 }: { arriba: string; dura?: number; espera?: number; ancho?: string; opacidad?: number }) {
    const peces = [
        [8, 18],
        [34, 6],
        [40, 30],
        [62, 16],
        [70, 40],
        [88, 4],
        [94, 26],
        [116, 14],
        [120, 36],
    ];
    return (
        <div aria-hidden="true" className="n-cruza absolute inset-x-0" style={{ top: arriba, ...v({ '--desde': '50%', '--hasta': '-110%', '--dura': `${dura}s`, '--espera': `${espera}s` }) }}>
            <svg viewBox="0 0 150 52" className="absolute" style={{ left: '68%', width: ancho }}>
                {peces.map(([x, y], i) => (
                    <g key={i} transform={`translate(${x} ${y})`}>
                        <path className={i % 2 ? 'n-ondula' : 'n-ondula-2'} d={PEZ} fill={ESPUMA} fillOpacity={opacidad} />
                    </g>
                ))}
            </svg>
        </div>
    );
}

/**
 * La vaquita y su cría, nadando juntas de izquierda a derecha (la cría, a un lado y un poco más
 * abajo). La caja mide lo que la escena; quietas, quedan donde dice `en` (en % del ancho).
 */
export function NadoVaquitas({ className = '', ancho, dura = 46, espera = -20, en = '52%' }: { className?: string; ancho: string; dura?: number; espera?: number; en?: string }) {
    return (
        <div aria-hidden="true" className={`n-cruza absolute inset-x-0 ${className}`} style={v({ '--desde': '-95%', '--hasta': '70%', '--dura': `${dura}s`, '--espera': `${espera}s` })}>
            <div className="absolute bottom-0 aspect-[100/50]" style={{ left: en, width: ancho }}>
                <div className="n-ondula-2 absolute left-[4%] top-[50%] w-[46%]">
                    <Vaquita cria className="w-full drop-shadow-[0_10px_14px_rgba(0,0,0,0.25)]" />
                </div>
                <div className="n-ondula absolute right-0 top-0 w-[74%]">
                    <Vaquita className="w-full drop-shadow-[0_14px_20px_rgba(0,0,0,0.3)]" />
                </div>
            </div>
        </div>
    );
}

/** El fondo del mar: arena oscura y unas rocas */
export function FondoMarino({ className = '' }: { className?: string }) {
    return (
        <svg viewBox="0 0 1200 120" preserveAspectRatio="none" className={`absolute inset-x-0 w-full ${className}`} aria-hidden="true">
            <path d="M0 70 C140 40 260 84 420 62 C560 42 680 78 820 58 C960 40 1080 70 1200 50 V120 H0 Z" fill={MAR_2} fillOpacity="0.9" />
            <path d="M0 92 C160 70 300 104 470 86 C620 70 760 100 920 84 C1040 72 1130 90 1200 80 V120 H0 Z" fill={ABISMO} />
            <path d="M160 92 C170 74 196 70 214 80 C226 86 228 94 226 98 Z" fill={MAR_1} fillOpacity="0.55" />
            <path d="M880 86 C894 64 930 60 952 74 C964 82 966 90 964 94 Z" fill={MAR_1} fillOpacity="0.5" />
        </svg>
    );
}

/* ── Las escenas de «En cifras» (400 × 225, se recortan sin deformarse) ───────────────────────── */

/** La línea de la superficie con olas: el doble de ancho, para correr sin que se note el corte */
function olas(y: number, alto: number, periodo = 50, ancho = 800) {
    let d = `M0 ${y} `;
    for (let x = 0; x < ancho; x += periodo) {
        d += `Q${x + periodo / 4} ${y - alto} ${x + periodo / 2} ${y} T${x + periodo} ${y} `;
    }
    return `${d}L${ancho} 225 L0 225 Z`;
}

function Fondo({ id, superficie }: { id: string; superficie?: number }) {
    return (
        <defs>
            <linearGradient id={`${id}-agua`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={MAR_1} />
                <stop offset="60%" stopColor={MAR_2} />
                <stop offset="100%" stopColor={ABISMO} />
            </linearGradient>
            <linearGradient id={`${id}-cielo`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={ABISMO} />
                <stop offset="100%" stopColor="#123A52" />
            </linearGradient>
            <linearGradient id={`${id}-luz`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#fff" stopOpacity={superficie === undefined ? 0.22 : 0.16} />
                <stop offset="100%" stopColor="#fff" stopOpacity="0" />
            </linearGradient>
        </defs>
    );
}

/** El aceite: una gota cae, toca el agua, salen ondas y la mancha se abre y tapa la luz */
function EscenaAceite() {
    const id = 'esc-aceite';
    return (
        <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <Fondo id={id} superficie={112} />
            <defs>
                <radialGradient id={`${id}-mancha`} cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#F2C14E" stopOpacity="0.95" />
                    <stop offset="55%" stopColor="#E08E3C" stopOpacity="0.75" />
                    <stop offset="80%" stopColor="#7FE0D6" stopOpacity="0.35" />
                    <stop offset="100%" stopColor="#7FE0D6" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={`${id}-sombra`} cx="50%" cy="0%" r="60%">
                    <stop offset="0%" stopColor="#000" stopOpacity="0.45" />
                    <stop offset="100%" stopColor="#000" stopOpacity="0" />
                </radialGradient>
            </defs>
            <rect width="400" height="225" fill={`url(#${id}-cielo)`} />
            <g className="n-ola" style={v({ '--dura': '7s' })}>
                <path d={olas(112, 3, 40)} fill={`url(#${id}-agua)`} />
            </g>
            {/* Debajo de la mancha no pasa la luz */}
            <rect x="40" y="113" width="320" height="112" fill={`url(#${id}-sombra)`} />
            <polygon points="60,114 90,114 150,225 100,225" fill={`url(#${id}-luz)`} />
            <polygon points="310,114 336,114 380,225 334,225" fill={`url(#${id}-luz)`} />
            {/* La mancha, con su brillo de arcoíris en la orilla */}
            <ellipse className="n-mancha" cx="200" cy="113" rx="120" ry="7" fill={`url(#${id}-mancha)`} />
            <ellipse className="n-onda" cx="200" cy="113" rx="70" ry="6" fill="none" stroke={ESPUMA} strokeOpacity="0.8" strokeWidth="1.6" />
            <ellipse className="n-onda" cx="200" cy="113" rx="130" ry="10" fill="none" stroke={ESPUMA} strokeOpacity="0.5" strokeWidth="1.4" style={v({ '--espera': '0.35s' })} />
            {/* La gota */}
            <g className="n-gota-cae">
                <path d="M200 52 C206 62 212 69 212 76 C212 83 206.6 88 200 88 C193.4 88 188 83 188 76 C188 69 194 62 200 52 Z" fill="#F2C14E" />
                <ellipse cx="195.5" cy="77" rx="2.6" ry="4.2" fill="#fff" fillOpacity="0.55" />
            </g>
            {/* Un pez que se aleja de la mancha */}
            <g transform="translate(300 176) scale(1.1)">
                <path className="n-ondula" d={PEZ} fill={ESPUMA} fillOpacity="0.55" />
            </g>
        </svg>
    );
}

/** La basura: una botella flota, una bolsa va a la deriva y una lata se hunde hasta el fondo */
function EscenaBasura() {
    const id = 'esc-basura';
    return (
        <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <Fondo id={id} superficie={70} />
            <rect width="400" height="225" fill={`url(#${id}-cielo)`} />
            <g className="n-ola" style={v({ '--dura': '9s' })}>
                <path d={olas(70, 4, 50)} fill={`url(#${id}-agua)`} />
            </g>
            <g className="n-ola" style={v({ '--dura': '6s' })}>
                <path d={olas(74, 2.5, 40)} fill={MAR_1} fillOpacity="0.35" />
            </g>
            <polygon points="70,72 100,72 170,225 120,225" fill={`url(#${id}-luz)`} />
            <polygon points="250,72 270,72 320,225 286,225" fill={`url(#${id}-luz)`} />
            {/* El fondo, con arena oscura */}
            <path d="M0 198 C70 186 130 204 200 196 C270 188 330 204 400 194 V225 H0 Z" fill="#163447" />
            <path d="M286 200 C292 192 304 190 312 196 Z" fill={ESPUMA} fillOpacity="0.25" />
            {/* La botella, acostada en el agua */}
            <g transform="translate(108 68)">
                <g className="n-flota">
                    <path d="M2 -9 H36 C40 -9 42 -6 44 -4 H52 V4 H44 C42 6 40 9 36 9 H2 C-1 9 -2 6 -2 0 C-2 -6 -1 -9 2 -9 Z" fill="#D4F1F4" fillOpacity="0.9" />
                    <rect x="12" y="-9" width="14" height="18" fill="#20B2C4" fillOpacity="0.75" />
                    <rect x="52" y="-5" width="7" height="10" rx="1.5" fill="#F2C14E" />
                    <path d="M4 -5 H34" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.6" strokeLinecap="round" />
                </g>
            </g>
            {/* La bolsa, a media agua */}
            <g transform="translate(262 112)">
                <g className="n-deriva" style={v({ '--dura': '6s' })}>
                    <path
                        d="M0 0 C-6 10 -10 26 -6 40 C-2 50 18 52 26 44 C32 36 30 14 24 0 C22 -6 18 -8 16 -4 C15 2 9 2 8 -4 C6 -8 2 -6 0 0 Z"
                        fill="#fff"
                        fillOpacity="0.28"
                        stroke="#fff"
                        strokeOpacity="0.55"
                        strokeWidth="1.2"
                    />
                </g>
            </g>
            {/* La lata, que se va al fondo */}
            <g transform="translate(190 130)">
                <g className="n-hunde" style={v({ '--espera': '-4s' })}>
                    <rect x="-7" y="-11" width="14" height="22" rx="3" fill="#9FB3C2" />
                    <rect x="-7" y="-4" width="14" height="7" fill="#D9534F" fillOpacity="0.85" />
                    <ellipse cx="0" cy="-11" rx="7" ry="2" fill="#C9D6DF" />
                </g>
            </g>
        </svg>
    );
}

/** Las redes: una red perdida se mece en el agua con un pez atrapado; otro pasa de largo */
function EscenaRedes() {
    const id = 'esc-redes';
    const malla: string[] = [];
    for (let k = -200; k <= 400; k += 16) {
        malla.push(`M${k} 0 L${k + 220} 220`);
        malla.push(`M${k + 220} 0 L${k} 220`);
    }
    return (
        <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <Fondo id={id} />
            <defs>
                <clipPath id={`${id}-tela`}>
                    <path d="M110 30 H300 C298 70 306 110 296 150 C290 174 270 196 246 200 C220 190 196 204 168 194 C140 186 120 168 114 140 C106 104 116 66 110 30 Z" />
                </clipPath>
            </defs>
            <rect width="400" height="225" fill={`url(#${id}-agua)`} />
            <polygon points="40,0 70,0 150,225 100,225" fill={`url(#${id}-luz)`} />
            <polygon points="300,0 322,0 380,225 342,225" fill={`url(#${id}-luz)`} />
            <g transform="translate(0 0)">
                <g className="n-deriva" style={v({ '--dura': '7.5s' })}>
                    {/* La línea de flotadores */}
                    <path d="M104 30 C150 24 250 36 306 28" fill="none" stroke={ESPUMA} strokeOpacity="0.7" strokeWidth="2" />
                    {[112, 146, 180, 214, 248, 282].map((x, i) => (
                        <ellipse key={x} cx={x} cy={29 + (i % 2 ? 2 : -1)} rx="7" ry="5" fill="#F2C14E" fillOpacity="0.9" />
                    ))}
                    {/* La malla */}
                    <g clipPath={`url(#${id}-tela)`}>
                        <path d={malla.join(' ')} stroke={ESPUMA} strokeOpacity="0.42" strokeWidth="1.1" fill="none" />
                    </g>
                    <path
                        d="M110 30 C116 66 106 104 114 140 C120 168 140 186 168 194 C196 204 220 190 246 200 C270 196 290 174 296 150 C306 110 298 70 300 30"
                        fill="none"
                        stroke={ESPUMA}
                        strokeOpacity="0.5"
                        strokeWidth="1.4"
                    />
                    {/* El pez atrapado */}
                    <g transform="translate(184 118) scale(1.8)">
                        <path className="n-aleteo" d={PEZ} fill="#9FB3C2" />
                    </g>
                </g>
            </g>
        </svg>
    );
}

/** El mar que cuidamos: la vaquita y su cría entre las algas */
function EscenaMar() {
    return (
        <svg viewBox="0 0 400 225" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <Fondo id="esc-mar" />
            <rect width="400" height="225" fill="url(#esc-mar-agua)" />
            <polygon points="50,0 80,0 170,225 116,225" fill="url(#esc-mar-luz)" />
            <polygon points="220,0 240,0 300,225 266,225" fill="url(#esc-mar-luz)" />
            <path d="M0 206 C80 194 150 212 230 202 C300 194 350 210 400 200 V225 H0 Z" fill={ABISMO} fillOpacity="0.8" />
        </svg>
    );
}

/**
 * La escena animada de cada tema de «En cifras». La del mar suma la vaquita y su cría (HTML encima
 * del SVG, para que crucen todo el ancho).
 */
export function EscenaCifra({ tema }: { tema: string }) {
    if (tema === 'aceite') return <EscenaAceite />;
    if (tema === 'basura') return <EscenaBasura />;
    if (tema === 'redes')
        return (
            <>
                <EscenaRedes />
                <Cardumen arriba="64%" dura={16} espera={-6} ancho="22%" opacidad={0.55} />
            </>
        );
    return (
        <>
            <EscenaMar />
            <Algas className="left-[-2%] bottom-0 h-[78%]" />
            <Algas className="right-[-3%] bottom-0 h-[64%]" espejo />
            <NadoVaquitas className="bottom-[22%]" ancho="54%" dura={20} espera={-8} en="22%" />
            <Burbujas
                burbujas={[
                    { x: '18%', abajo: '18%', tam: 8, sube: 150, dura: 5, espera: -1 },
                    { x: '82%', abajo: '14%', tam: 6, sube: 130, dura: 6, espera: -3.5 },
                    { x: '86%', abajo: '10%', tam: 10, sube: 160, dura: 7, espera: -5 },
                ]}
            />
        </>
    );
}

/**
 * La cifra de las vaquitas, en figuras: diez vaquitas pequeñas, siete firmes y tres claras
 * (quedan «entre 7 y 10»). Aparecen una a una cuando se ven.
 */
export function FilaVaquitas() {
    return (
        <div>
            <div className="grid grid-cols-10 gap-1.5 max-w-[440px] movil:grid-cols-5 movil:gap-x-3 movil:gap-y-2 movil:max-w-[300px]" aria-hidden="true">
                {Array.from({ length: 10 }, (_, i) => (
                    <div key={i} className="n-asoma" style={v({ '--i': i })}>
                        <Vaquita cola={false} className={`w-full ${i >= 7 ? 'opacity-35' : ''}`} />
                    </div>
                ))}
            </div>
            <p className="mt-2 text-[15px] font-semibold text-simar-franja-texto-3">Las tres más claras: quizá.</p>
        </div>
    );
}

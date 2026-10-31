import { CAJA_GOLFO, PUERTO_PENASCO, TIERRA_GOLFO } from '@/components/landing/tresd/golfo';
import type { Ilustracion } from '@/lib/constants/noticias';

/**
 * Portadas dibujadas para las noticias sin foto, con el mismo lenguaje del mar de partículas de la
 * landing 3D: puntos de luz sobre Abismo. Son SVG (se dibujan en el servidor, no bajan JavaScript).
 *
 *  - `mapa`: el Golfo de California en puntos, con la costa encendida y Puerto Peñasco.
 *  - `altogolfo`: el mismo mapa de cerca, en el Alto Golfo (donde vive la vaquita marina).
 *  - `gota`: una gota de aceite sobre la mancha que deja en el agua.
 *  - `hojas`: hojas de manifiesto, como las del papel de antes.
 *  - `simbolo`: el símbolo de SiMAR entre anillos.
 *
 * Todas usan un viewBox de 400 × 250 (16:10) y `preserveAspectRatio="xMidYMid slice"`: se recortan
 * para llenar cualquier formato sin deformarse.
 */

const ESPUMA = '#7FE0D6';
const GOLFO = '#20B2C4';
const ACEITE = '#F2C14E';

// ── El mapa: se arma una sola vez ───────────────────────────────────────────────────────────
const MAPA = (() => {
    const { oeste, este, sur, norte } = CAJA_GOLFO;
    const kLat = Math.cos(((sur + norte) / 2) * (Math.PI / 180));
    const alto = 300;
    const ancho = (alto * ((este - oeste) * kLat)) / (norte - sur);
    const aPx = (lon: number, lat: number): [number, number] => [((lon - oeste) / (este - oeste)) * ancho, ((norte - lat) / (norte - sur)) * alto];
    const enOrilla = (lon: number, lat: number) =>
        Math.abs(lon - oeste) < 0.02 || Math.abs(lon - este) < 0.02 || Math.abs(lat - sur) < 0.02 || Math.abs(lat - norte) < 0.02;
    let tierra = '';
    let costa = '';
    for (const anillo of TIERRA_GOLFO) {
        let previo: [number, number] | null = null;
        let enTrazo = false;
        for (let k = 0; k <= anillo.length; k += 2) {
            const i = k % anillo.length;
            const lon = anillo[i];
            const lat = anillo[i + 1];
            const [x, y] = aPx(lon, lat);
            const p = `${x.toFixed(1)} ${y.toFixed(1)}`;
            if (k < anillo.length) tierra += `${k === 0 ? 'M' : 'L'}${p} `;
            // La costa no sigue las orillas de la caja (ahí la tierra está recortada, no es costa)
            const recortado = previo !== null && enOrilla(previo[0], previo[1]) && enOrilla(lon, lat);
            if (previo === null || recortado || !enTrazo) {
                costa += `M${p} `;
                enTrazo = true;
            } else {
                costa += `L${p} `;
            }
            if (recortado) enTrazo = false;
            previo = [lon, lat];
        }
        tierra += 'Z ';
    }
    const [px, py] = aPx(PUERTO_PENASCO.lon, PUERTO_PENASCO.lat);
    // El Alto Golfo, entre San Felipe y Puerto Peñasco
    const [ax, ay] = aPx(-114.45, 31.05);
    return { ancho, alto, tierra, costa, px, py, ax, ay };
})();

/** Un fondo de puntos (como las partículas) */
function Puntos({ id, color, paso = 6, radio = 1.1, opacidad = 0.9 }: { id: string; color: string; paso?: number; radio?: number; opacidad?: number }) {
    return (
        <pattern id={id} width={paso} height={paso} patternUnits="userSpaceOnUse">
            <circle cx={paso / 2} cy={paso / 2} r={radio} fill={color} fillOpacity={opacidad} />
        </pattern>
    );
}

export function DibujoPortada({ tipo, id }: { tipo: Ilustracion; id: string }) {
    const u = (n: string) => `${n}-${id}`;
    return (
        <svg viewBox="0 0 400 250" preserveAspectRatio="xMidYMid slice" className="absolute inset-0 w-full h-full" aria-hidden="true">
            <defs>
                <radialGradient id={u('luz')} cx="65%" cy="45%" r="75%">
                    <stop offset="0%" stopColor={tipo === 'gota' ? ACEITE : GOLFO} stopOpacity="0.26" />
                    <stop offset="100%" stopColor="#0B2236" stopOpacity="0" />
                </radialGradient>
                <radialGradient id={u('desvanece')} cx="50%" cy="50%" r="55%">
                    <stop offset="62%" stopColor="#fff" />
                    <stop offset="100%" stopColor="#000" />
                </radialGradient>
                <mask id={u('mascara')}>
                    <rect width="400" height="250" fill={`url(#${u('desvanece')})`} />
                </mask>
                <Puntos id={u('mar')} color={GOLFO} paso={5} radio={1} />
                <Puntos id={u('aceite')} color={ACEITE} paso={4.5} radio={1.05} />
                <Puntos id={u('tenue')} color={ESPUMA} paso={9} radio={0.8} opacidad={0.35} />
                {/* Los mismos puntos para el mapa de cerca (que va escalado 3.2 veces) */}
                <Puntos id={u('marCerca')} color={GOLFO} paso={1.6} radio={0.32} />
                <Puntos id={u('tenueCerca')} color={ESPUMA} paso={2.8} radio={0.25} opacidad={0.35} />
            </defs>
            <rect width="400" height="250" fill="#0B2236" />
            <rect width="400" height="250" fill={`url(#${u('luz')})`} />

            {(tipo === 'mapa' || tipo === 'altogolfo') && (
                <g mask={`url(#${u('mascara')})`}>
                    <g
                        transform={
                            tipo === 'mapa'
                                ? `translate(${200 - MAPA.ancho * 0.5 + 40} -26)`
                                : `translate(${255 - MAPA.ax * 3.2} ${118 - MAPA.ay * 3.2}) scale(3.2)`
                        }
                    >
                        <rect width={MAPA.ancho} height={MAPA.alto} fill={`url(#${u(tipo === 'mapa' ? 'mar' : 'marCerca')})`} />
                        <path d={MAPA.tierra} fill="#0B2236" fillRule="nonzero" />
                        <path d={MAPA.tierra} fill={`url(#${u(tipo === 'mapa' ? 'tenue' : 'tenueCerca')})`} />
                        <path
                            d={MAPA.costa}
                            fill="none"
                            stroke={ESPUMA}
                            strokeWidth={tipo === 'mapa' ? 1.3 : 0.5}
                            strokeLinejoin="round"
                            strokeLinecap="round"
                        />
                        {tipo === 'mapa' ? (
                            <>
                                <circle cx={MAPA.px} cy={MAPA.py} r="13" fill="none" stroke={ESPUMA} strokeOpacity="0.7" strokeWidth="1.2" />
                                <circle cx={MAPA.px} cy={MAPA.py} r="4.5" fill="#fff" />
                            </>
                        ) : (
                            <>
                                <ellipse cx={MAPA.ax} cy={MAPA.ay} rx="9" ry="7" fill="none" stroke="#fff" strokeOpacity="0.85" strokeWidth="0.45" strokeDasharray="1 1.4" />
                                <circle cx={MAPA.px} cy={MAPA.py} r="1.6" fill="#fff" />
                            </>
                        )}
                    </g>
                </g>
            )}

            {tipo === 'gota' && (
                <g>
                    {/* La mancha: anillos que se abren desde donde cayó */}
                    {[0, 1, 2, 3, 4].map((k) => (
                        <ellipse
                            key={k}
                            cx="270"
                            cy="196"
                            rx={36 + k * 30}
                            ry={9 + k * 8}
                            fill={k === 0 ? `url(#${u('aceite')})` : 'none'}
                            stroke={ACEITE}
                            strokeOpacity={0.55 - k * 0.1}
                            strokeWidth="1.3"
                            strokeDasharray={k === 0 ? undefined : '1.5 4'}
                        />
                    ))}
                    <path
                        d="M270 34 C 270 34 226 98 226 128 C 226 153 246 172 270 172 C 294 172 314 153 314 128 C 314 98 270 34 270 34 Z"
                        fill={`url(#${u('aceite')})`}
                        stroke={ACEITE}
                        strokeWidth="1.6"
                    />
                    <path d="M248 120 C 248 106 256 92 262 84" fill="none" stroke="#fff" strokeOpacity="0.75" strokeWidth="3" strokeLinecap="round" />
                </g>
            )}

            {tipo === 'hojas' && (
                <g fill="none" stroke="#EFE8DA" strokeLinecap="round" strokeLinejoin="round">
                    {[
                        { x: 198, y: 40, r: -9, o: 0.35 },
                        { x: 232, y: 34, r: -2, o: 0.6 },
                        { x: 266, y: 44, r: 7, o: 1 },
                    ].map((h, k) => (
                        <g key={k} transform={`translate(${h.x} ${h.y}) rotate(${h.r} 60 80)`} strokeOpacity={h.o}>
                            <rect width="120" height="160" rx="4" fill="#0B2236" fillOpacity="0.85" strokeWidth="1.6" />
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
            )}

            {tipo === 'simbolo' && (
                <g>
                    {[0, 1, 2, 3].map((k) => (
                        <circle key={k} cx="270" cy="125" r={48 + k * 24} fill="none" stroke={ESPUMA} strokeOpacity={0.4 - k * 0.08} strokeWidth="1.2" strokeDasharray={k ? '1.5 5' : undefined} />
                    ))}
                    <circle cx="270" cy="125" r="44" fill="#0B2236" />
                    <image href="/assets/simar/simbolo-grande.png" x="236" y="91" width="68" height="68" />
                </g>
            )}
        </svg>
    );
}

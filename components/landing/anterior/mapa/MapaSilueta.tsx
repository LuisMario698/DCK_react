'use client';

import { useMemo } from 'react';
import { MEXICO_PATH, VECINOS_PATH, VIEWBOX, LIMITES, proyectar } from './geometria';
import { PUERTOS, PUERTO_ACTIVO, arco } from './puertos';

/**
 * Mapa de puertos en SVG a partir de la silueta real de México (Natural
 * Earth). No usa WebGL: es la opción más ligera y funciona en cualquier equipo.
 */
export default function MapaSilueta({
    seleccionado,
    onSeleccionar,
}: {
    seleccionado: string;
    onSeleccionar: (id: string) => void;
}) {
    const puntos = useMemo(() => PUERTOS.map((p) => ({ ...p, ...proyectar(p.lat, p.lng) })), []);

    const rutas = useMemo(
        () =>
            PUERTOS.filter((p) => !p.activo).map((p) => ({
                id: p.id,
                d:
                    'M' +
                    arco(PUERTO_ACTIVO, p, 40)
                        .map(([lng, lat]) => {
                            const { x, y } = proyectar(lat, lng);
                            return `${x.toFixed(1)},${y.toFixed(1)}`;
                        })
                        .join('L'),
            })),
        []
    );

    // Retícula cada 5° (en Mercator las líneas son rectas)
    const reticula = useMemo(() => {
        const lineas: { d: string; etiqueta?: { x: number; y: number; texto: string } }[] = [];
        for (let lat = 15; lat <= 30; lat += 5) {
            const { y } = proyectar(lat, LIMITES.lonMin);
            lineas.push({ d: `M0,${y.toFixed(1)}H${VIEWBOX.ancho}`, etiqueta: { x: 8, y: y - 6, texto: `${lat}°N` } });
        }
        for (let lng = -115; lng <= -90; lng += 5) {
            const { x } = proyectar(LIMITES.latMin, lng);
            lineas.push({ d: `M${x.toFixed(1)},0V${VIEWBOX.alto}`, etiqueta: { x: x + 6, y: VIEWBOX.alto - 10, texto: `${-lng}°O` } });
        }
        return lineas;
    }, []);

    return (
        <svg
            viewBox={`0 0 ${VIEWBOX.ancho} ${VIEWBOX.alto}`}
            className="absolute inset-0 w-full h-full"
            preserveAspectRatio="xMidYMid meet"
            role="img"
            aria-label="Mapa de México con el puerto activo y los puertos de expansión"
        >
            <defs>
                <radialGradient id="silueta-oceano" cx="40%" cy="40%" r="75%">
                    <stop offset="0%" stopColor="#0b2a4a" />
                    <stop offset="60%" stopColor="#061429" />
                    <stop offset="100%" stopColor="#030712" />
                </radialGradient>
                <linearGradient id="silueta-tierra" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#0e4a5c" />
                    <stop offset="55%" stopColor="#10345c" />
                    <stop offset="100%" stopColor="#1b2a5e" />
                </linearGradient>
                <filter id="silueta-brillo" x="-20%" y="-20%" width="140%" height="140%">
                    <feGaussianBlur stdDeviation="7" />
                </filter>
                <filter id="silueta-punto" x="-200%" y="-200%" width="500%" height="500%">
                    <feGaussianBlur stdDeviation="4" />
                </filter>
            </defs>

            {/* El fondo se sale del viewBox para cubrir el espacio sobrante del contenedor */}
            <rect x={-VIEWBOX.ancho} y={-VIEWBOX.alto} width={VIEWBOX.ancho * 3} height={VIEWBOX.alto * 3} fill="#030712" />
            <rect width={VIEWBOX.ancho} height={VIEWBOX.alto} fill="url(#silueta-oceano)" />

            {/* Retícula */}
            <g stroke="#1e3a5f" strokeWidth="0.8" strokeDasharray="2 6" opacity="0.55">
                {reticula.map((l, i) => (
                    <path key={i} d={l.d} />
                ))}
            </g>
            <g fill="#38bdf8" opacity="0.35" fontSize="11" fontFamily="ui-monospace, monospace">
                {reticula.map((l, i) =>
                    l.etiqueta ? (
                        <text key={i} x={l.etiqueta.x} y={l.etiqueta.y}>
                            {l.etiqueta.texto}
                        </text>
                    ) : null
                )}
            </g>

            {/* Países vecinos */}
            <path d={VECINOS_PATH} fill="#0b1426" stroke="#1e293b" strokeWidth="1" />

            {/* México: resplandor + tierra + contorno animado */}
            <path d={MEXICO_PATH} fill="none" stroke="#22d3ee" strokeWidth="6" opacity="0.35" filter="url(#silueta-brillo)" />
            <path d={MEXICO_PATH} fill="url(#silueta-tierra)" />
            <path
                d={MEXICO_PATH}
                fill="none"
                stroke="#67e8f9"
                strokeWidth="1.3"
                strokeLinejoin="round"
                pathLength={1}
                className="mapa-silueta-contorno"
            />

            {/* Rutas desde el puerto activo */}
            <g fill="none" strokeLinecap="round">
                {rutas.map((r) => {
                    const sel = r.id === seleccionado;
                    return (
                        <g key={r.id}>
                            <path d={r.d} stroke="#22d3ee" strokeWidth={sel ? 7 : 4} opacity={sel ? 0.35 : 0.1} filter="url(#silueta-punto)" />
                            <path
                                d={r.d}
                                stroke={sel ? '#a5f3fc' : '#38bdf8'}
                                strokeWidth={sel ? 2.2 : 1.3}
                                opacity={sel ? 1 : 0.5}
                                strokeDasharray="6 8"
                                className="mapa-silueta-ruta"
                            />
                        </g>
                    );
                })}
            </g>

            {/* Puertos */}
            {puntos.map((p) => {
                const sel = p.id === seleccionado;
                return (
                    <g
                        key={p.id}
                        transform={`translate(${p.x.toFixed(1)},${p.y.toFixed(1)})`}
                        className="cursor-pointer focus:outline-none"
                        role="button"
                        tabIndex={0}
                        aria-label={`${p.nombre}, ${p.estado}. ${p.activo ? 'Puerto activo' : 'Expansión futura'}`}
                        onMouseEnter={() => onSeleccionar(p.id)}
                        onFocus={() => onSeleccionar(p.id)}
                        onClick={() => onSeleccionar(p.id)}
                    >
                        <circle r="18" fill="transparent" />
                        {p.activo ? (
                            <>
                                <circle r="8" fill="#22d3ee" opacity="0.5">
                                    <animate attributeName="r" values="8;30" dur="2.2s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.5;0" dur="2.2s" repeatCount="indefinite" />
                                </circle>
                                <circle r="8" fill="#22d3ee" opacity="0.4">
                                    <animate attributeName="r" values="8;30" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
                                    <animate attributeName="opacity" values="0.4;0" dur="2.2s" begin="1.1s" repeatCount="indefinite" />
                                </circle>
                                <circle r="10" fill="#22d3ee" opacity="0.7" filter="url(#silueta-punto)" />
                                <circle r="6.5" fill="#a5f3fc" stroke="#fff" strokeWidth="2" />
                            </>
                        ) : (
                            <>
                                {sel && <circle r="13" fill="none" stroke="#bae6fd" strokeWidth="1.5" opacity="0.9" />}
                                <circle r={sel ? 7 : 5} fill="#38bdf8" opacity="0.5" filter="url(#silueta-punto)" />
                                <circle r={sel ? 5.5 : 4} fill={sel ? '#bae6fd' : '#3b82f6'} stroke="#020617" strokeWidth="1.5" />
                            </>
                        )}
                        {(sel || p.activo) && (
                            <text
                                x={p.nombre === 'Ensenada' ? 0 : 16}
                                y={p.nombre === 'Ensenada' ? -16 : 5}
                                textAnchor={p.nombre === 'Ensenada' ? 'middle' : 'start'}
                                fill="#fff"
                                fontSize="15"
                                fontWeight="700"
                                stroke="#020617"
                                strokeWidth="4"
                                paintOrder="stroke"
                            >
                                {p.nombre}
                            </text>
                        )}
                    </g>
                );
            })}
        </svg>
    );
}

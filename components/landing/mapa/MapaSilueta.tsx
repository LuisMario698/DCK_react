import type { CSSProperties } from 'react';
import { MEXICO_PATH, VECINOS_PATH, VIEWBOX, LIMITES, proyectar } from './geometria';
import { PUERTOS, PUERTO_ACTIVO, arco } from './puertos';

/**
 * Mapa de puertos en SVG a partir de la silueta real de México (Natural Earth). Sin WebGL.
 * Tres capas que el CSS (mapa.css) mueve a distinta velocidad con el scroll: el mar y la
 * retícula al fondo, México en medio (con la plataforma y dos curvas de profundidad) y, al
 * frente, las rutas y los puertos. Entre la tierra y el frente, un velo fijo funde las orillas con
 * la franja (en vez de máscaras en capas que se mueven). El contenedor tiene la proporción del
 * viewBox (1000 × 651): los puertos van en porcentajes encima del SVG para que sus botones sean de
 * verdad.
 *
 * Todo valor que llega al HTML es texto con decimales fijos: así el servidor y el navegador
 * escriben lo mismo (sin errores de hidratación).
 */

// Dónde va el nombre de cada puerto, para que no choque con la costa, las rutas ni otro nombre.
// En el celular sólo se ven Peñasco y el elegido; Ensenada queda pegado a Peñasco y en la orilla
// de la pantalla, así que ahí su nombre sólo sale en la ficha
type Lado = 'derecha' | 'izquierda' | 'arriba' | 'abajo';
const LADO_NOMBRE: Record<string, Lado> = {
    'puerto-penasco': 'derecha',
    ensenada: 'arriba',
    guaymas: 'derecha',
    'la-paz': 'abajo',
    mazatlan: 'derecha',
    manzanillo: 'abajo',
    acapulco: 'abajo',
    veracruz: 'derecha',
    progreso: 'arriba',
};
const SIN_NOMBRE_EN_CELULAR = new Set(['ensenada']);

const pct = (n: number) => `${n.toFixed(3)}%`;

// Todo se calcula una vez al cargar el módulo: la geometría no cambia
const PUNTOS = PUERTOS.map((p) => {
    const { x, y } = proyectar(p.lat, p.lng);
    return { ...p, izq: pct((x / VIEWBOX.ancho) * 100), arr: pct((y / VIEWBOX.alto) * 100) };
});

// Las rutas salen de Peñasco en el orden de la lista (de la más cercana a la más lejana)
const RUTAS = PUERTOS.filter((p) => !p.activo).map((p, i) => ({
    id: p.id,
    orden: i,
    d:
        'M' +
        arco(PUERTO_ACTIVO, p, 40)
            .map(([lng, lat]) => {
                const { x, y } = proyectar(lat, lng);
                return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join('L'),
}));
const ORDEN_RUTA: Record<string, number> = Object.fromEntries(RUTAS.map((r) => [r.id, r.orden]));

// Sólo las costas largas: las islas chicas harían burbujas sueltas en el mar
const COSTAS_LARGAS = (MEXICO_PATH + VECINOS_PATH)
    .split('M')
    .filter((t) => t.split('L').length > 24)
    .map((t) => `M${t}`)
    .join('');

// Retícula cada 5° (en Mercator las líneas son rectas)
const RETICULA: string[] = [];
for (let lat = 15; lat <= 30; lat += 5) {
    RETICULA.push(`M-200,${proyectar(lat, LIMITES.lonMin).y.toFixed(1)}H1200`);
}
for (let lng = -115; lng <= -90; lng += 5) {
    RETICULA.push(`M${proyectar(LIMITES.latMin, lng).x.toFixed(1)},-200V900`);
}
const RETICULA_D = RETICULA.join('');

const VB = `0 0 ${VIEWBOX.ancho} ${VIEWBOX.alto}`;

export default function MapaSilueta({
    seleccionado,
    onSeleccionar,
}: {
    seleccionado: string;
    onSeleccionar: (id: string) => void;
}) {
    return (
        <div className="absolute inset-0">
            {/* Capa 1 (fondo, la más lenta): el mar y la retícula. Es más grande que el mapa para
                poder moverse sin enseñar su orilla */}
            <svg aria-hidden="true" viewBox={VB} preserveAspectRatio="xMidYMid slice" className="mp-capa mp-capa-fondo">
                <defs>
                    <radialGradient id="mp-mar" cx="30%" cy="34%" r="75%">
                        <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--simar-marea) 22%, var(--simar-abismo))' }} />
                        <stop offset="60%" style={{ stopColor: 'color-mix(in oklab, var(--simar-marea) 8%, var(--simar-abismo))' }} />
                        <stop offset="100%" style={{ stopColor: 'var(--simar-abismo)' }} />
                    </radialGradient>
                </defs>
                <rect x="-200" y="-200" width="1400" height="1100" fill="url(#mp-mar)" />
                <path d={RETICULA_D} fill="none" className="mp-reticula" />
            </svg>

            {/* Capa 2 (en medio): la plataforma, dos curvas de profundidad, los vecinos, México y
                los nombres de los mares. Las curvas son anillos que deja una máscara (trazo ancho
                blanco menos uno apenas más angosto en negro); la tierra tapa su mitad de adentro */}
            <svg aria-hidden="true" viewBox={VB} preserveAspectRatio="xMidYMid meet" className="mp-capa mp-capa-tierra">
                <defs>
                    <linearGradient id="mp-tierra" x1="0" y1="0" x2="1" y2="1">
                        <stop offset="0%" style={{ stopColor: 'color-mix(in oklab, var(--simar-mar-1) 70%, var(--simar-abismo))' }} />
                        <stop offset="100%" style={{ stopColor: 'color-mix(in oklab, var(--simar-mar-2) 80%, var(--simar-abismo))' }} />
                    </linearGradient>
                    <mask id="mp-isobatas" maskUnits="userSpaceOnUse" x="-100" y="-100" width="1200" height="860">
                        <g fill="none" strokeLinejoin="round">
                            <path d={COSTAS_LARGAS} className="mp-iso-lejos" style={{ stroke: 'white' }} />
                            <path d={COSTAS_LARGAS} strokeWidth="56" style={{ stroke: 'black' }} />
                            <path d={COSTAS_LARGAS} className="mp-iso-cerca" style={{ stroke: 'white' }} />
                            <path d={COSTAS_LARGAS} strokeWidth="26" style={{ stroke: 'black' }} />
                        </g>
                    </mask>
                </defs>
                <path d={COSTAS_LARGAS} fill="none" strokeWidth="26" strokeLinejoin="round" className="mp-plataforma" />
                <rect x="-100" y="-100" width="1200" height="860" mask="url(#mp-isobatas)" className="mp-isobatas" />
                <path d={VECINOS_PATH} className="mp-vecinos" />
                <path d={MEXICO_PATH} fill="url(#mp-tierra)" />
                <path d={MEXICO_PATH} fill="none" strokeLinejoin="round" className="mp-costa" />

                {/* Nombres de los mares: sólo en pantallas anchas, donde se leen */}
                <g className="mp-solo-ancho mp-mares" fontStyle="italic" letterSpacing="1.5">
                    <text x="196" y="414" fontSize="23" textAnchor="middle" opacity="0.7">
                        Golfo de California
                    </text>
                    <path d="M262 392 Q296 380 310 340" fill="none" strokeWidth="1.4" opacity="0.45" className="mp-guia" />
                    <text x="560" y="618" fontSize="23" textAnchor="middle" opacity="0.48">
                        Océano Pacífico
                    </text>
                    <text x="800" y="292" fontSize="23" textAnchor="middle" opacity="0.48">
                        Golfo de México
                    </text>
                </g>
            </svg>

            {/* Velo fijo: funde las orillas del mapa con la franja */}
            <div aria-hidden="true" className="mp-velo" />

            {/* Capa 3 (al frente): las rutas, que se trazan una vez con el scroll, y los puertos */}
            <div className="mp-capa mp-capa-frente">
                <svg aria-hidden="true" viewBox={VB} preserveAspectRatio="xMidYMid meet" className="absolute inset-0 w-full h-full">
                    <g fill="none" strokeLinecap="round">
                        {RUTAS.map((r) => {
                            const sel = r.id === seleccionado;
                            return (
                                <g key={r.id} className="mp-ruta" data-sel={sel} data-i={r.orden}>
                                    {sel && <path d={r.d} pathLength={1} className="mp-ruta-halo" />}
                                    <path d={r.d} pathLength={1} className="mp-ruta-linea" />
                                </g>
                            );
                        })}
                    </g>
                </svg>

                {/* Puertos: atajos para el ratón y el dedo. Con teclado se eligen en la lista (por
                    eso aquí no reciben foco con Tab y no se repiten para el lector) */}
                <div aria-hidden="true" className="absolute inset-0">
                    {PUNTOS.map((p) => {
                        const sel = p.id === seleccionado;
                        const estilo: CSSProperties = { left: p.izq, top: p.arr };
                        return (
                            <button
                                key={p.id}
                                type="button"
                                tabIndex={-1}
                                onClick={() => onSeleccionar(p.id)}
                                data-sel={sel}
                                data-activo={p.activo}
                                data-i={ORDEN_RUTA[p.id] ?? 0}
                                className="mp-puerto simar-toque-libre"
                                style={estilo}
                            >
                                <span className="mp-puerto-marca">
                                    {p.activo && (
                                        <>
                                            <span className="mp-anillo" />
                                            <span className="mp-pulso" />
                                            <span className="mp-pulso mp-pulso-2" />
                                        </>
                                    )}
                                    <span className="mp-punto" />
                                </span>
                                <span
                                    className="mp-nombre"
                                    data-lado={LADO_NOMBRE[p.id] ?? 'derecha'}
                                    data-celular={SIN_NOMBRE_EN_CELULAR.has(p.id) ? 'no' : 'si'}
                                >
                                    {p.nombre}
                                </span>
                            </button>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

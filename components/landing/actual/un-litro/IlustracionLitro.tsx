import type { CSSProperties, ReactNode } from 'react';

/**
 * El dibujo de «Un litro» (plano y editorial, en la paleta de SiMAR; luz desde arriba a la
 * izquierda: tapa clara, cara izquierda media, cara derecha oscura). Dos escenas en el mismo lienzo:
 * A) la botella de 1 L de aceite de motor usado se inclina y suelta una gota que mancha el agua;
 * B) la cámara se aleja: la botella queda como un punto a los pies de una persona de 1.7 m, junto a
 *    una casa de dos pisos y a un cubo de agua de 10 m por lado (isométrico), que se llena.
 *
 * Rendimiento: cada parte que se mueve es su propia capa (un div con su SVG), así el navegador la
 * mueve con transform/opacity sin volver a pintar el dibujo. Sólo el aceite de adentro de la
 * botella gira dentro de su SVG (un dibujo chico, sólo mientras se inclina). Las cotas van en HTML
 * para que se lean igual en celular. Todo se mueve desde un-litro.css; sin soporte o con «reducir
 * movimiento» se ve quieta la escena B, ya llena.
 */

// ── Lienzo y proyección isométrica ─────────────────────────────
const ANCHO = 640;
const ALTO = 450;
const U = 15; // px por metro
const CX = U * Math.cos(Math.PI / 6);
const CY = U / 2;
const OX = 395; // esquina de enfrente del cubo, al ras del suelo
const OY = 385;

const r1 = (n: number) => Math.round(n * 10) / 10;
/** Punto del suelo (x a la derecha-atrás, y a la izquierda-atrás) y altura z, en metros */
const xy = (x: number, y: number, z = 0): [number, number] => [OX + (x - y) * CX, OY - (x + y) * CY - z * U];
const p = (x: number, y: number, z = 0) => xy(x, y, z).map(r1).join(',');
const poli = (...pts: [number, number, number?][]) => pts.map(([x, y, z]) => p(x, y, z ?? 0)).join(' ');
const pct = (v: number, total: number) => `${+((v / total) * 100).toFixed(2)}%`;

/** Mueve un trazo escrito con comandos absolutos (M L H V Q C A Z) */
function mover(d: string, dx: number, dy: number) {
    const fichas = d.match(/[MLHVQCAZ]|-?\d*\.?\d+/g) ?? [];
    let cmd = '';
    let i = 0;
    const out: string[] = [];
    for (const f of fichas) {
        if (/[A-Z]/.test(f)) {
            cmd = f;
            i = 0;
            out.push(f);
            continue;
        }
        const n = parseFloat(f);
        let v = n;
        if (cmd === 'H') v = n + dx;
        else if (cmd === 'V') v = n + dy;
        else if (cmd === 'A') {
            const k = i % 7;
            if (k === 5) v = n + dx;
            if (k === 6) v = n + dy;
        } else v = n + (i % 2 === 0 ? dx : dy);
        out.push(String(r1(v)));
        i++;
    }
    return out.join(' ');
}

// ── Escena A: la botella (dibujada en su sitio: esquina sup. izq. en 140,40) ──
const BX = 140;
const BY = 40;
const b = (d: string) => mover(d, BX, BY);
/** Eje de giro de la botella (su centro) y del aceite, que gira al revés para quedar nivelado */
const PIVOTE: [number, number] = [BX + 75, BY + 165];
const INCLINACION = 48; // la misma de ul-inclina / ul-nivela en un-litro.css
/** Punta del pico ya inclinada: de ahí sale la gota */
const PICO = (() => {
    const [lx, ly] = [117 - 75, -14 - 165];
    const a = (INCLINACION * Math.PI) / 180;
    return [PIVOTE[0] + lx * Math.cos(a) - ly * Math.sin(a), PIVOTE[1] + lx * Math.sin(a) + ly * Math.cos(a)] as const;
})();
const AGUA_A: [number, number] = [r1(PICO[0]), 392];

const CUERPO = b(
    'M 0 282 V 72 Q 0 46 24 42 L 90 32 Q 100 30 100 22 V 14 H 134 V 28 Q 134 38 142 46 Q 150 54 150 66 V 282 Q 150 300 132 300 H 18 Q 0 300 0 282 Z'
);
const AGARRE = b('M 26 56 H 66 A 10 10 0 0 1 66 76 H 26 A 10 10 0 0 1 26 56 Z');
// La gota (1.4 veces la de un dibujo de 10 px: se lee en celular)
const GOTA = 'M 0 -14 C 6.3 -4.9 9.8 0.7 9.8 6.3 A 9.8 9.8 0 0 1 -9.8 6.3 C -9.8 0.7 -6.3 -4.9 0 -14 Z';
const NIVEL = BY + 82; // la superficie del aceite

// ── Escena B: el cubo de 10 m, la casa y la persona ─────────────
const SILUETA = poli([0, 10], [0, 0], [10, 0], [10, 0, 10], [10, 10, 10], [0, 10, 10]);
const CARA_IZQ = poli([0, 10], [0, 0], [0, 0, 10], [0, 10, 10]);
const CARA_DER = poli([0, 0], [10, 0], [10, 0, 10], [0, 0, 10]);
const CARA_TAPA = poli([0, 0, 10], [10, 0, 10], [10, 10, 10], [0, 10, 10]);
/** El recorte del agua, en % del lienzo (CSS clip-path: no se anima, sólo recorta) */
const RECORTE_CUBO = `polygon(${[
    [0, 10, 0],
    [0, 0, 0],
    [10, 0, 0],
    [10, 0, 10],
    [10, 10, 10],
    [0, 10, 10],
]
    .map(([x, y, z]) => {
        const [sx, sy] = xy(x, y, z);
        return `${pct(sx, ANCHO)} ${pct(sy, ALTO)}`;
    })
    .join(', ')})`;

// Casa de dos pisos, techo plano con pretil: 7.5 × 6 m, 6.6 m de alto
const C = { x0: -7, x1: 0.5, y0: 11.6, y1: 17.6, z: 6.6 };
/** Ventana o puerta en la cara izquierda (plano x = x0): de y a y2, de z a z2 */
const enIzq = (y: number, y2: number, z: number, z2: number) => poli([C.x0, y, z], [C.x0, y2, z], [C.x0, y2, z2], [C.x0, y, z2]);
/** …y en la cara derecha (plano y = y0): de x a x2 */
const enDer = (x: number, x2: number, z: number, z2: number) => poli([x, C.y0, z], [x2, C.y0, z], [x2, C.y0, z2], [x, C.y0, z2]);

// Tinaco de 1,100 L en la azotea (Ø 1.1 m, 1.2 m de alto); el círculo en isométrico es una elipse
const TINACO = (() => {
    const [cx, abajo] = xy(-5.3, 15.4, C.z);
    const rx = r1(0.55 * U * Math.SQRT2 * Math.cos(Math.PI / 6));
    const ry = r1(0.55 * U * Math.SQRT2 * 0.5);
    const arriba = r1(abajo - 1.2 * U);
    const [x0, x1, y0] = [r1(cx - rx), r1(cx + rx), r1(abajo)];
    return {
        cx: r1(cx),
        arriba,
        rx,
        ry,
        cuerpo: `M ${x0} ${arriba} V ${y0} A ${rx} ${ry} 0 0 0 ${x1} ${y0} V ${arriba} Z`,
        // La mitad con luz (izquierda)
        luz: `M ${x0} ${arriba} V ${y0} A ${rx} ${ry} 0 0 0 ${r1(cx - rx * 0.3)} ${r1(abajo + ry * 0.95)} V ${r1(arriba + ry * 0.95)} Z`,
    };
})();

// Persona de 1.7 m:silueta de frente en 170 unidades (pies en 0), reducida a la escala
const PERSONA_EN: [number, number] = [-7, 4];
const PERSONA =
    'M -6 -147 H 6 L 7 -142 Q 21 -141 23 -134 L 26 -86 Q 26 -80 21 -81 L 18 -84 L 16 -92 L 13 -4 Q 13 0 9 0 H 4 Q 2 0 2 -4 L 1 -84 H -1 L -2 -4 Q -2 0 -4 0 H -9 Q -13 0 -13 -4 L -16 -92 L -18 -84 L -21 -81 Q -26 -80 -26 -86 L -23 -134 Q -21 -141 -7 -142 Z';
const [PX, PY] = xy(...PERSONA_EN);
// La botella de 1 L a sus pies (0.25 m: casi un punto). Ahí se centra el acercamiento
const FOCO: [number, number] = [r1(PX + 10), r1(PY + 1)];

// Cotas
const [RX, RYabajo] = xy(10, 0, 0);
const RYarriba = xy(10, 0, 10)[1];
const COTA_X = RX + 17;
const DESFASE = -1.5; // la cota de abajo, corrida hacia enfrente (y negativa)
const [AX0, AY0] = xy(0, DESFASE);
const [AX1, AY1] = xy(10, DESFASE);

/** Variables para un-litro.css: dónde se centra cada movimiento, en % del lienzo */
const VARIABLES = {
    '--ul-foco': `${pct(FOCO[0], ANCHO)} ${pct(FOCO[1], ALTO)}`,
    '--ul-pivote': `${pct(PIVOTE[0], ANCHO)} ${pct(PIVOTE[1], ALTO)}`,
    '--ul-impacto': `${pct(AGUA_A[0], ANCHO)} ${pct(AGUA_A[1], ALTO)}`,
    '--ul-caida': pct(AGUA_A[1] - (PICO[1] + 15), ALTO),
    '--ul-llenado': pct(10 * U, ALTO),
    '--ul-recorte': RECORTE_CUBO,
} as CSSProperties;

function Lienzo({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <svg viewBox={`0 0 ${ANCHO} ${ALTO}`} className={`ul-lienzo ${className ?? ''}`} aria-hidden="true" focusable="false">
            {children}
        </svg>
    );
}

/** Rótulo en HTML, puesto en % del lienzo (se lee a 15–17 px en cualquier tamaño) */
function Rotulo({ x, y, children, className }: { x: number; y: number; children: ReactNode; className?: string }) {
    return (
        <span className={`ul-rotulo ${className ?? ''}`} style={{ left: pct(x, ANCHO), top: pct(y, ALTO) }}>
            {children}
        </span>
    );
}

export function IlustracionLitro() {
    const [gx, gy] = [r1(PICO[0]), r1(PICO[1] + 15)];
    return (
        <div
            className="ul-ilus"
            style={VARIABLES}
            role="img"
            aria-label="Una botella de un litro de aceite usado junto a una persona de 1.7 metros, una casa de dos pisos y un cubo de agua de 10 metros por lado."
        >
            {/* ── Escena A: la botella y la gota ─────────────────────────── */}
            <div className="ul-escena ul-escena-a">
                {/* El agua, vista de lado: una lámina con su borde de luz */}
                <Lienzo>
                    <ellipse cx={AGUA_A[0]} cy={AGUA_A[1]} rx="206" ry="34" fill="var(--simar-mar-2)" fillOpacity="0.9" />
                    <ellipse cx={AGUA_A[0]} cy={AGUA_A[1] - 3} rx="196" ry="29" fill="var(--simar-mar-1)" fillOpacity="0.85" />
                    <ellipse cx={AGUA_A[0]} cy={AGUA_A[1] - 3} rx="196" ry="29" fill="none" stroke="var(--simar-espuma)" strokeOpacity="0.45" strokeWidth="1.5" />
                    <ellipse cx={AGUA_A[0]} cy={AGUA_A[1] - 2} rx="132" ry="18" fill="none" stroke="var(--simar-espuma)" strokeOpacity="0.16" strokeWidth="1.5" />
                    <path
                        d={`M ${AGUA_A[0] - 170} ${AGUA_A[1] - 12} Q ${AGUA_A[0] - 110} ${AGUA_A[1] - 30} ${AGUA_A[0] - 20} ${AGUA_A[1] - 31}`}
                        fill="none"
                        stroke="var(--simar-espuma)"
                        strokeOpacity="0.5"
                        strokeWidth="2"
                        strokeLinecap="round"
                    />
                </Lienzo>

                {/* La mancha que deja la gota (se queda) y las dos ondas */}
                <div className="ul-capa-ilus ul-mancha">
                    <Lienzo>
                        <ellipse cx={AGUA_A[0]} cy={AGUA_A[1]} rx="70" ry="11.5" fill="var(--simar-aceite)" fillOpacity="0.38" />
                        <ellipse cx={AGUA_A[0] - 6} cy={AGUA_A[1] - 1} rx="40" ry="6.5" fill="var(--simar-aceite)" fillOpacity="0.3" />
                    </Lienzo>
                </div>
                <div className="ul-capa-ilus ul-onda ul-onda-1">
                    <Lienzo>
                        <ellipse cx={AGUA_A[0]} cy={AGUA_A[1]} rx="48" ry="8" fill="none" stroke="var(--simar-aceite)" strokeWidth="2" />
                    </Lienzo>
                </div>
                <div className="ul-capa-ilus ul-onda ul-onda-2">
                    <Lienzo>
                        <ellipse cx={AGUA_A[0]} cy={AGUA_A[1]} rx="104" ry="17" fill="none" stroke="var(--simar-espuma)" strokeOpacity="0.75" strokeWidth="1.5" />
                    </Lienzo>
                </div>

                {/* La gota: nace en el pico de la botella inclinada y cae */}
                <div className="ul-capa-ilus ul-gota">
                    <Lienzo>
                        <path
                            d={mover(GOTA, gx, gy)}
                            fill="var(--simar-aceite)"
                        />
                        <path
                            d={mover(GOTA, gx, gy)}
                            fill="var(--simar-abismo)"
                            fillOpacity="0.14"
                        />
                        <ellipse cx={gx - 3.6} cy={gy + 4} rx="2.2" ry="3.6" fill="var(--simar-franja-texto-2)" fillOpacity="0.7" />
                    </Lienzo>
                </div>

                {/* La botella */}
                <div className="ul-capa-ilus ul-botella">
                    <Lienzo>
                        <defs>
                            <clipPath id="ul-recorte-botella">
                                <path d={`${CUERPO} ${AGARRE}`} clipRule="evenodd" />
                            </clipPath>
                        </defs>
                        <g clipPath="url(#ul-recorte-botella)">
                            {/* Plástico vacío: casi transparente */}
                            <rect x={BX - 10} y={BY} width="170" height="310" fill="var(--simar-franja-texto-2)" fillOpacity="0.13" />
                            {/* El aceite usado: ámbar oscuro, nivelado mientras la botella se inclina */}
                            <g className="ul-aceite" style={{ transformOrigin: `${PIVOTE[0]}px ${PIVOTE[1]}px` }}>
                                <rect x={BX - 160} y={NIVEL} width="470" height="420" fill="var(--simar-aceite)" />
                                <rect x={BX - 160} y={NIVEL} width="470" height="420" fill="var(--simar-abismo)" fillOpacity="0.14" />
                                {/* Menisco: la superficie clara y su borde */}
                                <rect x={BX - 160} y={NIVEL} width="470" height="3" fill="var(--simar-aceite)" />
                                <rect x={BX - 160} y={NIVEL + 3} width="470" height="1.5" fill="var(--simar-abismo)" fillOpacity="0.25" />
                            </g>
                            {/* Sombra del lado derecho y brillo del izquierdo (con la botella) */}
                            <rect x={BX + 118} y={BY} width="40" height="310" fill="var(--simar-abismo)" fillOpacity="0.26" />
                            <rect x={BX + 9} y={BY + 88} width="7" height="196" rx="3.5" fill="var(--simar-franja-texto-2)" fillOpacity="0.4" />
                            <rect x={BX + 20} y={BY + 96} width="3" height="140" rx="1.5" fill="var(--simar-franja-texto-2)" fillOpacity="0.22" />
                        </g>
                        <path
                            d={`${CUERPO} ${AGARRE}`}
                            fillRule="evenodd"
                            fill="none"
                            stroke="var(--simar-franja-texto-2)"
                            strokeOpacity="0.92"
                            strokeWidth="2.5"
                            strokeLinejoin="round"
                        />
                        {/* Costura del molde */}
                        <path d={b('M 75 300 V 284')} stroke="var(--simar-franja-texto-2)" strokeOpacity="0.35" strokeWidth="1.5" strokeLinecap="round" />

                        {/* Etiqueta */}
                        <rect x={BX + 12} y={BY + 146} width="126" height="102" rx="8" fill="var(--simar-franja-texto-2)" />
                        <path d={b('M 114 146 H 130 Q 138 146 138 154 V 240 Q 138 248 130 248 H 114 Z')} fill="var(--simar-abismo)" fillOpacity="0.1" />
                        <rect x={BX + 24} y={BY + 160} width="26" height="3" rx="1.5" fill="var(--simar-golfo)" />
                        <text
                            x={BX + 22}
                            y={BY + 210}
                            fill="var(--simar-abismo)"
                            fontSize="46"
                            fontWeight="800"
                            letterSpacing="-1.5"
                            fontFamily="inherit"
                        >
                            1 L
                        </text>
                        <rect x={BX + 24} y={BY + 222} width="70" height="5" rx="2.5" fill="var(--simar-abismo)" fillOpacity="0.32" />
                        <rect x={BX + 24} y={BY + 232} width="48" height="5" rx="2.5" fill="var(--simar-abismo)" fillOpacity="0.2" />

                        {/* Tapa con pico vertedor */}
                        <rect x={BX + 100} y={BY + 16} width="34" height="8" fill="var(--simar-franja-texto-2)" fillOpacity="0.5" />
                        <rect x={BX + 96} y={BY - 2} width="42" height="20" rx="4" fill="var(--simar-golfo)" />
                        <rect x={BX + 126} y={BY - 2} width="12" height="20" rx="4" fill="var(--simar-abismo)" fillOpacity="0.28" />
                        <path
                            d={b('M 104 2 V 14 M 111 2 V 14 M 118 2 V 14 M 125 2 V 14 M 132 2 V 14')}
                            stroke="var(--simar-abismo)"
                            strokeOpacity="0.3"
                            strokeWidth="2"
                            strokeLinecap="round"
                        />
                        <path d={b('M 111 -2 L 113.5 -13 Q 114 -15 116 -15 H 118 Q 120 -15 120.5 -13 L 123 -2 Z')} fill="var(--simar-golfo)" />
                        <path d={b('M 117 -2 L 118 -15 Q 120 -15 120.5 -13 L 123 -2 Z')} fill="var(--simar-abismo)" fillOpacity="0.25" />
                    </Lienzo>
                </div>
            </div>

            {/* ── Escena B: la escala ────────────────────────────────────── */}
            <div className="ul-escena ul-escena-b">
                <Lienzo>
                    {/* Sombras de contacto */}
                    <polygon points={poli([-0.6, -0.6], [10.6, -0.6], [10.6, 10.6], [-0.6, 10.6])} fill="var(--simar-abismo)" fillOpacity="0.55" />
                    <polygon points={poli([C.x0 - 0.5, C.y0 - 0.5], [C.x1 + 0.5, C.y0 - 0.5], [C.x1 + 0.5, C.y1 + 0.5], [C.x0 - 0.5, C.y1 + 0.5])} fill="var(--simar-abismo)" fillOpacity="0.55" />

                    {/* La casa de dos pisos */}
                    <polygon points={poli([C.x0, C.y0], [C.x0, C.y1], [C.x0, C.y1, C.z], [C.x0, C.y0, C.z])} fill="var(--simar-franja-texto-3)" />
                    <polygon points={poli([C.x0, C.y0], [C.x1, C.y0], [C.x1, C.y0, C.z], [C.x0, C.y0, C.z])} fill="var(--simar-franja-texto-3)" />
                    <polygon points={poli([C.x0, C.y0], [C.x1, C.y0], [C.x1, C.y0, C.z], [C.x0, C.y0, C.z])} fill="var(--simar-abismo)" fillOpacity="0.38" />
                    <polygon points={poli([C.x0, C.y0, C.z], [C.x1, C.y0, C.z], [C.x1, C.y1, C.z], [C.x0, C.y1, C.z])} fill="var(--simar-franja-texto-2)" />
                    {/* Pretil: la azotea hundida */}
                    <polygon
                        points={poli([C.x0 + 0.35, C.y0 + 0.35, C.z], [C.x1 - 0.35, C.y0 + 0.35, C.z], [C.x1 - 0.35, C.y1 - 0.35, C.z], [C.x0 + 0.35, C.y1 - 0.35, C.z])}
                        fill="var(--simar-franja-texto-3)"
                    />
                    {/* Tinaco en la azotea */}
                    <path d={TINACO.cuerpo} fill="var(--simar-abismo)" fillOpacity="0.9" />
                    <path d={TINACO.luz} fill="var(--simar-franja-texto-3)" fillOpacity="0.35" />
                    <ellipse cx={TINACO.cx} cy={TINACO.arriba} rx={TINACO.rx} ry={TINACO.ry} fill="var(--simar-mar-2)" />
                    <ellipse cx={TINACO.cx} cy={TINACO.arriba} rx={r1(TINACO.rx * 0.42)} ry={r1(TINACO.ry * 0.42)} fill="var(--simar-abismo)" fillOpacity="0.85" />
                    {/* Losa entre pisos */}
                    <polygon points={poli([C.x0, C.y0, 3.2], [C.x0, C.y1, 3.2], [C.x0, C.y1, 3.45], [C.x0, C.y0, 3.45])} fill="var(--simar-franja-texto-2)" fillOpacity="0.55" />
                    <polygon points={poli([C.x0, C.y0, 3.2], [C.x1, C.y0, 3.2], [C.x1, C.y0, 3.45], [C.x0, C.y0, 3.45])} fill="var(--simar-franja-texto-2)" fillOpacity="0.3" />
                    {/* Ventanas y puerta */}
                    <g fill="var(--simar-abismo)" fillOpacity="0.62">
                        <polygon points={enIzq(12.7, 14.1, 1.1, 2.5)} />
                        <polygon points={enIzq(15.2, 16.6, 1.1, 2.5)} />
                        <polygon points={enIzq(12.7, 14.1, 4.3, 5.7)} />
                        <polygon points={enIzq(15.2, 16.6, 4.3, 5.7)} />
                    </g>
                    <g fill="var(--simar-abismo)" fillOpacity="0.7">
                        <polygon points={enDer(-5.8, -4.2, 1.1, 2.5)} />
                        <polygon points={enDer(-5.8, -4.2, 4.3, 5.7)} />
                        <polygon points={enDer(-2.6, -1.0, 4.3, 5.7)} />
                    </g>
                    <polygon points={enDer(-2.4, -1.2, 0, 2.3)} fill="var(--simar-mar-1)" />

                    {/* El cubo vacío: vidrio apenas visible y aristas de atrás */}
                    <polygon points={SILUETA} fill="var(--simar-franja-texto-2)" fillOpacity="0.05" />
                    <path
                        d={`M ${p(10, 10)} L ${p(0, 10)} M ${p(10, 10)} L ${p(10, 0)} M ${p(10, 10)} L ${p(10, 10, 10)}`}
                        fill="none"
                        stroke="var(--simar-espuma)"
                        strokeOpacity="0.4"
                        strokeWidth="1.25"
                        strokeDasharray="4 5"
                    />

                    {/* La persona y su cota */}
                    <ellipse cx={PX} cy={PY} rx="7" ry="2.2" fill="var(--simar-abismo)" fillOpacity="0.6" />
                    <path d={PERSONA} transform={`translate(${r1(PX)} ${r1(PY)}) scale(0.15)`} fill="var(--simar-franja-texto-2)" />
                    <circle cx={r1(PX)} cy={r1(PY - 23.7)} r="1.65" fill="var(--simar-franja-texto-2)" />
                    <path
                        d={`M ${r1(PX - 9)} ${r1(PY)} V ${r1(PY - 25.5)} M ${r1(PX - 11.5)} ${r1(PY)} H ${r1(PX - 6.5)} M ${r1(PX - 11.5)} ${r1(PY - 25.5)} H ${r1(PX - 6.5)}`}
                        stroke="var(--simar-franja-texto-2)"
                        strokeOpacity="0.7"
                        strokeWidth="1"
                    />

                    {/* La botella de 1 L, a escala, y su aro */}
                    <rect x={FOCO[0] - 1.2} y={FOCO[1] - 3.2} width="2.4" height="3.6" rx="0.5" fill="var(--simar-aceite)" />
                    <circle cx={FOCO[0]} cy={FOCO[1] - 1.4} r="6.5" fill="none" stroke="var(--simar-aceite)" strokeWidth="1.25" />
                </Lienzo>

                {/* El agua: el prisma sube dentro del cubo (el recorte se queda quieto) */}
                <div className="ul-agua-recorte">
                    <div className="ul-agua">
                        <Lienzo>
                            <polygon points={CARA_IZQ} fill="var(--simar-golfo)" fillOpacity="0.6" />
                            <polygon points={CARA_DER} fill="var(--simar-mar-1)" fillOpacity="0.95" />
                            <polygon points={CARA_TAPA} fill="var(--simar-espuma)" fillOpacity="0.74" />
                            {/* La superficie vista de lado: una franja clara bajo la tapa */}
                            <polygon points={poli([0, 10, 9.55], [0, 0, 9.55], [0, 0, 10], [0, 10, 10])} fill="var(--simar-espuma)" fillOpacity="0.35" />
                            <polygon points={poli([0, 0, 9.55], [10, 0, 9.55], [10, 0, 10], [0, 0, 10])} fill="var(--simar-espuma)" fillOpacity="0.22" />
                            {/* Brillo en la cara con luz y destellos en la superficie */}
                            <polygon points={poli([0, 8.2, 0.9], [0, 7.5, 0.9], [0, 7.5, 8.6], [0, 8.2, 8.6])} fill="var(--simar-espuma)" fillOpacity="0.16" />
                            <path
                                d={`M ${p(2.6, 3.4, 10)} L ${p(5.2, 3.4, 10)} M ${p(4.6, 6.4, 10)} L ${p(7.8, 6.4, 10)}`}
                                stroke="var(--simar-franja-texto-2)"
                                strokeOpacity="0.6"
                                strokeWidth="1.6"
                                strokeLinecap="round"
                            />
                        </Lienzo>
                    </div>
                </div>

                {/* Aristas de enfrente y cotas */}
                <Lienzo>
                    <polygon points={SILUETA} fill="none" stroke="var(--simar-espuma)" strokeOpacity="0.95" strokeWidth="1.75" strokeLinejoin="round" />
                    <path
                        d={`M ${p(0, 0, 10)} L ${p(0, 10, 10)} M ${p(0, 0, 10)} L ${p(10, 0, 10)} M ${p(0, 0, 10)} L ${p(0, 0)}`}
                        fill="none"
                        stroke="var(--simar-espuma)"
                        strokeOpacity="0.95"
                        strokeWidth="1.75"
                    />
                    <g stroke="var(--simar-franja-texto-2)" strokeOpacity="0.75" strokeWidth="1.1" strokeLinecap="round" fill="none">
                        {/* Alto */}
                        <path d={`M ${r1(RX + 5)} ${r1(RYarriba)} H ${r1(COTA_X + 5)} M ${r1(RX + 5)} ${r1(RYabajo)} H ${r1(COTA_X + 5)}`} strokeOpacity="0.4" />
                        <path d={`M ${r1(COTA_X)} ${r1(RYarriba)} V ${r1(RYabajo)}`} />
                        {/* Ancho (sobre la arista de abajo, corrida hacia enfrente) */}
                        <path d={`M ${p(0, -0.3)} L ${p(0, DESFASE - 0.4)} M ${p(10, -0.3)} L ${p(10, DESFASE - 0.4)}`} strokeOpacity="0.4" />
                        <path d={`M ${r1(AX0)} ${r1(AY0)} L ${r1(AX1)} ${r1(AY1)}`} />
                    </g>
                    {/* Remates de las cotas: puntos */}
                    <g fill="var(--simar-franja-texto-2)" fillOpacity="0.85">
                        <circle cx={r1(COTA_X)} cy={r1(RYarriba)} r="2.2" />
                        <circle cx={r1(COTA_X)} cy={r1(RYabajo)} r="2.2" />
                        <circle cx={r1(AX0)} cy={r1(AY0)} r="2.2" />
                        <circle cx={r1(AX1)} cy={r1(AY1)} r="2.2" />
                    </g>
                </Lienzo>

                <div className="ul-rotulos">
                    <Rotulo x={COTA_X + 9} y={(RYarriba + RYabajo) / 2} className="ul-rotulo-inicio">
                        10 m
                    </Rotulo>
                    <Rotulo x={(AX0 + AX1) / 2 + 9} y={(AY0 + AY1) / 2 + 15} className="ul-rotulo-inclinado">
                        10 m
                    </Rotulo>
                    <Rotulo x={PX - 21} y={PY - 12.5} className="ul-rotulo-fin">
                        1.7 m
                    </Rotulo>
                    <Rotulo x={FOCO[0] + 12} y={FOCO[1] - 2} className="ul-rotulo-inicio ul-rotulo-aceite">
                        1 L
                    </Rotulo>
                </div>
            </div>
        </div>
    );
}

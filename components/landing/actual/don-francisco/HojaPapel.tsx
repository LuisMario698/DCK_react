import { Caveat } from 'next/font/google';
import { FIRMA_ENTREGA, FIRMA_ENTREGA_RAYA } from './ManifiestoDigital';

// Letra a mano para lo que se anotó en la hoja (sólo esta ilustración la usa). Queda muy abajo
// del pliegue: no se precarga y, mientras llega, se ve la de respaldo (swap)
const letra = Caveat({ subsets: ['latin'], display: 'swap', preload: false, fallback: ['cursive'] });

/**
 * Colores fijos: la hoja y la tabla son objetos físicos y no cambian con el modo oscuro.
 * Salen de los tonos claros de SiMAR (abismo, pizarra, marea, coral, aceite) mezclados a mano.
 */
const C = {
    tablaLuz: '#B98C61',
    tablaSombra: '#7E5838',
    vetas: '#6A472B',
    hoja: '#FBF5E6',
    enves: '#EEE3C8',
    abismo: '#0B2236',
    impreso: '#2B3A48',
    regla: '#8E8676',
    tinta: '#1D3F94',
    sello: '#A63F0E',
    cafe: '#8A5A2B',
    acero: '#6B7785',
    aceroOscuro: '#3E5163',
} as const;

/** La hoja con la esquina de abajo doblada (la esquina se ve como una oreja encima) */
const HOJA = 'M30 46 H370 V468 L342 496 H30 Z';

/**
 * La hoja en papel: el manifiesto como se llenaba antes, en una tabla con broche. Doblada en
 * tres, con la esquina doblada, el aro de una taza, una corrección y el sello de recibido.
 * Pocos nodos y sin filtros: las sombras son capas con poca opacidad.
 */
export function HojaPapel() {
    const mano = { fontFamily: letra.style.fontFamily } as const;

    return (
        <svg viewBox="0 0 400 520" className="df-svg" aria-hidden="true" focusable="false">
            <defs>
                <linearGradient id="df-p-tabla" x1="0" y1="0" x2="0.9" y2="1">
                    <stop offset="0" stopColor={C.tablaLuz} />
                    <stop offset="1" stopColor={C.tablaSombra} />
                </linearGradient>
                <radialGradient id="df-p-vineta" cx="0.46" cy="0.42" r="0.78">
                    <stop offset="0.5" stopColor={C.cafe} stopOpacity="0" />
                    <stop offset="1" stopColor={C.cafe} stopOpacity="0.2" />
                </radialGradient>
                {/* Un doblez: sombra que baja hasta el pliegue y luz justo después */}
                <linearGradient id="df-p-pliegue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor={C.abismo} stopOpacity="0" />
                    <stop offset="0.5" stopColor={C.abismo} stopOpacity="0.08" />
                    <stop offset="0.5" stopColor="#fff" stopOpacity="0.55" />
                    <stop offset="1" stopColor="#fff" stopOpacity="0" />
                </linearGradient>
                <linearGradient id="df-p-acero" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#F3F5F7" />
                    <stop offset="0.5" stopColor="#C4CBD2" />
                    <stop offset="1" stopColor="#8A95A0" />
                </linearGradient>
                <linearGradient id="df-p-oreja" x1="1" y1="0" x2="0" y2="1">
                    <stop offset="0" stopColor="#fff" stopOpacity="0.9" />
                    <stop offset="1" stopColor={C.enves} />
                </linearGradient>
            </defs>

            {/* La tabla de madera prensada, con su bisel */}
            <rect width="400" height="520" rx="20" fill="url(#df-p-tabla)" />
            <g fill="none" stroke={C.vetas} strokeOpacity="0.14" strokeWidth="1">
                <path d="M0 120 C120 112 260 128 400 116" />
                <path d="M0 300 C140 292 250 310 400 298" />
                <path d="M0 506 C130 500 270 512 400 504" />
            </g>
            <rect x="1.5" y="1.5" width="397" height="517" rx="18.5" fill="none" stroke="#fff" strokeOpacity="0.2" strokeWidth="1.5" />

            {/* La hoja, apenas chueca */}
            <g transform="rotate(-1.3 200 272)">
                {/* Sombra de contacto: tres capas que se abren */}
                <path d={HOJA} fill={C.abismo} opacity="0.06" transform="translate(4 10)" />
                <path d={HOJA} fill={C.abismo} opacity="0.1" transform="translate(2 5)" />
                <path d={HOJA} fill={C.abismo} opacity="0.14" transform="translate(0.6 1.6)" />

                <path d={HOJA} fill={C.hoja} />
                <path d={HOJA} fill="url(#df-p-vineta)" />

                {/* Doblada en tres: el tercio de en medio, un poco más oscuro, y sus dos pliegues */}
                <rect x="30" y="187" width="340" height="140" fill={C.abismo} opacity="0.025" />
                <rect x="30" y="175" width="340" height="24" fill="url(#df-p-pliegue)" />
                <rect x="30" y="315" width="340" height="24" fill="url(#df-p-pliegue)" />

                {/* Manchas de los años */}
                <ellipse cx="102" cy="470" rx="46" ry="13" fill={C.cafe} opacity="0.05" />
                <g fill={C.cafe} opacity="0.2">
                    <circle cx="72" cy="122" r="0.9" />
                    <circle cx="344" cy="158" r="1.3" />
                    <circle cx="88" cy="352" r="1.6" />
                    <circle cx="122" cy="486" r="1.1" />
                </g>

                {/* Encabezado impreso */}
                <text x="50" y="84" fontSize="12" fontWeight="800" letterSpacing="1" fill={C.impreso}>
                    MANIFIESTO DE ENTREGA-RECEPCIÓN
                </text>
                <text x="50" y="102" fontSize="10" fontWeight="600" letterSpacing="0.3" fill={C.impreso} opacity="0.78">
                    Centro de acopio · Puerto Peñasco, Son.
                </text>
                <text x="350" y="102" fontSize="13" fontWeight="800" letterSpacing="0.6" textAnchor="end" fill={C.sello} opacity="0.85">
                    Nº 0187
                </text>
                <line x1="50" y1="114" x2="350" y2="114" stroke={C.impreso} strokeWidth="1.4" />
                <line x1="50" y1="117.5" x2="350" y2="117.5" stroke={C.impreso} strokeWidth="0.6" />

                {/* La tabla de campos */}
                <g fill="none" stroke={C.impreso} strokeOpacity="0.62" strokeWidth="0.9">
                    <rect x="50" y="130" width="300" height="200" />
                    <path d="M50 174 H350 M50 218 H350 M50 262 H350 M200 174 V262" />
                </g>
                <g fill={C.impreso} opacity="0.8" fontSize="8.5" fontWeight="700" letterSpacing="1">
                    <text x="57" y="142">EMBARCACIÓN</text>
                    <text x="57" y="186">FECHA</text>
                    <text x="207" y="186">ACEITE USADO</text>
                    <text x="57" y="230">FILTROS</text>
                    <text x="207" y="230">BASURA</text>
                    <text x="57" y="274">OBSERVACIONES</text>
                </g>
                <path d="M57 300 H343 M57 320 H343" stroke={C.regla} strokeWidth="0.9" strokeDasharray="1 3" strokeLinecap="round" />

                {/* El aro de la taza, sobre las observaciones */}
                <g fill="none" stroke={C.cafe}>
                    <circle cx="316" cy="296" r="37" fill={C.cafe} fillOpacity="0.035" strokeWidth="4.5" strokeOpacity="0.1" />
                    <circle cx="316" cy="296" r="35.2" strokeWidth="1.3" strokeOpacity="0.32" strokeDasharray="96 14 58 22 120 400" />
                </g>
                <circle cx="361" cy="331" r="1.8" fill={C.cafe} opacity="0.2" />

                {/* Lo anotado a pluma */}
                <g fill={C.tinta} style={mano} fontWeight="500">
                    <text x="62" y="166" fontSize="26" transform="rotate(-1.2 62 166)">Estrella del Golfo</text>
                    <text x="62" y="210" fontSize="22" transform="rotate(-0.6 62 210)">30 / oct / 26</text>
                    <text x="212" y="210" fontSize="22" opacity="0.8">60</text>
                    <text x="244" y="211" fontSize="24" transform="rotate(-2 244 211)">70 lts</text>
                    <text x="62" y="254" fontSize="22" transform="rotate(-1 62 254)">3 pzas</text>
                    <text x="212" y="254" fontSize="22" transform="rotate(-0.8 212 254)">122 kg</text>
                    <text x="62" y="296" fontSize="20" transform="rotate(-0.5 62 296)">Sin novedad. Todo completo.</text>
                    <text x="220" y="456" fontSize="17" fontWeight="600" transform="rotate(-1 220 456)">F. Bojórquez</text>
                </g>
                {/* La corrección: el 60 tachado dos veces */}
                <path
                    d="M209 204 C216 202 226 199 236 196 M210 208 C218 206 228 203 237 200"
                    fill="none"
                    stroke={C.tinta}
                    strokeWidth="1.6"
                    strokeLinecap="round"
                />

                {/* Firmas: quien entrega (la misma que firma en SiMAR) y quien recibe */}
                <g fill="none" stroke={C.tinta} strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round">
                    <path d={FIRMA_ENTREGA} />
                    <path d={FIRMA_ENTREGA_RAYA} />
                    <path d="M230 406 C232 392 236 380 242 378 C248 377 245 390 238 397 M234 389 L254 386 M252 405 C257 388 262 379 267 382 C271 387 260 396 264 399 C270 402 277 387 283 389 C287 391 281 401 289 399 C299 396 314 391 334 387" />
                </g>
                <g stroke={C.impreso} strokeOpacity="0.7" strokeWidth="0.9">
                    <line x1="50" y1="418" x2="184" y2="418" />
                    <line x1="216" y1="418" x2="350" y2="418" />
                </g>
                <g fill={C.impreso} opacity="0.8" fontSize="8.5" fontWeight="700" letterSpacing="1">
                    <text x="50" y="432">ENTREGA · MOTORISTA</text>
                    <text x="216" y="432">RECIBE</text>
                </g>

                {/* Sello de recibido: la tinta no pega pareja */}
                <g transform="translate(296 373) rotate(-9)" fill={C.sello} stroke={C.sello} opacity="0.7">
                    <rect x="-60" y="-27" width="120" height="54" rx="6" fill="none" strokeWidth="2.4" strokeDasharray="44 3 70 2 96 4 52 3" />
                    <rect x="-54" y="-21" width="108" height="42" rx="3" fill="none" strokeWidth="0.9" />
                    <text x="0" y="-2" textAnchor="middle" fontSize="15" fontWeight="800" letterSpacing="3" stroke="none">RECIBIDO</text>
                    <text x="0" y="10" textAnchor="middle" fontSize="8.5" fontWeight="700" letterSpacing="1.6" stroke="none">30 OCT 2026</text>
                    <text x="0" y="18.5" textAnchor="middle" fontSize="6" fontWeight="700" letterSpacing="1.4" stroke="none">CENTRO DE ACOPIO</text>
                </g>

                {/* La esquina doblada: su sombra, el revés del papel y el filo del doblez */}
                <path d="M370 464 L338 496 L341 467 Z" fill={C.abismo} opacity="0.12" />
                <path d="M370 468 L342 496 L342 468 Z" fill="url(#df-p-oreja)" />
                <path d="M370 468 L342 496" stroke={C.cafe} strokeOpacity="0.35" strokeWidth="0.8" />
            </g>

            {/* El broche de metal: su sombra sobre la hoja, la placa, la quijada y el gancho */}
            <path d="M146 38 H254 L246 64 Q200 70 154 64 Z" fill={C.abismo} opacity="0.22" />
            <rect x="138" y="12" width="124" height="30" rx="9" fill="url(#df-p-acero)" stroke={C.acero} strokeWidth="0.8" />
            <path d="M146 33 H254 L246 59 Q200 65 154 59 Z" fill="url(#df-p-acero)" stroke={C.acero} strokeWidth="0.8" />
            <path d="M151 36.5 H249" stroke="#fff" strokeOpacity="0.8" strokeWidth="1.2" strokeLinecap="round" />
            <g fill={C.acero}>
                <circle cx="153" cy="24" r="3.4" />
                <circle cx="247" cy="24" r="3.4" />
            </g>
            <g fill="#fff" opacity="0.75">
                <circle cx="152" cy="23" r="1.2" />
                <circle cx="246" cy="23" r="1.2" />
            </g>
            <path d="M170 20 C172 4 228 4 230 20" fill="none" stroke={C.aceroOscuro} strokeWidth="3.6" strokeLinecap="round" />
            <path d="M171 19 C173 4.5 227 4.5 229 19" fill="none" stroke="#fff" strokeOpacity="0.45" strokeWidth="1" strokeLinecap="round" />
        </svg>
    );
}

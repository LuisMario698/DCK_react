'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowRight, CirclePlay, Mail, MapPin, Newspaper, type LucideIcon } from 'lucide-react';
import { MODO_DEMO } from '@/lib/demo/config';
import { OlaSeparador } from '../OlaSeparador';
import logoDck from '@/public/assets/landing/logo-dck.webp';
import logoItspp from '@/public/assets/logo_ITSPP.png';
import './cierre.css';

/**
 * El cierre de la landing Actual: «Hecho en Puerto Peñasco» (#proyecto) con la costa del puerto
 * dibujada, y «Tres caminos» (#participa) sobre el mar oscuro. Todo el movimiento es CSS atado al
 * scroll (cierre.css); sin soporte o con «reducir movimiento» queda quieto y completo.
 */
export function Cierre({
    alAbrirAcceso,
    rutaDemo,
}: {
    alAbrirAcceso: (rol?: 'admin' | 'recolector') => void;
    rutaDemo: string | null;
}) {
    const { locale } = useParams<{ locale: string }>();

    return (
        <>
            <HechoEnPenasco />
            <TresCaminos locale={locale ?? 'es'} alAbrirAcceso={alAbrirAcceso} rutaDemo={rutaDemo} />
        </>
    );
}

/* ── Hecho en Puerto Peñasco ─────────────────────────────────────────────── */

function HechoEnPenasco() {
    return (
        <section id="proyecto" aria-labelledby="ci-proyecto-titulo" className="relative bg-simar-papel overflow-clip">
            {/* Sale del mapa (franja oscura) */}
            <OlaSeparador color="var(--simar-abismo)" lado="arriba" />

            <div className="relative max-w-[1248px] mx-auto px-6 pt-28 md:pt-36 grid lg:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-x-16 gap-y-10 lg:items-end movil:pt-20 movil:px-5 movil:gap-y-7">
                <div>
                    <p className="ci-entra inline-flex items-center gap-2 text-[15px] font-extrabold uppercase tracking-[0.14em] text-simar-marea-tinta">
                        <MapPin aria-hidden="true" className="w-[18px] h-[18px]" strokeWidth={2.2} />
                        Quién lo hizo
                    </p>
                    <h2
                        id="ci-proyecto-titulo"
                        className="ci-entra ci-d1 mt-4 font-titular text-[clamp(42px,5.2vw,74px)] font-semibold leading-[1.0] tracking-[-0.026em] text-balance movil:mt-3 movil:text-[38px]"
                    >
                        Hecho en Puerto Peñasco.
                    </h2>
                    <p className="ci-entra ci-d2 mt-6 max-w-[42ch] text-[21px] md:text-[22px] leading-relaxed text-simar-texto-2 text-pretty movil:mt-4 movil:text-[18px]">
                        SiMAR lo crearon <strong className="font-bold text-simar-texto">DCK Conciencia y Cultura</strong>{' '}
                        —Dayanara, Coral y Karitza— y el{' '}
                        <strong className="font-bold text-simar-texto">Instituto Tecnológico Superior de Puerto Peñasco</strong>,
                        con el respaldo de la SEMARNAT.
                    </p>
                </div>

                {/* Los dos logos en una sola tarjeta blanca, partida por una línea fina. En oscuro la
                    tarjeta sigue clara: los logos tienen letras negras */}
                <ul className="ci-logos ci-entra ci-d1" aria-label="Quiénes crearon SiMAR">
                    <li className="ci-logo">
                        <Image src={logoDck} alt="" width={92} height={96} sizes="(max-width: 639px) 62px, 92px" className="ci-logo-img" />
                        <span className="ci-logo-nombre">DCK Conciencia y Cultura</span>
                    </li>
                    <li className="ci-logo">
                        <Image src={logoItspp} alt="" width={84} height={96} sizes="(max-width: 639px) 56px, 84px" className="ci-logo-img" />
                        <span className="ci-logo-nombre">ITSPP</span>
                    </li>
                </ul>
            </div>

            <Costa />
        </section>
    );
}

/* Tonos de la costa: lo lejano se aclara hacia el cielo (perspectiva del aire) y lo cercano se
   oscurece hacia Abismo. La luz viene del sol, bajo y al frente: lo que se ve es contraluz, con un
   filo cálido en las orillas que lo miran */
const C_LEJOS = 'color-mix(in oklab, var(--simar-curva) 58%, var(--simar-papel))';
const C_LOMAS = 'color-mix(in oklab, var(--simar-curva) 78%, var(--simar-mar-1))';
const C_CERRO = 'var(--simar-mar-2)';
const C_CERRO_LUZ = 'color-mix(in oklab, var(--simar-mar-1) 72%, var(--simar-curva))';
const C_CERRO_PIE = 'color-mix(in oklab, var(--simar-mar-2) 62%, var(--simar-abismo))';
const C_PUEBLO = 'color-mix(in oklab, var(--simar-mar-2) 55%, var(--simar-abismo))';
const C_FILO = 'color-mix(in oklab, var(--simar-franja-texto-2) 70%, var(--simar-aceite))';
const C_CASA = 'color-mix(in oklab, var(--simar-franja-texto-3) 50%, var(--simar-mar-2))';
const C_CASETA = 'var(--simar-franja-texto-3)';

/**
 * La costa de Puerto Peñasco al caer la tarde, vista desde el mar: el sol bajo sobre el Mar de
 * Cortés, las islas San Jorge y la sierra del Pinacate a lo lejos, el Cerro de la Ballena con su
 * faro y las casas de la ladera, el malecón con sus faroles, el muelle con dos camaroneros
 * amarrados (tangones arriba) y, al frente, el camaronero que sale con los tangones abiertos.
 * Tres planos de distancia (horizonte en 300, orilla en 318, el barco en 356) y los mismos grosores
 * de línea en todo el dibujo (3 los tangones y mástiles, 1.2 los cabos), escalados con la distancia.
 * Cuatro capas con el mismo viewBox; sólo tres se mueven con el scroll (lo lejano, la costa y el
 * barco), cada una con un único transform. El mar se queda quieto y termina en Abismo, que sigue en
 * «Tres caminos». En el celular el recorte deja al centro el sol, el barco y el faro.
 */
function Costa() {
    const caja = { viewBox: '0 0 1440 400', preserveAspectRatio: 'xMidYMax slice' } as const;
    const capa = 'absolute inset-0 w-full h-full';

    return (
        <div aria-hidden="true" className="ci-costa relative mt-10 movil:mt-4">
            {/* Lo lejano: el resplandor del cielo, el sol, las islas, la sierra y tres gaviotas. Las
                formas bajan de más (hasta 330): el mar las tapa aunque la capa suba */}
            <svg {...caja} className={`${capa} ci-lejos`}>
                <ellipse cx="520" cy="300" rx="780" ry="250" fill="url(#ci-cielo)" />
                <circle cx="520" cy="296" r="150" fill="url(#ci-halo)" />
                <circle cx="520" cy="284" r="34" style={{ fill: 'var(--simar-aceite)' }} />
                {/* Islas San Jorge */}
                <path
                    d="M148 330 V300 C154 294 160 289 168 287 L176 284 C182 281 189 282 195 286 L203 290 C211 292 219 296 226 300 V330 Z M246 330 V300 C251 296 257 294 263 295 C269 296 273 298 277 300 V330 Z"
                    style={{ fill: C_LEJOS }}
                />
                {/* Sierra del Pinacate: conos de ceniza */}
                <path
                    d="M820 330 V300 L860 288 C890 280 916 276 940 272 L980 262 C994 252 1006 246 1016 246 C1026 246 1036 252 1048 260 L1090 268 C1120 270 1150 266 1180 258 C1200 250 1214 240 1226 238 C1238 236 1250 242 1264 250 C1290 262 1320 266 1350 262 C1380 258 1410 254 1440 254 V330 Z"
                    style={{ fill: C_LEJOS }}
                />
                {/* Lomas del desierto, más cerca */}
                <path
                    d="M1010 330 V300 C1070 293 1130 287 1190 286 C1250 285 1310 280 1370 277 C1394 276 1418 276 1440 277 V330 Z"
                    style={{ fill: C_LOMAS, opacity: 0.75 }}
                />
                <path
                    d="M604 182 q6 -6 12 -1 q6 -5 12 1 M640 198 q5 -5 10 -1 q5 -4 10 1 M586 206 q4 -4 8 -1 q4 -3 8 1"
                    fill="none"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ stroke: 'var(--simar-texto-2)', opacity: 0.55 }}
                />
            </svg>

            {/* El mar (quieto): de la luz del horizonte a Abismo, con el camino del sol */}
            <svg {...caja} className={capa}>
                <defs>
                    <radialGradient id="ci-cielo" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.5 }} />
                        <stop offset="0.35" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.22 }} />
                        <stop offset="0.7" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.06 }} />
                        <stop offset="1" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0 }} />
                    </radialGradient>
                    <radialGradient id="ci-halo" cx="0.5" cy="0.5" r="0.5">
                        <stop offset="0" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.55 }} />
                        <stop offset="0.3" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.2 }} />
                        <stop offset="1" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0 }} />
                    </radialGradient>
                    <linearGradient id="ci-agua" x1="0" y1="300" x2="0" y2="400" gradientUnits="userSpaceOnUse">
                        <stop offset="0" style={{ stopColor: 'color-mix(in oklab, var(--simar-curva) 48%, var(--simar-mar-1))' }} />
                        <stop offset="0.2" style={{ stopColor: 'var(--simar-mar-1)' }} />
                        <stop offset="0.62" style={{ stopColor: 'var(--simar-mar-2)' }} />
                        <stop offset="1" style={{ stopColor: 'var(--simar-abismo)' }} />
                    </linearGradient>
                    <linearGradient id="ci-horizonte" x1="0" y1="0" x2="1440" y2="0" gradientUnits="userSpaceOnUse">
                        <stop offset="0" style={{ stopColor: 'var(--simar-espuma)', stopOpacity: 0.2 }} />
                        <stop offset="0.27" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.55 }} />
                        <stop offset="0.36" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 1 }} />
                        <stop offset="0.46" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.5 }} />
                        <stop offset="1" style={{ stopColor: 'var(--simar-espuma)', stopOpacity: 0.16 }} />
                    </linearGradient>
                    <radialGradient
                        id="ci-reflejo"
                        cx="520"
                        cy="300"
                        r="130"
                        gradientUnits="userSpaceOnUse"
                        gradientTransform="translate(0 120) scale(1 0.6)"
                    >
                        <stop offset="0" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0.4 }} />
                        <stop offset="1" style={{ stopColor: 'var(--simar-aceite)', stopOpacity: 0 }} />
                    </radialGradient>
                    {/* Camaronero amarrado: casco, caseta y los tangones levantados en V */}
                    <g id="ci-amarrado">
                        <g fill="none" strokeLinecap="round" style={{ stroke: C_PUEBLO }}>
                            <path d="M62 -12 V-78" strokeWidth="3" />
                            <path d="M62 -22 L36 -86 M62 -22 L90 -88" strokeWidth="3" />
                            <path d="M62 -76 L36 -86 M62 -76 L90 -88 M62 -60 L4 -16 M62 -60 L116 -14" strokeWidth="1.2" />
                            <path d="M102 -12 L109 -42 L116 -12" strokeWidth="2.4" strokeLinejoin="round" />
                        </g>
                        <path d="M22 -12 L27 -32 H54 V-12 Z" style={{ fill: C_CASETA }} />
                        <path d="M22 -12 L27 -32 H30 L25.5 -12 Z" style={{ fill: C_FILO }} />
                        <path d="M25 -35 H56 V-32 H25.5 Z M31 -28 h6 v5 h-6 Z M41 -28 h6 v5 h-6 Z" style={{ fill: C_PUEBLO }} />
                        <path
                            d="M0 -18 L3 -17.5 C34 -13 82 -12 118 -13.5 L121 -14 L119 -7 C117 -3 113 -0.5 108 0 L18 0 C10 -3 4 -9 0 -18 Z"
                            style={{ fill: C_PUEBLO }}
                        />
                        <path d="M4 -14.5 C34 -10.5 82 -9.5 118 -11" fill="none" strokeWidth="1.6" style={{ stroke: 'var(--simar-golfo)', opacity: 0.8 }} />
                    </g>
                </defs>
                <rect x="0" y="300" width="1440" height="100" fill="url(#ci-agua)" />
                <path d="M390 300 A130 78 0 0 0 650 300 Z" fill="url(#ci-reflejo)" />
                <rect x="0" y="299.25" width="1440" height="1.5" fill="url(#ci-horizonte)" />
                {/* El camino del sol: se abre y se rompe al acercarse */}
                <g strokeLinecap="round" style={{ stroke: 'var(--simar-aceite)' }}>
                    <path d="M506 303.5 H534" strokeWidth="2" opacity="0.9" />
                    <path d="M496 308 H526 M533 308 H546" strokeWidth="2" opacity="0.8" />
                    <path d="M488 313.5 H512 M521 313.5 H554" strokeWidth="2.4" opacity="0.68" />
                    <path d="M476 320 H492 M502 320 H542" strokeWidth="2.4" opacity="0.56" />
                    <path d="M466 328 H506 M520 328 H568" strokeWidth="3" opacity="0.46" />
                    <path d="M480 337 H528 M546 337 H580" strokeWidth="3" opacity="0.36" />
                    <path d="M452 347 H498 M514 347 H556" strokeWidth="3.4" opacity="0.28" />
                    <path d="M466 359 H530 M550 359 H600" strokeWidth="3.4" opacity="0.2" />
                    <path d="M436 372 H500 M522 372 H570" strokeWidth="4" opacity="0.14" />
                    <path d="M452 387 H546" strokeWidth="4" opacity="0.09" />
                </g>
                {/* Oleaje: junto y fino cerca del horizonte, largo y grueso cerca de quien mira */}
                <g fill="none" strokeLinecap="round" style={{ stroke: 'var(--simar-espuma)' }}>
                    <path d="M60 305.5 H136 M262 305 H318 M604 306 H650" strokeWidth="1.2" opacity="0.3" />
                    <path d="M140 311.5 H248 M330 312 H384 M612 313 H672" strokeWidth="1.4" opacity="0.24" />
                    <path d="M30 321 H168 M300 322 H380 M760 330 H858 M1160 336 H1250" strokeWidth="1.8" opacity="0.18" />
                    <path d="M206 338 H380 M840 348 H970 M1300 352 H1420" strokeWidth="2.2" opacity="0.14" />
                    <path d="M40 362 H236 M690 370 H880 M1040 374 H1230" strokeWidth="2.6" opacity="0.1" />
                    <path d="M250 389 H420 M880 391 H1140 M1250 386 H1420" strokeWidth="3" opacity="0.07" />
                </g>
            </svg>

            {/* La costa: el Cerro de la Ballena con su faro y sus casas, el malecón y el muelle */}
            <svg {...caja} className={`${capa} ci-cerro`}>
                {/* Reflejo del cerro y la luz del faro en el agua */}
                <path
                    d="M708 322 H1110 M724 328 H1060 M760 335 H1010 M800 343 H960"
                    fill="none"
                    strokeWidth="3"
                    strokeLinecap="round"
                    style={{ stroke: C_CERRO_PIE, opacity: 0.5 }}
                />
                <path d="M826 326 V330 M826 336 V339 M826 345 V347" fill="none" strokeWidth="2" strokeLinecap="round" style={{ stroke: 'var(--simar-aceite)', opacity: 0.55 }} />
                {/* El cuerpo, a contraluz */}
                <path
                    d="M696 318 L700 308 C703 300 708 294 715 291 L722 289 C730 276 740 258 754 242 C770 224 794 211 822 206 C842 203 862 205 884 211 C914 219 944 232 976 247 C1012 264 1050 280 1088 296 C1102 302 1114 309 1124 318 Z"
                    style={{ fill: C_CERRO }}
                />
                {/* La ladera que mira al sol, con su filo encendido */}
                <path
                    d="M696 318 L700 308 C703 300 708 294 715 291 L722 289 C730 276 740 258 754 242 C770 224 794 211 822 206 C806 216 792 230 781 248 C770 266 763 288 760 318 Z"
                    style={{ fill: C_CERRO_LUZ }}
                />
                <path
                    d="M701 306 C704 299 709 294 715 291 L722 289 C730 276 740 258 754 242 C770 224 794 211 822 206 C842 203 862 205 884 211"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ stroke: 'var(--simar-aceite)', opacity: 0.7 }}
                />
                {/* Vetas de la roca: siguen la forma del cerro */}
                <path
                    d="M733 276 C738 266 744 258 750 252 M716 300 C720 294 724 290 729 288 M790 256 C796 248 804 240 812 234 M840 226 C858 224 876 228 892 236 M900 250 C922 258 944 270 962 282 M986 286 C1006 294 1024 302 1040 310"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ stroke: C_CERRO_PIE, opacity: 0.55 }}
                />
                {/* El pie del cerro, en sombra, con las rocas de la punta */}
                <path
                    d="M696 318 L700 308 C703 302 707 298 712 296 C722 300 740 302 760 302 C820 304 900 302 980 304 C1040 306 1090 308 1124 318 Z"
                    style={{ fill: C_CERRO_PIE }}
                />
                <path d="M688 318 C690 312 696 309 702 310 C706 306 714 306 717 311 C722 310 727 314 727 318 Z" style={{ fill: C_CERRO_PIE }} />
                <path d="M684 319.5 H736 M742 320 H780" fill="none" strokeWidth="1.6" strokeLinecap="round" style={{ stroke: 'var(--simar-espuma)', opacity: 0.55 }} />

                {/* Las casas de la ladera: la cara que mira al sol, el frente y la azotea */}
                <path
                    d="M871 209.6H879V216.6H871ZM887 215.2H896V223.2H887ZM905 221.5H912V228.5H905ZM921 227.4H931V235.4H921ZM939 237.4H947V244.4H939ZM957 244.3H966V252.3H957ZM975 253.8H982V260.8H975ZM993 261.8H1003V269.8H993ZM1013 270.8H1021V277.8H1013ZM1033 278.6H1042V285.6H1033ZM1053 286.2H1060V293.2H1053ZM881 228.1H888V234.1H881ZM899 234.4H908V241.4H899ZM919 244.2H926V250.2H919ZM937 250.9H946V257.9H937ZM959 263.3H966V269.3H959ZM979 271.7H988V278.7H979ZM1001 281.1H1008V287.1H1001ZM1023 289H1031V295H1023ZM1045 294.8H1052V300.8H1045ZM893 249.3H900V255.3H893ZM915 258.9H923V264.9H915ZM941 267.9H948V273.9H941ZM965 277.6H973V283.6H965ZM989 286.4H996V292.4H989ZM1011 293.5H1018V299.5H1011Z"
                    style={{ fill: C_CASA }}
                />
                <path
                    d="M868 209.6h3V216.6H868ZM884 215.2h3V223.2H884ZM902 221.5h3V228.5H902ZM918 227.4h3V235.4H918ZM936 237.4h3V244.4H936ZM954 244.3h3V252.3H954ZM972 253.8h3V260.8H972ZM990 261.8h3V269.8H990ZM1010 270.8h3V277.8H1010ZM1030 278.6h3V285.6H1030ZM1050 286.2h3V293.2H1050ZM878 228.1h3V234.1H878ZM896 234.4h3V241.4H896ZM916 244.2h3V250.2H916ZM934 250.9h3V257.9H934ZM956 263.3h3V269.3H956ZM976 271.7h3V278.7H976ZM998 281.1h3V287.1H998ZM1020 289h3V295H1020ZM1042 294.8h3V300.8H1042ZM890 249.3h3V255.3H890ZM912 258.9h3V264.9H912ZM938 267.9h3V273.9H938ZM962 277.6h3V283.6H962ZM986 286.4h3V292.4H986ZM1008 293.5h3V299.5H1008Z"
                    style={{ fill: C_FILO }}
                />
                <path
                    d="M867.4 208.2H879.6V209.6H867.4ZM883.4 213.8H896.6V215.2H883.4ZM901.4 220.1H912.6V221.5H901.4ZM917.4 226H931.6V227.4H917.4ZM935.4 236H947.6V237.4H935.4ZM953.4 242.9H966.6V244.3H953.4ZM971.4 252.4H982.6V253.8H971.4ZM989.4 260.4H1003.6V261.8H989.4ZM1009.4 269.4H1021.6V270.8H1009.4ZM1029.4 277.2H1042.6V278.6H1029.4ZM1049.4 284.8H1060.6V286.2H1049.4ZM877.4 226.7H888.6V228.1H877.4ZM895.4 233H908.6V234.4H895.4ZM915.4 242.8H926.6V244.2H915.4ZM933.4 249.5H946.6V250.9H933.4ZM955.4 261.9H966.6V263.3H955.4ZM975.4 270.3H988.6V271.7H975.4ZM997.4 279.7H1008.6V281.1H997.4ZM1019.4 287.6H1031.6V289H1019.4ZM1041.4 293.4H1052.6V294.8H1041.4ZM889.4 247.9H900.6V249.3H889.4ZM911.4 257.5H923.6V258.9H911.4ZM937.4 266.5H948.6V267.9H937.4ZM961.4 276.2H973.6V277.6H961.4ZM985.4 285H996.6V286.4H985.4ZM1007.4 292.1H1018.6V293.5H1007.4Z"
                    style={{ fill: C_PUEBLO }}
                />
                <path d="M890.5 217.2h2.5v2.5h-2.5ZM960.5 246.3h2.5v2.5h-2.5ZM1036.5 280.6h2.5v2.5h-2.5ZM920.5 246.2h2.5v2.5h-2.5ZM982.5 273.7h2.5v2.5h-2.5ZM917.5 260.9h2.5v2.5h-2.5Z" style={{ fill: 'var(--simar-aceite)' }} />

                {/* El faro: su resplandor, la torre (cara al sol más clara), las franjas, el balcón y la linterna */}
                <circle cx="826" cy="144" r="40" fill="url(#ci-halo)" />
                <path d="M836 207 V197 L846 191 L856 197 V209 Z" style={{ fill: C_CASA }} />
                <path d="M836 207 V197 L846 191 V209 Z" style={{ fill: C_FILO }} />
                <path d="M834.5 197.5 L846 190.5 L857.5 197.5" fill="none" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ stroke: C_PUEBLO }} />
                <path d="M826 208 V152 H830.5 L833 208 Z" style={{ fill: C_CASETA }} />
                <path d="M819 208 L821.5 152 H826 V208 Z" style={{ fill: 'var(--simar-franja-texto-2)' }} />
                <path d="M821 166 H831.1 L831.4 172 H820.7 Z M820.2 184 H831.9 L832.2 190 H819.9 Z" style={{ fill: 'var(--simar-coral)' }} />
                <path d="M817 149 H835 V152.5 H817 Z M820.5 139 H831.5 V149 H820.5 Z M818.5 139 L826 131.5 L833.5 139 Z M825.2 128 h1.6 v4 h-1.6 Z" style={{ fill: C_PUEBLO }} />
                <rect x="822.5" y="141" width="7" height="6.5" style={{ fill: 'var(--simar-aceite)' }} />
                {/* El pueblo, detrás del malecón: casas bajas, el hotel, la iglesia con su campanario y su cúpula */}
                <path
                    d="M1086 306 V284 H1106 V306 Z M1110 306 V272 H1124 V306 Z M1128 306 V288 H1154 V306 Z M1160 306 V250 H1172 V306 Z M1158.5 250 L1166 240 L1173.5 250 Z M1172 306 V270 H1202 V306 Z M1176 270 A11 10 0 0 1 1198 270 Z M1185.5 256.5 h3 v4 h-3 Z M1206 306 V280 H1224 V306 Z M1228 306 V262 H1242 V306 Z M1246 306 V284 H1270 V306 Z M1274 306 V274 H1290 V306 Z M1294 306 V286 H1322 V306 Z M1326 306 V268 H1340 V306 Z M1344 306 V282 H1366 V306 Z M1370 306 V276 H1388 V306 Z M1392 306 V288 H1416 V306 Z M1420 306 V272 H1440 V306 Z"
                    style={{ fill: C_PUEBLO }}
                />
                <path
                    d="M1086 306 V284 h2.5 V306 Z M1110 306 V272 h2.5 V306 Z M1128 306 V288 h2.5 V306 Z M1160 306 V250 h2.5 V306 Z M1172 306 V270 h2.5 V306 Z M1206 306 V280 h2.5 V306 Z M1228 306 V262 h2.5 V306 Z M1246 306 V284 h2.5 V306 Z M1274 306 V274 h2.5 V306 Z M1294 306 V286 h2.5 V306 Z M1326 306 V268 h2.5 V306 Z M1344 306 V282 h2.5 V306 Z M1370 306 V276 h2.5 V306 Z M1392 306 V288 h2.5 V306 Z M1420 306 V272 h2.5 V306 Z"
                    style={{ fill: C_CERRO_LUZ }}
                />
                <path d="M1166 240 V233 M1163.5 235.5 H1168.5" fill="none" strokeWidth="1.4" strokeLinecap="round" style={{ stroke: C_PUEBLO }} />
                <path
                    d="M1092 290 h3 v3 h-3 Z M1115 278 h3 v3 h-3 Z M1115 288 h3 v3 h-3 Z M1164 256 h4 v6 h-4 Z M1234 270 h3 v3 h-3 Z M1234 286 h3 v3 h-3 Z M1280 282 h3 v3 h-3 Z M1331 276 h3 v3 h-3 Z M1376 284 h3 v3 h-3 Z"
                    style={{ fill: 'var(--simar-aceite)' }}
                />
                {/* Tres palmas del malecón */}
                <g fill="none" strokeLinecap="round" style={{ stroke: C_PUEBLO }}>
                    <path d="M1122 306 C1121 292 1123 278 1127 266 M1262 306 C1261 291 1263 278 1266 268 M1386 306 C1385 292 1387 280 1390 270" strokeWidth="2.6" />
                    <path
                        d="M1127 266 C1121 262 1113 263 1108 269 M1127 266 C1122 259 1115 257 1110 259 M1127 266 C1130 259 1137 257 1143 260 M1127 266 C1133 263 1140 264 1145 270 M1127 266 C1128 261 1127 257 1125 254 M1266 268 C1260 264 1252 265 1247 271 M1266 268 C1261 261 1254 259 1249 261 M1266 268 C1269 261 1276 259 1282 262 M1266 268 C1272 265 1279 266 1284 272 M1266 268 C1267 263 1266 259 1264 256 M1390 270 C1384 266 1376 267 1371 273 M1390 270 C1385 263 1378 261 1373 263 M1390 270 C1393 263 1400 261 1406 264 M1390 270 C1396 267 1403 268 1408 274 M1390 270 C1391 265 1390 261 1388 258"
                        strokeWidth="2.2"
                    />
                </g>
                {/* El malecón: muro, barandal y faroles encendidos */}
                <path d="M1056 318 C1070 312 1080 308 1090 306 H1440 V318 Z" style={{ fill: C_CERRO_PIE }} />
                <path d="M1090 306.5 H1440" fill="none" strokeWidth="1.4" style={{ stroke: C_FILO, opacity: 0.55 }} />
                <path d="M1062 301.5 H1440" fill="none" strokeWidth="1.2" style={{ stroke: C_PUEBLO }} />
                <path
                    d="M1080 301V306M1098 301V306M1116 301V306M1134 301V306M1152 301V306M1170 301V306M1188 301V306M1206 301V306M1224 301V306M1242 301V306M1260 301V306M1278 301V306M1296 301V306M1314 301V306M1332 301V306M1350 301V306M1368 301V306M1386 301V306M1404 301V306M1422 301V306"
                    fill="none"
                    strokeWidth="1.2"
                    style={{ stroke: C_PUEBLO }}
                />
                <path
                    d="M1078 306V281M1136 306V281M1194 306V281M1252 306V281M1310 306V281M1368 306V281M1426 306V281"
                    fill="none"
                    strokeWidth="1.6"
                    style={{ stroke: C_PUEBLO }}
                />
                <path
                    d="M1074.5 279h7v2.5h-7ZM1132.5 279h7v2.5h-7ZM1190.5 279h7v2.5h-7ZM1248.5 279h7v2.5h-7ZM1306.5 279h7v2.5h-7ZM1364.5 279h7v2.5h-7ZM1422.5 279h7v2.5h-7Z"
                    style={{ fill: C_PUEBLO }}
                />
                <g style={{ fill: 'var(--simar-aceite)' }}>
                    <circle cx="1078" cy="283.6" r="1.9" />
                    <circle cx="1136" cy="283.6" r="1.9" />
                    <circle cx="1194" cy="283.6" r="1.9" />
                    <circle cx="1252" cy="283.6" r="1.9" />
                    <circle cx="1310" cy="283.6" r="1.9" />
                    <circle cx="1368" cy="283.6" r="1.9" />
                    <circle cx="1426" cy="283.6" r="1.9" />
                </g>
                {/* Reflejos de los faroles */}
                <path
                    d="M1078 322 V326 M1136 322 V326 M1194 322 V326 M1252 322 V326 M1310 322 V326 M1368 322 V326 M1426 322 V326"
                    fill="none"
                    strokeWidth="2"
                    strokeLinecap="round"
                    style={{ stroke: 'var(--simar-aceite)', opacity: 0.4 }}
                />
                <path d="M1052 319.5 H1440" fill="none" strokeWidth="1.6" style={{ stroke: 'var(--simar-espuma)', opacity: 0.45 }} />

                {/* El muelle, sus pilotes y dos camaroneros amarrados */}
                <path d="M1150 326 H1440 V329.5 H1150 Z" style={{ fill: C_PUEBLO }} />
                <path
                    d="M1158 329.5V341M1182 329.5V341M1206 329.5V341M1230 329.5V341M1254 329.5V341M1278 329.5V341M1302 329.5V341M1326 329.5V341M1350 329.5V341M1374 329.5V341M1398 329.5V341M1422 329.5V341"
                    fill="none"
                    strokeWidth="2.4"
                    style={{ stroke: C_PUEBLO }}
                />
                <path d="M1150 326.4 H1440" fill="none" strokeWidth="1" style={{ stroke: C_FILO, opacity: 0.6 }} />
                <use href="#ci-amarrado" transform="translate(1192 348) scale(0.62)" />
                <use href="#ci-amarrado" transform="translate(1312 350) scale(0.66)" />
            </svg>

            {/* El camaronero que sale a la mar: cruza el camino del sol con el scroll */}
            <svg {...caja} className={`${capa} ci-barco`}>
                <g transform="translate(440 356)">
                    {/* Reflejo y estela */}
                    <path
                        d="M14 5 H186 M30 11 H170 M50 18 H150 M118 25 V29"
                        fill="none"
                        strokeWidth="3"
                        strokeLinecap="round"
                        style={{ stroke: 'var(--simar-abismo)', opacity: 0.32 }}
                    />
                    <path
                        d="M200 2 H330 M214 7 H296 M-2 1 H-30"
                        fill="none"
                        strokeWidth="1.6"
                        strokeLinecap="round"
                        style={{ stroke: 'var(--simar-espuma)', opacity: 0.45 }}
                    />
                    {/* Aparejo: mástil, tangones abiertos, cabos y puertas colgando */}
                    <g fill="none" strokeLinecap="round" style={{ stroke: 'var(--simar-abismo)' }}>
                        <path d="M118 -24 V-122" strokeWidth="3.4" />
                        <path d="M109 -106 H127" strokeWidth="2" />
                        <path d="M118 -40 L-26 -74 M118 -40 L252 -72" strokeWidth="3" />
                        <path
                            d="M118 -120 L-26 -74 M118 -120 L252 -72 M118 -120 L2 -30 M118 -120 L198 -24 M-26 -74 V-46 M252 -72 V-44"
                            strokeWidth="1.2"
                        />
                        <path d="M176 -24 L184 -60 L192 -24" strokeWidth="2.4" strokeLinejoin="round" />
                    </g>
                    <path d="M-30 -46 H-22 L-23 -35 H-29 Z M248 -44 H256 L255 -33 H249 Z" style={{ fill: 'var(--simar-abismo)' }} />
                    {/* Tambor de la red y chimenea */}
                    <path d="M148 -24 V-31 Q148 -35 152 -35 H166 Q170 -35 170 -31 V-24 Z M99 -24 V-60 L101 -63 H106 V-24 Z" style={{ fill: 'var(--simar-abismo)' }} />
                    {/* Caseta: frente inclinado hacia la proa, su filo al sol y las ventanas */}
                    <path d="M34 -24 L40 -52 H95 V-24 Z" style={{ fill: C_CASETA }} />
                    <path d="M34 -24 L40 -52 H44 L38.5 -24 Z" style={{ fill: C_FILO }} />
                    <path
                        d="M37 -55.5 H98 V-52 H39 Z M47 -46 h10 v8 h-10 Z M61 -46 h10 v8 h-10 Z M75 -46 h10 v8 h-10 Z M54 -55 V-66 M70 -58 h11 v3 h-11 Z"
                        style={{ fill: 'var(--simar-abismo)' }}
                    />
                    <path d="M54 -55 V-66 M49 -66 H60" fill="none" strokeWidth="1.4" strokeLinecap="round" style={{ stroke: 'var(--simar-abismo)' }} />
                    {/* Casco: proa alta, la franja de color y el filo que toca el sol */}
                    <path
                        d="M0 -30 L4 -29 C50 -23 130 -21 194 -23 L200 -23.5 L198 -13 C196 -6 191 -1.5 184 0 L28 0 C17 -4 7 -14 0 -30 Z"
                        style={{ fill: 'var(--simar-abismo)' }}
                    />
                    <path d="M6 -25 C50 -19.5 130 -17.5 196 -19.5" fill="none" strokeWidth="2.2" style={{ stroke: 'var(--simar-golfo)', opacity: 0.75 }} />
                    <path d="M0.5 -29.5 C5 -18 13 -8 24 -1.5" fill="none" strokeWidth="1.6" strokeLinecap="round" style={{ stroke: 'var(--simar-aceite)', opacity: 0.75 }} />
                </g>
            </svg>
        </div>
    );
}

/* ── Tres caminos ────────────────────────────────────────────────────────── */

function TresCaminos({
    locale,
    alAbrirAcceso,
    rutaDemo,
}: {
    locale: string;
    alAbrirAcceso: (rol?: 'admin' | 'recolector') => void;
    rutaDemo: string | null;
}) {
    // En el despliegue de la demostración sólo hay demostración; sin ella, sólo la sesión
    const conSesion = !MODO_DEMO;
    const conDemo = Boolean(rutaDemo);

    return (
        <section id="participa" aria-labelledby="ci-participa-titulo" className="ci-participa relative bg-simar-abismo text-white overflow-clip">
            <div className="relative max-w-[1248px] mx-auto px-6 pt-10 pb-44 md:pt-14 md:pb-52 movil:px-5 movil:pt-8 movil:pb-32">
                <div className="text-center">
                    <Image
                        src="/assets/simar/simbolo-grande.png"
                        alt=""
                        width={112}
                        height={113}
                        sizes="(max-width: 639px) 80px, 112px"
                        className="ci-simbolo mx-auto w-[112px] h-auto movil:w-[80px]"
                    />
                    <h2
                        id="ci-participa-titulo"
                        className="ci-entra mt-8 font-titular text-[clamp(38px,4.6vw,64px)] font-semibold leading-[1.04] tracking-[-0.024em] text-balance movil:mt-5 movil:text-[34px]"
                    >
                        Cada dato cuenta. <span className="text-simar-espuma">Cada mar lo agradece.</span>
                    </h2>
                    <p className="ci-entra ci-d1 mt-4 text-[20px] text-simar-franja-texto-2 movil:mt-3 movil:text-[18px]">Elige por dónde seguir.</p>
                </div>

                <ul className="ci-puertas mt-14 grid gap-5 md:grid-cols-3 movil:mt-8 movil:gap-3">
                    <li className="ci-puerta">
                        <a href="#correo-del-mes" data-vidrio="claro" className="ci-puerta-caja ci-tarjeta group">
                            <ContenidoPuerta icono={Mail} titulo="Recibe el correo del mes" texto="Lo nuevo del puerto, una vez al mes." flecha />
                        </a>
                    </li>
                    <li className="ci-puerta ci-p2">
                        <Link href={`/${locale}/noticias`} data-vidrio="claro" className="ci-puerta-caja ci-tarjeta group">
                            <ContenidoPuerta icono={Newspaper} titulo="Lee las Noticias del Mar" texto="Notas, cifras y mapas, con sus fuentes." flecha />
                        </Link>
                    </li>
                    <li className="ci-puerta ci-p3">
                        {conSesion && conDemo ? (
                            // Dos salidas: la puerta es la tarjeta y cada botón es su propio enlace
                            <div className="ci-puerta-caja ci-tarjeta">
                                <ContenidoPuerta icono={CirclePlay} titulo="Prueba SiMAR" texto="Con tu cuenta o sin registrarte." />
                                <div className="ci-p-acciones">
                                    <button
                                        type="button"
                                        onClick={() => alAbrirAcceso()}
                                        className="simar-presiona group/b min-h-[56px] px-6 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer movil:min-h-[52px]"
                                    >
                                        Iniciar sesión
                                        <ArrowRight aria-hidden="true" className="w-5 h-5 transition-transform duration-300 group-hover/b:translate-x-0.5" strokeWidth={2.4} />
                                    </button>
                                    <a
                                        href={rutaDemo ?? undefined}
                                        className="simar-presiona min-h-[56px] px-6 rounded-full ring-1 ring-simar-borde hover:bg-simar-marea-suave text-simar-marea-tinta text-[17px] font-extrabold inline-flex items-center justify-center movil:min-h-[52px]"
                                    >
                                        Probar la demostración
                                    </a>
                                </div>
                            </div>
                        ) : conDemo ? (
                            <a href={rutaDemo ?? undefined} data-vidrio="claro" className="ci-puerta-caja ci-tarjeta group">
                                <ContenidoPuerta icono={CirclePlay} titulo="Probar la demostración" texto="Sin registrarte: con datos de ejemplo." flecha />
                            </a>
                        ) : (
                            <button type="button" onClick={() => alAbrirAcceso()} data-vidrio="claro" className="ci-puerta-caja ci-tarjeta group text-left cursor-pointer">
                                <ContenidoPuerta icono={CirclePlay} titulo="Iniciar sesión" texto="Entra con tu cuenta de SiMAR." flecha />
                            </button>
                        )}
                    </li>
                </ul>
            </div>

            {/* Dos olas que suben a distinto ritmo y, encima, la ola que da paso al pie */}
            <div aria-hidden="true" className="absolute inset-x-0 bottom-0 h-28 md:h-36 pointer-events-none">
                <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="ci-ola-atras absolute inset-0 w-full h-full">
                    <path
                        d="M0 58 C180 30 360 26 540 46 C720 66 900 84 1080 70 C1260 56 1350 40 1440 44 L1440 120 L0 120 Z"
                        style={{ fill: 'var(--simar-mar-2)', opacity: 0.75 }}
                    />
                </svg>
                <svg viewBox="0 0 1440 120" preserveAspectRatio="none" className="ci-ola-frente absolute inset-0 w-full h-full">
                    <path
                        d="M0 84 C160 66 320 60 500 72 C680 84 860 100 1040 92 C1220 84 1340 70 1440 72 L1440 120 L0 120 Z"
                        style={{ fill: 'var(--simar-mar-1)', opacity: 0.5 }}
                    />
                </svg>
                <OlaSeparador color="var(--simar-superficie)" lado="abajo" />
            </div>
        </section>
    );
}

/**
 * Lo de adentro de cada puerta. En pantallas anchas se apila (ícono, título, texto, flecha); en el
 * celular es una fila: ícono a la izquierda, texto al centro y la flecha a la derecha (cierre.css).
 */
function ContenidoPuerta({ icono: Icono, titulo, texto, flecha = false }: { icono: LucideIcon; titulo: string; texto: string; flecha?: boolean }) {
    return (
        <>
            <span className="ci-p-icono">
                <Icono aria-hidden="true" className="w-7 h-7 movil:w-6 movil:h-6" strokeWidth={2} />
            </span>
            <span className="ci-p-titulo">{titulo}</span>
            <span className="ci-p-texto">{texto}</span>
            {flecha && (
                <span aria-hidden="true" className="ci-p-flecha">
                    <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                </span>
            )}
        </>
    );
}

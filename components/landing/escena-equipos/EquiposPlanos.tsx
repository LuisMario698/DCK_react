'use client';

import { useEffect, useState } from 'react';
import Image from 'next/image';
import { cuandoEnReposo } from '@/lib/utils/reposo';
import { TECLAS } from './teclas';
import './equipos-planos.css';

/**
 * «Así funciona SiMAR» en plano: la laptop y el celular dibujados (vector, aluminio y vidrio) con
 * las capturas reales de la demostración. Se ve desde el primer momento, mientras el 3D se prepara
 * (y se desvanece cuando está listo); se queda si el equipo no da para el 3D, si WebGL falla o con
 * «reducir movimiento». Sigue los mismos pasos que el 3D:
 *  0  la laptop, con la pantalla apagada · 1 se enciende en el Panel · 2 el manifiesto entra desde la
 *  derecha · 3 Estadísticas · 4 el portal; la laptop se hace a un lado y llega el celular.
 * Encuadre: la misma zona libre que deja el motor 3D (entre las frases y los puntos); en pantallas
 * angostas los equipos se apilan (equipos-planos.css).
 * Ligero: 2 capas que se mueven (laptop y celular) más el cambio de pantalla; sin sombras animadas.
 */

const CAPTURAS = [
    '/assets/landing/3d/pantalla-panel.webp',
    '/assets/landing/3d/pantalla-manifiesto.webp',
    '/assets/landing/3d/pantalla-estadisticas.webp',
    '/assets/landing/3d/pantalla-portal.webp',
];

// Lo que mide la pantalla de la laptop en CSS: ≈ 70 % del ancho en celular, ≈ 52 % en tableta y
// a lo más ≈ 700 px en escritorio. El celular, ≈ 27 % / 13 % / 200 px
const TAMANO_PANTALLA = '(max-width: 767px) 72vw, (max-width: 1279px) 52vw, 700px';
const TAMANO_CELULAR = '(max-width: 767px) 27vw, (max-width: 1279px) 13vw, 200px';

const estadoDe = (k: number, activa: number) => (k < activa ? 'pasada' : k === activa ? 'actual' : 'siguiente');

export function EquiposPlanos({ paso, oculto, quieto }: { paso: number; oculto: boolean; quieto: boolean }) {
    // Con «reducir movimiento», la toma final (como el 3D quieto)
    const p = quieto ? 4 : paso;
    // La captura en pantalla: ninguna en el paso 0 (apagada), luego Panel, manifiesto, Estadísticas, portal
    const activa = p - 1;

    // Las capturas que esperan fuera de la pantalla (recortadas) nunca «se acercan» a la vista, así
    // que la carga diferida del navegador no las pediría hasta entrar, y entrarían vacías. Se piden
    // en reposo, ya cargada la página (o en cuanto se llega a la sección, si se bajó antes)
    const [enReposo, setEnReposo] = useState(false);
    useEffect(() => cuandoEnReposo(() => setEnReposo(true)), []);
    const pedirTodas = enReposo || p >= 1;

    return (
        <div aria-hidden="true" className="eqp" data-paso={p} data-oculto={oculto} data-quieto={quieto}>
            <div className="eqp-lamina simar-claro">
                <div className="eqp-laptop">
                    <Laptop />
                    <div className="eqp-pantalla">
                        {CAPTURAS.map((src, k) => (
                            <div key={src} className="eqp-captura" data-estado={estadoDe(k, activa)}>
                                {/* El Panel está a la vista (apagado): carga diferida normal. Las demás, al pedirlas */}
                                {k === 0 ? (
                                    <Image src={src} alt="" fill sizes={TAMANO_PANTALLA} className="object-cover object-top" />
                                ) : (
                                    pedirTodas && (
                                        <Image src={src} alt="" fill loading="eager" sizes={TAMANO_PANTALLA} className="object-cover object-top" />
                                    )
                                )}
                            </div>
                        ))}
                        <div className="eqp-reflejo" />
                    </div>
                </div>

                <div className="eqp-celular">
                    <Celular />
                    <div className="eqp-app">
                        <Image src="/assets/landing/3d/celular-portal.webp" alt="" fill sizes={TAMANO_CELULAR} className="object-cover object-top" />
                    </div>
                </div>
            </div>
        </div>
    );
}

/** Laptop vista de frente y un poco desde arriba (1000 × 624): tapa, bisagra, teclado y frente */
function Laptop() {
    return (
        <svg viewBox="0 0 1000 624" focusable="false">
            <defs>
                <linearGradient id="eqp-l-bisagra" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" className="eqp-s-tinta" />
                    <stop offset="0.55" className="eqp-s-alu-4" />
                    <stop offset="1" className="eqp-s-tinta" />
                </linearGradient>
                <linearGradient id="eqp-l-cubierta" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" className="eqp-s-alu-3" />
                    <stop offset="0.35" className="eqp-s-alu-2" />
                    <stop offset="1" className="eqp-s-alu-1" />
                </linearGradient>
                <linearGradient id="eqp-l-pozo" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" className="eqp-s-alu-4" />
                    <stop offset="1" className="eqp-s-alu-3" />
                </linearGradient>
                <linearGradient id="eqp-l-frente" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0" className="eqp-s-alu-3" />
                    <stop offset="1" className="eqp-s-alu-5" />
                </linearGradient>
                <linearGradient id="eqp-l-borde" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" className="eqp-s-alu-4" />
                    <stop offset="0.5" className="eqp-s-alu-1" />
                    <stop offset="1" className="eqp-s-alu-4" />
                </linearGradient>
                <radialGradient id="eqp-l-piso" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" className="eqp-s-sombra" stopOpacity="0.34" />
                    <stop offset="1" className="eqp-s-sombra" stopOpacity="0" />
                </radialGradient>
            </defs>
            {/* Sombra en el piso */}
            <ellipse cx="500" cy="604" rx="530" ry="18" fill="url(#eqp-l-piso)" />
            {/* Tapa: la orilla de aluminio, el marco negro y la cámara */}
            <rect x="108" y="4" width="784" height="519" rx="26" fill="url(#eqp-l-borde)" />
            <rect x="111" y="7" width="778" height="514" rx="23" className="eqp-f-marco" />
            <circle cx="500" cy="19.5" r="3.4" className="eqp-f-camara" />
            <circle cx="501" cy="18.6" r="1" className="eqp-f-brillo" opacity="0.5" />
            {/* La pantalla apagada (las capturas van encima, en HTML) */}
            <rect x="128" y="32" width="744" height="465" className="eqp-f-apagada" />
            {/* Bisagra */}
            <rect x="122" y="519" width="756" height="9" rx="3" fill="url(#eqp-l-bisagra)" />
            {/* Cubierta, vista un poco desde arriba, con su orilla de luz */}
            <path
                d="M104 526H896C902 526 905 528 907 532L978 588C982 592 980 595 975 595H25C20 595 18 592 22 588L93 532C95 528 98 526 104 526Z"
                fill="url(#eqp-l-cubierta)"
            />
            <path d="M104 526.6H896" className="eqp-t-brillo" strokeWidth="1.2" opacity="0.7" />
            {/* Pozo del teclado, teclas y trackpad */}
            <path
                d="M206 530H794C798 530 800 531.5 801 534L822 568C823 571 821 572.5 818 572.5H182C179 572.5 177 571 178 568L199 534C200 531.5 202 530 206 530Z"
                fill="url(#eqp-l-pozo)"
            />
            <path d={TECLAS} className="eqp-f-tecla" />
            <path d="M405 576.5H595L599 590H401Z" className="eqp-f-trackpad" />
            {/* Frente de la base, su chaflán y la muesca para abrirla */}
            <path
                d="M22 595H978C984 595 986 598 983 601C979 605 972 607 962 607H38C28 607 21 605 17 601C14 598 16 595 22 595Z"
                fill="url(#eqp-l-frente)"
            />
            <path d="M26 595.6H974" className="eqp-t-brillo" strokeWidth="1.4" opacity="0.9" />
            <path d="M446 595.4C450 600 454 601.6 460 601.6H540C546 601.6 550 600 554 595.4Z" className="eqp-f-muesca" />
        </svg>
    );
}

/** Celular de frente (400 × 836): canto de titanio, marco, barra de estado con la isla y barra de inicio */
function Celular() {
    return (
        <svg viewBox="0 0 400 836" focusable="false">
            <defs>
                <linearGradient id="eqp-c-titanio" x1="0" y1="0" x2="1" y2="0">
                    <stop offset="0" className="eqp-s-alu-4" />
                    <stop offset="0.04" className="eqp-s-alu-1" />
                    <stop offset="0.12" className="eqp-s-alu-3" />
                    <stop offset="0.88" className="eqp-s-alu-3" />
                    <stop offset="0.96" className="eqp-s-alu-1" />
                    <stop offset="1" className="eqp-s-alu-4" />
                </linearGradient>
                <radialGradient id="eqp-c-piso" cx="0.5" cy="0.5" r="0.5">
                    <stop offset="0" className="eqp-s-sombra" stopOpacity="0.4" />
                    <stop offset="1" className="eqp-s-sombra" stopOpacity="0" />
                </radialGradient>
            </defs>
            <ellipse cx="200" cy="820" rx="210" ry="13" fill="url(#eqp-c-piso)" />
            {/* Botones */}
            <rect x="0" y="150" width="6" height="34" rx="2" className="eqp-f-boton" />
            <rect x="0" y="206" width="6" height="58" rx="2" className="eqp-f-boton" />
            <rect x="0" y="278" width="6" height="58" rx="2" className="eqp-f-boton" />
            <rect x="394" y="236" width="6" height="92" rx="2" className="eqp-f-boton" />
            {/* Cuerpo y marco */}
            <rect x="3" y="2" width="394" height="816" rx="64" fill="url(#eqp-c-titanio)" />
            <rect x="8" y="7" width="384" height="806" rx="59" className="eqp-f-marco" />
            {/* Pantalla: barra de estado arriba, la app en medio (HTML) y la barra de inicio */}
            <rect x="19" y="18" width="362" height="784" rx="48" className="eqp-f-papel" />
            <rect x="150" y="31" width="100" height="30" rx="15" className="eqp-f-isla" />
            <circle cx="232" cy="46" r="5" className="eqp-f-camara" />
            <text
                x="74"
                y="54"
                className="eqp-f-tinta"
                fontSize="21"
                fontWeight="700"
                fontFamily="system-ui, -apple-system, 'Segoe UI', sans-serif"
                textAnchor="middle"
            >
                10:30
            </text>
            <path d="M278 52h4v4h-4zM285 48h4v8h-4zM292 44h4v12h-4zM299 40h4v16h-4z" className="eqp-f-tinta" />
            <rect x="311.5" y="41.5" width="27" height="14" rx="4" className="eqp-t-tinta" fill="none" strokeWidth="1.6" opacity="0.45" />
            <rect x="314.5" y="44.5" width="18" height="8" rx="2" className="eqp-f-tinta" />
            <rect x="340.5" y="46" width="2.4" height="5" rx="1" className="eqp-f-tinta" opacity="0.45" />
            <rect x="140" y="788" width="120" height="5" rx="2.5" className="eqp-f-tinta" />
        </svg>
    );
}

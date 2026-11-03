import { useId } from 'react';

/**
 * La vaquita marina, de lado y mirando a la derecha: la marsopa más pequeña del mundo, con su
 * aleta dorsal alta, el lomo gris oscuro, la panza clara y sus «ojeras» y labios negros.
 * `cria` la dibuja un poco más clara (las crías nacen de color más pálido). La cola se mueve con
 * la clase `n-cola` (globals.css; `cola={false}` la deja quieta); el resto lo anima quien la usa.
 * Es SVG puro (sin JavaScript).
 */
export function Vaquita({ cria = false, cola = true, className = '' }: { cria?: boolean; cola?: boolean; className?: string }) {
    const id = useId().replace(/[^a-zA-Z0-9_-]/g, '');
    const lomo = cria ? '#7C8C98' : '#4A5A66';
    const flanco = cria ? '#A9B6BF' : '#8696A1';
    const panza = cria ? '#E2E8EC' : '#D3DCE2';
    const negro = '#141C22';
    return (
        <svg viewBox="0 0 200 76" className={`${cria ? 'n-cria ' : ''}${className}`} aria-hidden="true">
            <defs>
                <linearGradient id={`piel-${id}`} x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor={lomo} />
                    <stop offset="48%" stopColor={flanco} />
                    <stop offset="78%" stopColor={panza} />
                </linearGradient>
            </defs>
            {/* La cola (aleta caudal): sube y baja desde donde se une al cuerpo */}
            <g className={cola ? 'n-cola' : undefined} style={{ transformOrigin: '32px 43px', transformBox: 'view-box' }}>
                <path d="M34 41 C23 39 12 33 2 30 C7 36 10 41 9 43.5 C10 46 7 51 2 57 C12 54 23 48 34 45.5 Z" fill={lomo} />
            </g>
            {/* Aleta dorsal, alta y triangular */}
            <path d="M92 23 C97 15 101 7 106 2 C109 9 115 16 129 21 Z" fill={lomo} />
            {/* El cuerpo */}
            <path
                d="M193 44 C193 33 183 26 168 24 C140 19 106 18 79 24 C59 28 45 36 31 40.5 L31 45.5 C46 49 64 57 93 60 C126 64 161 60 181 53 C189 50 193 47 193 44 Z"
                fill={`url(#piel-${id})`}
            />
            {/* Aleta del pecho */}
            <path d="M152 52 C148 60 141 66 132 70 C141 69 151 63 160 54 Z" fill={lomo} />
            {/* Labios negros y la línea de la boca */}
            <path d="M193 45 C190 49 184 51 177 50 C182 49 187 47 190 44 Z" fill={negro} />
            <path d="M190 46 C186 48 181 48 176 47" stroke={negro} strokeOpacity="0.5" strokeWidth="1" fill="none" strokeLinecap="round" />
            {/* El anillo negro del ojo, con el ojo y su brillo */}
            <ellipse cx="171" cy="38" rx="7" ry="5" fill={negro} transform="rotate(-8 171 38)" />
            <circle cx="172" cy="37.5" r="2" fill="#000" />
            <circle cx="172.8" cy="36.8" r="0.8" fill="#fff" fillOpacity="0.9" />
        </svg>
    );
}

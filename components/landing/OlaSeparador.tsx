/**
 * Borde de ola entre una franja clara y una oscura. `color` es el de la franja vecina;
 * `lado` dice si la ola cuelga desde arriba o sube desde abajo de la sección.
 */
export function OlaSeparador({ color, lado }: { color: string; lado: 'arriba' | 'abajo' }) {
    return (
        <svg
            aria-hidden="true"
            viewBox="0 0 1440 64"
            preserveAspectRatio="none"
            className={`absolute inset-x-0 h-10 md:h-16 w-full pointer-events-none ${lado === 'arriba' ? 'top-0' : 'bottom-0 rotate-180'}`}
        >
            <path
                d="M0 0 H1440 V22 C1320 44 1190 54 1060 40 C930 26 820 6 700 14 C580 22 470 50 340 52 C210 54 110 36 0 26 Z"
                style={{ fill: color, opacity: 0.45 }}
            />
            <path
                d="M0 0 H1440 V14 C1300 30 1180 38 1040 28 C900 18 800 2 680 8 C560 14 450 36 320 38 C190 40 100 26 0 18 Z"
                style={{ fill: color }}
            />
        </svg>
    );
}

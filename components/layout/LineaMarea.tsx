/**
 * Línea de marea (la ola del logo) bajo la sección activa. Es la firma visual de SiMAR:
 * va sólo en el menú lateral y en el menú de la landing (ver DISEÑO_SIMAR.md → Menú lateral).
 * Se dibuja de izquierda a derecha cuando aparece, así se nota a qué sección se llegó.
 */
export function LineaMarea({ className = 'absolute left-0 -bottom-[9px]' }: { className?: string }) {
    return (
        <svg aria-hidden="true" width="46" height="8" viewBox="0 0 44 8" className={className}>
            <path
                d="M0 4 Q2.75 0 5.5 4 T11 4 T16.5 4 T22 4 T27.5 4 T33 4 T38.5 4 T44 4"
                pathLength={1}
                className="simar-dibuja"
                style={{ fill: 'none', stroke: 'var(--simar-golfo)', strokeWidth: 2, strokeLinecap: 'round' }}
            />
        </svg>
    );
}

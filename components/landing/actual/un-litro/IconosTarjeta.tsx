/**
 * Íconos propios de «Lo que ya no está en el mar»: trazo de 1.8 como lucide (se ven de la misma
 * familia que el resto del sitio) y un relleno suave del mismo color para darles cuerpo. Uno por cada
 * unidad que puede salir de lib/utils/equivalencias.ts.
 */

export type TipoIcono = 'camion' | 'bolsa' | 'kilo' | 'filtro' | 'arbol' | 'auto';

/** El tipo según la unidad que eligió equivalencias.ts (nombre en singular) */
export function tipoDeUnidad(nombre: string): TipoIcono | null {
    if (nombre.startsWith('camión')) return 'camion';
    if (nombre.startsWith('bolsa')) return 'bolsa';
    if (nombre === 'kilo') return 'kilo';
    if (nombre === 'árbol') return 'arbol';
    if (nombre.startsWith('km')) return 'auto';
    return null;
}

const SUAVE = { fill: 'currentColor', fillOpacity: 0.16 } as const;

export function IconoTarjeta({ tipo, className }: { tipo: TipoIcono; className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            className={className}
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
            focusable="false"
        >
            {tipo === 'camion' && (
                <>
                    {/* Camión recolector: caja con la compuerta de atrás, cabina y llantas */}
                    <path d="M2.5 7.5 Q2.5 6 4 6 H14.5 V16 H2.5 Z" {...SUAVE} />
                    <path d="M2.5 7.5 Q2.5 6 4 6 H14.5 V16 H2.5 Z" />
                    <path d="M14.5 9 H18.6 L21.5 12.4 V16 H14.5" {...SUAVE} />
                    <path d="M14.5 9 H18.6 L21.5 12.4 V16 H14.5" />
                    <path d="M16.6 11 H18 L19.4 12.6 H16.6 Z" />
                    <path d="M6.2 6 V16" />
                    <circle cx="6.5" cy="17.5" r="1.9" fill="currentColor" />
                    <circle cx="17.5" cy="17.5" r="1.9" fill="currentColor" />
                </>
            )}
            {tipo === 'bolsa' && (
                <>
                    {/* Bolsa de basura amarrada */}
                    <path d="M8.6 9.2 C5.6 11 4.6 14.6 5.4 17.6 C6.1 20.2 8.6 21 12 21 C15.4 21 17.9 20.2 18.6 17.6 C19.4 14.6 18.4 11 15.4 9.2 Z" {...SUAVE} />
                    <path d="M8.6 9.2 C5.6 11 4.6 14.6 5.4 17.6 C6.1 20.2 8.6 21 12 21 C15.4 21 17.9 20.2 18.6 17.6 C19.4 14.6 18.4 11 15.4 9.2" />
                    <path d="M8.6 9.2 H15.4" />
                    <path d="M10.4 9.2 L8.4 4.6 Q10.4 5.2 12 6.6 Q13.6 5.2 15.6 4.6 L13.6 9.2" />
                    <path d="M9.2 13.6 Q10.6 15.4 10.4 18" />
                </>
            )}
            {tipo === 'kilo' && (
                <>
                    {/* Pez: lo que vive donde ya no llegó la basura */}
                    <path d="M2.8 12 C5.6 7.4 11.6 6.6 15.8 9.4 L21 6.4 V17.6 L15.8 14.6 C11.6 17.4 5.6 16.6 2.8 12 Z" {...SUAVE} />
                    <path d="M2.8 12 C5.6 7.4 11.6 6.6 15.8 9.4 L21 6.4 V17.6 L15.8 14.6 C11.6 17.4 5.6 16.6 2.8 12 Z" />
                    <path d="M10.6 9.2 C11.6 10.8 11.6 13.2 10.6 14.8" />
                    <circle cx="7" cy="11.2" r="1" fill="currentColor" stroke="none" />
                </>
            )}
            {tipo === 'filtro' && (
                <>
                    {/* Filtro de aceite, de tres cuartos: la cara de arriba con su rosca al centro y las estrías */}
                    <path d="M5 6.6 A7 2.6 0 0 1 19 6.6 V17.6 A7 2.6 0 0 1 5 17.6 Z" {...SUAVE} />
                    <path d="M5 6.6 V17.6 A7 2.6 0 0 0 19 17.6 V6.6" />
                    <ellipse cx="12" cy="6.6" rx="7" ry="2.6" />
                    <ellipse cx="12" cy="6.6" rx="2.2" ry="0.8" fill="currentColor" />
                    <path d="M5 10.6 A7 2.6 0 0 0 19 10.6" />
                    <path d="M8.4 14.4 V19.4 M12 14.8 V20 M15.6 14.4 V19.4" />
                </>
            )}
            {tipo === 'arbol' && (
                <>
                    {/* Árbol: la copa absorbe el CO₂ */}
                    <path d="M12 2.8 C9.2 2.8 7.2 4.8 7.2 7.3 C5.2 7.9 4 9.8 4 11.9 C4 14.4 6 16.2 8.6 16.2 H15.4 C18 16.2 20 14.4 20 11.9 C20 9.8 18.8 7.9 16.8 7.3 C16.8 4.8 14.8 2.8 12 2.8 Z" {...SUAVE} />
                    <path d="M12 2.8 C9.2 2.8 7.2 4.8 7.2 7.3 C5.2 7.9 4 9.8 4 11.9 C4 14.4 6 16.2 8.6 16.2 H15.4 C18 16.2 20 14.4 20 11.9 C20 9.8 18.8 7.9 16.8 7.3 C16.8 4.8 14.8 2.8 12 2.8 Z" />
                    <path d="M12 21.2 V11.6 M12 14.6 L9.4 12 M12 13.4 L14.6 10.8" />
                </>
            )}
            {tipo === 'auto' && (
                <>
                    {/* Auto: los km que no se manejaron */}
                    <path d="M2.8 16 V12.6 L5.4 11.6 L8 7.6 H15.4 L18.8 11.6 L21.2 12.6 V16 Z" {...SUAVE} />
                    <path d="M2.8 16 V12.6 L5.4 11.6 L8 7.6 H15.4 L18.8 11.6 L21.2 12.6 V16 H2.8" />
                    <path d="M5.4 11.6 H18.8 M12 7.6 V11.6" />
                    <circle cx="7.4" cy="16.6" r="2" fill="currentColor" />
                    <circle cx="16.8" cy="16.6" r="2" fill="currentColor" />
                </>
            )}
        </svg>
    );
}

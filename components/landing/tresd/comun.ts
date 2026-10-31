/**
 * Piezas comunes de la landing 3D: cuentas del scroll y el aviso de "reducir movimiento".
 */
export { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';

/** 0 antes de `a`, 1 después de `b` y una recta entre los dos */
export function rampa(x: number, a: number, b: number) {
    if (x <= a) return 0;
    if (x >= b) return 1;
    return (x - a) / (b - a);
}

/** Sale y llega despacio (smoothstep sobre 0–1) */
export function suave(t: number) {
    return t * t * (3 - 2 * t);
}

/** Número con separador de miles a la mexicana */
export const cifra = (n: number, decimales = 0) =>
    n.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

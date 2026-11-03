/** ¿El usuario pidió menos movimiento? (para el desplazamiento suave y las cifras que suben) */
export const sinMovimiento = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

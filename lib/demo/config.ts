/**
 * Modo demostración (ver supabase/demo/README.md).
 *
 * Lo enciende `NEXT_PUBLIC_MODO_DEMO=1` en el despliegue de la demo, que apunta a su propio proyecto
 * Supabase con datos inventados y de sólo lectura. En producción está apagado: nada de lib/demo ni de
 * components/demo se monta, salvo el enlace "Probar la demostración" de la landing si existe
 * `NEXT_PUBLIC_URL_DEMO`.
 */
export const MODO_DEMO = process.env.NEXT_PUBLIC_MODO_DEMO === '1';

/** Dónde vive la demo (sin "/" al final), para enlazarla desde la landing de producción. '' = no hay. */
export const URL_DEMO = (process.env.NEXT_PUBLIC_URL_DEMO ?? '').replace(/\/+$/, '');

export type VistaDemo = 'puerto' | 'empresa';

/**
 * Las dos cuentas de la demo (se crean a mano en el Supabase de la demo, ver el README). La clave no
 * protege nada: esa base es de datos inventados y rechaza cualquier escritura, por eso puede ir en el
 * código del navegador.
 */
const CLAVE_DEMO = process.env.NEXT_PUBLIC_DEMO_CLAVE || 'SimarDemo2026';

export const CUENTAS_DEMO: Record<VistaDemo, { correo: string; clave: string; inicio: string }> = {
    puerto: {
        correo: process.env.NEXT_PUBLIC_DEMO_CORREO_PUERTO || 'puerto@simar.demo',
        clave: CLAVE_DEMO,
        inicio: '/dashboard',
    },
    empresa: {
        correo: process.env.NEXT_PUBLIC_DEMO_CORREO_EMPRESA || 'empresa@simar.demo',
        clave: CLAVE_DEMO,
        inicio: '/dashboard-recolector',
    },
};

export function esVistaDemo(valor: unknown): valor is VistaDemo {
    return valor === 'puerto' || valor === 'empresa';
}

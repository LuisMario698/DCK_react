/**
 * Qué base de datos se ve en este navegador: la de SiMAR (la de siempre) o la de DCK (proyecto
 * Supabase "CIAD", la base anterior con los registros de DCK), sólo para consultar.
 *
 * La elige un superadmin en Superadmin → Sistema y se guarda en la cookie `simar_base` de su
 * navegador: a los demás no les cambia nada. Sólo afecta la landing y el recinto portuario
 * (/dashboard); el portal de empresas y el superadmin siguen siempre en SiMAR. Ver lib/supabase/dck.ts.
 *
 * Este archivo también lo usa el navegador: aquí no va la llave de CIAD (ver dckServidor.ts).
 */

export const COOKIE_BASE = 'simar_base';

export type BaseDatos = 'simar' | 'dck';

/** Dirección de CIAD (no es secreta: la llave sí, y vive sólo en el servidor) */
export const DCK_URL = process.env.NEXT_PUBLIC_SB_DCK_URL ?? '';
/** Sin la dirección no hay base de DCK que elegir: todo se queda en SiMAR */
export const DCK_DISPONIBLE = Boolean(DCK_URL);

/** La base que pide el valor de la cookie (cualquier otro valor es SiMAR) */
export function baseDeCookie(valor: string | null | undefined): BaseDatos {
    return DCK_DISPONIBLE && valor === 'dck' ? 'dck' : 'simar';
}

/** La landing (/es) y el recinto (/es/dashboard/…): lo único que se ve con la base de DCK */
export function rutaConBaseElegible(ruta: string): boolean {
    return ruta === '/' || /^\/[a-z]{2}\/?$/.test(ruta) || /^\/[a-z]{2}\/dashboard(\/|$)/.test(ruta);
}

/** En el navegador: la base elegida, sin importar la pantalla */
export function baseDelNavegador(): BaseDatos {
    if (typeof document === 'undefined') return 'simar';
    const valor = document.cookie
        .split('; ')
        .find((c) => c.startsWith(`${COOKIE_BASE}=`))
        ?.slice(COOKIE_BASE.length + 1);
    return baseDeCookie(valor);
}

/** En el navegador: ¿esta pantalla se ve con los datos de DCK? */
export function enModoDck(): boolean {
    return typeof window !== 'undefined' && baseDelNavegador() === 'dck' && rutaConBaseElegible(window.location.pathname);
}

/** Cambia la base de este navegador (30 días; SiMAR = sin cookie) */
export function elegirBase(base: BaseDatos) {
    document.cookie =
        base === 'dck'
            ? `${COOKIE_BASE}=dck; path=/; max-age=${60 * 60 * 24 * 30}; SameSite=Lax`
            : `${COOKIE_BASE}=; path=/; max-age=0; SameSite=Lax`;
}

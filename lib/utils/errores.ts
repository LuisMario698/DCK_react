/** Lo que traen los errores de Supabase/PostgREST (y los Error de JavaScript), para leerlos sin `any` */
export interface ErrorConDetalle {
    message?: string;
    /** Código de Postgres o de PostgREST: '23503' (llave foránea), '23505' (repetido)… */
    code?: string;
    details?: string;
    hint?: string;
    status?: number;
}

/** El error atrapado en un `catch`, con sus campos opcionales a la mano */
export function detalleDe(causa: unknown): ErrorConDetalle {
    if (typeof causa === 'object' && causa !== null) return causa as ErrorConDetalle;
    return { message: String(causa) };
}

/** Lo que se le dice a la persona cuando la petición ni siquiera llegó (sin señal, wifi caído) */
export const MENSAJE_SIN_CONEXION = 'No hay conexión con SiMAR. Revisa tu internet e inténtalo de nuevo.';

/**
 * ¿El error es de red y no de Supabase? Cada navegador lo dice distinto: Chrome "Failed to fetch",
 * Safari "Load failed", Firefox "NetworkError when attempting to fetch resource."; supabase-js
 * a veces lo envuelve como "fetch failed". Sin esto la persona leía el texto en inglés.
 */
export function esErrorDeRed(mensaje: string | undefined): boolean {
    return /failed to fetch|load failed|networkerror|fetch failed|network request failed/i.test(mensaje ?? '');
}

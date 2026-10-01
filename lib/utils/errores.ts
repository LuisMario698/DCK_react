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

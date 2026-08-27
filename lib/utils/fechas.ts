/**
 * Utilidades de fecha para los campos `date` de Supabase.
 *
 * Las columnas `date` (`manifiestos.fecha_emision`, `manifiesto_basuron.fecha`,
 * `buques.fecha_registro`, ...) llegan como cadenas 'YYYY-MM-DD'. `new Date()`
 * las interpreta como medianoche **UTC**, así que al mostrarlas en Puerto
 * Peñasco (UTC-7) retroceden un día: un recibo del 1 de agosto se veía como
 * "31 jul". Añadir la hora fuerza la interpretación en hora local y elimina
 * el desfase.
 *
 * Las columnas `timestamptz` (`created_at`, `updated_at`) sí llevan zona
 * horaria y deben convertirse a local: `parseFechaLocal` las detecta y las
 * deja pasar sin tocar.
 */

/** Cadena de fecha sin hora, tal y como la devuelve una columna `date`. */
const SOLO_FECHA = /^\d{4}-\d{2}-\d{2}$/;

/**
 * Convierte una fecha de Supabase en un `Date` sin desfase de zona horaria.
 *
 * - 'YYYY-MM-DD'  → medianoche local (evita el salto de un día).
 * - Cualquier otro formato (ISO con hora, timestamptz) → sin cambios.
 */
export function parseFechaLocal(fecha: string | Date): Date {
    if (fecha instanceof Date) return fecha;
    return SOLO_FECHA.test(fecha) ? new Date(`${fecha}T00:00:00`) : new Date(fecha);
}

/**
 * Formatea una fecha de Supabase con `toLocaleDateString`, ya corregida.
 * Mismos argumentos que el método nativo.
 */
export function formatearFecha(
    fecha: string | Date,
    locale: string = 'es-MX',
    opciones: Intl.DateTimeFormatOptions = { day: '2-digit', month: 'short', year: 'numeric' }
): string {
    return parseFechaLocal(fecha).toLocaleDateString(locale, opciones);
}

/** Fecha larga en español: "26 de agosto de 2026". */
export function formatearFechaLarga(fecha: string | Date): string {
    return parseFechaLocal(fecha).toLocaleDateString('es-ES', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/** Fecha de hoy como 'YYYY-MM-DD' en hora local (no en UTC). */
export function hoyLocal(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
}

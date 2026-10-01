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
    return parseFechaLocal(fecha).toLocaleDateString('es-MX', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

/** Hora actual 'HH:MM' en hora local. */
export function horaLocal(): string {
    const ahora = new Date();
    return `${String(ahora.getHours()).padStart(2, '0')}:${String(ahora.getMinutes()).padStart(2, '0')}`;
}

/** Fecha de hoy como 'YYYY-MM-DD' en hora local (no en UTC). */
export function hoyLocal(): string {
    const ahora = new Date();
    const mes = String(ahora.getMonth() + 1).padStart(2, '0');
    const dia = String(ahora.getDate()).padStart(2, '0');
    return `${ahora.getFullYear()}-${mes}-${dia}`;
}

/**
 * Puerto Peñasco: UTC-7 todo el año. Para lo que se calcula en el servidor (Vercel corre en UTC),
 * donde `hoyLocal()` daría la fecha y la hora de otra zona.
 */
const ZONA_PUERTO = 'America/Hermosillo';

/** Fecha de hoy en Puerto Peñasco ('YYYY-MM-DD'), como `public.hoy_local()`, se calcule donde se calcule. */
export function hoyPuerto(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: ZONA_PUERTO }).format(new Date());
}

/** "Buenos días", "Buenas tardes" o "Buenas noches" según la hora en Puerto Peñasco. */
export function saludoPuerto(ahora = new Date()): string {
    const hora = Number(new Intl.DateTimeFormat('en-US', { hour: 'numeric', hourCycle: 'h23', timeZone: ZONA_PUERTO }).format(ahora));
    if (hora >= 5 && hora < 12) return 'Buenos días';
    if (hora >= 12 && hora < 19) return 'Buenas tardes';
    return 'Buenas noches';
}

export type GrupoDelDia = 'Hoy' | 'Ayer' | 'Antes';

/**
 * Agrupa una lista (ya ordenada de lo más nuevo a lo más viejo) en "Hoy", "Ayer" y "Antes", con la
 * hora del dispositivo. Sólo en el navegador: en el servidor la zona sería otra.
 */
export function agruparPorDia<T extends { created_at: string }>(lista: T[], ahora = new Date()): { grupo: GrupoDelDia; items: T[] }[] {
    const hoy = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate()).getTime();
    const ayer = new Date(ahora.getFullYear(), ahora.getMonth(), ahora.getDate() - 1).getTime();
    const grupos: { grupo: GrupoDelDia; items: T[] }[] = [];
    for (const item of lista) {
        const t = new Date(item.created_at).getTime();
        const grupo: GrupoDelDia = t >= hoy ? 'Hoy' : t >= ayer ? 'Ayer' : 'Antes';
        const ultimo = grupos[grupos.length - 1];
        if (ultimo?.grupo === grupo) ultimo.items.push(item);
        else grupos.push({ grupo, items: [item] });
    }
    return grupos;
}

/** Hoy en Puerto Peñasco, para leer: "Martes 30 de septiembre". */
export function fechaHoyPuerto(ahora = new Date()): string {
    const texto = new Intl.DateTimeFormat('es-MX', { weekday: 'long', day: 'numeric', month: 'long', timeZone: ZONA_PUERTO })
        .format(ahora)
        .replace(',', '');
    return texto.charAt(0).toUpperCase() + texto.slice(1);
}

// Catálogo del módulo de suscripciones (panel de superadmin).
// Debe coincidir con los CHECK de supabase/migrations/20260925000005_panel_superadmin.sql.
// Todos los importes son en MXN.

export type EstadoSuscripcion = 'prueba' | 'activa' | 'vencida' | 'suspendida' | 'cancelada';
export type CicloSuscripcion = 'mensual' | 'anual';
export type MetodoPago = 'transferencia' | 'deposito' | 'efectivo' | 'tarjeta' | 'otro';

/** Estados que se pueden guardar; 'vencida' sólo se deriva de la fecha. */
export const ESTADOS_GUARDABLES: Exclude<EstadoSuscripcion, 'vencida'>[] = ['prueba', 'activa', 'suspendida', 'cancelada'];

export const ESTADO_SUSCRIPCION_LABEL: Record<EstadoSuscripcion, string> = {
    prueba: 'En prueba',
    activa: 'Activa',
    vencida: 'Vencida',
    suspendida: 'Suspendida',
    cancelada: 'Cancelada',
};

export const ESTADO_SUSCRIPCION_COLOR: Record<EstadoSuscripcion, string> = {
    prueba: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300',
    activa: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
    vencida: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
    suspendida: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300',
    cancelada: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400',
};

export const CICLO_LABEL: Record<CicloSuscripcion, string> = {
    mensual: 'Mensual',
    anual: 'Anual',
};

export const METODO_PAGO_LABEL: Record<MetodoPago, string> = {
    transferencia: 'Transferencia',
    deposito: 'Depósito',
    efectivo: 'Efectivo',
    tarjeta: 'Tarjeta',
    otro: 'Otro',
};

/** Fecha de hoy en Puerto Peñasco (UTC-7), como `public.hoy_local()` (no la zona del navegador). */
export function hoyPuerto(): string {
    return new Intl.DateTimeFormat('en-CA', { timeZone: 'America/Hermosillo' }).format(new Date());
}

/** Igual que `public.estado_efectivo_suscripcion()`: prueba/activa con fecha pasada = vencida. */
export function estadoEfectivo(estado: EstadoSuscripcion, venceEl: string | null): EstadoSuscripcion {
    if ((estado === 'prueba' || estado === 'activa') && venceEl && venceEl < hoyPuerto()) return 'vencida';
    return estado;
}

/** Días que faltan para `fecha` (negativo si ya pasó). */
export function diasHasta(fecha: string): number {
    const a = Date.parse(`${hoyPuerto()}T00:00:00Z`);
    const b = Date.parse(`${fecha}T00:00:00Z`);
    return Math.round((b - a) / 86_400_000);
}

/** Suma meses a una fecha 'YYYY-MM-DD' ajustando al último día del mes (31-ene + 1 = 28/29-feb). */
export function sumarMeses(fecha: string, meses: number): string {
    const [y, m, d] = fecha.split('-').map(Number);
    const destino = new Date(Date.UTC(y, m - 1 + meses, 1));
    const ultimoDia = new Date(Date.UTC(destino.getUTCFullYear(), destino.getUTCMonth() + 1, 0)).getUTCDate();
    destino.setUTCDate(Math.min(d, ultimoDia));
    return destino.toISOString().slice(0, 10);
}

export function sumarDias(fecha: string, dias: number): string {
    const f = new Date(`${fecha}T00:00:00Z`);
    f.setUTCDate(f.getUTCDate() + dias);
    return f.toISOString().slice(0, 10);
}

/** Siguiente vencimiento a partir de `desde` según el ciclo. */
export function siguientePeriodo(desde: string, ciclo: CicloSuscripcion): string {
    return sumarMeses(desde, ciclo === 'anual' ? 12 : 1);
}

/** Importe mensual equivalente (una anual cuenta 1/12 por mes). */
export function precioMensual(precio: number, ciclo: CicloSuscripcion): number {
    return ciclo === 'anual' ? precio / 12 : precio;
}

const MXN = new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN', maximumFractionDigits: 2 });

export function formatoMXN(n: number): string {
    return MXN.format(n);
}

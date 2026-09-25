// Catálogo de residuos del módulo de asociaciones recolectoras.
// Debe coincidir con el dominio `public.tipo_residuo` de la base de datos
// (supabase/migrations/20260923000002_modulo_asociaciones.sql).

export type TipoResiduo = 'plastico' | 'aceite' | 'carton' | 'chatarra' | 'vidrio' | 'organico' | 'filtros';
export type UnidadResiduo = 'kg' | 'L' | 'pz';

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'completada' | 'cancelada';

export const TIPOS_RESIDUO: TipoResiduo[] = [
    'plastico',
    'aceite',
    'carton',
    'chatarra',
    'vidrio',
    'organico',
    'filtros',
];

export const TIPO_RESIDUO_LABEL: Record<TipoResiduo, string> = {
    plastico: 'Plástico',
    aceite: 'Aceite usado',
    carton: 'Cartón',
    chatarra: 'Chatarra metálica',
    vidrio: 'Vidrio',
    organico: 'Orgánico',
    filtros: 'Filtros usados',
};

/** Unidad con la que se mide cada residuo. */
export const UNIDAD_POR_TIPO: Record<TipoResiduo, UnidadResiduo> = {
    plastico: 'kg',
    aceite: 'L',
    carton: 'kg',
    chatarra: 'kg',
    vidrio: 'kg',
    organico: 'kg',
    filtros: 'pz',
};

export const TIPO_RESIDUO_COLOR: Record<TipoResiduo, string> = {
    plastico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    aceite: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    carton: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    chatarra: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    vidrio: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    organico: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
    filtros: 'bg-slate-200 text-slate-700 dark:bg-slate-700/40 dark:text-slate-300',
};

/** Colores sólidos para gráficas y el mapa. */
export const TIPO_RESIDUO_HEX: Record<TipoResiduo, string> = {
    plastico: '#3b82f6',
    aceite: '#f59e0b',
    carton: '#10b981',
    chatarra: '#a855f7',
    vidrio: '#06b6d4',
    organico: '#84cc16',
    filtros: '#94a3b8',
};

export const ESTADO_SOLICITUD_LABEL: Record<EstadoSolicitud, string> = {
    pendiente: 'Pendiente',
    aprobada: 'Aprobada',
    rechazada: 'Rechazada',
    completada: 'Completada',
    cancelada: 'Cancelada',
};

/**
 * Centro de acopio. En la Fase 1 sólo existe Puerto Peñasco; si en el futuro
 * se suman puertos, esto pasa a una tabla `puertos`.
 */
export const PUERTO_PENASCO = {
    id: 'penasco',
    nombre: 'Puerto Peñasco',
    region: 'Sonora',
    lat: 31.3167,
    lng: -113.5333,
    imagen: '/images/penasco.jpg',
} as const;

export function esTipoResiduo(valor: string): valor is TipoResiduo {
    return (TIPOS_RESIDUO as string[]).includes(valor);
}

/** 1500 → "1,500"; 12.5 → "12.5" */
export function formatCantidad(n: number): string {
    return Number(n).toLocaleString('es-MX', { maximumFractionDigits: 2 });
}

/** Tiempo relativo en español a partir de una fecha ISO: "Hace 5 min". */
export function tiempoRelativo(iso: string): string {
    const min = Math.max(0, Math.round((Date.now() - new Date(iso).getTime()) / 60000));
    if (min < 1) return 'Justo ahora';
    if (min < 60) return `Hace ${min} min`;
    if (min < 1440) return `Hace ${Math.floor(min / 60)} h`;
    const dias = Math.floor(min / 1440);
    return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
}

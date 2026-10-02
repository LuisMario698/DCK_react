import type { AsociacionRecolectora } from '@/types/database';

export type EstadoEmpresa = AsociacionRecolectora['estado'];

/**
 * En la base de datos el estado de una empresa recolectora se guarda como "Activo", "Inactivo" o
 * "Suspendido"; en la interfaz se habla de "la empresa": "Activa", "Tu empresa está suspendida".
 */
export const ESTADO_EMPRESA_LABEL: Record<EstadoEmpresa, string> = {
    Activo: 'Activa',
    Inactivo: 'Inactiva',
    Suspendido: 'Suspendida',
};

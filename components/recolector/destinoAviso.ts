import type { Notificacion, SolicitudRecoleccion } from '@/types/database';
import { solicitudDelAviso } from '@/lib/services/solicitudes';

/**
 * A dónde lleva un aviso del portal: a su solicitud, abierta (`solicitudes?ver=ID`); a Residuos si
 * avisa de un residuo nuevo; o a Mis solicitudes si no se encuentra cuál era. `base` es
 * `/{locale}/dashboard-recolector`.
 */
export function destinoDelAviso(
    aviso: Pick<Notificacion, 'tipo' | 'detalle' | 'created_at'>,
    solicitudes: SolicitudRecoleccion[],
    base: string
): string {
    if (aviso.tipo === 'nuevo_residuo') return `${base}/mapa`;
    const id = solicitudDelAviso(aviso, solicitudes);
    return id ? `${base}/solicitudes?ver=${id}` : `${base}/solicitudes`;
}

import { createClient } from '@/lib/supabase/client';
import type { ManifiestoConRelaciones, Recoleccion, RecoleccionConAsociacion, SolicitudRecoleccion } from '@/types/database';

/**
 * PDF de ejemplo para la demostración, generados en el navegador con los mismos generadores de la app
 * (lib/utils/pdfGenerator*.ts) y los datos de la base de la demo. Las firmas son trazos de ejemplo.
 * Los generadores se cargan al pedirlos: jsPDF no pesa en el recorrido hasta que alguien quiere ver un PDF.
 */

/** Un trazo que parece firma (el mismo para la misma persona), como data URL PNG */
export function firmaDeEjemplo(semilla: string): string {
    const lienzo = document.createElement('canvas');
    lienzo.width = 420;
    lienzo.height = 140;
    const ctx = lienzo.getContext('2d');
    if (!ctx) return '';
    let h = 7;
    for (const letra of semilla) h = (h * 31 + letra.charCodeAt(0)) >>> 0;
    const azar = () => (h = (Math.imul(h, 1103515245) + 12345) >>> 0) / 2 ** 32;
    ctx.strokeStyle = '#1B2A4A';
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.beginPath();
    let x = 34;
    let y = 82;
    ctx.moveTo(x, y);
    for (let i = 0; i < 7; i++) {
        const nx = x + 38 + azar() * 18;
        const ny = 46 + azar() * 62;
        ctx.bezierCurveTo(x + 14, y - 48 * azar(), nx - 14, ny + 48 * azar(), nx, ny);
        x = nx;
        y = ny;
    }
    ctx.stroke();
    // La rúbrica de abajo
    ctx.beginPath();
    ctx.moveTo(44, 112);
    ctx.quadraticCurveTo(200, 134, 384, 96);
    ctx.stroke();
    return lienzo.toDataURL('image/png');
}

/** El manifiesto más reciente de la demo, firmado con trazos de ejemplo (sólo lo ve el puerto) */
export async function pdfManifiestoDeEjemplo(): Promise<Blob> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('manifiestos')
        .select(
            `*,
            buque: buque_id(id, nombre_buque),
            responsable_principal: responsable_principal_id(id, nombre),
            responsable_secundario: responsable_secundario_id(id, nombre),
            responsable_liquidos: responsable_liquidos_id(id, nombre),
            residuos: manifiestos_residuos(*)`
        )
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No hay manifiestos en la demostración');
    return pdfManifiestoFirmado({
        ...data,
        residuos: Array.isArray(data.residuos) ? (data.residuos[0] ?? null) : (data.residuos ?? null),
    } as ManifiestoConRelaciones);
}

/** Un manifiesto de la demo con firmas de ejemplo (los de la demo no guardan firmas ni PDF) */
export async function pdfManifiestoFirmado(manifiesto: ManifiestoConRelaciones): Promise<Blob> {
    const motorista = manifiesto.responsable_principal?.nombre;
    const cocinero = manifiesto.responsable_secundario?.nombre;
    const liquidos = manifiesto.responsable_liquidos?.nombre;
    const { generarPDFManifiesto } = await import('@/lib/utils/pdfGenerator');
    return generarPDFManifiesto(manifiesto, {
        oficialFirma: firmaDeEjemplo('Oficial comisionado'),
        motoristaFirma: motorista ? firmaDeEjemplo(motorista) : null,
        motoristaNombre: motorista,
        cocineroFirma: cocinero ? firmaDeEjemplo(cocinero) : null,
        cocineroNombre: cocinero,
        liquidosFirma: liquidos ? firmaDeEjemplo(liquidos) : null,
        liquidosNombre: liquidos,
    });
}

type SolicitudDelComprobante = Pick<SolicitudRecoleccion, 'cantidad_solicitada' | 'cantidad_aprobada' | 'fecha_propuesta'>;

/** El comprobante de una recolección, firmado con trazos de ejemplo (en la demo no se guarda ninguno) */
export async function pdfComprobanteDe(
    recoleccion: Recoleccion,
    asociacion: RecoleccionConAsociacion['asociacion'],
    solicitud?: SolicitudDelComprobante | null
): Promise<Blob> {
    const { generarPDFRecoleccion } = await import('@/lib/utils/pdfGeneratorRecoleccion');
    return generarPDFRecoleccion({
        recoleccion: { ...recoleccion, cantidad: Number(recoleccion.cantidad) },
        asociacion,
        solicitud,
        firmaEntrega: firmaDeEjemplo(recoleccion.entregado_por ?? 'Centro de acopio'),
        firmaRecibe: firmaDeEjemplo(recoleccion.recibido_por ?? asociacion?.nombre_asociacion ?? 'Empresa'),
    });
}

/** El comprobante de la recolección más reciente que la cuenta puede ver (el puerto, todas; la empresa, las suyas) */
export async function pdfComprobanteDeEjemplo(): Promise<Blob> {
    const supabase = createClient();
    const { data, error } = await supabase
        .from('recolecciones')
        .select(
            `*,
            asociacion: asociaciones_recolectoras(id, nombre_asociacion, rfc, ubicacion),
            solicitud: solicitudes_recoleccion(cantidad_solicitada, cantidad_aprobada, fecha_propuesta)`
        )
        .order('fecha', { ascending: false })
        .order('id', { ascending: false })
        .limit(1)
        .maybeSingle();
    if (error) throw error;
    if (!data) throw new Error('No hay recolecciones en la demostración');
    const { asociacion, solicitud, ...recoleccion } = data as RecoleccionConAsociacion & { solicitud: SolicitudDelComprobante | null };
    return pdfComprobanteDe(recoleccion, asociacion, solicitud);
}

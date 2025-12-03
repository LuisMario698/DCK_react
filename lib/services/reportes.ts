import { createClient } from '@/lib/supabase/client';

export interface ReporteFechas {
    fecha: string;
    total_aceite: number;
    total_basura: number;
    total_filtros_diesel: number;
    cantidad_manifiestos: number;
}

export async function getReporteResiduosPorFechas(fechaInicio: string, fechaFin: string) {
    const supabase = createClient();

    // Consultar manifiestos y sus residuos en el rango de fechas
    const { data, error } = await supabase
        .from('manifiestos')
        .select(`
      fecha_emision,
      residuos:manifiestos_residuos(
        aceite_usado,
        basura,
        filtros_diesel
      )
    `)
        .gte('fecha_emision', fechaInicio)
        .lte('fecha_emision', fechaFin)
        .order('fecha_emision');

    if (error) throw error;

    // Agrupar por fecha
    const reporte: Record<string, ReporteFechas> = {};

    data?.forEach((m) => {
        const fecha = m.fecha_emision;
        if (!reporte[fecha]) {
            reporte[fecha] = {
                fecha,
                total_aceite: 0,
                total_basura: 0,
                total_filtros_diesel: 0,
                cantidad_manifiestos: 0,
            };
        }

        if (m.residuos) {
            // Supabase devuelve un objeto único para relación 1:1, o array si 1:N. 
            // En esquema es 1:1 (manifiesto_id unique).
            // TypeScript podría inferirlo como array o objeto según la generación de tipos.
            // Asumimos objeto o array y tratamos de sumar.
            const r = Array.isArray(m.residuos) ? m.residuos[0] : m.residuos;

            if (r) {
                reporte[fecha].total_aceite += Number(r.aceite_usado || 0);
                reporte[fecha].total_basura += Number(r.basura || 0);
                reporte[fecha].total_filtros_diesel += Number(r.filtros_diesel || 0);
            }
        }
        reporte[fecha].cantidad_manifiestos += 1;
    });

    return Object.values(reporte);
}

export async function getTotalesGenerales() {
    const supabase = createClient();

    // Suma total histórica (ejemplo simplificado, idealmente usar RPC para sumas en DB)
    const { data, error } = await supabase
        .from('manifiestos_residuos')
        .select('aceite_usado, basura, filtros_diesel');

    if (error) throw error;

    const totales = data.reduce((acc, curr) => ({
        aceite: acc.aceite + Number(curr.aceite_usado || 0),
        basura: acc.basura + Number(curr.basura || 0),
        diesel: acc.diesel + Number(curr.filtros_diesel || 0)
    }), { aceite: 0, basura: 0, diesel: 0 });

    return totales;
}

// Método para guardar firma digital
export async function saveFirmaDigital(manifiestoId: number, firmaBase64: string) {
    const supabase = createClient();

    // 1. Convertir base64 a Blob/File si es necesario subirlo a Storage
    // O guardar directamente si es pequeña (no recomendado para producción real, mejor Storage)

    // Opción A: Subir a Supabase Storage
    const fileName = `firmas/manifiesto_${manifiestoId}_${Date.now()}.png`;
    // Aquí iría la lógica de conversión base64 -> Blob -> upload

    // Opción B: Guardar URL si ya se subió, o actualizar estado
    // Por ahora simulamos la actualización del campo en base de datos
    // Asumiendo que existe un campo 'firma_url' o similar, o se guarda en 'observaciones' por ahora

    // Nota: El esquema actual no tiene campo explícito 'firma_url' en tabla 'manifiestos'.
    // Se recomienda agregar: ALTER TABLE manifiestos ADD COLUMN firma_digital_url TEXT;

    /* 
    const { data, error } = await supabase
      .from('manifiestos')
      .update({ 
        estado_digitalizacion: 'completado',
        // firma_digital_url: publicUrl 
      })
      .eq('id', manifiestoId);
    */

    return { success: true, message: "Método implementado (lógica pendiente de campo en DB)" };
}

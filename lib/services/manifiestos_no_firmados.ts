import { createClient } from '@/lib/supabase/client';
import { ManifiestoNoFirmado, ManifiestoNoFirmadoConRelaciones } from '@/types/database';

const supabase = createClient();

/**
 * Obtener todos los manifiestos no firmados
 */
export async function getManifiestosNoFirmados(): Promise<ManifiestoNoFirmadoConRelaciones[]> {
  const { data, error } = await supabase
    .from('manifiestos_no_firmados')
    .select(`
      *,
      manifiesto:manifiestos(
        *,
        buque:buques(*),
        responsable_principal:personas!manifiestos_responsable_principal_id_fkey(*),
        responsable_secundario:personas!manifiestos_responsable_secundario_id_fkey(*)
      )
    `)
    .order('fecha_generacion', { ascending: false });

  if (error) throw error;
  return data as ManifiestoNoFirmadoConRelaciones[];
}

/**
 * Obtener manifiestos no firmados por estado
 */
export async function getManifiestosNoFirmadosPorEstado(
  estado: 'pendiente' | 'descargado' | 'firmado' | 'cancelado'
): Promise<ManifiestoNoFirmadoConRelaciones[]> {
  const { data, error } = await supabase
    .from('manifiestos_no_firmados')
    .select(`
      *,
      manifiesto:manifiestos(
        *,
        buque:buques(*),
        responsable_principal:personas!manifiestos_responsable_principal_id_fkey(*),
        responsable_secundario:personas!manifiestos_responsable_secundario_id_fkey(*)
      )
    `)
    .eq('estado', estado)
    .order('fecha_generacion', { ascending: false });

  if (error) throw error;
  return data as ManifiestoNoFirmadoConRelaciones[];
}

/**
 * Obtener un manifiesto no firmado por ID
 */
export async function getManifiestoNoFirmadoById(id: number): Promise<ManifiestoNoFirmadoConRelaciones> {
  const { data, error } = await supabase
    .from('manifiestos_no_firmados')
    .select(`
      *,
      manifiesto:manifiestos(
        *,
        buque:buques(*),
        responsable_principal:personas!manifiestos_responsable_principal_id_fkey(*),
        responsable_secundario:personas!manifiestos_responsable_secundario_id_fkey(*)
      )
    `)
    .eq('id', id)
    .single();

  if (error) throw error;
  return data as ManifiestoNoFirmadoConRelaciones;
}

/**
 * Obtener manifiesto no firmado por manifiesto_id
 */
export async function getManifiestoNoFirmadoByManifiestoId(
  manifiestoId: number
): Promise<ManifiestoNoFirmado | null> {
  const { data, error } = await supabase
    .from('manifiestos_no_firmados')
    .select('*')
    .eq('manifiesto_id', manifiestoId)
    .order('fecha_generacion', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  return data as ManifiestoNoFirmado | null;
}

/**
 * Crear registro de manifiesto no firmado
 */
export async function createManifiestoNoFirmado(
  data: Omit<ManifiestoNoFirmado, 'id' | 'created_at' | 'updated_at'>
): Promise<ManifiestoNoFirmado> {
  const { data: result, error } = await supabase
    .from('manifiestos_no_firmados')
    .insert(data)
    .select()
    .single();

  if (error) throw error;
  return result as ManifiestoNoFirmado;
}

/**
 * Actualizar manifiesto no firmado
 */
export async function updateManifiestoNoFirmado(
  id: number,
  updates: Partial<Omit<ManifiestoNoFirmado, 'id' | 'created_at' | 'updated_at'>>
): Promise<ManifiestoNoFirmado> {
  const { data, error } = await supabase
    .from('manifiestos_no_firmados')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (error) throw error;
  return data as ManifiestoNoFirmado;
}

/**
 * Marcar manifiesto como descargado
 */
export async function marcarComoDescargado(
  id: number,
  descargadoPor: string
): Promise<ManifiestoNoFirmado> {
  return updateManifiestoNoFirmado(id, {
    estado: 'descargado',
    descargado_en: new Date().toISOString(),
    descargado_por: descargadoPor,
  });
}

/**
 * Marcar manifiesto como firmado
 */
export async function marcarComoFirmado(id: number): Promise<ManifiestoNoFirmado> {
  return updateManifiestoNoFirmado(id, {
    estado: 'firmado',
    firmado_en: new Date().toISOString(),
  });
}

/**
 * Eliminar manifiesto no firmado
 */
export async function deleteManifiestoNoFirmado(id: number): Promise<void> {
  const { error } = await supabase
    .from('manifiestos_no_firmados')
    .delete()
    .eq('id', id);

  if (error) throw error;
}

/**
 * Subir PDF al bucket de storage
 */
export async function uploadPDFToStorage(
  file: Blob,
  fileName: string,
  folder: string = new Date().getFullYear().toString()
): Promise<string> {
  const filePath = `${folder}/${fileName}`;
  
  const { data, error } = await supabase.storage
    .from('manifiestos-no-firmados')
    .upload(filePath, file, {
      contentType: 'application/pdf',
      upsert: true,
    });

  if (error) throw error;
  return data.path;
}

/**
 * Obtener URL de descarga temporal (válida por 1 hora)
 */
export async function getDownloadURL(filePath: string): Promise<string> {
  const { data, error } = await supabase.storage
    .from('manifiestos-no-firmados')
    .createSignedUrl(filePath, 3600); // 1 hora

  if (error) throw error;
  return data.signedUrl;
}

/**
 * Eliminar PDF del storage
 */
export async function deletePDFFromStorage(filePath: string): Promise<void> {
  const { error } = await supabase.storage
    .from('manifiestos-no-firmados')
    .remove([filePath]);

  if (error) throw error;
}

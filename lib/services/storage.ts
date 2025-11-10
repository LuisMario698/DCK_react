import { createClient } from '@/lib/supabase/client';

const BUCKET_NAME = 'manifiestos_img';

export async function uploadManifiestoImage(file: File, numeroManifiesto: string): Promise<string> {
  try {
    const supabase = createClient();
    
    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${numeroManifiesto}_${timestamp}.${extension}`;

    console.log('📤 Subiendo archivo:', fileName);

    // Subir archivo al bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo archivo:', error);
      throw new Error(`Error al subir el archivo: ${error.message}`);
    }

    console.log('✅ Archivo subido:', data);

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('🔗 URL pública generada:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (error: any) {
    console.error('❌ Error en uploadManifiestoImage:', error);
    throw error;
  }
}

export async function deleteManifiestoImage(imageUrl: string): Promise<void> {
  try {
    const supabase = createClient();
    
    // Extraer el nombre del archivo de la URL
    const urlParts = imageUrl.split('/');
    const fileName = urlParts[urlParts.length - 1];
    
    if (!fileName) {
      throw new Error('URL de imagen inválida');
    }

    console.log('🗑️ Eliminando archivo:', fileName);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('❌ Error eliminando archivo:', error);
      throw new Error(`Error al eliminar el archivo: ${error.message}`);
    }

    console.log('✅ Archivo eliminado exitosamente');
  } catch (error: any) {
    console.error('❌ Error en deleteManifiestoImage:', error);
    throw error;
  }
}

export async function getManifiestoImageUrl(fileName: string): Promise<string> {
  const supabase = createClient();
  
  const { data } = supabase.storage
    .from(BUCKET_NAME)
    .getPublicUrl(fileName);

  return data.publicUrl;
}

import { createClient } from '@/lib/supabase/client';
import { detalleDe } from '@/lib/utils/errores';

const BUCKET_NAME = 'manifiestos_img';
const BUCKET_PDF = 'manifiestos_pdf';

export async function uploadManifiestoImage(file: File, numeroManifiesto: string): Promise<string> {
  try {
    const supabase = createClient();

    // Generar nombre único para el archivo
    const timestamp = Date.now();
    const extension = file.name.split('.').pop();
    const fileName = `${numeroManifiesto}_${timestamp}.${extension}`;

    console.log('📤 Subiendo archivo imagen:', fileName);

    // Subir archivo al bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(fileName, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo imagen:', error);
      throw new Error(`Error al subir la imagen: ${error.message}`);
    }

    console.log('✅ Imagen subida:', data);

    // Obtener URL pública
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(fileName);

    console.log('🔗 URL pública imagen:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (causa) {
    const error = detalleDe(causa);
    console.error('❌ Error en uploadManifiestoImage:', error);
    throw error;
  }
}

export async function uploadManifiestoPDF(file: File | Blob, numeroManifiesto: string): Promise<string> {
  try {
    const supabase = createClient();

    // Generar nombre único para el PDF
    const timestamp = Date.now();
    const fileName = `${numeroManifiesto}_${timestamp}.pdf`;

    console.log('📤 Subiendo PDF:', fileName);

    // Subir archivo al bucket
    const { data, error } = await supabase.storage
      .from(BUCKET_PDF)
      .upload(fileName, file, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: false
      });

    if (error) {
      console.error('❌ Error subiendo PDF:', error);
      throw new Error(`Error al subir el PDF: ${error.message}`);
    }

    console.log('✅ PDF subido:', data);

    // Obtener URL pública (o firmada dependiendo de la privacidad, pero getPublicUrl funciona si hay política SELECT pública o auth)
    // Nota: Si el bucket es privado y requiere auth para ver, getPublicUrl daría una URL que requiere token o no funciona públicamente.
    // Pero para guardar en DB solemos guardar la URL o el Path. 
    // Usaremos getPublicUrl asumiendo que el cliente tiene acceso o que se ajustó la política.
    const { data: publicUrlData } = supabase.storage
      .from(BUCKET_PDF)
      .getPublicUrl(fileName);

    console.log('🔗 URL PDF generada:', publicUrlData.publicUrl);

    return publicUrlData.publicUrl;
  } catch (causa) {
    const error = detalleDe(causa);
    console.error('❌ Error en uploadManifiestoPDF:', error);
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

    console.log('🗑️ Eliminando imagen:', fileName);

    const { error } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([fileName]);

    if (error) {
      console.error('❌ Error eliminando imagen:', error);
      throw new Error(`Error al eliminar la imagen: ${error.message}`);
    }

    console.log('✅ Imagen eliminada exitosamente');
  } catch (causa) {
    const error = detalleDe(causa);
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

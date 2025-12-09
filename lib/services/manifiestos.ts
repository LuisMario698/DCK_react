import { createClient } from '@/lib/supabase/client'
import { Manifiesto, ManifiestoConRelaciones } from '@/types/database'
import { uploadManifiestoImage, deleteManifiestoImage, uploadManifiestoPDF } from './storage'
export async function generarNumeroManifiesto(fecha: string): Promise<string> {
  const supabase = createClient()

  // Convertir fecha a formato ddmmyyyy
  const fechaObj = new Date(fecha)
  const dia = String(fechaObj.getDate()).padStart(2, '0')
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0')
  const anio = fechaObj.getFullYear()
  const fechaFormato = `${dia}${mes}${anio} `

  // Obtener manifiestos del mismo día
  const { data, error } = await supabase
    .from('manifiestos')
    .select('numero_manifiesto')
    .eq('fecha_emision', fecha)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('Error obteniendo manifiestos del día:', error)
  }

  // Calcular el siguiente número del día
  const numeroDelDia = (data?.length || 0) + 1
  const numeroFormateado = String(numeroDelDia).padStart(3, '0')

  return `MAN${fechaFormato}${numeroFormateado} `
}

export async function getManifiestos() {
  const supabase = createClient()

  console.log('🔍 Obteniendo manifiestos...')

  // Primero intenta obtener solo los manifiestos sin relaciones
  const { data: manifiestosSolos, error: errorSolos } = await supabase
    .from('manifiestos')
    .select('*')
    .order('created_at', { ascending: false })

  if (errorSolos) {
    console.error('❌ Error obteniendo manifiestos (sin relaciones):', errorSolos)
    throw errorSolos
  }

  console.log('✅ Manifiestos obtenidos (sin relaciones):', manifiestosSolos?.length || 0, 'registros')

  // Si no hay manifiestos, retorna array vacío
  if (!manifiestosSolos || manifiestosSolos.length === 0) {
    console.log('ℹ️ No hay manifiestos en la base de datos')
    return []
  }

  // Intenta obtener con relaciones - usando sintaxis simplificada
  const { data, error } = await supabase
    .from('manifiestos')
    .select(`
  *,
  buque: buque_id(id, nombre_buque),
    responsable_principal: responsable_principal_id(id, nombre),
      responsable_secundario: responsable_secundario_id(id, nombre)
        `)
    .order('created_at', { ascending: false })

  if (error) {
    console.error('❌ Error obteniendo manifiestos con relaciones:', error)
    console.log('⚠️ Retornando manifiestos sin relaciones')
    return manifiestosSolos as ManifiestoConRelaciones[]
  }

  console.log('✅ Manifiestos obtenidos con relaciones:', data?.length || 0, 'registros')

  // Cargar residuos manualmente para cada manifiesto
  if (data && data.length > 0) {
    const { data: residuosData, error: residuosError } = await supabase
      .from('manifiestos_residuos')
      .select('*')

    if (!residuosError && residuosData) {
      console.log('✅ Residuos cargados:', residuosData.length, 'registros')

      // Asociar residuos a cada manifiesto
      const manifestosConResiduos = data.map(manifiesto => ({
        ...manifiesto,
        residuos: residuosData.find(r => r.manifiesto_id === manifiesto.id) || null
      }))

      console.log('📊 Primer manifiesto con residuos:', manifestosConResiduos[0])
      return manifestosConResiduos as ManifiestoConRelaciones[]
    } else {
      console.warn('⚠️ No se pudieron cargar los residuos:', residuosError)
    }
  }

  return data as ManifiestoConRelaciones[]
}

export async function getManifiestoById(id: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiestos')
    .select(`
        *,
        buque: buque_id(nombre_buque),
          responsable_principal: responsable_principal_id(nombre),
            responsable_secundario: responsable_secundario_id(nombre)
              `)
    .eq('id', id)
    .single()

  if (error) throw error

  // Cargar residuos manualmente
  const { data: residuos } = await supabase
    .from('manifiestos_residuos')
    .select('*')
    .eq('manifiesto_id', id)
    .maybeSingle()

  return {
    ...data,
    residuos: residuos || null
  } as ManifiestoConRelaciones
}

export async function createManifiesto(
  manifiesto: Omit<Manifiesto, 'id' | 'created_at' | 'updated_at' | 'numero_manifiesto'>,
  residuos?: {
    aceite_usado: number;
    filtros_aceite: number;
    filtros_diesel: number;
    filtros_aire: number;
    basura: number;
    observaciones?: string;
  },
  archivo?: File | null,
  pdfFile?: File | Blob | null,
  numeroManifiestoPredefinido?: string // Nuevo parametro opcional
) {
  const supabase = createClient()

  // 1. Obtener número de manifiesto (o usar el predefinido)
  const numeroManifiesto = numeroManifiestoPredefinido || await generarNumeroManifiesto(manifiesto.fecha_emision)

  console.log('📋 Creando manifiesto con número:', numeroManifiesto)

  // 2. Subir archivos en PARALELO (antes de crear el registro para evitar UPDATEs)
  let imagenUrl: string | null = null
  let pdfUrl: string | null = null

  const uploadPromises: Promise<void>[] = []

  // Subir imagen/PDF adjunto
  if (archivo) {
    const isPdf = archivo.name.toLowerCase().endsWith('.pdf') || archivo.type === 'application/pdf'
    if (isPdf) {
      console.log('📤 Subiendo PDF adjunto...')
      uploadPromises.push(
        uploadManifiestoPDF(archivo, numeroManifiesto)
          .then(url => { pdfUrl = url })
          .catch(e => console.error('⚠️ Error subiendo PDF adjunto:', e))
      )
    } else {
      console.log('📤 Subiendo imagen adjunta...')
      uploadPromises.push(
        uploadManifiestoImage(archivo, numeroManifiesto)
          .then(url => { imagenUrl = url })
          .catch(e => console.error('⚠️ Error subiendo imagen:', e))
      )
    }
  }

  // Subir PDF generado (solo si no hay PDF adjunto ya subiéndose)
  if (pdfFile && !pdfUrl) { // Nota: si archivo era PDF, pdfUrl se seteará en el bloque anterior (pero es asíncrono).
    // Para simplificar: Si hay archivo adjunto que ES PDF, ignoramos el pdfFile generado automáticamente.
    // Si archivo adjunto es IMAGEN, subimos ambos.
    const archivoEsPdf = archivo && (archivo.name.toLowerCase().endsWith('.pdf') || archivo.type === 'application/pdf');

    if (!archivoEsPdf) {
      console.log('📤 Subiendo PDF generado automáticamente...')
      uploadPromises.push(
        uploadManifiestoPDF(pdfFile, numeroManifiesto)
          .then(url => { pdfUrl = url })
          .catch(e => console.error('⚠️ Error subiendo PDF generado:', e))
      )
    }
  }

  // Esperar a que terminen las subidas
  if (uploadPromises.length > 0) {
    await Promise.all(uploadPromises)
  }

  // 3. Insertar registro UNICO con todos los datos
  const { data: manifiestoData, error: manifiestoError } = await supabase
    .from('manifiestos')
    .insert({
      ...manifiesto,
      numero_manifiesto: numeroManifiesto,
      imagen_manifiesto_url: imagenUrl,
      pdf_manifiesto_url: pdfUrl,
      // Si subimos PDF o Imagen, el estado es completado, si no, lo que venga (pendiente/borrador)
      estado_digitalizacion: (pdfUrl || imagenUrl) ? 'completado' : manifiesto.estado_digitalizacion
    })
    .select()
    .single()

  if (manifiestoError) throw manifiestoError

  // 4. Insertar residuos (esto sí tiene que ser despues porque necesitamos el ID)
  if (residuos && manifiestoData) {
    const residuosData = {
      manifiesto_id: manifiestoData.id,
      aceite_usado: residuos.aceite_usado || 0,
      filtros_aceite: residuos.filtros_aceite || 0,
      filtros_diesel: residuos.filtros_diesel || 0,
      filtros_aire: residuos.filtros_aire || 0,
      basura: residuos.basura || 0
    }

    const { error: residuosError } = await supabase
      .from('manifiestos_residuos')
      .insert(residuosData)

    if (residuosError) {
      console.error('Error insertando residuos:', residuosError)
    }
  }

  return {
    ...manifiestoData,
    imagen_manifiesto_url: imagenUrl,
    pdf_manifiesto_url: pdfUrl
  } as Manifiesto
}

export async function updateManifiesto(
  id: number,
  manifiesto: Partial<Manifiesto>,
  residuos?: {
    aceite_usado: number;
    filtros_aceite: number;
    filtros_diesel: number;
    filtros_aire: number;
    basura: number;
    observaciones?: string;
  }
) {
  const supabase = createClient()

  // Actualizar el manifiesto
  const { data, error } = await supabase
    .from('manifiestos')
    .update(manifiesto)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error

  // Si se proporcionan residuos, actualizar/insertar en la tabla intermedia
  if (residuos !== undefined) {
    const residuosData = {
      manifiesto_id: id,
      aceite_usado: residuos.aceite_usado || 0,
      filtros_aceite: residuos.filtros_aceite || 0,
      filtros_diesel: residuos.filtros_diesel || 0,
      basura: residuos.basura || 0
    }

    // Usar upsert para insertar o actualizar
    const { error: residuosError } = await supabase
      .from('manifiestos_residuos')
      .upsert(residuosData, { onConflict: 'manifiesto_id' })

    if (residuosError) {
      console.error('Error actualizando residuos:', residuosError)
    }
  }

  return data as Manifiesto
}

export async function deleteManifiesto(id: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from('manifiestos')
    .delete()
    .eq('id', id)

  if (error) throw error
}

export async function getManifiestosByEstado(estado: 'pendiente' | 'en_proceso' | 'completado') {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiestos')
    .select('*')
    .eq('estado_digitalizacion', estado)
    .order('created_at', { ascending: false })

  if (error) throw error
  return data as Manifiesto[]
}

export async function getManifiestosByBuque(buqueId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiestos')
    .select('*')
    .eq('buque_id', buqueId)
    .order('fecha_emision', { ascending: false })

  if (error) throw error
  return data as Manifiesto[]
}

export async function getManifiestoResiduos(manifiestoId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiestos_residuos')
    .select(`
              *,
              tipo_residuo: tipos_residuos(*)
                `)
    .eq('manifiesto_id', manifiestoId)

  if (error) throw error
  return data
}

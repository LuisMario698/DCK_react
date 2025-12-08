import { createClient } from '@/lib/supabase/client'
import { ManifiestoBasuron, ManifiestoBasuronConRelaciones } from '@/types/database'
import { generarPDFBasuron } from '@/lib/utils/pdfGeneratorBasuron'

export async function getManifiestosBasuron() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buque_id(id, nombre_buque)
    `)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

export async function getManifiestoBasuronById(id: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buque_id(id, nombre_buque)
    `)
    .eq('id', id)
    .single()

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones
}

export async function createManifiestoBasuron(
  manifiesto: Omit<ManifiestoBasuron, 'id' | 'created_at' | 'updated_at' | 'total_depositado'>,
  file?: File
) {
  const supabase = createClient()

  let pdfUrl = manifiesto.pdf_manifiesto_url

  if (file) {
    const fileExt = file.name.split('.').pop()
    const fileName = `Scan_${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase
      .storage
      .from('manifiestos_basuron_pdf')
      .upload(fileName, file)

    if (uploadError) throw uploadError

    const { data: publicUrlData } = supabase
      .storage
      .from('manifiestos_basuron_pdf')
      .getPublicUrl(fileName)

    pdfUrl = publicUrlData.publicUrl
  }

  const payload = {
    ...manifiesto,
    pdf_manifiesto_url: pdfUrl
  }

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .insert(payload)
    .select()
    .single()

  if (error) throw error
  return data as ManifiestoBasuron
}

export async function updateManifiestoBasuron(id: number, manifiesto: Partial<ManifiestoBasuron>) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .update(manifiesto)
    .eq('id', id)
    .select()
    .single()

  if (error) throw error
  return data as ManifiestoBasuron
}

export async function deleteManifiestoBasuron(id: number) {
  const supabase = createClient()

  const { error } = await supabase
    .from('manifiesto_basuron')
    .delete()
    .eq('id', id)

  if (error) throw error
}

// Completar manifiesto (agregar peso de salida) y generar PDF
export async function completarManifiestoBasuron(
  id: number,
  pesoSalida: number
) {
  const supabase = createClient()

  // 1. Actualizar datos
  const { data: updatedData, error: updateError } = await supabase
    .from('manifiesto_basuron')
    .update({
      peso_salida: pesoSalida,
      estado: 'Completado'
    })
    .eq('id', id)
    .select(`
      *,
      buque:buque_id(id, nombre_buque)
    `)
    .single()

  if (updateError) throw updateError

  if (!updatedData) throw new Error('No se pudo actualizar el manifiesto')

  let finalData = updatedData as ManifiestoBasuronConRelaciones;

  // 2. Generar y Subir PDF
  try {
    const pdfBlob = await generarPDFBasuron(finalData)

    const fileName = `Manifiesto_Basuron_${finalData.id}_${Date.now()}.pdf`
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from('manifiestos_basuron_pdf')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        upsert: true
      })

    if (uploadError) {
      console.error('Error subiendo PDF:', uploadError)
    } else {
      // 3. Guardar URL del PDF
      const { data: publicUrlData } = supabase
        .storage
        .from('manifiestos_basuron_pdf')
        .getPublicUrl(fileName)

      if (publicUrlData) {
        const { error: urlUpdateError } = await supabase
          .from('manifiesto_basuron')
          .update({ pdf_manifiesto_url: publicUrlData.publicUrl })
          .eq('id', id)

        if (!urlUpdateError) {
          finalData.pdf_manifiesto_url = publicUrlData.publicUrl
        }
      }
    }
  } catch (pdfError) {
    console.error('Error en proceso de generación de PDF:', pdfError)
  }

  return finalData
}

// Obtener manifiestos por buque
export async function getManifiestosBasuronByBuque(buqueId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('buque_id', buqueId)
    .order('fecha', { ascending: false })

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Obtener manifiestos por fecha
export async function getManifiestosBasuronByFecha(fecha: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('fecha', fecha)
    .order('hora_entrada')

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Obtener manifiestos por rango de fechas
export async function getManifiestosBasuronByRangoFechas(fechaInicio: string, fechaFin: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .gte('fecha', fechaInicio)
    .lte('fecha', fechaFin)
    .order('fecha', { ascending: false })
    .order('hora_entrada', { ascending: false })

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Obtener manifiestos en proceso (sin hora de salida)
export async function getManifiestosEnProceso() {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('estado', 'En Proceso')
    .order('hora_entrada')

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones[]
}

// Estadísticas de manifiestos basurón
export async function getEstadisticasManifiestosBasuron(fecha?: string) {
  const supabase = createClient()

  let query = supabase
    .from('manifiesto_basuron')
    .select('peso_entrada, peso_salida, total_depositado')

  if (fecha) {
    query = query.eq('fecha', fecha)
  }

  const { data, error } = await query

  if (error) throw error

  const stats = {
    total: data.length,
    completados: 0,
    enProceso: 0,
    pesoTotalDepositado: data.reduce((sum, m) => sum + Number(m.total_depositado || 0), 0),
    pesoPromedioDepositado: data.length > 0
      ? data.reduce((sum, m) => sum + Number(m.total_depositado || 0), 0) / data.length
      : 0,
  }

  return stats
}

// Buscar por número de ticket
export async function getManifiestoBasuronByTicket(numeroTicket: string) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('manifiesto_basuron')
    .select(`
      *,
      buque:buques(*),
      usuario_sistema:usuarios_sistema(*),
      tipo_residuo:tipos_residuos(*)
    `)
    .eq('numero_ticket', numeroTicket)
    .single()

  if (error) throw error
  return data as ManifiestoBasuronConRelaciones
}

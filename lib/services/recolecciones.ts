import { createClient } from '@/lib/supabase/client'
import { Recoleccion, RecoleccionConAsociacion } from '@/types/database'

const BUCKET = 'recolecciones_pdf'

/** Historial de recolecciones (admin: todas; recolector: las suyas por RLS). */
export async function getRecolecciones(asociacionId?: number) {
  const supabase = createClient()

  let query = supabase
    .from('recolecciones')
    .select('*, asociacion:asociaciones_recolectoras(id, nombre_asociacion, rfc, ubicacion)')
    .order('fecha', { ascending: false })
    .order('id', { ascending: false })

  if (asociacionId) query = query.eq('asociacion_id', asociacionId)

  const { data, error } = await query
  if (error) throw error
  return (data as RecoleccionConAsociacion[]).map((r) => ({ ...r, cantidad: Number(r.cantidad) }))
}

export async function getRecoleccionPorSolicitud(solicitudId: number) {
  const supabase = createClient()

  const { data, error } = await supabase
    .from('recolecciones')
    .select('*, asociacion:asociaciones_recolectoras(id, nombre_asociacion, rfc, ubicacion)')
    .eq('solicitud_id', solicitudId)
    .maybeSingle()

  if (error) throw error
  return data ? { ...(data as RecoleccionConAsociacion), cantidad: Number(data.cantidad) } : null
}

/** Sube el comprobante PDF (admin) y guarda su ruta en la recolección. */
export async function subirComprobante(recoleccion: Pick<Recoleccion, 'id' | 'folio' | 'asociacion_id'>, pdf: Blob) {
  const supabase = createClient()
  const ruta = `${recoleccion.asociacion_id}/${recoleccion.folio}.pdf`

  const { error: uploadError } = await supabase.storage
    .from(BUCKET)
    .upload(ruta, pdf, { contentType: 'application/pdf', upsert: true })

  if (uploadError) throw uploadError

  const { error } = await supabase
    .from('recolecciones')
    .update({ comprobante_pdf_path: ruta })
    .eq('id', recoleccion.id)

  if (error) throw error
  return ruta
}

/** Abre el comprobante en una pestaña nueva con una URL firmada temporal. */
export async function abrirComprobante(ruta: string) {
  const supabase = createClient()

  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrl(ruta, 60)
  if (error) throw error
  window.open(data.signedUrl, '_blank', 'noopener')
}

import { prisma } from '@/lib/prisma';
import { Manifiesto, ManifiestoConRelaciones } from '@/types/database';
import { uploadManifiestoImage, uploadManifiestoPDF } from './storage';

function mapDate(d: any): string {
  return d instanceof Date ? d.toISOString() : d;
}

function mapManifiesto(m: any): Manifiesto {
  return {
    ...m,
    fecha_emision: m.fecha_emision instanceof Date ? m.fecha_emision.toISOString().split('T')[0] : m.fecha_emision,
    created_at: mapDate(m.created_at),
    updated_at: mapDate(m.updated_at),
  };
}

function mapManifiestoConRelaciones(m: any): ManifiestoConRelaciones {
  const base = mapManifiesto(m);
  return {
    ...base,
    buque: m.buque ? { ...m.buque, fecha_registro: mapDate(m.buque.fecha_registro), created_at: mapDate(m.buque.created_at), updated_at: mapDate(m.buque.updated_at), capacidad_toneladas: m.buque.capacidad_toneladas !== null ? Number(m.buque.capacidad_toneladas) : null } : undefined,
    responsable_principal: m.responsable_principal ? { ...m.responsable_principal, created_at: mapDate(m.responsable_principal.created_at), updated_at: mapDate(m.responsable_principal.updated_at) } : undefined,
    responsable_secundario: m.responsable_secundario ? { ...m.responsable_secundario, created_at: mapDate(m.responsable_secundario.created_at), updated_at: mapDate(m.responsable_secundario.updated_at) } : undefined,
    residuos: m.residuos ? { ...m.residuos, aceite_usado: Number(m.residuos.aceite_usado), basura: Number(m.residuos.basura), created_at: mapDate(m.residuos.created_at), updated_at: mapDate(m.residuos.updated_at) } : undefined,
  };
}

export async function generarNumeroManifiesto(fecha: string): Promise<string> {
  const fechaObj = new Date(fecha);
  const dia = String(fechaObj.getDate()).padStart(2, '0');
  const mes = String(fechaObj.getMonth() + 1).padStart(2, '0');
  const anio = fechaObj.getFullYear();
  const fechaFormato = `${dia}${mes}${anio} `;

  const count = await prisma.manifiestos.count({
    where: { fecha_emision: { equals: new Date(fecha) } },
  });
  const numeroFormateado = String(count + 1).padStart(3, '0');
  return `MAN${fechaFormato}${numeroFormateado} `;
}

export async function getManifiestos(): Promise<ManifiestoConRelaciones[]> {
  const data = await prisma.manifiestos.findMany({
    include: { buque: true, responsable_principal: true, responsable_secundario: true, residuos: true },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapManifiestoConRelaciones);
}

export async function getManifiestoById(id: number): Promise<ManifiestoConRelaciones> {
  const data = await prisma.manifiestos.findUniqueOrThrow({
    where: { id },
    include: { buque: true, responsable_principal: true, responsable_secundario: true, residuos: true },
  });
  return mapManifiestoConRelaciones(data);
}

export async function createManifiesto(
  manifiesto: Omit<Manifiesto, 'id' | 'created_at' | 'updated_at' | 'numero_manifiesto'>,
  residuos?: { aceite_usado: number; filtros_aceite: number; filtros_diesel: number; filtros_aire: number; basura: number; observaciones?: string },
  archivo?: File | null,
  pdfFile?: File | Blob | null,
  numeroManifiestoPredefinido?: string
): Promise<Manifiesto> {
  const numeroManifiesto = numeroManifiestoPredefinido || await generarNumeroManifiesto(manifiesto.fecha_emision);

  let imagenUrl: string | null = null;
  let pdfUrl: string | null = null;
  const uploadPromises: Promise<void>[] = [];

  if (archivo) {
    const isPdf = archivo.name.toLowerCase().endsWith('.pdf') || archivo.type === 'application/pdf';
    if (isPdf) {
      uploadPromises.push(uploadManifiestoPDF(archivo, numeroManifiesto).then(url => { pdfUrl = url; }).catch(console.error));
    } else {
      uploadPromises.push(uploadManifiestoImage(archivo, numeroManifiesto).then(url => { imagenUrl = url; }).catch(console.error));
    }
  }

  const archivoEsPdf = archivo && (archivo.name.toLowerCase().endsWith('.pdf') || archivo.type === 'application/pdf');
  if (pdfFile && !archivoEsPdf) {
    uploadPromises.push(uploadManifiestoPDF(pdfFile, numeroManifiesto).then(url => { pdfUrl = url; }).catch(console.error));
  }

  if (uploadPromises.length > 0) await Promise.all(uploadPromises);

  const { fecha_emision, created_at, updated_at, ...rest } = manifiesto as any;
  const data = await prisma.manifiestos.create({
    data: {
      ...rest,
      numero_manifiesto: numeroManifiesto,
      fecha_emision: new Date(fecha_emision),
      imagen_manifiesto_url: imagenUrl,
      pdf_manifiesto_url: pdfUrl,
      estado_digitalizacion: (pdfUrl || imagenUrl) ? 'completado' : (manifiesto.estado_digitalizacion || 'pendiente'),
    },
  });

  if (residuos) {
    await prisma.manifiestos_residuos.create({
      data: { manifiesto_id: data.id, aceite_usado: residuos.aceite_usado || 0, filtros_aceite: residuos.filtros_aceite || 0, filtros_diesel: residuos.filtros_diesel || 0, filtros_aire: residuos.filtros_aire || 0, basura: residuos.basura || 0, observaciones: residuos.observaciones ?? null },
    });
  }

  return mapManifiesto({ ...data, imagen_manifiesto_url: imagenUrl, pdf_manifiesto_url: pdfUrl });
}

export async function updateManifiesto(
  id: number,
  manifiesto: Partial<Manifiesto>,
  residuos?: { aceite_usado: number; filtros_aceite: number; filtros_diesel: number; filtros_aire: number; basura: number; observaciones?: string }
): Promise<Manifiesto> {
  const { created_at, updated_at, fecha_emision, ...rest } = manifiesto as any;
  const data = await prisma.manifiestos.update({
    where: { id },
    data: { ...rest, ...(fecha_emision && { fecha_emision: new Date(fecha_emision) }) },
  });

  if (residuos !== undefined) {
    await prisma.manifiestos_residuos.upsert({
      where: { manifiesto_id: id },
      create: { manifiesto_id: id, aceite_usado: residuos.aceite_usado || 0, filtros_aceite: residuos.filtros_aceite || 0, filtros_diesel: residuos.filtros_diesel || 0, filtros_aire: residuos.filtros_aire || 0, basura: residuos.basura || 0, observaciones: residuos.observaciones ?? null },
      update: { aceite_usado: residuos.aceite_usado || 0, filtros_aceite: residuos.filtros_aceite || 0, filtros_diesel: residuos.filtros_diesel || 0, filtros_aire: residuos.filtros_aire || 0, basura: residuos.basura || 0, observaciones: residuos.observaciones ?? null },
    });
  }

  return mapManifiesto(data);
}

export async function deleteManifiesto(id: number): Promise<void> {
  await prisma.manifiestos.delete({ where: { id } });
}

export async function getManifiestosByEstado(estado: 'pendiente' | 'en_proceso' | 'completado'): Promise<Manifiesto[]> {
  const data = await prisma.manifiestos.findMany({ where: { estado_digitalizacion: estado }, orderBy: { created_at: 'desc' } });
  return data.map(mapManifiesto);
}

export async function getManifiestosByBuque(buqueId: number): Promise<Manifiesto[]> {
  const data = await prisma.manifiestos.findMany({ where: { buque_id: buqueId }, orderBy: { fecha_emision: 'desc' } });
  return data.map(mapManifiesto);
}

export async function getManifiestoResiduos(manifiestoId: number) {
  return prisma.manifiestos_residuos.findMany({ where: { manifiesto_id: manifiestoId } });
}

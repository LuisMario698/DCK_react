import { prisma } from '@/lib/prisma';
import { ManifiestoNoFirmado, ManifiestoNoFirmadoConRelaciones } from '@/types/database';
import { uploadNoFirmadoPDF, deleteFile } from './storage';

function mapDate(d: any): string {
  return d instanceof Date ? d.toISOString() : d;
}

function mapNoFirmado(n: any): ManifiestoNoFirmado {
  return {
    ...n,
    fecha_generacion: mapDate(n.fecha_generacion),
    descargado_en: n.descargado_en ? mapDate(n.descargado_en) : null,
    firmado_en: n.firmado_en ? mapDate(n.firmado_en) : null,
    created_at: mapDate(n.created_at),
    updated_at: mapDate(n.updated_at),
  };
}

function mapNoFirmadoConRelaciones(n: any): ManifiestoNoFirmadoConRelaciones {
  const base = mapNoFirmado(n);
  return {
    ...base,
    manifiesto: n.manifiesto
      ? {
          ...n.manifiesto,
          fecha_emision: n.manifiesto.fecha_emision instanceof Date
            ? n.manifiesto.fecha_emision.toISOString().split('T')[0]
            : n.manifiesto.fecha_emision,
          created_at: mapDate(n.manifiesto.created_at),
          updated_at: mapDate(n.manifiesto.updated_at),
        }
      : undefined,
  };
}

export async function getManifiestosNoFirmados(): Promise<ManifiestoNoFirmadoConRelaciones[]> {
  const data = await prisma.manifiestos_no_firmados.findMany({
    include: { manifiesto: true },
    orderBy: { created_at: 'desc' },
  });
  return data.map((n) => mapNoFirmadoConRelaciones({ ...n, manifiesto: n.manifiesto }));
}

export async function getManifiestoNoFirmadoById(id: number): Promise<ManifiestoNoFirmadoConRelaciones> {
  const data = await prisma.manifiestos_no_firmados.findUniqueOrThrow({
    where: { id },
    include: { manifiesto: true },
  });
  return mapNoFirmadoConRelaciones({ ...data, manifiesto: data.manifiesto });
}

export async function getManifiestosNoFirmadosByManifiesto(manifiestoId: number): Promise<ManifiestoNoFirmado[]> {
  const data = await prisma.manifiestos_no_firmados.findMany({
    where: { manifiesto_id: manifiestoId },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapNoFirmado);
}

export async function getManifiestosNoFirmadosByEstado(
  estado: 'pendiente' | 'descargado' | 'firmado' | 'cancelado'
): Promise<ManifiestoNoFirmado[]> {
  const data = await prisma.manifiestos_no_firmados.findMany({
    where: { estado },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapNoFirmado);
}

export async function createManifiestoNoFirmado(
  manifiestoId: number,
  numeroManifiesto: string,
  pdfFile: File | Blob,
  nombreArchivo: string
): Promise<ManifiestoNoFirmado> {
  const url = await uploadNoFirmadoPDF(pdfFile, nombreArchivo);
  const rutaArchivo = url.replace('/api/files/', '');

  const data = await prisma.manifiestos_no_firmados.create({
    data: {
      manifiesto_id: manifiestoId,
      nombre_archivo: nombreArchivo,
      ruta_archivo: rutaArchivo,
      url_descarga: url,
      numero_manifiesto: numeroManifiesto,
      fecha_generacion: new Date(),
      estado: 'pendiente',
    },
  });
  return mapNoFirmado(data);
}

export async function marcarComoDescargado(
  id: number,
  descargadoPor?: string
): Promise<ManifiestoNoFirmado> {
  const data = await prisma.manifiestos_no_firmados.update({
    where: { id },
    data: {
      estado: 'descargado',
      descargado_en: new Date(),
      descargado_por: descargadoPor ?? null,
    },
  });
  return mapNoFirmado(data);
}

export async function marcarComoFirmado(
  id: number,
  observaciones?: string
): Promise<ManifiestoNoFirmado> {
  const data = await prisma.manifiestos_no_firmados.update({
    where: { id },
    data: {
      estado: 'firmado',
      firmado_en: new Date(),
      observaciones: observaciones ?? null,
    },
  });
  return mapNoFirmado(data);
}

export async function cancelarManifiestoNoFirmado(
  id: number,
  observaciones?: string
): Promise<ManifiestoNoFirmado> {
  const data = await prisma.manifiestos_no_firmados.update({
    where: { id },
    data: {
      estado: 'cancelado',
      observaciones: observaciones ?? null,
    },
  });
  return mapNoFirmado(data);
}

export async function deleteManifiestoNoFirmado(id: number): Promise<void> {
  const record = await prisma.manifiestos_no_firmados.findUnique({ where: { id } });
  if (record?.url_descarga) {
    await deleteFile(record.url_descarga).catch(() => {});
  }
  await prisma.manifiestos_no_firmados.delete({ where: { id } });
}

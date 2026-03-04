import { prisma } from '@/lib/prisma';
import { ManifiestoBasuron, ManifiestoBasuronConRelaciones } from '@/types/database';
import { uploadBasuronPDF } from '@/lib/services/storage';

function mapDate(d: any): string | null {
  if (!d) return null;
  return d instanceof Date ? d.toISOString() : d;
}

function mapBasuron(b: any): ManifiestoBasuron {
  return {
    ...b,
    fecha: b.fecha instanceof Date ? b.fecha.toISOString().split('T')[0] : b.fecha,
    peso_entrada: b.peso_entrada !== null ? Number(b.peso_entrada) : b.peso_entrada,
    peso_salida: b.peso_salida !== null ? Number(b.peso_salida) : null,
    total_depositado: b.total_depositado !== null ? Number(b.total_depositado) : null,
    created_at: mapDate(b.created_at),
    updated_at: mapDate(b.updated_at),
  };
}

function mapBasuronConRelaciones(b: any): ManifiestoBasuronConRelaciones {
  const base = mapBasuron(b);
  return {
    ...base,
    buque: b.buque
      ? {
          ...b.buque,
          fecha_registro: b.buque.fecha_registro instanceof Date ? b.buque.fecha_registro.toISOString().split('T')[0] : b.buque.fecha_registro,
          capacidad_toneladas: b.buque.capacidad_toneladas !== null ? Number(b.buque.capacidad_toneladas) : null,
          created_at: mapDate(b.buque.created_at) ?? '',
          updated_at: mapDate(b.buque.updated_at) ?? '',
        }
      : undefined,
  };
}

export async function generarNumeroTicket(id: number, fecha: string): Promise<string> {
  const fechaObj = new Date(fecha);
  const dateStr = `${String(fechaObj.getFullYear()).slice(2)}${String(fechaObj.getMonth() + 1).padStart(2, '0')}${String(fechaObj.getDate()).padStart(2, '0')}`;
  return `TKT-${dateStr}-${String(id).padStart(4, '0')}`;
}

export async function getManifiestosBasuron(): Promise<ManifiestoBasuronConRelaciones[]> {
  const data = await prisma.manifiesto_basuron.findMany({
    include: { buque: true },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapBasuronConRelaciones);
}

export async function getManifiestoBasuronById(id: number): Promise<ManifiestoBasuronConRelaciones> {
  const data = await prisma.manifiesto_basuron.findUniqueOrThrow({
    where: { id },
    include: { buque: true },
  });
  return mapBasuronConRelaciones(data);
}

export async function createManifiestoBasuron(
  manifiesto: Omit<ManifiestoBasuron, 'id' | 'created_at' | 'updated_at' | 'numero_ticket' | 'total_depositado'>,
  archivo?: File
): Promise<ManifiestoBasuron> {
  const { fecha, peso_entrada, peso_salida, nombre_usuario: _nombre_usuario, ...rest } = manifiesto as any;
  const pesoEntrada = Number(peso_entrada);
  const pesoSalida = peso_salida !== null && peso_salida !== undefined ? Number(peso_salida) : null;
  const totalDepositado = pesoSalida !== null ? pesoSalida - pesoEntrada : null;

  const data = await prisma.manifiesto_basuron.create({
    data: {
      ...rest,
      fecha: new Date(fecha),
      peso_entrada: pesoEntrada,
      peso_salida: pesoSalida,
      total_depositado: totalDepositado,
      numero_ticket: null, // generated after insert
    },
  });

  const numero_ticket = await generarNumeroTicket(data.id, fecha);

  let comprobante_url: string | null = null;
  if (archivo) {
    comprobante_url = await uploadBasuronPDF(archivo, numero_ticket);
  }

  const updated = await prisma.manifiesto_basuron.update({
    where: { id: data.id },
    data: { numero_ticket, ...(comprobante_url && { comprobante_url }) },
  });

  return mapBasuron(updated);
}

export async function updateManifiestoBasuron(
  id: number,
  manifiesto: Partial<ManifiestoBasuron>
): Promise<ManifiestoBasuron> {
  const { created_at, updated_at, fecha, peso_entrada, peso_salida, total_depositado, numero_ticket, ...rest } = manifiesto as any;

  const updateData: any = { ...rest };
  if (fecha) updateData.fecha = new Date(fecha);
  if (peso_entrada !== undefined) updateData.peso_entrada = Number(peso_entrada);
  if (peso_salida !== undefined) updateData.peso_salida = peso_salida !== null ? Number(peso_salida) : null;

  // Recalculate total_depositado if weights changed
  const current = await prisma.manifiesto_basuron.findUniqueOrThrow({ where: { id } });
  const newPesoEntrada = updateData.peso_entrada ?? Number(current.peso_entrada);
  const newPesoSalida = updateData.peso_salida !== undefined ? updateData.peso_salida : (current.peso_salida !== null ? Number(current.peso_salida) : null);
  updateData.total_depositado = newPesoSalida !== null ? newPesoSalida - newPesoEntrada : null;

  const data = await prisma.manifiesto_basuron.update({ where: { id }, data: updateData });
  return mapBasuron(data);
}

export async function deleteManifiestoBasuron(id: number): Promise<void> {
  await prisma.manifiesto_basuron.delete({ where: { id } });
}

export async function completarManifiestoBasuron(
  id: number,
  pesoSalida: number,
  horaSalida?: string,
  observaciones?: string,
  pdfUrl?: string
): Promise<ManifiestoBasuron> {
  const current = await prisma.manifiesto_basuron.findUniqueOrThrow({ where: { id } });
  const pesoEntrada = Number(current.peso_entrada);
  const totalDepositado = pesoSalida - pesoEntrada;

  const data = await prisma.manifiesto_basuron.update({
    where: { id },
    data: {
      peso_salida: pesoSalida,
      total_depositado: totalDepositado,
      hora_salida: horaSalida ?? null,
      estado: 'Completado',
      observaciones: observaciones ?? current.observaciones,
      pdf_manifiesto_url: pdfUrl ?? current.pdf_manifiesto_url,
    },
  });
  return mapBasuron(data);
}

export async function getManifiestosBasuronByBuque(buqueId: number): Promise<ManifiestoBasuronConRelaciones[]> {
  const data = await prisma.manifiesto_basuron.findMany({
    where: { buque_id: buqueId },
    include: { buque: true },
    orderBy: { fecha: 'desc' },
  });
  return data.map(mapBasuronConRelaciones);
}

export async function getManifiestosBasuronByFecha(fecha: string): Promise<ManifiestoBasuronConRelaciones[]> {
  const data = await prisma.manifiesto_basuron.findMany({
    where: { fecha: new Date(fecha) },
    include: { buque: true },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapBasuronConRelaciones);
}

export async function getManifiestosBasuronByRangoFechas(
  fechaInicio: string,
  fechaFin: string
): Promise<ManifiestoBasuronConRelaciones[]> {
  const data = await prisma.manifiesto_basuron.findMany({
    where: { fecha: { gte: new Date(fechaInicio), lte: new Date(fechaFin) } },
    include: { buque: true },
    orderBy: { fecha: 'desc' },
  });
  return data.map(mapBasuronConRelaciones);
}

export async function getManifiestosEnProceso(): Promise<ManifiestoBasuronConRelaciones[]> {
  const data = await prisma.manifiesto_basuron.findMany({
    where: { estado: 'En Proceso' },
    include: { buque: true },
    orderBy: { created_at: 'desc' },
  });
  return data.map(mapBasuronConRelaciones);
}

export async function getEstadisticasManifiestosBasuron(): Promise<{
  total: number;
  enProceso: number;
  completados: number;
  cancelados: number;
  totalDepositado: number;
}> {
  const [total, enProceso, completados, cancelados, agg] = await Promise.all([
    prisma.manifiesto_basuron.count(),
    prisma.manifiesto_basuron.count({ where: { estado: 'En Proceso' } }),
    prisma.manifiesto_basuron.count({ where: { estado: 'Completado' } }),
    prisma.manifiesto_basuron.count({ where: { estado: 'Cancelado' } }),
    prisma.manifiesto_basuron.aggregate({ _sum: { total_depositado: true } }),
  ]);
  return {
    total,
    enProceso,
    completados,
    cancelados,
    totalDepositado: Number(agg._sum.total_depositado ?? 0),
  };
}

export async function getManifiestoBasuronByTicket(
  numeroTicket: string
): Promise<ManifiestoBasuronConRelaciones | null> {
  const data = await prisma.manifiesto_basuron.findFirst({
    where: { numero_ticket: numeroTicket },
    include: { buque: true },
  });
  return data ? mapBasuronConRelaciones(data) : null;
}

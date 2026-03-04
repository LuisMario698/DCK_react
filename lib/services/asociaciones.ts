import { prisma } from '@/lib/prisma';
import { AsociacionRecolectora } from '@/types/database';

function mapAsociacion(a: any): AsociacionRecolectora {
  return {
    ...a,
    created_at: a.created_at instanceof Date ? a.created_at.toISOString() : a.created_at,
    updated_at: a.updated_at instanceof Date ? a.updated_at.toISOString() : a.updated_at,
  };
}

export async function getAsociaciones(): Promise<AsociacionRecolectora[]> {
  const data = await prisma.asociaciones_recolectoras.findMany({ orderBy: { nombre_asociacion: 'asc' } });
  return data.map(mapAsociacion);
}

export async function getAsociacionById(id: number): Promise<AsociacionRecolectora> {
  const data = await prisma.asociaciones_recolectoras.findUniqueOrThrow({ where: { id } });
  return mapAsociacion(data);
}

export async function createAsociacion(asociacion: Omit<AsociacionRecolectora, 'id' | 'created_at' | 'updated_at'>): Promise<AsociacionRecolectora> {
  const { certificaciones, especialidad, ...rest } = asociacion;
  const data = await prisma.asociaciones_recolectoras.create({
    data: { ...rest, certificaciones: certificaciones ?? [], especialidad: especialidad ?? [] },
  });
  return mapAsociacion(data);
}

export async function updateAsociacion(id: number, asociacion: Partial<AsociacionRecolectora>): Promise<AsociacionRecolectora> {
  const { created_at, updated_at, ...rest } = asociacion as any;
  const data = await prisma.asociaciones_recolectoras.update({ where: { id }, data: rest });
  return mapAsociacion(data);
}

export async function deleteAsociacion(id: number): Promise<void> {
  await prisma.asociaciones_recolectoras.delete({ where: { id } });
}

export async function searchAsociaciones(searchTerm: string): Promise<AsociacionRecolectora[]> {
  const data = await prisma.asociaciones_recolectoras.findMany({
    where: { nombre_asociacion: { contains: searchTerm, mode: 'insensitive' } },
    orderBy: { nombre_asociacion: 'asc' },
  });
  return data.map(mapAsociacion);
}

export async function getAsociacionesByEstado(estado: 'Activo' | 'Inactivo' | 'Suspendido'): Promise<AsociacionRecolectora[]> {
  const data = await prisma.asociaciones_recolectoras.findMany({ where: { estado }, orderBy: { nombre_asociacion: 'asc' } });
  return data.map(mapAsociacion);
}

export async function getAsociacionesByTipo(tipo: string): Promise<AsociacionRecolectora[]> {
  const data = await prisma.asociaciones_recolectoras.findMany({ where: { tipo_asociacion: tipo }, orderBy: { nombre_asociacion: 'asc' } });
  return data.map(mapAsociacion);
}

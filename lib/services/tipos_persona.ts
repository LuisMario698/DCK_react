import { prisma } from '@/lib/prisma';
import { TipoPersona } from '@/types/database';

function mapTipo(t: any): TipoPersona {
  return {
    ...t,
    created_at: t.created_at instanceof Date ? t.created_at.toISOString() : t.created_at,
    updated_at: t.updated_at instanceof Date ? t.updated_at.toISOString() : t.updated_at,
  };
}

export async function getTiposPersona(): Promise<TipoPersona[]> {
  const data = await prisma.tipos_persona.findMany({ orderBy: { nombre_tipo: 'asc' } });
  return data.map(mapTipo);
}

export async function getTipoPersonaById(id: number): Promise<TipoPersona> {
  const data = await prisma.tipos_persona.findUniqueOrThrow({ where: { id } });
  return mapTipo(data);
}

export async function createTipoPersona(tipo: Omit<TipoPersona, 'id' | 'created_at' | 'updated_at'>): Promise<TipoPersona> {
  const data = await prisma.tipos_persona.create({
    data: { nombre_tipo: tipo.nombre_tipo, descripcion: tipo.descripcion ?? null },
  });
  return mapTipo(data);
}

export async function updateTipoPersona(id: number, tipo: Partial<TipoPersona>): Promise<TipoPersona> {
  const updateData: any = {};
  if (tipo.nombre_tipo !== undefined) updateData.nombre_tipo = tipo.nombre_tipo;
  if (tipo.descripcion !== undefined) updateData.descripcion = tipo.descripcion ?? null;

  const data = await prisma.tipos_persona.update({ where: { id }, data: updateData });
  return mapTipo(data);
}

export async function deleteTipoPersona(id: number): Promise<void> {
  await prisma.tipos_persona.delete({ where: { id } });
}

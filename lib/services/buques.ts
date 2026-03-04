import { prisma } from '@/lib/prisma';
import { Buque } from '@/types/database';

function mapBuque(b: any): Buque {
  return {
    ...b,
    fecha_registro: b.fecha_registro instanceof Date ? b.fecha_registro.toISOString().split('T')[0] : b.fecha_registro,
    capacidad_toneladas: b.capacidad_toneladas !== null ? Number(b.capacidad_toneladas) : null,
    created_at: b.created_at instanceof Date ? b.created_at.toISOString() : b.created_at,
    updated_at: b.updated_at instanceof Date ? b.updated_at.toISOString() : b.updated_at,
  };
}

export async function getBuques(): Promise<Buque[]> {
  const data = await prisma.buques.findMany({ orderBy: { fecha_registro: 'desc' } });
  return data.map(mapBuque);
}

export async function getBuqueById(id: number): Promise<Buque> {
  const data = await prisma.buques.findUniqueOrThrow({ where: { id } });
  return mapBuque(data);
}

export async function createBuque(buque: Omit<Buque, 'id' | 'created_at' | 'updated_at'>): Promise<Buque> {
  const { fecha_registro, capacidad_toneladas, ...rest } = buque as any;
  const data = await prisma.buques.create({
    data: {
      ...rest,
      fecha_registro: fecha_registro ? new Date(fecha_registro) : new Date(),
      capacidad_toneladas: capacidad_toneladas !== undefined ? capacidad_toneladas : null,
    },
  });
  return mapBuque(data);
}

export async function updateBuque(id: number, buque: Partial<Buque>): Promise<Buque> {
  const { fecha_registro, capacidad_toneladas, created_at, updated_at, ...rest } = buque as any;
  const data = await prisma.buques.update({
    where: { id },
    data: {
      ...rest,
      ...(fecha_registro && { fecha_registro: new Date(fecha_registro) }),
      ...(capacidad_toneladas !== undefined && { capacidad_toneladas }),
    },
  });
  return mapBuque(data);
}

export async function deleteBuque(id: number): Promise<void> {
  await prisma.buques.delete({ where: { id } });
}

export async function searchBuques(searchTerm: string): Promise<Buque[]> {
  const data = await prisma.buques.findMany({
    where: {
      OR: [
        { nombre_buque: { contains: searchTerm, mode: 'insensitive' } },
        { matricula: { contains: searchTerm, mode: 'insensitive' } },
      ],
    },
    orderBy: { nombre_buque: 'asc' },
  });
  return data.map(mapBuque);
}

export async function getBuquesByEstado(estado: 'Activo' | 'Inactivo' | 'En Mantenimiento'): Promise<Buque[]> {
  const data = await prisma.buques.findMany({ where: { estado }, orderBy: { nombre_buque: 'asc' } });
  return data.map(mapBuque);
}

export async function createBuqueAutomatico(nombre: string): Promise<Buque> {
  const existente = await prisma.buques.findFirst({
    where: { nombre_buque: { equals: nombre, mode: 'insensitive' } },
  });
  if (existente) return mapBuque(existente);

  const data = await prisma.buques.create({
    data: { nombre_buque: nombre, estado: 'Activo', registro_completo: false },
  });
  return mapBuque(data);
}

export async function getBuquesIncompletos(): Promise<Buque[]> {
  const data = await prisma.buques.findMany({ where: { registro_completo: false }, orderBy: { nombre_buque: 'asc' } });
  return data.map(mapBuque);
}

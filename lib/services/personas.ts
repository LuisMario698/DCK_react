import { prisma } from '@/lib/prisma';
import { Persona, PersonaConTipo } from '@/types/database';

function mapPersona(p: any): Persona {
  return {
    ...p,
    created_at: p.created_at instanceof Date ? p.created_at.toISOString() : p.created_at,
    updated_at: p.updated_at instanceof Date ? p.updated_at.toISOString() : p.updated_at,
  };
}

function mapPersonaConTipo(p: any): PersonaConTipo {
  const base = mapPersona(p);
  return {
    ...base,
    tipo_persona: p.tipo_persona
      ? {
          ...p.tipo_persona,
          created_at: p.tipo_persona.created_at instanceof Date ? p.tipo_persona.created_at.toISOString() : p.tipo_persona.created_at,
          updated_at: p.tipo_persona.updated_at instanceof Date ? p.tipo_persona.updated_at.toISOString() : p.tipo_persona.updated_at,
        }
      : undefined,
  };
}

export async function getPersonas(): Promise<PersonaConTipo[]> {
  const data = await prisma.personas.findMany({
    include: { tipo_persona: true },
    orderBy: { nombre: 'asc' },
  });
  return data.map(mapPersonaConTipo);
}

export async function getPersonaById(id: number): Promise<PersonaConTipo> {
  const data = await prisma.personas.findUniqueOrThrow({
    where: { id },
    include: { tipo_persona: true },
  });
  return mapPersonaConTipo(data);
}

export async function createPersona(persona: Omit<Persona, 'id' | 'created_at' | 'updated_at'>): Promise<Persona> {
  const { tipo_persona_id, ...rest } = persona;
  const data = await prisma.personas.create({
    data: { ...rest, tipo_persona_id: tipo_persona_id ?? null },
  });
  return mapPersona(data);
}

export async function updatePersona(id: number, persona: Partial<Persona>): Promise<Persona> {
  const { created_at, updated_at, ...rest } = persona as any;
  const data = await prisma.personas.update({ where: { id }, data: rest });
  return mapPersona(data);
}

export async function deletePersona(id: number): Promise<void> {
  await prisma.personas.delete({ where: { id } });
}

export async function searchPersonas(searchTerm: string): Promise<PersonaConTipo[]> {
  const data = await prisma.personas.findMany({
    where: { nombre: { contains: searchTerm, mode: 'insensitive' } },
    include: { tipo_persona: true },
    orderBy: { nombre: 'asc' },
  });
  return data.map(mapPersonaConTipo);
}

export async function getPersonasByTipo(tipoPersonaId: number): Promise<PersonaConTipo[]> {
  const data = await prisma.personas.findMany({
    where: { tipo_persona_id: tipoPersonaId },
    include: { tipo_persona: true },
    orderBy: { nombre: 'asc' },
  });
  return data.map(mapPersonaConTipo);
}

export async function createPersonaAutomatica(nombre: string, tipoPersonaId: number): Promise<Persona> {
  const existente = await prisma.personas.findFirst({
    where: { nombre: { equals: nombre, mode: 'insensitive' } },
  });
  if (existente) return mapPersona(existente);

  const data = await prisma.personas.create({
    data: { nombre, tipo_persona_id: tipoPersonaId, registro_completo: false },
  });
  return mapPersona(data);
}

export async function getPersonasIncompletas(): Promise<PersonaConTipo[]> {
  const data = await prisma.personas.findMany({
    where: { registro_completo: false },
    include: { tipo_persona: true },
    orderBy: { nombre: 'asc' },
  });
  return data.map(mapPersonaConTipo);
}

export async function getOrCreateTipoPersona(nombreTipo: string) {
  const existente = await prisma.tipos_persona.findFirst({
    where: { nombre_tipo: { equals: nombreTipo, mode: 'insensitive' } },
  });
  if (existente) return existente;

  return prisma.tipos_persona.create({
    data: { nombre_tipo: nombreTipo, descripcion: 'Tipo creado automáticamente' },
  });
}

import { Embarcacion } from '@/types/embarcacion';
import { Persona } from '@/types/persona';

// Datos de ejemplo - Embarcaciones
export const embarcacionesData: Embarcacion[] = [
  {
    id: 3,
    nombre: 'El Oro Jackson',
    tipoEmbarcacion: 'Ship',
    creado: new Date(Date.now() - 86400000), // Hace 1 día
    actualizado: new Date(Date.now() - 86400000),
  },
];

// Datos de ejemplo - Personas
export const personasData: Persona[] = [
  {
    id: 1,
    nombre: 'Juan',
    apellido: 'Pérez García',
    cedula: '1234567890',
    telefono: '+506 8888-8888',
    email: 'juan.perez@example.com',
    rol: 'Capitán',
    estado: 'Activo',
    creado: new Date(Date.now() - 86400000 * 10), // Hace 10 días
    actualizado: new Date(Date.now() - 86400000 * 2), // Hace 2 días
  },
  {
    id: 2,
    nombre: 'María',
    apellido: 'González López',
    cedula: '9876543210',
    telefono: '+506 7777-7777',
    email: 'maria.gonzalez@example.com',
    rol: 'Tripulante',
    estado: 'Activo',
    creado: new Date(Date.now() - 86400000 * 15), // Hace 15 días
    actualizado: new Date(Date.now() - 86400000 * 5), // Hace 5 días
  },
  {
    id: 3,
    nombre: 'Carlos',
    apellido: 'Rodríguez Martínez',
    cedula: '5555555555',
    telefono: '+506 6666-6666',
    email: 'carlos.rodriguez@example.com',
    rol: 'Administrativo',
    estado: 'Activo',
    creado: new Date(Date.now() - 86400000 * 30), // Hace 30 días
    actualizado: new Date(Date.now() - 86400000 * 1), // Hace 1 día
  },
];

export function getEmbarcaciones(): Embarcacion[] {
  return embarcacionesData;
}

export function getPersonas(): Persona[] {
  return personasData;
}

export function formatFechaRelativa(fecha: Date): string {
  const ahora = new Date();
  const diferencia = ahora.getTime() - fecha.getTime();
  const dias = Math.floor(diferencia / (1000 * 60 * 60 * 24));
  
  if (dias === 0) return 'Hoy';
  if (dias === 1) return 'Hace 1 día';
  if (dias < 7) return `Hace ${dias} días`;
  if (dias < 30) return `Hace ${Math.floor(dias / 7)} semanas`;
  return `Hace ${Math.floor(dias / 30)} meses`;
}

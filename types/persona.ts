export interface Persona {
  id: number;
  nombre: string;
  apellido: string;
  cedula: string;
  telefono: string;
  email: string;
  rol: 'Capitán' | 'Tripulante' | 'Pasajero' | 'Administrativo';
  estado: 'Activo' | 'Inactivo';
  creado: Date;
  actualizado: Date;
}

export type RolPersona = Persona['rol'];
export type EstadoPersona = Persona['estado'];

export interface Usuario {
  id: number;
  nombre: string;
  apellido: string;
  email: string;
  rol: 'Administrador' | 'Usuario' | 'Supervisor';
  estado: 'Activo' | 'Inactivo';
  ultimoAcceso?: Date;
  creado: Date;
}

export interface Asociacion {
  id: number;
  nombre: string;
  representante: string;
  telefono: string;
  email: string;
  direccion: string;
  tipoResiduos: string;
  estado: 'Activa' | 'Inactiva';
  creado: Date;
  actualizado: Date;
}

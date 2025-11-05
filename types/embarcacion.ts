export interface Embarcacion {
  id: number;
  nombre: string;
  tipoEmbarcacion: 'Ship' | 'Boat' | 'Yacht' | 'Cargo' | string;
  matricula?: string;
  bandera?: string;
  eslora?: string; // e.g. '12.5 m'
  capacidad?: string;
  propietario?: string;
  estado?: 'Activo' | 'Inactivo' | 'En Mantenimiento' | string;
  fechaEntrada?: Date;
  creado: Date;
  actualizado: Date;
}

export type TipoEmbarcacion = Embarcacion['tipoEmbarcacion'];

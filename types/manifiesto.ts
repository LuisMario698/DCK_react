export interface Manifiesto {
  id: number;
  personaId: number;
  personaNombre: string;
  embarcacionId: number;
  embarcacionNombre: string;
  fechaCreacion: Date;
  descripcion?: string;
  estado: 'Activo' | 'Inactivo' | 'Pendiente';
  
  // Datos del proceso
  proceso?: {
    digitalizacion: {
      completado: boolean;
      fecha?: Date;
      documentos?: string[];
    };
    validacion: {
      completado: boolean;
      fecha?: Date;
      validadoPor?: string;
    };
    aprobacion: {
      completado: boolean;
      fecha?: Date;
      aprobadoPor?: string;
    };
  };
  
  // Información adicional
  tipoManifiesto?: string;
  numeroDocumento?: string;
  observaciones?: string;
}

export type EstadoManifiesto = Manifiesto['estado'];

// Tipos de la pestaña Reportes de Estadísticas. Los de la pestaña Estadísticas (período, totales,
// serie) viven junto a su consulta en lib/services/dashboard_stats.ts.

export interface ReportFilters {
    fechaInicio?: string;
    fechaFin?: string;
    buqueId?: number;
    tipoResiduoId?: number;
    estado?: string;
}

export interface ReporteDetalladoItem {
    fecha: string;
    folio: string;
    buque: string;
    tipoResiduo: string;
    cantidad: number;
    unidad: string;
    estado: string;
    responsable: string;
}

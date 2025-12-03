export interface DashboardKPIs {
    totalManifiestos: number;
    manifiestosPendientes: number;
    totalBuques: number;
    buquesActivos: number;
    totalResiduosReciclados: number; // kg
    totalBasuraGeneral: number; // kg
    totalAceiteUsado: number; // litros
}

export interface ChartDataPoint {
    label: string;
    value: number;
    category?: string;
    color?: string;
}

export interface ResiduosPorMes {
    mes: string; // YYYY-MM
    aceite: number;
    basura: number;
    filtros: number;
    otros: number;
}

export interface ResiduosPorBuque {
    buqueId: number;
    nombreBuque: string;
    totalKg: number;
    cantidadManifiestos: number;
}

export interface DashboardStats {
    kpis: DashboardKPIs;
    residuosPorMes: ResiduosPorMes[];
    topBuques: ResiduosPorBuque[];
    distribucionTipos: ChartDataPoint[];
}

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

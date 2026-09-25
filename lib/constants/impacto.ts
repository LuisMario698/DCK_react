// Factores para estimar el impacto ambiental de las recolecciones.
//
// ⚠️ VALORES PROVISIONALES. Son órdenes de magnitud tomados de la literatura
// de reciclaje (p. ej. el modelo WARM de la EPA) para mostrar una estimación en
// el portal recolector. Deben validarse con el asesor externo (SEMARNAT/DCK)
// y citarse su fuente antes de usarse en reportes oficiales.

import type { TipoResiduo } from './residuos';

/** kg de CO₂e evitados por unidad recolectada (kg, L o pieza según el tipo). */
export const CO2E_EVITADO_POR_UNIDAD: Record<TipoResiduo, number> = {
    plastico: 1.5,
    aceite: 1.0,
    carton: 0.9,
    chatarra: 1.5,
    vidrio: 0.3,
    organico: 0.2,
    filtros: 0,
};

/** Absorción anual aproximada de CO₂ de un árbol adulto, en kg. */
export const KG_CO2_POR_ARBOL_ANIO = 21;

export function co2eEvitadoKg(tipo: TipoResiduo, cantidad: number): number {
    return cantidad * (CO2E_EVITADO_POR_UNIDAD[tipo] ?? 0);
}

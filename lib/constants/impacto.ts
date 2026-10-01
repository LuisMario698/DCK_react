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

// Estimaciones del recinto: Estadísticas, su PDF y la landing (también ⚠️ PROVISIONALES; las
// cuentas están en lib/utils/equivalencias.ts). El aceite usa el mismo factor que el portal
// recolector: antes Estadísticas decía 2.5 y el portal 1.0, y se unificó en 1.0, el más
// conservador, mientras lo valida el asesor externo (decisión del 2026-09-30).
/** kg de CO₂ evitados por litro de aceite usado recolectado (recinto): el mismo que el portal. */
export const RECINTO_CO2_POR_LITRO_ACEITE = CO2E_EVITADO_POR_UNIDAD.aceite;
/** kg de CO₂ evitados por kg llevado al relleno sanitario (basurón). */
export const RECINTO_CO2_POR_KG_BASURON = 0.5;
/**
 * Litros de agua que no se contaminan por cada litro de aceite recolectado. 1,000 L es la cifra
 * conservadora y la más citada en México; la landing decía 1,000,000 (un caso extremo) y se
 * unificó con ésta (decisión del 2026-09-30).
 */
export const LITROS_AGUA_POR_LITRO_ACEITE = 1000;

// Tamaños para las equivalencias ("esto equivale a…"): cosas conocidas, no factores de impacto.
/** Alberca olímpica: 50 × 25 × 2 m (la landing usa el mismo). */
export const LITROS_ALBERCA_OLIMPICA = 2_500_000;
/** Tinaco común de casa en México. */
export const LITROS_TINACO = 1_100;
/** Camión recolector de basura lleno. */
export const KG_CAMION_RECOLECTOR = 8_000;
/** Bolsa negra grande de basura, llena. */
export const KG_BOLSA_BASURA = 10;

export function co2eEvitadoKg(tipo: TipoResiduo, cantidad: number): number {
    return cantidad * (CO2E_EVITADO_POR_UNIDAD[tipo] ?? 0);
}

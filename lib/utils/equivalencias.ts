import { Car, Cylinder, Droplets, Fish, ShoppingBag, TreeDeciduous, Truck, Waves, type LucideIcon } from 'lucide-react';
import {
    KG_BOLSA_BASURA,
    KG_CAMION_RECOLECTOR,
    KG_CO2_POR_ARBOL_ANIO,
    LITROS_AGUA_POR_LITRO_ACEITE,
    LITROS_ALBERCA_OLIMPICA,
    LITROS_TINACO,
    RECINTO_CO2_POR_KG_BASURON,
    RECINTO_CO2_POR_LITRO_ACEITE,
} from '@/lib/constants/impacto';

// ── Impacto ambiental del recinto y sus equivalencias ("esto equivale a…") ───
//
// Un solo lugar para las cuentas, para que la landing, Estadísticas y su PDF digan lo mismo con los
// mismos datos. Los factores son PROVISIONALES (ver lib/constants/impacto.ts).
//
// Ojo: el basurón es el camión del centro de acopio que lleva al relleno la MISMA basura que
// entregaron los barcos. Nunca se suman los kg de basura de los manifiestos y los del basurón.

/** Litros de agua que no se contaminaron gracias al aceite recolectado */
export const aguaProtegidaL = (aceiteL: number) => aceiteL * LITROS_AGUA_POR_LITRO_ACEITE;

/** kg de CO₂ evitados (estimado): el aceite recolectado y lo que se llevó al relleno sanitario */
export const co2EvitadoKg = (aceiteL: number, basuronKg: number) =>
    aceiteL * RECINTO_CO2_POR_LITRO_ACEITE + basuronKg * RECINTO_CO2_POR_KG_BASURON;

export interface Equivalencia {
    icono: LucideIcon;
    valor: number;
    /** Nombre en singular y plural: "árbol" / "árboles" */
    nombre: [string, string];
    /** Qué quiere decir, en una línea */
    descripcion: string;
}

/** Decimales: uno para cantidades chicas con fracción (1.2 albercas), ninguno de 10 para arriba */
export const decimalesEquivalencia = (n: number) => (n < 10 && !Number.isInteger(Math.round(n * 10) / 10) ? 1 : 0);

/** ¿El valor, ya redondeado, es exactamente 1? (para elegir singular o plural) */
export const esUno = (n: number) => {
    const d = decimalesEquivalencia(n);
    return Math.round(n * 10 ** d) / 10 ** d === 1;
};

export function equivalenciaCO2(co2: number): Equivalencia | null {
    const arboles = co2 / KG_CO2_POR_ARBOL_ANIO;
    if (arboles >= 1) return { icono: TreeDeciduous, valor: arboles, nombre: ['árbol', 'árboles'], descripcion: 'absorberían en un año el CO₂ que se evitó' };
    if (co2 > 0) return { icono: Car, valor: co2 / 0.21, nombre: ['km en auto', 'km en auto'], descripcion: 'equivale al CO₂ que se evitó' };
    return null;
}

export function equivalenciaAgua(litros: number): Equivalencia | null {
    if (litros >= LITROS_ALBERCA_OLIMPICA)
        return { icono: Waves, valor: litros / LITROS_ALBERCA_OLIMPICA, nombre: ['alberca olímpica', 'albercas olímpicas'], descripcion: 'de agua que no se contaminó con aceite' };
    if (litros >= LITROS_TINACO)
        return { icono: Cylinder, valor: litros / LITROS_TINACO, nombre: ['tinaco', 'tinacos'], descripcion: 'de agua (de 1,100 L) que no se contaminaron con aceite' };
    if (litros > 0) return { icono: Droplets, valor: litros, nombre: ['litro', 'litros'], descripcion: 'de agua que no se contaminaron con aceite' };
    return null;
}

export function equivalenciaBasura(kg: number): Equivalencia | null {
    if (kg >= KG_CAMION_RECOLECTOR)
        return { icono: Truck, valor: kg / KG_CAMION_RECOLECTOR, nombre: ['camión recolector', 'camiones recolectores'], descripcion: 'llenos de basura que no terminó en el mar' };
    if (kg >= KG_BOLSA_BASURA)
        return { icono: ShoppingBag, valor: kg / KG_BOLSA_BASURA, nombre: ['bolsa de basura', 'bolsas de basura'], descripcion: 'llenas que no terminaron en el mar' };
    if (kg > 0) return { icono: Fish, valor: kg, nombre: ['kilo', 'kilos'], descripcion: 'de basura que no terminaron en el mar' };
    return null;
}

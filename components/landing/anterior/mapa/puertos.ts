// Puertos que se muestran en el mapa de la landing. Coordenadas reales
// (aproximadas a la zona portuaria de cada ciudad).

export interface PuertoMapa {
    id: string;
    nombre: string;
    estado: string;
    lat: number;
    lng: number;
    activo: boolean;
    descripcion: string;
}

export const PUERTOS: PuertoMapa[] = [
    {
        id: 'puerto-penasco',
        nombre: 'Puerto Peñasco',
        estado: 'Sonora',
        lat: 31.3037,
        lng: -113.5451,
        activo: true,
        descripcion: 'Puerto pionero. Sistema en operación digitalizando manifiestos desde 2024 con SEMARNAT.',
    },
    {
        id: 'guaymas',
        nombre: 'Guaymas',
        estado: 'Sonora',
        lat: 27.918,
        lng: -110.899,
        activo: false,
        descripcion: 'Flota pesquera de gran escala. Candidato prioritario para expansión regional.',
    },
    {
        id: 'ensenada',
        nombre: 'Ensenada',
        estado: 'Baja California',
        lat: 31.857,
        lng: -116.622,
        activo: false,
        descripcion: 'Puerto de clase mundial en el Pacífico con alto volumen de embarcaciones.',
    },
    {
        id: 'la-paz',
        nombre: 'La Paz',
        estado: 'Baja California Sur',
        lat: 24.143,
        lng: -110.313,
        activo: false,
        descripcion: 'Centro pesquero del Mar de Cortés con ecosistemas protegidos.',
    },
    {
        id: 'mazatlan',
        nombre: 'Mazatlán',
        estado: 'Sinaloa',
        lat: 23.197,
        lng: -106.424,
        activo: false,
        descripcion: 'Uno de los principales puertos pesqueros del Pacífico mexicano.',
    },
    {
        id: 'manzanillo',
        nombre: 'Manzanillo',
        estado: 'Colima',
        lat: 19.052,
        lng: -104.316,
        activo: false,
        descripcion: 'Puerto comercial y pesquero estratégico del Pacífico central.',
    },
    {
        id: 'acapulco',
        nombre: 'Acapulco',
        estado: 'Guerrero',
        lat: 16.853,
        lng: -99.824,
        activo: false,
        descripcion: 'Bahía histórica con flota ribereña y de altura.',
    },
    {
        id: 'veracruz',
        nombre: 'Veracruz',
        estado: 'Veracruz',
        lat: 19.203,
        lng: -96.134,
        activo: false,
        descripcion: 'Puerto más antiguo de América continental, con enorme potencial de expansión.',
    },
    {
        id: 'progreso',
        nombre: 'Progreso',
        estado: 'Yucatán',
        lat: 21.282,
        lng: -89.665,
        activo: false,
        descripcion: 'Puerta al Golfo de México y al Caribe mexicano.',
    },
];

export const PUERTO_ACTIVO = PUERTOS.find((p) => p.activo)!;

/** Variantes del mapa de la landing (se pueden comparar con ?mapa=...). */
export type VarianteMapa = 'globo' | 'red' | 'silueta';
export const VARIANTES_MAPA: { id: VarianteMapa; nombre: string }[] = [
    { id: 'globo', nombre: 'Opción 1 · Globo 3D' },
    { id: 'red', nombre: 'Opción 2 · Red nacional' },
    { id: 'silueta', nombre: 'Opción 3 · Silueta' },
];
export const VARIANTE_MAPA_PREDETERMINADA: VarianteMapa = 'silueta';

/**
 * Curva suave entre dos puntos (lng/lat), para dibujar la ruta desde el puerto
 * activo. Arco de Bézier cuadrático con el punto de control desplazado hacia
 * el norte/lado, muestreado en `pasos` puntos.
 */
export function arco(desde: PuertoMapa, hasta: PuertoMapa, pasos = 48): [number, number][] {
    const [x1, y1] = [desde.lng, desde.lat];
    const [x2, y2] = [hasta.lng, hasta.lat];
    const mx = (x1 + x2) / 2;
    const my = (y1 + y2) / 2;
    const dx = x2 - x1;
    const dy = y2 - y1;
    const curvatura = 0.22;
    const cx = mx - dy * curvatura;
    const cy = my + dx * curvatura;
    const puntos: [number, number][] = [];
    for (let i = 0; i <= pasos; i++) {
        const t = i / pasos;
        const a = (1 - t) * (1 - t);
        const b = 2 * (1 - t) * t;
        const c = t * t;
        puntos.push([a * x1 + b * cx + c * x2, a * y1 + b * cy + c * y2]);
    }
    return puntos;
}

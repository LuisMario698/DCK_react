// Datos de muestra para el panel de Empresa Recolectora.
// Reemplazar por queries a Supabase cuando el modelo esté disponible.

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'completada';

export type TipoResiduo = 'plastico' | 'aceite' | 'carton' | 'chatarra' | 'vidrio' | 'organico';

export interface ResiduoDisponible {
    tipo: TipoResiduo;
    cantidad: number;
    unidad: 'kg' | 'L';
}

export interface PuertoMock {
    id: string;
    nombre: string;
    region: string;
    distanciaKm: number;
    coordenadas: { x: number; y: number }; // posición relativa 0-100 (legacy SVG)
    lat: number; // latitud real
    lng: number; // longitud real
    imagen?: string | null;   // ruta relativa a /public  (ej. '/images/penasco.jpg')
    estado: 'disponible' | 'sin_disponibilidad';
    residuos: ResiduoDisponible[];
    actualizadoHaceMin: number;
}

export interface SolicitudMock {
    id: string;
    puerto: string;
    residuo: TipoResiduo;
    cantidad: number;
    unidad: 'kg' | 'L';
    fechaSolicitud: string; // ISO
    estado: EstadoSolicitud;
}

export interface HistorialMock {
    id: string;
    fecha: string;
    puerto: string;
    residuo: TipoResiduo;
    cantidad: number;
    unidad: 'kg' | 'L';
    comprobanteUrl: string;
}

export interface NotificacionMock {
    id: string;
    tipo: 'aprobada' | 'rechazada' | 'completada' | 'nuevo_residuo';
    titulo: string;
    detalle: string;
    haceMin: number;
}

export const PUERTOS_MOCK: PuertoMock[] = [
    {
        id: 'p1',
        nombre: 'Puerto Peñasco',
        region: 'Sonora',
        distanciaKm: 2.4,
        coordenadas: { x: 22, y: 30 },
        lat: 31.3167,
        lng: -113.5333,
        imagen: '/images/penasco.jpg',
        estado: 'disponible',
        residuos: [
            { tipo: 'plastico', cantidad: 500, unidad: 'kg' },
            { tipo: 'aceite', cantidad: 300, unidad: 'L' },
            { tipo: 'carton', cantidad: 200, unidad: 'kg' },
            { tipo: 'chatarra', cantidad: 150, unidad: 'kg' },
        ],
        actualizadoHaceMin: 10,
    },
    {
        id: 'p2',
        nombre: 'Guaymas',
        region: 'Sonora',
        distanciaKm: 18.5,
        coordenadas: { x: 28, y: 48 },
        lat: 27.9167,
        lng: -110.8833,
        estado: 'disponible',
        residuos: [
            { tipo: 'plastico', cantidad: 320, unidad: 'kg' },
            { tipo: 'organico', cantidad: 540, unidad: 'kg' },
            { tipo: 'vidrio', cantidad: 80, unidad: 'kg' },
        ],
        actualizadoHaceMin: 35,
    },
    {
        id: 'p3',
        nombre: 'Mazatlán',
        region: 'Sinaloa',
        distanciaKm: 240,
        coordenadas: { x: 38, y: 60 },
        lat: 23.2167,
        lng: -106.4167,
        estado: 'disponible',
        residuos: [
            { tipo: 'aceite', cantidad: 420, unidad: 'L' },
            { tipo: 'chatarra', cantidad: 280, unidad: 'kg' },
        ],
        actualizadoHaceMin: 90,
    },
    {
        id: 'p4',
        nombre: 'La Paz',
        region: 'Baja California Sur',
        distanciaKm: 320,
        coordenadas: { x: 30, y: 65 },
        lat: 24.1667,
        lng: -110.3,
        estado: 'sin_disponibilidad',
        residuos: [],
        actualizadoHaceMin: 240,
    },
    {
        id: 'p5',
        nombre: 'Ensenada',
        region: 'Baja California',
        distanciaKm: 380,
        coordenadas: { x: 12, y: 22 },
        lat: 31.8667,
        lng: -116.6,
        estado: 'disponible',
        residuos: [
            { tipo: 'plastico', cantidad: 610, unidad: 'kg' },
            { tipo: 'carton', cantidad: 410, unidad: 'kg' },
            { tipo: 'aceite', cantidad: 180, unidad: 'L' },
        ],
        actualizadoHaceMin: 18,
    },
    {
        id: 'p6',
        nombre: 'Manzanillo',
        region: 'Colima',
        distanciaKm: 540,
        coordenadas: { x: 50, y: 75 },
        lat: 19.05,
        lng: -104.3167,
        estado: 'disponible',
        residuos: [
            { tipo: 'organico', cantidad: 800, unidad: 'kg' },
            { tipo: 'vidrio', cantidad: 220, unidad: 'kg' },
        ],
        actualizadoHaceMin: 60,
    },
    {
        id: 'p7',
        nombre: 'Veracruz',
        region: 'Veracruz',
        distanciaKm: 870,
        coordenadas: { x: 68, y: 72 },
        lat: 19.1925,
        lng: -96.1342,
        estado: 'disponible',
        residuos: [
            { tipo: 'plastico', cantidad: 450, unidad: 'kg' },
            { tipo: 'carton', cantidad: 300, unidad: 'kg' },
        ],
        actualizadoHaceMin: 45,
    },
    {
        id: 'p8',
        nombre: 'Tampico',
        region: 'Tamaulipas',
        distanciaKm: 960,
        coordenadas: { x: 72, y: 52 },
        lat: 22.2667,
        lng: -97.8667,
        estado: 'disponible',
        residuos: [
            { tipo: 'aceite', cantidad: 600, unidad: 'L' },
            { tipo: 'chatarra', cantidad: 200, unidad: 'kg' },
        ],
        actualizadoHaceMin: 120,
    },
    {
        id: 'p9',
        nombre: 'Progreso',
        region: 'Yucatán',
        distanciaKm: 1450,
        coordenadas: { x: 82, y: 68 },
        lat: 21.2833,
        lng: -89.6667,
        estado: 'sin_disponibilidad',
        residuos: [],
        actualizadoHaceMin: 360,
    },
];

export const SOLICITUDES_MOCK: SolicitudMock[] = [
    { id: 's1', puerto: 'Puerto Peñasco', residuo: 'plastico', cantidad: 500, unidad: 'kg', fechaSolicitud: '2026-04-10', estado: 'pendiente' },
    { id: 's2', puerto: 'Guaymas', residuo: 'organico', cantidad: 540, unidad: 'kg', fechaSolicitud: '2026-04-08', estado: 'aprobada' },
    { id: 's3', puerto: 'Ensenada', residuo: 'aceite', cantidad: 180, unidad: 'L', fechaSolicitud: '2026-04-05', estado: 'completada' },
    { id: 's4', puerto: 'Mazatlán', residuo: 'chatarra', cantidad: 280, unidad: 'kg', fechaSolicitud: '2026-04-02', estado: 'rechazada' },
    { id: 's5', puerto: 'Puerto Peñasco', residuo: 'carton', cantidad: 200, unidad: 'kg', fechaSolicitud: '2026-04-01', estado: 'completada' },
    { id: 's6', puerto: 'Manzanillo', residuo: 'vidrio', cantidad: 220, unidad: 'kg', fechaSolicitud: '2026-03-28', estado: 'pendiente' },
];

export const HISTORIAL_MOCK: HistorialMock[] = [
    { id: 'h1', fecha: '2026-04-05', puerto: 'Ensenada', residuo: 'aceite', cantidad: 180, unidad: 'L', comprobanteUrl: '#' },
    { id: 'h2', fecha: '2026-04-01', puerto: 'Puerto Peñasco', residuo: 'carton', cantidad: 200, unidad: 'kg', comprobanteUrl: '#' },
    { id: 'h3', fecha: '2026-03-22', puerto: 'Guaymas', residuo: 'plastico', cantidad: 320, unidad: 'kg', comprobanteUrl: '#' },
    { id: 'h4', fecha: '2026-03-15', puerto: 'Manzanillo', residuo: 'organico', cantidad: 800, unidad: 'kg', comprobanteUrl: '#' },
    { id: 'h5', fecha: '2026-03-09', puerto: 'Mazatlán', residuo: 'chatarra', cantidad: 150, unidad: 'kg', comprobanteUrl: '#' },
    { id: 'h6', fecha: '2026-03-02', puerto: 'Puerto Peñasco', residuo: 'plastico', cantidad: 380, unidad: 'kg', comprobanteUrl: '#' },
];

export const NOTIFICACIONES_MOCK: NotificacionMock[] = [
    { id: 'n1', tipo: 'aprobada', titulo: 'Solicitud aprobada', detalle: 'Guaymas · 540 kg de orgánico', haceMin: 25 },
    { id: 'n2', tipo: 'nuevo_residuo', titulo: 'Nuevo residuo disponible', detalle: 'Ensenada · 610 kg de plástico', haceMin: 60 },
    { id: 'n3', tipo: 'completada', titulo: 'Recolección completada', detalle: 'Ensenada · 180 L de aceite', haceMin: 180 },
    { id: 'n4', tipo: 'rechazada', titulo: 'Solicitud rechazada', detalle: 'Mazatlán · 280 kg de chatarra', haceMin: 1440 },
    { id: 'n5', tipo: 'aprobada', titulo: 'Solicitud aprobada', detalle: 'Puerto Peñasco · 200 kg de cartón', haceMin: 2880 },
];

// Datos para impacto ambiental
export const IMPACTO_MENSUAL_MOCK = [
    { mes: 'Ene', toneladas: 1.2 },
    { mes: 'Feb', toneladas: 1.6 },
    { mes: 'Mar', toneladas: 2.1 },
    { mes: 'Abr', toneladas: 2.3 },
    { mes: 'May', toneladas: 2.6 },
    { mes: 'Jun', toneladas: 2.9 },
];

export const IMPACTO_POR_TIPO_MOCK = [
    { tipo: 'Plástico', valor: 45, color: '#3b82f6' },
    { tipo: 'Aceite', valor: 20, color: '#f59e0b' },
    { tipo: 'Cartón', valor: 20, color: '#10b981' },
    { tipo: 'Chatarra', valor: 10, color: '#a855f7' },
    { tipo: 'Otros', valor: 5, color: '#94a3b8' },
];

export const TIPO_RESIDUO_LABEL: Record<TipoResiduo, string> = {
    plastico: 'Plástico',
    aceite: 'Aceite usado',
    carton: 'Cartón',
    chatarra: 'Chatarra metálica',
    vidrio: 'Vidrio',
    organico: 'Orgánico',
};

export const TIPO_RESIDUO_COLOR: Record<TipoResiduo, string> = {
    plastico: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    aceite: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    carton: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
    chatarra: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
    vidrio: 'bg-cyan-100 text-cyan-700 dark:bg-cyan-900/30 dark:text-cyan-400',
    organico: 'bg-lime-100 text-lime-700 dark:bg-lime-900/30 dark:text-lime-400',
};

export const EMPRESA_PERFIL_MOCK = {
    nombre: 'EcoRecicla S.A. de C.V.',
    email: 'contacto@ecorecicla.mx',
    telefono: '+52 662 123 4567',
    tipo: 'Empresa Recolectora',
    ubicacion: 'Hermosillo, Sonora, México',
    rfc: 'ECO241004ABC',
    tiposResiduo: ['plastico', 'aceite', 'carton', 'chatarra', 'vidrio'] as TipoResiduo[],
};

export const KPIS_MOCK = {
    solicitudesActivas: 3,
    recoleccionesCompletadas: 12,
    materialObtenidoToneladas: 2.3,
    co2EvitadoToneladas: 1.8,
};

export function formatHaceMin(min: number): string {
    if (min < 60) return `Hace ${min} min`;
    if (min < 1440) return `Hace ${Math.floor(min / 60)} h`;
    const dias = Math.floor(min / 1440);
    return dias === 1 ? 'Hace 1 día' : `Hace ${dias} días`;
}

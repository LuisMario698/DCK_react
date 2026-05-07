// Mock data para el módulo "Asociaciones Recolectoras" del panel del Administrador Portuario.
// Reemplazar por queries a Supabase cuando el modelo esté disponible.

import type { TipoResiduo } from './recolector';
export { TIPO_RESIDUO_LABEL, TIPO_RESIDUO_COLOR } from './recolector';
export type { TipoResiduo } from './recolector';

export type EstadoSolicitud = 'pendiente' | 'aprobada' | 'rechazada' | 'completada';

export interface ResiduoInventario {
    id: string;
    tipo: TipoResiduo;
    cantidad: number;
    unidad: 'kg' | 'L';
    actualizado: string; // ISO date
    notas?: string;
}

export interface EmpresaRecolectora {
    id: string;
    nombre: string;
    rfc: string;
    email: string;
    telefono: string;
    ubicacion: string;
    sitioWeb?: string;
    descripcion: string;
    tiposResiduo: TipoResiduo[];
    calificacion: number; // 0-5
    convenios: number;
    avatar?: string;
}

export interface SolicitudEntrante {
    id: string;
    empresaId: string;
    residuo: TipoResiduo;
    cantidad: number;
    unidad: 'kg' | 'L';
    fechaSolicitud: string; // ISO
    fechaPropuesta: string; // ISO
    estado: EstadoSolicitud;
    mensaje?: string;
}

export interface MensajeChat {
    id: string;
    autor: 'admin' | 'empresa';
    texto: string;
    enviadoHaceMin: number;
}

export interface ConversacionChat {
    empresaId: string;
    mensajes: MensajeChat[];
    noLeidos: number;
}

// ─────────────────────────────────────────────────────────────────────
// Inventario inicial publicado por el puerto
// ─────────────────────────────────────────────────────────────────────
export const INVENTARIO_MOCK: ResiduoInventario[] = [
    { id: 'r1', tipo: 'plastico', cantidad: 500, unidad: 'kg', actualizado: '2026-05-04', notas: 'Plástico PET y HDPE separado.' },
    { id: 'r2', tipo: 'aceite', cantidad: 300, unidad: 'L', actualizado: '2026-05-03' },
    { id: 'r3', tipo: 'carton', cantidad: 200, unidad: 'kg', actualizado: '2026-05-02' },
    { id: 'r4', tipo: 'chatarra', cantidad: 150, unidad: 'kg', actualizado: '2026-04-28' },
    { id: 'r5', tipo: 'vidrio', cantidad: 80, unidad: 'kg', actualizado: '2026-04-22' },
];

// ─────────────────────────────────────────────────────────────────────
// Empresas recolectoras
// ─────────────────────────────────────────────────────────────────────
export const EMPRESAS_MOCK: EmpresaRecolectora[] = [
    {
        id: 'e1',
        nombre: 'EcoRecicla S.A. de C.V.',
        rfc: 'ECO241004ABC',
        email: 'contacto@ecorecicla.mx',
        telefono: '+52 662 123 4567',
        ubicacion: 'Hermosillo, Sonora',
        sitioWeb: 'https://ecorecicla.mx',
        descripcion: 'Empresa con 12 años de experiencia en recolección y procesamiento de plásticos y aceites en el noroeste del país.',
        tiposResiduo: ['plastico', 'aceite', 'carton'],
        calificacion: 4.7,
        convenios: 18,
    },
    {
        id: 'e2',
        nombre: 'Verde Costa Recolectores',
        rfc: 'VCR210512XYZ',
        email: 'ventas@verdecosta.com',
        telefono: '+52 638 555 0123',
        ubicacion: 'Puerto Peñasco, Sonora',
        descripcion: 'Especialistas en chatarra metálica y vidrio. Servicio local con flota propia.',
        tiposResiduo: ['chatarra', 'vidrio'],
        calificacion: 4.3,
        convenios: 7,
    },
    {
        id: 'e3',
        nombre: 'GreenLoop Industrial',
        rfc: 'GLI190820QWE',
        email: 'hola@greenloop.io',
        telefono: '+52 644 999 4321',
        ubicacion: 'Guaymas, Sonora',
        sitioWeb: 'https://greenloop.io',
        descripcion: 'Procesamiento integral de residuos industriales con certificación ISO 14001.',
        tiposResiduo: ['plastico', 'carton', 'organico', 'vidrio'],
        calificacion: 4.9,
        convenios: 24,
    },
    {
        id: 'e4',
        nombre: 'Reciclados del Mar',
        rfc: 'RDM230101RST',
        email: 'info@recicladosdelmar.mx',
        telefono: '+52 612 222 9988',
        ubicacion: 'La Paz, Baja California Sur',
        descripcion: 'Cooperativa enfocada en residuos provenientes de actividades portuarias y pesqueras.',
        tiposResiduo: ['plastico', 'aceite', 'organico'],
        calificacion: 4.1,
        convenios: 5,
    },
];

// ─────────────────────────────────────────────────────────────────────
// Solicitudes entrantes
// ─────────────────────────────────────────────────────────────────────
export const SOLICITUDES_ENTRANTES_MOCK: SolicitudEntrante[] = [
    {
        id: 'sol1',
        empresaId: 'e1',
        residuo: 'plastico',
        cantidad: 300,
        unidad: 'kg',
        fechaSolicitud: '2026-05-05',
        fechaPropuesta: '2026-05-10',
        estado: 'pendiente',
        mensaje: 'Solicitamos retirar 300 kg de plástico PET. Podemos enviar unidad el lunes en horario matutino.',
    },
    {
        id: 'sol2',
        empresaId: 'e3',
        residuo: 'carton',
        cantidad: 200,
        unidad: 'kg',
        fechaSolicitud: '2026-05-04',
        fechaPropuesta: '2026-05-08',
        estado: 'pendiente',
        mensaje: 'Interés en la totalidad de cartón disponible.',
    },
    {
        id: 'sol3',
        empresaId: 'e2',
        residuo: 'chatarra',
        cantidad: 150,
        unidad: 'kg',
        fechaSolicitud: '2026-05-02',
        fechaPropuesta: '2026-05-06',
        estado: 'aprobada',
    },
    {
        id: 'sol4',
        empresaId: 'e4',
        residuo: 'aceite',
        cantidad: 100,
        unidad: 'L',
        fechaSolicitud: '2026-04-30',
        fechaPropuesta: '2026-05-05',
        estado: 'rechazada',
        mensaje: 'Cantidad insuficiente para nuestro tonelaje mínimo.',
    },
    {
        id: 'sol5',
        empresaId: 'e1',
        residuo: 'aceite',
        cantidad: 200,
        unidad: 'L',
        fechaSolicitud: '2026-04-25',
        fechaPropuesta: '2026-04-29',
        estado: 'completada',
    },
];

// ─────────────────────────────────────────────────────────────────────
// Conversaciones (chat con empresas)
// ─────────────────────────────────────────────────────────────────────
export const CONVERSACIONES_MOCK: ConversacionChat[] = [
    {
        empresaId: 'e1',
        noLeidos: 2,
        mensajes: [
            { id: 'm1', autor: 'empresa', texto: 'Buenas tardes, ¿podemos confirmar el horario de entrega?', enviadoHaceMin: 180 },
            { id: 'm2', autor: 'admin', texto: 'Hola, sí. La carga estará lista a partir de las 9:00 a.m.', enviadoHaceMin: 150 },
            { id: 'm3', autor: 'empresa', texto: 'Perfecto. ¿Necesitan documento de transporte previo?', enviadoHaceMin: 30 },
            { id: 'm4', autor: 'empresa', texto: 'Quedamos atentos.', enviadoHaceMin: 10 },
        ],
    },
    {
        empresaId: 'e3',
        noLeidos: 0,
        mensajes: [
            { id: 'm5', autor: 'admin', texto: 'Confirmamos disponibilidad de 200 kg de cartón.', enviadoHaceMin: 1440 },
            { id: 'm6', autor: 'empresa', texto: 'Excelente, generamos la orden interna.', enviadoHaceMin: 1380 },
        ],
    },
    {
        empresaId: 'e2',
        noLeidos: 1,
        mensajes: [
            { id: 'm7', autor: 'empresa', texto: '¿Cuándo estaría disponible un nuevo lote de vidrio?', enviadoHaceMin: 60 },
        ],
    },
];

export function formatFechaCorta(iso: string): string {
    return new Date(iso).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
}

export function formatHaceMin(min: number): string {
    if (min < 60) return `${min} min`;
    if (min < 1440) return `${Math.floor(min / 60)} h`;
    const dias = Math.floor(min / 1440);
    return dias === 1 ? '1 día' : `${dias} días`;
}

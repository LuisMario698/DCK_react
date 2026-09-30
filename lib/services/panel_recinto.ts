import { SupabaseClient } from '@supabase/supabase-js';
import { TIPOS_RESIDUO, type TipoResiduo, type UnidadResiduo } from '@/lib/constants/residuos';
import { rangoEstadisticas } from './dashboard_stats';

// ── Panel inicial del recinto ────────────────────────────────────────────────
//
// Lo que el Panel cuenta del día y lo que hay por atender. Son conteos y filas sueltas, para que el
// Panel siga abriendo rápido. Cada número coincide con lo que se ve al entrar a su pantalla:
// "por revisar" y "por recolectar" son los filtros de Solicitudes, y los manifiestos del mes son
// los de Estadísticas en "1 mes".

/** Una solicitud, lo justo para decirla en una línea */
export interface SolicitudBreve {
    id: number;
    empresa: string;
    tipo: TipoResiduo;
    cantidad: number;
    unidad: UnidadResiduo;
    /** YYYY-MM-DD */
    fechaPropuesta: string;
}

export interface ResumenPanel {
    hoy: { manifiestos: number; recibosBasuron: number };
    /** Cuándo se guardó el último (ISO); null si no hay ninguno */
    ultimoManifiesto: string | null;
    ultimoRecibo: string | null;
    /** Manifiestos de los últimos 30 días (como Estadísticas en "1 mes") */
    manifiestosMes: number;
    /** Solicitudes que esperan que el recinto las apruebe o rechace */
    porRevisar: { total: number; masAntigua: string | null; unica: SolicitudBreve | null };
    /** Aprobadas cuya fecha ya llegó: la empresa viene hoy o ya debió venir */
    porRecolectar: { total: number; atrasadas: number; unica: SolicitudBreve | null };
    /** Mensajes de las empresas que el recinto no ha leído */
    mensajes: { total: number; empresas: { id: number; nombre: string }[] };
    /** Avisos de la campana sin leer (el Panel dice "Nada pendiente" en vez de "Todo al día") */
    avisosSinLeer: number;
}

type Relacion = { nombre_asociacion: string | null } | { nombre_asociacion: string | null }[] | null;

interface FilaSolicitud {
    id: number;
    tipo: TipoResiduo;
    cantidad_solicitada: number | string;
    cantidad_aprobada: number | string | null;
    unidad: UnidadResiduo;
    fecha_propuesta: string;
    created_at: string;
    asociacion: Relacion;
}
interface FilaMensaje {
    asociacion_id: number;
    asociacion: Relacion;
}

const SELECT_SOLICITUD =
    'id, tipo, cantidad_solicitada, cantidad_aprobada, unidad, fecha_propuesta, created_at, asociacion:asociaciones_recolectoras(nombre_asociacion)';

// Según la versión de PostgREST la relación llega como objeto o como arreglo
const nombreDe = (a: Relacion) => (Array.isArray(a) ? a[0] : a)?.nombre_asociacion || 'Una empresa';

function breve(f: FilaSolicitud): SolicitudBreve {
    return {
        id: f.id,
        empresa: nombreDe(f.asociacion),
        tipo: f.tipo,
        cantidad: Number(f.cantidad_aprobada ?? f.cantidad_solicitada) || 0,
        unidad: f.unidad,
        fechaPropuesta: f.fecha_propuesta,
    };
}

/** Espera la consulta y, si falló, lanza su error */
async function sinError<T extends { error: unknown }>(consulta: PromiseLike<T>): Promise<T> {
    const r = await consulta;
    if (r.error) throw r.error;
    return r;
}

/**
 * Resumen del Panel. `hoy` es la fecha de Puerto Peñasco (YYYY-MM-DD): los manifiestos y recibos
 * se guardan con la fecha local del teléfono o la computadora del recinto.
 */
export async function getResumenPanel(supabase: SupabaseClient, hoy: string): Promise<ResumenPanel> {
    const mes = rangoEstadisticas('mes');
    const reciente = { ascending: false, nullsFirst: false };

    const [mHoy, bHoy, ultM, ultB, mMes, revisar, recolectar, mensajes, avisos] = await Promise.all([
        sinError(supabase.from('manifiestos').select('id', { count: 'exact', head: true }).eq('fecha_emision', hoy)),
        sinError(supabase.from('manifiesto_basuron').select('id', { count: 'exact', head: true }).eq('fecha', hoy)),
        sinError(supabase.from('manifiestos').select('created_at').order('created_at', reciente).limit(1)),
        sinError(supabase.from('manifiesto_basuron').select('created_at').order('created_at', reciente).limit(1)),
        sinError(
            supabase
                .from('manifiestos')
                .select('id', { count: 'exact', head: true })
                .gte('fecha_emision', mes.inicio!)
                .lte('fecha_emision', mes.fin)
        ),
        // Sólo la más antigua (la que lleva más tiempo esperando) y cuántas son
        sinError(
            supabase
                .from('solicitudes_recoleccion')
                .select(SELECT_SOLICITUD, { count: 'exact' })
                .eq('estado', 'pendiente')
                .order('created_at', { ascending: true })
                .limit(1)
        ),
        sinError(
            supabase
                .from('solicitudes_recoleccion')
                .select(SELECT_SOLICITUD)
                .eq('estado', 'aprobada')
                .lte('fecha_propuesta', hoy)
                .order('fecha_propuesta', { ascending: true })
        ),
        sinError(
            supabase
                .from('mensajes')
                .select('asociacion_id, asociacion:asociaciones_recolectoras(nombre_asociacion)', { count: 'exact' })
                .eq('autor_rol', 'recolector')
                .is('leido_at', null)
                .limit(200)
        ),
        // Igual que la campana (contarNotificacionesNoLeidas con destinatario admin)
        sinError(
            supabase
                .from('notificaciones')
                .select('id', { count: 'exact', head: true })
                .eq('destinatario', 'admin')
                .eq('leida', false)
        ),
    ]);

    const pendientes = (revisar.data ?? []) as unknown as FilaSolicitud[];
    const aprobadas = (recolectar.data ?? []) as unknown as FilaSolicitud[];
    const empresas = new Map<number, string>();
    for (const m of (mensajes.data ?? []) as unknown as FilaMensaje[]) {
        if (!empresas.has(m.asociacion_id)) empresas.set(m.asociacion_id, nombreDe(m.asociacion));
    }
    const fechaDe = (r: { data: unknown }) => (r.data as { created_at: string | null }[] | null)?.[0]?.created_at ?? null;
    const totalRevisar = revisar.count ?? pendientes.length;

    return {
        hoy: { manifiestos: mHoy.count ?? 0, recibosBasuron: bHoy.count ?? 0 },
        ultimoManifiesto: fechaDe(ultM),
        ultimoRecibo: fechaDe(ultB),
        manifiestosMes: mMes.count ?? 0,
        porRevisar: {
            total: totalRevisar,
            masAntigua: pendientes[0]?.created_at ?? null,
            unica: totalRevisar === 1 && pendientes[0] ? breve(pendientes[0]) : null,
        },
        porRecolectar: {
            total: aprobadas.length,
            atrasadas: aprobadas.filter((f) => f.fecha_propuesta < hoy).length,
            unica: aprobadas.length === 1 ? breve(aprobadas[0]) : null,
        },
        mensajes: {
            total: mensajes.count ?? empresas.size,
            empresas: [...empresas].map(([id, nombre]) => ({ id, nombre })),
        },
        avisosSinLeer: avisos.count ?? 0,
    };
}

// ── Un vistazo: lo último registrado, el acopio y cuántos hay ────────────────
//
// Lo de abajo de las tarjetas grandes. Aparte del resumen: si esto falla, lo de arriba sigue.

export type MovimientoReciente = { id: number; fecha: string } & (
    | { tipo: 'manifiesto'; numero: string | null; embarcacion: string | null }
    | { tipo: 'basuron'; kg: number; deQuien: string | null }
    | { tipo: 'recoleccion'; solicitudId: number; empresa: string; residuo: TipoResiduo; cantidad: number; unidad: UnidadResiduo }
);

export interface ResiduoEnAcopio {
    tipo: TipoResiduo;
    cantidad: number;
    unidad: UnidadResiduo;
    /** ¿Lo ven las empresas? */
    publicado: boolean;
}

export interface VistazoPanel {
    /** Los 5 más recientes de manifiestos, recibos del basurón y recolecciones, juntos */
    recientes: MovimientoReciente[];
    /** Lo que hay hoy en el centro de acopio (sólo lo que tiene cantidad) */
    acopio: ResiduoEnAcopio[];
    conteos: { embarcaciones: number; personas: number; asociacionesActivas: number };
}

type RelacionBuque = { nombre_buque: string | null } | { nombre_buque: string | null }[] | null;
const buqueDe = (b: RelacionBuque) => (Array.isArray(b) ? b[0] : b)?.nombre_buque || null;

const RECIENTES = 5;

export async function getVistazoPanel(supabase: SupabaseClient): Promise<VistazoPanel> {
    const reciente = { ascending: false, nullsFirst: false };

    const [man, bas, rec, inv, buques, personas, asociaciones] = await Promise.all([
        sinError(
            supabase
                .from('manifiestos')
                .select('id, numero_manifiesto, created_at, buque:buques(nombre_buque)')
                .not('created_at', 'is', null)
                .order('created_at', reciente)
                .limit(RECIENTES)
        ),
        sinError(
            supabase
                .from('manifiesto_basuron')
                .select('id, recibimos_de, total_depositado, created_at, buque:buques(nombre_buque)')
                .not('created_at', 'is', null)
                .order('created_at', reciente)
                .limit(RECIENTES)
        ),
        sinError(
            supabase
                .from('recolecciones')
                .select('id, solicitud_id, tipo, cantidad, unidad, created_at, asociacion:asociaciones_recolectoras(nombre_asociacion)')
                .order('created_at', reciente)
                .limit(RECIENTES)
        ),
        sinError(supabase.from('inventario_residuos').select('tipo, cantidad, unidad, publicado').gt('cantidad', 0)),
        sinError(supabase.from('buques').select('id', { count: 'exact', head: true })),
        sinError(supabase.from('personas').select('id', { count: 'exact', head: true })),
        sinError(supabase.from('asociaciones_recolectoras').select('id', { count: 'exact', head: true }).eq('estado', 'Activo')),
    ]);

    type FilaM = { id: number; numero_manifiesto: string | null; created_at: string; buque: RelacionBuque };
    type FilaB = { id: number; recibimos_de: string | null; total_depositado: number | string | null; created_at: string; buque: RelacionBuque };
    type FilaR = {
        id: number;
        solicitud_id: number;
        tipo: TipoResiduo;
        cantidad: number | string;
        unidad: UnidadResiduo;
        created_at: string;
        asociacion: Relacion;
    };

    const recientes: MovimientoReciente[] = [
        ...((man.data ?? []) as unknown as FilaM[]).map((m) => ({
            tipo: 'manifiesto' as const,
            id: m.id,
            fecha: m.created_at,
            numero: m.numero_manifiesto,
            embarcacion: buqueDe(m.buque),
        })),
        ...((bas.data ?? []) as unknown as FilaB[]).map((b) => ({
            tipo: 'basuron' as const,
            id: b.id,
            fecha: b.created_at,
            kg: Number(b.total_depositado) || 0,
            deQuien: b.recibimos_de?.trim() || buqueDe(b.buque),
        })),
        ...((rec.data ?? []) as unknown as FilaR[]).map((r) => ({
            tipo: 'recoleccion' as const,
            id: r.id,
            fecha: r.created_at,
            solicitudId: r.solicitud_id,
            empresa: nombreDe(r.asociacion),
            residuo: r.tipo,
            cantidad: Number(r.cantidad) || 0,
            unidad: r.unidad,
        })),
    ]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .slice(0, RECIENTES);

    // En el orden del catálogo (el mismo del inventario), no por cantidad: kg, L y piezas no se comparan
    const acopio = ((inv.data ?? []) as unknown as ResiduoEnAcopio[])
        .map((r) => ({ ...r, cantidad: Number(r.cantidad) || 0 }))
        .sort((a, b) => TIPOS_RESIDUO.indexOf(a.tipo) - TIPOS_RESIDUO.indexOf(b.tipo));

    return {
        recientes,
        acopio,
        conteos: {
            embarcaciones: buques.count ?? 0,
            personas: personas.count ?? 0,
            asociacionesActivas: asociaciones.count ?? 0,
        },
    };
}

import { SupabaseClient } from '@supabase/supabase-js';
import { ReportFilters, ReporteDetalladoItem } from '@/types/dashboard';

// ── Estadísticas por período (pantalla Estadísticas del recinto) ─────────────
//
// Todo lo de la pantalla sale del mismo período: cifras, comparación, gráfica y embarcaciones.
// Las unidades nunca se suman entre sí: basura y basurón en kg, aceite en litros, filtros en
// piezas.

export type PeriodoEstadisticas = 'semana' | 'mes' | 'trimestre' | 'anio' | 'todo';
/** Tamaño de cada barra de la gráfica: 7 días por día, 1-3 meses por semana, 1 año por mes, todo por año */
export type Granularidad = 'dia' | 'semana' | 'mes' | 'anio';

export interface TotalesPeriodo {
    basuraKg: number;
    aceiteL: number;
    basuronKg: number;
    entregasBasuron: number;
    manifiestos: number;
    porDigitalizar: number;
    /** Embarcaciones distintas con al menos un manifiesto */
    embarcaciones: number;
    filtrosAceite: number;
    filtrosDiesel: number;
    filtrosAire: number;
}

export interface TramoSerie {
    /** Primer día del tramo (YYYY-MM-DD). En semanas es el lunes */
    inicio: string;
    basuraKg: number;
    aceiteL: number;
    basuronKg: number;
}

export interface EmbarcacionDelPeriodo {
    buqueId: number;
    nombre: string;
    entregas: number;
    basuraKg: number;
    aceiteL: number;
}

export interface EstadisticasPeriodo {
    periodo: PeriodoEstadisticas;
    /** YYYY-MM-DD. En "todo", el primer día con registros ('' si no hay ninguno) */
    inicio: string;
    fin: string;
    granularidad: Granularidad;
    actual: TotalesPeriodo;
    /** Mismo largo, justo antes. null en "todo" */
    anterior: TotalesPeriodo | null;
    serie: TramoSerie[];
    /** Las 5 que más entregaron (por número de manifiestos) */
    embarcaciones: EmbarcacionDelPeriodo[];
    flota: { activas: number; registradas: number };
    /** ¿A dónde se fue? Lo que salió a reciclaje en el período y lo que hay hoy en acopio */
    destino: DestinoResiduos;
}

/** Quién se llevó un residuo a reciclaje y cuánto */
export interface EmpresaRecolectora {
    nombre: string;
    cantidad: number;
}

/**
 * Recorrido de un residuo: recibido de las embarcaciones (manifiestos del período), llevado a
 * reciclaje (recolecciones completadas del período) y lo que hay hoy en el centro de acopio
 * (inventario, no depende del período).
 */
export interface RecorridoResiduo {
    recibido: number;
    reciclado: number;
    enAcopio: number;
    empresas: EmpresaRecolectora[];
}

export interface DestinoResiduos {
    /** Litros */
    aceite: RecorridoResiduo;
    /** Piezas */
    filtros: RecorridoResiduo;
    /**
     * Plástico, cartón, chatarra, vidrio y orgánico (kg). No lleva "recibido": en los manifiestos
     * sólo hay "basura" en general, que no es lo mismo que estos materiales separados.
     */
    reciclables: Omit<RecorridoResiduo, 'recibido'> & { porTipo: { tipo: string; reciclado: number }[] };
    /** ¿Hay alguna recolección o inventario? Si no, la sección lo dice en lugar de mostrar ceros */
    hayDatos: boolean;
}

/** Fechas como texto YYYY-MM-DD en hora local: así no se corren un día por la zona horaria */
function fechaTexto(d: Date): string {
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}
function fechaLocal(texto: string): Date {
    const [a, m, d] = texto.split('-').map(Number);
    return new Date(a, (m || 1) - 1, d || 1);
}
function sumarDias(texto: string, dias: number): string {
    const d = fechaLocal(texto);
    d.setDate(d.getDate() + dias);
    return fechaTexto(d);
}
function lunesDe(texto: string): string {
    const d = fechaLocal(texto);
    return sumarDias(texto, -((d.getDay() + 6) % 7));
}

/** Rango del período actual y del anterior (mismo largo, justo antes) */
export function rangoEstadisticas(periodo: PeriodoEstadisticas, hoy = new Date()) {
    const fin = fechaTexto(hoy);
    if (periodo === 'todo') return { inicio: null, fin, anterior: null, granularidad: 'anio' as Granularidad };
    if (periodo === 'anio') {
        // 12 meses: el actual y los 11 anteriores, completos desde el día 1
        const inicio = fechaTexto(new Date(hoy.getFullYear(), hoy.getMonth() - 11, 1));
        const inicioAnterior = fechaTexto(new Date(hoy.getFullYear(), hoy.getMonth() - 23, 1));
        return { inicio, fin, anterior: { inicio: inicioAnterior, fin: sumarDias(inicio, -1) }, granularidad: 'mes' as Granularidad };
    }
    const dias = periodo === 'semana' ? 7 : periodo === 'mes' ? 30 : 90;
    const inicio = sumarDias(fin, -(dias - 1));
    const finAnterior = sumarDias(inicio, -1);
    return {
        inicio,
        fin,
        anterior: { inicio: sumarDias(finAnterior, -(dias - 1)), fin: finAnterior },
        granularidad: (periodo === 'semana' ? 'dia' : 'semana') as Granularidad,
    };
}

/**
 * Trae todas las filas de una consulta, de 1,000 en 1,000. Supabase corta cada respuesta en
 * 1,000 filas aunque se pida un `limit` mayor; con el histórico completo eso dejaba fuera datos.
 */
async function traerTodas(pagina: (desde: number, hasta: number) => PromiseLike<{ data: unknown[] | null; error: unknown }>): Promise<unknown[]> {
    const TAMANO = 1000;
    const filas: unknown[] = [];
    for (let desde = 0; ; desde += TAMANO) {
        const { data, error } = await pagina(desde, desde + TAMANO - 1);
        if (error) throw error;
        filas.push(...(data ?? []));
        if (!data || data.length < TAMANO) return filas;
    }
}

interface FilaManifiesto {
    id: number;
    fecha_emision: string | null;
    estado_digitalizacion: string | null;
    buque_id: number | null;
    buque: { nombre_buque: string | null } | { nombre_buque: string | null }[] | null;
    residuos: FilaResiduos | FilaResiduos[] | null;
}
interface FilaResiduos {
    aceite_usado: number | string | null;
    basura: number | string | null;
    filtros_aceite: number | string | null;
    filtros_diesel: number | string | null;
    filtros_aire: number | string | null;
}
interface FilaBasuron {
    id: number;
    fecha: string | null;
    total_depositado: number | string | null;
}

const num = (v: unknown) => Number(v ?? 0) || 0;
const comoLista = <T,>(v: T | T[] | null): T[] => (v == null ? [] : Array.isArray(v) ? v : [v]);

function residuosDe(m: FilaManifiesto) {
    // Normalmente hay un renglón de residuos por manifiesto; si hubiera más, se suman todos
    return comoLista(m.residuos).reduce(
        (s, r) => ({
            basura: s.basura + num(r.basura),
            aceite: s.aceite + num(r.aceite_usado),
            fAceite: s.fAceite + num(r.filtros_aceite),
            fDiesel: s.fDiesel + num(r.filtros_diesel),
            fAire: s.fAire + num(r.filtros_aire),
        }),
        { basura: 0, aceite: 0, fAceite: 0, fDiesel: 0, fAire: 0 }
    );
}

function sumarTotales(manifiestos: FilaManifiesto[], basuron: FilaBasuron[]): TotalesPeriodo {
    const t: TotalesPeriodo = {
        basuraKg: 0, aceiteL: 0, basuronKg: 0, entregasBasuron: basuron.length, manifiestos: manifiestos.length,
        porDigitalizar: 0, embarcaciones: 0, filtrosAceite: 0, filtrosDiesel: 0, filtrosAire: 0,
    };
    const buques = new Set<number>();
    for (const m of manifiestos) {
        const r = residuosDe(m);
        t.basuraKg += r.basura;
        t.aceiteL += r.aceite;
        t.filtrosAceite += r.fAceite;
        t.filtrosDiesel += r.fDiesel;
        t.filtrosAire += r.fAire;
        if (m.estado_digitalizacion === 'pendiente') t.porDigitalizar++;
        if (m.buque_id != null) buques.add(m.buque_id);
    }
    t.embarcaciones = buques.size;
    t.basuronKg = basuron.reduce((s, b) => s + num(b.total_depositado), 0);
    return t;
}

function claveTramo(fecha: string, g: Granularidad): string {
    if (g === 'dia') return fecha;
    if (g === 'semana') return lunesDe(fecha);
    if (g === 'mes') return `${fecha.slice(0, 7)}-01`;
    return `${fecha.slice(0, 4)}-01-01`;
}

/** Todos los tramos del rango, también los vacíos (una barra en cero también informa) */
function tramosVacios(inicio: string, fin: string, g: Granularidad): TramoSerie[] {
    const tramos: TramoSerie[] = [];
    let clave = claveTramo(inicio, g);
    while (clave <= fin) {
        tramos.push({ inicio: clave, basuraKg: 0, aceiteL: 0, basuronKg: 0 });
        const d = fechaLocal(clave);
        if (g === 'dia') d.setDate(d.getDate() + 1);
        else if (g === 'semana') d.setDate(d.getDate() + 7);
        else if (g === 'mes') d.setMonth(d.getMonth() + 1);
        else d.setFullYear(d.getFullYear() + 1);
        clave = fechaTexto(d);
    }
    return tramos;
}

/**
 * Estadísticas completas de un período para la pantalla Estadísticas del recinto. Dos consultas
 * (manifiestos y basurón) cubren el período actual y el anterior; se reparten aquí.
 */
export async function getEstadisticasPeriodo(
    supabase: SupabaseClient,
    periodo: PeriodoEstadisticas
): Promise<EstadisticasPeriodo> {
    const rango = rangoEstadisticas(periodo);
    const desde = rango.anterior?.inicio ?? rango.inicio;

    const manifiestosQ = (a: number, b: number) => {
        let q = supabase
            .from('manifiestos')
            .select(
                'id, fecha_emision, estado_digitalizacion, buque_id, buque:buques(nombre_buque), residuos:manifiestos_residuos(aceite_usado, basura, filtros_aceite, filtros_diesel, filtros_aire)'
            );
        // En "todo" no se filtra por fecha: los manifiestos sin fecha también cuentan en los totales
        if (desde) q = q.gte('fecha_emision', desde).lte('fecha_emision', rango.fin);
        return q.order('id').range(a, b);
    };
    const basuronQ = (a: number, b: number) => {
        let q = supabase.from('manifiesto_basuron').select('id, fecha, total_depositado');
        if (desde) q = q.gte('fecha', desde).lte('fecha', rango.fin);
        return q.order('id').range(a, b);
    };

    // Recolecciones: sólo las del período actual (no hace falta el anterior)
    const recoleccionesQ = (a: number, b: number) => {
        let q = supabase.from('recolecciones').select('id, fecha, tipo, cantidad, asociacion:asociaciones_recolectoras(nombre_asociacion)');
        if (rango.inicio) q = q.gte('fecha', rango.inicio).lte('fecha', rango.fin);
        return q.order('id').range(a, b);
    };

    const [manifiestos, basuron, registradas, activas, recolecciones, inventario] = await Promise.all([
        traerTodas(manifiestosQ) as Promise<FilaManifiesto[]>,
        traerTodas(basuronQ) as Promise<FilaBasuron[]>,
        supabase.from('buques').select('id', { count: 'exact', head: true }),
        supabase.from('buques').select('id', { count: 'exact', head: true }).eq('estado', 'Activo'),
        traerTodas(recoleccionesQ) as Promise<FilaRecoleccion[]>,
        // Una fila por tipo de residuo: son pocas
        supabase.from('inventario_residuos').select('tipo, cantidad'),
    ]);

    const enRango = (f: string | null, r: { inicio: string; fin: string }) => !!f && f >= r.inicio && f <= r.fin;
    const actualR = rango.inicio ? { inicio: rango.inicio, fin: rango.fin } : null;
    const mActual = actualR ? manifiestos.filter((m) => enRango(m.fecha_emision, actualR)) : manifiestos;
    const bActual = actualR ? basuron.filter((b) => enRango(b.fecha, actualR)) : basuron;
    const anterior = rango.anterior
        ? sumarTotales(
              manifiestos.filter((m) => enRango(m.fecha_emision, rango.anterior!)),
              basuron.filter((b) => enRango(b.fecha, rango.anterior!))
          )
        : null;

    // En "todo" la gráfica empieza en el año del primer registro
    const fechas = [...mActual.map((m) => m.fecha_emision), ...bActual.map((b) => b.fecha)].filter((f): f is string => !!f).sort();
    const inicio = rango.inicio ?? fechas[0] ?? '';
    const serie = inicio ? tramosVacios(inicio, rango.fin, rango.granularidad) : [];
    const porClave = new Map(serie.map((t) => [t.inicio, t]));
    for (const m of mActual) {
        const t = m.fecha_emision && porClave.get(claveTramo(m.fecha_emision, rango.granularidad));
        if (!t) continue;
        const r = residuosDe(m);
        t.basuraKg += r.basura;
        t.aceiteL += r.aceite;
    }
    for (const b of bActual) {
        const t = b.fecha && porClave.get(claveTramo(b.fecha, rango.granularidad));
        if (t) t.basuronKg += num(b.total_depositado);
    }

    const porBuque = new Map<number, EmbarcacionDelPeriodo>();
    for (const m of mActual) {
        if (m.buque_id == null) continue;
        const nombre = comoLista(m.buque)[0]?.nombre_buque || 'Sin nombre';
        const e = porBuque.get(m.buque_id) ?? { buqueId: m.buque_id, nombre, entregas: 0, basuraKg: 0, aceiteL: 0 };
        const r = residuosDe(m);
        e.entregas++;
        e.basuraKg += r.basura;
        e.aceiteL += r.aceite;
        porBuque.set(m.buque_id, e);
    }
    const embarcaciones = [...porBuque.values()]
        .sort((a, b) => b.entregas - a.entregas || b.basuraKg - a.basuraKg)
        .slice(0, 5);

    const actual = sumarTotales(mActual, bActual);
    return {
        periodo,
        inicio,
        fin: rango.fin,
        granularidad: rango.granularidad,
        actual,
        anterior,
        serie,
        embarcaciones,
        flota: { activas: activas.count ?? 0, registradas: registradas.count ?? 0 },
        destino: armarDestino(actual, recolecciones, (inventario.data ?? []) as FilaInventario[]),
    };
}

// ── Embarcaciones activas sin entregar ───────────────────────────────────────

export interface EmbarcacionSinEntregar {
    buqueId: number;
    nombre: string;
    /** YYYY-MM-DD del último manifiesto; null si nunca ha entregado */
    ultimaEntrega: string | null;
    /** Días desde la última entrega; null si nunca ha entregado */
    dias: number | null;
}

export interface SinEntregar {
    /** Umbral en días (no depende del período elegido en la pantalla) */
    dias: number;
    embarcaciones: EmbarcacionSinEntregar[];
}

/**
 * Embarcaciones activas cuyo último manifiesto tiene más de `dias` días (o que nunca han
 * entregado). Primero las que nunca entregaron y luego de la más atrasada a la menos.
 */
export async function getEmbarcacionesSinEntregar(supabase: SupabaseClient, dias = 60): Promise<SinEntregar> {
    const [activas, manifiestos] = await Promise.all([
        supabase.from('buques').select('id, nombre_buque').eq('estado', 'Activo').limit(10_000),
        traerTodas((a, b) =>
            supabase.from('manifiestos').select('id, buque_id, fecha_emision').not('buque_id', 'is', null).not('fecha_emision', 'is', null).order('id').range(a, b)
        ) as Promise<{ buque_id: number; fecha_emision: string }[]>,
    ]);
    if (activas.error) throw activas.error;

    const ultima = new Map<number, string>();
    for (const m of manifiestos) {
        const previa = ultima.get(m.buque_id);
        if (!previa || m.fecha_emision > previa) ultima.set(m.buque_id, m.fecha_emision);
    }
    const hoy = fechaLocal(fechaTexto(new Date())).getTime();
    const lista: EmbarcacionSinEntregar[] = (activas.data ?? []).map((b) => {
        const u = ultima.get(b.id) ?? null;
        return {
            buqueId: b.id,
            nombre: b.nombre_buque || 'Sin nombre',
            ultimaEntrega: u,
            dias: u ? Math.round((hoy - fechaLocal(u).getTime()) / 86_400_000) : null,
        };
    });
    return {
        dias,
        embarcaciones: lista
            .filter((e) => e.dias === null || e.dias > dias)
            .sort((a, b) =>
                (a.dias === null) !== (b.dias === null) ? (a.dias === null ? -1 : 1) : (b.dias ?? 0) - (a.dias ?? 0) || a.nombre.localeCompare(b.nombre)
            ),
    };
}

interface FilaRecoleccion {
    id: number;
    fecha: string;
    tipo: string;
    cantidad: number | string;
    asociacion: { nombre_asociacion: string | null } | { nombre_asociacion: string | null }[] | null;
}
interface FilaInventario {
    tipo: string;
    cantidad: number | string;
}

/** Tipos del catálogo que cuentan como "materiales reciclables" (todo menos aceite y filtros, en kg) */
const TIPOS_RECICLABLES = ['plastico', 'carton', 'chatarra', 'vidrio', 'organico'];

function armarDestino(recibido: TotalesPeriodo, recolecciones: FilaRecoleccion[], inventario: FilaInventario[]): DestinoResiduos {
    const empresasDe = (filas: FilaRecoleccion[]) => {
        const porEmpresa = new Map<string, number>();
        for (const r of filas) {
            const nombre = comoLista(r.asociacion)[0]?.nombre_asociacion || 'Empresa sin nombre';
            porEmpresa.set(nombre, (porEmpresa.get(nombre) ?? 0) + num(r.cantidad));
        }
        return [...porEmpresa.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
    };
    const suma = (filas: { cantidad: number | string }[]) => filas.reduce((s, f) => s + num(f.cantidad), 0);
    const recDe = (tipos: string[]) => recolecciones.filter((r) => tipos.includes(r.tipo));
    const invDe = (tipos: string[]) => inventario.filter((i) => tipos.includes(i.tipo));

    const aceite = recDe(['aceite']);
    const filtros = recDe(['filtros']);
    const reciclables = recDe(TIPOS_RECICLABLES);
    return {
        aceite: { recibido: recibido.aceiteL, reciclado: suma(aceite), enAcopio: suma(invDe(['aceite'])), empresas: empresasDe(aceite) },
        filtros: {
            recibido: recibido.filtrosAceite + recibido.filtrosDiesel + recibido.filtrosAire,
            reciclado: suma(filtros),
            enAcopio: suma(invDe(['filtros'])),
            empresas: empresasDe(filtros),
        },
        reciclables: {
            reciclado: suma(reciclables),
            enAcopio: suma(invDe(TIPOS_RECICLABLES)),
            empresas: empresasDe(reciclables),
            porTipo: TIPOS_RECICLABLES.map((tipo) => ({ tipo, reciclado: suma(recDe([tipo])) })).filter((t) => t.reciclado > 0),
        },
        hayDatos: recolecciones.length > 0 || inventario.some((i) => num(i.cantidad) > 0),
    };
}

/**
 * Genera un reporte detallado usando RPC
 */
export async function getReporteComplejo(supabase: SupabaseClient, filters: ReportFilters): Promise<ReporteDetalladoItem[]> {
    // Ajustar la fecha fin para incluir todo el día (agregar un día)
    // Convertir fechas a ISO strings (UTC) preservando el inicio y fin del día local
    // Esto evita problemas de zona horaria donde registros de "ieri" (local) aparecen hoy (UTC)
    let fechaInicioISO = undefined;
    if (filters.fechaInicio) {
        // Inicio del día local: 00:00:00
        fechaInicioISO = new Date(filters.fechaInicio + 'T00:00:00').toISOString();
    }

    let fechaFinISO = undefined;
    if (filters.fechaFin) {
        // Fin del día local: 23:59:59.999
        fechaFinISO = new Date(filters.fechaFin + 'T23:59:59.999').toISOString();
    }

    const { data, error } = await supabase.rpc('get_reporte_detallado', {
        p_fecha_inicio: fechaInicioISO || null,
        p_fecha_fin: fechaFinISO || null,
        p_buque_id: filters.buqueId || null,
        p_estado: filters.estado || null
    });

    if (error) {
        console.error('Error fetching report:', error);
        throw error;
    }

    return (data || []).map((item: any) => ({
        fecha: item.fecha,
        folio: item.folio,
        buque: item.buque,
        tipoResiduo: item.tipo_residuo, // Mapeo de snake_case a camelCase
        cantidad: Number(item.cantidad),
        unidad: item.unidad,
        estado: item.estado,
        responsable: item.responsable || 'No asignado'
    }));
}

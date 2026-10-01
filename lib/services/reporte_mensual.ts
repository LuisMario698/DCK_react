import { createClient } from '@/lib/supabase/client';
import { traerTodas } from '@/lib/supabase/paginar';
import type { TipoResiduo, UnidadResiduo } from '@/lib/constants/residuos';

// ── Reporte mensual del recinto (para SEMARNAT) ──────────────────────────────
//
// Todo lo de un mes calendario: cada manifiesto con sus residuos, los recibos del basurón y lo que
// se llevaron las empresas recolectoras. Los totales nunca suman unidades distintas (kg, L, piezas)
// ni la basura de los barcos con la del basurón, que es la misma basura camino al relleno.

export interface FilaManifiestoMes {
    fecha: string;
    folio: string | null;
    embarcacion: string;
    motorista: string | null;
    basuraKg: number;
    aceiteL: number;
    /** Filtros de aceite, diésel y aire (piezas) */
    filtros: number;
}
export interface FilaBasuronMes {
    fecha: string;
    ticket: string | null;
    deQuien: string | null;
    kg: number;
}
export interface FilaRecoleccionMes {
    fecha: string;
    folio: string;
    empresa: string;
    tipo: TipoResiduo;
    cantidad: number;
    unidad: UnidadResiduo;
}
export interface ReporteMensual {
    anio: number;
    /** 1 a 12 */
    mes: number;
    /** YYYY-MM-DD */
    inicio: string;
    fin: string;
    manifiestos: FilaManifiestoMes[];
    basuron: FilaBasuronMes[];
    recolecciones: FilaRecoleccionMes[];
    totales: {
        manifiestos: number;
        embarcaciones: number;
        basuraKg: number;
        aceiteL: number;
        filtrosAceite: number;
        filtrosDiesel: number;
        filtrosAire: number;
        basuronKg: number;
        entregasBasuron: number;
    };
}

type Relacion<T> = T | T[] | null;
const uno = <T,>(r: Relacion<T>): T | null => (Array.isArray(r) ? (r[0] ?? null) : r);
const num = (v: unknown) => Number(v ?? 0) || 0;

/** Primer y último día del mes (texto YYYY-MM-DD, sin zona horaria) */
export function rangoDelMes(anio: number, mes: number) {
    const dosCifras = (n: number) => String(n).padStart(2, '0');
    const ultimoDia = new Date(anio, mes, 0).getDate();
    return { inicio: `${anio}-${dosCifras(mes)}-01`, fin: `${anio}-${dosCifras(mes)}-${dosCifras(ultimoDia)}` };
}

export async function getReporteMensual(anio: number, mes: number): Promise<ReporteMensual> {
    const supabase = createClient();
    const { inicio, fin } = rangoDelMes(anio, mes);

    type FilaM = {
        numero_manifiesto: string | null;
        fecha_emision: string;
        buque_id: number | null;
        buque: Relacion<{ nombre_buque: string | null }>;
        responsable_principal: Relacion<{ nombre: string | null }>;
        residuos: Relacion<{ basura: unknown; aceite_usado: unknown; filtros_aceite: unknown; filtros_diesel: unknown; filtros_aire: unknown }>;
    };
    type FilaB = { fecha: string; numero_ticket: string | null; recibimos_de: string | null; total_depositado: unknown; buque: Relacion<{ nombre_buque: string | null }> };
    type FilaR = { fecha: string; folio: string; tipo: TipoResiduo; cantidad: unknown; unidad: UnidadResiduo; asociacion: Relacion<{ nombre_asociacion: string | null }> };

    const [man, bas, rec] = await Promise.all([
        traerTodas((a, b) =>
            supabase
                .from('manifiestos')
                .select(
                    'numero_manifiesto, fecha_emision, buque_id, buque:buques(nombre_buque), responsable_principal:responsable_principal_id(nombre), residuos:manifiestos_residuos(basura, aceite_usado, filtros_aceite, filtros_diesel, filtros_aire)'
                )
                .gte('fecha_emision', inicio)
                .lte('fecha_emision', fin)
                .order('fecha_emision')
                .order('id')
                .range(a, b)
        ) as Promise<FilaM[]>,
        traerTodas((a, b) =>
            supabase
                .from('manifiesto_basuron')
                .select('fecha, numero_ticket, recibimos_de, total_depositado, buque:buque_id(nombre_buque)')
                .gte('fecha', inicio)
                .lte('fecha', fin)
                .order('fecha')
                .order('id')
                .range(a, b)
        ) as Promise<FilaB[]>,
        traerTodas((a, b) =>
            supabase
                .from('recolecciones')
                .select('fecha, folio, tipo, cantidad, unidad, asociacion:asociaciones_recolectoras(nombre_asociacion)')
                .gte('fecha', inicio)
                .lte('fecha', fin)
                .order('fecha')
                .order('id')
                .range(a, b)
        ) as Promise<FilaR[]>,
    ]);

    const t = { manifiestos: man.length, embarcaciones: 0, basuraKg: 0, aceiteL: 0, filtrosAceite: 0, filtrosDiesel: 0, filtrosAire: 0, basuronKg: 0, entregasBasuron: bas.length };
    const barcos = new Set<number>();
    const manifiestos = man.map((m): FilaManifiestoMes => {
        const r = uno(m.residuos);
        const fila = {
            fecha: m.fecha_emision,
            folio: m.numero_manifiesto,
            embarcacion: uno(m.buque)?.nombre_buque || 'Sin embarcación',
            motorista: uno(m.responsable_principal)?.nombre || null,
            basuraKg: num(r?.basura),
            aceiteL: num(r?.aceite_usado),
            filtros: num(r?.filtros_aceite) + num(r?.filtros_diesel) + num(r?.filtros_aire),
        };
        t.basuraKg += fila.basuraKg;
        t.aceiteL += fila.aceiteL;
        t.filtrosAceite += num(r?.filtros_aceite);
        t.filtrosDiesel += num(r?.filtros_diesel);
        t.filtrosAire += num(r?.filtros_aire);
        if (m.buque_id != null) barcos.add(m.buque_id);
        return fila;
    });
    t.embarcaciones = barcos.size;

    const basuron = bas.map((b): FilaBasuronMes => {
        const kg = num(b.total_depositado);
        t.basuronKg += kg;
        return { fecha: b.fecha, ticket: b.numero_ticket, deQuien: b.recibimos_de?.trim() || uno(b.buque)?.nombre_buque || null, kg };
    });

    const recolecciones = rec.map((r): FilaRecoleccionMes => ({
        fecha: r.fecha,
        folio: r.folio,
        empresa: uno(r.asociacion)?.nombre_asociacion || 'Empresa',
        tipo: r.tipo,
        cantidad: num(r.cantidad),
        unidad: r.unidad,
    }));

    return { anio, mes, inicio, fin, manifiestos, basuron, recolecciones, totales: t };
}

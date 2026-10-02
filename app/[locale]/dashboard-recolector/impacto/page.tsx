'use client';

/**
 * Impacto ambiental del portal de empresas: lo que la empresa recolectó en el periodo y lo que eso
 * ayudó a evitar. Cada material en su unidad (nunca se suman litros con kilos): la gráfica muestra
 * uno a la vez (aceite en litros, reciclables en kilos o filtros en piezas) y empieza por el que la
 * empresa sí recolecta. El impacto usa la misma tarjeta y las mismas cuentas que Estadísticas del
 * recinto y la landing (components/ui/ImpactoEquivalencias.tsx, lib/utils/equivalencias.ts).
 */
import { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, PieChart, Pie, Cell } from 'recharts';
import { Leaf, Droplets, Package, Truck } from 'lucide-react';
import { TIPO_RESIDUO_HEX, TIPO_RESIDUO_LABEL, formatCantidad, unidadEscrita, type TipoResiduo, type UnidadResiduo } from '@/lib/constants/residuos';
import { CO2E_EVITADO_POR_UNIDAD, KG_BOLSA_BASURA, KG_CO2_POR_ARBOL_ANIO, LITROS_AGUA_POR_LITRO_ACEITE, co2eEvitadoKg } from '@/lib/constants/impacto';
import { aguaProtegidaL, equivalenciaAgua, equivalenciaBasura, equivalenciaCO2 } from '@/lib/utils/equivalencias';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { Recoleccion } from '@/types/database';
import { getRecolecciones } from '@/lib/services/recolecciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { Cargando, ControlSegmentado, ErrorCarga, mensajeError } from '@/components/asociaciones/ui';
import { TarjetaDato } from '@/components/ui/simar';
import { NumeroAnimado } from '@/components/ui/movimiento';
import { ImpactoEquivalencias, fmtCifra, type TarjetaImpacto } from '@/components/ui/ImpactoEquivalencias';

type Periodo = '1m' | '3m' | '6m' | '1y';

const NOMBRE_PERIODO: Record<Periodo, string> = { '1m': '1 mes', '3m': '3 meses', '6m': '6 meses', '1y': '1 año' };
const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_POR_PERIODO: Record<Exclude<Periodo, '1m'>, number> = { '3m': 3, '6m': 6, '1y': 12 };

/** Lo que muestra la gráfica, una unidad a la vez */
const MATERIAL: Record<UnidadResiduo, { texto: string; titulo: string; punto: string }> = {
    L: { texto: 'Aceite', titulo: 'Aceite usado recolectado, en litros', punto: 'bg-[#C2410C]' },
    kg: { texto: 'Reciclables', titulo: 'Reciclables recolectados, en kilos', punto: 'bg-simar-violeta' },
    pz: { texto: 'Filtros', titulo: 'Filtros recolectados, en piezas', punto: 'bg-simar-texto-2' },
};
const UNIDADES: UnidadResiduo[] = ['L', 'kg', 'pz'];

interface Bucket {
    etiqueta: string;
    desde: Date;
    hasta: Date; // exclusivo
}

/** Cortes de tiempo del periodo actual (semanas para 1m, meses para el resto). */
function cortes(periodo: Periodo, hoy: Date): Bucket[] {
    if (periodo === '1m') {
        const fin = new Date(hoy.getFullYear(), hoy.getMonth(), hoy.getDate() + 1);
        return [3, 2, 1, 0].map((i, idx) => ({
            etiqueta: `Sem ${idx + 1}`,
            desde: new Date(fin.getTime() - (i + 1) * 7 * 86400000),
            hasta: new Date(fin.getTime() - i * 7 * 86400000),
        }));
    }
    const n = MESES_POR_PERIODO[periodo];
    return Array.from({ length: n }, (_, idx) => {
        const offset = n - 1 - idx;
        const desde = new Date(hoy.getFullYear(), hoy.getMonth() - offset, 1);
        const hasta = new Date(hoy.getFullYear(), hoy.getMonth() - offset + 1, 1);
        return { etiqueta: MESES_CORTOS[desde.getMonth()], desde, hasta };
    });
}

function desplazar(b: Bucket, periodo: Periodo): Bucket {
    if (periodo === '1m') {
        const ms = 28 * 86400000;
        return { ...b, desde: new Date(b.desde.getTime() - ms), hasta: new Date(b.hasta.getTime() - ms) };
    }
    const n = MESES_POR_PERIODO[periodo];
    return {
        ...b,
        desde: new Date(b.desde.getFullYear(), b.desde.getMonth() - n, 1),
        hasta: new Date(b.hasta.getFullYear(), b.hasta.getMonth() - n, 1),
    };
}

function dentro(r: Recoleccion, desde: Date, hasta: Date) {
    const f = parseFechaLocal(r.fecha);
    return f >= desde && f < hasta;
}

const sumar = (recs: Recoleccion[], u: UnidadResiduo) => recs.filter((r) => r.unidad === u).reduce((s, r) => s + r.cantidad, 0);

function resumen(recs: Recoleccion[]) {
    return {
        co2: recs.reduce((s, r) => s + co2eEvitadoKg(r.tipo, r.cantidad), 0),
        kg: sumar(recs, 'kg'),
        litros: sumar(recs, 'L'),
        // El agua sólo la protege el aceite
        aceiteL: recs.filter((r) => r.tipo === 'aceite').reduce((s, r) => s + r.cantidad, 0),
        recolecciones: recs.length,
    };
}

/** % de cambio; 'nuevo' si antes no había nada y 'sin_datos' si no hay nada en ningún periodo. */
function delta(actual: number, anterior: number): number | 'nuevo' | 'sin_datos' {
    if (anterior === 0) return actual > 0 ? 'nuevo' : 'sin_datos';
    return Math.round(((actual - anterior) / anterior) * 100);
}

// Colores de la gráfica con los tokens SiMAR (cambian solos en modo oscuro):
// periodo actual = arrecife (verde, línea continua); anterior = marea (azul, punteada).
const COLOR_ACTUAL = 'var(--simar-arrecife)';
const COLOR_ANTERIOR = 'var(--simar-marea-tinta)';

/** Globo oscuro (DISEÑO_SIMAR.md → globos): texto blanco; el color va en la muestra de línea. */
function CustomTooltip({
    active,
    payload,
    label,
    unidad,
}: {
    active?: boolean;
    payload?: { dataKey: string; name: string; value: number; color: string }[];
    label?: string;
    unidad: UnidadResiduo;
}) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-simar-abismo text-white text-base rounded-2xl shadow-simar px-4 py-3 border border-white/10 min-w-[190px]">
            <p className="font-bold text-white mb-2">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} className="flex items-center justify-between gap-4">
                    <span className="flex items-center gap-2 text-white/80">
                        <MuestraLinea punteada={p.dataKey === 'anterior'} color={p.dataKey === 'anterior' ? '#8AB4F8' : '#5FD6A8'} />
                        {p.name}
                    </span>
                    <span className="font-bold">
                        {formatCantidad(p.value)} {unidadEscrita(unidad, p.value)}
                    </span>
                </p>
            ))}
        </div>
    );
}

/** Muestra de la leyenda dibujada igual que la línea de la gráfica (continua o punteada). */
function MuestraLinea({ color, punteada = false }: { color: string; punteada?: boolean }) {
    return (
        <svg aria-hidden="true" width="28" height="10" viewBox="0 0 28 10" className="flex-shrink-0">
            <line x1="1" y1="5" x2="27" y2="5" stroke={color} strokeWidth={3} strokeLinecap="round" strokeDasharray={punteada ? '5 4' : undefined} />
        </svg>
    );
}

export default function ImpactoPage() {
    const [periodo, setPeriodo] = useState<Periodo>('6m');
    const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    // null: la primera unidad que la empresa haya recolectado
    const [unidadElegida, setUnidadElegida] = useState<UnidadResiduo | null>(null);
    const asociacionId = useRecolector().asociacion?.id;

    useEffect(() => {
        if (!asociacionId) return;
        getRecolecciones(asociacionId)
            .then(setRecolecciones)
            .catch((err) => setError(mensajeError(err, 'No se pudieron cargar tus recolecciones.')))
            .finally(() => setCargando(false));
    }, [asociacionId]);

    // Las unidades que la empresa ha recolectado alguna vez (en el orden aceite, reciclables, filtros)
    const unidades = UNIDADES.filter((u) => recolecciones.some((r) => r.unidad === u));
    const unidad: UnidadResiduo = unidadElegida ?? unidades[0] ?? 'kg';

    // Sin useMemo: son pocas recolecciones y el compilador de React ya memoriza lo que haga falta
    const calculo = (() => {
        const hoy = new Date();
        const actuales = cortes(periodo, hoy);
        const anteriores = actuales.map((b) => desplazar(b, periodo));
        const inicio = actuales[0].desde;
        const fin = actuales[actuales.length - 1].hasta;
        const inicioAnt = anteriores[0].desde;

        const enPeriodo = recolecciones.filter((r) => dentro(r, inicio, fin));
        const enAnterior = recolecciones.filter((r) => dentro(r, inicioAnt, inicio));

        const serie = actuales.map((b, i) => ({
            mes: b.etiqueta,
            actual: sumar(recolecciones.filter((r) => dentro(r, b.desde, b.hasta)), unidad),
            anterior: sumar(recolecciones.filter((r) => dentro(r, anteriores[i].desde, anteriores[i].hasta)), unidad),
        }));

        const porTipo = new Map<TipoResiduo, { cantidad: number; unidad: UnidadResiduo }>();
        enPeriodo.forEach((r) => {
            const t = porTipo.get(r.tipo) ?? { cantidad: 0, unidad: r.unidad };
            t.cantidad += r.cantidad;
            porTipo.set(r.tipo, t);
        });
        const composicion = [...porTipo.entries()].map(([tipo, v]) => ({ tipo, ...v }));
        const totalKg = composicion.filter((c) => c.unidad === 'kg').reduce((s, c) => s + c.cantidad, 0);

        return {
            actual: resumen(enPeriodo),
            anterior: resumen(enAnterior),
            serie,
            composicion,
            donut: composicion
                .filter((c) => c.unidad === 'kg' && c.cantidad > 0)
                .map((c) => ({ tipo: c.tipo, pct: totalKg ? Math.round((c.cantidad / totalKg) * 100) : 0 })),
        };
    })();

    if (cargando) return <Cargando texto="Calculando impacto…" />;

    const { actual, anterior, serie, composicion, donut } = calculo;
    const cards = [
        { label: 'CO₂e evitado (estimado)', value: <><NumeroAnimado valor={Math.round(actual.co2)} /> kg</>, d: delta(actual.co2, anterior.co2), Icon: Leaf, tono: 'arrecife' as const },
        { label: 'Aceite usado recolectado', value: <><NumeroAnimado valor={actual.litros} /> L</>, d: delta(actual.litros, anterior.litros), Icon: Droplets, tono: 'coral' as const },
        { label: 'Reciclables recolectados', value: <><NumeroAnimado valor={actual.kg} /> kg</>, d: delta(actual.kg, anterior.kg), Icon: Package, tono: 'violeta' as const },
        { label: 'Recolecciones', value: <NumeroAnimado valor={actual.recolecciones} />, d: delta(actual.recolecciones, anterior.recolecciones), Icon: Truck, tono: 'marea' as const },
    ];

    // Lo que el periodo ayudó a evitar: las mismas equivalencias que el recinto
    const agua = aguaProtegidaL(actual.aceiteL);
    const reciclado = equivalenciaBasura(actual.kg);
    const tarjetas = [
        { eq: equivalenciaAgua(agua), dato: `${fmtCifra(agua, 'L')} de agua` },
        { eq: equivalenciaCO2(actual.co2), dato: `${fmtCifra(actual.co2, 'kg')} de CO₂e` },
        // Para la empresa, los kilos son material que se recicló en vez de ir al relleno
        { eq: reciclado && { ...reciclado, descripcion: reciclado.descripcion.replace(/que no terminó en el mar|que no terminaron en el mar/, 'que se reciclaron en vez de ir al relleno') }, dato: `${fmtCifra(actual.kg, 'kg')} de material reciclable` },
    ].filter((t): t is TarjetaImpacto => !!t.eq);

    const factores = (Object.entries(CO2E_EVITADO_POR_UNIDAD) as [TipoResiduo, number][])
        .filter(([, f]) => f > 0)
        .map(([t, f]) => `${TIPO_RESIDUO_LABEL[t].toLowerCase()} ${f.toLocaleString('es-MX')}`)
        .join(', ');

    return (
        <div className="space-y-5 movil:space-y-3">
            {error && <ErrorCarga mensaje={error} />}

            {/* Filtro de periodo (el título ya está en la barra de arriba). En celular, el control segmentado
                de los filtros (el azul relleno queda para la sección activa de la barra) */}
            <div className="simar-aparece flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 movil:gap-2">
                <p className="text-lg text-simar-texto-2 movil:text-[14px]">Calculado a partir de tus recolecciones completadas.</p>
                {/* Sobre una tarjeta: su canal gris no se ve directo en el fondo de la página */}
                <div className="hidden movil:block bg-simar-superficie border border-simar-borde rounded-[18px] p-1.5 shadow-simar">
                    <ControlSegmentado
                        etiqueta="Periodo"
                        valor={periodo}
                        onCambiar={setPeriodo}
                        opciones={(['1m', '3m', '6m', '1y'] as Periodo[]).map((p) => ({ valor: p, texto: NOMBRE_PERIODO[p] }))}
                    />
                </div>
                <div role="group" aria-label="Periodo" className="inline-flex flex-wrap items-center gap-1 bg-simar-superficie border border-simar-borde shadow-simar rounded-2xl p-1.5 movil:hidden">
                    {(['1m', '3m', '6m', '1y'] as Periodo[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriodo(p)}
                            aria-pressed={periodo === p}
                            className={`min-h-[44px] px-4 rounded-xl text-base font-bold transition-colors ${
                                periodo === p ? 'bg-simar-marea text-white' : 'text-simar-texto-2 hover:text-simar-texto hover:bg-simar-papel'
                            }`}
                        >
                            {NOMBRE_PERIODO[p]}
                        </button>
                    ))}
                </div>
            </div>

            {/* Datos del periodo: formato común (TarjetaDato) con la comparación debajo (en celular, dos por fila) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4 movil:grid-cols-2 movil:gap-2.5">
                {cards.map((c, i) => (
                    <TarjetaDato
                        key={c.label}
                        apilada
                        etiqueta={c.label}
                        valor={c.value}
                        icono={c.Icon}
                        tono={c.tono}
                        className="simar-aparece"
                        style={{ animationDelay: `${0.04 + i * 0.04}s` }}
                        detalle={
                            c.d === 'sin_datos' ? (
                                'Sin datos en este periodo'
                            ) : (
                                <span className="flex flex-wrap items-center gap-x-1">
                                    <span className={`font-bold ${typeof c.d === 'number' && c.d < 0 ? 'text-simar-coral' : 'text-simar-arrecife-tinta'}`}>
                                        {c.d === 'nuevo' ? 'Nuevo' : `${c.d >= 0 ? '↑ +' : '↓ '}${c.d}%`}
                                    </span>
                                    vs. periodo anterior
                                </span>
                            )
                        }
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5 movil:gap-3">
                {/* Tendencia: un material a la vez, cada uno en su unidad */}
                <div className="simar-aparece lg:col-span-2 bg-simar-superficie border border-simar-borde rounded-[28px] p-5 sm:p-6 shadow-simar movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.2s' }}>
                    <div className="flex flex-wrap items-start justify-between gap-3 mb-5 movil:mb-3">
                        <div className="min-w-0">
                            <h3 className="text-[21px] font-extrabold leading-tight text-simar-texto movil:text-[17px]">{MATERIAL[unidad].titulo}</h3>
                            <p className="text-base text-simar-texto-2 movil:text-[14px]">
                                Por {periodo === '1m' ? 'semana' : 'mes'}: este periodo y el anterior
                            </p>
                        </div>
                        {unidades.length > 1 && (
                            <div role="group" aria-label="Material que muestra la gráfica" className="grid gap-1 p-1 rounded-[16px] bg-simar-papel w-full sm:w-auto movil:rounded-[14px]" style={{ gridTemplateColumns: `repeat(${unidades.length}, minmax(0, 1fr))` }}>
                                {unidades.map((u) => (
                                    <button
                                        key={u}
                                        type="button"
                                        onClick={() => setUnidadElegida(u)}
                                        aria-pressed={unidad === u}
                                        className={`simar-presiona min-h-[46px] px-3.5 rounded-[12px] inline-flex items-center justify-center gap-2 text-base font-bold transition-colors movil:min-h-[40px] movil:px-2 movil:gap-1.5 movil:text-[14px] movil:rounded-[11px] ${
                                            unidad === u ? 'bg-simar-superficie text-simar-texto shadow-simar' : 'text-simar-texto-2 hover:text-simar-texto'
                                        }`}
                                    >
                                        <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${MATERIAL[u].punto}`} />
                                        {MATERIAL[u].texto}
                                    </button>
                                ))}
                            </div>
                        )}
                    </div>
                    {serie.every((p) => p.actual === 0 && p.anterior === 0) ? (
                        <p className="h-56 flex items-center justify-center rounded-2xl bg-simar-papel px-6 text-center text-[17px] text-simar-texto-2 movil:h-40 movil:text-[14px]">
                            Sin recolecciones de {MATERIAL[unidad].texto.toLowerCase()} en este periodo ni en el anterior.
                        </p>
                    ) : (
                        <>
                            <div className="h-80 movil:h-56">
                                <ResponsiveContainer width="100%" height="100%">
                                    <AreaChart data={serie} margin={{ top: 8, right: 12, left: -4, bottom: 0 }}>
                                        <defs>
                                            <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                                <stop offset="5%" stopColor={COLOR_ACTUAL} stopOpacity={0.28} />
                                                <stop offset="95%" stopColor={COLOR_ACTUAL} stopOpacity={0.0} />
                                            </linearGradient>
                                        </defs>
                                        <CartesianGrid strokeDasharray="4 4" stroke="var(--simar-borde)" vertical />
                                        <XAxis dataKey="mes" tick={{ fontSize: 15, fill: 'var(--simar-texto-2)' }} axisLine={{ stroke: 'var(--simar-borde)' }} tickLine={false} tickMargin={8} />
                                        <YAxis tick={{ fontSize: 15, fill: 'var(--simar-texto-2)' }} axisLine={false} tickLine={false} allowDecimals={false} width={48} />
                                        <Tooltip content={<CustomTooltip unidad={unidad} />} cursor={{ stroke: 'var(--simar-campo-borde)', strokeWidth: 1 }} />
                                        <Area type="monotone" dataKey="anterior" name="Periodo anterior" stroke={COLOR_ANTERIOR} strokeWidth={2.5} strokeDasharray="6 5" fill="none" dot={false} />
                                        <Area type="monotone" dataKey="actual" name="Periodo actual" stroke={COLOR_ACTUAL} strokeWidth={3} fill="url(#gradActual)" dot={false} />
                                    </AreaChart>
                                </ResponsiveContainer>
                            </div>
                            {/* Leyenda dibujada igual que las líneas */}
                            <div className="flex flex-wrap items-center gap-x-7 gap-y-2 mt-4 justify-center">
                                <span className="flex items-center gap-2.5 text-base text-simar-texto-2">
                                    <MuestraLinea color={COLOR_ACTUAL} /> Periodo actual
                                </span>
                                <span className="flex items-center gap-2.5 text-base text-simar-texto-2">
                                    <MuestraLinea color={COLOR_ANTERIOR} punteada /> Periodo anterior
                                </span>
                            </div>
                        </>
                    )}
                </div>

                {/* Composición: cada material con su cantidad y su unidad (la dona, sólo lo que va en kilos) */}
                <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] p-5 sm:p-6 shadow-simar movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.26s' }}>
                    <h3 className="text-[21px] font-extrabold text-simar-texto mb-4 movil:text-[17px] movil:mb-3">Lo que recolectaste</h3>
                    {composicion.length === 0 ? (
                        <p className="text-base text-simar-texto-2 py-6 text-center">Sin recolecciones en este periodo.</p>
                    ) : (
                        <>
                            {donut.length > 1 && (
                                <div className="flex justify-center mb-4">
                                    <div className="h-36 w-36">
                                        <ResponsiveContainer width="100%" height="100%">
                                            <PieChart>
                                                <Pie data={donut} dataKey="pct" nameKey="tipo" innerRadius={42} outerRadius={68} paddingAngle={3} strokeWidth={0}>
                                                    {donut.map((e) => (
                                                        <Cell key={e.tipo} fill={TIPO_RESIDUO_HEX[e.tipo]} />
                                                    ))}
                                                </Pie>
                                            </PieChart>
                                        </ResponsiveContainer>
                                    </div>
                                </div>
                            )}
                            <ul className="divide-y divide-simar-borde-suave">
                                {composicion.map((e) => (
                                    <li key={e.tipo} className="flex items-center justify-between gap-3 py-2.5 text-[17px] movil:text-[15px]">
                                        <span className="flex items-center gap-2.5 text-simar-texto">
                                            <span className="w-3.5 h-3.5 rounded-full flex-shrink-0" style={{ background: TIPO_RESIDUO_HEX[e.tipo] }} />
                                            {TIPO_RESIDUO_LABEL[e.tipo]}
                                        </span>
                                        <span className="font-extrabold text-simar-texto whitespace-nowrap">
                                            {formatCantidad(e.cantidad)} {unidadEscrita(e.unidad, e.cantidad)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        </>
                    )}
                </div>
            </div>

            <ImpactoEquivalencias
                subtitulo="Lo que tus recolecciones del periodo ayudaron a evitar, en cosas conocidas"
                tarjetas={tarjetas}
                vacio="Sin recolecciones en este periodo: todavía no hay impacto que calcular."
                style={{ animationDelay: '0.32s' }}
                calculo={[
                    <>Agua: cada litro de aceite usado que recolectas evita contaminar {LITROS_AGUA_POR_LITRO_ACEITE.toLocaleString('es-MX')} L de agua.</>,
                    <>
                        CO₂e: cada material tiene su factor por kilo o por litro ({factores}). Un árbol absorbe unos {KG_CO2_POR_ARBOL_ANIO} kg de CO₂ al año.
                    </>,
                    <>Reciclables: los kilos que te llevaste para reciclar en lugar de que fueran al relleno. Una bolsa de basura grande llena pesa unos {KG_BOLSA_BASURA} kg.</>,
                ]}
            />
        </div>
    );
}

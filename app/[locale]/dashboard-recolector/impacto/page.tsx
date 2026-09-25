'use client';

import { useEffect, useMemo, useState } from 'react';
import {
    AreaChart,
    Area,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
    PieChart,
    Pie,
    Cell,
} from 'recharts';
import { Leaf, Droplets, Package, TreeDeciduous, Truck, Info } from 'lucide-react';
import { TIPO_RESIDUO_HEX, TIPO_RESIDUO_LABEL, formatCantidad, type TipoResiduo } from '@/lib/constants/residuos';
import { KG_CO2_POR_ARBOL_ANIO, co2eEvitadoKg } from '@/lib/constants/impacto';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { Recoleccion } from '@/types/database';
import { getRecolecciones } from '@/lib/services/recolecciones';
import { Cargando, ErrorCarga, mensajeError } from '@/components/asociaciones/ui';

type Periodo = '1m' | '3m' | '6m' | '1y';

const MESES_CORTOS = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const MESES_POR_PERIODO: Record<Exclude<Periodo, '1m'>, number> = { '3m': 3, '6m': 6, '1y': 12 };

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

function resumen(recs: Recoleccion[]) {
    return {
        co2: recs.reduce((s, r) => s + co2eEvitadoKg(r.tipo, r.cantidad), 0),
        kg: recs.filter((r) => r.unidad === 'kg').reduce((s, r) => s + r.cantidad, 0),
        litros: recs.filter((r) => r.unidad === 'L').reduce((s, r) => s + r.cantidad, 0),
        recolecciones: recs.length,
    };
}

/** % de cambio; 'nuevo' si antes no había nada y 'sin_datos' si no hay nada en ningún periodo. */
function delta(actual: number, anterior: number): number | 'nuevo' | 'sin_datos' {
    if (anterior === 0) return actual > 0 ? 'nuevo' : 'sin_datos';
    return Math.round(((actual - anterior) / anterior) * 100);
}

function CustomTooltip({ active, payload, label }: { active?: boolean; payload?: { dataKey: string; name: string; value: number; color: string }[]; label?: string }) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-xl shadow-xl px-4 py-3 border border-white/10 min-w-[160px]">
            <p className="font-bold text-white mb-2">{label}</p>
            {payload.map((p) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                    {p.name}: <span className="text-white">{formatCantidad(p.value)} kg</span>
                </p>
            ))}
        </div>
    );
}

export default function ImpactoPage() {
    const [periodo, setPeriodo] = useState<Periodo>('6m');
    const [recolecciones, setRecolecciones] = useState<Recoleccion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        getRecolecciones()
            .then(setRecolecciones)
            .catch((err) => setError(mensajeError(err, 'No se pudieron cargar tus recolecciones.')))
            .finally(() => setCargando(false));
    }, []);

    const calculo = useMemo(() => {
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
            actual: resumen(recolecciones.filter((r) => dentro(r, b.desde, b.hasta))).kg,
            anterior: resumen(recolecciones.filter((r) => dentro(r, anteriores[i].desde, anteriores[i].hasta))).kg,
        }));

        const porTipo = new Map<TipoResiduo, { cantidad: number; unidad: string }>();
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
    }, [recolecciones, periodo]);

    if (cargando) return <Cargando texto="Calculando impacto…" />;

    const { actual, anterior, serie, composicion, donut } = calculo;
    const cards = [
        { label: 'CO₂e evitado (estimado)', value: `${formatCantidad(Math.round(actual.co2))} kg`, d: delta(actual.co2, anterior.co2), Icon: Leaf, bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', ic: 'text-emerald-500' },
        { label: 'Material sólido recolectado', value: `${formatCantidad(actual.kg)} kg`, d: delta(actual.kg, anterior.kg), Icon: Package, bg: 'bg-purple-500/10 dark:bg-purple-500/20', ic: 'text-purple-400' },
        { label: 'Aceite usado recolectado', value: `${formatCantidad(actual.litros)} L`, d: delta(actual.litros, anterior.litros), Icon: Droplets, bg: 'bg-amber-500/10 dark:bg-amber-500/20', ic: 'text-amber-400' },
        { label: 'Recolecciones', value: String(actual.recolecciones), d: delta(actual.recolecciones, anterior.recolecciones), Icon: Truck, bg: 'bg-blue-500/10 dark:bg-blue-500/20', ic: 'text-blue-400' },
    ];

    return (
        <div className="space-y-5">
            {error && <ErrorCarga mensaje={error} />}

            {/* Header + filtro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Impacto ambiental</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Calculado a partir de tus recolecciones completadas.
                    </p>
                </div>
                <div className="inline-flex items-center gap-1 bg-gray-100 dark:bg-gray-800 rounded-xl p-1">
                    {(['1m', '3m', '6m', '1y'] as Periodo[]).map((p) => (
                        <button
                            key={p}
                            onClick={() => setPeriodo(p)}
                            className={`px-4 py-1.5 rounded-lg text-sm font-semibold transition-all ${
                                periodo === p
                                    ? 'bg-emerald-500 text-white shadow-sm'
                                    : 'text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
                            }`}
                        >
                            {p}
                        </button>
                    ))}
                </div>
            </div>

            {/* KPI cards */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {cards.map((c) => {
                    const Icon = c.Icon;
                    return (
                        <div key={c.label} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm">
                            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${c.bg}`}>
                                <Icon className={`w-5 h-5 ${c.ic}`} />
                            </div>
                            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{c.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.label}</p>
                            {c.d === 'sin_datos' ? (
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">Sin datos en este periodo</p>
                            ) : (
                                <p className={`text-xs font-semibold mt-2 flex items-center gap-1 ${typeof c.d === 'number' && c.d < 0 ? 'text-red-500' : 'text-emerald-600 dark:text-emerald-400'}`}>
                                    <span>{c.d === 'nuevo' ? 'Nuevo' : `${c.d >= 0 ? '↑ +' : '↓ '}${c.d}%`}</span>
                                    <span className="text-gray-400 dark:text-gray-500 font-normal">vs. periodo anterior</span>
                                </p>
                            )}
                        </div>
                    );
                })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Área */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                        Material sólido recolectado (kg): periodo actual vs. anterior
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={serie} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                                    </linearGradient>
                                    <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                                <XAxis dataKey="mes" tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} />
                                <YAxis tick={{ fontSize: 11, fill: '#94a3b8' }} axisLine={false} tickLine={false} allowDecimals={false} />
                                <Tooltip content={<CustomTooltip />} />
                                <Area type="monotone" dataKey="anterior" name="Periodo anterior" stroke="#3b82f6" strokeWidth={2} fill="url(#gradAnterior)" dot={false} />
                                <Area type="monotone" dataKey="actual" name="Periodo actual" stroke="#10b981" strokeWidth={2.5} fill="url(#gradActual)" dot={false} />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    <div className="flex items-center gap-5 mt-3 justify-center">
                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-sm bg-emerald-500" /> Periodo actual
                        </span>
                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-sm bg-blue-400" /> Periodo anterior
                        </span>
                    </div>
                </div>

                <div className="space-y-4">
                    {/* Composición */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Composición de materiales</h3>
                        {composicion.length === 0 ? (
                            <p className="text-sm text-gray-400 py-6 text-center">Sin recolecciones en este periodo.</p>
                        ) : (
                            <>
                                {donut.length > 0 && (
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
                                <ul className="space-y-2">
                                    {composicion.map((e) => (
                                        <li key={e.tipo} className="flex items-center justify-between text-sm">
                                            <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                                <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: TIPO_RESIDUO_HEX[e.tipo] }} />
                                                {TIPO_RESIDUO_LABEL[e.tipo]}
                                            </span>
                                            <span className="font-bold text-gray-900 dark:text-white">
                                                {formatCantidad(e.cantidad)} {e.unidad}
                                            </span>
                                        </li>
                                    ))}
                                </ul>
                            </>
                        )}
                    </div>

                    {/* Equivalencia */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">Equivalencia ecológica</h3>
                        <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 bg-emerald-500/10">
                                <TreeDeciduous className="w-5 h-5 text-emerald-500" />
                            </div>
                            <div>
                                <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                    {formatCantidad(Math.round(actual.co2 / KG_CO2_POR_ARBOL_ANIO))}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">árboles absorbiendo CO₂ durante un año</p>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <p className="flex items-start gap-2 text-xs text-gray-400 dark:text-gray-500">
                <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                El CO₂e evitado es una estimación con factores de referencia por tipo de material; no sustituye un
                inventario de emisiones certificado.
            </p>
        </div>
    );
}

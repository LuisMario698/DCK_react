'use client';

import { useState } from 'react';
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
import { Leaf, Droplets, Zap, Package, TreeDeciduous, Car } from 'lucide-react';

// ─── Mock data ────────────────────────────────────────────────────────────────

type Periodo = '1m' | '3m' | '6m' | '1y';

const COMPARATIVA: Record<Periodo, { mes: string; actual: number; anterior: number }[]> = {
    '1m': [
        { mes: 'Sem 1', actual: 550, anterior: 400 },
        { mes: 'Sem 2', actual: 620, anterior: 450 },
        { mes: 'Sem 3', actual: 700, anterior: 500 },
        { mes: 'Sem 4', actual: 800, anterior: 560 },
    ],
    '3m': [
        { mes: 'Abr', actual: 1400, anterior: 1100 },
        { mes: 'May', actual: 1700, anterior: 1250 },
        { mes: 'Jun', actual: 2100, anterior: 1500 },
    ],
    '6m': [
        { mes: 'Ene', actual: 900,  anterior: 700  },
        { mes: 'Feb', actual: 1100, anterior: 900  },
        { mes: 'Mar', actual: 1800, anterior: 1300 },
        { mes: 'Abr', actual: 1900, anterior: 1400 },
        { mes: 'May', actual: 2400, anterior: 1600 },
        { mes: 'Jun', actual: 2800, anterior: 1900 },
    ],
    '1y': [
        { mes: 'Ene', actual: 700,  anterior: 500  },
        { mes: 'Feb', actual: 900,  anterior: 650  },
        { mes: 'Mar', actual: 1800, anterior: 1300 },
        { mes: 'Abr', actual: 1900, anterior: 1400 },
        { mes: 'May', actual: 2400, anterior: 1600 },
        { mes: 'Jun', actual: 2800, anterior: 1900 },
        { mes: 'Jul', actual: 3000, anterior: 2100 },
        { mes: 'Ago', actual: 3100, anterior: 2200 },
        { mes: 'Sep', actual: 3400, anterior: 2400 },
        { mes: 'Oct', actual: 3600, anterior: 2500 },
        { mes: 'Nov', actual: 3800, anterior: 2700 },
        { mes: 'Dic', actual: 4000, anterior: 2900 },
    ],
};

const KPIS: Record<Periodo, { co2: number; agua: number; energia: number; material: number }> = {
    '1m':  { co2: 2.1,  agua: 8000,  energia: 55,  material: 1900  },
    '3m':  { co2: 5.8,  agua: 21000, energia: 140, material: 5600  },
    '6m':  { co2: 11.5, agua: 45000, energia: 320, material: 11700 },
    '1y':  { co2: 22.3, agua: 88000, energia: 610, material: 23500 },
};

const DELTA: Record<Periodo, { co2: number; agua: number; energia: number; material: number }> = {
    '1m':  { co2: 18, agua: 12, energia: 8,  material: 22 },
    '3m':  { co2: 21, agua: 15, energia: 10, material: 28 },
    '6m':  { co2: 24, agua: 18, energia: 12, material: 35 },
    '1y':  { co2: 26, agua: 20, energia: 14, material: 38 },
};

const COMPOSICION = [
    { tipo: 'Plástico', pct: 45, color: '#10b981' },
    { tipo: 'Metal',    pct: 25, color: '#3b82f6' },
    { tipo: 'Cartón',   pct: 20, color: '#f59e0b' },
    { tipo: 'Vidrio',   pct: 10, color: '#a855f7' },
];

// ─── Tooltip personalizado ─────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
    if (!active || !payload?.length) return null;
    return (
        <div className="bg-gray-900 dark:bg-gray-800 text-white text-xs rounded-xl shadow-xl px-4 py-3 border border-white/10 min-w-[160px]">
            <p className="font-bold text-white mb-2">{label}</p>
            {payload.map((p: any) => (
                <p key={p.dataKey} style={{ color: p.color }} className="font-semibold">
                    {p.name}: <span className="text-white">{p.value.toLocaleString()} kg</span>
                </p>
            ))}
        </div>
    );
}

// ─── Componente principal ──────────────────────────────────────────────────

export default function ImpactoPage() {
    const [periodo, setPeriodo] = useState<Periodo>('6m');

    const kpis = KPIS[periodo];
    const delta = DELTA[periodo];
    const data  = COMPARATIVA[periodo];

    const cards = [
        { label: 'CO₂ Evitado',        value: `${kpis.co2} t`,                 d: delta.co2,      Icon: Leaf,          bg: 'bg-emerald-500/10 dark:bg-emerald-500/20', ic: 'text-emerald-500' },
        { label: 'Agua Ahorrada',       value: `${kpis.agua.toLocaleString()} L`, d: delta.agua,   Icon: Droplets,      bg: 'bg-blue-500/10 dark:bg-blue-500/20',       ic: 'text-blue-400'   },
        { label: 'Energía Conservada',  value: `${kpis.energia} kWh`,            d: delta.energia,  Icon: Zap,           bg: 'bg-amber-500/10 dark:bg-amber-500/20',     ic: 'text-amber-400'  },
        { label: 'Material Reciclado',  value: `${kpis.material.toLocaleString()} kg`, d: delta.material, Icon: Package, bg: 'bg-purple-500/10 dark:bg-purple-500/20', ic: 'text-purple-400' },
    ];

    const equivalencias = [
        { Icon: TreeDeciduous, color: 'text-emerald-500', bg: 'bg-emerald-500/10', value: '1,450', label: 'Árboles plantados' },
        { Icon: Car,           color: 'text-blue-400',    bg: 'bg-blue-500/10',    value: '34',    label: 'Autos fuera de circulación por 1 año' },
    ];

    return (
        <div className="space-y-5">
            {/* Header + filtro */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div>
                    <h2 className="text-xl font-bold text-gray-900 dark:text-white">Impacto Ambiental</h2>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                        Estadísticas dinámicas y comparativas de tu huella de carbono.
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
                        <div
                            key={c.label}
                            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4 shadow-sm"
                        >
                            <div className="flex items-center gap-3 mb-3">
                                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${c.bg}`}>
                                    <Icon className={`w-5 h-5 ${c.ic}`} />
                                </div>
                            </div>
                            <p className="text-2xl font-extrabold text-gray-900 dark:text-white leading-tight">{c.value}</p>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{c.label}</p>
                            <p className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-2 flex items-center gap-1">
                                <span>↑ +{c.d}%</span>
                                <span className="text-gray-400 dark:text-gray-500 font-normal">vs. mes anterior</span>
                            </p>
                        </div>
                    );
                })}
            </div>

            {/* Gráfica + Donut */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Área chart */}
                <div className="lg:col-span-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                        Comparativa de Reciclaje (Año Actual vs. Anterior)
                    </h3>
                    <div className="h-72">
                        <ResponsiveContainer width="100%" height="100%">
                            <AreaChart data={data} margin={{ top: 4, right: 8, left: -10, bottom: 0 }}>
                                <defs>
                                    <linearGradient id="gradActual" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#10b981" stopOpacity={0.35} />
                                        <stop offset="95%" stopColor="#10b981" stopOpacity={0.0}  />
                                    </linearGradient>
                                    <linearGradient id="gradAnterior" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="5%"  stopColor="#3b82f6" stopOpacity={0.25} />
                                        <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0}  />
                                    </linearGradient>
                                </defs>
                                <CartesianGrid strokeDasharray="3 3" stroke="rgba(148,163,184,0.15)" />
                                <XAxis
                                    dataKey="mes"
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <YAxis
                                    tick={{ fontSize: 11, fill: '#94a3b8' }}
                                    axisLine={false}
                                    tickLine={false}
                                />
                                <Tooltip content={<CustomTooltip />} />
                                <Area
                                    type="monotone"
                                    dataKey="anterior"
                                    name="Año Anterior"
                                    stroke="#3b82f6"
                                    strokeWidth={2}
                                    fill="url(#gradAnterior)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#3b82f6', strokeWidth: 0 }}
                                />
                                <Area
                                    type="monotone"
                                    dataKey="actual"
                                    name="Año Actual"
                                    stroke="#10b981"
                                    strokeWidth={2.5}
                                    fill="url(#gradActual)"
                                    dot={false}
                                    activeDot={{ r: 5, fill: '#10b981', strokeWidth: 0 }}
                                />
                            </AreaChart>
                        </ResponsiveContainer>
                    </div>
                    {/* Leyenda */}
                    <div className="flex items-center gap-5 mt-3 justify-center">
                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-sm bg-emerald-500" />
                            Año Actual
                        </span>
                        <span className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="w-3 h-3 rounded-sm bg-blue-400" />
                            Año Anterior
                        </span>
                    </div>
                </div>

                {/* Columna derecha */}
                <div className="space-y-4">
                    {/* Donut */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                            Composición de Materiales
                        </h3>
                        <div className="flex justify-center mb-4">
                            <div className="h-36 w-36">
                                <ResponsiveContainer width="100%" height="100%">
                                    <PieChart>
                                        <Pie
                                            data={COMPOSICION}
                                            dataKey="pct"
                                            nameKey="tipo"
                                            innerRadius={42}
                                            outerRadius={68}
                                            paddingAngle={3}
                                            strokeWidth={0}
                                        >
                                            {COMPOSICION.map((e) => (
                                                <Cell key={e.tipo} fill={e.color} />
                                            ))}
                                        </Pie>
                                    </PieChart>
                                </ResponsiveContainer>
                            </div>
                        </div>
                        <ul className="space-y-2">
                            {COMPOSICION.map((e) => (
                                <li key={e.tipo} className="flex items-center justify-between text-sm">
                                    <span className="flex items-center gap-2 text-gray-700 dark:text-gray-300">
                                        <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ background: e.color }} />
                                        {e.tipo}
                                    </span>
                                    <span className="font-bold text-gray-900 dark:text-white">{e.pct}%</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    {/* Equivalencias ecológicas */}
                    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 shadow-sm">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                            Equivalencias Ecológicas
                        </h3>
                        <div className="space-y-4">
                            {equivalencias.map((e) => {
                                const Icon = e.Icon;
                                return (
                                    <div key={e.label} className="flex items-center gap-3">
                                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0 ${e.bg}`}>
                                            <Icon className={`w-5 h-5 ${e.color}`} />
                                        </div>
                                        <div>
                                            <p className="text-xl font-extrabold text-gray-900 dark:text-white leading-tight">
                                                {e.value}
                                            </p>
                                            <p className="text-xs text-gray-500 dark:text-gray-400">{e.label}</p>
                                        </div>
                                    </div>
                                );
                            })}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

'use client';

import React, { useMemo, useState } from 'react';
import Image from 'next/image';
import dynamic from 'next/dynamic';
import { toast } from 'sonner';
import {
    CheckCircle2, MapPin, X, Filter, Search, Anchor,
    RefreshCw, TrendingUp, Package, Droplet, FileText, Layers,
} from 'lucide-react';
import {
    PUERTOS_MOCK,
    TIPO_RESIDUO_LABEL,
    TIPO_RESIDUO_COLOR,
    TipoResiduo,
    formatHaceMin,
} from '@/lib/mock/recolector';

// Load map with SSR disabled
const PortMap = dynamic(
    () => import('@/components/recolector/PortMap').then((m) => m.PortMap),
    {
        ssr: false,
        loading: () => (
            <div className="w-full h-full rounded-xl flex items-center justify-center bg-gray-950 border border-gray-800">
                <div className="flex flex-col items-center gap-3">
                    <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-sm text-gray-400">Cargando mapa…</span>
                </div>
            </div>
        ),
    }
);

const RESIDUO_ICONS: Record<TipoResiduo, (props: { size?: number }) => React.ReactElement> = {
    plastico: (p) => <Package {...p} />,
    aceite: (p) => <Droplet {...p} />,
    carton: (p) => <FileText {...p} />,
    chatarra: (p) => <Layers {...p} />,
    vidrio: (p) => <Package {...p} />,
    organico: (p) => <TrendingUp {...p} />,
};

const RESIDUO_ACCENT: Record<TipoResiduo, string> = {
    plastico: '#3b82f6',
    aceite: '#f59e0b',
    carton: '#10b981',
    chatarra: '#a855f7',
    vidrio: '#06b6d4',
    organico: '#84cc16',
};

export default function MapaPage() {
    const [tipoFiltro, setTipoFiltro] = useState<TipoResiduo | 'todos'>('todos');
    const [cantidadMin, setCantidadMin] = useState<number | ''>('');
    const [busqueda, setBusqueda] = useState('');
    const [selectedId, setSelectedId] = useState<string | null>(PUERTOS_MOCK[0].id);

    const puertosFiltrados = useMemo(() => {
        return PUERTOS_MOCK.filter((p) => {
            if (busqueda && !p.nombre.toLowerCase().includes(busqueda.toLowerCase())) return false;
            if (p.estado === 'sin_disponibilidad') return tipoFiltro === 'todos' && cantidadMin === '';
            const matchTipo = tipoFiltro === 'todos' || p.residuos.some((r) => r.tipo === tipoFiltro);
            const matchCant = cantidadMin === '' || p.residuos.some((r) => r.cantidad >= Number(cantidadMin));
            return matchTipo && matchCant;
        });
    }, [tipoFiltro, cantidadMin, busqueda]);

    const selected = PUERTOS_MOCK.find((p) => p.id === selectedId) ?? null;

    const disponiblesCount = puertosFiltrados.filter((p) => p.estado === 'disponible').length;
    const totalResiduo = selected?.residuos.reduce((acc, r) => acc + r.cantidad, 0) ?? 0;

    const limpiar = () => {
        setTipoFiltro('todos');
        setCantidadMin('');
        setBusqueda('');
    };

    const solicitar = () => {
        if (!selected) return;
        toast.success(`Solicitud enviada a ${selected.nombre}`, {
            description: 'Recibirás una notificación cuando el puerto la apruebe.',
        });
    };

    return (
        <div className="space-y-5">
            {/* ── KPI Bar ── */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Puertos encontrados', value: puertosFiltrados.length, unit: '', icon: Anchor, color: '#00c9a7' },
                    { label: 'Disponibles ahora', value: disponiblesCount, unit: '', icon: CheckCircle2, color: '#10b981' },
                    { label: 'Total residuos puerto', value: selected ? totalResiduo : '—', unit: selected ? 'kg' : '', icon: Package, color: '#3b82f6' },
                    { label: 'Actualizado hace', value: selected ? formatHaceMin(selected.actualizadoHaceMin) : '—', unit: '', icon: RefreshCw, color: '#f59e0b' },
                ].map(({ label, value, unit, icon: Icon, color }) => (
                    <div
                        key={label}
                        className="relative overflow-hidden bg-gray-900/80 border border-gray-800 rounded-xl p-4 backdrop-blur-sm"
                        style={{ boxShadow: `0 0 0 1px ${color}11, inset 0 1px 0 ${color}11` }}
                    >
                        <div
                            className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-10 blur-2xl"
                            style={{ background: color }}
                        />
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color }} />
                            <span className="text-xs font-medium text-gray-400">{label}</span>
                        </div>
                        <div className="text-2xl font-bold text-white">
                            {value}
                            {unit && <span className="text-sm font-normal text-gray-400 ml-1">{unit}</span>}
                        </div>
                    </div>
                ))}
            </div>

            {/* ── Filtros ── */}
            <div className="bg-gray-900/80 border border-gray-800 rounded-xl p-4 backdrop-blur-sm">
                <div className="flex flex-wrap items-center gap-3">
                    <div className="flex items-center gap-2 text-gray-400 mr-1">
                        <Filter className="w-4 h-4" />
                        <span className="text-sm font-semibold text-gray-300">Filtros</span>
                    </div>

                    {/* Búsqueda */}
                    <div className="relative flex-1 min-w-[180px]">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500" />
                        <input
                            type="text"
                            value={busqueda}
                            onChange={(e) => setBusqueda(e.target.value)}
                            placeholder="Buscar puerto..."
                            className="w-full bg-gray-800/60 border border-gray-700 rounded-lg pl-9 pr-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                        />
                    </div>

                    {/* Tipo */}
                    <select
                        value={tipoFiltro}
                        onChange={(e) => setTipoFiltro(e.target.value as TipoResiduo | 'todos')}
                        className="bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    >
                        <option value="todos">Todos los residuos</option>
                        {(Object.keys(TIPO_RESIDUO_LABEL) as TipoResiduo[]).map((t) => (
                            <option key={t} value={t}>{TIPO_RESIDUO_LABEL[t]}</option>
                        ))}
                    </select>

                    {/* Cantidad mín */}
                    <input
                        type="number"
                        min={0}
                        value={cantidadMin}
                        onChange={(e) => setCantidadMin(e.target.value === '' ? '' : Number(e.target.value))}
                        placeholder="Cantidad mín. kg"
                        className="w-40 bg-gray-800/60 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/50 focus:border-emerald-500"
                    />

                    <button
                        onClick={limpiar}
                        className="text-sm font-semibold text-emerald-400 hover:text-emerald-300 transition-colors"
                    >
                        Limpiar
                    </button>
                </div>
            </div>

            {/* ── Mapa + Sidebar ── */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Mapa */}
                <div
                    className="lg:col-span-2 rounded-xl overflow-hidden border border-gray-800"
                    style={{
                        height: 520,
                        boxShadow: '0 0 0 1px rgba(0,201,167,0.08), 0 20px 60px rgba(0,0,0,0.5)',
                    }}
                >
                    <PortMap
                        puertos={puertosFiltrados}
                        selectedId={selectedId}
                        onSelect={setSelectedId}
                        height="h-full"
                    />
                </div>

                {/* Panel lateral */}
                <div
                    className="bg-gray-900/90 border border-gray-800 rounded-xl overflow-hidden flex flex-col"
                    style={{ minHeight: 520, boxShadow: '0 20px 60px rgba(0,0,0,0.4)' }}
                >
                    {selected ? (
                        <>
                            {/* Header */}
                            <div
                                className="p-5 border-b border-gray-800 relative overflow-hidden"
                                style={{
                                    background: selected.estado === 'disponible'
                                        ? 'linear-gradient(135deg, rgba(0,201,167,0.08) 0%, transparent 60%)'
                                        : 'linear-gradient(135deg, rgba(100,116,139,0.08) 0%, transparent 60%)',
                                }}
                            >
                                <div className="flex items-start justify-between">
                                    <div>
                                        <div className="flex items-center gap-2 text-xs text-gray-500 mb-1">
                                            <MapPin className="w-3.5 h-3.5" />
                                            <span>{selected.region}</span>
                                            <span className="text-gray-700">·</span>
                                            <span>{selected.distanciaKm} km</span>
                                        </div>
                                        <h3 className="text-xl font-bold text-white flex items-center gap-2">
                                            <Anchor className="w-5 h-5 text-emerald-400" />
                                            {selected.nombre}
                                        </h3>
                                    </div>
                                    <button
                                        onClick={() => setSelectedId(null)}
                                        className="p-1.5 rounded-lg text-gray-500 hover:text-gray-300 hover:bg-gray-800 transition-colors"
                                    >
                                        <X className="w-4 h-4" />
                                    </button>
                                </div>

                                <div className="mt-3 flex items-center gap-2">
                                    <span
                                        className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold"
                                        style={{
                                            background: selected.estado === 'disponible' ? 'rgba(0,201,167,0.12)' : 'rgba(100,116,139,0.12)',
                                            color: selected.estado === 'disponible' ? '#00c9a7' : '#94a3b8',
                                            border: `1px solid ${selected.estado === 'disponible' ? 'rgba(0,201,167,0.25)' : 'rgba(100,116,139,0.25)'}`,
                                        }}
                                    >
                                        <span
                                            className="w-1.5 h-1.5 rounded-full"
                                            style={{
                                                background: selected.estado === 'disponible' ? '#00c9a7' : '#64748b',
                                                boxShadow: selected.estado === 'disponible' ? '0 0 6px #00c9a7' : 'none',
                                                animation: selected.estado === 'disponible' ? 'pulse 1.5s ease-in-out infinite' : 'none',
                                            }}
                                        />
                                        {selected.estado === 'disponible' ? 'Disponible' : 'Sin disponibilidad'}
                                    </span>
                                </div>
                            </div>

                            {/* ── Imagen del puerto ── */}
                            {selected.imagen ? (
                                <div className="relative w-full h-44 overflow-hidden border-b border-gray-800">
                                    <Image
                                        src={selected.imagen}
                                        alt={`Vista de ${selected.nombre}`}
                                        fill
                                        className="object-cover transition-transform duration-700 hover:scale-105"
                                        sizes="(max-width: 768px) 100vw, 400px"
                                    />
                                    {/* gradient overlay */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-gray-900/60 via-transparent to-transparent" />
                                    <span className="absolute bottom-2 right-3 text-[10px] font-semibold text-white/70 tracking-wide">
                                        {selected.nombre}
                                    </span>
                                </div>
                            ) : (
                                <div className="w-full h-32 border-b border-gray-800 flex items-center justify-center bg-gray-900/40">
                                    <Anchor className="w-10 h-10 text-gray-700" />
                                </div>
                            )}

                            {/* Residuos */}
                            <div className="p-5 flex-1 overflow-y-auto">
                                <p className="text-[11px] font-bold uppercase tracking-widest text-gray-500 mb-3">
                                    Residuos disponibles
                                </p>
                                {selected.residuos.length === 0 ? (
                                    <div className="text-center py-8 text-gray-500">
                                        <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                        <p className="text-sm">Sin residuos registrados</p>
                                    </div>
                                ) : (
                                    <ul className="space-y-2.5">
                                        {selected.residuos.map((r) => {
                                            const Icon = RESIDUO_ICONS[r.tipo];
                                            const accent = RESIDUO_ACCENT[r.tipo];
                                            return (
                                                <li
                                                    key={r.tipo}
                                                    className="flex items-center justify-between p-3 rounded-xl border transition-all"
                                                    style={{
                                                        background: `${accent}08`,
                                                        borderColor: `${accent}20`,
                                                    }}
                                                >
                                                    <div className="flex items-center gap-2.5">
                                                        <div
                                                            className="w-8 h-8 rounded-lg flex items-center justify-center"
                                                            style={{ background: `${accent}18`, color: accent }}
                                                        >
                                                            <Icon size={16} />
                                                        </div>
                                                        <span className="text-sm font-semibold text-gray-200">
                                                            {TIPO_RESIDUO_LABEL[r.tipo]}
                                                        </span>
                                                    </div>
                                                    <span
                                                        className="text-sm font-bold tabular-nums"
                                                        style={{ color: accent }}
                                                    >
                                                        {r.cantidad} {r.unidad}
                                                    </span>
                                                </li>
                                            );
                                        })}
                                    </ul>
                                )}

                                {selected.residuos.length > 0 && (
                                    <div className="mt-4 p-3 rounded-xl bg-gray-800/50 border border-gray-700">
                                        <div className="flex justify-between items-center text-sm">
                                            <span className="text-gray-400">Total estimado</span>
                                            <span className="font-bold text-white">{totalResiduo} kg/L</span>
                                        </div>
                                    </div>
                                )}

                                <p className="text-[11px] text-gray-600 mt-3">
                                    Actualizado {formatHaceMin(selected.actualizadoHaceMin).toLowerCase()}
                                </p>
                            </div>

                            {/* CTA */}
                            <div className="p-5 border-t border-gray-800">
                                <button
                                    onClick={solicitar}
                                    disabled={selected.estado !== 'disponible'}
                                    className="w-full flex items-center justify-center gap-2 font-bold text-sm py-3 rounded-xl transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed"
                                    style={{
                                        background: selected.estado === 'disponible'
                                            ? 'linear-gradient(135deg, #00c9a7, #059669)'
                                            : undefined,
                                        color: '#030712',
                                        boxShadow: selected.estado === 'disponible'
                                            ? '0 0 20px rgba(0,201,167,0.3)'
                                            : undefined,
                                    }}
                                >
                                    <CheckCircle2 className="w-4 h-4" />
                                    Solicitar recolección
                                </button>
                            </div>
                        </>
                    ) : (
                        <div className="flex flex-col items-center justify-center h-full p-8 text-center">
                            <div
                                className="w-16 h-16 rounded-full flex items-center justify-center mb-4"
                                style={{ background: 'rgba(0,201,167,0.08)', border: '1px solid rgba(0,201,167,0.15)' }}
                            >
                                <Anchor className="w-7 h-7 text-emerald-500 opacity-60" />
                            </div>
                            <p className="text-sm text-gray-400">
                                Selecciona un puerto en el mapa para ver sus detalles.
                            </p>

                            {/* Lista rápida */}
                            {puertosFiltrados.length > 0 && (
                                <div className="mt-6 w-full space-y-2">
                                    <p className="text-xs font-bold uppercase tracking-widest text-gray-600 mb-3">Puertos cercanos</p>
                                    {puertosFiltrados.slice(0, 4).map((p) => (
                                        <button
                                            key={p.id}
                                            onClick={() => setSelectedId(p.id)}
                                            className="w-full flex items-center gap-3 p-3 rounded-xl bg-gray-800/50 hover:bg-gray-800 border border-gray-700 hover:border-gray-600 text-left transition-all"
                                        >
                                            <span
                                                className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                                                style={{
                                                    background: p.estado === 'disponible' ? '#00c9a7' : '#64748b',
                                                    boxShadow: p.estado === 'disponible' ? '0 0 6px #00c9a7' : 'none',
                                                }}
                                            />
                                            <div className="min-w-0">
                                                <p className="text-sm font-semibold text-gray-200 truncate">{p.nombre}</p>
                                                <p className="text-xs text-gray-500">{p.region}</p>
                                            </div>
                                            <span className="ml-auto text-xs text-gray-500 flex-shrink-0">{p.distanciaKm} km</span>
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}

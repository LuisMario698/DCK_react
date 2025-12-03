'use client';

import { useState } from 'react';
import { DashboardStats, ReporteDetalladoItem } from '@/types/dashboard';
import { getReporteComplejo } from '@/lib/services/dashboard_stats';
import { Icons } from '@/components/ui/Icons';

interface DashboardClientProps {
    initialStats: DashboardStats;
    buques: { id: number; nombre_buque: string }[];
}

export function DashboardClient({ initialStats, buques }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'reportes'>('general');
    const [reportData, setReportData] = useState<ReporteDetalladoItem[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);

    // Filtros de reporte
    const [filters, setFilters] = useState({
        fechaInicio: '',
        fechaFin: '',
        buqueId: '',
        estado: ''
    });

    const loadReport = async () => {
        setLoadingReport(true);
        try {
            const data = await getReporteComplejo({
                fechaInicio: filters.fechaInicio || undefined,
                fechaFin: filters.fechaFin || undefined,
                buqueId: filters.buqueId ? Number(filters.buqueId) : undefined,
                estado: filters.estado || undefined
            });
            setReportData(data);
        } catch (error) {
            console.error('Error cargando reporte:', error);
        } finally {
            setLoadingReport(false);
        }
    };

    return (
        <div className="space-y-8 font-sans text-gray-600">
            {/* Tabs de Navegación Estilizados */}
            <div className="flex items-center justify-between">
                <div className="flex space-x-2 bg-white p-1.5 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'general'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('reportes')}
                        className={`px-6 py-2.5 text-sm font-semibold rounded-xl transition-all duration-300 ${activeTab === 'reportes'
                                ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                                : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                    >
                        Reportes
                    </button>
                </div>
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                    {/* KPIs Section - Diseño Premium */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Tarjeta Principal (Azul) */}
                        <div className="bg-gradient-to-br from-blue-600 to-blue-700 p-6 rounded-3xl text-white shadow-xl shadow-blue-200 relative overflow-hidden group">
                            <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity transform group-hover:scale-110 duration-500">
                                <Icons.Recycle className="w-24 h-24" />
                            </div>
                            <div className="relative z-10">
                                <div className="flex items-center gap-3 mb-4">
                                    <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
                                        <Icons.Recycle className="w-6 h-6 text-white" />
                                    </div>
                                    <span className="text-blue-100 text-sm font-medium">Total Reciclado</span>
                                </div>
                                <h3 className="text-4xl font-bold mb-2 tracking-tight">{initialStats.kpis.totalResiduosReciclados.toLocaleString()} <span className="text-xl font-normal text-blue-200">kg</span></h3>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className="bg-white/20 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm text-white flex items-center gap-1">
                                        <span className="text-green-300">↑</span> +12.4%
                                    </span>
                                    <span className="text-blue-200 text-xs">vs mes anterior</span>
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta Secundaria (Blanca) */}
                        <KpiCardPremium
                            title="Manifiestos"
                            value={initialStats.kpis.totalManifiestos}
                            subValue="Pendientes"
                            subValueCount={initialStats.kpis.manifiestosPendientes}
                            icon="Document"
                            trend="+2.08%"
                            trendUp={true}
                        />

                        <KpiCardPremium
                            title="Buques Activos"
                            value={initialStats.kpis.buquesActivos}
                            subValue="Total Flota"
                            subValueCount={initialStats.kpis.totalBuques}
                            icon="Ship"
                            trend="+5.3%"
                            trendUp={true}
                        />

                        <KpiCardPremium
                            title="Aceite Recolectado"
                            value={`${initialStats.kpis.totalAceiteUsado.toLocaleString()} L`}
                            subValue="Litros"
                            subValueCount={initialStats.kpis.totalAceiteUsado}
                            icon="Drop" // Asumiendo que existe o usar fallback
                            trend="+8.1%"
                            trendUp={true}
                        />
                    </div>

                    {/* Gráficas Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gráfica Principal (Barras) - Ocupa 2 columnas */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <div className="flex justify-between items-center mb-8">
                                <div>
                                    <h3 className="text-xl font-bold text-gray-800">Estadísticas de Residuos</h3>
                                    <p className="text-sm text-gray-400 mt-1">Comparativa mensual de Aceite vs Basura</p>
                                </div>
                                <div className="flex gap-3">
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="w-3 h-3 rounded-full bg-blue-600"></span> Basura
                                    </div>
                                    <div className="flex items-center gap-2 text-sm text-gray-500">
                                        <span className="w-3 h-3 rounded-full bg-gray-200"></span> Aceite
                                    </div>
                                </div>
                            </div>

                            <div className="h-72 flex items-end justify-between gap-4 px-2">
                                {initialStats.residuosPorMes.map((mes) => {
                                    const maxVal = Math.max(...initialStats.residuosPorMes.map(m => m.aceite + m.basura));
                                    const total = mes.aceite + mes.basura;
                                    // Altura mínima visual para que no desaparezca
                                    const heightPercent = maxVal > 0 ? Math.max((total / maxVal) * 100, 5) : 0;

                                    return (
                                        <div key={mes.mes} className="flex flex-col items-center flex-1 group relative h-full justify-end">
                                            {/* Tooltip */}
                                            <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-10 pointer-events-none">
                                                <div className="bg-gray-900 text-white text-xs py-2 px-3 rounded-xl shadow-xl">
                                                    <p className="font-semibold mb-1">{mes.mes}</p>
                                                    <p className="flex justify-between gap-4"><span className="text-gray-400">Aceite:</span> {mes.aceite} L</p>
                                                    <p className="flex justify-between gap-4"><span className="text-gray-400">Basura:</span> {mes.basura} kg</p>
                                                </div>
                                                {/* Flechita tooltip */}
                                                <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                            </div>

                                            <div className="w-full max-w-[40px] relative rounded-t-2xl overflow-hidden transition-all duration-500 hover:brightness-95 cursor-pointer" style={{ height: `${heightPercent}%` }}>
                                                {/* Fondo (Aceite - Gris en diseño ref) */}
                                                <div className="absolute inset-0 bg-gray-100 rounded-t-2xl"></div>
                                                {/* Frente (Basura - Azul en diseño ref) */}
                                                <div
                                                    className="absolute bottom-0 w-full bg-blue-600 rounded-t-2xl transition-all duration-1000 ease-out"
                                                    style={{ height: `${(mes.basura / (total || 1)) * 100}%` }}
                                                />
                                            </div>
                                            <span className="text-xs font-medium text-gray-400 mt-4">{mes.mes.split('-')[1]}</span>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {/* Gráfica Secundaria (Top Buques / Donut Style) */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Top Buques</h3>
                            <p className="text-sm text-gray-400 mb-8">Mayores generadores este mes</p>

                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                {initialStats.topBuques.slice(0, 4).map((buque, idx) => {
                                    const maxVal = Math.max(...initialStats.topBuques.map(b => b.totalKg));
                                    const width = maxVal > 0 ? (buque.totalKg / maxVal) * 100 : 0;
                                    const colors = ['bg-blue-600', 'bg-indigo-500', 'bg-violet-500', 'bg-purple-500'];

                                    return (
                                        <div key={buque.buqueId} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-sm shadow-md ${colors[idx % colors.length]}`}>
                                                        {buque.nombreBuque.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-gray-800 text-sm">{buque.nombreBuque}</p>
                                                        <p className="text-xs text-gray-400">{buque.cantidadManifiestos} entregas</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-gray-700 text-sm">{buque.totalKg.toFixed(0)} kg</span>
                                            </div>
                                            <div className="w-full bg-gray-50 rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${colors[idx % colors.length]} opacity-80 group-hover:opacity-100 transition-all duration-500`}
                                                    style={{ width: `${width}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button className="mt-8 w-full py-3 rounded-xl border border-gray-200 text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                Ver reporte completo
                            </button>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-xl shadow-gray-100/50 animate-in fade-in duration-500">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-2xl font-bold text-gray-800">Reportes Avanzados</h3>
                            <p className="text-gray-400 mt-1">Genera y exporta datos detallados</p>
                        </div>
                        <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100">
                            <Icons.Settings className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filtros Estilizados */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Desde</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-white border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-600"
                                value={filters.fechaInicio}
                                onChange={e => setFilters({ ...filters, fechaInicio: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Hasta</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-white border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-600"
                                value={filters.fechaFin}
                                onChange={e => setFilters({ ...filters, fechaFin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-xs font-bold text-gray-500 uppercase tracking-wider">Buque</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-white border-none rounded-xl shadow-sm text-sm focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-600 appearance-none"
                                    value={filters.buqueId}
                                    onChange={e => setFilters({ ...filters, buqueId: e.target.value })}
                                >
                                    <option value="">Todos los buques</option>
                                    {buques.map(b => (
                                        <option key={b.id} value={b.id}>{b.nombre_buque}</option>
                                    ))}
                                </select>
                                <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-gray-400">
                                    ▼
                                </div>
                            </div>
                        </div>
                        <div className="flex items-end">
                            <button
                                onClick={loadReport}
                                disabled={loadingReport}
                                className="w-full py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-sm shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                            >
                                {loadingReport ? 'Generando...' : 'Generar Reporte'}
                            </button>
                        </div>
                    </div>

                    {/* Tabla de Resultados Premium */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                        <table className="w-full text-sm text-left">
                            <thead className="bg-gray-50/80 text-gray-500 font-semibold">
                                <tr>
                                    <th className="px-6 py-4 rounded-tl-2xl">Fecha</th>
                                    <th className="px-6 py-4">Folio</th>
                                    <th className="px-6 py-4">Buque</th>
                                    <th className="px-6 py-4">Residuo</th>
                                    <th className="px-6 py-4 text-right">Cantidad</th>
                                    <th className="px-6 py-4 rounded-tr-2xl">Estado</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-50 bg-white">
                                {reportData.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400">
                                            <div className="flex flex-col items-center gap-3">
                                                <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center text-gray-300">
                                                    <Icons.Document className="w-8 h-8" />
                                                </div>
                                                <p>{loadingReport ? 'Procesando datos...' : 'Configura los filtros para ver resultados'}</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : (
                                    reportData.map((item, idx) => (
                                        <tr key={idx} className="hover:bg-blue-50/30 transition-colors group">
                                            <td className="px-6 py-4 text-gray-600">{new Date(item.fecha).toLocaleDateString()}</td>
                                            <td className="px-6 py-4 font-mono text-xs text-gray-400 group-hover:text-blue-600 transition-colors">{item.folio}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{item.buque}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.tipoResiduo}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-800">
                                                {item.cantidad} <span className="text-xs font-normal text-gray-400 ml-1">{item.unidad}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1 rounded-full text-xs font-semibold ${item.estado === 'completado'
                                                        ? 'bg-green-100 text-green-700'
                                                        : 'bg-amber-100 text-amber-700'
                                                    }`}>
                                                    {item.estado}
                                                </span>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            )}
        </div>
    );
}

function KpiCardPremium({ title, value, subValue, subValueCount, icon, trend, trendUp }: any) {
    return (
        <div className="bg-white p-6 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 hover:shadow-xl hover:shadow-gray-200/50 transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-gray-50 rounded-2xl text-gray-600 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                    {/* @ts-ignore */}
                    {Icons[icon] ? Icons[icon]({ className: "w-6 h-6" }) : <Icons.Help className="w-6 h-6" />}
                </div>
                <span className={`px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                    {trend}
                </span>
            </div>

            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800 tracking-tight mb-4">{value}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                <div className="flex -space-x-2">
                    {/* Avatars dummy */}
                    <div className="w-6 h-6 rounded-full bg-gray-200 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-300 border-2 border-white"></div>
                    <div className="w-6 h-6 rounded-full bg-gray-400 border-2 border-white"></div>
                </div>
                <p className="text-xs text-gray-400">
                    <strong className="text-gray-600">{subValueCount}</strong> {subValue}
                </p>
            </div>
        </div>
    );
}

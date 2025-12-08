'use client';

import { useState, useEffect } from 'react';
import { DashboardStats, ReporteDetalladoItem } from '@/types/dashboard';
import { 
    getReporteComplejo, 
    getDashboardKPIsFiltered, 
    getComparacionPeriodoAnterior,
    PeriodoFiltro,
    FiltrosDashboard
} from '@/lib/services/dashboard_stats';
import { Icons } from '@/components/ui/Icons';
import { createClient } from '@/lib/supabase/client';

interface DashboardClientProps {
    initialStats: DashboardStats;
    buques: { id: number; nombre_buque: string }[];
}

interface StatsFiltered {
    totalManifiestos: number;
    manifiestosPendientes: number;
    totalBuques: number;
    buquesActivos: number;
    totalResiduosReciclados: number;
    totalBasuraGeneral: number;
    totalAceiteUsado: number;
    totalBasuron: number;
    entregasBasuron: number;
    filtrosAceite: number;
    filtrosDiesel: number;
    filtrosAire: number;
}

interface Comparaciones {
    manifestosAnterior: number;
    aceiteAnterior: number;
    basuraAnterior: number;
    basuronAnterior: number;
    totalAnterior: number;
}

export function DashboardClient({ initialStats, buques }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'reportes'>('general');
    const [reportData, setReportData] = useState<ReporteDetalladoItem[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const [loadingStats, setLoadingStats] = useState(false);
    const supabase = createClient();

    // Estado para período seleccionado
    const [periodoSeleccionado, setPeriodoSeleccionado] = useState<PeriodoFiltro>('mes');
    const [fechaPersonalizadaInicio, setFechaPersonalizadaInicio] = useState('');
    const [fechaPersonalizadaFin, setFechaPersonalizadaFin] = useState('');
    
    // Estados para datos filtrados
    const [statsFiltered, setStatsFiltered] = useState<StatsFiltered | null>(null);
    const [comparaciones, setComparaciones] = useState<Comparaciones | null>(null);

    // Filtros de reporte
    const [filters, setFilters] = useState({
        fechaInicio: '',
        fechaFin: '',
        buqueId: '',
        estado: ''
    });

    // Cargar estadísticas cuando cambia el período
    useEffect(() => {
        const loadFilteredStats = async () => {
            setLoadingStats(true);
            try {
                const filtros: FiltrosDashboard = {
                    periodo: periodoSeleccionado,
                    fechaInicio: fechaPersonalizadaInicio,
                    fechaFin: fechaPersonalizadaFin
                };

                const [kpisData, comparacionData] = await Promise.all([
                    getDashboardKPIsFiltered(supabase, filtros),
                    getComparacionPeriodoAnterior(supabase, filtros)
                ]);

                setStatsFiltered(kpisData);
                setComparaciones(comparacionData);
            } catch (error) {
                console.error('Error cargando estadísticas filtradas:', error);
            } finally {
                setLoadingStats(false);
            }
        };

        loadFilteredStats();
    }, [periodoSeleccionado, fechaPersonalizadaInicio, fechaPersonalizadaFin]);

    // Calcular porcentaje de cambio
    const calcularPorcentajeCambio = (actual: number, anterior: number): { valor: string; positivo: boolean } => {
        if (anterior === 0) {
            return { valor: actual > 0 ? '+100%' : '0%', positivo: actual >= 0 };
        }
        const cambio = ((actual - anterior) / anterior) * 100;
        const signo = cambio >= 0 ? '+' : '';
        return { 
            valor: `${signo}${cambio.toFixed(1)}%`, 
            positivo: cambio >= 0 
        };
    };

    // Usar datos filtrados o iniciales
    const stats = statsFiltered || {
        totalManifiestos: initialStats.kpis.totalManifiestos,
        manifiestosPendientes: initialStats.kpis.manifiestosPendientes,
        totalBuques: initialStats.kpis.totalBuques,
        buquesActivos: initialStats.kpis.buquesActivos,
        totalResiduosReciclados: initialStats.kpis.totalResiduosReciclados,
        totalBasuraGeneral: initialStats.kpis.totalBasuraGeneral,
        totalAceiteUsado: initialStats.kpis.totalAceiteUsado,
        totalBasuron: 0,
        entregasBasuron: 0,
        filtrosAceite: 0,
        filtrosDiesel: 0,
        filtrosAire: 0
    };

    // Calcular trends
    const trendTotal = comparaciones 
        ? calcularPorcentajeCambio(stats.totalResiduosReciclados, comparaciones.totalAnterior)
        : { valor: '+0%', positivo: true };
    const trendManifiestos = comparaciones
        ? calcularPorcentajeCambio(stats.totalManifiestos, comparaciones.manifestosAnterior)
        : { valor: '+0%', positivo: true };
    const trendAceite = comparaciones
        ? calcularPorcentajeCambio(stats.totalAceiteUsado, comparaciones.aceiteAnterior)
        : { valor: '+0%', positivo: true };
    const trendBasuron = comparaciones
        ? calcularPorcentajeCambio(stats.totalBasuron, comparaciones.basuronAnterior)
        : { valor: '+0%', positivo: true };

    const loadReport = async () => {
        setLoadingReport(true);
        try {
            const data = await getReporteComplejo(supabase, {
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

    // Función para exportar a CSV
    const exportToCSV = (data: ReporteDetalladoItem[]) => {
        const headers = ['Fecha', 'Folio', 'Buque', 'Tipo Residuo', 'Cantidad', 'Unidad', 'Estado', 'Responsable'];
        const csvContent = [
            headers.join(','),
            ...data.map(item => [
                item.fecha,
                item.folio,
                `"${item.buque}"`,
                `"${item.tipoResiduo}"`,
                item.cantidad,
                item.unidad,
                item.estado,
                `"${item.responsable}"`
            ].join(','))
        ].join('\n');

        const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `reporte_residuos_${new Date().toISOString().split('T')[0]}.csv`;
        link.click();
    };

    // Función para exportar a PDF (genera HTML imprimible)
    const exportToPDF = (data: ReporteDetalladoItem[], statsData: StatsFiltered) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const html = `
            <!DOCTYPE html>
            <html>
            <head>
                <title>Reporte de Residuos - CDK</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #333; }
                    h1 { color: #1e40af; border-bottom: 2px solid #1e40af; padding-bottom: 10px; }
                    h2 { color: #374151; margin-top: 30px; }
                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                    .stat-card { background: #f3f4f6; padding: 20px; border-radius: 10px; text-align: center; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #1e40af; }
                    .stat-label { font-size: 12px; color: #6b7280; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #1e40af; color: white; padding: 12px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #e5e7eb; }
                    tr:nth-child(even) { background: #f9fafb; }
                    .footer { margin-top: 40px; text-align: center; color: #9ca3af; font-size: 12px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <h1>📊 Reporte de Residuos</h1>
                <p>Generado el ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                <h2>Resumen General</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${statsData.totalResiduosReciclados.toLocaleString()} kg</div>
                        <div class="stat-label">Total Reciclado</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statsData.totalManifiestos}</div>
                        <div class="stat-label">Manifiestos</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statsData.totalAceiteUsado} L</div>
                        <div class="stat-label">Aceite Recolectado</div>
                    </div>
                    <div class="stat-card">
                        <div class="stat-value">${statsData.totalBasuron.toLocaleString()} kg</div>
                        <div class="stat-label">Basurón</div>
                    </div>
                </div>

                <h2>Detalle de Registros (${data.length})</h2>
                <table>
                    <thead>
                        <tr>
                            <th>Fecha</th>
                            <th>Folio</th>
                            <th>Buque</th>
                            <th>Tipo</th>
                            <th>Cantidad</th>
                            <th>Estado</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${data.map(item => `
                            <tr>
                                <td>${new Date(item.fecha).toLocaleDateString()}</td>
                                <td>${item.folio}</td>
                                <td>${item.buque}</td>
                                <td>${item.tipoResiduo}</td>
                                <td>${item.cantidad} ${item.unidad}</td>
                                <td>${item.estado}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>CDK - Sistema de Gestión de Residuos Marinos</p>
                    <p>Este documento fue generado automáticamente</p>
                </div>

                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8 font-sans text-gray-600">
            {/* Tabs de Navegación Estilizados */}
            <div className="flex items-center justify-between flex-wrap gap-4">
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

                {/* Selector de Período */}
                {activeTab === 'general' && (
                    <div className="flex items-center gap-2">
                        <span className="text-sm text-gray-500 font-medium">Período:</span>
                        <div className="flex space-x-1 bg-white p-1 rounded-xl shadow-sm border border-gray-100">
                            {[
                                { key: 'semana', label: '7D' },
                                { key: 'mes', label: '1M' },
                                { key: 'trimestre', label: '3M' },
                                { key: 'anio', label: '1A' },
                                { key: 'todo', label: 'Todo' }
                            ].map((p) => (
                                <button
                                    key={p.key}
                                    onClick={() => setPeriodoSeleccionado(p.key as PeriodoFiltro)}
                                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-all duration-200 ${
                                        periodoSeleccionado === p.key
                                            ? 'bg-blue-600 text-white shadow-sm'
                                            : 'text-gray-500 hover:bg-gray-50'
                                    }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {loadingStats && (
                            <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        )}
                    </div>
                )}
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                    {/* KPIs Section - Diseño Premium */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Tarjeta Principal (Azul) - Total Reciclado */}
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
                                <h3 className="text-4xl font-bold mb-2 tracking-tight">{stats.totalResiduosReciclados.toLocaleString()} <span className="text-xl font-normal text-blue-200">kg</span></h3>
                                <div className="flex items-center gap-2 mt-4">
                                    <span className={`bg-white/20 px-2 py-1 rounded-lg text-xs font-medium backdrop-blur-sm text-white flex items-center gap-1`}>
                                        <span className={trendTotal.positivo ? 'text-green-300' : 'text-red-300'}>{trendTotal.positivo ? '↑' : '↓'}</span> {trendTotal.valor}
                                    </span>
                                    <span className="text-blue-200 text-xs">vs período anterior</span>
                                </div>
                            </div>
                        </div>

                        {/* Tarjeta Manifiestos */}
                        <KpiCardPremium
                            title="Manifiestos"
                            value={stats.totalManifiestos}
                            subValue="Pendientes"
                            subValueCount={stats.manifiestosPendientes}
                            icon="Document"
                            trend={trendManifiestos.valor}
                            trendUp={trendManifiestos.positivo}
                        />

                        {/* Tarjeta Basurón */}
                        <KpiCardPremium
                            title="Basurón"
                            value={`${stats.totalBasuron.toLocaleString()} kg`}
                            subValue="Entregas"
                            subValueCount={stats.entregasBasuron}
                            icon="Ship"
                            trend={trendBasuron.valor}
                            trendUp={trendBasuron.positivo}
                        />

                        {/* Tarjeta Aceite */}
                        <KpiCardPremium
                            title="Aceite Recolectado"
                            value={`${stats.totalAceiteUsado.toLocaleString()} L`}
                            subValue="Litros"
                            subValueCount={stats.totalAceiteUsado}
                            icon="Drop"
                            trend={trendAceite.valor}
                            trendUp={trendAceite.positivo}
                        />
                    </div>

                    {/* Segunda fila de KPIs - Filtros y Buques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <KpiCardPremium
                            title="Filtros Aceite"
                            value={stats.filtrosAceite}
                            subValue="Unidades"
                            subValueCount={stats.filtrosAceite}
                            icon="Settings"
                            trend=""
                            trendUp={true}
                        />
                        <KpiCardPremium
                            title="Filtros Diesel"
                            value={stats.filtrosDiesel}
                            subValue="Unidades"
                            subValueCount={stats.filtrosDiesel}
                            icon="Settings"
                            trend=""
                            trendUp={true}
                        />
                        <KpiCardPremium
                            title="Filtros Aire"
                            value={stats.filtrosAire}
                            subValue="Unidades"
                            subValueCount={stats.filtrosAire}
                            icon="Settings"
                            trend=""
                            trendUp={true}
                        />
                        <KpiCardPremium
                            title="Buques Activos"
                            value={stats.buquesActivos}
                            subValue="Total Flota"
                            subValueCount={stats.totalBuques}
                            icon="Ship"
                            trend=""
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

                    {/* Segunda fila de gráficas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfica de Distribución por Tipo (Dona) */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Distribución por Tipo</h3>
                            <p className="text-sm text-gray-400 mb-6">Proporción de residuos recolectados</p>
                            
                            <div className="flex items-center justify-center gap-8">
                                {/* Gráfica de Dona */}
                                <div className="relative w-48 h-48">
                                    <DonutChart 
                                        data={[
                                            { label: 'Aceite', value: stats.totalAceiteUsado, color: '#F59E0B' },
                                            { label: 'Basura', value: stats.totalBasuraGeneral, color: '#3B82F6' },
                                            { label: 'Basurón', value: stats.totalBasuron, color: '#10B981' },
                                        ]}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-2xl font-bold text-gray-800">{stats.totalResiduosReciclados.toLocaleString()}</span>
                                        <span className="text-xs text-gray-400">kg total</span>
                                    </div>
                                </div>
                                
                                {/* Leyenda */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-amber-500"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Aceite Usado</p>
                                            <p className="text-xs text-gray-400">{stats.totalAceiteUsado.toLocaleString()} L</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-blue-500"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Basura General</p>
                                            <p className="text-xs text-gray-400">{stats.totalBasuraGeneral.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-4 h-4 rounded-full bg-emerald-500"></div>
                                        <div>
                                            <p className="text-sm font-medium text-gray-700">Basurón</p>
                                            <p className="text-xs text-gray-400">{stats.totalBasuron.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gráfica de Filtros Recolectados */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Filtros Recolectados</h3>
                            <p className="text-sm text-gray-400 mb-6">Desglose por tipo de filtro</p>
                            
                            <div className="space-y-6">
                                {/* Filtros Aceite */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Filtros de Aceite</span>
                                        <span className="text-sm font-bold text-amber-600">{stats.filtrosAceite} uds</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.filtrosAceite / Math.max(stats.filtrosAceite, stats.filtrosDiesel, stats.filtrosAire, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                {/* Filtros Diesel */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Filtros de Diesel</span>
                                        <span className="text-sm font-bold text-blue-600">{stats.filtrosDiesel} uds</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-blue-400 to-blue-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.filtrosDiesel / Math.max(stats.filtrosAceite, stats.filtrosDiesel, stats.filtrosAire, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>
                                
                                {/* Filtros Aire */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-sm font-medium text-gray-700">Filtros de Aire</span>
                                        <span className="text-sm font-bold text-emerald-600">{stats.filtrosAire} uds</span>
                                    </div>
                                    <div className="w-full bg-gray-100 rounded-full h-3 overflow-hidden">
                                        <div 
                                            className="h-full bg-gradient-to-r from-emerald-400 to-emerald-500 rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.filtrosAire / Math.max(stats.filtrosAceite, stats.filtrosDiesel, stats.filtrosAire, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="pt-4 border-t border-gray-100">
                                    <div className="flex justify-between">
                                        <span className="text-sm font-bold text-gray-800">Total Filtros</span>
                                        <span className="text-lg font-bold text-gray-800">{(stats.filtrosAceite + stats.filtrosDiesel + stats.filtrosAire).toLocaleString()} uds</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tercera fila - Comparación y Métricas Ambientales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparación vs Período Anterior */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <h3 className="text-xl font-bold text-gray-800 mb-2">Comparación vs Período Anterior</h3>
                            <p className="text-sm text-gray-400 mb-6">Evolución de residuos recolectados</p>
                            
                            {comparaciones && (
                                <div className="space-y-5">
                                    {/* Total Reciclado */}
                                    <ComparisonBar
                                        label="Total Reciclado"
                                        actual={stats.totalResiduosReciclados}
                                        anterior={comparaciones.totalAnterior}
                                        unit="kg"
                                        color="blue"
                                    />
                                    
                                    {/* Aceite */}
                                    <ComparisonBar
                                        label="Aceite Usado"
                                        actual={stats.totalAceiteUsado}
                                        anterior={comparaciones.aceiteAnterior}
                                        unit="L"
                                        color="amber"
                                    />
                                    
                                    {/* Basura */}
                                    <ComparisonBar
                                        label="Basura General"
                                        actual={stats.totalBasuraGeneral}
                                        anterior={comparaciones.basuraAnterior}
                                        unit="kg"
                                        color="emerald"
                                    />
                                    
                                    {/* Basurón */}
                                    <ComparisonBar
                                        label="Basurón"
                                        actual={stats.totalBasuron}
                                        anterior={comparaciones.basuronAnterior}
                                        unit="kg"
                                        color="violet"
                                    />
                                </div>
                            )}
                            
                            {!comparaciones && (
                                <div className="flex items-center justify-center h-40 text-gray-400">
                                    <p>Cargando comparación...</p>
                                </div>
                            )}
                        </div>

                        {/* Métricas de Impacto Ambiental */}
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-xl shadow-emerald-200 text-white">
                            <h3 className="text-xl font-bold mb-2">🌍 Impacto Ambiental</h3>
                            <p className="text-emerald-100 text-sm mb-6">Contribución al medio ambiente</p>
                            
                            <div className="grid grid-cols-2 gap-4">
                                {/* CO2 Evitado */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="text-3xl mb-2">🌱</div>
                                    <p className="text-2xl font-bold">{((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)).toFixed(0)} kg</p>
                                    <p className="text-emerald-100 text-xs">CO₂ evitado</p>
                                </div>
                                
                                {/* Árboles equivalentes */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="text-3xl mb-2">🌳</div>
                                    <p className="text-2xl font-bold">{Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21)}</p>
                                    <p className="text-emerald-100 text-xs">Árboles equivalentes</p>
                                </div>
                                
                                {/* Litros de agua protegidos */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="text-3xl mb-2">💧</div>
                                    <p className="text-2xl font-bold">{(stats.totalAceiteUsado * 1000).toLocaleString()}</p>
                                    <p className="text-emerald-100 text-xs">Litros de agua protegidos</p>
                                </div>
                                
                                {/* Residuos reciclados */}
                                <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4">
                                    <div className="text-3xl mb-2">♻️</div>
                                    <p className="text-2xl font-bold">{stats.totalResiduosReciclados.toLocaleString()}</p>
                                    <p className="text-emerald-100 text-xs">kg reciclados total</p>
                                </div>
                            </div>
                            
                            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                <p className="text-sm text-emerald-100">
                                    <span className="font-bold text-white">¡Excelente trabajo!</span> Cada litro de aceite correctamente reciclado previene la contaminación de hasta 1,000 litros de agua.
                                </p>
                            </div>
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
                        <div className="flex items-end gap-2">
                            <button
                                onClick={loadReport}
                                disabled={loadingReport}
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-sm shadow-lg shadow-blue-200 transition-all transform active:scale-95"
                            >
                                {loadingReport ? 'Generando...' : 'Generar Reporte'}
                            </button>
                        </div>
                    </div>

                    {/* Botones de Exportación */}
                    {reportData.length > 0 && (
                        <div className="flex justify-end gap-3 mb-6">
                            <button
                                onClick={() => exportToCSV(reportData)}
                                className="flex items-center gap-2 px-4 py-2 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-semibold text-sm transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Exportar CSV
                            </button>
                            <button
                                onClick={() => exportToPDF(reportData, stats)}
                                className="flex items-center gap-2 px-4 py-2 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold text-sm transition-colors"
                            >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Exportar PDF
                            </button>
                        </div>
                    )}

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
                {trend && (
                    <span className={`px-2 py-1 rounded-lg text-xs font-bold ${trendUp ? 'bg-green-50 text-green-600' : 'bg-red-50 text-red-600'}`}>
                        {trend}
                    </span>
                )}
            </div>

            <h3 className="text-gray-500 text-sm font-medium mb-1">{title}</h3>
            <p className="text-3xl font-bold text-gray-800 tracking-tight mb-4">{typeof value === 'number' ? value.toLocaleString() : value}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-gray-50">
                <div className="flex -space-x-2">
                    {/* Indicador visual */}
                    <div className="w-6 h-6 rounded-full bg-blue-100 border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-blue-500"></div>
                    </div>
                </div>
                <p className="text-xs text-gray-400">
                    <strong className="text-gray-600">{typeof subValueCount === 'number' ? subValueCount.toLocaleString() : subValueCount}</strong> {subValue}
                </p>
            </div>
        </div>
    );
}

// Componente de Gráfica de Dona (SVG puro)
interface DonutChartData {
    label: string;
    value: number;
    color: string;
}

function DonutChart({ data }: { data: DonutChartData[] }) {
    const total = data.reduce((sum, d) => sum + d.value, 0);
    if (total === 0) {
        return (
            <svg viewBox="0 0 100 100" className="w-full h-full">
                <circle cx="50" cy="50" r="40" fill="none" stroke="#f3f4f6" strokeWidth="20" />
            </svg>
        );
    }

    const radius = 40;
    const circumference = 2 * Math.PI * radius;
    let accumulatedOffset = 0;

    return (
        <svg viewBox="0 0 100 100" className="w-full h-full transform -rotate-90">
            {data.map((segment, index) => {
                const percentage = segment.value / total;
                const strokeDasharray = `${percentage * circumference} ${circumference}`;
                const strokeDashoffset = -accumulatedOffset;
                accumulatedOffset += percentage * circumference;

                return (
                    <circle
                        key={index}
                        cx="50"
                        cy="50"
                        r={radius}
                        fill="none"
                        stroke={segment.color}
                        strokeWidth="20"
                        strokeDasharray={strokeDasharray}
                        strokeDashoffset={strokeDashoffset}
                        className="transition-all duration-1000 ease-out"
                        style={{ 
                            filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.1))'
                        }}
                    />
                );
            })}
        </svg>
    );
}

// Componente de Barra de Comparación
interface ComparisonBarProps {
    label: string;
    actual: number;
    anterior: number;
    unit: string;
    color: 'blue' | 'amber' | 'emerald' | 'violet';
}

function ComparisonBar({ label, actual, anterior, unit, color }: ComparisonBarProps) {
    const max = Math.max(actual, anterior, 1);
    const actualPercent = (actual / max) * 100;
    const anteriorPercent = (anterior / max) * 100;
    
    const cambio = anterior > 0 ? ((actual - anterior) / anterior) * 100 : (actual > 0 ? 100 : 0);
    const positivo = cambio >= 0;
    
    const colorClasses = {
        blue: { bg: 'bg-blue-500', light: 'bg-blue-200' },
        amber: { bg: 'bg-amber-500', light: 'bg-amber-200' },
        emerald: { bg: 'bg-emerald-500', light: 'bg-emerald-200' },
        violet: { bg: 'bg-violet-500', light: 'bg-violet-200' }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-800">{actual.toLocaleString()} {unit}</span>
                    <span className={`text-xs font-bold px-2 py-0.5 rounded ${positivo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {positivo ? '↑' : '↓'} {Math.abs(cambio).toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="relative h-4 flex gap-1">
                {/* Barra actual */}
                <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${colorClasses[color].bg} rounded-full transition-all duration-1000`}
                        style={{ width: `${actualPercent}%` }}
                    ></div>
                </div>
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-xs text-gray-400">Actual</span>
                <span className="text-xs text-gray-400">Anterior: {anterior.toLocaleString()} {unit}</span>
            </div>
        </div>
    );
}

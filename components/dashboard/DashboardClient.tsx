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
                <div className="flex space-x-2 bg-white p-2 rounded-2xl shadow-sm border border-gray-100">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`px-8 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${activeTab === 'general'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                    >
                        Dashboard
                    </button>
                    <button
                        onClick={() => setActiveTab('reportes')}
                        className={`px-8 py-3 text-base font-semibold rounded-xl transition-all duration-300 ${activeTab === 'reportes'
                            ? 'bg-blue-600 text-white shadow-md shadow-blue-200'
                            : 'text-gray-500 hover:bg-gray-50 hover:text-gray-800'
                            }`}
                    >
                        Reportes
                    </button>
                </div>

                {/* Selector de Período */}
                {activeTab === 'general' && (
                    <div className="flex items-center gap-3">
                        <span className="text-base text-gray-500 font-medium">Período:</span>
                        <div className="flex space-x-1 bg-white p-1.5 rounded-xl shadow-sm border border-gray-100">
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
                                    className={`px-4 py-2 text-sm font-semibold rounded-lg transition-all duration-200 ${
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
                            <div className="animate-spin w-5 h-5 border-2 border-blue-500 border-t-transparent rounded-full"></div>
                        )}
                    </div>
                )}
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-8 animate-in fade-in duration-700 slide-in-from-bottom-4">
                    {/* KPIs Section - Diseño Simple y Claro */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        {/* Total Reciclado - Azul */}
                        <SimpleKpiCard
                            title="Total Reciclado"
                            value={`${stats.totalResiduosReciclados.toLocaleString()} kg`}
                            subtitle={`${trendTotal.valor} vs anterior`}
                            icon="recycle"
                            color="blue"
                            trendUp={trendTotal.positivo}
                        />

                        {/* Manifiestos - Violeta */}
                        <SimpleKpiCard
                            title="Manifiestos"
                            value={stats.totalManifiestos.toString()}
                            subtitle={`${stats.manifiestosPendientes} pendientes`}
                            icon="document"
                            color="violet"
                            trendUp={trendManifiestos.positivo}
                        />

                        {/* Basurón - Esmeralda */}
                        <SimpleKpiCard
                            title="Basurón"
                            value={`${stats.totalBasuron.toLocaleString()} kg`}
                            subtitle={`${stats.entregasBasuron} entregas`}
                            icon="truck"
                            color="emerald"
                            trendUp={trendBasuron.positivo}
                        />

                        {/* Aceite - Ámbar */}
                        <SimpleKpiCard
                            title="Aceite Usado"
                            value={`${stats.totalAceiteUsado.toLocaleString()} L`}
                            subtitle="Litros recolectados"
                            icon="drop"
                            color="amber"
                            trendUp={trendAceite.positivo}
                        />
                    </div>

                    {/* Segunda fila - Filtros y Buques */}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                        <SimpleKpiCard
                            title="Filtros Aceite"
                            value={stats.filtrosAceite.toString()}
                            subtitle="Unidades"
                            icon="filter"
                            color="orange"
                        />
                        <SimpleKpiCard
                            title="Filtros Diesel"
                            value={stats.filtrosDiesel.toString()}
                            subtitle="Unidades"
                            icon="filter"
                            color="sky"
                        />
                        <SimpleKpiCard
                            title="Filtros Aire"
                            value={stats.filtrosAire.toString()}
                            subtitle="Unidades"
                            icon="filter"
                            color="teal"
                        />
                        <SimpleKpiCard
                            title="Buques"
                            value={`${stats.buquesActivos} / ${stats.totalBuques}`}
                            subtitle="Activos / Total"
                            icon="ship"
                            color="indigo"
                        />
                    </div>

                    {/* Gráficas Section */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        {/* Gráfica Principal (Barras) - Ocupa 2 columnas */}
                        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-start gap-3">
                                    <div>
                                        <h3 className="text-2xl font-bold text-gray-800">📊 Estadísticas de Residuos</h3>
                                        <p className="text-base text-gray-400 mt-1">Comparativa mensual de Aceite vs Basura</p>
                                    </div>
                                    <InfoTooltip
                                        title="¿Qué muestra esta gráfica?"
                                        description="Esta gráfica de barras muestra la cantidad de residuos recolectados cada mes. El azul representa la basura general (kg) y el gris el aceite usado (litros). Las barras más altas indican meses con mayor recolección."
                                        examples={[
                                            "Barra alta = mucha recolección ese mes",
                                            "Pasa el mouse sobre cada barra para ver los detalles exactos"
                                        ]}
                                    />
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex items-center gap-2 text-base text-gray-600">
                                        <span className="w-4 h-4 rounded-full bg-blue-500"></span> 
                                        <span className="font-medium">Basura (kg)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-base text-gray-600">
                                        <span className="w-4 h-4 rounded-full bg-amber-400"></span> 
                                        <span className="font-medium">Aceite (L)</span>
                                    </div>
                                </div>
                            </div>

                            {/* Nombres de meses */}
                            {(() => {
                                const nombresMeses: { [key: string]: string } = {
                                    '01': 'Ene', '02': 'Feb', '03': 'Mar', '04': 'Abr',
                                    '05': 'May', '06': 'Jun', '07': 'Jul', '08': 'Ago',
                                    '09': 'Sep', '10': 'Oct', '11': 'Nov', '12': 'Dic'
                                };
                                const maxVal = Math.max(...initialStats.residuosPorMes.map(m => m.aceite + m.basura), 1);

                                return (
                                    <div className="h-72 flex items-end justify-between gap-3 px-2">
                                        {initialStats.residuosPorMes.map((mes) => {
                                            const total = mes.aceite + mes.basura;
                                            const heightPercent = Math.max((total / maxVal) * 100, 8);
                                            const mesNumero = mes.mes.split('-')[1];
                                            const nombreMes = nombresMeses[mesNumero] || mesNumero;
                                            const anio = mes.mes.split('-')[0];

                                            return (
                                                <div key={mes.mes} className="flex flex-col items-center flex-1 group relative h-full justify-end min-w-[50px]">
                                                    {/* Tooltip mejorado */}
                                                    <div className="absolute bottom-full mb-3 opacity-0 group-hover:opacity-100 transition-all duration-300 transform translate-y-2 group-hover:translate-y-0 z-20 pointer-events-none">
                                                        <div className="bg-gray-900 text-white text-sm py-3 px-4 rounded-xl shadow-2xl min-w-[140px]">
                                                            <p className="font-bold text-base mb-2 text-blue-300">{nombreMes} {anio}</p>
                                                            <div className="space-y-1">
                                                                <p className="flex justify-between gap-4">
                                                                    <span className="text-amber-300">🛢️ Aceite:</span> 
                                                                    <span className="font-bold">{mes.aceite.toLocaleString()} L</span>
                                                                </p>
                                                                <p className="flex justify-between gap-4">
                                                                    <span className="text-blue-300">🗑️ Basura:</span> 
                                                                    <span className="font-bold">{mes.basura.toLocaleString()} kg</span>
                                                                </p>
                                                                <div className="border-t border-gray-700 pt-1 mt-1">
                                                                    <p className="flex justify-between gap-4 text-emerald-300">
                                                                        <span>📦 Total:</span> 
                                                                        <span className="font-bold">{total.toLocaleString()}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-3 h-3 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                                    </div>

                                                    {/* Valor encima de la barra */}
                                                    <div className="text-sm font-bold text-gray-500 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {total.toLocaleString()}
                                                    </div>

                                                    {/* Barra con dos secciones */}
                                                    <div 
                                                        className="w-full max-w-[50px] relative rounded-xl overflow-hidden transition-all duration-500 hover:scale-105 cursor-pointer shadow-sm hover:shadow-lg" 
                                                        style={{ height: `${heightPercent}%` }}
                                                    >
                                                        {/* Sección Aceite (arriba - ámbar) */}
                                                        <div 
                                                            className="absolute top-0 w-full bg-gradient-to-b from-amber-300 to-amber-400 transition-all duration-1000"
                                                            style={{ height: `${(mes.aceite / (total || 1)) * 100}%` }}
                                                        />
                                                        {/* Sección Basura (abajo - azul) */}
                                                        <div
                                                            className="absolute bottom-0 w-full bg-gradient-to-b from-blue-400 to-blue-600 transition-all duration-1000"
                                                            style={{ height: `${(mes.basura / (total || 1)) * 100}%` }}
                                                        />
                                                    </div>

                                                    {/* Nombre del mes */}
                                                    <div className="mt-3 text-center">
                                                        <span className="text-base font-bold text-gray-700">{nombreMes}</span>
                                                        <span className="text-sm text-gray-400 block">{anio}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Línea de referencia y totales */}
                            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center">
                                <div className="text-base text-gray-500">
                                    <span className="font-medium">Total período:</span>{' '}
                                    <span className="font-bold text-gray-800 text-lg">
                                        {initialStats.residuosPorMes.reduce((sum, m) => sum + m.aceite + m.basura, 0).toLocaleString()}
                                    </span>
                                    <span className="text-gray-400"> kg + L</span>
                                </div>
                                <div className="text-sm text-gray-400">
                                    Pasa el mouse sobre las barras para ver detalles
                                </div>
                            </div>
                        </div>

                        {/* Gráfica Secundaria (Top Buques / Donut Style) */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50 flex flex-col">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">🚢 Top Buques</h3>
                                <InfoTooltip
                                    title="¿Qué significa Top Buques?"
                                    description="Muestra los 4 buques que más residuos han generado este mes. La barra indica la proporción respecto al buque con mayor cantidad."
                                    examples={[
                                        "El buque con barra más larga es el mayor generador",
                                        "Útil para identificar clientes frecuentes"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-gray-400 mb-8">Mayores generadores este mes</p>

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
                                                        <p className="font-bold text-gray-800 text-base">{buque.nombreBuque}</p>
                                                        <p className="text-sm text-gray-400">{buque.cantidadManifiestos} entregas</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-gray-700 text-base">{buque.totalKg.toFixed(0)} kg</span>
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

                            <button className="mt-8 w-full py-3.5 rounded-xl border border-gray-200 text-base font-semibold text-gray-600 hover:bg-gray-50 transition-colors">
                                Ver reporte completo
                            </button>
                        </div>
                    </div>

                    {/* Segunda fila de gráficas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfica de Distribución por Tipo (Dona) */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">🍩 Distribución por Tipo</h3>
                                <InfoTooltip
                                    title="¿Cómo leer la gráfica de dona?"
                                    description="El círculo muestra qué proporción ocupa cada tipo de residuo del total. Cada color representa un tipo diferente: amarillo es aceite, azul es basura general y verde es el basurón."
                                    examples={[
                                        "Sección más grande = tipo de residuo más recolectado",
                                        "El número del centro es el total en kg"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-gray-400 mb-6">Proporción de residuos recolectados</p>
                            
                            <div className="flex items-center justify-center gap-8">
                                {/* Gráfica de Dona */}
                                <div className="relative w-52 h-52">
                                    <DonutChart 
                                        data={[
                                            { label: 'Aceite', value: stats.totalAceiteUsado, color: '#F59E0B' },
                                            { label: 'Basura', value: stats.totalBasuraGeneral, color: '#3B82F6' },
                                            { label: 'Basurón', value: stats.totalBasuron, color: '#10B981' },
                                        ]}
                                    />
                                    <div className="absolute inset-0 flex items-center justify-center flex-col">
                                        <span className="text-2xl font-bold text-gray-800">{stats.totalResiduosReciclados.toLocaleString()}</span>
                                        <span className="text-sm text-gray-400">kg total</span>
                                    </div>
                                </div>
                                
                                {/* Leyenda */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-amber-500"></div>
                                        <div>
                                            <p className="text-base font-medium text-gray-700">Aceite Usado</p>
                                            <p className="text-sm text-gray-400">{stats.totalAceiteUsado.toLocaleString()} L</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-blue-500"></div>
                                        <div>
                                            <p className="text-base font-medium text-gray-700">Basura General</p>
                                            <p className="text-sm text-gray-400">{stats.totalBasuraGeneral.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-emerald-500"></div>
                                        <div>
                                            <p className="text-base font-medium text-gray-700">Basurón</p>
                                            <p className="text-sm text-gray-400">{stats.totalBasuron.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gráfica de Filtros Recolectados */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">🔧 Filtros Recolectados</h3>
                                <InfoTooltip
                                    title="¿Qué son los filtros?"
                                    description="Los filtros son componentes de los motores que deben ser reemplazados y reciclados. Hay 3 tipos: de aceite (retienen impurezas), de diesel (limpian el combustible) y de aire (filtran partículas)."
                                    examples={[
                                        "Barra más larga = más filtros de ese tipo",
                                        "Se miden en unidades (uds)"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-gray-400 mb-6">Desglose por tipo de filtro</p>
                            
                            <div className="space-y-6">
                                {/* Filtros Aceite */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-base font-medium text-gray-700">Filtros de Aceite</span>
                                        <span className="text-base font-bold text-amber-600">{stats.filtrosAceite} uds</span>
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
                                        <span className="text-base font-medium text-gray-700">Filtros de Diesel</span>
                                        <span className="text-base font-bold text-blue-600">{stats.filtrosDiesel} uds</span>
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
                                        <span className="text-base font-medium text-gray-700">Filtros de Aire</span>
                                        <span className="text-base font-bold text-emerald-600">{stats.filtrosAire} uds</span>
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
                                        <span className="text-base font-bold text-gray-800">Total Filtros</span>
                                        <span className="text-xl font-bold text-gray-800">{(stats.filtrosAceite + stats.filtrosDiesel + stats.filtrosAire).toLocaleString()} uds</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tercera fila - Comparación y Métricas Ambientales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparación vs Período Anterior */}
                        <div className="bg-white p-8 rounded-3xl border border-gray-100 shadow-lg shadow-gray-100/50">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-bold text-gray-800">📈 Comparación vs Período Anterior</h3>
                                <InfoTooltip
                                    title="¿Qué compara esta gráfica?"
                                    description="Compara los residuos del período actual con el período anterior (ej: este mes vs mes pasado). El porcentaje verde indica aumento y rojo indica disminución."
                                    examples={[
                                        "↑ 15% = 15% más que el período anterior",
                                        "↓ 10% = 10% menos que el período anterior"
                                    ]}
                                />
                            </div>
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
                        <div className="bg-gradient-to-br from-emerald-500 to-teal-600 p-8 rounded-3xl shadow-xl shadow-emerald-200 text-white relative">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-bold">🌍 Impacto Ambiental</h3>
                                <div className="relative inline-block">
                                    <button
                                        className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/40 text-white flex items-center justify-center transition-all duration-200 text-sm font-bold group hover:scale-110"
                                        title="Cada litro de aceite contamina 1,000L de agua. Aquí calculamos el impacto positivo de tu reciclaje."
                                    >
                                        ?
                                        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                            <span className="block bg-gray-900 text-white rounded-2xl p-4 shadow-2xl text-sm border border-gray-700">
                                                <strong className="text-base">¿Cómo calculamos esto?</strong><br/><br/>
                                                • CO₂: Aceite × 2.5 + Basurón × 0.5<br/>
                                                • Árboles: CO₂ ÷ 21 kg/año<br/>
                                                • Agua: 1L aceite = 1,000L agua protegida
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-emerald-100 text-base mb-6">Contribución al medio ambiente</p>
                            
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                {/* CO2 Evitado - Expandible */}
                                <ExpandableImpactCard
                                    emoji="🌱"
                                    value={((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)).toFixed(0)}
                                    unit="kg"
                                    label="CO₂ evitado"
                                    comparisons={[
                                        {
                                            icon: "🚗",
                                            value: Math.round(((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)) / 0.21),
                                            text: "km en auto evitados",
                                            detail: "Un auto emite ~0.21 kg CO₂/km"
                                        },
                                        {
                                            icon: "✈️",
                                            value: Math.round(((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)) / 255),
                                            text: "vuelos Madrid-Barcelona",
                                            detail: "Un vuelo corto ≈ 255 kg CO₂"
                                        },
                                        {
                                            icon: "🏠",
                                            value: Math.round(((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)) / 150),
                                            text: "meses de luz de un hogar",
                                            detail: "Hogar promedio ≈ 150 kg CO₂/mes"
                                        }
                                    ]}
                                />
                                
                                {/* Árboles equivalentes - Expandible */}
                                <ExpandableImpactCard
                                    emoji="🌳"
                                    value={Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21).toString()}
                                    unit=""
                                    label="Árboles equivalentes"
                                    comparisons={[
                                        {
                                            icon: "🌲",
                                            value: Math.round(Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21) * 25),
                                            text: "m² de bosque",
                                            detail: "Cada árbol ocupa ~25 m² de bosque"
                                        },
                                        {
                                            icon: "⚽",
                                            value: parseFloat((Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21) * 25 / 7140).toFixed(2)),
                                            text: "campos de fútbol",
                                            detail: "Un campo mide ~7,140 m²"
                                        },
                                        {
                                            icon: "🏞️",
                                            value: Math.round(Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21) / 400),
                                            text: "hectáreas de bosque",
                                            detail: "~400 árboles por hectárea"
                                        }
                                    ]}
                                />
                                
                                {/* Litros de agua protegidos - Expandible */}
                                <ExpandableImpactCard
                                    emoji="💧"
                                    value={(stats.totalAceiteUsado * 1000).toLocaleString()}
                                    unit=""
                                    label="Litros de agua protegidos"
                                    comparisons={[
                                        {
                                            icon: "🏊",
                                            value: Math.round((stats.totalAceiteUsado * 1000) / 50000),
                                            text: "piscinas olímpicas",
                                            detail: "Una piscina ≈ 50,000 litros"
                                        },
                                        {
                                            icon: "🚿",
                                            value: Math.round((stats.totalAceiteUsado * 1000) / 65).toLocaleString(),
                                            text: "duchas de 5 min",
                                            detail: "Una ducha usa ~65 litros"
                                        },
                                        {
                                            icon: "👨‍👩‍👧‍👦",
                                            value: Math.round((stats.totalAceiteUsado * 1000) / 150),
                                            text: "días de agua familiar",
                                            detail: "Familia usa ~150 L/día"
                                        }
                                    ]}
                                />
                                
                                {/* Residuos reciclados - Expandible */}
                                <ExpandableImpactCard
                                    emoji="♻️"
                                    value={stats.totalResiduosReciclados.toLocaleString()}
                                    unit="kg"
                                    label="kg reciclados total"
                                    comparisons={[
                                        {
                                            icon: "🐘",
                                            value: parseFloat((stats.totalResiduosReciclados / 5000).toFixed(1)),
                                            text: "elefantes de peso",
                                            detail: "Un elefante ≈ 5,000 kg"
                                        },
                                        {
                                            icon: "🚛",
                                            value: Math.round(stats.totalResiduosReciclados / 8000),
                                            text: "camiones de basura",
                                            detail: "Camión carga ~8,000 kg"
                                        },
                                        {
                                            icon: "🏢",
                                            value: Math.round(stats.totalResiduosReciclados / 500),
                                            text: "oficinas por mes",
                                            detail: "Oficina genera ~500 kg/mes"
                                        }
                                    ]}
                                />
                            </div>
                            
                            <div className="mt-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl">
                                <p className="text-sm text-emerald-100">
                                    <span className="font-bold text-white">💡 Tip:</span> Pasa el mouse sobre cada tarjeta para ver comparaciones con objetos del mundo real.
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
                            <p className="text-base text-gray-400 mt-1">Genera y exporta datos detallados</p>
                        </div>
                        <button className="p-2 bg-gray-50 rounded-xl text-gray-500 hover:bg-gray-100">
                            <Icons.Settings className="w-6 h-6" />
                        </button>
                    </div>

                    {/* Filtros Estilizados */}
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8 p-6 bg-gray-50/50 rounded-2xl border border-gray-100">
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Desde</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-white border-none rounded-xl shadow-sm text-base focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-600"
                                value={filters.fechaInicio}
                                onChange={e => setFilters({ ...filters, fechaInicio: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Hasta</label>
                            <input
                                type="date"
                                className="w-full px-4 py-3 bg-white border-none rounded-xl shadow-sm text-base focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-600"
                                value={filters.fechaFin}
                                onChange={e => setFilters({ ...filters, fechaFin: e.target.value })}
                            />
                        </div>
                        <div className="space-y-2">
                            <label className="text-sm font-bold text-gray-500 uppercase tracking-wider">Buque</label>
                            <div className="relative">
                                <select
                                    className="w-full px-4 py-3 bg-white border-none rounded-xl shadow-sm text-base focus:ring-2 focus:ring-blue-500/20 outline-none text-gray-600 appearance-none"
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
                                className="flex-1 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:opacity-50 font-bold text-base shadow-lg shadow-blue-200 transition-all transform active:scale-95"
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
                                className="flex items-center gap-2 px-5 py-2.5 bg-emerald-50 text-emerald-700 rounded-xl hover:bg-emerald-100 font-semibold text-base transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                </svg>
                                Exportar CSV
                            </button>
                            <button
                                onClick={() => exportToPDF(reportData, stats)}
                                className="flex items-center gap-2 px-5 py-2.5 bg-red-50 text-red-700 rounded-xl hover:bg-red-100 font-semibold text-base transition-colors"
                            >
                                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                                </svg>
                                Exportar PDF
                            </button>
                        </div>
                    )}

                    {/* Tabla de Resultados Premium */}
                    <div className="overflow-hidden rounded-2xl border border-gray-100">
                        <table className="w-full text-base text-left">
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
                                        <td colSpan={6} className="px-6 py-12 text-center text-gray-400 text-base">
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
                                            <td className="px-6 py-4 font-mono text-sm text-gray-400 group-hover:text-blue-600 transition-colors">{item.folio}</td>
                                            <td className="px-6 py-4 font-medium text-gray-800">{item.buque}</td>
                                            <td className="px-6 py-4 text-gray-600">{item.tipoResiduo}</td>
                                            <td className="px-6 py-4 text-right font-bold text-gray-800">
                                                {item.cantidad} <span className="text-sm font-normal text-gray-400 ml-1">{item.unidad}</span>
                                            </td>
                                            <td className="px-6 py-4">
                                                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold ${item.estado === 'completado'
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

// Componente de Tarjeta de Impacto Expandible
interface ImpactComparison {
    icon: string;
    value: number | string;
    text: string;
    detail: string;
}

interface ExpandableImpactCardProps {
    emoji: string;
    value: string;
    unit: string;
    label: string;
    comparisons: ImpactComparison[];
}

function ExpandableImpactCard({ emoji, value, unit, label, comparisons }: ExpandableImpactCardProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div 
            className="relative"
            onMouseEnter={() => setIsOpen(true)}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Tarjeta base - tamaño fijo */}
            <div 
                className={`
                    bg-white/10 backdrop-blur-sm rounded-2xl p-5 cursor-pointer
                    transition-all duration-200
                    ${isOpen ? 'bg-white/25 shadow-lg shadow-black/20' : 'hover:bg-white/15'}
                `}
            >
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className="text-4xl">{emoji}</div>
                        <div>
                            <p className="text-2xl font-bold text-white">{value} {unit}</p>
                            <p className="text-emerald-100 text-sm">{label}</p>
                        </div>
                    </div>
                    <div className={`
                        w-8 h-8 rounded-full flex items-center justify-center text-base
                        transition-all duration-300
                        ${isOpen ? 'bg-white/40 rotate-180' : 'bg-white/15'}
                    `}>
                        ▼
                    </div>
                </div>
            </div>

            {/* Panel flotante que aparece encima */}
            {isOpen && (
                <div className="absolute left-0 right-0 top-full mt-2 z-50 animate-in fade-in slide-in-from-top-2 duration-200">
                    <div className="bg-gray-900 rounded-2xl p-5 shadow-2xl shadow-black/40 border border-gray-700/50">
                        {/* Flecha apuntando arriba */}
                        <div className="absolute -top-2 left-8 w-4 h-4 bg-gray-900 rotate-45 border-l border-t border-gray-700/50"></div>
                        
                        <p className="text-base text-gray-400 font-medium mb-4 flex items-center gap-2">
                            <span className="text-2xl">{emoji}</span> 
                            <span>Esto equivale a:</span>
                        </p>
                        
                        <div className="space-y-3">
                            {comparisons.map((comparison, idx) => (
                                <div 
                                    key={idx} 
                                    className="flex items-center gap-4 bg-gray-800 rounded-xl px-5 py-4 hover:bg-gray-700 transition-colors"
                                >
                                    <span className="text-3xl">{comparison.icon}</span>
                                    <div>
                                        <p className="text-white">
                                            <span className="font-bold text-2xl">
                                                {typeof comparison.value === 'number' ? comparison.value.toLocaleString() : comparison.value}
                                            </span>
                                            <span className="text-gray-300 text-lg ml-2">{comparison.text}</span>
                                        </p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

// Componente de Tooltip de Información
interface InfoTooltipProps {
    title: string;
    description: string;
    examples?: string[];
}

function InfoTooltip({ title, description, examples }: InfoTooltipProps) {
    const [isOpen, setIsOpen] = useState(false);

    return (
        <div className="relative inline-block">
            <button
                onClick={() => setIsOpen(!isOpen)}
                onMouseEnter={() => setIsOpen(true)}
                onMouseLeave={() => setIsOpen(false)}
                className="w-8 h-8 rounded-full bg-blue-100 hover:bg-blue-500 text-blue-500 hover:text-white flex items-center justify-center transition-all duration-200 text-sm font-bold shadow-md hover:shadow-lg hover:scale-110"
                aria-label="Más información"
            >
                ?
            </button>
            
            {isOpen && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-gray-900 text-white rounded-2xl p-5 shadow-2xl shadow-black/30 border border-gray-700">
                        <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                            <span className="w-7 h-7 rounded-full bg-blue-500 flex items-center justify-center text-sm">💡</span>
                            {title}
                        </h4>
                        <p className="text-gray-300 text-sm leading-relaxed mb-3">{description}</p>
                        {examples && examples.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-gray-700">
                                <p className="text-gray-400 text-sm font-medium mb-2">Ejemplo:</p>
                                <ul className="text-sm text-gray-300 space-y-2">
                                    {examples.map((ex, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <span className="text-green-400 text-base">✓</span>
                                            {ex}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Flecha */}
                    <div className="w-4 h-4 bg-gray-900 transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-2 border-b border-r border-gray-700"></div>
                </div>
            )}
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
                <span className="text-base font-medium text-gray-700">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-gray-800">{actual.toLocaleString()} {unit}</span>
                    <span className={`text-sm font-bold px-2.5 py-1 rounded-lg ${positivo ? 'bg-green-100 text-green-600' : 'bg-red-100 text-red-600'}`}>
                        {positivo ? '↑' : '↓'} {Math.abs(cambio).toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="relative h-5 flex gap-1">
                {/* Barra actual */}
                <div className="flex-1 bg-gray-100 rounded-full overflow-hidden">
                    <div 
                        className={`h-full ${colorClasses[color].bg} rounded-full transition-all duration-1000`}
                        style={{ width: `${actualPercent}%` }}
                    ></div>
                </div>
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-sm text-gray-400">Actual</span>
                <span className="text-sm text-gray-400">Anterior: {anterior.toLocaleString()} {unit}</span>
            </div>
        </div>
    );
}

// Iconos SVG simples y grandes
const SimpleIcons = {
    recycle: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
        </svg>
    ),
    document: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
    ),
    truck: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7h12l2 5h-2v4a1 1 0 01-1 1h-1a2 2 0 11-4 0h-4a2 2 0 11-4 0H5a1 1 0 01-1-1V9a2 2 0 012-2h2z" />
        </svg>
    ),
    drop: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 3c-4 4-6 7-6 10a6 6 0 1012 0c0-3-2-6-6-10z" />
        </svg>
    ),
    filter: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
    ),
    ship: (
        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 17l3-1.5L9 17l3-1.5 3 1.5 3-1.5 3 1.5M12 3v4m0 0L8 9h8l-4-2zm-6 6v5l6 3 6-3V9" />
        </svg>
    ),
};

// Componente de Tarjeta KPI Simple con colores
interface SimpleKpiCardProps {
    title: string;
    value: string;
    subtitle: string;
    icon: keyof typeof SimpleIcons;
    color: 'blue' | 'violet' | 'emerald' | 'amber' | 'orange' | 'sky' | 'teal' | 'indigo';
    trendUp?: boolean;
}

const colorConfig = {
    blue: {
        bg: 'bg-blue-50',
        bgHover: 'hover:bg-blue-500',
        icon: 'text-blue-500',
        iconHover: 'group-hover:text-white',
        border: 'border-blue-100',
        shadow: 'hover:shadow-blue-200',
    },
    violet: {
        bg: 'bg-violet-50',
        bgHover: 'hover:bg-violet-500',
        icon: 'text-violet-500',
        iconHover: 'group-hover:text-white',
        border: 'border-violet-100',
        shadow: 'hover:shadow-violet-200',
    },
    emerald: {
        bg: 'bg-emerald-50',
        bgHover: 'hover:bg-emerald-500',
        icon: 'text-emerald-500',
        iconHover: 'group-hover:text-white',
        border: 'border-emerald-100',
        shadow: 'hover:shadow-emerald-200',
    },
    amber: {
        bg: 'bg-amber-50',
        bgHover: 'hover:bg-amber-500',
        icon: 'text-amber-500',
        iconHover: 'group-hover:text-white',
        border: 'border-amber-100',
        shadow: 'hover:shadow-amber-200',
    },
    orange: {
        bg: 'bg-orange-50',
        bgHover: 'hover:bg-orange-500',
        icon: 'text-orange-500',
        iconHover: 'group-hover:text-white',
        border: 'border-orange-100',
        shadow: 'hover:shadow-orange-200',
    },
    sky: {
        bg: 'bg-sky-50',
        bgHover: 'hover:bg-sky-500',
        icon: 'text-sky-500',
        iconHover: 'group-hover:text-white',
        border: 'border-sky-100',
        shadow: 'hover:shadow-sky-200',
    },
    teal: {
        bg: 'bg-teal-50',
        bgHover: 'hover:bg-teal-500',
        icon: 'text-teal-500',
        iconHover: 'group-hover:text-white',
        border: 'border-teal-100',
        shadow: 'hover:shadow-teal-200',
    },
    indigo: {
        bg: 'bg-indigo-50',
        bgHover: 'hover:bg-indigo-500',
        icon: 'text-indigo-500',
        iconHover: 'group-hover:text-white',
        border: 'border-indigo-100',
        shadow: 'hover:shadow-indigo-200',
    },
};

function SimpleKpiCard({ title, value, subtitle, icon, color, trendUp }: SimpleKpiCardProps) {
    const colors = colorConfig[color];

    return (
        <div className={`group bg-white p-6 rounded-2xl border ${colors.border} shadow-md ${colors.shadow} hover:shadow-xl transition-all duration-300 cursor-pointer ${colors.bgHover}`}>
            {/* Icono grande */}
            <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-4 ${colors.icon} ${colors.iconHover} transition-colors duration-300 group-hover:bg-white/20`}>
                {SimpleIcons[icon]}
            </div>
            
            {/* Título */}
            <p className="text-gray-500 text-base font-medium mb-1 group-hover:text-white/80 transition-colors">{title}</p>
            
            {/* Valor grande */}
            <p className="text-4xl font-bold text-gray-800 mb-2 group-hover:text-white transition-colors">{value}</p>
            
            {/* Subtítulo */}
            <p className="text-base text-gray-400 group-hover:text-white/70 transition-colors">{subtitle}</p>
        </div>
    );
}


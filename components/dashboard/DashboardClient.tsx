'use client';

import { useState, useEffect, useRef } from 'react';
import DatePicker, { registerLocale } from 'react-datepicker';
import { es } from 'date-fns/locale';
import 'react-datepicker/dist/react-datepicker.css';
import { DashboardStats, ReporteDetalladoItem, Comparaciones } from '@/types/dashboard';

// Registrar locale español para el DatePicker
registerLocale('es', es);
import {
    getReporteComplejo,
    getDashboardKPIsFiltered,
    getComparacionPeriodoAnterior,
    PeriodoFiltro,
    FiltrosDashboard
} from '@/lib/services/dashboard_stats';
import { Icons } from '@/components/ui/Icons';
import { Building2, Car, Check, Droplet, Droplets, House, LandPlot, Lightbulb, Mountain, Plane, Recycle, ShowerHead, Sprout, Trash2, TreeDeciduous, TreePine, Truck, Users, Waves, Weight, type LucideIcon } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parseFechaLocal } from '@/lib/utils/fechas';

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

    // Acceso rápido seleccionado
    const [accesoRapidoSeleccionado, setAccesoRapidoSeleccionado] = useState<string | null>(null);

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

    // Función para exportar a Excel
    const exportToExcel = async (data: ReporteDetalladoItem[]) => {
        try {
            const XLSX = await import('xlsx');

            // Preparar datos para Excel
            const exportData = data.map(item => ({
                'Fecha': parseFechaLocal(item.fecha).toLocaleDateString(),
                'Folio': item.folio,
                'Buque': item.buque,
                'Tipo Residuo': item.tipoResiduo,
                'Cantidad': item.cantidad,
                'Unidad': item.unidad,
                'Estado': item.estado,
                'Responsable': item.responsable
            }));

            // Crear libro y hoja
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(exportData);

            // Ajustar ancho de columnas
            const wscols = [
                { wch: 12 }, // Fecha
                { wch: 15 }, // Folio
                { wch: 25 }, // Buque
                { wch: 20 }, // Tipo
                { wch: 10 }, // Cantidad
                { wch: 8 },  // Unidad
                { wch: 12 }, // Estado
                { wch: 25 }, // Responsable
            ];
            ws['!cols'] = wscols;

            XLSX.utils.book_append_sheet(wb, ws, "Reporte Residuos");

            // Descargar archivo
            XLSX.writeFile(wb, `Reporte_Residuos_${new Date().toISOString().split('T')[0]}.xlsx`);

        } catch (error) {
            console.error("Error exportando a Excel:", error);
            alert("Error al generar el archivo Excel");
        }
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
                <h1>Reporte de Residuos</h1>
                <p>Generado el ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
                
                <h2>Resumen General</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${statsData.totalResiduosReciclados.toLocaleString()} kg</div>
                        <div class="stat-label">Total Procesado</div>
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
                                <td>${parseFechaLocal(item.fecha).toLocaleDateString()}</td>
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
        <div className="space-y-8 font-sans text-simar-texto-2">
            {/* Tabs de Navegación Estilizados */}
            <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex space-x-2 bg-simar-superficie p-2 rounded-2xl shadow-simar border border-simar-borde">
                    <button
                        onClick={() => setActiveTab('general')}
                        className={`min-h-[52px] px-8 text-lg font-bold rounded-xl transition-colors ${activeTab === 'general'
                            ? 'bg-simar-marea text-white shadow-simar'
                            : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                            }`}
                    >
                        Estadísticas
                    </button>
                    <button
                        onClick={() => setActiveTab('reportes')}
                        className={`min-h-[52px] px-8 text-lg font-bold rounded-xl transition-colors ${activeTab === 'reportes'
                            ? 'bg-simar-marea text-white shadow-simar'
                            : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                            }`}
                    >
                        Reportes
                    </button>
                </div>

                {/* Selector de Período */}
                {activeTab === 'general' && (
                    <div className="flex items-center gap-3">
                        <span className="text-[17px] text-simar-texto font-bold">Período:</span>
                        <div className="flex space-x-1 bg-simar-superficie p-1.5 rounded-xl shadow-simar border border-simar-borde">
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
                                    className={`min-h-[44px] px-4 text-base font-bold rounded-lg transition-colors ${periodoSeleccionado === p.key
                                        ? 'bg-simar-marea text-white shadow-simar'
                                        : 'text-simar-texto-2 hover:bg-simar-papel'
                                        }`}
                                >
                                    {p.label}
                                </button>
                            ))}
                        </div>
                        {loadingStats && (
                            <div className="animate-spin w-5 h-5 border-2 border-simar-marea-tinta border-t-transparent rounded-full"></div>
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
                            title="Total procesado"
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
                            title="Aceite usado"
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
                            title="Filtros de aceite"
                            value={stats.filtrosAceite.toString()}
                            subtitle="Unidades"
                            icon="filter"
                            color="orange"
                        />
                        <SimpleKpiCard
                            title="Filtros de diésel"
                            value={stats.filtrosDiesel.toString()}
                            subtitle="Unidades"
                            icon="filter"
                            color="sky"
                        />
                        <SimpleKpiCard
                            title="Filtros de aire"
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
                        <div className="lg:col-span-2 bg-simar-superficie p-8 rounded-3xl border border-simar-borde shadow-simar">
                            <div className="flex justify-between items-center mb-8">
                                <div className="flex items-start gap-3">
                                    <div>
                                        <h3 className="text-2xl font-extrabold text-simar-texto">Estadísticas de residuos</h3>
                                        <p className="text-base text-simar-texto-2 mt-1">Comparativa mensual de Aceite vs Basura</p>
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
                                    <div className="flex items-center gap-2 text-base text-simar-texto-2">
                                        <span className="w-4 h-4 rounded-full bg-simar-marea"></span>
                                        <span className="font-medium">Basura (kg)</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-base text-simar-texto-2">
                                        <span className="w-4 h-4 rounded-full bg-simar-coral-suave"></span>
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
                                                        <div className="bg-simar-abismo text-white text-base py-3 px-4 rounded-xl shadow-2xl min-w-[140px]">
                                                            <p className="font-bold text-base mb-2 text-simar-marea-tinta">{nombreMes} {anio}</p>
                                                            <div className="space-y-1">
                                                                <p className="flex justify-between gap-4">
                                                                    <span className="text-simar-coral">Aceite:</span>
                                                                    <span className="font-bold">{mes.aceite.toLocaleString()} L</span>
                                                                </p>
                                                                <p className="flex justify-between gap-4">
                                                                    <span className="text-simar-marea-tinta">Basura:</span>
                                                                    <span className="font-bold">{mes.basura.toLocaleString()} kg</span>
                                                                </p>
                                                                <div className="border-t border-simar-texto-2 pt-1 mt-1">
                                                                    <p className="flex justify-between gap-4 text-simar-arrecife-tinta">
                                                                        <span>Total:</span>
                                                                        <span className="font-bold">{total.toLocaleString()}</span>
                                                                    </p>
                                                                </div>
                                                            </div>
                                                        </div>
                                                        <div className="w-3 h-3 bg-simar-abismo transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-1"></div>
                                                    </div>

                                                    {/* Valor encima de la barra */}
                                                    <div className="text-base font-bold text-simar-texto-2 mb-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                                        {total.toLocaleString()}
                                                    </div>

                                                    {/* Barra con dos secciones */}
                                                    <div
                                                        className="w-full max-w-[50px] relative rounded-xl overflow-hidden transition-all duration-500 cursor-pointer shadow-simar"
                                                        style={{ height: `${heightPercent}%` }}
                                                    >
                                                        {/* Sección Aceite (arriba - ámbar) */}
                                                        <div
                                                            className="absolute top-0 w-full bg-simar-coral-suave transition-all duration-1000"
                                                            style={{ height: `${(mes.aceite / (total || 1)) * 100}%` }}
                                                        />
                                                        {/* Sección Basura (abajo - azul) */}
                                                        <div
                                                            className="absolute bottom-0 w-full bg-simar-marea-suave transition-all duration-1000"
                                                            style={{ height: `${(mes.basura / (total || 1)) * 100}%` }}
                                                        />
                                                    </div>

                                                    {/* Nombre del mes */}
                                                    <div className="mt-3 text-center">
                                                        <span className="text-base font-bold text-simar-texto">{nombreMes}</span>
                                                        <span className="text-base text-simar-texto-2 block">{anio}</span>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                );
                            })()}

                            {/* Línea de referencia y totales */}
                            <div className="mt-6 pt-4 border-t border-simar-borde flex justify-between items-center">
                                <div className="text-base text-simar-texto-2">
                                    <span className="font-medium">Total período:</span>{' '}
                                    <span className="font-bold text-simar-texto text-lg">
                                        {initialStats.residuosPorMes.reduce((sum, m) => sum + m.aceite + m.basura, 0).toLocaleString()}
                                    </span>
                                    <span className="text-simar-texto-2"> kg + L</span>
                                </div>
                                <div className="text-base text-simar-texto-2">
                                    Pasa el mouse sobre las barras para ver detalles
                                </div>
                            </div>
                        </div>

                        {/* Gráfica Secundaria (Top Buques / Donut Style) */}
                        <div className="bg-simar-superficie p-8 rounded-3xl border border-simar-borde shadow-simar flex flex-col">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-extrabold text-simar-texto">Buques con más residuos</h3>
                                <InfoTooltip
                                    title="¿Qué significa Top Buques?"
                                    description="Muestra los 4 buques que más residuos han generado este mes. La barra indica la proporción respecto al buque con mayor cantidad."
                                    examples={[
                                        "El buque con barra más larga es el mayor generador",
                                        "Útil para identificar clientes frecuentes"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-simar-texto-2 mb-8">Mayores generadores este mes</p>

                            <div className="flex-1 flex flex-col justify-center space-y-6">
                                {initialStats.topBuques.slice(0, 4).map((buque, idx) => {
                                    const maxVal = Math.max(...initialStats.topBuques.map(b => b.totalKg));
                                    const width = maxVal > 0 ? (buque.totalKg / maxVal) * 100 : 0;
                                    const colors = ['bg-simar-marea', 'bg-simar-marea', 'bg-[#5B3FA8]', 'bg-[#5B3FA8]'];

                                    return (
                                        <div key={buque.buqueId} className="group">
                                            <div className="flex justify-between items-end mb-2">
                                                <div className="flex items-center gap-3">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white font-bold text-base shadow-simar ${colors[idx % colors.length]}`}>
                                                        {buque.nombreBuque.substring(0, 2).toUpperCase()}
                                                    </div>
                                                    <div>
                                                        <p className="font-bold text-simar-texto text-base">{buque.nombreBuque}</p>
                                                        <p className="text-base text-simar-texto-2">{buque.cantidadManifiestos} entregas</p>
                                                    </div>
                                                </div>
                                                <span className="font-bold text-simar-texto text-base">{buque.totalKg.toFixed(0)} kg</span>
                                            </div>
                                            <div className="w-full bg-simar-papel rounded-full h-2 overflow-hidden">
                                                <div
                                                    className={`h-full rounded-full ${colors[idx % colors.length]} opacity-80 group-hover:opacity-100 transition-all duration-500`}
                                                    style={{ width: `${width}%` }}
                                                ></div>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>

                            <button
                                onClick={() => setActiveTab('reportes')}
                                className="mt-8 w-full py-3.5 rounded-xl border border-simar-borde text-base font-bold text-simar-texto-2 hover:bg-simar-papel transition-colors min-h-[52px]"
                            >
                                Ver reporte completo
                            </button>
                        </div>
                    </div>

                    {/* Segunda fila de gráficas */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Gráfica de Distribución por Tipo (Dona) */}
                        <div className="bg-simar-superficie p-8 rounded-3xl border border-simar-borde shadow-simar">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-extrabold text-simar-texto">Distribución por tipo</h3>
                                <InfoTooltip
                                    title="¿Cómo leer la gráfica de dona?"
                                    description="El círculo muestra qué proporción ocupa cada tipo de residuo del total. Cada color representa un tipo diferente: amarillo es aceite, azul es basura general y verde es el basurón."
                                    examples={[
                                        "Sección más grande = tipo de residuo más recolectado",
                                        "El número del centro es el total en kg"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-simar-texto-2 mb-6">Proporción de residuos recolectados</p>

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
                                        <span className="text-2xl font-extrabold text-simar-texto">{stats.totalResiduosReciclados.toLocaleString()}</span>
                                        <span className="text-base text-simar-texto-2">kg total</span>
                                    </div>
                                </div>

                                {/* Leyenda */}
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#A63F0E]"></div>
                                        <div>
                                            <p className="text-base font-medium text-simar-texto">Aceite Usado</p>
                                            <p className="text-base text-simar-texto-2">{stats.totalAceiteUsado.toLocaleString()} L</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-simar-marea"></div>
                                        <div>
                                            <p className="text-base font-medium text-simar-texto">Basura General</p>
                                            <p className="text-base text-simar-texto-2">{stats.totalBasuraGeneral.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-5 h-5 rounded-full bg-[#127A5D]"></div>
                                        <div>
                                            <p className="text-base font-medium text-simar-texto">Basurón</p>
                                            <p className="text-base text-simar-texto-2">{stats.totalBasuron.toLocaleString()} kg</p>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Gráfica de Filtros Recolectados */}
                        <div className="bg-simar-superficie p-8 rounded-3xl border border-simar-borde shadow-simar">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-extrabold text-simar-texto">Filtros recolectados</h3>
                                <InfoTooltip
                                    title="¿Qué son los filtros?"
                                    description="Los filtros son componentes de los motores que deben ser reemplazados y reciclados. Hay 3 tipos: de aceite (retienen impurezas), de diesel (limpian el combustible) y de aire (filtran partículas)."
                                    examples={[
                                        "Barra más larga = más filtros de ese tipo",
                                        "Se miden en unidades (uds)"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-simar-texto-2 mb-6">Desglose por tipo de filtro</p>

                            <div className="space-y-6">
                                {/* Filtros Aceite */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-base font-medium text-simar-texto">Filtros de Aceite</span>
                                        <span className="text-base font-bold text-simar-coral">{stats.filtrosAceite} uds</span>
                                    </div>
                                    <div className="w-full bg-simar-papel rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-simar-coral-suave rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.filtrosAceite / Math.max(stats.filtrosAceite, stats.filtrosDiesel, stats.filtrosAire, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Filtros Diesel */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-base font-medium text-simar-texto">Filtros de Diesel</span>
                                        <span className="text-base font-bold text-simar-marea-tinta">{stats.filtrosDiesel} uds</span>
                                    </div>
                                    <div className="w-full bg-simar-papel rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-simar-marea-suave rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.filtrosDiesel / Math.max(stats.filtrosAceite, stats.filtrosDiesel, stats.filtrosAire, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Filtros Aire */}
                                <div>
                                    <div className="flex justify-between mb-2">
                                        <span className="text-base font-medium text-simar-texto">Filtros de Aire</span>
                                        <span className="text-base font-bold text-simar-arrecife-tinta">{stats.filtrosAire} uds</span>
                                    </div>
                                    <div className="w-full bg-simar-papel rounded-full h-3 overflow-hidden">
                                        <div
                                            className="h-full bg-simar-arrecife-suave rounded-full transition-all duration-1000"
                                            style={{ width: `${Math.min((stats.filtrosAire / Math.max(stats.filtrosAceite, stats.filtrosDiesel, stats.filtrosAire, 1)) * 100, 100)}%` }}
                                        ></div>
                                    </div>
                                </div>

                                {/* Total */}
                                <div className="pt-4 border-t border-simar-borde">
                                    <div className="flex justify-between">
                                        <span className="text-base font-bold text-simar-texto">Total Filtros</span>
                                        <span className="text-xl font-extrabold text-simar-texto">{(stats.filtrosAceite + stats.filtrosDiesel + stats.filtrosAire).toLocaleString()} uds</span>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Tercera fila - Comparación y Métricas Ambientales */}
                    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Comparación vs Período Anterior */}
                        <div className="bg-simar-superficie p-8 rounded-3xl border border-simar-borde shadow-simar">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-extrabold text-simar-texto">Comparación con el período anterior</h3>
                                <InfoTooltip
                                    title="¿Qué compara esta gráfica?"
                                    description="Compara los residuos del período actual con el período anterior (ej: este mes vs mes pasado). El porcentaje verde indica aumento y rojo indica disminución."
                                    examples={[
                                        "↑ 15% = 15% más que el período anterior",
                                        "↓ 10% = 10% menos que el período anterior"
                                    ]}
                                />
                            </div>
                            <p className="text-base text-simar-texto-2 mb-6">Evolución de residuos recolectados</p>

                            {comparaciones && (
                                <div className="space-y-5">
                                    {/* Total Reciclado */}
                                    <ComparisonBar
                                        label="Total Procesado"
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
                                <div className="flex items-center justify-center h-40 text-simar-texto-2">
                                    <p>Cargando comparación...</p>
                                </div>
                            )}
                        </div>

                        {/* Métricas de Impacto Ambiental */}
                        <div className="bg-[#127A5D] p-8 rounded-3xl shadow-simar text-white relative">
                            <div className="flex items-start gap-3 mb-2">
                                <h3 className="text-2xl font-extrabold">Impacto ambiental</h3>
                                <div className="relative inline-block">
                                    <button
                                        className="w-11 h-11 rounded-full bg-white/20 hover:bg-white/30 text-white flex items-center justify-center transition-all duration-200 text-base font-bold group"
                                        title="Cada litro de aceite contamina 1,000L de agua. Aquí calculamos el impacto positivo de tu reciclaje."
                                    >
                                        ?
                                        <span className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 w-72 opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity">
                                            <span className="block bg-simar-abismo text-white rounded-2xl p-4 shadow-2xl text-base border border-simar-texto-2">
                                                <strong className="text-base">¿Cómo calculamos esto?</strong><br /><br />
                                                • CO₂: Aceite × 2.5 + Basurón × 0.5<br />
                                                • Árboles: CO₂ ÷ 21 kg/año<br />
                                                • Agua: 1L aceite = 1,000L agua protegida
                                            </span>
                                        </span>
                                    </button>
                                </div>
                            </div>
                            <p className="text-white/85 text-base mb-6">Contribución al medio ambiente</p>

                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 items-stretch">
                                {/* CO2 Evitado - Expandible */}
                                <ExpandableImpactCard
                                    icono={Sprout}
                                    value={((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)).toFixed(0)}
                                    unit="kg"
                                    label="CO₂ evitado"
                                    comparisons={[
                                        {
                                            icon: Car,
                                            value: Math.round(((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)) / 0.21),
                                            text: "km en auto evitados",
                                            detail: "Un auto emite ~0.21 kg CO₂/km"
                                        },
                                        {
                                            icon: Plane,
                                            value: Math.round(((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)) / 255),
                                            text: "vuelos Madrid-Barcelona",
                                            detail: "Un vuelo corto ≈ 255 kg CO₂"
                                        },
                                        {
                                            icon: House,
                                            value: Math.round(((stats.totalAceiteUsado * 2.5) + (stats.totalBasuron * 0.5)) / 150),
                                            text: "meses de luz de un hogar",
                                            detail: "Hogar promedio ≈ 150 kg CO₂/mes"
                                        }
                                    ]}
                                />

                                {/* Árboles equivalentes - Expandible */}
                                <ExpandableImpactCard
                                    icono={TreeDeciduous}
                                    value={Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21).toString()}
                                    unit=""
                                    label="Árboles equivalentes"
                                    comparisons={[
                                        {
                                            icon: TreePine,
                                            value: Math.round(Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21) * 25),
                                            text: "m² de bosque",
                                            detail: "Cada árbol ocupa ~25 m² de bosque"
                                        },
                                        {
                                            icon: LandPlot,
                                            value: parseFloat((Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21) * 25 / 7140).toFixed(2)),
                                            text: "campos de fútbol",
                                            detail: "Un campo mide ~7,140 m²"
                                        },
                                        {
                                            icon: Mountain,
                                            value: Math.round(Math.ceil((stats.totalAceiteUsado * 2.5 + stats.totalBasuron * 0.5) / 21) / 400),
                                            text: "hectáreas de bosque",
                                            detail: "~400 árboles por hectárea"
                                        }
                                    ]}
                                />

                                {/* Litros de agua protegidos - Expandible */}
                                <ExpandableImpactCard
                                    icono={Droplets}
                                    value={(stats.totalAceiteUsado * 1000).toLocaleString()}
                                    unit=""
                                    label="Litros de agua protegidos"
                                    comparisons={[
                                        {
                                            icon: Waves,
                                            value: Math.round((stats.totalAceiteUsado * 1000) / 50000),
                                            text: "piscinas olímpicas",
                                            detail: "Una piscina ≈ 50,000 litros"
                                        },
                                        {
                                            icon: ShowerHead,
                                            value: Math.round((stats.totalAceiteUsado * 1000) / 65).toLocaleString(),
                                            text: "duchas de 5 min",
                                            detail: "Una ducha usa ~65 litros"
                                        },
                                        {
                                            icon: Users,
                                            value: Math.round((stats.totalAceiteUsado * 1000) / 150),
                                            text: "días de agua familiar",
                                            detail: "Familia usa ~150 L/día"
                                        }
                                    ]}
                                />

                                {/* Residuos reciclados - Expandible */}
                                <ExpandableImpactCard
                                    icono={Recycle}
                                    value={stats.totalResiduosReciclados.toLocaleString()}
                                    unit="kg"
                                    label="kg reciclados total"
                                    comparisons={[
                                        {
                                            icon: Weight,
                                            value: parseFloat((stats.totalResiduosReciclados / 5000).toFixed(1)),
                                            text: "elefantes de peso",
                                            detail: "Un elefante ≈ 5,000 kg"
                                        },
                                        {
                                            icon: Truck,
                                            value: Math.round(stats.totalResiduosReciclados / 8000),
                                            text: "camiones de basura",
                                            detail: "Camión carga ~8,000 kg"
                                        },
                                        {
                                            icon: Building2,
                                            value: Math.round(stats.totalResiduosReciclados / 500),
                                            text: "oficinas por mes",
                                            detail: "Oficina genera ~500 kg/mes"
                                        }
                                    ]}
                                />
                            </div>

                            <div className="mt-6 p-4 bg-white/10 rounded-xl">
                                <p className="text-base text-white/85">
                                    <span className="font-bold text-white">Consejo:</span> Pasa el mouse sobre cada tarjeta para ver comparaciones con objetos del mundo real.
                                </p>
                            </div>
                        </div>
                    </div>
                </div>
            ) : (
                <div className="space-y-6 animate-in fade-in duration-500">
                    {/* Panel de Filtros Mejorado */}
                    <div className="bg-simar-superficie p-6 rounded-3xl border border-simar-borde shadow-simar">
                        <div className="flex items-center gap-3 mb-6">
                            <div className="p-3 bg-simar-marea-suave rounded-xl">
                                <svg className="w-6 h-6 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                                </svg>
                            </div>
                            <div>
                                <h3 className="text-xl font-extrabold text-simar-texto">Filtros de Búsqueda</h3>
                                <p className="text-simar-texto-2 text-base">Selecciona los criterios para tu reporte</p>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                            {/* Fecha Desde */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-base font-bold text-simar-texto-2">
                                    <svg className="w-4 h-4 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Fecha Desde
                                </label>
                                <div className="relative">
                                    <DatePicker
                                        selected={filters.fechaInicio ? new Date(filters.fechaInicio + 'T00:00:00') : null}
                                        onChange={(date: Date | null) => {
                                            setAccesoRapidoSeleccionado(null);
                                            if (date) {
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                setFilters({ ...filters, fechaInicio: `${year}-${month}-${day}` });
                                            } else {
                                                setFilters({ ...filters, fechaInicio: '' });
                                            }
                                        }}
                                        dateFormat="dd/MM/yyyy"
                                        locale="es"
                                        placeholderText="Seleccionar fecha"
                                        showPopperArrow={false}
                                        className="w-full px-4 py-3 bg-simar-papel border border-simar-borde rounded-xl text-base focus:ring-2 focus:ring-simar-marea-tinta focus:border-simar-marea-tinta outline-none text-simar-texto cursor-pointer"
                                        wrapperClassName="w-full"
                                        popperClassName="datepicker-popper"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        todayButton="Hoy"
                                        isClearable
                                    />
                                </div>
                            </div>

                            {/* Fecha Hasta */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-base font-bold text-simar-texto-2">
                                    <svg className="w-4 h-4 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Fecha Hasta
                                </label>
                                <div className="relative">
                                    <DatePicker
                                        selected={filters.fechaFin ? new Date(filters.fechaFin + 'T00:00:00') : null}
                                        onChange={(date: Date | null) => {
                                            setAccesoRapidoSeleccionado(null);
                                            if (date) {
                                                const year = date.getFullYear();
                                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                                const day = String(date.getDate()).padStart(2, '0');
                                                setFilters({ ...filters, fechaFin: `${year}-${month}-${day}` });
                                            } else {
                                                setFilters({ ...filters, fechaFin: '' });
                                            }
                                        }}
                                        dateFormat="dd/MM/yyyy"
                                        locale="es"
                                        placeholderText="Seleccionar fecha"
                                        showPopperArrow={false}
                                        className="w-full px-4 py-3 bg-simar-papel border border-simar-borde rounded-xl text-base focus:ring-2 focus:ring-simar-marea-tinta focus:border-simar-marea-tinta outline-none text-simar-texto cursor-pointer"
                                        wrapperClassName="w-full"
                                        popperClassName="datepicker-popper"
                                        showMonthDropdown
                                        showYearDropdown
                                        dropdownMode="select"
                                        todayButton="Hoy"
                                        isClearable
                                        minDate={filters.fechaInicio ? parseFechaLocal(filters.fechaInicio) : undefined}
                                    />
                                </div>
                            </div>

                            {/* Selector de Buque */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-base font-bold text-simar-texto-2">
                                    <svg className="w-4 h-4 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                                    </svg>
                                    Buque
                                </label>
                                <div className="relative">
                                    <select
                                        className="w-full appearance-none cursor-pointer px-4 min-h-[52px] py-2.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-lg text-simar-texto placeholder:text-simar-texto-3 focus:outline-none focus:border-simar-marea-tinta transition-colors disabled:opacity-60"
                                        value={filters.buqueId}
                                        onChange={e => setFilters({ ...filters, buqueId: e.target.value })}
                                    >
                                        <option value="">Todos los buques</option>
                                        {buques.map(b => (
                                            <option key={b.id} value={b.id}>{b.nombre_buque}</option>
                                        ))}
                                    </select>
                                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none text-simar-texto-2">
                                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                        </svg>
                                    </div>
                                </div>
                            </div>

                            {/* Botón Generar */}
                            <div className="space-y-2">
                                <label className="text-base font-bold text-transparent">Acción</label>
                                <button
                                    onClick={loadReport}
                                    disabled={loadingReport}
                                    className="w-full py-3 bg-simar-marea text-white rounded-xl hover:bg-simar-marea-hover disabled:opacity-50 font-bold text-base transition-all transform flex items-center justify-center gap-2 min-h-[52px]"
                                >
                                    {loadingReport ? (
                                        <>
                                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                            Generando...
                                        </>
                                    ) : (
                                        <>
                                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                            Generar Reporte
                                        </>
                                    )}
                                </button>
                            </div>
                        </div>

                        {/* Accesos rápidos de fechas */}
                        <div className="mt-6 pt-4 border-t border-simar-borde">
                            <p className="text-base text-simar-texto-2 mb-3">Accesos rápidos:</p>
                            <div className="flex flex-wrap gap-2">
                                {[
                                    { label: 'Hoy', days: 0 },
                                    { label: 'Última semana', days: 7 },
                                    { label: 'Último mes', days: 30 },
                                    { label: 'Últimos 3 meses', days: 90 },
                                    { label: 'Este año', days: 365 },
                                ].map((option) => (
                                    <button
                                        key={option.label}
                                        onClick={() => {
                                            const today = new Date();
                                            const startDate = new Date();
                                            startDate.setDate(today.getDate() - option.days);
                                            const formatDate = (d: Date) => {
                                                const year = d.getFullYear();
                                                const month = String(d.getMonth() + 1).padStart(2, '0');
                                                const day = String(d.getDate()).padStart(2, '0');
                                                return `${year}-${month}-${day}`;
                                            };
                                            setFilters({
                                                ...filters,
                                                fechaInicio: formatDate(startDate),
                                                fechaFin: formatDate(today)
                                            });
                                            setAccesoRapidoSeleccionado(option.label);
                                        }}
                                        className={`px-4 py-2 rounded-lg font-medium text-base transition-colors ${accesoRapidoSeleccionado === option.label
                                            ? 'bg-simar-marea text-white shadow-simar'
                                            : 'bg-simar-papel text-simar-texto-2 hover:bg-simar-marea-suave hover:text-simar-marea-tinta'
                                            }`}
                                    >
                                        {option.label}
                                    </button>
                                ))}
                                <button
                                    onClick={() => {
                                        setFilters({ ...filters, fechaInicio: '', fechaFin: '', buqueId: '' });
                                        setAccesoRapidoSeleccionado(null);
                                    }}
                                    className="px-4 py-2 bg-simar-coral-suave text-simar-coral rounded-lg hover:bg-simar-coral-suave font-bold text-base transition-colors min-h-[52px]"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de resultados */}
                    {reportData.length > 0 && (
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <div className="bg-simar-superficie p-5 rounded-2xl border border-simar-borde shadow-simar">
                                <p className="text-simar-texto-2 text-base mb-1">Total Registros</p>
                                <p className="text-3xl font-extrabold text-simar-texto">{reportData.length}</p>
                            </div>
                            <div className="bg-simar-superficie p-5 rounded-2xl border border-simar-borde shadow-simar">
                                <p className="text-simar-texto-2 text-base mb-1">Total Residuos</p>
                                <p className="text-3xl font-extrabold text-simar-marea-tinta">
                                    {reportData.reduce((sum, item) => sum + item.cantidad, 0).toLocaleString()} kg
                                </p>
                            </div>
                            <div className="bg-simar-superficie p-5 rounded-2xl border border-simar-borde shadow-simar">
                                <p className="text-simar-texto-2 text-base mb-1">Buques Únicos</p>
                                <p className="text-3xl font-extrabold text-simar-arrecife-tinta">
                                    {new Set(reportData.map(item => item.buque)).size}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tabla de Resultados */}
                    <div className="bg-simar-superficie rounded-3xl border border-simar-borde shadow-simar overflow-hidden">
                        <div className="p-6 border-b border-simar-borde flex justify-between items-center">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-simar-papel rounded-lg">
                                    <Icons.Document className="w-5 h-5 text-simar-texto-2" />
                                </div>
                                <div>
                                    <h3 className="text-lg font-bold text-simar-texto">Resultados del Reporte</h3>
                                    <p className="text-base text-simar-texto-2">
                                        {reportData.length > 0
                                            ? `Mostrando ${reportData.length} registros`
                                            : 'Aplica filtros para ver resultados'}
                                    </p>
                                </div>
                            </div>

                            <div className="flex gap-3"> {/* Increased gap */}
                                <button
                                    onClick={() => exportToExcel(reportData)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-simar-arrecife-suave text-simar-arrecife-tinta hover:bg-[#0E6A50] hover:text-white rounded-xl text-base font-bold transition-all duration-200 shadow-simar min-h-[52px]"
                                >
                                    <Icons.Document className="w-5 h-5" />
                                    <span>Excel</span>
                                </button>
                                <button
                                    onClick={() => exportToCSV(reportData)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-simar-papel text-simar-texto hover:bg-simar-texto-2 hover:text-white rounded-xl text-base font-bold transition-all duration-200 shadow-simar border border-simar-borde hover:border-transparent min-h-[52px]"
                                >
                                    <Icons.Document className="w-5 h-5" />
                                    <span>CSV</span>
                                </button>
                                <button
                                    onClick={() => exportToPDF(reportData, stats!)}
                                    className="flex items-center gap-2 px-4 py-2.5 bg-simar-marea-suave text-simar-marea-tinta hover:bg-simar-marea-hover hover:text-white rounded-xl text-base font-bold transition-all duration-200 shadow-simar min-h-[52px]"
                                >
                                    <Icons.Document className="w-5 h-5" />
                                    <span>PDF</span>
                                </button>
                            </div>
                        </div>

                        <div className="overflow-x-auto rounded-xl border border-simar-borde shadow-simar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="bg-simar-papel border-b border-simar-borde">
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2">Fecha</th>
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2">Folio</th>
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2">Buque</th>
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2 hidden sm:table-cell">Tipo</th>
                                        <th className="px-4 md:px-5 py-3 text-right text-[15px] font-semibold text-simar-texto-2">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-simar-borde-suave bg-simar-superficie">
                                    {reportData.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} className="py-16 text-center">
                                                <div className="flex flex-col items-center gap-3 text-simar-texto-2">
                                                    <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                                    </svg>
                                                    <div className="text-center">
                                                        <p className="text-base font-medium text-simar-texto-2">
                                                            {loadingReport ? 'Procesando datos...' : 'No hay datos para mostrar'}
                                                        </p>
                                                        <p className="text-[15px] text-simar-texto-2 mt-1">
                                                            {!loadingReport && 'Selecciona las fechas y haz clic en "Generar Reporte"'}
                                                        </p>
                                                    </div>
                                                </div>
                                            </td>
                                        </tr>
                                    ) : (
                                        reportData.map((item, idx) => (
                                            <tr key={idx} className="bg-simar-superficie hover:bg-simar-marea-suave/30 transition-colors duration-150 group">
                                                <td className="px-4 md:px-5 py-3.5 text-base text-simar-texto-2 whitespace-nowrap">
                                                    {parseFechaLocal(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="px-4 md:px-5 py-3.5">
                                                    <span className="font-mono text-[15px] bg-simar-papel px-2.5 py-1 rounded-md text-simar-texto-2">
                                                        {item.folio}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-5 py-3.5 text-base font-semibold text-simar-texto">{item.buque}</td>
                                                <td className="px-4 md:px-5 py-3.5 hidden sm:table-cell">
                                                    <span className="inline-flex items-center gap-1.5 text-base text-simar-texto-2">
                                                        {item.tipoResiduo === 'Aceite' && <Droplet className="w-4 h-4" />}
                                                        {item.tipoResiduo === 'Basura' && <Trash2 className="w-4 h-4" />}
                                                        {item.tipoResiduo === 'Basurón' && <Recycle className="w-4 h-4" />}
                                                        {item.tipoResiduo}
                                                    </span>
                                                </td>
                                                <td className="px-4 md:px-5 py-3.5 text-right">
                                                    <span className="text-base font-bold text-simar-texto">{item.cantidad.toLocaleString()}</span>
                                                    <span className="text-[15px] text-simar-texto-2 ml-1">{item.unidad}</span>
                                                </td>
                                            </tr>
                                        ))
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>
            )
            }
        </div >
    );
}

function KpiCardPremium({ title, value, subValue, subValueCount, icon, trend, trendUp }: any) {
    return (
        <div className="bg-simar-superficie p-6 rounded-3xl border border-simar-borde shadow-simar transition-all duration-300 group">
            <div className="flex justify-between items-start mb-4">
                <div className="p-3 bg-simar-papel rounded-2xl text-simar-texto-2 group-hover:bg-simar-marea-suave group-hover:text-simar-marea-tinta transition-colors">
                    {/* @ts-ignore */}
                    {Icons[icon] ? Icons[icon]({ className: "w-6 h-6" }) : <Icons.Help className="w-6 h-6" />}
                </div>
                {trend && (
                    <span className={`px-2 py-1 rounded-lg text-[15px] font-bold ${trendUp ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta' : 'bg-simar-coral-suave text-simar-coral'}`}>
                        {trend}
                    </span>
                )}
            </div>

            <h3 className="text-simar-texto-2 text-base font-medium mb-1">{title}</h3>
            <p className="text-3xl font-extrabold text-simar-texto tracking-tight mb-4">{typeof value === 'number' ? value.toLocaleString() : value}</p>

            <div className="flex items-center gap-2 pt-4 border-t border-simar-borde">
                <div className="flex -space-x-2">
                    {/* Indicador visual */}
                    <div className="w-6 h-6 rounded-full bg-simar-marea-suave border-2 border-white flex items-center justify-center">
                        <div className="w-2 h-2 rounded-full bg-simar-marea"></div>
                    </div>
                </div>
                <p className="text-[15px] text-simar-texto-2">
                    <strong className="text-simar-texto-2">{typeof subValueCount === 'number' ? subValueCount.toLocaleString() : subValueCount}</strong> {subValue}
                </p>
            </div>
        </div>
    );
}

// Componente de Tarjeta de Impacto Expandible
interface ImpactComparison {
    icon: LucideIcon;
    value: number | string;
    text: string;
    detail: string;
}

interface ExpandableImpactCardProps {
    icono: LucideIcon;
    value: string;
    unit: string;
    label: string;
    comparisons: ImpactComparison[];
}

function ExpandableImpactCard({ icono: Icono, value, unit, label, comparisons }: ExpandableImpactCardProps) {
    const [isOpen, setIsOpen] = useState(false);
    const [openUpward, setOpenUpward] = useState(false);
    const cardRef = useRef<HTMLDivElement>(null);

    const handleMouseEnter = () => {
        if (cardRef.current) {
            const rect = cardRef.current.getBoundingClientRect();
            const windowHeight = window.innerHeight;
            // Si la tarjeta está en la mitad inferior de la pantalla, abrir hacia arriba
            const shouldOpenUpward = rect.bottom > windowHeight * 0.6;
            setOpenUpward(shouldOpenUpward);
        }
        setIsOpen(true);
    };

    return (
        <div
            ref={cardRef}
            className="relative h-full"
            onMouseEnter={handleMouseEnter}
            onMouseLeave={() => setIsOpen(false)}
        >
            {/* Tarjeta base - tamaño fijo */}
            <div
                className={` bg-white/10 rounded-2xl p-6 cursor-pointer h-full min-h-[120px] transition-all duration-200 flex items-center ${isOpen ? 'bg-white/25 shadow-simar' : 'hover:bg-white/15'}
                `}
            >
                <div className="flex items-center justify-between w-full">
                    <div className="flex items-center gap-5">
                        <span className="w-16 h-16 flex-shrink-0 rounded-full bg-white/15 flex items-center justify-center"><Icono className="w-8 h-8" strokeWidth={2} /></span>
                        <div>
                            <p className="text-3xl font-extrabold text-white whitespace-nowrap">{value} {unit}</p>
                            <p className="text-white/85 text-base mt-1">{label}</p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Panel flotante - aparece arriba o abajo según posición */}
            {isOpen && (
                <div className={`absolute left-0 right-0 z-50 animate-in fade-in duration-200 ${openUpward
                    ? 'bottom-full mb-2 slide-in-from-bottom-2'
                    : 'top-full mt-2 slide-in-from-top-2'
                    }`}>
                    <div className="bg-simar-abismo rounded-2xl p-4 shadow-2xl border border-white/15">
                        {/* Flecha - cambia posición según dirección */}
                        <div className={`absolute left-8 w-4 h-4 bg-simar-abismo rotate-45 border-white/15 ${openUpward
                            ? '-bottom-2 border-r border-b'
                            : '-top-2 border-l border-t'
                            }`}></div>

                        <p className="text-base text-white/80 font-medium mb-3 flex items-center gap-2">
                            <Icono className="w-5 h-5" />
                            <span>Esto equivale a:</span>
                        </p>

                        <div className="space-y-2">
                            {comparisons.map((comparison, idx) => (
                                <div
                                    key={idx}
                                    className="flex items-center gap-3 bg-white/10 rounded-xl px-4 py-3 hover:bg-white/15 transition-colors"
                                >
                                    <comparison.icon className="w-6 h-6 flex-shrink-0 text-simar-espuma" />
                                    <div>
                                        <p className="text-white">
                                            <span className="font-extrabold text-xl">
                                                {typeof comparison.value === 'number' ? comparison.value.toLocaleString() : comparison.value}
                                            </span>
                                            <span className="text-white/80 text-base ml-2">{comparison.text}</span>
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
                className="w-11 h-11 rounded-full bg-simar-marea-suave hover:bg-simar-marea text-simar-marea-tinta hover:text-white flex items-center justify-center transition-all duration-200 text-base font-bold shadow-simar"
                aria-label="Más información"
            >
                ?
            </button>

            {isOpen && (
                <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-3 w-80 animate-in fade-in slide-in-from-bottom-2 duration-200">
                    <div className="bg-simar-abismo text-white rounded-2xl p-5 shadow-2xl border border-white/15">
                        <h4 className="font-bold text-base mb-3 flex items-center gap-2">
                            <span className="w-8 h-8 rounded-full bg-simar-marea text-white flex items-center justify-center"><Lightbulb className="w-[18px] h-[18px]" /></span>
                            {title}
                        </h4>
                        <p className="text-white/80 text-base leading-relaxed mb-3">{description}</p>
                        {examples && examples.length > 0 && (
                            <div className="mt-3 pt-3 border-t border-white/15">
                                <p className="text-white/80 text-base font-medium mb-2">Ejemplo:</p>
                                <ul className="text-base text-white/80 space-y-2">
                                    {examples.map((ex, i) => (
                                        <li key={i} className="flex items-start gap-2">
                                            <Check className="w-5 h-5 flex-shrink-0 text-simar-espuma" strokeWidth={2.6} />
                                            {ex}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </div>
                    {/* Flecha */}
                    <div className="w-4 h-4 bg-simar-abismo transform rotate-45 absolute left-1/2 -translate-x-1/2 -bottom-2 border-b border-r border-white/15"></div>
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
        blue: { bg: 'bg-simar-marea', light: 'bg-simar-marea-suave' },
        amber: { bg: 'bg-[#A63F0E]', light: 'bg-simar-coral-suave' },
        emerald: { bg: 'bg-[#127A5D]', light: 'bg-simar-arrecife-suave' },
        violet: { bg: 'bg-[#5B3FA8]', light: 'bg-simar-violeta-suave' }
    };

    return (
        <div>
            <div className="flex justify-between items-center mb-2">
                <span className="text-base font-medium text-simar-texto">{label}</span>
                <div className="flex items-center gap-2">
                    <span className="text-base font-bold text-simar-texto">{actual.toLocaleString()} {unit}</span>
                    <span className={`text-base font-bold px-2.5 py-1 rounded-lg ${positivo ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta' : 'bg-simar-coral-suave text-simar-coral'}`}>
                        {positivo ? '↑' : '↓'} {Math.abs(cambio).toFixed(1)}%
                    </span>
                </div>
            </div>
            <div className="relative h-5 flex gap-1">
                {/* Barra actual */}
                <div className="flex-1 bg-simar-papel rounded-full overflow-hidden">
                    <div
                        className={`h-full ${colorClasses[color].bg} rounded-full transition-all duration-1000`}
                        style={{ width: `${actualPercent}%` }}
                    ></div>
                </div>
            </div>
            <div className="flex justify-between mt-1">
                <span className="text-base text-simar-texto-2">Actual</span>
                <span className="text-base text-simar-texto-2">Anterior: {anterior.toLocaleString()} {unit}</span>
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
        bg: 'bg-simar-marea-suave',
        bgHover: 'hover:bg-simar-marea',
        icon: 'text-simar-marea-tinta',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-marea-tinta/30',
        shadow: '',
    },
    violet: {
        bg: 'bg-simar-violeta-suave',
        bgHover: 'hover:bg-[#5B3FA8]',
        icon: 'text-simar-violeta',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-violeta/30',
        shadow: '',
    },
    emerald: {
        bg: 'bg-simar-arrecife-suave',
        bgHover: 'hover:bg-[#127A5D]',
        icon: 'text-simar-arrecife-tinta',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-arrecife/30',
        shadow: '',
    },
    amber: {
        bg: 'bg-simar-coral-suave',
        bgHover: 'hover:bg-[#A63F0E]',
        icon: 'text-simar-coral',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-coral/30',
        shadow: '',
    },
    orange: {
        bg: 'bg-simar-coral-suave',
        bgHover: 'hover:bg-[#A63F0E]',
        icon: 'text-simar-coral',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-coral/30',
        shadow: '',
    },
    sky: {
        bg: 'bg-simar-marea-suave',
        bgHover: 'hover:bg-simar-marea',
        icon: 'text-simar-marea-tinta',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-marea-tinta/30',
        shadow: '',
    },
    teal: {
        bg: 'bg-simar-arrecife-suave',
        bgHover: 'hover:bg-[#127A5D]',
        icon: 'text-simar-arrecife-tinta',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-arrecife/30',
        shadow: '',
    },
    indigo: {
        bg: 'bg-simar-marea-suave',
        bgHover: 'hover:bg-simar-marea',
        icon: 'text-simar-marea-tinta',
        iconHover: 'group-hover:text-white',
        border: 'border-simar-marea-tinta/30',
        shadow: '',
    },
};

function SimpleKpiCard({ title, value, subtitle, icon, color, trendUp }: SimpleKpiCardProps) {
    const colors = colorConfig[color];

    return (
        <div className={`group bg-simar-superficie p-6 rounded-2xl border ${colors.border} shadow-simar transition-all duration-300 cursor-pointer ${colors.bgHover}`}>
            {/* Icono grande */}
            <div className={`w-16 h-16 ${colors.bg} rounded-2xl flex items-center justify-center mb-4 ${colors.icon} transition-colors duration-300 group-hover:bg-white/20 group-hover:text-white`}>
                {SimpleIcons[icon]}
            </div>

            {/* Título */}
            <p className="text-simar-texto-2 text-base font-medium mb-1 group-hover:text-white/80 transition-colors">{title}</p>

            {/* Valor grande */}
            <p className="text-4xl font-bold text-simar-texto mb-2 group-hover:text-white transition-colors">{value}</p>

            {/* Subtítulo */}
            <p className="text-base text-simar-texto-2 group-hover:text-white/70 transition-colors">{subtitle}</p>
        </div>
    );
}


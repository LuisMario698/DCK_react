'use client';

import { useRef, useState } from 'react';
import { ReporteDetalladoItem } from '@/types/dashboard';
import { SelectorFecha } from '@/components/ui/SelectorFecha';
import { getEstadisticasPeriodo, getReporteComplejo, type EstadisticasPeriodo, type PeriodoEstadisticas, type SinEntregar } from '@/lib/services/dashboard_stats';
import { Icons } from '@/components/ui/Icons';
import { Aviso } from '@/components/ui/simar';
import { Droplet, Recycle, Trash2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { parseFechaLocal } from '@/lib/utils/fechas';
import { EstadisticasGenerales } from './EstadisticasGenerales';

interface DashboardClientProps {
    /** Estadísticas del período inicial ("1 mes"), consultadas en el servidor */
    inicial: EstadisticasPeriodo;
    buques: { id: number; nombre_buque: string }[];
    /** Embarcaciones activas sin entregar (no depende del período) */
    sinEntregar?: SinEntregar;
}

interface FiltrosReporte {
    fechaInicio: string;
    fechaFin: string;
    buqueId: string;
    estado: string;
}

/** Totales del reporte por unidad: kilos y litros nunca se suman entre sí */
function totalesPorUnidad(data: ReporteDetalladoItem[]) {
    const porUnidad = new Map<string, number>();
    for (const item of data) porUnidad.set(item.unidad, (porUnidad.get(item.unidad) ?? 0) + item.cantidad);
    return [...porUnidad.entries()].sort(([a], [b]) => (a === 'kg' ? -1 : b === 'kg' ? 1 : a.localeCompare(b)));
}

/** Para escribir datos dentro del HTML del PDF sin que un nombre con "<" rompa la página */
function escaparHtml(texto: unknown) {
    return String(texto ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
}

export function DashboardClient({ inicial, buques, sinEntregar }: DashboardClientProps) {
    const [activeTab, setActiveTab] = useState<'general' | 'reportes'>('general');
    const [reportData, setReportData] = useState<ReporteDetalladoItem[]>([]);
    const [loadingReport, setLoadingReport] = useState(false);
    const supabase = createClient();

    // Estadísticas: el período se consulta al elegirlo. Si se piden dos seguidos, sólo cuenta la
    // respuesta del último (una respuesta lenta no pisa a la más nueva).
    const [periodo, setPeriodo] = useState<PeriodoEstadisticas>(inicial.periodo);
    const [datos, setDatos] = useState<EstadisticasPeriodo>(inicial);
    const [actualizando, setActualizando] = useState(false);
    const [errorEstadisticas, setErrorEstadisticas] = useState(false);
    const pedido = useRef(0);

    const cambiarPeriodo = async (nuevo: PeriodoEstadisticas) => {
        if (nuevo === periodo && !errorEstadisticas) return;
        setPeriodo(nuevo);
        const id = ++pedido.current;
        setActualizando(true);
        try {
            const d = await getEstadisticasPeriodo(supabase, nuevo);
            if (id !== pedido.current) return;
            setDatos(d);
            setErrorEstadisticas(false);
        } catch (error) {
            console.error('Error cargando estadísticas:', error);
            if (id === pedido.current) setErrorEstadisticas(true);
        } finally {
            if (id === pedido.current) setActualizando(false);
        }
    };

    // Filtros de reporte
    const [filters, setFilters] = useState<FiltrosReporte>({
        fechaInicio: '',
        fechaFin: '',
        buqueId: '',
        estado: ''
    });

    // Acceso rápido seleccionado
    const [accesoRapidoSeleccionado, setAccesoRapidoSeleccionado] = useState<string | null>(null);

    const loadReport = async (f: FiltrosReporte = filters) => {
        setLoadingReport(true);
        try {
            const data = await getReporteComplejo(supabase, {
                fechaInicio: f.fechaInicio || undefined,
                fechaFin: f.fechaFin || undefined,
                buqueId: f.buqueId ? Number(f.buqueId) : undefined,
                estado: f.estado || undefined
            });
            setReportData(data);
        } catch (error) {
            console.error('Error cargando reporte:', error);
        } finally {
            setLoadingReport(false);
        }
    };

    // Desde "Embarcaciones que más entregan": abre Reportes con esa embarcación y el mismo período
    const verRegistrosDeEmbarcacion = (buqueId: number) => {
        const f: FiltrosReporte = {
            fechaInicio: datos.periodo === 'todo' ? '' : datos.inicio,
            fechaFin: datos.periodo === 'todo' ? '' : datos.fin,
            buqueId: String(buqueId),
            estado: '',
        };
        setFilters(f);
        setAccesoRapidoSeleccionado(null);
        setActiveTab('reportes');
        window.scrollTo({ top: 0 });
        loadReport(f);
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

        const blob = new Blob(['﻿' + csvContent], { type: 'text/csv;charset=utf-8;' });
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

    // Función para exportar a PDF (genera HTML imprimible). El resumen sale de los mismos registros
    // del reporte (antes usaba las cifras de la pestaña Estadísticas, de otro período).
    const exportToPDF = (data: ReporteDetalladoItem[]) => {
        const printWindow = window.open('', '_blank');
        if (!printWindow) return;

        const buqueFiltrado = filters.buqueId ? buques.find((b) => String(b.id) === filters.buqueId)?.nombre_buque : null;
        const fecha = (f: string) => parseFechaLocal(f).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
        const rango =
            filters.fechaInicio || filters.fechaFin
                ? `Del ${filters.fechaInicio ? fecha(filters.fechaInicio) : 'inicio'} al ${filters.fechaFin ? fecha(filters.fechaFin) : 'día de hoy'}`
                : 'Todas las fechas';
        const porTipo = new Map<string, { cantidad: number; unidad: string }>();
        for (const item of data) {
            const t = porTipo.get(item.tipoResiduo) ?? { cantidad: 0, unidad: item.unidad };
            t.cantidad += item.cantidad;
            porTipo.set(item.tipoResiduo, t);
        }

        const html = `
            <!DOCTYPE html>
            <html lang="es">
            <head>
                <meta charset="utf-8">
                <title>Reporte de residuos - SiMAR</title>
                <style>
                    body { font-family: Arial, sans-serif; padding: 40px; color: #0B2236; }
                    h1 { color: #1B5FC9; border-bottom: 2px solid #1B5FC9; padding-bottom: 10px; margin-bottom: 6px; }
                    h2 { color: #3E5163; margin-top: 30px; }
                    .meta { color: #3E5163; margin: 2px 0; }
                    .stats-grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 20px; margin: 20px 0; }
                    .stat-card { background: #F3F0E9; padding: 20px; border-radius: 10px; text-align: center; }
                    .stat-value { font-size: 24px; font-weight: bold; color: #1B5FC9; }
                    .stat-label { font-size: 12px; color: #3E5163; margin-top: 5px; }
                    table { width: 100%; border-collapse: collapse; margin-top: 20px; }
                    th { background: #1B5FC9; color: white; padding: 12px; text-align: left; }
                    td { padding: 10px; border-bottom: 1px solid #E6E0D4; }
                    tr:nth-child(even) { background: #FAF8F4; }
                    .footer { margin-top: 40px; text-align: center; color: #6B7785; font-size: 12px; }
                    @media print { body { padding: 20px; } }
                </style>
            </head>
            <body>
                <h1>Reporte de residuos</h1>
                <p class="meta">${escaparHtml(rango)}${buqueFiltrado ? ` · Embarcación: ${escaparHtml(buqueFiltrado)}` : ''}</p>
                <p class="meta">Generado el ${new Date().toLocaleDateString('es-MX', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>

                <h2>Resumen</h2>
                <div class="stats-grid">
                    <div class="stat-card">
                        <div class="stat-value">${data.length.toLocaleString('es-MX')}</div>
                        <div class="stat-label">Registros</div>
                    </div>
                    ${[...porTipo.entries()]
                        .map(
                            ([tipo, t]) => `
                    <div class="stat-card">
                        <div class="stat-value">${t.cantidad.toLocaleString('es-MX')} ${escaparHtml(t.unidad)}</div>
                        <div class="stat-label">${escaparHtml(tipo)}</div>
                    </div>`
                        )
                        .join('')}
                </div>

                <h2>Detalle de registros (${data.length})</h2>
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
                                <td>${parseFechaLocal(item.fecha).toLocaleDateString('es-MX')}</td>
                                <td>${escaparHtml(item.folio)}</td>
                                <td>${escaparHtml(item.buque)}</td>
                                <td>${escaparHtml(item.tipoResiduo)}</td>
                                <td>${item.cantidad.toLocaleString('es-MX')} ${escaparHtml(item.unidad)}</td>
                                <td>${escaparHtml(item.estado)}</td>
                            </tr>
                        `).join('')}
                    </tbody>
                </table>

                <div class="footer">
                    <p>SiMAR · Sistema Integral de Manejo Ambiental de Residuos</p>
                    <p>Documento generado automáticamente</p>
                </div>

                <script>window.onload = function() { window.print(); }</script>
            </body>
            </html>
        `;

        printWindow.document.write(html);
        printWindow.document.close();
    };

    return (
        <div className="space-y-8 font-sans text-simar-texto-2 movil:space-y-4">
            {/* Pestañas */}
            <div className="grid grid-cols-2 sm:inline-flex w-full sm:w-auto gap-2 bg-simar-superficie p-2 rounded-2xl shadow-simar border border-simar-borde movil:p-1 movil:gap-1 movil:rounded-full">
                <button
                    onClick={() => setActiveTab('general')}
                    aria-pressed={activeTab === 'general'}
                    className={`min-h-[52px] px-4 sm:px-8 text-lg font-bold rounded-xl transition-colors movil:rounded-full ${activeTab === 'general'
                        ? 'bg-simar-marea text-white shadow-simar'
                        : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                        }`}
                >
                    Estadísticas
                </button>
                <button
                    onClick={() => setActiveTab('reportes')}
                    aria-pressed={activeTab === 'reportes'}
                    className={`min-h-[52px] px-4 sm:px-8 text-lg font-bold rounded-xl transition-colors movil:rounded-full ${activeTab === 'reportes'
                        ? 'bg-simar-marea text-white shadow-simar'
                        : 'text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto'
                        }`}
                >
                    Reportes
                </button>
            </div>

            {activeTab === 'general' ? (
                <div className="space-y-4">
                    {errorEstadisticas && (
                        <Aviso tono="advertencia" titulo="No se pudieron cargar las estadísticas de ese período">
                            Revisa tu conexión y vuelve a tocar el período. Mientras, se muestran las cifras anteriores.
                        </Aviso>
                    )}
                    <EstadisticasGenerales
                        datos={datos}
                        periodo={periodo}
                        onCambiarPeriodo={cambiarPeriodo}
                        actualizando={actualizando}
                        onVerEmbarcacion={verRegistrosDeEmbarcacion}
                        sinEntregar={sinEntregar}
                    />
                </div>
            ) : (
                <div className="simar-aparece space-y-6 movil:space-y-4">
                    {/* Panel de Filtros Mejorado */}
                    <div className="bg-simar-superficie p-5 md:p-6 rounded-3xl border border-simar-borde shadow-simar movil:p-4">
                        <div className="flex items-center gap-3 mb-6 movil:mb-4">
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

                        {/* En celular: las dos fechas lado a lado, y buque y el botón a lo ancho */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-[1fr_1fr_1fr_auto] gap-6 movil:grid-cols-2 movil:gap-3">
                            {/* Fecha Desde */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-base font-bold text-simar-texto-2">
                                    <svg className="w-4 h-4 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Fecha Desde
                                </label>
                                <SelectorFecha
                                    etiqueta="Fecha desde"
                                    valor={filters.fechaInicio}
                                    onCambiar={(fecha) => {
                                        setAccesoRapidoSeleccionado(null);
                                        setFilters({ ...filters, fechaInicio: fecha });
                                    }}
                                    max={filters.fechaFin || undefined}
                                    rango={{ desde: filters.fechaInicio, hasta: filters.fechaFin }}
                                    borrable
                                />

                            </div>

                            {/* Fecha Hasta */}
                            <div className="space-y-2">
                                <label className="flex items-center gap-2 text-base font-bold text-simar-texto-2">
                                    <svg className="w-4 h-4 text-simar-marea-tinta" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                    </svg>
                                    Fecha Hasta
                                </label>
                                <SelectorFecha
                                    etiqueta="Fecha hasta"
                                    valor={filters.fechaFin}
                                    onCambiar={(fecha) => {
                                        setAccesoRapidoSeleccionado(null);
                                        setFilters({ ...filters, fechaFin: fecha });
                                    }}
                                    min={filters.fechaInicio || undefined}
                                    rango={{ desde: filters.fechaInicio, hasta: filters.fechaFin }}
                                    borrable
                                />

                            </div>

                            {/* Selector de Buque */}
                            <div className="space-y-2 movil:col-span-2">
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
                            <div className="space-y-2 movil:col-span-2">
                                <label aria-hidden="true" className="hidden md:block text-base font-bold text-transparent">Acción</label>
                                <button
                                    onClick={() => loadReport()}
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
                        <div className="mt-6 pt-4 border-t border-simar-borde movil:mt-4 movil:pt-3">
                            <p className="text-base text-simar-texto-2 mb-3 movil:mb-2">Accesos rápidos:</p>
                            {/* En celular, una fila que se desliza de lado */}
                            <div className="simar-desliza flex flex-wrap gap-2 movil:flex-nowrap movil:overflow-x-auto movil:-mx-4 movil:px-4">
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
                                        className={`min-h-[48px] px-4 py-2 rounded-lg font-medium text-base transition-colors whitespace-nowrap flex-shrink-0 movil:rounded-full ${accesoRapidoSeleccionado === option.label
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
                                    className="px-4 py-2 bg-simar-coral-suave text-simar-coral rounded-lg hover:bg-simar-coral-suave font-bold text-base transition-colors min-h-[52px] whitespace-nowrap flex-shrink-0 movil:min-h-[38px] movil:rounded-full"
                                >
                                    Limpiar filtros
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Resumen de resultados: cada unidad por su lado (kg y L no se suman) */}
                    {reportData.length > 0 && (
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4 movil:gap-2.5">
                            <div className="bg-simar-superficie p-5 rounded-2xl border border-simar-borde shadow-simar movil:p-3.5">
                                <p className="text-simar-texto-2 text-base mb-1">Total Registros</p>
                                <p className="text-3xl font-extrabold text-simar-texto">{reportData.length}</p>
                            </div>
                            <div className="order-first col-span-2 md:order-none md:col-span-1 bg-simar-superficie p-5 rounded-2xl border border-simar-borde shadow-simar movil:p-3.5">
                                <p className="text-simar-texto-2 text-base mb-1">Total Residuos</p>
                                <p className="text-3xl font-extrabold text-simar-marea-tinta">
                                    {totalesPorUnidad(reportData).map(([unidad, total], i) => (
                                        <span key={unidad} className="whitespace-nowrap">
                                            {i > 0 && <span className="text-simar-texto-2 font-bold"> · </span>}
                                            {total.toLocaleString('es-MX')} {unidad}
                                        </span>
                                    ))}
                                </p>
                            </div>
                            <div className="bg-simar-superficie p-5 rounded-2xl border border-simar-borde shadow-simar movil:p-3.5">
                                <p className="text-simar-texto-2 text-base mb-1">Buques Únicos</p>
                                <p className="text-3xl font-extrabold text-simar-arrecife-tinta">
                                    {new Set(reportData.map(item => item.buque)).size}
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Tabla de Resultados */}
                    <div className="bg-simar-superficie rounded-3xl border border-simar-borde shadow-simar overflow-hidden">
                        <div className="p-5 md:p-6 border-b border-simar-borde flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 movil:p-4 movil:gap-3">
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

                            {/* En celular los tres formatos se reparten a lo ancho */}
                            <div className="grid grid-cols-3 sm:flex gap-2 sm:gap-3">
                                <button
                                    onClick={() => exportToExcel(reportData)}
                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-simar-arrecife-suave text-simar-arrecife-tinta hover:bg-[#0E6A50] hover:text-white rounded-xl text-base font-bold transition-all duration-200 shadow-simar min-h-[52px]"
                                >
                                    <Icons.Document className="w-5 h-5" />
                                    <span>Excel</span>
                                </button>
                                <button
                                    onClick={() => exportToCSV(reportData)}
                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-simar-papel text-simar-texto hover:bg-simar-texto-2 hover:text-white rounded-xl text-base font-bold transition-all duration-200 shadow-simar border border-simar-borde hover:border-transparent min-h-[52px]"
                                >
                                    <Icons.Document className="w-5 h-5" />
                                    <span>CSV</span>
                                </button>
                                <button
                                    onClick={() => exportToPDF(reportData)}
                                    className="flex items-center justify-center gap-2 px-3 sm:px-4 py-2.5 bg-simar-marea-suave text-simar-marea-tinta hover:bg-simar-marea-hover hover:text-white rounded-xl text-base font-bold transition-all duration-200 shadow-simar min-h-[52px]"
                                >
                                    <Icons.Document className="w-5 h-5" />
                                    <span>PDF</span>
                                </button>
                            </div>
                        </div>

                        {/* En celular cada registro es un bloque: folio y cantidad arriba, buque, fecha y tipo debajo */}
                        <div className="sm:overflow-x-auto sm:rounded-xl sm:border sm:border-simar-borde sm:shadow-simar">
                            <table className="w-full border-collapse block sm:table">
                                <thead className="hidden sm:table-header-group">
                                    <tr className="bg-simar-papel border-b border-simar-borde">
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2">Fecha</th>
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2">Folio</th>
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2">Buque</th>
                                        <th className="px-4 md:px-5 py-3 text-left text-[15px] font-semibold text-simar-texto-2 hidden sm:table-cell">Tipo</th>
                                        <th className="px-4 md:px-5 py-3 text-right text-[15px] font-semibold text-simar-texto-2">Cantidad</th>
                                    </tr>
                                </thead>
                                <tbody className="block sm:table-row-group divide-y divide-simar-borde-suave bg-simar-superficie">
                                    {reportData.length === 0 ? (
                                        <tr className="block sm:table-row">
                                            <td colSpan={5} className="block sm:table-cell px-4 py-16 text-center">
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
                                            <tr key={idx} className="relative block sm:table-row bg-simar-superficie hover:bg-simar-marea-suave/30 transition-colors duration-150 group">
                                                <td className="hidden sm:table-cell px-4 md:px-5 py-3.5 text-base text-simar-texto-2 whitespace-nowrap">
                                                    {parseFechaLocal(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })}
                                                </td>
                                                <td className="block sm:table-cell px-4 md:px-5 pt-4 pb-4 pr-32 sm:pr-5 sm:py-3.5">
                                                    <span className="font-mono text-[15px] bg-simar-papel px-2.5 py-1 rounded-md text-simar-texto-2">
                                                        {item.folio}
                                                    </span>
                                                    <span className="sm:hidden mt-2 block text-base font-bold text-simar-texto">{item.buque}</span>
                                                    <span className="sm:hidden block text-base text-simar-texto-2">
                                                        {parseFechaLocal(item.fecha).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' })} · {item.tipoResiduo}
                                                    </span>
                                                </td>
                                                <td className="hidden sm:table-cell px-4 md:px-5 py-3.5 text-base font-semibold text-simar-texto">{item.buque}</td>
                                                <td className="px-4 md:px-5 py-3.5 hidden sm:table-cell">
                                                    <span className="inline-flex items-center gap-1.5 text-base text-simar-texto-2">
                                                        {item.tipoResiduo === 'Aceite' && <Droplet className="w-4 h-4" />}
                                                        {item.tipoResiduo === 'Basura' && <Trash2 className="w-4 h-4" />}
                                                        {item.tipoResiduo === 'Basurón' && <Recycle className="w-4 h-4" />}
                                                        {item.tipoResiduo}
                                                    </span>
                                                </td>
                                                <td className="absolute top-3.5 right-4 sm:static sm:table-cell px-0 sm:px-4 md:px-5 sm:py-3.5 text-right whitespace-nowrap">
                                                    <span className="text-lg sm:text-base font-bold text-simar-texto">{item.cantidad.toLocaleString()}</span>
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
            )}
        </div>
    );
}

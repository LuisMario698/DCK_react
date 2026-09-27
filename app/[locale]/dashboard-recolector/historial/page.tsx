'use client';

import { useCallback, useEffect, useState } from 'react';
import { toast } from 'sonner';
import { Download, FileDown, Loader2, Truck } from 'lucide-react';
import { PUERTO_PENASCO, TIPO_RESIDUO_LABEL, formatCantidad } from '@/lib/constants/residuos';
import { formatearFecha, hoyLocal } from '@/lib/utils/fechas';
import { RecoleccionConAsociacion } from '@/types/database';
import { abrirComprobante, getRecolecciones } from '@/lib/services/recolecciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { Cargando, ErrorCarga, ResiduoBadge, mensajeError } from '@/components/asociaciones/ui';

export default function HistorialPage() {
    const [historial, setHistorial] = useState<RecoleccionConAsociacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [abriendo, setAbriendo] = useState<number | null>(null);

    const asociacionId = useRecolector().asociacion?.id;

    const cargar = useCallback(() => {
        if (!asociacionId) return;
        setCargando(true);
        getRecolecciones(asociacionId)
            .then((r) => {
                setHistorial(r);
                setError(null);
            })
            .catch((err) => setError(mensajeError(err, 'No se pudo cargar el historial.')))
            .finally(() => setCargando(false));
    }, [asociacionId]);

    useEffect(cargar, [cargar]);

    const descargarCSV = () => {
        const filas = [
            ['Folio', 'Fecha', 'Centro de acopio', 'Residuo', 'Cantidad', 'Unidad', 'Entregó', 'Recibió', 'Observaciones'],
            ...historial.map((h) => [
                h.folio,
                h.fecha,
                PUERTO_PENASCO.nombre,
                TIPO_RESIDUO_LABEL[h.tipo],
                String(h.cantidad),
                h.unidad,
                h.entregado_por ?? '',
                h.recibido_por ?? '',
                h.observaciones ?? '',
            ]),
        ];
        const csv = filas.map((f) => f.map((c) => `"${c.replace(/"/g, '""')}"`).join(',')).join('\r\n');
        // BOM para que Excel reconozca los acentos
        const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `historial-recolecciones-${hoyLocal()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    };

    const verComprobante = async (h: RecoleccionConAsociacion) => {
        if (!h.comprobante_pdf_path) {
            return toast.info('El comprobante aún no está disponible', {
                description: 'El centro de acopio lo generará en breve. Si lo necesitas, escríbeles desde Mensajes.',
            });
        }
        setAbriendo(h.id);
        try {
            await abrirComprobante(h.comprobante_pdf_path);
        } catch (err) {
            toast.error(mensajeError(err, 'No se pudo abrir el comprobante.'));
        } finally {
            setAbriendo(null);
        }
    };

    if (cargando) return <Cargando texto="Cargando historial…" />;

    return (
        <div className="space-y-6">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {historial.length} {historial.length === 1 ? 'recolección registrada' : 'recolecciones registradas'}
                </p>
                <button
                    onClick={descargarCSV}
                    disabled={historial.length === 0}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                    <FileDown className="w-4 h-4" />
                    Descargar historial (CSV)
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <Th>Folio</Th>
                                <Th>Fecha</Th>
                                <Th>Residuo</Th>
                                <Th>Cantidad</Th>
                                <Th className="hidden md:table-cell">Recibió</Th>
                                <Th className="text-right">Comprobante</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {historial.map((h) => (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4 text-sm font-mono font-semibold text-gray-900 dark:text-white whitespace-nowrap">{h.folio}</td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300 whitespace-nowrap">{formatearFecha(h.fecha)}</td>
                                    <td className="px-4 sm:px-6 py-4">
                                        <ResiduoBadge tipo={h.tipo} />
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white whitespace-nowrap">
                                        {formatCantidad(h.cantidad)} {h.unidad}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">{h.recibido_por || '—'}</td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        <button
                                            onClick={() => verComprobante(h)}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline disabled:opacity-50"
                                            disabled={abriendo === h.id}
                                        >
                                            {abriendo === h.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                                            PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {historial.length === 0 && (
                                <tr>
                                    <td colSpan={6} className="px-6 py-12 text-center text-sm text-gray-500 dark:text-gray-400">
                                        <Truck className="w-8 h-8 mx-auto mb-2 opacity-40" />
                                        Aún no tienes recolecciones completadas.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </div>
    );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
    return (
        <th className={`px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider ${className}`}>
            {children}
        </th>
    );
}

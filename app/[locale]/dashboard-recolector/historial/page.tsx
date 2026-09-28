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
import { EstadoVacio } from '@/components/ui/simar';

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
        <div className="space-y-6 movil:space-y-3">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            {/* En celular el conteo y la descarga comparten renglón */}
            <div className="simar-aparece flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 movil:flex-row movil:items-center movil:justify-between">
                <p className="text-lg text-simar-texto-2 movil:text-[15px] movil:leading-snug">
                    <strong className="text-simar-texto">{historial.length}</strong>{' '}
                    {historial.length === 1 ? 'recolección registrada' : 'recolecciones registradas'}
                </p>
                <button
                    onClick={descargarCSV}
                    disabled={historial.length === 0}
                    className="simar-presiona min-h-[56px] px-6 rounded-[18px] bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-50 text-white text-[17px] font-extrabold inline-flex items-center justify-center gap-2 movil:flex-shrink-0 movil:min-h-[42px] movil:px-4 movil:rounded-[14px]"
                >
                    <FileDown className="w-[22px] h-[22px]" />
                    <span className="movil:hidden">Descargar historial (CSV)</span>
                    <span className="hidden movil:inline">Descargar CSV</span>
                </button>
            </div>

            <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] shadow-simar overflow-hidden" style={{ animationDelay: '0.06s' }}>
                {/* En celular cada recolección es un bloque: residuo, cantidad, fecha y folio a la izquierda y
                    el comprobante a la derecha */}
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-simar-borde-suave movil:block">
                        <thead className="bg-simar-papel movil:hidden">
                            <tr>
                                <Th className="hidden sm:table-cell">Folio</Th>
                                <Th className="hidden sm:table-cell">Fecha</Th>
                                <Th>Residuo</Th>
                                <Th className="hidden sm:table-cell">Cantidad</Th>
                                <Th className="hidden md:table-cell">Recibió</Th>
                                <Th className="text-right">Comprobante</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-simar-borde-suave bg-simar-superficie movil:block">
                            {historial.map((h) => (
                                <tr
                                    key={h.id}
                                    className="hover:bg-simar-papel transition-colors movil:grid movil:grid-cols-[1fr_auto] movil:items-center movil:gap-x-3 movil:px-3.5 movil:py-3"
                                >
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-[17px] font-mono font-bold text-simar-texto whitespace-nowrap">{h.folio}</td>
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-[17px] text-simar-texto whitespace-nowrap">{formatearFecha(h.fecha)}</td>
                                    <td className="px-4 sm:px-6 py-4 movil:p-0 movil:min-w-0">
                                        <ResiduoBadge tipo={h.tipo} />
                                        {/* En celular: cantidad, fecha y folio debajo del residuo (no se corta a la derecha) */}
                                        <div className="sm:hidden mt-2 space-y-0.5">
                                            <p className="text-[17px] font-bold text-simar-texto">
                                                {formatCantidad(h.cantidad)} {h.unidad}
                                                <span className="font-normal text-simar-texto-2"> · {formatearFecha(h.fecha)}</span>
                                            </p>
                                            <p className="text-[15px] font-mono text-simar-texto-2">{h.folio}</p>
                                        </div>
                                    </td>
                                    <td className="hidden sm:table-cell px-4 sm:px-6 py-4 text-[17px] font-bold text-simar-texto whitespace-nowrap">
                                        {formatCantidad(h.cantidad)} {h.unidad}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-[17px] text-simar-texto-2 hidden md:table-cell">{h.recibido_por || '—'}</td>
                                    <td className="px-4 sm:px-6 py-4 text-right movil:p-0">
                                        <button
                                            onClick={() => verComprobante(h)}
                                            className="simar-presiona min-h-[44px] px-3.5 rounded-xl border-2 border-simar-campo-borde bg-simar-superficie text-[15px] font-bold text-simar-marea-tinta hover:border-simar-marea-tinta disabled:opacity-50 inline-flex items-center gap-1.5"
                                            disabled={abriendo === h.id}
                                            aria-label={`Descargar comprobante ${h.folio} en PDF`}
                                        >
                                            {abriendo === h.id ? <Loader2 className="w-[18px] h-[18px] animate-spin" /> : <Download className="w-[18px] h-[18px]" />}
                                            {/* En celular no está la columna "Comprobante": la palabra va en el botón */}
                                            <span className="movil:hidden">PDF</span>
                                            <span className="hidden movil:inline">Comprobante</span>
                                        </button>
                                    </td>
                                </tr>
                            ))}
                            {historial.length === 0 && (
                                <tr className="movil:block">
                                    <td colSpan={6} className="movil:block">
                                        <EstadoVacio icono={Truck} titulo="Aún no hay recolecciones">
                                            Cuando el centro de acopio complete una de tus solicitudes, su comprobante aparecerá aquí.
                                        </EstadoVacio>
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
        <th className={`px-4 sm:px-6 py-3.5 text-left text-[15px] font-bold text-simar-texto-2 ${className}`}>
            {children}
        </th>
    );
}

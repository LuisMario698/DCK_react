'use client';

import { Download, FileDown } from 'lucide-react';
import { HISTORIAL_MOCK, TIPO_RESIDUO_LABEL } from '@/lib/mock/recolector';
import { toast } from 'sonner';

export default function HistorialPage() {
    const descargarTodo = () => {
        toast.info('Descarga simulada', {
            description: 'En la integración real esto exportará un CSV con todo el historial.',
        });
    };

    const descargarComprobante = (id: string) => {
        toast.success(`Comprobante ${id} descargado`);
    };

    return (
        <div className="space-y-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                    {HISTORIAL_MOCK.length} recolecciones registradas
                </p>
                <button
                    onClick={descargarTodo}
                    className="inline-flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-semibold px-4 py-2 rounded-lg shadow-sm transition-colors"
                >
                    <FileDown className="w-4 h-4" />
                    Descargar historial
                </button>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl shadow-sm overflow-hidden">
                <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-800">
                        <thead className="bg-gray-50 dark:bg-gray-800/50">
                            <tr>
                                <Th>Fecha</Th>
                                <Th>Puerto</Th>
                                <Th>Residuo</Th>
                                <Th>Cantidad</Th>
                                <Th className="text-right">Comprobante</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-gray-800 bg-white dark:bg-gray-900">
                            {HISTORIAL_MOCK.map((h) => (
                                <tr key={h.id} className="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {new Date(h.fecha).toLocaleDateString('es-MX', {
                                            year: 'numeric',
                                            month: 'short',
                                            day: 'numeric',
                                        })}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm font-medium text-gray-900 dark:text-white">{h.puerto}</td>
                                    <td className="px-4 sm:px-6 py-4 text-sm text-gray-700 dark:text-gray-300">
                                        {TIPO_RESIDUO_LABEL[h.residuo]}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-sm font-semibold text-gray-900 dark:text-white">
                                        {h.cantidad} {h.unidad}
                                    </td>
                                    <td className="px-4 sm:px-6 py-4 text-right">
                                        <button
                                            onClick={() => descargarComprobante(h.id)}
                                            className="inline-flex items-center gap-1.5 text-sm font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
                                        >
                                            <Download className="w-4 h-4" />
                                            PDF
                                        </button>
                                    </td>
                                </tr>
                            ))}
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

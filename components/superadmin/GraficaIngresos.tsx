'use client';

import { useState } from 'react';
import { formatoMXN } from '@/lib/constants/suscripciones';

export interface IngresoMes {
    /** 'YYYY-MM' */
    mes: string;
    total: number;
}

const MES_CORTO = new Intl.DateTimeFormat('es-MX', { month: 'short', timeZone: 'UTC' });
const MES_LARGO = new Intl.DateTimeFormat('es-MX', { month: 'long', year: 'numeric', timeZone: 'UTC' });
const fechaMes = (mes: string) => new Date(`${mes}-01T00:00:00Z`);

/** Redondea hacia arriba a 1, 2, 2.5 o 5 × 10^k para que las marcas del eje sean limpias. */
function maximoLimpio(n: number): number {
    if (n <= 0) return 1;
    const potencia = 10 ** Math.floor(Math.log10(n));
    const paso = [1, 2, 2.5, 5, 10].find((p) => p * potencia >= n) ?? 10;
    return paso * potencia;
}

const compacto = new Intl.NumberFormat('es-MX', { notation: 'compact', maximumFractionDigits: 1 });

/**
 * Columnas de ingresos por mes (una sola serie: sin leyenda, el título la
 * nombra). Cada columna muestra su valor al pasar el cursor o con el teclado;
 * `verTabla` cambia a la vista de tabla con todos los valores.
 */
export function GraficaIngresos({ datos, verTabla }: { datos: IngresoMes[]; verTabla: boolean }) {
    const [activo, setActivo] = useState<number | null>(null);
    const max = maximoLimpio(Math.max(...datos.map((d) => d.total)));
    const indiceMayor = datos.reduce((m, d, i) => (d.total > datos[m].total ? i : m), 0);

    if (verTabla) {
        return (
            <table className="w-full text-sm">
                <thead>
                    <tr className="text-left text-xs text-gray-500 dark:text-gray-400">
                        <th className="py-1.5 font-semibold">Mes</th>
                        <th className="py-1.5 font-semibold text-right">Cobrado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {datos.map((d) => (
                        <tr key={d.mes}>
                            <td className="py-1.5 text-gray-700 dark:text-gray-300 capitalize">{MES_LARGO.format(fechaMes(d.mes))}</td>
                            <td className="py-1.5 text-right tabular-nums text-gray-900 dark:text-white">{formatoMXN(d.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="flex gap-2">
            {/* Eje Y: 0, mitad y máximo */}
            <div className="relative w-10 h-48 flex-shrink-0 text-[10px] tabular-nums text-gray-400 dark:text-gray-500">
                {[max, max / 2, 0].map((v, i) => (
                    <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${i * 50}%` }}>
                        {compacto.format(v)}
                    </span>
                ))}
            </div>

            <div className="flex-1 min-w-0">
                <div className="relative h-48">
                    {[0, 50, 100].map((top) => (
                        <div key={top} className="absolute inset-x-0 h-px bg-gray-100 dark:bg-gray-800" style={{ top: `${top}%` }} />
                    ))}

                    <div className="absolute inset-0 flex items-end">
                        {datos.map((d, i) => {
                            const alto = (d.total / max) * 100;
                            const etiqueta = `${MES_LARGO.format(fechaMes(d.mes))}: ${formatoMXN(d.total)}`;
                            const mostrarValor = i === indiceMayor && d.total > 0 && activo === null;
                            return (
                                <button
                                    key={d.mes}
                                    type="button"
                                    aria-label={etiqueta}
                                    onPointerEnter={() => setActivo(i)}
                                    onPointerLeave={() => setActivo(null)}
                                    onFocus={() => setActivo(i)}
                                    onBlur={() => setActivo(null)}
                                    className="group relative h-full flex-1 flex flex-col justify-end items-center focus-visible:outline-none"
                                >
                                    {activo === i && (
                                        <span
                                            role="tooltip"
                                            className="absolute z-10 bottom-full mb-1 px-2.5 py-1.5 rounded-lg bg-gray-900 dark:bg-gray-100 shadow-lg whitespace-nowrap text-left pointer-events-none"
                                        >
                                            <span className="block text-xs font-bold text-white dark:text-gray-900 tabular-nums">{formatoMXN(d.total)}</span>
                                            <span className="block text-[10px] text-gray-300 dark:text-gray-600 capitalize">{MES_LARGO.format(fechaMes(d.mes))}</span>
                                        </span>
                                    )}
                                    {mostrarValor && (
                                        <span className="mb-1 text-[10px] font-semibold text-gray-600 dark:text-gray-300 tabular-nums">
                                            {compacto.format(d.total)}
                                        </span>
                                    )}
                                    <span
                                        className={`w-full max-w-[24px] rounded-t-[4px] bg-violet-600 dark:bg-violet-500 transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-violet-400 ${
                                            activo !== null && activo !== i ? 'opacity-50' : ''
                                        }`}
                                        style={{ height: `${alto}%` }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="flex mt-1.5 border-t border-gray-200 dark:border-gray-700 pt-1.5">
                    {datos.map((d, i) => (
                        <span
                            key={d.mes}
                            className={`flex-1 text-center text-[10px] capitalize ${
                                i === datos.length - 1 ? 'font-bold text-gray-700 dark:text-gray-200' : 'text-gray-400 dark:text-gray-500'
                            }`}
                        >
                            {MES_CORTO.format(fechaMes(d.mes)).replace('.', '')}
                        </span>
                    ))}
                </div>
            </div>
        </div>
    );
}

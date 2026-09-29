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
            <table className="w-full text-base">
                <thead>
                    <tr className="text-left text-[15px] text-simar-texto-2">
                        <th className="py-1.5 font-semibold">Mes</th>
                        <th className="py-1.5 font-semibold text-right">Cobrado</th>
                    </tr>
                </thead>
                <tbody className="divide-y divide-simar-borde-suave">
                    {datos.map((d) => (
                        <tr key={d.mes}>
                            <td className="py-1.5 text-simar-texto capitalize">{MES_LARGO.format(fechaMes(d.mes))}</td>
                            <td className="py-1.5 text-right tabular-nums text-simar-texto">{formatoMXN(d.total)}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        );
    }

    return (
        <div className="flex gap-2">
            {/* Eje Y: 0, mitad y máximo */}
            <div className="relative w-10 h-48 flex-shrink-0 text-[15px] tabular-nums text-simar-texto-2 movil:w-8 movil:text-[13px]">
                {[max, max / 2, 0].map((v, i) => (
                    <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${i * 50}%` }}>
                        {compacto.format(v)}
                    </span>
                ))}
            </div>

            <div className="flex-1 min-w-0">
                <div className="relative h-48">
                    {[0, 50, 100].map((top) => (
                        <div key={top} className="absolute inset-x-0 h-px bg-simar-papel" style={{ top: `${top}%` }} />
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
                                            className="absolute z-10 bottom-full mb-1 px-2.5 py-1.5 rounded-lg bg-simar-abismo shadow-simar whitespace-nowrap text-left pointer-events-none"
                                        >
                                            <span className="block text-[15px] font-bold text-white tabular-nums">{formatoMXN(d.total)}</span>
                                            <span className="block text-[15px] text-simar-texto-2 capitalize">{MES_LARGO.format(fechaMes(d.mes))}</span>
                                        </span>
                                    )}
                                    {mostrarValor && (
                                        <span className="mb-1 text-[15px] font-semibold text-simar-texto-2 tabular-nums">
                                            {compacto.format(d.total)}
                                        </span>
                                    )}
                                    <span
                                        className={`w-full max-w-[24px] rounded-t-[4px] bg-[#5B3FA8] transition-opacity group-focus-visible:ring-2 group-focus-visible:ring-simar-marea-tinta ${
                                            activo !== null && activo !== i ? 'opacity-50' : ''
                                        }`}
                                        style={{ height: `${alto}%` }}
                                    />
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* En celular sólo la inicial del mes: 12 columnas de ~22 px no caben "ene", "feb"… (el mes
                    completo sale al tocar la columna) */}
                <div className="flex mt-1.5 border-t border-simar-borde pt-1.5">
                    {datos.map((d, i) => {
                        const corto = MES_CORTO.format(fechaMes(d.mes)).replace('.', '');
                        return (
                            <span
                                key={d.mes}
                                aria-hidden="true"
                                className={`flex-1 text-center text-[15px] capitalize movil:text-[13px] ${
                                    i === datos.length - 1 ? 'font-bold text-simar-texto' : 'text-simar-texto-2'
                                }`}
                            >
                                <span className="movil:hidden">{corto}</span>
                                <span className="hidden movil:inline">{corto.charAt(0)}</span>
                            </span>
                        );
                    })}
                </div>
            </div>
        </div>
    );
}

'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ScrollText, X } from 'lucide-react';
import { Cargando, ErrorCarga, inputCls, mensajeError } from '@/components/asociaciones/ui';
import { EstadoVacio, Tarjeta, formatoFechaHora, tdCls, thCls } from '@/components/superadmin/ui';
import { getAuditoria, type FiltrosAuditoria } from '@/lib/services/superadmin';
import type { EntradaAuditoria } from '@/types/database';

const POR_PAGINA = 25;

/** Tablas con trigger de auditoría (audit_trigger_fn). */
const TABLAS: { id: string; label: string }[] = [
    { id: 'manifiestos', label: 'Manifiestos' },
    { id: 'manifiestos_residuos', label: 'Residuos de manifiesto' },
    { id: 'manifiesto_basuron', label: 'Recibos relleno sanitario' },
    { id: 'buques', label: 'Embarcaciones' },
    { id: 'personas', label: 'Personas' },
    { id: 'tipos_persona', label: 'Tipos de persona' },
    { id: 'asociaciones_recolectoras', label: 'Asociaciones' },
    { id: 'inventario_residuos', label: 'Inventario' },
    { id: 'solicitudes_recoleccion', label: 'Solicitudes' },
    { id: 'recolecciones', label: 'Recolecciones' },
    { id: 'profiles', label: 'Perfiles (cuentas)' },
    { id: 'planes', label: 'Planes' },
    { id: 'suscripciones', label: 'Suscripciones' },
    { id: 'pagos_suscripcion', label: 'Pagos' },
    { id: 'configuracion_sistema', label: 'Configuración' },
];

const OPERACION: Record<EntradaAuditoria['operacion'], { label: string; cls: string }> = {
    INSERT: { label: 'Alta', cls: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
    UPDATE: { label: 'Cambio', cls: 'bg-sky-100 text-sky-700 dark:bg-sky-900/30 dark:text-sky-300' },
    DELETE: { label: 'Baja', cls: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
};

/** Columnas que cambian solas y no aportan al leer un cambio. */
const IGNORAR = new Set(['updated_at']);

export default function AuditoriaPage() {
    const [filtros, setFiltros] = useState<FiltrosAuditoria>({});
    const [usuario, setUsuario] = useState('');
    const [pagina, setPagina] = useState(0);
    const [datos, setDatos] = useState<{ entradas: EntradaAuditoria[]; total: number } | null>(null);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [abierta, setAbierta] = useState<number | null>(null);

    const cargar = useCallback(async () => {
        setCargando(true);
        setError(null);
        try {
            setDatos(await getAuditoria(filtros, pagina, POR_PAGINA));
        } catch (err) {
            setError(mensajeError(err, 'No se pudo cargar la bitácora.'));
        } finally {
            setCargando(false);
        }
    }, [filtros, pagina]);

    useEffect(() => {
        cargar();
    }, [cargar]);

    // El filtro por correo se aplica al dejar de escribir
    useEffect(() => {
        const t = setTimeout(() => {
            setFiltros((f) => (f.usuario === (usuario.trim() || undefined) ? f : { ...f, usuario: usuario.trim() || undefined }));
            setPagina(0);
        }, 400);
        return () => clearTimeout(t);
    }, [usuario]);

    const filtrar = (cambio: Partial<FiltrosAuditoria>) => {
        setFiltros((f) => ({ ...f, ...cambio }));
        setPagina(0);
    };

    const hayFiltros = Object.values(filtros).some(Boolean);
    const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / POR_PAGINA)) : 1;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-end gap-3">
                <select
                    className={`${inputCls} w-auto`}
                    value={filtros.tabla ?? ''}
                    onChange={(e) => filtrar({ tabla: e.target.value || undefined })}
                    aria-label="Tabla"
                >
                    <option value="">Todas las tablas</option>
                    {TABLAS.map((t) => (
                        <option key={t.id} value={t.id}>
                            {t.label}
                        </option>
                    ))}
                </select>
                <select
                    className={`${inputCls} w-auto`}
                    value={filtros.operacion ?? ''}
                    onChange={(e) => filtrar({ operacion: (e.target.value || undefined) as FiltrosAuditoria['operacion'] })}
                    aria-label="Operación"
                >
                    <option value="">Todas las operaciones</option>
                    <option value="INSERT">Altas</option>
                    <option value="UPDATE">Cambios</option>
                    <option value="DELETE">Bajas</option>
                </select>
                <input
                    className={`${inputCls} w-56`}
                    placeholder="Correo de quien hizo el cambio"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    aria-label="Correo del usuario"
                />
                <label className="text-xs text-gray-500 dark:text-gray-400">
                    Desde
                    <input
                        type="date"
                        className={`${inputCls} w-auto block mt-1`}
                        value={filtros.desde ?? ''}
                        onChange={(e) => filtrar({ desde: e.target.value || undefined })}
                    />
                </label>
                <label className="text-xs text-gray-500 dark:text-gray-400">
                    Hasta
                    <input
                        type="date"
                        className={`${inputCls} w-auto block mt-1`}
                        value={filtros.hasta ?? ''}
                        onChange={(e) => filtrar({ hasta: e.target.value || undefined })}
                    />
                </label>
                {hayFiltros && (
                    <button
                        onClick={() => {
                            setFiltros({});
                            setUsuario('');
                            setPagina(0);
                        }}
                        className="inline-flex items-center gap-1 px-3 py-2 text-sm font-semibold text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
                    >
                        <X className="w-4 h-4" />
                        Limpiar
                    </button>
                )}
            </div>

            {error ? (
                <ErrorCarga mensaje={error} onReintentar={cargar} />
            ) : !datos ? (
                <Cargando texto="Cargando bitácora…" />
            ) : (
                <Tarjeta sinPadding className={cargando ? 'opacity-60 transition-opacity' : 'transition-opacity'}>
                    {datos.entradas.length === 0 ? (
                        <EstadoVacio
                            icono={ScrollText}
                            titulo="Sin registros"
                            texto={hayFiltros ? 'Ningún cambio coincide con los filtros.' : 'Aún no hay cambios en la bitácora.'}
                        />
                    ) : (
                        <>
                            <div className="overflow-x-auto">
                                <table className="w-full">
                                    <thead className="border-b border-gray-200 dark:border-gray-800">
                                        <tr>
                                            <th className={thCls}>Fecha</th>
                                            <th className={thCls}>Tabla</th>
                                            <th className={thCls}>Operación</th>
                                            <th className={thCls}>Registro</th>
                                            <th className={thCls}>Usuario</th>
                                            <th className={thCls} />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                                        {datos.entradas.map((e) => {
                                            const op = OPERACION[e.operacion] ?? OPERACION.UPDATE;
                                            const expandida = abierta === e.id;
                                            return (
                                                <Fragment key={e.id}>
                                                    <tr
                                                        className="hover:bg-gray-50 dark:hover:bg-gray-800/40 cursor-pointer"
                                                        onClick={() => setAbierta(expandida ? null : e.id)}
                                                    >
                                                        <td className={`${tdCls} whitespace-nowrap`}>{formatoFechaHora(e.created_at)}</td>
                                                        <td className={tdCls}>
                                                            {TABLAS.find((t) => t.id === e.tabla)?.label ?? (
                                                                <span className="font-mono text-xs">{e.tabla}</span>
                                                            )}
                                                        </td>
                                                        <td className={tdCls}>
                                                            <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${op.cls}`}>{op.label}</span>
                                                        </td>
                                                        <td className={`${tdCls} font-mono text-xs`}>{resumenRegistro(e)}</td>
                                                        <td className={tdCls}>{e.usuario_email ?? <span className="text-gray-400">Sistema</span>}</td>
                                                        <td className={`${tdCls} text-right`}>
                                                            <button
                                                                aria-expanded={expandida}
                                                                aria-label={expandida ? 'Ocultar detalle' : 'Ver detalle'}
                                                                className="p-1 rounded text-gray-400 hover:text-gray-900 dark:hover:text-white"
                                                            >
                                                                <ChevronDown className={`w-4 h-4 transition-transform ${expandida ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandida && (
                                                        <tr className="bg-gray-50 dark:bg-gray-800/30">
                                                            <td colSpan={6} className="px-4 py-3">
                                                                <DetalleCambio entrada={e} />
                                                            </td>
                                                        </tr>
                                                    )}
                                                </Fragment>
                                            );
                                        })}
                                    </tbody>
                                </table>
                            </div>

                            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-gray-100 dark:border-gray-800 text-sm text-gray-600 dark:text-gray-400">
                                <span>{datos.total.toLocaleString('es-MX')} registro(s)</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagina((p) => p - 1)}
                                        disabled={pagina === 0}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                                        aria-label="Página anterior"
                                    >
                                        <ChevronLeft className="w-4 h-4" />
                                    </button>
                                    <span className="tabular-nums">
                                        {pagina + 1} / {totalPaginas}
                                    </span>
                                    <button
                                        onClick={() => setPagina((p) => p + 1)}
                                        disabled={pagina + 1 >= totalPaginas}
                                        className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 disabled:opacity-40"
                                        aria-label="Página siguiente"
                                    >
                                        <ChevronRight className="w-4 h-4" />
                                    </button>
                                </div>
                            </div>
                        </>
                    )}
                </Tarjeta>
            )}
        </div>
    );
}

/** Identificador legible del registro: nombre, folio o correo si lo hay. */
function resumenRegistro(e: EntradaAuditoria): string {
    const d = (e.datos_nue ?? e.datos_ant ?? {}) as Record<string, unknown>;
    const nombre =
        d.numero_manifiesto ?? d.folio ?? d.nombre_asociacion ?? d.nombre_buque ?? d.nombre ?? d.email ?? d.clave ?? d.tipo;
    return nombre ? `#${e.registro_id} · ${String(nombre)}` : `#${e.registro_id ?? '—'}`;
}

function valor(v: unknown): string {
    if (v === null || v === undefined) return '∅';
    if (typeof v === 'object') return JSON.stringify(v);
    const s = String(v);
    return s.length > 120 ? `${s.slice(0, 117)}…` : s;
}

function DetalleCambio({ entrada }: { entrada: EntradaAuditoria }) {
    const antes = (entrada.datos_ant ?? {}) as Record<string, unknown>;
    const despues = (entrada.datos_nue ?? {}) as Record<string, unknown>;

    if (entrada.operacion === 'UPDATE') {
        const cambios = Object.keys({ ...antes, ...despues }).filter(
            (k) => !IGNORAR.has(k) && JSON.stringify(antes[k]) !== JSON.stringify(despues[k])
        );
        if (cambios.length === 0) return <p className="text-xs text-gray-500">Sin cambios de contenido.</p>;
        return (
            <dl className="grid gap-1.5 text-xs">
                {cambios.map((k) => (
                    <div key={k} className="grid grid-cols-[minmax(120px,auto)_1fr] gap-3">
                        <dt className="font-mono font-semibold text-gray-600 dark:text-gray-300">{k}</dt>
                        <dd className="font-mono break-all">
                            <span className="text-red-600 dark:text-red-400 line-through">{valor(antes[k])}</span>
                            <span className="text-gray-400 mx-1.5">→</span>
                            <span className="text-emerald-700 dark:text-emerald-400">{valor(despues[k])}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        );
    }

    const datos = entrada.operacion === 'DELETE' ? antes : despues;
    return (
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-xs">
            {Object.entries(datos).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(120px,auto)_1fr] gap-3">
                    <dt className="font-mono font-semibold text-gray-600 dark:text-gray-300">{k}</dt>
                    <dd className="font-mono break-all text-gray-700 dark:text-gray-300">{valor(v)}</dd>
                </div>
            ))}
        </dl>
    );
}

'use client';

import { Fragment, useCallback, useEffect, useState } from 'react';
import { ChevronDown, ChevronLeft, ChevronRight, ScrollText, SlidersHorizontal, X } from 'lucide-react';
import { Cargando, ErrorCarga, mensajeError } from '@/components/asociaciones/ui';
import { EstadoVacio, Tarjeta, filtroCls, formatoFechaHora, tdCls, thCls } from '@/components/superadmin/ui';
import { getAuditoria, type FiltrosAuditoria } from '@/lib/services/superadmin';
import { SelectorFecha } from '@/components/ui/SelectorFecha';
import type { EntradaAuditoria } from '@/types/database';

const POR_PAGINA = 25;

/** Tablas con trigger de auditoría (audit_trigger_fn). */
const TABLAS: { id: string; label: string }[] = [
    { id: 'manifiestos', label: 'Manifiestos' },
    { id: 'manifiestos_residuos', label: 'Residuos de manifiesto' },
    { id: 'manifiesto_basuron', label: 'Recibos del basurón' },
    { id: 'buques', label: 'Embarcaciones' },
    { id: 'personas', label: 'Personas' },
    { id: 'tipos_persona', label: 'Tipos de persona' },
    { id: 'asociaciones_recolectoras', label: 'Empresas' },
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
    INSERT: { label: 'Alta', cls: 'bg-simar-arrecife-suave text-simar-arrecife-tinta' },
    UPDATE: { label: 'Cambio', cls: 'bg-simar-marea-suave text-simar-marea-tinta' },
    DELETE: { label: 'Baja', cls: 'bg-simar-coral-suave text-simar-coral' },
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
    const [verFiltros, setVerFiltros] = useState(false);

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
    const cuantosFiltros = Object.values(filtros).filter(Boolean).length;
    const totalPaginas = datos ? Math.max(1, Math.ceil(datos.total / POR_PAGINA)) : 1;
    const limpiar = () => {
        setFiltros({});
        setUsuario('');
        setPagina(0);
    };

    return (
        <div className="space-y-5 movil:space-y-3">
            {/* Celular: los cinco filtros se abren con un botón (a la vista ocuparían media pantalla) */}
            <div className="hidden movil:flex items-center gap-2">
                <button
                    type="button"
                    onClick={() => setVerFiltros((v) => !v)}
                    aria-expanded={verFiltros}
                    className="simar-presiona flex-1 min-h-[42px] px-3.5 rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-[15px] font-bold text-simar-texto inline-flex items-center justify-between gap-2"
                >
                    <span className="inline-flex items-center gap-2">
                        <SlidersHorizontal className="w-[18px] h-[18px] text-simar-violeta" />
                        Filtros
                        {cuantosFiltros > 0 && (
                            <span className="min-w-[20px] h-5 px-1 rounded-full bg-simar-violeta-suave text-simar-violeta text-[12px] font-bold inline-flex items-center justify-center">
                                {cuantosFiltros}
                            </span>
                        )}
                    </span>
                    <ChevronDown className={`w-4 h-4 transition-transform ${verFiltros ? 'rotate-180' : ''}`} />
                </button>
                {hayFiltros && (
                    <button type="button" onClick={limpiar} className="min-h-[42px] px-2 text-[14px] font-bold text-simar-texto-2 inline-flex items-center gap-1">
                        <X className="w-4 h-4" />
                        Limpiar
                    </button>
                )}
            </div>

            <div className={`flex flex-wrap items-end gap-3 movil:grid movil:grid-cols-2 movil:gap-2 ${verFiltros ? '' : 'movil:hidden'}`}>
                <select
                    className={`${filtroCls} w-auto movil:col-span-2 movil:w-full`}
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
                    className={`${filtroCls} w-auto movil:col-span-2 movil:w-full`}
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
                    className={`${filtroCls} w-56 movil:col-span-2 movil:w-full`}
                    placeholder="Correo de quien hizo el cambio"
                    value={usuario}
                    onChange={(e) => setUsuario(e.target.value)}
                    aria-label="Correo del usuario"
                />
                <label className="text-[15px] text-simar-texto-2 movil:min-w-0">
                    Desde
                    <SelectorFecha
                        etiqueta="Desde"
                        valor={filtros.desde}
                        onCambiar={(v) => filtrar({ desde: v || undefined })}
                        max={filtros.hasta}
                        rango={{ desde: filtros.desde, hasta: filtros.hasta }}
                        borrable
                        className="mt-1 w-56 movil:w-full"
                    />
                </label>
                <label className="text-[15px] text-simar-texto-2 movil:min-w-0">
                    Hasta
                    <SelectorFecha
                        etiqueta="Hasta"
                        valor={filtros.hasta}
                        onCambiar={(v) => filtrar({ hasta: v || undefined })}
                        min={filtros.desde}
                        rango={{ desde: filtros.desde, hasta: filtros.hasta }}
                        borrable
                        className="mt-1 w-56 movil:w-full"
                    />
                </label>
                {hayFiltros && (
                    <button
                        onClick={limpiar}
                        className="inline-flex items-center gap-1 px-3 py-2 text-base font-bold text-simar-texto-2 hover:text-simar-texto min-h-[52px] movil:hidden"
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
                            {/* En celular cada cambio es un bloque: operación y tabla, el registro y quién/cuándo;
                                se toca para ver el detalle */}
                            <div className="overflow-x-auto">
                                <table className="w-full movil:block">
                                    <thead className="border-b border-simar-borde movil:hidden">
                                        <tr>
                                            <th className={thCls}>Fecha</th>
                                            <th className={thCls}>Tabla</th>
                                            <th className={thCls}>Operación</th>
                                            <th className={thCls}>Registro</th>
                                            <th className={thCls}>Usuario</th>
                                            <th className={thCls} />
                                        </tr>
                                    </thead>
                                    <tbody className="divide-y divide-simar-borde-suave movil:block">
                                        {datos.entradas.map((e) => {
                                            const op = OPERACION[e.operacion] ?? OPERACION.UPDATE;
                                            const expandida = abierta === e.id;
                                            return (
                                                <Fragment key={e.id}>
                                                    <tr
                                                        className="hover:bg-simar-papel cursor-pointer movil:grid movil:grid-cols-[1fr_auto] movil:items-center movil:gap-x-2 movil:pl-3.5 movil:pr-1.5 movil:py-2.5"
                                                        onClick={() => setAbierta(expandida ? null : e.id)}
                                                    >
                                                        <td className={`${tdCls} whitespace-nowrap movil:hidden`}>{formatoFechaHora(e.created_at)}</td>
                                                        <td className={`${tdCls} movil:p-0 movil:min-w-0`}>
                                                            <span className={`hidden movil:inline-flex mr-1.5 px-2 py-0.5 rounded-full text-[13px] font-semibold ${op.cls}`}>
                                                                {op.label}
                                                            </span>
                                                            {TABLAS.find((t) => t.id === e.tabla)?.label ?? (
                                                                <span className="font-mono text-[15px]">{e.tabla}</span>
                                                            )}
                                                            {/* Celular: lo de las columnas Registro, Usuario y Fecha */}
                                                            <p className="hidden movil:block mt-0.5 font-mono text-[13px] text-simar-texto-2 truncate">{resumenRegistro(e)}</p>
                                                            {/* La fecha primero: si no cabe, que se corte el correo y no la hora */}
                                                            <p className="hidden movil:block text-[13px] text-simar-texto-2 truncate">
                                                                {formatoFechaHora(e.created_at)} · {e.usuario_email ?? 'Sistema'}
                                                            </p>
                                                        </td>
                                                        <td className={`${tdCls} movil:hidden`}>
                                                            <span className={`px-2 py-0.5 rounded-full text-[15px] font-semibold ${op.cls}`}>{op.label}</span>
                                                        </td>
                                                        <td className={`${tdCls} font-mono text-[15px] movil:hidden`}>{resumenRegistro(e)}</td>
                                                        <td className={`${tdCls} movil:hidden`}>{e.usuario_email ?? <span className="text-simar-texto-2">Sistema</span>}</td>
                                                        <td className={`${tdCls} text-right movil:p-0`}>
                                                            <button
                                                                aria-expanded={expandida}
                                                                aria-label={expandida ? 'Ocultar detalle' : 'Ver detalle'}
                                                                className="p-1 rounded text-simar-texto-2 hover:text-simar-texto min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
                                                            >
                                                                <ChevronDown className={`w-4 h-4 transition-transform ${expandida ? 'rotate-180' : ''}`} />
                                                            </button>
                                                        </td>
                                                    </tr>
                                                    {expandida && (
                                                        <tr className="bg-simar-papel movil:block">
                                                            <td colSpan={6} className="px-4 py-3 movil:block movil:px-3.5">
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

                            <div className="flex items-center justify-between gap-3 px-4 py-3 border-t border-simar-borde text-base text-simar-texto-2">
                                <span>{datos.total.toLocaleString('es-MX')} registro(s)</span>
                                <div className="flex items-center gap-2">
                                    <button
                                        onClick={() => setPagina((p) => p - 1)}
                                        disabled={pagina === 0}
                                        className="p-1.5 rounded-lg hover:bg-simar-papel disabled:opacity-40 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
                                        className="p-1.5 rounded-lg hover:bg-simar-papel disabled:opacity-40 min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
        if (cambios.length === 0) return <p className="text-[15px] text-simar-texto-2">Sin cambios de contenido.</p>;
        return (
            <dl className="grid gap-1.5 text-[15px]">
                {cambios.map((k) => (
                    <div key={k} className="grid grid-cols-[minmax(120px,auto)_1fr] gap-3 movil:grid-cols-1 movil:gap-0">
                        <dt className="font-mono font-semibold text-simar-texto-2">{k}</dt>
                        <dd className="font-mono break-all">
                            <span className="text-simar-coral line-through">{valor(antes[k])}</span>
                            <span className="text-simar-texto-2 mx-1.5">→</span>
                            <span className="text-simar-arrecife-tinta">{valor(despues[k])}</span>
                        </dd>
                    </div>
                ))}
            </dl>
        );
    }

    const datos = entrada.operacion === 'DELETE' ? antes : despues;
    return (
        <dl className="grid sm:grid-cols-2 gap-x-6 gap-y-1 text-[15px]">
            {Object.entries(datos).map(([k, v]) => (
                <div key={k} className="grid grid-cols-[minmax(120px,auto)_1fr] gap-3 movil:grid-cols-1 movil:gap-0">
                    <dt className="font-mono font-semibold text-simar-texto-2">{k}</dt>
                    <dd className="font-mono break-all text-simar-texto">{valor(v)}</dd>
                </div>
            ))}
        </dl>
    );
}

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Save, X, Package, Droplets, Layers, Eye, EyeOff, Loader2 } from 'lucide-react';
import {
    TIPOS_RESIDUO,
    TIPO_RESIDUO_LABEL,
    UNIDAD_POR_TIPO,
    formatCantidad,
    type TipoResiduo,
} from '@/lib/constants/residuos';
import { formatearFecha } from '@/lib/utils/fechas';
import { InventarioResiduo, SolicitudConAsociacion } from '@/types/database';
import {
    createInventario,
    deleteInventario,
    getInventario,
    updateInventario,
} from '@/lib/services/inventario';
import { getSolicitudes } from '@/lib/services/solicitudes';
import { suscribirCambios } from '@/lib/services/notificaciones';
import { Cargando, ErrorCarga, ResiduoBadge, mensajeError } from './ui';

interface Borrador {
    tipo: TipoResiduo | '';
    cantidad: string;
    notas: string;
    publicado: boolean;
}

const BORRADOR_VACIO: Borrador = { tipo: '', cantidad: '', notas: '', publicado: true };

export function InventarioTab() {
    const [items, setItems] = useState<InventarioResiduo[]>([]);
    const [aprobadas, setAprobadas] = useState<SolicitudConAsociacion[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [editando, setEditando] = useState<number | null>(null);
    const [creando, setCreando] = useState(false);
    const [draft, setDraft] = useState<Borrador>(BORRADOR_VACIO);
    const [guardando, setGuardando] = useState(false);

    const cargar = useCallback(async () => {
        try {
            const [inv, sol] = await Promise.all([getInventario(), getSolicitudes({ estado: 'aprobada' })]);
            setItems(inv);
            setAprobadas(sol);
            setError(null);
        } catch (err) {
            setError(mensajeError(err, 'No se pudo cargar el inventario.'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        const off1 = suscribirCambios('inventario_residuos', cargar);
        const off2 = suscribirCambios('solicitudes_recoleccion', cargar);
        return () => {
            off1();
            off2();
        };
    }, [cargar]);

    // Cantidad aprobada que aún no se recolecta (ya descontada del disponible)
    const reservado = useMemo(() => {
        const r: Partial<Record<TipoResiduo, number>> = {};
        aprobadas.forEach((s) => {
            r[s.tipo] = (r[s.tipo] ?? 0) + (s.cantidad_aprobada ?? 0);
        });
        return r;
    }, [aprobadas]);

    const publicados = items.filter((i) => i.publicado);
    const totalKg = publicados.filter((i) => i.unidad === 'kg').reduce((s, i) => s + i.cantidad, 0);
    const totalL = publicados.filter((i) => i.unidad === 'L').reduce((s, i) => s + i.cantidad, 0);
    const tiposLibres = TIPOS_RESIDUO.filter((t) => !items.some((i) => i.tipo === t));

    const startEdit = (item: InventarioResiduo) => {
        setEditando(item.id);
        setCreando(false);
        setDraft({ tipo: item.tipo, cantidad: String(item.cantidad), notas: item.notas ?? '', publicado: item.publicado });
    };

    const cancel = () => {
        setEditando(null);
        setCreando(false);
        setDraft(BORRADOR_VACIO);
    };

    const save = async () => {
        const cantidad = Number(draft.cantidad);
        if (!draft.tipo) return toast.error('Selecciona el tipo de residuo.');
        if (draft.cantidad === '' || Number.isNaN(cantidad) || cantidad < 0) {
            return toast.error('La cantidad debe ser un número mayor o igual a 0.');
        }

        setGuardando(true);
        try {
            if (creando) {
                await createInventario({
                    tipo: draft.tipo,
                    cantidad,
                    unidad: UNIDAD_POR_TIPO[draft.tipo],
                    notas: draft.notas.trim() || null,
                    publicado: draft.publicado,
                });
                toast.success(`${TIPO_RESIDUO_LABEL[draft.tipo]} agregado al inventario`);
            } else if (editando) {
                await updateInventario(editando, {
                    cantidad,
                    notas: draft.notas.trim() || null,
                    publicado: draft.publicado,
                });
                toast.success('Inventario actualizado');
            }
            cancel();
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        } finally {
            setGuardando(false);
        }
    };

    const togglePublicado = async (item: InventarioResiduo) => {
        try {
            await updateInventario(item.id, { publicado: !item.publicado });
            toast.success(item.publicado ? 'Residuo oculto para las asociaciones' : 'Residuo publicado');
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const remove = async (item: InventarioResiduo) => {
        if (reservado[item.tipo]) {
            return toast.error('Hay solicitudes aprobadas de este residuo pendientes de recolectar. Complétalas o cancélalas primero.');
        }
        if (!confirm(`¿Eliminar ${TIPO_RESIDUO_LABEL[item.tipo]} del inventario?`)) return;
        try {
            await deleteInventario(item.id);
            toast.success('Residuo eliminado del inventario');
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    if (cargando) return <Cargando texto="Cargando inventario…" />;

    return (
        <div className="space-y-6">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPI
                    label="Tipos publicados"
                    value={`${publicados.length} / ${items.length}`}
                    icon={<Layers className="w-5 h-5" />}
                    gradient="from-blue-500 to-blue-700"
                />
                <KPI
                    label="Sólidos disponibles"
                    value={`${formatCantidad(totalKg)} kg`}
                    icon={<Package className="w-5 h-5" />}
                    gradient="from-emerald-500 to-emerald-700"
                />
                <KPI
                    label="Líquidos disponibles"
                    value={`${formatCantidad(totalL)} L`}
                    icon={<Droplets className="w-5 h-5" />}
                    gradient="from-orange-500 to-amber-600"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-gray-200 dark:border-gray-800 gap-3 flex-wrap">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inventario del centro de acopio</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Los residuos publicados son visibles para las empresas recolectoras. Al aprobar una
                            solicitud, la cantidad se descuenta del disponible.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setCreando(true);
                            setEditando(null);
                            setDraft({ ...BORRADOR_VACIO, tipo: tiposLibres[0] ?? '' });
                        }}
                        disabled={tiposLibres.length === 0 || creando}
                        title={tiposLibres.length === 0 ? 'Todos los tipos de residuo ya están en el inventario' : ''}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                        <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                        <span>Agregar residuo</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
                                <Th>Tipo</Th>
                                <Th>Disponible</Th>
                                <Th className="hidden md:table-cell">Por recolectar</Th>
                                <Th>Visibilidad</Th>
                                <Th className="hidden lg:table-cell">Notas</Th>
                                <Th className="hidden sm:table-cell">Actualizado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                            {creando && (
                                <FilaEdicion
                                    draft={draft}
                                    setDraft={setDraft}
                                    tiposDisponibles={tiposLibres}
                                    nuevo
                                    guardando={guardando}
                                    onSave={save}
                                    onCancel={cancel}
                                />
                            )}
                            {items.map((item, idx) =>
                                editando === item.id ? (
                                    <FilaEdicion
                                        key={item.id}
                                        draft={draft}
                                        setDraft={setDraft}
                                        tiposDisponibles={[item.tipo]}
                                        guardando={guardando}
                                        onSave={save}
                                        onCancel={cancel}
                                    />
                                ) : (
                                    <tr
                                        key={item.id}
                                        className="group bg-white dark:bg-slate-800 hover:bg-blue-50/30 dark:hover:bg-slate-700/30 transition-colors duration-150 animate-fade-in"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <td className="px-4 md:px-5 py-3.5">
                                            <ResiduoBadge tipo={item.tipo} />
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {formatCantidad(item.cantidad)}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{item.unidad}</span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 hidden md:table-cell whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                                            {reservado[item.tipo] ? `${formatCantidad(reservado[item.tipo]!)} ${item.unidad}` : '—'}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5">
                                            <button
                                                onClick={() => togglePublicado(item)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-colors ${
                                                    item.publicado
                                                        ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 hover:bg-emerald-200'
                                                        : 'bg-gray-100 text-gray-500 dark:bg-gray-800 dark:text-gray-400 hover:bg-gray-200'
                                                }`}
                                                title={item.publicado ? 'Ocultar a las asociaciones' : 'Publicar a las asociaciones'}
                                            >
                                                {item.publicado ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {item.publicado ? 'Publicado' : 'Oculto'}
                                            </button>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-[220px] truncate hidden lg:table-cell">
                                            {item.notas || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell whitespace-nowrap">
                                            {formatearFecha(item.updated_at)}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-right">
                                            <div className="inline-flex items-center gap-1 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Editar</span>
                                                </button>
                                                <button
                                                    onClick={() => remove(item)}
                                                    className="w-8 h-8 flex items-center justify-center rounded-lg bg-red-500 text-white hover:bg-red-600 transition-colors"
                                                    title="Eliminar"
                                                >
                                                    <Trash2 className="w-3.5 h-3.5" />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                )
                            )}
                            {items.length === 0 && !creando && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="inline-flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                <Package className="w-7 h-7 text-blue-500" />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Aún no hay residuos en el inventario. Agrega el primero para que las
                                                asociaciones puedan solicitarlo.
                                            </p>
                                        </div>
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

function FilaEdicion({
    draft,
    setDraft,
    tiposDisponibles,
    nuevo = false,
    guardando,
    onSave,
    onCancel,
}: {
    draft: Borrador;
    setDraft: (d: Borrador) => void;
    tiposDisponibles: TipoResiduo[];
    nuevo?: boolean;
    guardando: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    const campo =
        'px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent';
    return (
        <tr className="bg-blue-50/60 dark:bg-blue-900/10 animate-fade-in border-l-2 border-blue-500">
            <td className="px-4 md:px-5 py-3">
                <select
                    value={draft.tipo}
                    disabled={!nuevo}
                    onChange={(e) => setDraft({ ...draft, tipo: e.target.value as TipoResiduo })}
                    className={`w-full ${campo} disabled:opacity-70`}
                >
                    {nuevo && <option value="">Selecciona tipo…</option>}
                    {tiposDisponibles.map((t) => (
                        <option key={t} value={t}>
                            {TIPO_RESIDUO_LABEL[t]}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-4 md:px-5 py-3">
                <div className="flex items-center gap-1.5">
                    <input
                        type="number"
                        min={0}
                        step="0.01"
                        autoFocus={!nuevo}
                        value={draft.cantidad}
                        onChange={(e) => setDraft({ ...draft, cantidad: e.target.value })}
                        onKeyDown={(e) => e.key === 'Enter' && onSave()}
                        className={`w-28 ${campo}`}
                    />
                    <span className="text-xs text-gray-500 dark:text-gray-400">
                        {draft.tipo ? UNIDAD_POR_TIPO[draft.tipo] : ''}
                    </span>
                </div>
            </td>
            <td className="px-4 md:px-5 py-3 hidden md:table-cell" />
            <td className="px-4 md:px-5 py-3">
                <label className="inline-flex items-center gap-2 text-xs font-medium text-gray-700 dark:text-gray-300 cursor-pointer">
                    <input
                        type="checkbox"
                        checked={draft.publicado}
                        onChange={(e) => setDraft({ ...draft, publicado: e.target.checked })}
                        className="w-4 h-4 rounded accent-blue-600"
                    />
                    Publicado
                </label>
            </td>
            <td className="px-4 md:px-5 py-3 hidden lg:table-cell" colSpan={2}>
                <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={draft.notas}
                    onChange={(e) => setDraft({ ...draft, notas: e.target.value })}
                    className={`w-full ${campo}`}
                />
            </td>
            <td className="px-4 md:px-5 py-3 text-right">
                <div className="inline-flex items-center gap-1.5">
                    <button
                        onClick={onSave}
                        disabled={guardando}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-60 text-xs font-semibold shadow-sm transition-all active:scale-95"
                    >
                        {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Guardar
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all"
                        title="Cancelar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function Th({ children, className = '' }: { children?: React.ReactNode; className?: string }) {
    return (
        <th className={`px-4 md:px-5 py-3 text-left text-[11px] font-semibold text-gray-400 dark:text-gray-400 uppercase tracking-widest whitespace-nowrap ${className}`}>
            {children}
        </th>
    );
}

function KPI({
    label,
    value,
    icon,
    gradient,
}: {
    label: string;
    value: string;
    icon: React.ReactNode;
    gradient: string;
}) {
    return (
        <div className="group relative bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl p-5 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-300 overflow-hidden">
            <div className={`absolute inset-0 bg-gradient-to-br ${gradient} opacity-0 group-hover:opacity-5 transition-opacity duration-300`} />
            <div className="relative flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">{label}</p>
                    <p className="mt-2 text-2xl sm:text-3xl font-bold text-gray-900 dark:text-white tracking-tight">{value}</p>
                </div>
                <div className={`flex-shrink-0 w-11 h-11 rounded-xl bg-gradient-to-br ${gradient} text-white flex items-center justify-center shadow-md group-hover:scale-110 transition-transform duration-300`}>
                    {icon}
                </div>
            </div>
        </div>
    );
}

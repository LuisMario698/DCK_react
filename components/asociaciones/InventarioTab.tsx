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
import { BotonFlotante } from '@/components/ui/BotonFlotante';

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

    // Nueva fila de inventario (botón del encabezado y, en celular, la burbuja flotante)
    const agregarResiduo = () => {
        setCreando(true);
        setEditando(null);
        setDraft({ ...BORRADOR_VACIO, tipo: tiposLibres[0] ?? '' });
    };

    return (
        <div className="space-y-6 movil:space-y-3">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            {/* KPIs (en celular, los tres en una fila) */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 movil:grid-cols-3 movil:gap-2">
                <KPI
                    label="Tipos publicados"
                    value={`${publicados.length} / ${items.length}`}
                    icon={<Layers className="w-7 h-7" />}
                    gradient="bg-simar-marea-suave text-simar-marea-tinta"
                />
                <KPI
                    label="Sólidos disponibles"
                    value={`${formatCantidad(totalKg)} kg`}
                    icon={<Package className="w-7 h-7" />}
                    gradient="bg-simar-arrecife-suave text-simar-arrecife-tinta"
                />
                <KPI
                    label="Líquidos disponibles"
                    value={`${formatCantidad(totalL)} L`}
                    icon={<Droplets className="w-7 h-7" />}
                    gradient="bg-simar-coral-suave text-simar-coral"
                />
            </div>

            <div className="bg-simar-superficie border border-simar-borde rounded-2xl shadow-simar overflow-hidden transition-shadow">
                <div className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-simar-borde gap-3 flex-wrap movil:px-4 movil:py-4">
                    <div>
                        <h3 className="text-lg font-bold text-simar-texto">Inventario del centro de acopio</h3>
                        <p className="text-base text-simar-texto-2 mt-0.5">
                            Los residuos publicados son visibles para las empresas recolectoras. Al aprobar una
                            solicitud, la cantidad se descuenta del disponible.
                        </p>
                    </div>
                    <button
                        onClick={agregarResiduo}
                        disabled={tiposLibres.length === 0 || creando}
                        title={tiposLibres.length === 0 ? 'Todos los tipos de residuo ya están en el inventario' : ''}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-simar-marea hover:bg-simar-marea-hover text-white text-base font-bold rounded-xl shadow-simar transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed min-h-[52px] movil:hidden"
                    >
                        <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                        <span>Agregar residuo</span>
                    </button>
                </div>

                {/* En celular cada residuo es un bloque: tipo arriba; cantidad y visibilidad abajo; acciones a la derecha */}
                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse movil:block">
                        <thead className="movil:hidden">
                            <tr className="bg-simar-papel border-b border-simar-borde">
                                <Th>Tipo</Th>
                                <Th>Disponible</Th>
                                <Th className="hidden md:table-cell">Por recolectar</Th>
                                <Th>Visibilidad</Th>
                                <Th className="hidden lg:table-cell">Notas</Th>
                                <Th className="hidden sm:table-cell">Actualizado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-simar-borde-suave bg-simar-superficie movil:block">
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
                                        className="group bg-simar-superficie hover:bg-simar-marea-suave/30 transition-colors duration-150 movil:grid movil:grid-cols-[auto_1fr_auto] movil:items-center movil:gap-x-3 movil:gap-y-2 movil:px-3.5 movil:py-3"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <td className="px-4 md:px-5 py-3.5 movil:p-0 movil:col-span-2">
                                            <ResiduoBadge tipo={item.tipo} />
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap movil:p-0 movil:row-start-2 movil:col-start-1">
                                            <span className="text-base font-bold text-simar-texto">
                                                {formatCantidad(item.cantidad)}
                                            </span>
                                            <span className="text-[15px] text-simar-texto-2 ml-1">{item.unidad}</span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 hidden md:table-cell whitespace-nowrap text-base text-simar-texto-2">
                                            {reservado[item.tipo] ? `${formatCantidad(reservado[item.tipo]!)} ${item.unidad}` : '—'}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 movil:p-0 movil:row-start-2 movil:col-start-2">
                                            <button
                                                onClick={() => togglePublicado(item)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[15px] font-semibold transition-colors ${
                                                    item.publicado
                                                        ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta hover:bg-simar-arrecife-suave'
                                                        : 'bg-simar-papel text-simar-texto-2 hover:bg-simar-borde-suave'
                                                }`}
                                                title={item.publicado ? 'Ocultar a las asociaciones' : 'Publicar a las asociaciones'}
                                            >
                                                {item.publicado ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                                                {item.publicado ? 'Publicado' : 'Oculto'}
                                            </button>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-base text-simar-texto-2 max-w-[220px] truncate hidden lg:table-cell">
                                            {item.notas || <span className="text-simar-texto-2">—</span>}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-base text-simar-texto-2 hidden sm:table-cell whitespace-nowrap">
                                            {formatearFecha(item.updated_at)}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-right movil:p-0 movil:col-start-3 movil:row-start-1 movil:row-span-2">
                                            <div className="inline-flex items-center gap-2 movil:gap-1.5">
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    className="min-h-[44px] flex items-center gap-1.5 px-3.5 rounded-xl text-[15px] font-bold text-simar-texto border-2 border-simar-campo-borde bg-simar-superficie hover:border-simar-marea-tinta transition-colors"
                                                    title="Editar"
                                                    aria-label="Editar"
                                                >
                                                    <Pencil className="w-[18px] h-[18px]" />
                                                    <span className="hidden sm:inline">Editar</span>
                                                </button>
                                                <button
                                                    onClick={() => remove(item)}
                                                    className="w-11 h-11 flex items-center justify-center rounded-xl bg-simar-coral-suave text-simar-coral hover:bg-[#A63F0E] hover:text-white transition-colors"
                                                    title="Eliminar"
                                                    aria-label="Eliminar"
                                                >
                                                    <Trash2 className="w-[18px] h-[18px]" />
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
                                            <div className="w-14 h-14 rounded-full bg-simar-marea-suave flex items-center justify-center">
                                                <Package className="w-7 h-7 text-simar-marea-tinta" />
                                            </div>
                                            <p className="text-base text-simar-texto-2">
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

            {/* Celular: "Agregar residuo" flota encima de la barra de navegación */}
            <BotonFlotante
                icono={Plus}
                etiqueta="Agregar residuo"
                onClick={agregarResiduo}
                disabled={tiposLibres.length === 0 || creando}
                title={tiposLibres.length === 0 ? 'Todos los tipos de residuo ya están en el inventario' : undefined}
            />
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
        'px-3 py-2 text-base rounded-lg border border-simar-campo-borde bg-simar-superficie text-simar-texto focus:ring-2 focus:ring-simar-marea-tinta focus:border-transparent';
    return (
        <tr className="bg-simar-marea-suave/60 border-l-2 border-simar-marea-tinta movil:grid movil:grid-cols-2 movil:items-center movil:gap-2.5 movil:px-3.5 movil:py-3">
            <td className="px-4 md:px-5 py-3 movil:p-0 movil:col-span-2">
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
            <td className="px-4 md:px-5 py-3 movil:p-0">
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
                    <span className="text-[15px] text-simar-texto-2">
                        {draft.tipo ? UNIDAD_POR_TIPO[draft.tipo] : ''}
                    </span>
                </div>
            </td>
            <td className="px-4 md:px-5 py-3 hidden md:table-cell" />
            <td className="px-4 md:px-5 py-3 movil:p-0">
                <label className="inline-flex items-center gap-2 text-[15px] font-medium text-simar-texto cursor-pointer">
                    <input
                        type="checkbox"
                        checked={draft.publicado}
                        onChange={(e) => setDraft({ ...draft, publicado: e.target.checked })}
                        className="w-4 h-4 rounded accent-simar-marea-tinta"
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
            <td className="px-4 md:px-5 py-3 text-right movil:p-0 movil:col-span-2">
                <div className="inline-flex items-center gap-1.5">
                    <button
                        onClick={onSave}
                        disabled={guardando}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-white bg-[#127A5D] hover:bg-[#0E6A50] disabled:opacity-60 text-[15px] font-bold shadow-simar transition-all min-h-[52px]"
                    >
                        {guardando ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                        Guardar
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg text-simar-texto-2 hover:text-simar-coral hover:bg-simar-coral-suave transition-all min-w-[44px] min-h-[44px] inline-flex items-center justify-center"
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
        <th className={`px-4 md:px-5 py-3.5 text-left text-[15px] font-bold text-simar-texto-2 whitespace-nowrap ${className}`}>
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
    // Mismo dibujo que TarjetaDato (components/ui/simar.tsx); "gradient" es el tono del círculo
    return (
        // En celular (como TarjetaDato apilada): ícono y número en la primera línea, etiqueta debajo
        <div className="bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] p-5 flex items-center gap-4 movil:grid movil:grid-cols-[auto_1fr] movil:gap-x-2 movil:gap-y-1 movil:p-3">
            <span className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center movil:w-8 movil:h-8 movil:[&_svg]:w-[17px] movil:[&_svg]:h-[17px] ${gradient}`}>
                {icon}
            </span>
            <div className="min-w-0 movil:contents">
                <p className="text-[17px] text-simar-texto-2 leading-tight movil:order-3 movil:col-span-2 movil:text-[13px]">{label}</p>
                <p className="text-[30px] font-extrabold leading-tight text-simar-texto movil:order-2 movil:text-[17px] movil:whitespace-nowrap">{value}</p>
            </div>
        </div>
    );
}

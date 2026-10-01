'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { confirmar } from '@/components/ui/Confirmar';
import { Plus, Pencil, Trash2, Save, Package, Droplets, Layers, Eye, EyeOff } from 'lucide-react';
import {
    TIPOS_RESIDUO,
    TIPO_RESIDUO_COLOR,
    TIPO_RESIDUO_LABEL,
    UNIDAD_POR_TIPO,
    formatCantidad,
    unidadEscrita,
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
import { BotonPrimario, BotonSecundario, Campo, Cargando, ErrorCarga, Modal, ResiduoBadge, inputCls, mensajeError } from './ui';
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

    // Agregar y editar abren la misma ventana (Modal) en todos los tamaños; en celular sube como hoja
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
            toast.success(item.publicado ? 'Residuo oculto para las empresas' : 'Residuo publicado');
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    const remove = async (item: InventarioResiduo) => {
        if (reservado[item.tipo]) {
            return toast.error('Hay solicitudes aprobadas de este residuo pendientes de recolectar. Complétalas o cancélalas primero.');
        }
        const ok = await confirmar({ titulo: `¿Quitar ${TIPO_RESIDUO_LABEL[item.tipo].toLowerCase()} del inventario?`, mensaje: 'Las empresas recolectoras ya no lo verán. Puedes volver a agregarlo después.', accion: 'Quitar', peligro: true });
        if (!ok) return;
        try {
            await deleteInventario(item.id);
            toast.success('Residuo eliminado del inventario');
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    if (cargando) return <Cargando texto="Cargando inventario…" />;

    // Nuevo residuo (botón del encabezado y, en celular, la burbuja flotante): se toca uno de los
    // cuadros del material (si sólo queda uno, ya viene elegido)
    const agregarResiduo = () => {
        setCreando(true);
        setEditando(null);
        setDraft({ ...BORRADOR_VACIO, tipo: tiposLibres.length === 1 ? tiposLibres[0] : '' });
    };
    const itemEditando = items.find((i) => i.id === editando);

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
                    // El color del aceite (su residuo), no coral: en SiMAR el coral quiere decir "pendiente"
                    gradient={TIPO_RESIDUO_COLOR.aceite}
                />
            </div>

            <div className="bg-simar-superficie border border-simar-borde rounded-2xl shadow-simar overflow-hidden transition-shadow">
                <div className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-simar-borde gap-3 flex-wrap movil:px-4 movil:py-4">
                    <div>
                        <h3 className="text-lg font-bold text-simar-texto">Inventario del centro de acopio</h3>
                        <p className="text-base text-simar-texto-2 mt-0.5 movil:hidden">
                            Los residuos publicados son visibles para las empresas recolectoras. Al aprobar una
                            solicitud, la cantidad se descuenta del disponible.
                        </p>
                        {/* En celular, la versión corta (lo del descuento se explica al aprobar) */}
                        <p className="hidden movil:block text-[14px] text-simar-texto-2 mt-0.5">
                            Lo publicado lo ven las empresas recolectoras.
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
                            {items.map((item, idx) => (
                                    <tr
                                        key={item.id}
                                        className="group bg-simar-superficie hover:bg-simar-marea-suave/30 transition-colors duration-150 movil:grid movil:grid-cols-[auto_1fr_auto] movil:items-center movil:gap-x-3 movil:gap-y-2 movil:px-3.5 movil:py-3"
                                        style={{ animationDelay: `${idx * 30}ms` }}
                                    >
                                        <td className="px-4 md:px-5 py-3.5 movil:p-0 movil:col-span-2">
                                            <ResiduoBadge tipo={item.tipo} />
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 whitespace-nowrap movil:p-0 movil:row-start-2 movil:col-start-1">
                                            <span className="text-base font-bold text-simar-texto movil:text-[17px] movil:font-extrabold">
                                                {formatCantidad(item.cantidad)}
                                            </span>
                                            <span className="text-[15px] text-simar-texto-2 ml-1">{unidadEscrita(item.unidad, item.cantidad)}</span>
                                        </td>
                                        {/* En celular sólo si hay algo apartado, debajo de la cantidad */}
                                        <td className={`px-4 md:px-5 py-3.5 hidden md:table-cell whitespace-nowrap text-base text-simar-texto-2 movil:p-0 movil:row-start-3 movil:col-span-2 movil:text-[13px] ${reservado[item.tipo] ? 'movil:block' : ''}`}>
                                            {reservado[item.tipo] ? (
                                                <>
                                                    {formatCantidad(reservado[item.tipo]!)} {unidadEscrita(item.unidad, reservado[item.tipo]!)}
                                                    <span className="hidden movil:inline"> apartados por recolectar</span>
                                                </>
                                            ) : (
                                                '—'
                                            )}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 movil:p-0 movil:row-start-2 movil:col-start-2">
                                            <button
                                                onClick={() => togglePublicado(item)}
                                                className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[15px] font-semibold transition-colors ${
                                                    item.publicado
                                                        ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta hover:bg-simar-arrecife-suave'
                                                        : 'bg-simar-papel text-simar-texto-2 hover:bg-simar-borde-suave'
                                                }`}
                                                title={item.publicado ? 'Ocultar a las empresas' : 'Publicar a las empresas'}
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
                            ))}
                            {items.length === 0 && (
                                <tr>
                                    <td colSpan={7} className="px-6 py-16 text-center">
                                        <div className="inline-flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-simar-marea-suave flex items-center justify-center">
                                                <Package className="w-7 h-7 text-simar-marea-tinta" />
                                            </div>
                                            <p className="text-base text-simar-texto-2">
                                                Aún no hay residuos en el inventario. Agrega el primero para que las
                                                empresas puedan solicitarlo.
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

            {(creando || itemEditando) && (
                <FormularioResiduoModal
                    draft={draft}
                    setDraft={setDraft}
                    tiposDisponibles={creando ? tiposLibres : []}
                    apartado={draft.tipo ? reservado[draft.tipo] : undefined}
                    nuevo={creando}
                    guardando={guardando}
                    onSave={save}
                    onCancel={cancel}
                />
            )}
        </div>
    );
}

/**
 * Agregar o editar un residuo, en todos los tamaños: una ventana al centro en computadora y una hoja
 * que sube desde abajo en celular (el CSS de la versión móvil la vuelve hoja), como "Nueva
 * asociación". El tipo se elige tocando un cuadro, no en una lista. Antes, en computadora se editaba
 * dentro de la fila con una lista desplegable, un campo chico y una casilla.
 */
function FormularioResiduoModal({
    draft,
    setDraft,
    tiposDisponibles,
    apartado,
    nuevo,
    guardando,
    onSave,
    onCancel,
}: {
    draft: Borrador;
    setDraft: (d: Borrador) => void;
    tiposDisponibles: TipoResiduo[];
    /** Cantidad aprobada que aún no se recolecta de este tipo (ya descontada del disponible) */
    apartado?: number;
    nuevo: boolean;
    guardando: boolean;
    onSave: () => void;
    onCancel: () => void;
}) {
    const unidad = draft.tipo ? UNIDAD_POR_TIPO[draft.tipo] : null;
    const escrita = unidad ? unidadEscrita(unidad) : '';
    // En computadora, al editar, el cursor ya está en la cantidad (en celular no: abriría el teclado)
    const enfocar = !nuevo && window.matchMedia('(min-width: 640px)').matches;
    return (
        <Modal
            titulo={nuevo ? 'Agregar residuo' : 'Editar residuo'}
            subtitulo={nuevo ? 'Elige el material y di cuánto hay en el centro de acopio.' : undefined}
            onClose={onCancel}
        >
            <div className="space-y-5">
                {nuevo ? (
                    <div>
                        <p className="text-[17px] font-bold text-simar-texto mb-2">Tipo de residuo</p>
                        <div className="grid grid-cols-2 gap-2.5">
                            {tiposDisponibles.map((t) => {
                                const activo = draft.tipo === t;
                                const Icono = UNIDAD_POR_TIPO[t] === 'L' ? Droplets : Package;
                                return (
                                    <button
                                        key={t}
                                        type="button"
                                        aria-pressed={activo}
                                        onClick={() => setDraft({ ...draft, tipo: t })}
                                        className={`simar-presiona min-h-[60px] px-3 py-2 rounded-[18px] border-2 text-left flex items-center gap-2.5 transition-colors ${
                                            activo
                                                ? 'bg-simar-marea border-simar-marea text-white'
                                                : 'bg-simar-superficie border-simar-campo-borde text-simar-texto hover:border-simar-marea-tinta'
                                        }`}
                                    >
                                        <span className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center ${activo ? 'bg-white/20 text-white' : TIPO_RESIDUO_COLOR[t]}`}>
                                            <Icono className="w-[18px] h-[18px]" />
                                        </span>
                                        <span className="min-w-0">
                                            <span className="block text-[17px] font-bold leading-tight">{TIPO_RESIDUO_LABEL[t]}</span>
                                            <span className={`block text-[15px] leading-tight mt-0.5 ${activo ? 'text-white/85' : 'text-simar-texto-2'}`}>
                                                en {unidadEscrita(UNIDAD_POR_TIPO[t])}
                                            </span>
                                        </span>
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                ) : (
                    draft.tipo && <ResiduoBadge tipo={draft.tipo} size="md" />
                )}

                <Campo
                    label={`Cantidad disponible${escrita ? ` (${escrita})` : ''}`}
                    ayuda={
                        apartado && unidad
                            ? `Aparte hay ${formatCantidad(apartado)} ${unidadEscrita(unidad, apartado)} aprobados por recolectar; ya están descontados.`
                            : 'Lo que hay hoy en el centro de acopio.'
                    }
                >
                    <div className="relative">
                        <input
                            type="number"
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            placeholder="0"
                            autoFocus={enfocar}
                            value={draft.cantidad}
                            onChange={(e) => setDraft({ ...draft, cantidad: e.target.value })}
                            onKeyDown={(e) => e.key === 'Enter' && onSave()}
                            className={`${inputCls} pr-24`}
                        />
                        {unidad && (
                            <span className="absolute right-4 top-1/2 -translate-y-1/2 text-lg font-bold text-simar-texto-2 pointer-events-none">
                                {escrita}
                            </span>
                        )}
                    </div>
                </Campo>

                <Campo label="Notas (opcional)">
                    <textarea
                        rows={2}
                        value={draft.notas}
                        onChange={(e) => setDraft({ ...draft, notas: e.target.value })}
                        placeholder="Ej. En tambos junto al muelle 2"
                        className={inputCls}
                    />
                </Campo>

                {/* Toda la fila es el interruptor: más fácil de atinar que la palomita */}
                <button
                    type="button"
                    role="switch"
                    aria-checked={draft.publicado}
                    onClick={() => setDraft({ ...draft, publicado: !draft.publicado })}
                    className="simar-presiona w-full flex items-center gap-3 p-4 rounded-[18px] border-2 border-simar-campo-borde bg-simar-superficie text-left"
                >
                    <span className="flex-1 min-w-0">
                        <span className="flex items-center gap-1.5 text-[17px] font-bold text-simar-texto">
                            {draft.publicado ? <Eye className="w-[18px] h-[18px]" /> : <EyeOff className="w-[18px] h-[18px]" />}
                            {draft.publicado ? 'Publicado' : 'Oculto'}
                        </span>
                        <span className="block text-[15px] text-simar-texto-2 leading-snug mt-0.5">
                            {draft.publicado
                                ? 'Las empresas recolectoras lo ven y pueden pedirlo.'
                                : 'Las empresas no lo ven hasta que lo publiques.'}
                        </span>
                    </span>
                    {/* Medidas que la escala compacta no toca (30 px sí lo encoge): 50 × 29 y bolita de 23 */}
                    <span
                        aria-hidden="true"
                        className={`relative flex-shrink-0 w-[50px] h-[29px] rounded-full transition-colors ${draft.publicado ? 'bg-[#127A5D]' : 'bg-simar-campo-borde'}`}
                    >
                        <span
                            className={`absolute top-[3px] left-[3px] w-[23px] h-[23px] rounded-full bg-white shadow-simar transition-transform ${draft.publicado ? 'translate-x-[21px]' : ''}`}
                        />
                    </span>
                </button>

                <div className="grid grid-cols-2 gap-3 pt-1">
                    <BotonSecundario onClick={onCancel} disabled={guardando}>
                        Cancelar
                    </BotonSecundario>
                    <BotonPrimario onClick={onSave} cargando={guardando} disabled={!draft.tipo || draft.cantidad === ''}>
                        {nuevo ? <Plus className="w-5 h-5" /> : <Save className="w-5 h-5" />}
                        {nuevo ? 'Agregar' : 'Guardar'}
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
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

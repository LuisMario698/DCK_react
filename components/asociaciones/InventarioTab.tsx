'use client';

import { useState } from 'react';
import { Plus, Pencil, Trash2, Save, X, Package, Droplets, Layers } from 'lucide-react';
import {
    INVENTARIO_MOCK,
    TIPO_RESIDUO_LABEL,
    TIPO_RESIDUO_COLOR,
    formatFechaCorta,
    type ResiduoInventario,
    type TipoResiduo,
} from '@/lib/mock/asociaciones';

const TIPOS: TipoResiduo[] = ['plastico', 'aceite', 'carton', 'chatarra', 'vidrio', 'organico'];

export function InventarioTab() {
    const [items, setItems] = useState<ResiduoInventario[]>(INVENTARIO_MOCK);
    const [editando, setEditando] = useState<string | null>(null);
    const [draft, setDraft] = useState<Partial<ResiduoInventario>>({});
    const [creando, setCreando] = useState(false);

    const totalKg = items.filter((i) => i.unidad === 'kg').reduce((s, i) => s + i.cantidad, 0);
    const totalL = items.filter((i) => i.unidad === 'L').reduce((s, i) => s + i.cantidad, 0);

    const startEdit = (item: ResiduoInventario) => {
        setEditando(item.id);
        setDraft(item);
        setCreando(false);
    };

    const cancel = () => {
        setEditando(null);
        setDraft({});
        setCreando(false);
    };

    const save = () => {
        if (!draft.tipo || !draft.cantidad || !draft.unidad) return;
        const hoy = new Date().toISOString().slice(0, 10);
        if (creando) {
            setItems((prev) => [
                {
                    id: `r${Date.now()}`,
                    tipo: draft.tipo as TipoResiduo,
                    cantidad: Number(draft.cantidad),
                    unidad: draft.unidad as 'kg' | 'L',
                    actualizado: hoy,
                    notas: draft.notas,
                },
                ...prev,
            ]);
        } else if (editando) {
            setItems((prev) =>
                prev.map((i) =>
                    i.id === editando
                        ? { ...i, ...draft, cantidad: Number(draft.cantidad), actualizado: hoy } as ResiduoInventario
                        : i
                )
            );
        }
        cancel();
    };

    const remove = (id: string) => {
        if (!confirm('¿Eliminar este residuo del inventario publicado?')) return;
        setItems((prev) => prev.filter((i) => i.id !== id));
    };

    return (
        <div className="space-y-6">
            {/* KPIs */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <KPI
                    label="Tipos publicados"
                    value={items.length.toString()}
                    icon={<Layers className="w-5 h-5" />}
                    gradient="from-blue-500 to-blue-700"
                />
                <KPI
                    label="Total sólidos"
                    value={`${totalKg.toLocaleString('es-MX')} kg`}
                    icon={<Package className="w-5 h-5" />}
                    gradient="from-emerald-500 to-emerald-700"
                />
                <KPI
                    label="Total líquidos"
                    value={`${totalL.toLocaleString('es-MX')} L`}
                    icon={<Droplets className="w-5 h-5" />}
                    gradient="from-orange-500 to-amber-600"
                />
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl shadow-sm overflow-hidden transition-shadow hover:shadow-md">
                <div className="flex items-center justify-between px-5 sm:px-7 py-5 border-b border-gray-200 dark:border-gray-800 gap-3 flex-wrap">
                    <div>
                        <h3 className="text-lg font-bold text-gray-900 dark:text-white">Inventario publicado</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                            Estos son los residuos visibles para las empresas recolectoras.
                        </p>
                    </div>
                    <button
                        onClick={() => {
                            setCreando(true);
                            setEditando(null);
                            setDraft({ unidad: 'kg' });
                        }}
                        className="group inline-flex items-center gap-2 px-5 py-2.5 bg-gradient-to-br from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white text-sm font-semibold rounded-xl shadow-lg shadow-blue-600/20 hover:shadow-blue-600/40 transition-all duration-200 active:scale-95"
                    >
                        <Plus className="w-4 h-4 transition-transform duration-300 group-hover:rotate-90" />
                        <span>Publicar residuo</span>
                    </button>
                </div>

                <div className="overflow-x-auto">
                    <table className="min-w-full border-collapse">
                        <thead>
                            <tr className="bg-gray-50 dark:bg-slate-700/60 border-b border-gray-200 dark:border-slate-600">
                                <Th>Tipo</Th>
                                <Th>Cantidad</Th>
                                <Th>Notas</Th>
                                <Th className="hidden sm:table-cell">Actualizado</Th>
                                <Th className="text-right">Acciones</Th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-100 dark:divide-slate-700/60 bg-white dark:bg-slate-800">
                            {creando && (
                                <FilaEdicion
                                    draft={draft}
                                    setDraft={setDraft}
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
                                            <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold ${TIPO_RESIDUO_COLOR[item.tipo]}`}>
                                                <Package className="w-3 h-3" />
                                                {TIPO_RESIDUO_LABEL[item.tipo]}
                                            </span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5">
                                            <span className="text-sm font-bold text-gray-900 dark:text-white">
                                                {item.cantidad.toLocaleString('es-MX')}
                                            </span>
                                            <span className="text-xs text-gray-400 dark:text-gray-500 ml-1">{item.unidad}</span>
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 max-w-[200px] truncate">
                                            {item.notas || <span className="text-gray-300 dark:text-gray-600">—</span>}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-sm text-gray-500 dark:text-gray-400 hidden sm:table-cell whitespace-nowrap">
                                            {formatFechaCorta(item.actualizado)}
                                        </td>
                                        <td className="px-4 md:px-5 py-3.5 text-right">
                                            <div className="inline-flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                                                <button
                                                    onClick={() => startEdit(item)}
                                                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-slate-600 bg-white dark:bg-slate-800 hover:bg-gray-50 dark:hover:bg-slate-700 transition-all"
                                                    title="Editar"
                                                >
                                                    <Pencil className="w-3.5 h-3.5" />
                                                    <span className="hidden sm:inline">Editar</span>
                                                </button>
                                                <button
                                                    onClick={() => remove(item.id)}
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
                                    <td colSpan={5} className="px-6 py-16 text-center">
                                        <div className="inline-flex flex-col items-center gap-3">
                                            <div className="w-14 h-14 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
                                                <Package className="w-7 h-7 text-blue-500" />
                                            </div>
                                            <p className="text-sm text-gray-500 dark:text-gray-400">
                                                Aún no has publicado residuos.
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
    onSave,
    onCancel,
}: {
    draft: Partial<ResiduoInventario>;
    setDraft: (d: Partial<ResiduoInventario>) => void;
    onSave: () => void;
    onCancel: () => void;
}) {
    return (
        <tr className="bg-blue-50/60 dark:bg-blue-900/10 animate-fade-in border-l-2 border-blue-500">
            <td className="px-4 md:px-5 py-3">
                <select
                    value={draft.tipo || ''}
                    onChange={(e) => setDraft({ ...draft, tipo: e.target.value as TipoResiduo })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                >
                    <option value="">Selecciona tipo…</option>
                    {TIPOS.map((t) => (
                        <option key={t} value={t}>
                            {TIPO_RESIDUO_LABEL[t]}
                        </option>
                    ))}
                </select>
            </td>
            <td className="px-4 md:px-5 py-3">
                <div className="flex gap-1">
                    <input
                        type="number"
                        min={0}
                        value={draft.cantidad ?? ''}
                        onChange={(e) => setDraft({ ...draft, cantidad: Number(e.target.value) })}
                        className="w-24 px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                    <select
                        value={draft.unidad || 'kg'}
                        onChange={(e) => setDraft({ ...draft, unidad: e.target.value as 'kg' | 'L' })}
                        className="px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                    >
                        <option value="kg">kg</option>
                        <option value="L">L</option>
                    </select>
                </div>
            </td>
            <td className="px-4 md:px-5 py-3" colSpan={2}>
                <input
                    type="text"
                    placeholder="Notas (opcional)"
                    value={draft.notas || ''}
                    onChange={(e) => setDraft({ ...draft, notas: e.target.value })}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
            </td>
            <td className="px-4 md:px-5 py-3 text-right">
                <div className="inline-flex items-center gap-1.5">
                    <button
                        onClick={onSave}
                        className="inline-flex items-center gap-1 px-3 py-2 rounded-lg text-white bg-emerald-600 hover:bg-emerald-700 text-xs font-semibold shadow-sm transition-all hover:scale-105 active:scale-95"
                    >
                        <Save className="w-3.5 h-3.5" />
                        Guardar
                    </button>
                    <button
                        onClick={onCancel}
                        className="p-2 rounded-lg text-gray-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 transition-all hover:scale-110 active:scale-95"
                        title="Cancelar"
                    >
                        <X className="w-4 h-4" />
                    </button>
                </div>
            </td>
        </tr>
    );
}

function Th({ children, className = '' }: { children: React.ReactNode; className?: string }) {
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

'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Check, Layers, Pencil, Plus, Trash2, Users } from 'lucide-react';
import {
    BotonPrimario,
    BotonSecundario,
    Campo,
    Cargando,
    ErrorCarga,
    Modal,
    inputCls,
    mensajeError,
} from '@/components/asociaciones/ui';
import { BotonIcono, EstadoVacio, Interruptor, ModalConfirmar } from '@/components/superadmin/ui';
import {
    createPlan,
    deletePlan,
    getAsociacionesConSuscripcion,
    getPlanes,
    updatePlan,
    type PlanInput,
} from '@/lib/services/suscripciones';
import { formatoMXN } from '@/lib/constants/suscripciones';
import type { Plan } from '@/types/database';

export default function PlanesPage() {
    const [planes, setPlanes] = useState<Plan[] | null>(null);
    const [usoPorPlan, setUsoPorPlan] = useState<Map<number, number>>(new Map());
    const [error, setError] = useState<string | null>(null);
    const [editando, setEditando] = useState<Plan | 'nuevo' | null>(null);
    const [borrando, setBorrando] = useState<Plan | null>(null);

    const cargar = useCallback(
        () =>
            Promise.all([getPlanes(), getAsociacionesConSuscripcion()])
                .then(([p, asociaciones]) => {
                    const uso = new Map<number, number>();
                    for (const a of asociaciones) {
                        if (a.suscripcion) uso.set(a.suscripcion.plan_id, (uso.get(a.suscripcion.plan_id) ?? 0) + 1);
                    }
                    setPlanes(p);
                    setUsoPorPlan(uso);
                    setError(null);
                })
                .catch((err) => setError(mensajeError(err, 'No se pudieron cargar los planes.'))),
        []
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    const cambiarActivo = async (plan: Plan, activo: boolean) => {
        try {
            await updatePlan(plan.id, { activo });
            toast.success(activo ? `${plan.nombre} disponible para nuevas suscripciones` : `${plan.nombre} desactivado`);
            await cargar();
        } catch (err) {
            toast.error(mensajeError(err));
        }
    };

    if (error) return <ErrorCarga mensaje={error} onReintentar={cargar} />;
    if (!planes) return <Cargando texto="Cargando planes…" />;

    return (
        <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="text-base text-simar-texto-2 max-w-2xl">
                    Un plan desactivado ya no se ofrece en suscripciones nuevas, pero las existentes lo conservan. Los precios
                    son una referencia: cada suscripción guarda el precio acordado.
                </p>
                <BotonPrimario onClick={() => setEditando('nuevo')}>
                    <Plus className="w-4 h-4" />
                    Nuevo plan
                </BotonPrimario>
            </div>

            {planes.length === 0 ? (
                <div className="bg-simar-superficie border border-simar-borde rounded-2xl">
                    <EstadoVacio
                        icono={Layers}
                        titulo="Todavía no hay planes"
                        texto="Crea los planes que ofreces a las asociaciones recolectoras (por ejemplo Básico y Profesional)."
                        accion={
                            <BotonPrimario onClick={() => setEditando('nuevo')}>
                                <Plus className="w-4 h-4" />
                                Crear el primer plan
                            </BotonPrimario>
                        }
                    />
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
                    {planes.map((plan) => (
                        <TarjetaPlan
                            key={plan.id}
                            plan={plan}
                            uso={usoPorPlan.get(plan.id) ?? 0}
                            onEditar={() => setEditando(plan)}
                            onBorrar={() => setBorrando(plan)}
                            onActivo={(v) => cambiarActivo(plan, v)}
                        />
                    ))}
                </div>
            )}

            {editando && (
                <ModalPlan
                    plan={editando === 'nuevo' ? null : editando}
                    ordenSugerido={planes.length}
                    onClose={() => setEditando(null)}
                    onGuardado={async () => {
                        setEditando(null);
                        await cargar();
                    }}
                />
            )}

            {borrando && (
                <ModalConfirmar
                    titulo="Eliminar plan"
                    textoConfirmar="Eliminar"
                    peligro
                    onClose={() => setBorrando(null)}
                    onConfirmar={async () => {
                        try {
                            await deletePlan(borrando.id);
                            toast.success('Plan eliminado');
                            setBorrando(null);
                            await cargar();
                        } catch (err) {
                            toast.error(mensajeError(err));
                            throw err;
                        }
                    }}
                >
                    <p>
                        Se eliminará el plan <strong className="text-simar-texto">{borrando.nombre}</strong>. Queda
                        registro en la bitácora.
                    </p>
                </ModalConfirmar>
            )}
        </div>
    );
}

function TarjetaPlan({
    plan,
    uso,
    onEditar,
    onBorrar,
    onActivo,
}: {
    plan: Plan;
    uso: number;
    onEditar: () => void;
    onBorrar: () => void;
    onActivo: (v: boolean) => void;
}) {
    const mensual = Number(plan.precio_mensual);
    const anual = plan.precio_anual !== null ? Number(plan.precio_anual) : null;
    const ahorro = anual !== null && mensual > 0 ? Math.round((1 - anual / (mensual * 12)) * 100) : null;

    return (
        <article
            className={`flex flex-col bg-simar-superficie border rounded-2xl p-5 shadow-simar ${
                plan.activo ? 'border-simar-borde' : 'border-dashed border-simar-campo-borde opacity-75'
            }`}
        >
            <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                    <h3 className="text-base font-bold text-simar-texto">{plan.nombre}</h3>
                    {plan.descripcion && <p className="text-base text-simar-texto-2 mt-0.5">{plan.descripcion}</p>}
                </div>
                <Interruptor activo={plan.activo} onChange={onActivo} etiqueta={`Plan ${plan.nombre} activo`} />
            </div>

            <p className="mt-4">
                <span className="text-3xl font-extrabold text-simar-texto">{formatoMXN(mensual)}</span>
                <span className="text-base text-simar-texto-2"> / mes</span>
            </p>
            <p className="text-[15px] text-simar-texto-2 mt-1">
                {anual !== null
                    ? `${formatoMXN(anual)} al año${ahorro && ahorro > 0 ? ` · ${ahorro} % de ahorro` : ''}`
                    : 'Sin precio anual (se cobra 12 × mensual)'}
            </p>

            <ul className="mt-4 space-y-1.5 text-base text-simar-texto flex-1">
                <li className="flex items-center gap-2">
                    <Users className="w-4 h-4 text-simar-violeta" />
                    {plan.limite_usuarios ? `Hasta ${plan.limite_usuarios} usuario(s) por asociación` : 'Usuarios ilimitados'}
                </li>
                {plan.caracteristicas.map((c) => (
                    <li key={c} className="flex items-start gap-2">
                        <Check className="w-4 h-4 mt-0.5 text-simar-arrecife-tinta flex-shrink-0" />
                        {c}
                    </li>
                ))}
            </ul>

            <div className="mt-5 pt-4 border-t border-simar-borde flex items-center justify-between">
                <span className="text-[15px] text-simar-texto-2">
                    {uso === 0 ? 'Sin suscripciones' : `${uso} suscripción(es)`}
                </span>
                <div>
                    <BotonIcono icono={Pencil} etiqueta="Editar plan" onClick={onEditar} />
                    <BotonIcono
                        icono={Trash2}
                        etiqueta={uso > 0 ? 'Tiene suscripciones: desactívalo en lugar de eliminarlo' : 'Eliminar plan'}
                        disabled={uso > 0}
                        peligro
                        onClick={onBorrar}
                    />
                </div>
            </div>
        </article>
    );
}

function ModalPlan({
    plan,
    ordenSugerido,
    onClose,
    onGuardado,
}: {
    plan: Plan | null;
    ordenSugerido: number;
    onClose: () => void;
    onGuardado: () => Promise<void>;
}) {
    const [nombre, setNombre] = useState(plan?.nombre ?? '');
    const [descripcion, setDescripcion] = useState(plan?.descripcion ?? '');
    const [mensual, setMensual] = useState(plan ? String(plan.precio_mensual) : '');
    const [anual, setAnual] = useState(plan?.precio_anual != null ? String(plan.precio_anual) : '');
    const [limite, setLimite] = useState(plan?.limite_usuarios != null ? String(plan.limite_usuarios) : '');
    const [caracteristicas, setCaracteristicas] = useState((plan?.caracteristicas ?? []).join('\n'));
    const [orden, setOrden] = useState(String(plan?.orden ?? ordenSugerido));
    const [activo, setActivo] = useState(plan?.activo ?? true);
    const [guardando, setGuardando] = useState(false);

    const sugerenciaAnual = useMemo(() => (Number(mensual) > 0 ? Number(mensual) * 10 : null), [mensual]);

    const guardar = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!nombre.trim()) return toast.error('El nombre es obligatorio.');
        const precioMensual = Number(mensual);
        if (mensual === '' || Number.isNaN(precioMensual) || precioMensual < 0) return toast.error('El precio mensual no es válido.');
        if (anual !== '' && (Number.isNaN(Number(anual)) || Number(anual) < 0)) return toast.error('El precio anual no es válido.');
        if (limite !== '' && !(Number.isInteger(Number(limite)) && Number(limite) > 0)) {
            return toast.error('El límite de usuarios debe ser un entero mayor que cero.');
        }

        const datos: PlanInput = {
            nombre: nombre.trim(),
            descripcion: descripcion.trim() || null,
            precio_mensual: precioMensual,
            precio_anual: anual === '' ? null : Number(anual),
            limite_usuarios: limite === '' ? null : Number(limite),
            caracteristicas: caracteristicas
                .split('\n')
                .map((c) => c.trim())
                .filter(Boolean),
            activo,
            orden: Number(orden) || 0,
        };

        setGuardando(true);
        try {
            if (plan) await updatePlan(plan.id, datos);
            else await createPlan(datos);
            toast.success(plan ? 'Plan actualizado' : 'Plan creado');
            await onGuardado();
        } catch (err) {
            const msg = mensajeError(err);
            toast.error(msg.includes('duplicate key') ? 'Ya existe un plan con ese nombre.' : msg);
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Modal titulo={plan ? 'Editar plan' : 'Nuevo plan'} onClose={onClose} ancho="max-w-xl">
            <form onSubmit={guardar} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <Campo label="Nombre" className="sm:col-span-2">
                        <input className={inputCls} value={nombre} onChange={(e) => setNombre(e.target.value)} maxLength={80} autoFocus required />
                    </Campo>
                    <Campo label="Descripción" className="sm:col-span-2">
                        <input className={inputCls} value={descripcion} onChange={(e) => setDescripcion(e.target.value)} maxLength={200} />
                    </Campo>
                    <Campo label="Precio mensual (MXN)">
                        <input type="number" min={0} step="0.01" className={inputCls} value={mensual} onChange={(e) => setMensual(e.target.value)} required />
                    </Campo>
                    <Campo
                        label="Precio anual (MXN, opcional)"
                        ayuda={sugerenciaAnual ? `Sugerencia: ${formatoMXN(sugerenciaAnual)} (2 meses gratis)` : undefined}
                    >
                        <input type="number" min={0} step="0.01" className={inputCls} value={anual} onChange={(e) => setAnual(e.target.value)} />
                    </Campo>
                    <Campo label="Límite de usuarios" ayuda="Vacío = ilimitado. Se aplica al invitar usuarios.">
                        <input type="number" min={1} step={1} className={inputCls} value={limite} onChange={(e) => setLimite(e.target.value)} />
                    </Campo>
                    <Campo label="Orden" ayuda="Menor aparece primero.">
                        <input type="number" step={1} className={inputCls} value={orden} onChange={(e) => setOrden(e.target.value)} />
                    </Campo>
                    <Campo label="Características (una por línea)" className="sm:col-span-2">
                        <textarea
                            className={`${inputCls} min-h-[90px]`}
                            value={caracteristicas}
                            onChange={(e) => setCaracteristicas(e.target.value)}
                            placeholder={'Solicitudes ilimitadas\nComprobantes PDF\nSoporte por chat'}
                        />
                    </Campo>
                </div>

                <label className="flex items-center justify-between gap-3 rounded-xl border border-simar-borde px-4 py-3">
                    <span className="text-base font-medium text-simar-texto">Disponible para nuevas suscripciones</span>
                    <Interruptor activo={activo} onChange={setActivo} etiqueta="Plan activo" />
                </label>

                <div className="flex justify-end gap-2 pt-2">
                    <BotonSecundario type="button" onClick={onClose}>
                        Cancelar
                    </BotonSecundario>
                    <BotonPrimario type="submit" cargando={guardando}>
                        Guardar
                    </BotonPrimario>
                </div>
            </form>
        </Modal>
    );
}

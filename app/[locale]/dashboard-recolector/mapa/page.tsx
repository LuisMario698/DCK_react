'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import { CheckCircle2, MapPin, Anchor, RefreshCw, Package, Filter, Send } from 'lucide-react';
import {
    PUERTO_PENASCO,
    TIPO_RESIDUO_HEX,
    TIPO_RESIDUO_LABEL,
    formatCantidad,
    tiempoRelativo,
    type TipoResiduo,
} from '@/lib/constants/residuos';
import { hoyLocal } from '@/lib/utils/fechas';
import { InventarioResiduo } from '@/types/database';
import { getInventario } from '@/lib/services/inventario';
import { crearSolicitud } from '@/lib/services/solicitudes';
import { suscribirCambios } from '@/lib/services/notificaciones';
import { useRecolector } from '@/components/recolector/RecolectorContext';
import { MapaCentroAcopio } from '@/components/recolector/MapaCentroAcopio';
import {
    BotonPrimario,
    BotonSecundario,
    Campo,
    Cargando,
    ErrorCarga,
    Modal,
    ResiduoBadge,
    inputCls,
    mensajeError,
} from '@/components/asociaciones/ui';

export default function MapaPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const { asociacion, bloqueada } = useRecolector();

    const [inventario, setInventario] = useState<InventarioResiduo[]>([]);
    const [cargando, setCargando] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [soloMios, setSoloMios] = useState(false);
    const [solicitar, setSolicitar] = useState<InventarioResiduo | null>(null);

    const cargar = useCallback(async () => {
        try {
            setInventario(await getInventario(true));
            setError(null);
        } catch (err) {
            setError(mensajeError(err, 'No se pudo cargar el inventario.'));
        } finally {
            setCargando(false);
        }
    }, []);

    useEffect(() => {
        cargar();
        return suscribirCambios('inventario_residuos', cargar);
    }, [cargar]);

    const misTipos = asociacion?.tipos_residuo ?? [];
    const visibles = inventario.filter((i) => !soloMios || misTipos.length === 0 || misTipos.includes(i.tipo));
    const disponibles = inventario.filter((i) => i.cantidad > 0);
    const ultimaActualizacion = inventario.reduce<string | null>(
        (max, i) => (!max || i.updated_at > max ? i.updated_at : max),
        null
    );

    if (cargando) return <Cargando texto="Cargando residuos disponibles…" />;

    return (
        <div className="space-y-5">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            {/* KPI Bar */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
                {[
                    { label: 'Centro de acopio', value: PUERTO_PENASCO.nombre, icon: Anchor, color: '#00c9a7' },
                    { label: 'Residuos disponibles', value: String(disponibles.length), icon: CheckCircle2, color: '#10b981' },
                    {
                        label: 'Sólidos disponibles',
                        value: `${formatCantidad(disponibles.filter((i) => i.unidad === 'kg').reduce((s, i) => s + i.cantidad, 0))} kg`,
                        icon: Package,
                        color: '#3b82f6',
                    },
                    {
                        label: 'Actualizado',
                        value: ultimaActualizacion ? tiempoRelativo(ultimaActualizacion) : '—',
                        icon: RefreshCw,
                        color: '#f59e0b',
                    },
                ].map(({ label, value, icon: Icon, color }) => (
                    <div key={label} className="bg-simar-superficie border border-simar-borde rounded-xl p-4 shadow-simar">
                        <div className="flex items-center gap-2 mb-2">
                            <Icon className="w-4 h-4" style={{ color }} />
                            <span className="text-[15px] font-medium text-simar-texto-2">{label}</span>
                        </div>
                        <div className="text-lg sm:text-2xl font-extrabold text-simar-texto truncate">{value}</div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Mapa */}
                <div className="lg:col-span-2 h-[420px] lg:h-[560px]">
                    <MapaCentroAcopio alto="h-full" zoom={15} />
                </div>

                {/* Panel lateral: inventario del centro de acopio */}
                <div className="bg-simar-superficie border border-simar-borde rounded-xl overflow-hidden flex flex-col shadow-simar" style={{ minHeight: 520 }}>
                    <div className="p-5 border-b border-simar-borde">
                        <div className="flex items-center gap-2 text-[15px] text-simar-texto-2 mb-1">
                            <MapPin className="w-3.5 h-3.5" />
                            <span>{PUERTO_PENASCO.region}</span>
                        </div>
                        <h3 className="text-xl font-extrabold text-simar-texto flex items-center gap-2">
                            <Anchor className="w-5 h-5 text-simar-marea-tinta" />
                            {PUERTO_PENASCO.nombre}
                        </h3>
                        <span
                            className={`mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[15px] font-bold ${
                                disponibles.length > 0
                                    ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta'
                                    : 'bg-simar-papel text-simar-texto-2'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${disponibles.length > 0 ? 'bg-[#127A5D]' : 'bg-simar-campo-borde'}`} />
                            {disponibles.length > 0 ? 'Con residuos disponibles' : 'Sin disponibilidad por ahora'}
                        </span>
                    </div>

                    <div className="relative w-full h-36 overflow-hidden border-b border-simar-borde">
                        <Image
                            src={PUERTO_PENASCO.imagen}
                            alt={`Vista de ${PUERTO_PENASCO.nombre}`}
                            fill
                            className="object-cover"
                            sizes="(max-width: 768px) 100vw, 400px"
                        />
                    </div>

                    <div className="p-5 flex-1 overflow-y-auto">
                        <div className="flex items-center justify-between mb-3">
                            <p className="text-[15px] font-bold text-simar-texto-2">Residuos publicados</p>
                            {misTipos.length > 0 && (
                                <button
                                    onClick={() => setSoloMios((v) => !v)}
                                    className={`inline-flex items-center gap-1 text-[15px] font-semibold ${soloMios ? 'text-simar-marea-tinta' : 'text-simar-texto-2'}`}
                                >
                                    <Filter className="w-3 h-3" />
                                    {soloMios ? 'Sólo los que recolecto' : 'Todos'}
                                </button>
                            )}
                        </div>
                        {visibles.length === 0 ? (
                            <div className="text-center py-8 text-simar-texto-2">
                                <Package className="w-8 h-8 mx-auto mb-2 opacity-30" />
                                <p className="text-base">El centro de acopio no tiene residuos publicados.</p>
                            </div>
                        ) : (
                            <ul className="space-y-2.5">
                                {visibles.map((r) => {
                                    const accent = TIPO_RESIDUO_HEX[r.tipo];
                                    const agotado = r.cantidad <= 0;
                                    return (
                                        <li
                                            key={r.id}
                                            className="p-3 rounded-xl border transition-all border-simar-borde"
                                            style={{ background: `${accent}0d`, borderColor: `${accent}33` }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-base font-semibold text-simar-texto">
                                                    {TIPO_RESIDUO_LABEL[r.tipo]}
                                                </span>
                                                <span className="text-base font-bold tabular-nums" style={{ color: accent }}>
                                                    {formatCantidad(r.cantidad)} {r.unidad}
                                                </span>
                                            </div>
                                            {r.notas && <p className="text-[15px] text-simar-texto-2 mt-1">{r.notas}</p>}
                                            <button
                                                onClick={() => setSolicitar(r)}
                                                disabled={agotado || bloqueada}
                                                className="mt-3 w-full min-h-[52px] inline-flex items-center justify-center gap-2 text-[17px] font-bold rounded-2xl text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-40 disabled:cursor-not-allowed transition-all min-h-[52px]"
                                            >
                                                <Send className="w-3.5 h-3.5" />
                                                {agotado ? 'Agotado' : 'Solicitar recolección'}
                                            </button>
                                        </li>
                                    );
                                })}
                            </ul>
                        )}
                    </div>

                    <div className="p-4 border-t border-simar-borde text-[15px] text-simar-texto-2">
                        ¿Dudas sobre un residuo?{' '}
                        <Link href={`/${locale}/dashboard-recolector/mensajes`} className="font-bold text-simar-marea-tinta underline-offset-4 hover:underline">
                            Escribe al centro de acopio
                        </Link>
                    </div>
                </div>
            </div>

            {solicitar && (
                <SolicitarModal
                    residuo={solicitar}
                    onClose={() => setSolicitar(null)}
                    onCreada={() => {
                        setSolicitar(null);
                        cargar();
                    }}
                    locale={locale}
                />
            )}
        </div>
    );
}

function SolicitarModal({
    residuo,
    onClose,
    onCreada,
    locale,
}: {
    residuo: InventarioResiduo;
    onClose: () => void;
    onCreada: () => void;
    locale: string;
}) {
    const hoy = hoyLocal();
    const [cantidad, setCantidad] = useState(String(residuo.cantidad));
    const [fecha, setFecha] = useState(hoy);
    const [mensaje, setMensaje] = useState('');
    const [enviando, setEnviando] = useState(false);

    const valor = Number(cantidad);
    const invalida = !cantidad || Number.isNaN(valor) || valor <= 0 || valor > residuo.cantidad || !fecha || fecha < hoy;

    const enviar = async () => {
        setEnviando(true);
        try {
            await crearSolicitud({ tipo: residuo.tipo as TipoResiduo, cantidad: valor, fechaPropuesta: fecha, mensaje });
            toast.success('Solicitud enviada al centro de acopio', {
                description: 'Te avisaremos cuando la aprueben.',
                action: {
                    label: 'Ver',
                    onClick: () => (window.location.href = `/${locale}/dashboard-recolector/solicitudes`),
                },
            });
            onCreada();
        } catch (err) {
            toast.error(mensajeError(err));
            setEnviando(false);
        }
    };

    return (
        <Modal titulo="Solicitar recolección" subtitulo={`${PUERTO_PENASCO.nombre} · disponible: ${formatCantidad(residuo.cantidad)} ${residuo.unidad}`} onClose={onClose}>
            <div className="space-y-4">
                <ResiduoBadge tipo={residuo.tipo} size="md" />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <Campo label={`Cantidad (${residuo.unidad})`} ayuda={`Máximo ${formatCantidad(residuo.cantidad)} ${residuo.unidad}`}>
                        <input
                            type="number"
                            min={0}
                            step="0.01"
                            max={residuo.cantidad}
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            className={inputCls}
                            autoFocus
                        />
                    </Campo>
                    <Campo label="Fecha propuesta de recolección">
                        <input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
                    </Campo>
                </div>
                <Campo label="Mensaje (opcional)" ayuda="Horario, tipo de unidad que enviarás, persona que recoge…">
                    <textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={inputCls} />
                </Campo>
                <div className="grid grid-cols-2 gap-3 pt-1">
                    <BotonSecundario onClick={onClose}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={enviar} cargando={enviando} disabled={invalida}>
                        <Send className="w-4 h-4" /> Enviar solicitud
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

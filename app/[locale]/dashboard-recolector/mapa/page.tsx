'use client';

import { useCallback, useEffect, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
    CheckCircle2,
    MapPin,
    Anchor,
    RefreshCw,
    Package,
    Filter,
    Send,
    Droplets,
    Map as MapIcon,
    MessageSquare,
    Navigation,
} from 'lucide-react';
import {
    PUERTO_PENASCO,
    TIPO_RESIDUO_COLOR,
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
    ControlSegmentado,
    ErrorCarga,
    Modal,
    ResiduoBadge,
    inputCls,
    mensajeError,
} from '@/components/asociaciones/ui';
import { TarjetaDato, claseChip } from '@/components/ui/simar';
import { useEsCelular } from '@/components/layout/useEsCelular';

export default function MapaPage() {
    const pathname = usePathname();
    const locale = pathname.split('/')[1] || 'es';
    const { asociacion, bloqueada } = useRecolector();
    const esCelular = useEsCelular();

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

    const ventanaSolicitar = solicitar && (
        <SolicitarModal
            residuo={solicitar}
            onClose={() => setSolicitar(null)}
            onCreada={() => {
                setSolicitar(null);
                cargar();
            }}
            locale={locale}
            enfocar={!esCelular}
        />
    );

    // Celular: otra pantalla, pensada para pedir rápido (sin montar el mapa escondido)
    if (esCelular) {
        return (
            <ResiduosCelular
                inventario={inventario}
                visibles={visibles}
                disponibles={disponibles.length}
                ultimaActualizacion={ultimaActualizacion}
                misTipos={misTipos}
                soloMios={soloMios}
                onSoloMios={setSoloMios}
                bloqueada={bloqueada}
                locale={locale}
                error={error}
                onReintentar={cargar}
                onSolicitar={setSolicitar}
            >
                {ventanaSolicitar}
            </ResiduosCelular>
        );
    }

    return (
        <div className="space-y-5">
            {error && <ErrorCarga mensaje={error} onReintentar={cargar} />}

            {/* Datos del centro de acopio: formato común (TarjetaDato) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-3 sm:gap-4">
                {[
                    { label: 'Centro de acopio', value: PUERTO_PENASCO.nombre, icon: Anchor, tono: 'marea' as const },
                    { label: 'Residuos disponibles', value: String(disponibles.length), icon: CheckCircle2, tono: 'arrecife' as const },
                    {
                        label: 'Sólidos disponibles',
                        value: `${formatCantidad(disponibles.filter((i) => i.unidad === 'kg').reduce((s, i) => s + i.cantidad, 0))} kg`,
                        icon: Package,
                        tono: 'violeta' as const,
                    },
                    {
                        label: 'Actualizado',
                        value: ultimaActualizacion ? tiempoRelativo(ultimaActualizacion) : '—',
                        icon: RefreshCw,
                        tono: 'neutro' as const,
                    },
                ].map(({ label, value, icon, tono }, i) => (
                    <TarjetaDato
                        key={label}
                        etiqueta={label}
                        valor={value}
                        icono={icon}
                        tono={tono}
                        compacto
                        className="simar-aparece"
                        style={{ animationDelay: `${i * 0.04}s` }}
                    />
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
                {/* Mapa enmarcado como tarjeta; ocupa toda la altura del panel de residuos */}
                <section className="simar-aparece lg:col-span-2 bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-2 flex flex-col" style={{ animationDelay: '0.16s' }}>
                    <div className="flex-1 min-h-[400px] rounded-[22px] overflow-hidden">
                        <MapaCentroAcopio alto="h-full" zoom={15} />
                    </div>
                </section>

                {/* Panel lateral: inventario del centro de acopio */}
                <div className="simar-aparece bg-simar-superficie border border-simar-borde rounded-[28px] overflow-hidden flex flex-col shadow-simar" style={{ minHeight: 520, animationDelay: '0.22s' }}>
                    <div className="p-5 border-b border-simar-borde">
                        <div className="flex items-center gap-2 text-[15px] text-simar-texto-2 mb-1">
                            <MapPin className="w-[18px] h-[18px]" />
                            <span>{PUERTO_PENASCO.region}</span>
                        </div>
                        <h3 className="text-[22px] font-extrabold text-simar-texto flex items-center gap-2">
                            <Anchor className="w-6 h-6 text-simar-marea-tinta" />
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
                        <div className="flex items-center justify-between gap-3 mb-3">
                            <p className="text-[17px] font-bold text-simar-texto">Residuos publicados</p>
                            {misTipos.length > 0 && (
                                <button
                                    onClick={() => setSoloMios((v) => !v)}
                                    aria-pressed={soloMios}
                                    className={`${claseChip(soloMios)} inline-flex items-center gap-2`}
                                >
                                    <Filter className="w-[18px] h-[18px]" />
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
                            <ul className="space-y-3">
                                {visibles.map((r, i) => {
                                    // El color del residuo va en una franja a la izquierda (siempre con su nombre escrito);
                                    // la cantidad en texto oscuro: en color no se leía (DISEÑO_SIMAR.md → categorías).
                                    const accent = TIPO_RESIDUO_HEX[r.tipo];
                                    const agotado = r.cantidad <= 0;
                                    return (
                                        <li
                                            key={r.id}
                                            className="simar-aparece p-4 pl-5 rounded-2xl border border-simar-borde border-l-[6px] bg-simar-superficie"
                                            style={{ borderLeftColor: accent, animationDelay: `${0.26 + i * 0.05}s` }}
                                        >
                                            <div className="flex items-center justify-between gap-2">
                                                <span className="text-[17px] font-bold text-simar-texto">
                                                    {TIPO_RESIDUO_LABEL[r.tipo]}
                                                </span>
                                                <span className="text-[17px] font-extrabold tabular-nums text-simar-texto">
                                                    {formatCantidad(r.cantidad)} {r.unidad}
                                                </span>
                                            </div>
                                            {r.notas && <p className="text-[15px] text-simar-texto-2 mt-1">{r.notas}</p>}
                                            <button
                                                onClick={() => setSolicitar(r)}
                                                disabled={agotado || bloqueada}
                                                className="simar-presiona mt-3 w-full min-h-[52px] inline-flex items-center justify-center gap-2 text-[17px] font-bold rounded-2xl text-white bg-simar-marea hover:bg-simar-marea-hover disabled:opacity-40 disabled:cursor-not-allowed"
                                            >
                                                <Send className="w-5 h-5" />
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

            {ventanaSolicitar}
        </div>
    );
}

/**
 * Residuos disponibles en celular (menos de 640 px). Lo que la empresa viene a hacer es pedir, así que:
 * - arriba, el centro de acopio en una tarjeta corta (foto, nombre, cuántos residuos hay) con el mapa
 *   y el chat a un toque: el mapa sube en una hoja con "Cómo llegar", en vez de ocupar media pantalla;
 * - debajo, la lista en renglones: color e ícono del material, nombre, cantidad y "Solicitar" a la
 *   derecha (antes cada residuo era una tarjeta alta con un botón a todo lo ancho);
 * - si la empresa eligió sus materiales, el control segmentado "Todos · Los que recolecto".
 * Ver DISEÑO_SIMAR.md → "Versión móvil".
 */
function ResiduosCelular({
    inventario,
    visibles,
    disponibles,
    ultimaActualizacion,
    misTipos,
    soloMios,
    onSoloMios,
    bloqueada,
    locale,
    error,
    onReintentar,
    onSolicitar,
    children,
}: {
    inventario: InventarioResiduo[];
    visibles: InventarioResiduo[];
    disponibles: number;
    ultimaActualizacion: string | null;
    misTipos: TipoResiduo[];
    soloMios: boolean;
    onSoloMios: (v: boolean) => void;
    bloqueada: boolean;
    locale: string;
    error: string | null;
    onReintentar: () => void;
    onSolicitar: (r: InventarioResiduo) => void;
    /** Ventana de solicitar (la maneja la pantalla) */
    children?: React.ReactNode;
}) {
    const [mapaAbierto, setMapaAbierto] = useState(false);
    const botonSecundario =
        'simar-presiona min-h-[42px] rounded-[14px] border-2 border-simar-campo-borde bg-simar-superficie text-[14px] font-bold text-simar-texto hover:border-simar-marea-tinta inline-flex items-center justify-center gap-2';

    return (
        <div className="space-y-3">
            {error && <ErrorCarga mensaje={error} onReintentar={onReintentar} />}

            {/* Centro de acopio */}
            <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] p-3">
                <div className="flex items-center gap-3">
                    <div className="relative w-[68px] h-[68px] flex-shrink-0 rounded-[16px] overflow-hidden bg-simar-papel">
                        <Image src={PUERTO_PENASCO.imagen} alt={`Vista de ${PUERTO_PENASCO.nombre}`} fill className="object-cover" sizes="68px" />
                    </div>
                    <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-1 text-[13px] text-simar-texto-2">
                            <Anchor className="w-3.5 h-3.5 flex-shrink-0 text-simar-marea-tinta" />
                            Centro de acopio · {PUERTO_PENASCO.region}
                        </p>
                        <h2 className="text-[18px] font-extrabold leading-tight text-simar-texto">{PUERTO_PENASCO.nombre}</h2>
                        <p
                            className={`mt-1 inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[13px] font-bold ${
                                disponibles > 0 ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta' : 'bg-simar-papel text-simar-texto-2'
                            }`}
                        >
                            <span className={`w-1.5 h-1.5 rounded-full ${disponibles > 0 ? 'bg-[#127A5D]' : 'bg-simar-campo-borde'}`} />
                            {disponibles > 0
                                ? `${disponibles} ${disponibles === 1 ? 'residuo disponible' : 'residuos disponibles'}`
                                : 'Sin disponibilidad por ahora'}
                        </p>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-2 mt-3">
                    <button type="button" onClick={() => setMapaAbierto(true)} className={botonSecundario}>
                        <MapIcon className="w-[18px] h-[18px] text-simar-marea-tinta" />
                        Ver mapa
                    </button>
                    <Link href={`/${locale}/dashboard-recolector/mensajes`} className={botonSecundario}>
                        <MessageSquare className="w-[18px] h-[18px] text-simar-marea-tinta" />
                        Escribir
                    </Link>
                </div>
            </section>

            {/* Residuos publicados */}
            <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] overflow-hidden" style={{ animationDelay: '0.06s' }}>
                <div className="px-3.5 pt-3 pb-2.5 border-b border-simar-borde space-y-2.5">
                    <div className="flex items-baseline justify-between gap-2">
                        <h3 className="text-[16px] font-extrabold text-simar-texto">Residuos publicados</h3>
                        {ultimaActualizacion && (
                            <span className="text-[13px] text-simar-texto-2 whitespace-nowrap">
                                Actualizado {tiempoRelativo(ultimaActualizacion).toLowerCase()}
                            </span>
                        )}
                    </div>
                    {misTipos.length > 0 && (
                        <ControlSegmentado
                            etiqueta="Qué residuos ver"
                            valor={soloMios ? 'mios' : 'todos'}
                            onCambiar={(v) => onSoloMios(v === 'mios')}
                            opciones={[
                                { valor: 'todos', texto: 'Todos', conteo: inventario.length },
                                {
                                    valor: 'mios',
                                    texto: 'Los que recolecto',
                                    conteo: inventario.filter((i) => misTipos.includes(i.tipo)).length,
                                },
                            ]}
                        />
                    )}
                </div>

                {visibles.length === 0 ? (
                    <div className="flex flex-col items-center gap-2 px-5 py-9 text-center text-simar-texto-2">
                        <Package className="w-9 h-9 opacity-40" />
                        {soloMios && inventario.length > 0 ? (
                            <>
                                <p className="text-[15px] font-bold text-simar-texto">Ahora no hay de los residuos que recolectas.</p>
                                <button type="button" onClick={() => onSoloMios(false)} className="min-h-[40px] text-[14px] font-bold text-simar-marea-tinta underline underline-offset-4">
                                    Ver todos los residuos
                                </button>
                            </>
                        ) : (
                            <>
                                <p className="text-[15px] font-bold text-simar-texto">El centro de acopio no tiene residuos publicados.</p>
                                <p className="text-[14px] leading-snug">Te avisaremos en Notificaciones cuando publique uno.</p>
                            </>
                        )}
                    </div>
                ) : (
                    <ul className="divide-y divide-simar-borde-suave">
                        {visibles.map((r, i) => {
                            // Color del material en el círculo (siempre con su nombre escrito); la cantidad en
                            // texto oscuro: en color no se leía (DISEÑO_SIMAR.md → categorías)
                            const agotado = r.cantidad <= 0;
                            const Icono = r.unidad === 'L' ? Droplets : Package;
                            return (
                                <li
                                    key={r.id}
                                    className="simar-aparece flex items-center gap-3 px-3.5 py-3"
                                    style={{ animationDelay: `${0.1 + Math.min(i, 6) * 0.04}s` }}
                                >
                                    <span className={`w-10 h-10 flex-shrink-0 rounded-full flex items-center justify-center ${TIPO_RESIDUO_COLOR[r.tipo]}`}>
                                        <Icono className="w-5 h-5" />
                                    </span>
                                    <div className="min-w-0 flex-1">
                                        <p className="text-[16px] font-bold leading-tight text-simar-texto">{TIPO_RESIDUO_LABEL[r.tipo]}</p>
                                        <p className="text-[14px] text-simar-texto-2 mt-0.5">
                                            <strong className="text-[16px] font-extrabold tabular-nums text-simar-texto">
                                                {formatCantidad(r.cantidad)}
                                            </strong>{' '}
                                            {r.unidad}
                                            {!agotado && ' disponibles'}
                                        </p>
                                        {r.notas && <p className="text-[13px] leading-snug text-simar-texto-2 mt-0.5 line-clamp-2">{r.notas}</p>}
                                    </div>
                                    {agotado ? (
                                        <span className="flex-shrink-0 px-3 py-1.5 rounded-full bg-simar-papel text-[13px] font-bold text-simar-texto-2">
                                            Agotado
                                        </span>
                                    ) : (
                                        <button
                                            type="button"
                                            onClick={() => onSolicitar(r)}
                                            disabled={bloqueada}
                                            aria-label={`Solicitar recolección de ${TIPO_RESIDUO_LABEL[r.tipo].toLowerCase()}`}
                                            className="simar-presiona flex-shrink-0 min-h-[42px] px-3.5 rounded-[14px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[14px] font-bold inline-flex items-center gap-1.5 disabled:opacity-40 disabled:cursor-not-allowed"
                                        >
                                            <Send className="w-4 h-4" />
                                            Solicitar
                                        </button>
                                    )}
                                </li>
                            );
                        })}
                    </ul>
                )}
            </section>

            {/* El mapa sube en una hoja: sólo se monta al abrirla */}
            {mapaAbierto && (
                <Modal
                    titulo="Centro de acopio"
                    subtitulo={`${PUERTO_PENASCO.nombre}, ${PUERTO_PENASCO.region}`}
                    onClose={() => setMapaAbierto(false)}
                >
                    <div className="space-y-3">
                        <div className="h-[46dvh] min-h-[240px] rounded-[16px] overflow-hidden border border-simar-borde-suave">
                            <MapaCentroAcopio alto="h-full" zoom={15} />
                        </div>
                        <a
                            href={`https://www.google.com/maps/dir/?api=1&destination=${PUERTO_PENASCO.lat},${PUERTO_PENASCO.lng}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="simar-presiona w-full min-h-[46px] rounded-[14px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[16px] font-bold inline-flex items-center justify-center gap-2"
                        >
                            <Navigation className="w-5 h-5" />
                            Cómo llegar
                        </a>
                        <p className="text-center text-[13px] text-simar-texto-2">Se abre en Google Maps.</p>
                    </div>
                </Modal>
            )}

            {children}
        </div>
    );
}

function SolicitarModal({
    residuo,
    onClose,
    onCreada,
    locale,
    enfocar = true,
}: {
    residuo: InventarioResiduo;
    onClose: () => void;
    onCreada: () => void;
    locale: string;
    /** En celular no: el teclado taparía media hoja antes de ver qué se pide */
    enfocar?: boolean;
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
                            inputMode="decimal"
                            min={0}
                            step="0.01"
                            max={residuo.cantidad}
                            value={cantidad}
                            onChange={(e) => setCantidad(e.target.value)}
                            className={inputCls}
                            autoFocus={enfocar}
                        />
                    </Campo>
                    <Campo label="Fecha propuesta de recolección">
                        <input type="date" min={hoy} value={fecha} onChange={(e) => setFecha(e.target.value)} className={inputCls} />
                    </Campo>
                </div>
                <Campo label="Mensaje (opcional)" ayuda="Horario, tipo de unidad que enviarás, persona que recoge…">
                    <textarea rows={3} value={mensaje} onChange={(e) => setMensaje(e.target.value)} className={inputCls} />
                </Campo>
                {/* En celular la acción principal lleva el ancho sobrante: "Enviar solicitud" en una línea */}
                <div className="grid grid-cols-2 gap-3 pt-1 movil:grid-cols-[auto_1fr]">
                    <BotonSecundario onClick={onClose}>Cancelar</BotonSecundario>
                    <BotonPrimario onClick={enviar} cargando={enviando} disabled={invalida}>
                        <Send className="w-4 h-4" /> Enviar solicitud
                    </BotonPrimario>
                </div>
            </div>
        </Modal>
    );
}

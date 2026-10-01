'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { toast } from 'sonner';
import { Database, ExternalLink, HardDrive, Megaphone, ShieldAlert, Wrench } from 'lucide-react';
import { BotonPrimario, Campo, Cargando, ErrorCarga, inputCls, mensajeError } from '@/components/asociaciones/ui';
import { Interruptor, Kpi, ModalConfirmar, Tarjeta, formatoBytes, formatoNumero, tdCls, thCls } from '@/components/superadmin/ui';
import { EVENTO_CONFIG_ACTUALIZADA } from '@/components/layout/AvisoGlobal';
import {
    getConfiguracion,
    guardarConfiguracion,
    type ConfiguracionSistema,
    type TipoAviso,
} from '@/lib/services/configuracion';
import { getMetricas, type MetricasSistema } from '@/lib/services/superadmin';
import { getAsociacionesConSuscripcion, type AsociacionConSuscripcion } from '@/lib/services/suscripciones';
import { estadoEfectivo } from '@/lib/constants/suscripciones';

const TIPO_AVISO_LABEL: Record<TipoAviso, string> = {
    info: 'Informativo',
    advertencia: 'Advertencia',
    critico: 'Crítico',
};

export default function SistemaPage() {
    const [config, setConfig] = useState<ConfiguracionSistema | null>(null);
    const [metricas, setMetricas] = useState<MetricasSistema | null>(null);
    const [asociaciones, setAsociaciones] = useState<AsociacionConSuscripcion[]>([]);
    const [error, setError] = useState<string | null>(null);

    const cargar = useCallback(
        () =>
            Promise.all([getConfiguracion(), getMetricas(), getAsociacionesConSuscripcion()])
                .then(([c, m, a]) => {
                    setConfig(c);
                    setMetricas(m);
                    setAsociaciones(a);
                    setError(null);
                })
                .catch((err) => setError(mensajeError(err, 'No se pudo cargar la configuración del sistema.'))),
        []
    );

    useEffect(() => {
        cargar();
    }, [cargar]);

    const guardar = async <K extends keyof ConfiguracionSistema>(clave: K, valor: ConfiguracionSistema[K], exito: string) => {
        try {
            await guardarConfiguracion(clave, valor);
            setConfig((c) => (c ? { ...c, [clave]: valor } : c));
            window.dispatchEvent(new Event(EVENTO_CONFIG_ACTUALIZADA));
            toast.success(exito);
        } catch (err) {
            toast.error(mensajeError(err));
            throw err;
        }
    };

    if (error) return <ErrorCarga mensaje={error} onReintentar={cargar} />;
    if (!config || !metricas) return <Cargando texto="Cargando sistema…" />;

    return (
        <div className="space-y-6 movil:space-y-3">
            <div className="grid grid-cols-1 xl:grid-cols-3 gap-6 movil:gap-3">
                <TarjetaMantenimiento
                    valor={config.mantenimiento}
                    onGuardar={(v) => guardar('mantenimiento', v, v.activo ? 'Modo mantenimiento activado' : 'Modo mantenimiento guardado')}
                />
                <TarjetaAviso
                    valor={config.aviso_global}
                    onGuardar={(v) => guardar('aviso_global', v, v.activo ? 'Aviso publicado' : 'Aviso guardado')}
                />
                <TarjetaSuscripciones
                    valor={config.suscripciones}
                    asociaciones={asociaciones}
                    onGuardar={(v) => guardar('suscripciones', v, 'Reglas de suscripción guardadas')}
                />
            </div>

            <Recursos metricas={metricas} />
        </div>
    );
}

function TarjetaMantenimiento({
    valor,
    onGuardar,
}: {
    valor: ConfiguracionSistema['mantenimiento'];
    onGuardar: (v: ConfiguracionSistema['mantenimiento']) => Promise<void>;
}) {
    const [mensaje, setMensaje] = useState(valor.mensaje ?? '');
    const [confirmando, setConfirmando] = useState<boolean | null>(null);
    const [guardando, setGuardando] = useState(false);

    const guardarMensaje = async () => {
        setGuardando(true);
        try {
            await onGuardar({ ...valor, mensaje: mensaje.trim() });
        } catch {
            // aviso ya mostrado
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Tarjeta titulo="Modo mantenimiento" subtitulo="Cierra los paneles a todos excepto a los superadmins">
            <div className="space-y-4">
                <div
                    className={`flex items-center justify-between gap-3 rounded-xl px-4 py-3 ${
                        valor.activo ? 'bg-simar-violeta-suave' : 'bg-simar-papel'
                    }`}
                >
                    <span className="flex items-center gap-2 text-base font-semibold text-simar-texto">
                        <Wrench className="w-4 h-4" />
                        {valor.activo ? 'Activo' : 'Desactivado'}
                    </span>
                    <Interruptor activo={valor.activo} onChange={setConfirmando} etiqueta="Modo mantenimiento" />
                </div>
                <Campo label="Mensaje para los usuarios" ayuda="Se muestra en la página de mantenimiento.">
                    <textarea
                        className={`${inputCls} min-h-[80px]`}
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="Estamos actualizando SiMAR. Vuelve a intentarlo en unos minutos."
                        maxLength={400}
                    />
                </Campo>
                <BotonPrimario onClick={guardarMensaje} cargando={guardando} disabled={mensaje.trim() === (valor.mensaje ?? '')}>
                    Guardar mensaje
                </BotonPrimario>
            </div>

            {confirmando !== null && (
                <ModalConfirmar
                    titulo={confirmando ? 'Activar modo mantenimiento' : 'Desactivar modo mantenimiento'}
                    textoConfirmar={confirmando ? 'Activar' : 'Desactivar'}
                    peligro={confirmando}
                    onClose={() => setConfirmando(null)}
                    onConfirmar={async () => {
                        await onGuardar({ activo: confirmando, mensaje: mensaje.trim() });
                        setConfirmando(null);
                    }}
                >
                    {confirmando ? (
                        <p>
                            Administradores y recolectores serán enviados a la página de mantenimiento en su siguiente
                            navegación. Sólo los superadmins podrán usar los paneles.
                        </p>
                    ) : (
                        <p>Todos los usuarios podrán volver a entrar a sus paneles.</p>
                    )}
                </ModalConfirmar>
            )}
        </Tarjeta>
    );
}

function TarjetaAviso({
    valor,
    onGuardar,
}: {
    valor: ConfiguracionSistema['aviso_global'];
    onGuardar: (v: ConfiguracionSistema['aviso_global']) => Promise<void>;
}) {
    const [activo, setActivo] = useState(valor.activo);
    const [tipo, setTipo] = useState<TipoAviso>(valor.tipo ?? 'info');
    const [mensaje, setMensaje] = useState(valor.mensaje ?? '');
    const [guardando, setGuardando] = useState(false);

    const sinCambios = activo === valor.activo && tipo === (valor.tipo ?? 'info') && mensaje.trim() === (valor.mensaje ?? '');

    const guardar = async () => {
        if (activo && !mensaje.trim()) return toast.error('Escribe el mensaje del aviso.');
        setGuardando(true);
        try {
            await onGuardar({ activo, tipo, mensaje: mensaje.trim() });
        } catch {
            // aviso ya mostrado
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Tarjeta titulo="Aviso global" subtitulo="Banner en los paneles de administrador y recolector">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-simar-papel">
                    <span className="flex items-center gap-2 text-base font-semibold text-simar-texto">
                        <Megaphone className="w-4 h-4" />
                        {activo ? 'Visible' : 'Oculto'}
                    </span>
                    <Interruptor activo={activo} onChange={setActivo} etiqueta="Mostrar aviso global" />
                </div>
                <Campo label="Tipo">
                    <select className={inputCls} value={tipo} onChange={(e) => setTipo(e.target.value as TipoAviso)}>
                        {(Object.keys(TIPO_AVISO_LABEL) as TipoAviso[]).map((t) => (
                            <option key={t} value={t}>
                                {TIPO_AVISO_LABEL[t]}
                            </option>
                        ))}
                    </select>
                </Campo>
                <Campo label="Mensaje">
                    <textarea
                        className={`${inputCls} min-h-[80px]`}
                        value={mensaje}
                        onChange={(e) => setMensaje(e.target.value)}
                        placeholder="El sábado de 22:00 a 23:00 h el sistema estará en mantenimiento."
                        maxLength={400}
                    />
                </Campo>
                <BotonPrimario onClick={guardar} cargando={guardando} disabled={sinCambios}>
                    {activo ? 'Publicar aviso' : 'Guardar'}
                </BotonPrimario>
            </div>
        </Tarjeta>
    );
}

function TarjetaSuscripciones({
    valor,
    asociaciones,
    onGuardar,
}: {
    valor: ConfiguracionSistema['suscripciones'];
    asociaciones: AsociacionConSuscripcion[];
    onGuardar: (v: ConfiguracionSistema['suscripciones']) => Promise<void>;
}) {
    const [obligatorias, setObligatorias] = useState(valor.obligatorias);
    const [dias, setDias] = useState(String(valor.dias_prueba));
    const [guardando, setGuardando] = useState(false);

    // Asociaciones activas que se quedarían sin poder crear solicitudes
    const bloqueadas = useMemo(
        () =>
            asociaciones.filter((a) => {
                if (a.estado !== 'Activo') return false;
                const s = a.suscripcion;
                if (!s) return true;
                const e = estadoEfectivo(s.estado, s.vence_el);
                return e !== 'activa' && e !== 'prueba';
            }),
        [asociaciones]
    );

    const diasNum = Number(dias);
    const sinCambios = obligatorias === valor.obligatorias && diasNum === valor.dias_prueba;

    const guardar = async () => {
        if (!Number.isInteger(diasNum) || diasNum < 1 || diasNum > 365) return toast.error('Los días de prueba deben estar entre 1 y 365.');
        setGuardando(true);
        try {
            await onGuardar({ obligatorias, dias_prueba: diasNum });
        } catch {
            // aviso ya mostrado
        } finally {
            setGuardando(false);
        }
    };

    return (
        <Tarjeta titulo="Reglas de suscripción" subtitulo="Qué pasa cuando una empresa no está al corriente">
            <div className="space-y-4">
                <div className="flex items-center justify-between gap-3 rounded-xl px-4 py-3 bg-simar-papel">
                    <span className="flex items-center gap-2 text-base font-semibold text-simar-texto">
                        <ShieldAlert className="w-4 h-4" />
                        Suscripción obligatoria
                    </span>
                    <Interruptor activo={obligatorias} onChange={setObligatorias} etiqueta="Suscripción obligatoria" />
                </div>
                <p className="text-[15px] text-simar-texto-2">
                    {obligatorias
                        ? 'Una empresa sin suscripción en prueba o activa (sin vencer) no puede crear solicitudes de recolección.'
                        : 'Las suscripciones son informativas: ninguna empresa se bloquea por no pagar.'}
                </p>
                {obligatorias && bloqueadas.length > 0 && (
                    <p className="rounded-lg bg-simar-coral-suave border border-simar-coral/30 px-3 py-2 text-[15px] text-simar-coral">
                        {bloqueadas.length} empresa(s) activa(s) quedarían bloqueadas:{' '}
                        {bloqueadas
                            .slice(0, 4)
                            .map((a) => a.nombre_asociacion)
                            .join(', ')}
                        {bloqueadas.length > 4 ? '…' : ''}
                    </p>
                )}
                <Campo label="Días de prueba" ayuda="Se proponen al crear una suscripción nueva.">
                    <input type="number" min={1} max={365} className={inputCls} value={dias} onChange={(e) => setDias(e.target.value)} />
                </Campo>
                <BotonPrimario onClick={guardar} cargando={guardando} disabled={sinCambios}>
                    Guardar
                </BotonPrimario>
            </div>
        </Tarjeta>
    );
}

function Recursos({ metricas }: { metricas: MetricasSistema }) {
    const storageTotal = metricas.storage.reduce((s, b) => s + b.bytes, 0);
    const archivos = metricas.storage.reduce((s, b) => s + b.archivos, 0);
    const tablas = [...metricas.tablas].sort((a, b) => b.bytes - a.bytes);
    const url = process.env.NEXT_PUBLIC_SB_URL ?? '';
    const ref = url.match(/^https:\/\/([a-z0-9]+)\.supabase\.co/)?.[1];

    return (
        <div className="space-y-6 movil:space-y-3">
            {/* En celular, dos por fila */}
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4 movil:grid-cols-2 movil:gap-2.5">
                <Kpi label="Base de datos" valor={formatoBytes(metricas.bd_bytes)} icono={Database} detalle={`${tablas.length} tablas en public`} />
                <Kpi label="Storage" valor={formatoBytes(storageTotal)} icono={HardDrive} detalle={`${formatoNumero(archivos)} archivo(s) en ${metricas.storage.length} bucket(s)`} />
                <Kpi label="Cuentas sin confirmar" valor={metricas.usuarios.sin_confirmar} icono={ShieldAlert} detalle="Correo aún no verificado" />
                <Kpi label="Invitaciones pendientes" valor={metricas.invitaciones_pendientes} icono={Megaphone} detalle="Correos que aún no se registran" />
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6 movil:gap-3">
                <Tarjeta
                    titulo="Buckets de Storage"
                    sinPadding
                    acciones={
                        ref && (
                            <a
                                href={`https://supabase.com/dashboard/project/${ref}`}
                                target="_blank"
                                rel="noreferrer"
                                className="inline-flex items-center gap-1 text-[15px] font-semibold text-simar-violeta hover:underline"
                            >
                                Abrir Supabase <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                        )
                    }
                >
                    {/* En celular cada bucket es un bloque (cuatro columnas no caben): nombre y tamaño arriba,
                        acceso y archivos debajo */}
                    <table className="w-full movil:block">
                        <thead className="border-y border-simar-borde movil:hidden">
                            <tr>
                                <th className={thCls}>Bucket</th>
                                <th className={thCls}>Acceso</th>
                                <th className={`${thCls} text-right`}>Archivos</th>
                                <th className={`${thCls} text-right`}>Tamaño</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-simar-borde-suave movil:block movil:border-t movil:border-simar-borde">
                            {metricas.storage.map((b) => (
                                <tr key={b.bucket} className="movil:grid movil:grid-cols-[1fr_auto] movil:items-start movil:gap-x-3 movil:px-4 movil:py-2.5">
                                    <td className={`${tdCls} font-mono text-[15px] movil:p-0 movil:min-w-0 movil:break-all`}>
                                        {b.bucket}
                                        <p className="hidden movil:block font-sans text-[13px] text-simar-texto-2">
                                            <span className={`font-semibold ${b.publico ? 'text-simar-coral' : 'text-simar-arrecife-tinta'}`}>
                                                {b.publico ? 'Público' : 'Privado'}
                                            </span>{' '}
                                            · {formatoNumero(b.archivos)} archivo(s)
                                        </p>
                                    </td>
                                    <td className={`${tdCls} movil:hidden`}>
                                        <span className={`text-[15px] font-semibold ${b.publico ? 'text-simar-coral' : 'text-simar-arrecife-tinta'}`}>
                                            {b.publico ? 'Público' : 'Privado'}
                                        </span>
                                    </td>
                                    <td className={`${tdCls} text-right tabular-nums movil:hidden`}>{formatoNumero(b.archivos)}</td>
                                    <td className={`${tdCls} text-right tabular-nums movil:p-0 movil:whitespace-nowrap`}>{formatoBytes(b.bytes)}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </Tarjeta>

                <Tarjeta titulo="Tablas" subtitulo="Filas exactas y tamaño en disco (con índices)" sinPadding>
                    <div className="max-h-[420px] overflow-y-auto">
                        <table className="w-full">
                            {/* En celular, márgenes más cortos para que las tres columnas quepan */}
                            <thead className="sticky top-0 bg-simar-superficie border-y border-simar-borde">
                                <tr>
                                    <th className={`${thCls} movil:px-3`}>Tabla</th>
                                    <th className={`${thCls} text-right movil:px-3`}>Filas</th>
                                    <th className={`${thCls} text-right movil:px-3`}>Tamaño</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-simar-borde-suave">
                                {tablas.map((t) => (
                                    <tr key={t.tabla}>
                                        <td className={`${tdCls} font-mono text-[15px] movil:px-3 movil:break-all`}>{t.tabla}</td>
                                        <td className={`${tdCls} text-right tabular-nums movil:px-3`}>{formatoNumero(t.filas)}</td>
                                        <td className={`${tdCls} text-right tabular-nums movil:px-3 movil:whitespace-nowrap`}>{formatoBytes(t.bytes)}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </Tarjeta>
            </div>
        </div>
    );
}

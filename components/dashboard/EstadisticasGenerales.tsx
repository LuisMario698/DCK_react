'use client';

/**
 * Pestaña "Estadísticas" del recinto: todo sale del mismo período (ver getEstadisticasPeriodo).
 * En el orden en que se lee: el período (con su resumen en PDF y el reporte de un mes para SEMARNAT); un titular de una línea
 * (la frase completa se abre aparte); cuatro cifras; la tendencia de un residuo a la vez (cada uno
 * en su unidad: nunca se suman kilos con litros) junto a las embarcaciones (las que más entregan y
 * las que no entregan); a dónde se fue lo recibido; y el impacto estimado como cierre.
 * Sólo dibuja: los datos y el período los maneja DashboardClient.
 */
import { useState, useSyncExternalStore, type ReactNode } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { toast } from 'sonner';
import {
    ArrowDownRight,
    ArrowUpRight,
    Check,
    ChevronDown,
    ChevronRight,
    Clock,
    Download,
    Droplet,
    FileText,
    Leaf,
    LineChart,
    Loader2,
    Minus,
    Ship,
    Trash2,
    Truck,
    type LucideIcon,
} from 'lucide-react';
import { NumeroAnimado } from '@/components/ui/movimiento';
import type { EstadisticasPeriodo, Granularidad, PeriodoEstadisticas, SinEntregar, TotalesPeriodo, TramoSerie } from '@/lib/services/dashboard_stats';
import { DestinoResiduos } from './DestinoResiduos';
import { ReporteDelMes } from './ReporteDelMes';
import {
    aguaProtegidaL,
    co2EvitadoKg,
    decimalesEquivalencia,
    equivalenciaAgua,
    equivalenciaBasura,
    equivalenciaCO2,
    type Equivalencia,
} from '@/lib/utils/equivalencias';
import {
    KG_CAMION_RECOLECTOR,
    KG_CO2_POR_ARBOL_ANIO,
    LITROS_AGUA_POR_LITRO_ACEITE,
    LITROS_ALBERCA_OLIMPICA,
    RECINTO_CO2_POR_KG_BASURON,
    RECINTO_CO2_POR_LITRO_ACEITE,
} from '@/lib/constants/impacto';

export const PERIODOS: { valor: PeriodoEstadisticas; texto: string }[] = [
    { valor: 'semana', texto: '7 días' },
    { valor: 'mes', texto: '1 mes' },
    { valor: 'trimestre', texto: '3 meses' },
    { valor: 'anio', texto: '1 año' },
    { valor: 'todo', texto: 'Todo' },
];

export const TEXTO_PERIODO: Record<PeriodoEstadisticas, { actual: string; anterior: string; contra: string }> = {
    semana: { actual: 'En los últimos 7 días', anterior: 'los 7 días anteriores', contra: 'vs. 7 días antes' },
    mes: { actual: 'En el último mes', anterior: 'el mes anterior', contra: 'vs. mes anterior' },
    trimestre: { actual: 'En los últimos 3 meses', anterior: 'los 3 meses anteriores', contra: 'vs. 3 meses antes' },
    anio: { actual: 'En el último año', anterior: 'el año anterior', contra: 'vs. año anterior' },
    todo: { actual: '', anterior: '', contra: '' },
};

export const POR_TRAMO: Record<Granularidad, string> = { dia: 'por día', semana: 'por semana', mes: 'por mes', anio: 'por año' };

/** kg y L: sin decimales desde 100; abajo de eso, uno si hace falta */
const decimalesDe = (n: number) => (Math.abs(n) < 100 && !Number.isInteger(n) ? 1 : 0);
const formato = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: decimalesDe(n) });

type Direccion = 'sube' | 'baja' | 'igual' | 'nuevo';
export function cambio(actual: number, anterior: number): { direccion: Direccion; porcentaje: number } {
    if (anterior === 0) return { direccion: actual === 0 ? 'igual' : 'nuevo', porcentaje: 0 };
    const p = Math.round(((actual - anterior) / anterior) * 100);
    return { direccion: p > 0 ? 'sube' : p < 0 ? 'baja' : 'igual', porcentaje: Math.abs(p) };
}

// ── Contenedor ────────────────────────────────────────────────────────────────

export function EstadisticasGenerales({
    datos,
    periodo,
    onCambiarPeriodo,
    actualizando,
    onVerEmbarcacion,
    sinEntregar,
}: {
    datos: EstadisticasPeriodo;
    periodo: PeriodoEstadisticas;
    onCambiarPeriodo: (p: PeriodoEstadisticas) => void;
    actualizando: boolean;
    onVerEmbarcacion?: (buqueId: number) => void;
    /** Embarcaciones activas que no entregan desde hace tiempo (no depende del período) */
    sinEntregar?: SinEntregar;
}) {
    const { actual, anterior } = datos;
    const contra = TEXTO_PERIODO[periodo].contra;

    // El PDF (y jsPDF) se cargan al tocar el botón: no pesan en la pantalla
    const [generandoPdf, setGenerandoPdf] = useState(false);
    const claseBoton =
        'simar-presiona inline-flex items-center justify-center gap-2 min-h-[48px] px-4 rounded-[14px] border border-simar-borde bg-simar-superficie text-base font-bold text-simar-texto shadow-simar hover:bg-simar-papel disabled:opacity-60 movil:min-h-[38px] movil:gap-1.5 movil:px-3 movil:rounded-full movil:text-[13.5px] movil:shadow-none';
    const descargarPdf = async () => {
        setGenerandoPdf(true);
        try {
            const { descargarResumenPdf } = await import('./pdfEstadisticas');
            await descargarResumenPdf(datos, sinEntregar);
        } catch (e) {
            console.error('Error generando el PDF:', e);
            toast.error('No se pudo generar el PDF. Inténtalo de nuevo.');
        } finally {
            setGenerandoPdf(false);
        }
    };

    return (
        <div className="space-y-6 movil:space-y-3.5">
            <SelectorPeriodo
                periodo={periodo}
                onCambiar={onCambiarPeriodo}
                actualizando={actualizando}
                accion={
                    <div className="grid grid-cols-2 gap-2 sm:flex sm:items-center movil:gap-1.5">
                        <button
                            type="button"
                            onClick={descargarPdf}
                            // Mientras llega otro período el PDF saldría con los datos anteriores
                            disabled={generandoPdf || actualizando}
                            aria-busy={generandoPdf}
                            className={claseBoton}
                        >
                            {generandoPdf ? <Loader2 className="w-5 h-5 animate-spin movil:w-4 movil:h-4" aria-hidden="true" /> : <Download className="w-5 h-5 movil:w-4 movil:h-4" aria-hidden="true" />}
                            {generandoPdf ? 'Generando…' : 'PDF del período'}
                        </button>
                        <ReporteDelMes className={claseBoton} />
                    </div>
                }
            />

            {/* Mientras llega el período nuevo se ve el anterior atenuado; luego números y barras pasan al valor nuevo */}
            <div aria-busy={actualizando} className={`space-y-6 transition-opacity duration-200 movil:space-y-3.5 ${actualizando ? 'opacity-60' : ''}`}>
                <ResumenPeriodo datos={datos} />

                <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 movil:gap-2.5">
                    <Cifra
                        icono={Trash2}
                        tono="marea"
                        etiqueta="Basura"
                        valor={actual.basuraKg}
                        unidad="kg"
                        anterior={anterior?.basuraKg}
                        contra={contra}
                        detalle={`${actual.manifiestos.toLocaleString('es-MX')} manifiestos`}
                        orden={0}
                    />
                    <Cifra
                        icono={Droplet}
                        tono="coral"
                        etiqueta="Aceite usado"
                        valor={actual.aceiteL}
                        unidad="L"
                        anterior={anterior?.aceiteL}
                        contra={contra}
                        detalle="Litros recolectados"
                        orden={1}
                    />
                    <Cifra
                        icono={Truck}
                        tono="arrecife"
                        etiqueta="Basurón"
                        valor={actual.basuronKg}
                        unidad="kg"
                        anterior={anterior?.basuronKg}
                        contra={contra}
                        detalle={`${actual.entregasBasuron.toLocaleString('es-MX')} ${actual.entregasBasuron === 1 ? 'entrega' : 'entregas'} al relleno`}
                        orden={2}
                    />
                    <Cifra
                        icono={FileText}
                        tono="violeta"
                        etiqueta="Manifiestos"
                        valor={actual.manifiestos}
                        anterior={anterior?.manifiestos}
                        contra={contra}
                        detalle={actual.porDigitalizar > 0 ? `${actual.porDigitalizar} por digitalizar` : 'Todos digitalizados'}
                        orden={3}
                    />
                </div>

                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 movil:gap-3.5">
                    <GraficaTendencia serie={datos.serie} granularidad={datos.granularidad} />
                    <EmbarcacionesPeriodo datos={datos} onVer={onVerEmbarcacion} sinEntregar={sinEntregar} />
                </div>

                {/* A dónde se fue lo recibido (los filtros van aquí, con su desglose) y, como cierre, el impacto */}
                <DestinoResiduos destino={datos.destino} recibidos={actual} />
                <ImpactoAmbiental totales={actual} />
            </div>
        </div>
    );
}

// ── Selector de período ───────────────────────────────────────────────────────

function SelectorPeriodo({
    periodo,
    onCambiar,
    actualizando,
    accion,
}: {
    periodo: PeriodoEstadisticas;
    onCambiar: (p: PeriodoEstadisticas) => void;
    actualizando: boolean;
    /** Botones a la derecha (los PDF). En celular van en su propia fila, debajo de los del período */
    accion?: ReactNode;
}) {
    return (
        // En celular: "Período" arriba, los cinco botones repartidos a lo ancho y abajo los PDF
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2 movil:gap-y-1.5">
            <span id="titulo-periodo" className="text-[17px] text-simar-texto font-bold movil:px-1 movil:text-[15px]">
                Período
            </span>
            <div
                role="group"
                aria-labelledby="titulo-periodo"
                className="order-2 sm:order-none basis-full sm:basis-auto grid grid-cols-5 sm:flex gap-1 bg-simar-superficie p-1.5 rounded-xl shadow-simar border border-simar-borde movil:p-1 movil:rounded-full"
            >
                {PERIODOS.map((p) => (
                    <button
                        key={p.valor}
                        type="button"
                        onClick={() => onCambiar(p.valor)}
                        aria-pressed={periodo === p.valor}
                        className={`simar-presiona min-h-[48px] sm:min-h-[44px] px-1 sm:px-4 text-[15px] sm:text-base leading-tight font-bold rounded-lg whitespace-nowrap movil:rounded-full movil:text-[13.5px] ${
                            periodo === p.valor ? 'bg-simar-marea text-white shadow-simar' : 'text-simar-texto-2 hover:bg-simar-papel'
                        }`}
                    >
                        {p.texto}
                    </button>
                ))}
            </div>
            <span role="status" className={`text-[15px] text-simar-texto-2 transition-opacity duration-200 ${actualizando ? 'opacity-100' : 'opacity-0'}`}>
                {actualizando ? 'Actualizando…' : ''}
            </span>
            {accion && <div className="order-3 sm:order-none basis-full sm:basis-auto sm:ml-auto">{accion}</div>}
        </div>
    );
}

// ── Resumen: titular de una línea; la frase completa se abre al tocar ─────────

/** Abierto o cerrado se recuerda en este navegador (y se avisa a la misma pestaña con un evento) */
const CLAVE_RESUMEN = 'simar-estadisticas-resumen';
function suscribirResumen(avisar: () => void) {
    window.addEventListener('storage', avisar);
    window.addEventListener(CLAVE_RESUMEN, avisar);
    return () => {
        window.removeEventListener('storage', avisar);
        window.removeEventListener(CLAVE_RESUMEN, avisar);
    };
}
function leerResumenAbierto() {
    try {
        return localStorage.getItem(CLAVE_RESUMEN) === 'abierto';
    } catch {
        return false;
    }
}
function guardarResumenAbierto(abierto: boolean) {
    try {
        localStorage.setItem(CLAVE_RESUMEN, abierto ? 'abierto' : 'cerrado');
    } catch {
        // Sin almacenamiento (modo privado): sólo dura mientras la pantalla está abierta
    }
    window.dispatchEvent(new Event(CLAVE_RESUMEN));
}

/** "más basura +36 %", "menos aceite −12 %"… (el porcentaje en negritas) */
function ParteCambio({ c, nombre }: { c: ReturnType<typeof cambio>; nombre: string }) {
    if (c.direccion === 'sube') return <>más {nombre} <strong className="font-extrabold whitespace-nowrap">+{c.porcentaje} %</strong></>;
    if (c.direccion === 'baja') return <>menos {nombre} <strong className="font-extrabold whitespace-nowrap">−{c.porcentaje} %</strong></>;
    if (c.direccion === 'nuevo') return <>{nombre} que antes no había</>;
    return <>la misma cantidad de {nombre}</>;
}

function ResumenPeriodo({ datos }: { datos: EstadisticasPeriodo }) {
    const { actual, anterior, periodo } = datos;
    const guardado = useSyncExternalStore(suscribirResumen, leerResumenAbierto, () => false);
    // Si no hay almacenamiento (modo privado) el estado vive aquí
    const [local, setLocal] = useState<boolean | null>(null);
    const abierto = local ?? guardado;
    const alternar = () => {
        setLocal(!abierto);
        guardarResumenAbierto(!abierto);
    };

    const hayDatos = actual.manifiestos > 0 || actual.entregasBasuron > 0;
    const inicioTexto = periodo === 'todo' ? (datos.inicio ? `Desde ${datos.inicio.slice(0, 4)}` : 'Hasta hoy') : TEXTO_PERIODO[periodo].actual;
    const anteriorVacio = !anterior || (anterior.manifiestos === 0 && anterior.entregasBasuron === 0);
    const cantidades = (
        <>
            <span className="font-extrabold text-simar-marea-tinta whitespace-nowrap">{formato(actual.basuraKg)} kg de basura</span> y{' '}
            <span className="font-extrabold text-simar-coral whitespace-nowrap">{formato(actual.aceiteL)} L de aceite</span>
        </>
    );

    // Titular: lo más importante, en una línea
    let titular: ReactNode;
    if (!hayDatos) titular = <>{inicioTexto} no hay entregas registradas</>;
    else if (periodo === 'todo') titular = <>{inicioTexto}: {cantidades}</>;
    else if (anteriorVacio || !anterior) titular = <>{cantidades} {inicioTexto.charAt(0).toLowerCase() + inicioTexto.slice(1)}</>;
    else
        titular = (
            <>
                <ParteCambio c={cambio(actual.basuraKg, anterior.basuraKg)} nombre="basura" /> y{' '}
                <ParteCambio c={cambio(actual.aceiteL, anterior.aceiteL)} nombre="aceite" /> que {TEXTO_PERIODO[periodo].anterior}
            </>
        );

    const boton = (clases: string) => (
        <button
            type="button"
            onClick={alternar}
            aria-expanded={abierto}
            aria-controls="resumen-completo"
            className={`simar-presiona flex-shrink-0 items-center gap-1.5 min-h-[48px] px-4 rounded-[14px] border border-simar-borde bg-simar-superficie text-base font-bold text-simar-texto hover:bg-simar-papel movil:min-h-[40px] movil:px-3 movil:rounded-[12px] movil:text-[14px] ${clases}`}
        >
            {abierto ? 'Ocultar' : 'Leer resumen'}
            <ChevronDown className={`w-5 h-5 transition-transform duration-300 movil:w-[18px] movil:h-[18px] ${abierto ? 'rotate-180' : ''}`} aria-hidden="true" />
        </button>
    );

    return (
        <section
            aria-label="Resumen del período"
            className="simar-aparece relative overflow-hidden bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] p-4 md:p-5 movil:p-3.5 movil:rounded-[18px]"
        >
            {/* Línea de color a la izquierda: la pantalla de Estadísticas es violeta (ver DISEÑO_SIMAR.md) */}
            <span aria-hidden="true" className="absolute left-0 inset-y-0 w-1.5 bg-simar-violeta" />
            <div className="flex items-center gap-3.5 pl-1.5 movil:items-start movil:gap-2.5 movil:pl-1">
                <span className="w-11 h-11 flex-shrink-0 rounded-full bg-simar-violeta-suave text-simar-violeta flex items-center justify-center movil:w-8 movil:h-8">
                    <LineChart className="w-[22px] h-[22px] movil:w-[17px] movil:h-[17px]" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                    <p className="text-[19px] md:text-[21px] font-bold leading-snug text-simar-texto first-letter:uppercase movil:text-[15.5px]">{titular}</p>
                    {/* En celular el botón va debajo del titular */}
                    {hayDatos && boton('hidden movil:inline-flex mt-2')}
                </div>
                {hayDatos && boton('inline-flex movil:hidden')}
            </div>

            {/* La frase completa se despliega: la fila de la cuadrícula pasa de 0 a su alto */}
            {hayDatos && (
                <div
                    id="resumen-completo"
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${abierto ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    style={{ transitionTimingFunction: 'var(--simar-frena)' }}
                    inert={!abierto}
                >
                    <div className="overflow-hidden">
                        <div className="mt-4 pt-4 border-t border-simar-borde-suave pl-1.5 movil:mt-3 movil:pt-3 movil:pl-1">
                            <p className="text-[19px] md:text-[22px] font-bold leading-snug text-simar-texto max-w-4xl movil:text-[16px]">
                                {inicioTexto} {periodo === 'todo' ? 'se han recibido' : 'se recibieron'} {cantidades} usado en{' '}
                                {actual.manifiestos.toLocaleString('es-MX')} {actual.manifiestos === 1 ? 'manifiesto' : 'manifiestos'} de{' '}
                                {actual.embarcaciones.toLocaleString('es-MX')} {actual.embarcaciones === 1 ? 'embarcación' : 'embarcaciones'}.
                            </p>
                            <p className="mt-2 text-[17px] text-simar-texto-2 movil:text-[14px]">
                                {periodo === 'todo'
                                    ? 'Es todo el histórico registrado en SiMAR.'
                                    : anteriorVacio
                                      ? `En ${TEXTO_PERIODO[periodo].anterior} no hubo registros para comparar.`
                                      : `Además se llevaron ${formato(actual.basuronKg)} kg al relleno sanitario en ${actual.entregasBasuron} ${actual.entregasBasuron === 1 ? 'entrega' : 'entregas'}.`}
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

// ── Cifras ────────────────────────────────────────────────────────────────────

const TONO_CIRCULO = {
    marea: 'bg-simar-marea-suave text-simar-marea-tinta',
    coral: 'bg-simar-coral-suave text-simar-coral',
    arrecife: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
    violeta: 'bg-simar-violeta-suave text-simar-violeta',
} as const;

function Cifra({
    icono: Icono,
    tono,
    etiqueta,
    valor,
    unidad,
    anterior,
    contra,
    detalle,
    orden,
}: {
    icono: LucideIcon;
    tono: keyof typeof TONO_CIRCULO;
    etiqueta: string;
    valor: number;
    unidad?: string;
    /** undefined = sin comparación (período "Todo") */
    anterior?: number;
    contra: string;
    detalle: string;
    orden: number;
}) {
    const c = anterior === undefined ? null : cambio(valor, anterior);
    const Flecha = c?.direccion === 'sube' ? ArrowUpRight : c?.direccion === 'baja' ? ArrowDownRight : Minus;
    return (
        <div
            className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[22px] p-5 min-w-0 movil:p-3.5 movil:rounded-[18px]"
            style={{ animationDelay: `${0.04 + orden * 0.05}s` }}
        >
            <div className="flex items-center gap-3 movil:gap-2">
                <span className={`w-12 h-12 flex-shrink-0 rounded-full flex items-center justify-center movil:w-8 movil:h-8 ${TONO_CIRCULO[tono]}`}>
                    <Icono className="w-6 h-6 movil:w-[17px] movil:h-[17px]" strokeWidth={2} />
                </span>
                <span className="text-[17px] font-bold text-simar-texto-2 leading-tight movil:text-[14px]">{etiqueta}</span>
            </div>
            <p className="mt-3 text-[34px] font-extrabold leading-none text-simar-texto whitespace-nowrap movil:mt-2.5 movil:text-[23px]">
                <NumeroAnimado valor={valor} decimales={decimalesDe(valor)} />
                {unidad && <span className="ml-1.5 text-[20px] font-bold text-simar-texto-2 movil:ml-1 movil:text-[15px]">{unidad}</span>}
            </p>
            <p className="mt-2 text-[15px] text-simar-texto-2 leading-snug movil:mt-1.5 movil:text-[13px]">{detalle}</p>
            {/* Comparación neutra: más o menos no es bueno ni malo por sí solo, sólo informa */}
            {c && (
                <p className="mt-1.5 flex items-center gap-1 text-[15px] font-bold text-simar-texto movil:text-[13px] movil:mt-1">
                    <Flecha className="w-[18px] h-[18px] flex-shrink-0 movil:w-4 movil:h-4" strokeWidth={2.4} aria-hidden="true" />
                    <span>
                        {c.direccion === 'nuevo' ? 'Nuevo' : c.direccion === 'igual' ? 'Igual' : `${c.porcentaje} %`}{' '}
                        <span className="font-normal text-simar-texto-2">{contra}</span>
                    </span>
                </p>
            )}
        </div>
    );
}

// ── Gráfica de tendencia ──────────────────────────────────────────────────────

type Metrica = 'basuraKg' | 'aceiteL' | 'basuronKg';
const METRICAS: { valor: Metrica; texto: string; nombre: string; unidad: string; barra: string; punto: string }[] = [
    { valor: 'basuraKg', texto: 'Basura', nombre: 'basura', unidad: 'kg', barra: 'bg-simar-marea', punto: 'bg-simar-marea' },
    { valor: 'aceiteL', texto: 'Aceite', nombre: 'aceite usado', unidad: 'L', barra: 'bg-simar-coral', punto: 'bg-simar-coral' },
    { valor: 'basuronKg', texto: 'Basurón', nombre: 'basurón', unidad: 'kg', barra: 'bg-simar-arrecife', punto: 'bg-simar-arrecife' },
];

const MESES = ['ene', 'feb', 'mar', 'abr', 'may', 'jun', 'jul', 'ago', 'sep', 'oct', 'nov', 'dic'];
const MESES_LARGOS = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
const DIAS = ['dom', 'lun', 'mar', 'mié', 'jue', 'vie', 'sáb'];
const DIAS_LARGOS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

export function etiquetaTramo(inicio: string, g: Granularidad) {
    const [a, m, d] = inicio.split('-').map(Number);
    const f = new Date(a, m - 1, d);
    if (g === 'dia') return { corta: `${DIAS[f.getDay()]} ${d}`, movil: String(d), larga: `${DIAS_LARGOS[f.getDay()]} ${d} de ${MESES_LARGOS[m - 1]}` };
    if (g === 'semana') return { corta: `${d} ${MESES[m - 1]}`, movil: `${d} ${MESES[m - 1]}`, larga: `semana del ${d} de ${MESES_LARGOS[m - 1]}` };
    if (g === 'mes') return { corta: MESES[m - 1], movil: MESES[m - 1].charAt(0).toUpperCase(), larga: `${MESES_LARGOS[m - 1]} de ${a}` };
    return { corta: String(a), movil: `’${String(a).slice(2)}`, larga: `el año ${a}` };
}

/** Tope "redondo" del eje (1, 2 o 5 × 10ⁿ) para que las líneas guía caigan en números limpios */
export function topeRedondo(max: number) {
    if (max <= 0) return 1;
    const base = 10 ** Math.floor(Math.log10(max));
    for (const f of [1, 2, 2.5, 5, 10]) if (max <= f * base) return f * base;
    return 10 * base;
}

function GraficaTendencia({ serie, granularidad }: { serie: TramoSerie[]; granularidad: Granularidad }) {
    const [metrica, setMetrica] = useState<Metrica>('basuraKg');
    // Barra señalada: con el cursor (al pasar) o con un toque (se queda hasta tocar otra vez)
    const [senalada, setSenalada] = useState<number | null>(null);
    const [fijada, setFijada] = useState<number | null>(null);
    const m = METRICAS.find((x) => x.valor === metrica)!;
    const valores = serie.map((t) => t[metrica]);
    const total = valores.reduce((s, v) => s + v, 0);
    const promedio = serie.length ? total / serie.length : 0;
    const tope = topeRedondo(Math.max(...valores, 0));
    const indice = senalada ?? fijada;
    const activa = indice !== null && indice < serie.length ? indice : null;

    // Etiquetas del eje X: todas si caben; si no, una de cada k (en celular los meses van con su inicial)
    const n = serie.length;
    const cadaEscritorio = Math.max(1, Math.ceil(n / 13));
    const cadaMovil = granularidad === 'mes' ? 1 : Math.max(1, Math.ceil(n / 6));

    return (
        <section className="simar-aparece lg:col-span-2 bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 md:p-7 min-w-0 movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.12s' }}>
            <div className="flex flex-wrap items-start justify-between gap-3 movil:gap-2.5">
                <div className="min-w-0">
                    <h3 className="text-[22px] md:text-2xl font-extrabold text-simar-texto movil:text-[18px]">Tendencia</h3>
                    <p className="text-[17px] text-simar-texto-2 movil:text-[14px]">
                        {m.texto} {POR_TRAMO[granularidad]}, en {m.unidad === 'L' ? 'litros' : 'kilos'}
                    </p>
                </div>
                {/* Un residuo a la vez: cada uno en su unidad */}
                <div role="group" aria-label="Residuo que muestra la gráfica" className="grid grid-cols-3 gap-1 p-1 rounded-[16px] bg-simar-papel w-full sm:w-auto movil:rounded-[14px]">
                    {METRICAS.map((x) => (
                        <button
                            key={x.valor}
                            type="button"
                            onClick={() => {
                                setMetrica(x.valor);
                                setFijada(null);
                            }}
                            aria-pressed={metrica === x.valor}
                            className={`simar-presiona min-h-[46px] px-3.5 rounded-[12px] inline-flex items-center justify-center gap-2 text-base font-bold transition-colors movil:min-h-[40px] movil:px-2 movil:gap-1.5 movil:text-[14px] movil:rounded-[11px] ${
                                metrica === x.valor ? 'bg-simar-superficie text-simar-texto shadow-simar' : 'text-simar-texto-2 hover:text-simar-texto'
                            }`}
                        >
                            <span aria-hidden="true" className={`w-2.5 h-2.5 rounded-full ${x.punto}`} />
                            {x.texto}
                        </button>
                    ))}
                </div>
            </div>

            {/* Lectura: el valor de la barra señalada o, si no hay, el promedio del período */}
            <div aria-live="polite" className="mt-5 min-h-[58px] movil:mt-3 movil:min-h-[50px]">
                {activa !== null ? (
                    <>
                        <p className="text-[28px] font-extrabold leading-none text-simar-texto movil:text-[22px]">
                            {formato(serie[activa][metrica])} <span className="text-[18px] font-bold text-simar-texto-2 movil:text-[14px]">{m.unidad}</span>
                        </p>
                        <p className="mt-1 text-[15px] text-simar-texto-2 first-letter:uppercase movil:text-[13px]">
                            {m.texto} en {etiquetaTramo(serie[activa].inicio, granularidad).larga}
                        </p>
                    </>
                ) : (
                    <>
                        <p className="text-[28px] font-extrabold leading-none text-simar-texto movil:text-[22px]">
                            <NumeroAnimado valor={promedio} decimales={decimalesDe(promedio)} />{' '}
                            <span className="text-[18px] font-bold text-simar-texto-2 movil:text-[14px]">{m.unidad}</span>
                        </p>
                        <p className="mt-1 text-[15px] text-simar-texto-2 movil:text-[13px]">
                            Promedio {POR_TRAMO[granularidad]} · total {formato(total)} {m.unidad}
                        </p>
                    </>
                )}
            </div>

            {n === 0 || total === 0 ? (
                <div className="mt-4 h-56 md:h-64 rounded-2xl bg-simar-papel flex items-center justify-center text-center px-6 text-[17px] text-simar-texto-2 movil:h-40 movil:text-[14px]">
                    Sin {m.nombre} registrada en este período
                </div>
            ) : (
                <div className="mt-4 flex gap-2 movil:gap-1.5">
                    {/* Eje Y: el tope y la mitad, en números redondos */}
                    <div aria-hidden="true" className="relative w-11 flex-shrink-0 h-56 md:h-64 text-right text-[13px] text-simar-texto-2 tabular-nums movil:w-8 movil:h-44 movil:text-[11px]">
                        <span className="absolute right-0 top-0 -translate-y-1/2">{formato(tope)}</span>
                        <span className="absolute right-0 top-1/2 -translate-y-1/2">{formato(tope / 2)}</span>
                        <span className="absolute right-0 bottom-0 translate-y-1/2">0</span>
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="relative h-56 md:h-64 movil:h-44" onPointerLeave={() => setSenalada(null)}>
                            {/* Líneas guía y promedio */}
                            <span aria-hidden="true" className="absolute inset-x-0 top-0 border-t border-simar-borde-suave" />
                            <span aria-hidden="true" className="absolute inset-x-0 top-1/2 border-t border-simar-borde-suave" />
                            <span aria-hidden="true" className="absolute inset-x-0 bottom-0 border-t border-simar-borde" />
                            <span
                                aria-hidden="true"
                                className="absolute inset-x-0 z-10 border-t-2 border-dashed border-simar-texto-3 transition-[bottom] duration-500 pointer-events-none"
                                style={{ bottom: `${(promedio / tope) * 100}%`, transitionTimingFunction: 'var(--simar-frena)' }}
                            />
                            <div className="absolute inset-0 flex items-end gap-[3px] sm:gap-2 md:gap-3">
                                {serie.map((t, i) => {
                                    const v = t[metrica];
                                    const alto = (v / tope) * 100;
                                    const e = etiquetaTramo(t.inicio, granularidad);
                                    return (
                                        <button
                                            // La clave es la posición: al cambiar de residuo o de período la barra pasa de su alto anterior al nuevo
                                            key={i}
                                            type="button"
                                            aria-label={`${m.texto} en ${e.larga}: ${formato(v)} ${m.unidad}`}
                                            aria-pressed={fijada === i}
                                            onPointerEnter={(ev) => ev.pointerType === 'mouse' && setSenalada(i)}
                                            onFocus={() => setSenalada(i)}
                                            onBlur={() => setSenalada(null)}
                                            onClick={() => setFijada((f) => (f === i ? null : i))}
                                            className="relative flex-1 h-full flex items-end justify-center min-w-0 rounded-t-lg outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta"
                                        >
                                            <span
                                                className={`simar-crece-y block w-full max-w-[56px] rounded-t-[10px] transition-[height,background-color,opacity] duration-500 movil:rounded-t-[5px] ${m.barra} ${
                                                    v > 0 ? 'min-h-[3px]' : ''
                                                } ${activa !== null && activa !== i ? 'opacity-40' : 'opacity-100'}`}
                                                style={{
                                                    height: `${alto}%`,
                                                    animationDelay: `${0.15 + i * 0.03}s`,
                                                    transitionTimingFunction: 'var(--simar-frena)',
                                                }}
                                            />
                                        </button>
                                    );
                                })}
                            </div>
                        </div>
                        {/* Eje X */}
                        <div aria-hidden="true" className="mt-2 flex gap-[3px] sm:gap-2 md:gap-3">
                            {serie.map((t, i) => {
                                const e = etiquetaTramo(t.inicio, granularidad);
                                return (
                                    <span key={i} className="flex-1 min-w-0 text-center text-[14px] font-bold text-simar-texto-2 whitespace-nowrap overflow-visible movil:text-[11px]">
                                        <span className="hidden sm:inline">{i % cadaEscritorio === 0 ? e.corta : ''}</span>
                                        <span className="sm:hidden">{i % cadaMovil === 0 ? e.movil : ''}</span>
                                    </span>
                                );
                            })}
                        </div>
                    </div>
                </div>
            )}

            <p className="mt-4 flex items-center gap-2 text-[15px] text-simar-texto-2 movil:mt-3 movil:text-[13px]">
                <span aria-hidden="true" className="w-6 border-t-2 border-dashed border-simar-texto-3" />
                Promedio. <span className="md:hidden">Toca una barra para ver su valor.</span>
                <span className="hidden md:inline">Pasa el cursor o toca una barra para ver su valor.</span>
            </p>
        </section>
    );
}

// ── Embarcaciones ─────────────────────────────────────────────────────────────
//
// Dos vistas en la misma tarjeta: las que más entregan en el período y las activas que llevan
// tiempo sin entregar (esa no depende del período: es un aviso de hoy). La segunda lleva su número
// en coral cuando hay alguna, para que se note sin abrirla.

function fechaLarga(texto: string) {
    const [a, m, d] = texto.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
}

function EmbarcacionesPeriodo({ datos, onVer, sinEntregar }: { datos: EstadisticasPeriodo; onVer?: (buqueId: number) => void; sinEntregar?: SinEntregar }) {
    const [vista, setVista] = useState<'entregan' | 'sin'>('entregan');
    const locale = usePathname().split('/')[1] || 'es';
    const lista = datos.embarcaciones;
    const maxEntregas = Math.max(...lista.map((e) => e.entregas), 1);
    const nSin = sinEntregar?.embarcaciones.length ?? 0;
    const VISIBLES = 5;

    return (
        <section className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 md:p-7 flex flex-col min-w-0 movil:p-4 movil:rounded-[22px]" style={{ animationDelay: '0.18s' }}>
            <h3 className="text-[22px] md:text-2xl font-extrabold text-simar-texto movil:text-[18px]">Embarcaciones</h3>

            {sinEntregar && (
                <div role="group" aria-label="Qué embarcaciones mostrar" className="mt-3 grid grid-cols-2 gap-1 p-1 rounded-[16px] bg-simar-papel movil:mt-2.5 movil:rounded-[14px]">
                    {(
                        [
                            { valor: 'entregan', texto: 'Más entregas' },
                            { valor: 'sin', texto: 'Sin entregar' },
                        ] as const
                    ).map((o) => (
                        <button
                            key={o.valor}
                            type="button"
                            onClick={() => setVista(o.valor)}
                            aria-pressed={vista === o.valor}
                            className={`simar-presiona min-h-[46px] px-2 rounded-[12px] inline-flex items-center justify-center gap-1.5 text-base font-bold transition-colors movil:min-h-[40px] movil:text-[14px] movil:rounded-[11px] ${
                                vista === o.valor ? 'bg-simar-superficie text-simar-texto shadow-simar' : 'text-simar-texto-2 hover:text-simar-texto'
                            }`}
                        >
                            {o.texto}
                            {o.valor === 'sin' && (
                                <span
                                    className={`min-w-[22px] h-[22px] px-1.5 rounded-full text-[13px] font-bold tabular-nums inline-flex items-center justify-center ${
                                        nSin > 0 ? 'bg-[#A63F0E] text-white' : 'bg-simar-superficie text-simar-texto-2'
                                    }`}
                                >
                                    {nSin}
                                </span>
                            )}
                        </button>
                    ))}
                </div>
            )}

            {vista === 'entregan' || !sinEntregar ? (
                <>
                    <p className="mt-3 text-[17px] text-simar-texto-2 movil:mt-2 movil:text-[14px]">Las que más manifiestos entregaron en el período</p>
                    {lista.length === 0 ? (
                        <p className="flex-1 flex items-center justify-center py-10 text-center text-[17px] text-simar-texto-2 movil:py-6 movil:text-[14px]">
                            Ninguna entrega en este período
                        </p>
                    ) : (
                        <ol className="mt-3 flex-1 space-y-1 movil:mt-2">
                            {lista.map((e, i) => {
                                const contenido = (
                                    <>
                                        <span className="w-9 h-9 flex-shrink-0 rounded-full bg-simar-marea-suave text-simar-marea-tinta font-extrabold text-base flex items-center justify-center movil:w-7 movil:h-7 movil:text-[13px]">
                                            {i + 1}
                                        </span>
                                        <span className="flex-1 min-w-0">
                                            <span className="flex items-baseline justify-between gap-2">
                                                <span className="font-bold text-[17px] text-simar-texto truncate movil:text-[15px]">{e.nombre}</span>
                                                <span className="flex-shrink-0 text-[15px] font-bold text-simar-texto movil:text-[13px]">
                                                    {e.entregas} {e.entregas === 1 ? 'entrega' : 'entregas'}
                                                </span>
                                            </span>
                                            <span className="mt-1.5 block h-2 rounded-full bg-simar-papel overflow-hidden movil:mt-1 movil:h-1.5">
                                                <span
                                                    className="simar-crece-x block h-full rounded-full bg-simar-marea transition-[width] duration-500"
                                                    style={{ width: `${(e.entregas / maxEntregas) * 100}%`, animationDelay: `${0.25 + i * 0.06}s`, transitionTimingFunction: 'var(--simar-frena)' }}
                                                />
                                            </span>
                                            <span className="mt-1 block text-[15px] text-simar-texto-2 movil:text-[13px]">
                                                {formato(e.basuraKg)} kg de basura · {formato(e.aceiteL)} L de aceite
                                            </span>
                                        </span>
                                        {onVer && <ChevronRight aria-hidden="true" className="w-5 h-5 flex-shrink-0 text-simar-texto-2" />}
                                    </>
                                );
                                return (
                                    <li key={e.buqueId}>
                                        {onVer ? (
                                            <button
                                                type="button"
                                                onClick={() => onVer(e.buqueId)}
                                                aria-label={`${e.nombre}: ${e.entregas} entregas. Ver sus registros`}
                                                className="simar-presiona w-full text-left flex items-center gap-3 rounded-2xl px-2 py-2.5 hover:bg-simar-papel movil:gap-2.5 movil:px-1.5 movil:py-2"
                                            >
                                                {contenido}
                                            </button>
                                        ) : (
                                            <div className="flex items-center gap-3 px-2 py-2.5">{contenido}</div>
                                        )}
                                    </li>
                                );
                            })}
                        </ol>
                    )}
                </>
            ) : (
                <>
                    <p className="mt-3 text-[17px] text-simar-texto-2 movil:mt-2 movil:text-[14px]">
                        Activas que no entregan residuos desde hace más de {sinEntregar.dias} días. No depende del período.
                    </p>
                    {nSin === 0 ? (
                        <p className="flex-1 flex flex-col items-center justify-center gap-2 py-8 text-center text-[17px] text-simar-texto-2 movil:py-6 movil:text-[14px]">
                            <span className="w-12 h-12 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta flex items-center justify-center">
                                <Check className="w-6 h-6" strokeWidth={2.6} aria-hidden="true" />
                            </span>
                            Todas las embarcaciones activas entregaron en los últimos {sinEntregar.dias} días
                        </p>
                    ) : (
                        <ul className="mt-3 flex-1 space-y-1 movil:mt-2">
                            {sinEntregar.embarcaciones.slice(0, VISIBLES).map((e) => (
                                <li key={e.buqueId} className="flex items-center gap-3 rounded-2xl px-2 py-2.5 movil:gap-2.5 movil:px-1.5 movil:py-2">
                                    <span className="w-9 h-9 flex-shrink-0 rounded-full bg-simar-coral-suave text-simar-coral flex items-center justify-center movil:w-7 movil:h-7">
                                        <Clock className="w-[18px] h-[18px] movil:w-4 movil:h-4" strokeWidth={2.2} aria-hidden="true" />
                                    </span>
                                    <span className="flex-1 min-w-0">
                                        <span className="flex items-baseline justify-between gap-2">
                                            <span className="font-bold text-[17px] text-simar-texto truncate movil:text-[15px]">{e.nombre}</span>
                                            <span className="flex-shrink-0 text-[15px] font-bold text-simar-coral movil:text-[13px]">
                                                {e.dias === null ? 'Nunca' : `${e.dias.toLocaleString('es-MX')} días`}
                                            </span>
                                        </span>
                                        <span className="block text-[15px] text-simar-texto-2 movil:text-[13px]">
                                            {e.ultimaEntrega ? `Última entrega: ${fechaLarga(e.ultimaEntrega)}` : 'No tiene manifiestos registrados'}
                                        </span>
                                    </span>
                                </li>
                            ))}
                            {nSin > VISIBLES && (
                                <li className="px-2 pt-1 text-[15px] font-bold text-simar-texto-2 movil:text-[13px]">
                                    y {nSin - VISIBLES} {nSin - VISIBLES === 1 ? 'embarcación más' : 'embarcaciones más'}
                                </li>
                            )}
                        </ul>
                    )}
                </>
            )}

            <div className="mt-4 pt-4 border-t border-simar-borde-suave flex flex-wrap items-center justify-between gap-2 text-[15px] text-simar-texto-2 movil:mt-3 movil:pt-3 movil:text-[13px]">
                <span className="flex items-center gap-2">
                    <Ship aria-hidden="true" className="w-[18px] h-[18px] flex-shrink-0" />
                    <span>
                        <strong className="text-simar-texto">{datos.flota.activas.toLocaleString('es-MX')}</strong> activas de{' '}
                        {datos.flota.registradas.toLocaleString('es-MX')} registradas
                    </span>
                </span>
                <Link
                    href={`/${locale}/dashboard/embarcaciones`}
                    className="inline-flex items-center gap-1 min-h-[44px] font-bold text-simar-marea-tinta hover:underline"
                >
                    Ver embarcaciones
                    <ChevronRight aria-hidden="true" className="w-[18px] h-[18px]" />
                </Link>
            </div>
        </section>
    );
}

// ── Impacto ambiental (estimado) ──────────────────────────────────────────────
//
// Lo principal es la equivalencia en algo conocido ("1.2 albercas olímpicas", "416 árboles"):
// número grande y su nombre. La cifra técnica ("2.9 millones de litros") va debajo, como dato de
// apoyo. La equivalencia cambia con el tamaño (albercas o tinacos, camiones o bolsas) para no
// decir "0.1 albercas". Cómo se calcula se abre aparte.

const fmtEntero = (n: number) => Math.round(n).toLocaleString('es-MX');
const fmtCifra = (n: number, unidad: string) =>
    n >= 1_000_000 ? `${(n / 1_000_000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} millones de ${unidad === 'L' ? 'litros' : unidad}` : `${fmtEntero(n)} ${unidad}`;

function ImpactoAmbiental({ totales }: { totales: TotalesPeriodo }) {
    const [verCalculo, setVerCalculo] = useState(false);
    const co2 = co2EvitadoKg(totales.aceiteL, totales.basuronKg);
    const agua = aguaProtegidaL(totales.aceiteL);
    const basura = totales.basuraKg;

    const tarjetas = [
        { eq: equivalenciaAgua(agua), dato: `${fmtCifra(agua, 'L')} de agua` },
        { eq: equivalenciaCO2(co2), dato: `${fmtCifra(co2, 'kg')} de CO₂` },
        { eq: equivalenciaBasura(basura), dato: `${fmtCifra(basura, 'kg')} de basura` },
    ].filter((t): t is { eq: Equivalencia; dato: string } => t.eq !== null);

    return (
        <section
            className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 md:p-7 min-w-0 movil:p-4 movil:rounded-[22px]"
            style={{ animationDelay: '0.22s' }}
        >
            <div className="flex items-start gap-3">
                <span className="w-12 h-12 flex-shrink-0 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta flex items-center justify-center movil:w-9 movil:h-9">
                    <Leaf className="w-6 h-6 movil:w-[18px] movil:h-[18px]" strokeWidth={2} aria-hidden="true" />
                </span>
                <div className="flex-1 min-w-0">
                    <h3 className="text-[22px] md:text-2xl font-extrabold text-simar-texto movil:text-[18px]">
                        Impacto ambiental{' '}
                        <span className="align-middle inline-flex px-2.5 py-0.5 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta text-[14px] font-bold movil:text-[12px]">
                            Estimado
                        </span>
                    </h3>
                    <p className="text-[17px] text-simar-texto-2 movil:text-[14px]">Lo que el período ayudó a evitar, en cosas conocidas</p>
                </div>
            </div>

            {tarjetas.length > 0 ? (
                // En computadora, las tres lado a lado; en celular, una bajo otra con el ícono a la izquierda
                <ul className="mt-5 grid grid-cols-1 sm:grid-cols-3 gap-3 md:gap-4 movil:mt-3.5 movil:gap-2.5">
                    {tarjetas.map(({ eq, dato }, i) => {
                        const decimales = decimalesEquivalencia(eq.valor);
                        const uno = Math.round(eq.valor * 10 ** decimales) / 10 ** decimales === 1;
                        return (
                            <li
                                key={eq.nombre[1]}
                                className="rounded-[22px] bg-simar-arrecife-suave p-5 flex flex-col movil:grid movil:grid-cols-[auto_1fr] movil:gap-x-3 movil:p-3.5 movil:rounded-[18px]"
                            >
                                <span className="w-14 h-14 rounded-full bg-simar-superficie text-simar-arrecife-tinta flex items-center justify-center movil:row-span-3 movil:w-11 movil:h-11">
                                    <eq.icono className="w-7 h-7 movil:w-[22px] movil:h-[22px]" strokeWidth={2} aria-hidden="true" />
                                </span>
                                {/* La equivalencia es lo grande */}
                                <p className="mt-4 text-[44px] font-extrabold leading-none text-simar-texto movil:mt-0 movil:text-[30px]">
                                    <NumeroAnimado valor={eq.valor} decimales={decimales} duracion={1300 + i * 150} />
                                </p>
                                <p className="mt-1 text-[20px] font-extrabold leading-tight text-simar-arrecife-tinta movil:text-[16px]">{uno ? eq.nombre[0] : eq.nombre[1]}</p>
                                <p className="mt-1 text-[15px] leading-snug text-simar-texto-2 movil:col-start-2 movil:text-[13.5px]">{eq.descripcion}</p>
                                {/* La cifra técnica, como dato de apoyo */}
                                <p className="mt-auto pt-3 text-[14px] font-bold text-simar-texto-2 movil:col-start-2 movil:pt-1.5 movil:text-[12.5px]">
                                    <span className="block border-t border-simar-arrecife-tinta/20 pt-2.5 movil:border-0 movil:pt-0">{dato}</span>
                                </p>
                            </li>
                        );
                    })}
                </ul>
            ) : (
                <p className="mt-4 rounded-2xl bg-simar-papel px-5 py-8 text-center text-[17px] text-simar-texto-2 movil:text-[14px]">
                    Sin entregas en este período: todavía no hay impacto que calcular.
                </p>
            )}

            {/* Cómo se calcula: a la vista para quien lo busque, sin ocupar lugar */}
            <div className="mt-4 pt-3 border-t border-simar-borde-suave movil:mt-3">
                <button
                    type="button"
                    onClick={() => setVerCalculo((v) => !v)}
                    aria-expanded={verCalculo}
                    aria-controls="calculo-impacto"
                    className="simar-presiona inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 rounded-xl text-[15px] font-bold text-simar-marea-tinta movil:text-[14px]"
                >
                    ¿Cómo se calcula?
                    <ChevronDown className={`w-[18px] h-[18px] transition-transform duration-300 ${verCalculo ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <div
                    id="calculo-impacto"
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${verCalculo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    style={{ transitionTimingFunction: 'var(--simar-frena)' }}
                    inert={!verCalculo}
                >
                    <div className="overflow-hidden">
                        <ul className="mt-1 space-y-1.5 text-[15px] leading-snug text-simar-texto-2 movil:text-[13.5px]">
                            <li>
                                Agua: cada litro de aceite recolectado evita contaminar {LITROS_AGUA_POR_LITRO_ACEITE.toLocaleString('es-MX')} L de agua. Una alberca
                                olímpica tiene {(LITROS_ALBERCA_OLIMPICA / 1_000_000).toLocaleString('es-MX')} millones de litros.
                            </li>
                            <li>
                                CO₂: litros de aceite × {RECINTO_CO2_POR_LITRO_ACEITE} + kg al basurón × {RECINTO_CO2_POR_KG_BASURON}. Un árbol absorbe unos{' '}
                                {KG_CO2_POR_ARBOL_ANIO} kg de CO₂ al año.
                            </li>
                            <li>
                                Basura: los kilos que las embarcaciones entregaron en el recinto en lugar de tirarlos al mar. Un camión recolector lleva unas{' '}
                                {(KG_CAMION_RECOLECTOR / 1000).toLocaleString('es-MX')} toneladas.
                            </li>
                            <li className="font-bold text-simar-texto">
                                Son factores provisionales, pendientes de validar con SEMARNAT y DCK: sirven para dar una idea, no para reportes oficiales.
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </section>
    );
}

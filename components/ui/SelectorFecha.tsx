'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { CalendarDays, ChevronDown, ChevronLeft, ChevronRight, X } from 'lucide-react';
import { Desplegable } from './Desplegable';
import { formatearFecha, hoyLocal } from '@/lib/utils/fechas';

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
// En México el calendario empieza la semana en domingo
const DIAS = ['domingo', 'lunes', 'martes', 'miércoles', 'jueves', 'viernes', 'sábado'];

const dos = (n: number) => String(n).padStart(2, '0');
/** Date local → 'YYYY-MM-DD' (sin pasar por UTC) */
const aTexto = (f: Date) => `${f.getFullYear()}-${dos(f.getMonth() + 1)}-${dos(f.getDate())}`;
const deTexto = (s: string) => {
    const [a, m, d] = s.split('-').map(Number);
    return new Date(a, m - 1, d);
};
const esFecha = (s: string | null | undefined): s is string => !!s && /^\d{4}-\d{2}-\d{2}$/.test(s);
const diasDelMes = (anio: number, mes: number) => new Date(anio, mes + 1, 0).getDate();
/** Mueve `f` n meses sin pasarse del último día del mes de llegada (31 ene + 1 mes = 28/29 feb) */
const sumarMeses = (f: Date, n: number) => {
    const destino = new Date(f.getFullYear(), f.getMonth() + n, 1);
    destino.setDate(Math.min(f.getDate(), diasDelMes(destino.getFullYear(), destino.getMonth())));
    return destino;
};
const sumarDias = (f: Date, n: number) => new Date(f.getFullYear(), f.getMonth(), f.getDate() + n);

/**
 * Selector de fecha de SiMAR (reemplaza a react-datepicker y a los <input type="date"> del navegador,
 * que se veían distinto en cada teléfono). Trabaja con cadenas 'YYYY-MM-DD', como las columnas `date`
 * de Supabase. Ver DISEÑO_SIMAR.md → "Selector de fecha y hora".
 *
 * - `variante="campo"` (por defecto): el campo completo del lenguaje SiMAR (borde de 2 px, 56 px,
 *   ícono de calendario y, si es `borrable`, una X para vaciarlo).
 * - `variante="incrustado"`: sólo el texto, para ir dentro de un recuadro que ya dibuja la pantalla
 *   (Manifiesto, Basurón); `onAbrir`/`onCerrar` le avisan para resaltar su borde.
 */
export function SelectorFecha({
    valor,
    onCambiar,
    etiqueta,
    min,
    max,
    borrable = false,
    marcador = 'Elegir fecha',
    variante = 'campo',
    rango,
    className = '',
    id,
    onAbrir,
    onCerrar,
}: {
    /** 'YYYY-MM-DD' o '' */
    valor: string | null | undefined;
    onCambiar: (valor: string) => void;
    /** Qué fecha es ("Fecha del manifiesto"): nombre para el lector de pantalla y título de la hoja */
    etiqueta: string;
    min?: string;
    max?: string;
    borrable?: boolean;
    marcador?: string;
    variante?: 'campo' | 'incrustado';
    /** Filtros "desde / hasta": sombrea los días entre ambas fechas */
    rango?: { desde?: string; hasta?: string };
    className?: string;
    id?: string;
    onAbrir?: () => void;
    onCerrar?: () => void;
}) {
    const ancla = useRef<HTMLButtonElement>(null);
    const [abierto, setAbierto] = useState(false);
    const tieneValor = esFecha(valor);

    const abrir = () => {
        setAbierto(true);
        onAbrir?.();
    };
    const cerrar = () => {
        setAbierto(false);
        onCerrar?.();
    };
    const elegir = (texto: string) => {
        onCambiar(texto);
        cerrar();
        ancla.current?.focus({ preventScroll: true });
    };

    const textoValor = tieneValor ? formatearFecha(valor) : marcador;
    const nombreLargo = tieneValor
        ? deTexto(valor).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
        : 'sin elegir';

    // El campo se ajusta a su propio ancho (@container): angosto, sin ícono; más angosto, sin la X
    // (borrar sigue dentro del calendario). Así "28 sep 2026" cabe en filtros de cuatro columnas
    return (
        <div className={`relative ${variante === 'incrustado' ? 'flex-1 min-w-0' : '@container'} ${className}`}>
            <button
                ref={ancla}
                id={id}
                type="button"
                onClick={() => (abierto ? cerrar() : abrir())}
                aria-haspopup="dialog"
                aria-expanded={abierto}
                aria-label={`${etiqueta}: ${nombreLargo}`}
                title={tieneValor ? nombreLargo : undefined}
                className={
                    variante === 'campo'
                        ? // En celular sin la X (borrar está dentro del calendario): dos fechas lado a lado miden ~150 px
                          `w-full min-h-[56px] pl-4 ${borrable && tieneValor ? 'pr-12 @max-[10.5rem]:pr-3' : 'pr-4'} @max-[12rem]:pl-3 rounded-[14px] border-2 bg-simar-superficie text-left text-lg inline-flex items-center gap-2.5 transition-colors focus:outline-none focus-visible:border-simar-marea-tinta movil:pl-3 movil:pr-3 movil:gap-2 ${
                              abierto ? 'border-simar-marea-tinta' : 'border-simar-campo-borde hover:border-simar-marea-tinta'
                          }`
                        : 'w-full min-h-[44px] text-left inline-flex items-center bg-transparent focus:outline-none cursor-pointer'
                }
            >
                {variante === 'campo' && <CalendarDays className="w-[22px] h-[22px] flex-shrink-0 text-simar-texto-2 @max-[12rem]:hidden" />}
                <span className={`truncate ${tieneValor ? 'font-bold text-simar-texto' : 'font-medium text-simar-texto-3'}`}>{textoValor}</span>
            </button>
            {borrable && tieneValor && variante === 'campo' && (
                <button
                    type="button"
                    onClick={() => onCambiar('')}
                    aria-label={`Borrar ${etiqueta.toLowerCase()}`}
                    title="Borrar"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full flex items-center justify-center text-simar-texto-2 hover:bg-simar-papel hover:text-simar-texto movil:hidden @max-[10.5rem]:hidden"
                >
                    <X className="w-5 h-5" />
                </button>
            )}

            <Desplegable abierto={abierto} onCerrar={cerrar} ancla={ancla} etiqueta={etiqueta}>
                {(enHoja) => (
                    <Calendario
                        valor={tieneValor ? valor : null}
                        min={min}
                        max={max}
                        rango={rango}
                        borrable={borrable}
                        enHoja={enHoja}
                        onElegir={elegir}
                        onBorrar={() => elegir('')}
                    />
                )}
            </Desplegable>
        </div>
    );
}

function Calendario({
    valor,
    min,
    max,
    rango,
    borrable,
    enHoja,
    onElegir,
    onBorrar,
}: {
    valor: string | null;
    min?: string;
    max?: string;
    rango?: { desde?: string; hasta?: string };
    borrable: boolean;
    enHoja: boolean;
    onElegir: (texto: string) => void;
    onBorrar: () => void;
}) {
    const hoy = hoyLocal();
    const fuera = (t: string) => (!!min && t < min) || (!!max && t > max);
    const acotar = (t: string) => (min && t < min ? min : max && t > max ? max : t);

    // La fecha con el foco manda qué mes se ve (así las flechas del teclado cambian de mes solas)
    const [enfocada, setEnfocada] = useState(() => deTexto(valor ?? acotar(hoy)));
    const [vista, setVista] = useState<'dias' | 'meses'>('dias');
    const [anioMeses, setAnioMeses] = useState(enfocada.getFullYear());
    const anio = enfocada.getFullYear();
    const mes = enfocada.getMonth();

    // Al abrir y al moverse con el teclado, el foco va al día
    const dias = useRef<Map<string, HTMLButtonElement>>(new Map());
    const conTeclado = useRef(true);
    useEffect(() => {
        if (vista !== 'dias' || !conTeclado.current) return;
        dias.current.get(aTexto(enfocada))?.focus({ preventScroll: true });
    }, [enfocada, vista]);

    const mover = (f: Date) => setEnfocada(deTexto(acotar(aTexto(f))));
    const cambiarMes = (n: number) => {
        conTeclado.current = false;
        setEnfocada(sumarMeses(enfocada, n));
    };

    const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
        const pasos: Record<string, () => Date> = {
            ArrowLeft: () => sumarDias(enfocada, -1),
            ArrowRight: () => sumarDias(enfocada, 1),
            ArrowUp: () => sumarDias(enfocada, -7),
            ArrowDown: () => sumarDias(enfocada, 7),
            Home: () => sumarDias(enfocada, -enfocada.getDay()),
            End: () => sumarDias(enfocada, 6 - enfocada.getDay()),
            PageUp: () => sumarMeses(enfocada, e.shiftKey ? -12 : -1),
            PageDown: () => sumarMeses(enfocada, e.shiftKey ? 12 : 1),
        };
        const paso = pasos[e.key];
        if (!paso) return;
        e.preventDefault();
        conTeclado.current = true;
        mover(paso());
    };

    // Seis semanas desde el domingo anterior al día 1: la cuadrícula no cambia de alto entre meses
    const primero = new Date(anio, mes, 1);
    const inicio = sumarDias(primero, -primero.getDay());
    const celdas = Array.from({ length: 42 }, (_, i) => sumarDias(inicio, i));
    const hayRango = !!rango?.desde && !!rango?.hasta;

    const anteriorFuera = !!min && aTexto(new Date(anio, mes, 0)) < min;
    const siguienteFuera = !!max && aTexto(new Date(anio, mes + 1, 1)) > max;

    const flecha = `${enHoja ? 'w-12 h-12' : 'w-11 h-11'} flex-shrink-0 rounded-full flex items-center justify-center text-simar-texto hover:bg-simar-papel disabled:opacity-30 disabled:hover:bg-transparent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta`;

    if (vista === 'meses') {
        const mesFuera = (i: number) =>
            (!!min && aTexto(new Date(anioMeses, i + 1, 0)) < min) || (!!max && aTexto(new Date(anioMeses, i, 1)) > max);
        return (
            <div className={enHoja ? 'w-full' : 'w-[318px]'}>
                <div className="flex items-center justify-between gap-2 mb-3">
                    <button
                        type="button"
                        onClick={() => setAnioMeses((a) => a - 1)}
                        disabled={!!min && anioMeses - 1 < Number(min.slice(0, 4))}
                        aria-label="Año anterior"
                        className={flecha}
                    >
                        <ChevronLeft className="w-6 h-6" />
                    </button>
                    <span className="text-[18px] font-extrabold text-simar-texto tabular-nums" aria-live="polite">
                        {anioMeses}
                    </span>
                    <button
                        type="button"
                        onClick={() => setAnioMeses((a) => a + 1)}
                        disabled={!!max && anioMeses + 1 > Number(max.slice(0, 4))}
                        aria-label="Año siguiente"
                        className={flecha}
                    >
                        <ChevronRight className="w-6 h-6" />
                    </button>
                </div>
                <div className="grid grid-cols-3 gap-2">
                    {MESES.map((nombre, i) => {
                        const actual = i === mes && anioMeses === anio;
                        return (
                            <button
                                key={nombre}
                                type="button"
                                disabled={mesFuera(i)}
                                aria-pressed={actual}
                                onClick={() => {
                                    conTeclado.current = true;
                                    mover(new Date(anioMeses, i, Math.min(enfocada.getDate(), diasDelMes(anioMeses, i))));
                                    setVista('dias');
                                }}
                                className={`simar-presiona ${enHoja ? 'min-h-[54px] text-[17px]' : 'min-h-[48px] text-[16px]'} rounded-[14px] font-bold capitalize transition-colors disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-simar-superficie ${
                                    actual ? 'bg-simar-marea text-white' : 'bg-simar-papel text-simar-texto hover:bg-simar-marea-suave'
                                }`}
                            >
                                {nombre.slice(0, 3)}
                            </button>
                        );
                    })}
                </div>
                <button
                    type="button"
                    onClick={() => setVista('dias')}
                    className="mt-3 w-full min-h-[44px] rounded-full text-[15px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave"
                >
                    Volver a los días
                </button>
            </div>
        );
    }

    return (
        <div className={enHoja ? 'w-full' : 'w-[318px]'}>
            {/* Mes: flechas a los lados y, en medio, el nombre que abre la vista de meses y años */}
            <div className="flex items-center justify-between gap-1 mb-1.5">
                <button type="button" onClick={() => cambiarMes(-1)} disabled={anteriorFuera} aria-label="Mes anterior" className={flecha}>
                    <ChevronLeft className="w-6 h-6" />
                </button>
                <button
                    type="button"
                    onClick={() => {
                        setAnioMeses(anio);
                        setVista('meses');
                    }}
                    aria-label={`${MESES[mes]} de ${anio}. Elegir otro mes o año`}
                    className="min-h-[44px] px-3 rounded-full inline-flex items-center gap-1.5 text-[18px] font-extrabold text-simar-texto capitalize hover:bg-simar-papel focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta"
                >
                    <span aria-live="polite">
                        {MESES[mes]} {anio}
                    </span>
                    <ChevronDown className="w-4 h-4 text-simar-texto-2" strokeWidth={2.6} />
                </button>
                <button type="button" onClick={() => cambiarMes(1)} disabled={siguienteFuera} aria-label="Mes siguiente" className={flecha}>
                    <ChevronRight className="w-6 h-6" />
                </button>
            </div>

            <div className="grid grid-cols-7 gap-1 mb-1" aria-hidden="true">
                {DIAS.map((d) => (
                    <span key={d} title={d} className="text-center text-[13px] font-bold uppercase text-simar-texto-2 py-1">
                        {d.charAt(0)}
                    </span>
                ))}
            </div>

            <div role="group" aria-label={`${MESES[mes]} de ${anio}`} onKeyDown={alTeclear} className="grid grid-cols-7 gap-1">
                {celdas.map((f) => {
                    const t = aTexto(f);
                    const elegido = t === valor;
                    const esHoy = t === hoy;
                    const otroMes = f.getMonth() !== mes;
                    const deshabilitado = fuera(t);
                    const enRango = hayRango && t > rango!.desde! && t < rango!.hasta!;
                    const extremo = hayRango && (t === rango!.desde || t === rango!.hasta);
                    const conFoco = t === aTexto(enfocada);
                    return (
                        <button
                            key={t}
                            ref={(b) => {
                                if (b) dias.current.set(t, b);
                                else dias.current.delete(t);
                            }}
                            type="button"
                            tabIndex={conFoco ? 0 : -1}
                            disabled={deshabilitado}
                            onClick={() => onElegir(t)}
                            onFocus={() => {
                                if (!conFoco) setEnfocada(f);
                            }}
                            aria-label={f.toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                            aria-pressed={elegido}
                            aria-current={esHoy ? 'date' : undefined}
                            className={`${enHoja ? 'h-[46px] text-[17px]' : 'h-[42px] text-[16px]'} w-full rounded-full tabular-nums transition-colors disabled:cursor-not-allowed disabled:opacity-30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-simar-superficie ${
                                elegido || extremo
                                    ? 'bg-simar-marea text-white font-extrabold'
                                    : enRango
                                      ? 'bg-simar-marea-suave text-simar-marea-tinta font-bold'
                                      : esHoy
                                        ? 'font-extrabold text-simar-marea-tinta ring-2 ring-inset ring-simar-marea-tinta/50 hover:bg-simar-marea-suave'
                                        : otroMes
                                          ? 'font-medium text-simar-texto-3 hover:bg-simar-papel'
                                          : 'font-semibold text-simar-texto hover:bg-simar-papel'
                            }`}
                        >
                            {f.getDate()}
                        </button>
                    );
                })}
            </div>

            <div className="mt-3 pt-3 border-t border-simar-borde flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => onElegir(hoy)}
                    disabled={fuera(hoy)}
                    className={`simar-presiona ${enHoja ? 'min-h-[48px]' : 'min-h-[44px]'} px-5 rounded-full bg-simar-marea-suave text-simar-marea-tinta text-[15px] font-bold disabled:opacity-40`}
                >
                    Hoy
                </button>
                {borrable && (
                    <button
                        type="button"
                        onClick={onBorrar}
                        disabled={!valor}
                        className={`${enHoja ? 'min-h-[48px]' : 'min-h-[44px]'} px-4 rounded-full text-[15px] font-bold text-simar-texto-2 hover:bg-simar-papel disabled:opacity-40`}
                    >
                        Borrar fecha
                    </button>
                )}
            </div>
        </div>
    );
}

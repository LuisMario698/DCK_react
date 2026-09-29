'use client';

import { useEffect, useRef, useState, type KeyboardEvent } from 'react';
import { Check, Clock, Minus, Plus } from 'lucide-react';
import { Desplegable } from './Desplegable';

const dos = (n: number) => String(n).padStart(2, '0');
const HORAS = Array.from({ length: 24 }, (_, i) => i);
const MINUTOS = Array.from({ length: 12 }, (_, i) => i * 5);

const leer = (v: string | null | undefined): [number, number] | null => {
    const m = v?.match(/^(\d{1,2}):(\d{2})/);
    return m ? [Math.min(23, Number(m[1])), Math.min(59, Number(m[2]))] : null;
};

/** "2:30 de la tarde": ayuda a leer el formato de 24 horas */
function enPalabras(h: number, m: number) {
    const parte = h < 6 ? 'de la madrugada' : h < 12 ? 'de la mañana' : h < 19 ? 'de la tarde' : 'de la noche';
    return `${h % 12 === 0 ? 12 : h % 12}:${dos(m)} ${parte}`;
}

/**
 * Selector de hora de SiMAR (reemplaza al TimePicker de dos listas). Trabaja con 'HH:MM' (24 horas).
 * Ver DISEÑO_SIMAR.md → "Selector de fecha y hora".
 *
 * Arriba la hora grande (hora y minutos se tocan por separado, o se cambian con ↑ ↓) y cómo se lee
 * ("2:30 de la tarde"); abajo, primero una cuadrícula con las 24 horas y, al elegir una, los minutos
 * de 5 en 5 con ajuste fino de ±1. Cuadrículas y no carátula de reloj: son más fáciles de atinar y de
 * leer para personas mayores. "Ahora" pone la hora actual y "Listo" cierra.
 *
 * `variante` y `onAbrir`/`onCerrar` funcionan igual que en SelectorFecha.
 */
export function SelectorHora({
    valor,
    onCambiar,
    etiqueta,
    marcador = 'Elegir hora',
    variante = 'campo',
    className = '',
    id,
    onAbrir,
    onCerrar,
}: {
    /** 'HH:MM' o '' */
    valor: string | null | undefined;
    onCambiar: (valor: string) => void;
    /** Qué hora es ("Hora de entrada"): nombre para el lector de pantalla y título de la hoja */
    etiqueta: string;
    marcador?: string;
    variante?: 'campo' | 'incrustado';
    className?: string;
    id?: string;
    onAbrir?: () => void;
    onCerrar?: () => void;
}) {
    const ancla = useRef<HTMLButtonElement>(null);
    const [abierto, setAbierto] = useState(false);
    const actual = leer(valor);

    const abrir = () => {
        setAbierto(true);
        onAbrir?.();
    };
    const cerrar = () => {
        setAbierto(false);
        onCerrar?.();
    };
    const terminar = () => {
        cerrar();
        ancla.current?.focus({ preventScroll: true });
    };

    return (
        <div className={`relative ${variante === 'incrustado' ? 'flex-1 min-w-0' : ''} ${className}`}>
            <button
                ref={ancla}
                id={id}
                type="button"
                onClick={() => (abierto ? cerrar() : abrir())}
                aria-haspopup="dialog"
                aria-expanded={abierto}
                aria-label={`${etiqueta}: ${actual ? enPalabras(...actual) : 'sin elegir'}`}
                className={
                    variante === 'campo'
                        ? `w-full min-h-[56px] px-4 rounded-[14px] border-2 bg-simar-superficie text-left text-lg inline-flex items-center gap-2.5 transition-colors focus:outline-none focus-visible:border-simar-marea-tinta ${
                              abierto ? 'border-simar-marea-tinta' : 'border-simar-campo-borde hover:border-simar-marea-tinta'
                          }`
                        : 'w-full min-h-[44px] text-left inline-flex items-center bg-transparent focus:outline-none cursor-pointer'
                }
            >
                {variante === 'campo' && <Clock className="w-[22px] h-[22px] flex-shrink-0 text-simar-texto-2" />}
                <span className={`truncate tabular-nums ${actual ? 'font-bold text-simar-texto' : 'font-medium text-simar-texto-3'}`}>
                    {actual ? `${dos(actual[0])}:${dos(actual[1])}` : marcador}
                </span>
            </button>

            <Desplegable abierto={abierto} onCerrar={cerrar} ancla={ancla} etiqueta={etiqueta}>
                {(enHoja) => <Reloj valor={actual} enHoja={enHoja} onCambiar={onCambiar} onListo={terminar} />}
            </Desplegable>
        </div>
    );
}

function Reloj({
    valor,
    enHoja,
    onCambiar,
    onListo,
}: {
    valor: [number, number] | null;
    enHoja: boolean;
    onCambiar: (valor: string) => void;
    onListo: () => void;
}) {
    // Siempre empieza en la hora (lo más común es corregirla); al abrir, el foco va a la hora grande
    const [paso, setPaso] = useState<'hora' | 'minutos'>('hora');
    const ahora = new Date();
    const [h, m] = valor ?? [null, null];
    const refHora = useRef<HTMLButtonElement>(null);
    useEffect(() => {
        refHora.current?.focus({ preventScroll: true });
    }, []);

    const fijar = (nh: number, nm: number) => onCambiar(`${dos(nh)}:${dos(nm)}`);
    const girar = (cual: 'hora' | 'minutos', n: number) => {
        const baseH = h ?? ahora.getHours();
        const baseM = m ?? 0;
        if (cual === 'hora') fijar((baseH + n + 24) % 24, baseM);
        else fijar(baseH, (baseM + n + 60) % 60);
    };
    // Hora y minutos grandes funcionan como "spinbutton": ↑ ↓ de uno en uno, RePág/AvPág de 5 en 5
    const alTeclear = (cual: 'hora' | 'minutos') => (e: KeyboardEvent<HTMLButtonElement>) => {
        const n = { ArrowUp: 1, ArrowDown: -1, PageUp: 5, PageDown: -5 }[e.key];
        if (!n) return;
        e.preventDefault();
        girar(cual, n);
    };

    const segmento = (cual: 'hora' | 'minutos') =>
        `simar-presiona ${enHoja ? 'min-w-[96px] h-[76px] text-[44px]' : 'min-w-[88px] h-[70px] text-[40px]'} px-2 rounded-[18px] font-extrabold tabular-nums leading-none transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-simar-superficie ${
            paso === cual ? 'bg-simar-marea-suave text-simar-marea-tinta ring-2 ring-inset ring-simar-marea-tinta' : 'bg-simar-papel text-simar-texto hover:bg-simar-marea-suave/60'
        }`;
    const celda = (activo: boolean, marca = false) =>
        `simar-presiona ${enHoja ? 'h-12 text-[17px]' : 'h-11 text-[16px]'} rounded-[12px] font-bold tabular-nums transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-simar-marea-tinta focus-visible:ring-offset-2 focus-visible:ring-offset-simar-superficie ${
            activo
                ? 'bg-simar-marea text-white'
                : marca
                  ? 'bg-simar-superficie text-simar-marea-tinta ring-2 ring-inset ring-simar-marea-tinta/40 hover:bg-simar-marea-suave'
                  : 'bg-simar-papel text-simar-texto hover:bg-simar-marea-suave'
        }`;

    return (
        <div className={enHoja ? 'w-full' : 'w-[318px]'}>
            {/* La hora grande: hora y minutos se eligen por separado */}
            <div className="flex items-center justify-center gap-2">
                <button
                    ref={refHora}
                    type="button"
                    role="spinbutton"
                    aria-label="Hora"
                    aria-valuenow={h ?? undefined}
                    aria-valuemin={0}
                    aria-valuemax={23}
                    aria-valuetext={h === null ? 'sin elegir' : `${h} horas`}
                    onClick={() => setPaso('hora')}
                    onKeyDown={alTeclear('hora')}
                    className={segmento('hora')}
                >
                    {h === null ? '--' : dos(h)}
                </button>
                <span className="text-[36px] font-extrabold text-simar-texto-2 leading-none pb-1" aria-hidden="true">
                    :
                </span>
                <button
                    type="button"
                    role="spinbutton"
                    aria-label="Minutos"
                    aria-valuenow={m ?? undefined}
                    aria-valuemin={0}
                    aria-valuemax={59}
                    aria-valuetext={m === null ? 'sin elegir' : `${m} minutos`}
                    onClick={() => setPaso('minutos')}
                    onKeyDown={alTeclear('minutos')}
                    className={segmento('minutos')}
                >
                    {m === null ? '--' : dos(m)}
                </button>
            </div>
            <p className="mt-2 text-center text-[15px] font-semibold text-simar-texto-2 min-h-[22px]" aria-live="polite">
                {h !== null && m !== null ? enPalabras(h, m) : 'Toca la hora y luego los minutos'}
            </p>

            <p className="mt-3 mb-2 px-0.5 text-[13px] font-bold uppercase tracking-wide text-simar-texto-2">
                {paso === 'hora' ? 'Hora' : 'Minutos'}
            </p>

            {paso === 'hora' ? (
                <div className="grid grid-cols-6 gap-1.5" role="group" aria-label="Elegir la hora">
                    {HORAS.map((i) => (
                        <button
                            key={i}
                            type="button"
                            aria-pressed={i === h}
                            onClick={() => {
                                fijar(i, m ?? 0);
                                setPaso('minutos');
                            }}
                            className={celda(i === h, i === ahora.getHours())}
                        >
                            {dos(i)}
                        </button>
                    ))}
                </div>
            ) : (
                <>
                    <div className="grid grid-cols-4 gap-1.5" role="group" aria-label="Elegir los minutos">
                        {MINUTOS.map((i) => (
                            <button
                                key={i}
                                type="button"
                                aria-pressed={i === m}
                                onClick={() => fijar(h ?? ahora.getHours(), i)}
                                className={celda(i === m)}
                            >
                                :{dos(i)}
                            </button>
                        ))}
                    </div>
                    {/* Ajuste fino para los minutos que no caen en 5 (14:32) */}
                    <div className="mt-2 flex items-center justify-between gap-2 rounded-[14px] bg-simar-papel p-1.5">
                        <button type="button" onClick={() => girar('minutos', -1)} aria-label="Un minuto menos" className={`${celda(false)} w-14 !bg-simar-superficie flex items-center justify-center`}>
                            <Minus className="w-5 h-5" />
                        </button>
                        <span className="text-[15px] font-bold text-simar-texto-2">1 minuto</span>
                        <button type="button" onClick={() => girar('minutos', 1)} aria-label="Un minuto más" className={`${celda(false)} w-14 !bg-simar-superficie flex items-center justify-center`}>
                            <Plus className="w-5 h-5" />
                        </button>
                    </div>
                </>
            )}

            <div className="mt-3 pt-3 border-t border-simar-borde flex items-center justify-between gap-2">
                <button
                    type="button"
                    onClick={() => {
                        fijar(ahora.getHours(), ahora.getMinutes());
                        onListo();
                    }}
                    className={`simar-presiona ${enHoja ? 'min-h-[48px]' : 'min-h-[44px]'} px-5 rounded-full bg-simar-marea-suave text-simar-marea-tinta text-[15px] font-bold`}
                >
                    Ahora
                </button>
                <button
                    type="button"
                    onClick={onListo}
                    className={`simar-presiona ${enHoja ? 'min-h-[48px]' : 'min-h-[44px]'} px-5 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-[15px] font-bold inline-flex items-center gap-1.5`}
                >
                    <Check className="w-[18px] h-[18px]" strokeWidth={2.6} />
                    Listo
                </button>
            </div>
        </div>
    );
}

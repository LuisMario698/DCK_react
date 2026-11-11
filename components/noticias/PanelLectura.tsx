'use client';

import { useCallback, useEffect, useId, useLayoutEffect, useRef, useState, type CSSProperties, type MouseEvent, type ReactNode, type RefObject } from 'react';
import { createPortal } from 'react-dom';
import { AArrowDown, AArrowUp, RotateCcw, Type, X } from 'lucide-react';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import { useTheme } from '@/components/layout/ThemeContext';
import { useGota } from '@/components/isla/islaTienda';
import { SelectorLiquido } from '@/components/isla/SelectorLiquido';
import { AJUSTES_BASE, NIVELES_LETRA, NOMBRE_NIVEL, cambiarAjustes, movimientoQuieto, useAjustesLectura, type AjustesLectura as Ajustes } from './ajustesLectura';

/**
 * El botón «Lectura» de la barra de Noticias y su panel de accesibilidad: tamaño (A− / A+, cinco
 * niveles), contraste alto, renglones amplios, tema claro u oscuro, sin animaciones y enlaces
 * subrayados. Cada cambio se ve al momento y se guarda en este dispositivo (ajustesLectura.ts).
 *
 * Todo responde al presionar y se mueve como líquido: los selectores llevan una lente que se desliza
 * (SelectorLiquido), el tamaño se llena barra por barra con un rebote corto y su nombre sube o baja
 * según el sentido, el tema se abre en círculo desde la opción que se tocó, y «Volver a como estaba»
 * gira su flecha. Al abrir la gota, los renglones llegan uno tras otro (isla-escalon).
 * Con isla va en su gota; sin isla, en un panel de respaldo (useVentanaAccesible: el foco entra, Tab
 * no se sale, Esc lo cierra y el foco regresa al botón; en celular sale como hoja desde abajo).
 */

/** El centro de un botón (de ahí se abre el tema nuevo) */
const centroDe = (el: HTMLElement) => {
    const r = el.getBoundingClientRect();
    return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
};

/** Escalón de la entrada: cada renglón llega un poco después del anterior */
const escalon = (i: number) => ({ '--i': i }) as CSSProperties;

/** El tamaño de la letra: A− / A+ con los cinco niveles a la vista, que se llenan como líquido */
function TamanoLetra({ letra }: { letra: number }) {
    // El sentido del último cambio: el nombre entra desde abajo al subir y desde arriba al bajar
    const [sentido, setSentido] = useState<0 | 1 | -1>(0);
    const paso = (d: 1 | -1) => {
        setSentido(d);
        cambiarAjustes({ letra: letra + d });
    };
    const boton =
        'isla-pulsa w-[56px] h-[56px] flex-shrink-0 rounded-[16px] bg-simar-superficie ring-1 ring-simar-borde inline-flex items-center justify-center text-simar-texto hover:ring-simar-campo-borde disabled:opacity-35 disabled:cursor-not-allowed cursor-pointer';
    return (
        <div
            role="group"
            aria-label="Tamaño de la letra"
            className="isla-escalon mt-5 rounded-[22px] bg-simar-papel ring-1 ring-inset ring-simar-borde p-2 flex items-center gap-2"
            style={escalon(1)}
        >
            <button type="button" onClick={() => paso(-1)} disabled={letra === 0} aria-label="Letra más chica" className={boton}>
                <AArrowDown aria-hidden="true" className="w-6 h-6" />
            </button>
            <div className="flex-1 text-center overflow-hidden">
                <p aria-live="polite" className="text-[17px] font-extrabold">
                    <span key={letra} className={`inline-block ${sentido > 0 ? 'isla-cifra-sube' : sentido < 0 ? 'isla-cifra-baja' : ''}`}>
                        {NOMBRE_NIVEL[letra]}
                        <span className="ml-1.5 text-[14px] font-bold text-simar-texto-2 tabular-nums">{Math.round(NIVELES_LETRA[letra] * 100)} %</span>
                    </span>
                </p>
                <span aria-hidden="true" className="mt-2 flex items-end justify-center gap-1.5">
                    {NIVELES_LETRA.map((_, i) => (
                        <span key={i} className="relative w-2.5 rounded-full bg-simar-borde overflow-hidden" style={{ height: 8 + i * 4 }}>
                            <span
                                className="isla-nivel absolute inset-0 rounded-full bg-simar-texto"
                                data-lleno={i <= letra}
                                // Al subir se llenan de izquierda a derecha; al bajar se vacían de derecha a izquierda
                                style={{ '--i': sentido < 0 ? NIVELES_LETRA.length - 1 - i : i } as CSSProperties}
                            />
                        </span>
                    ))}
                </span>
            </div>
            <button type="button" onClick={() => paso(1)} disabled={letra === NIVELES_LETRA.length - 1} aria-label="Letra más grande" className={boton}>
                <AArrowUp aria-hidden="true" className="w-6 h-6" />
            </button>
        </div>
    );
}

/** Lo de adentro del panel: va en la gota de la isla o, sin isla, en el panel de respaldo */
export function ContenidoLectura({ cerrar }: { cerrar?: () => void }) {
    const ajustes = useAjustesLectura();
    const { theme, toggleTheme } = useTheme();
    const titulo = useId();
    const cambiar = (c: Partial<Ajustes>) => cambiarAjustes(c);
    const distinto = (Object.keys(AJUSTES_BASE) as (keyof Ajustes)[]).some((k) => ajustes[k] !== AJUSTES_BASE[k]);
    const restablecer = (e: MouseEvent<HTMLButtonElement>) => {
        if (!movimientoQuieto()) {
            e.currentTarget.querySelector('svg')?.animate([{ transform: 'rotate(0deg)' }, { transform: 'rotate(-360deg)' }], {
                duration: 620,
                easing: 'cubic-bezier(0.3, 0.7, 0.25, 1)',
            });
        }
        cambiar(AJUSTES_BASE);
    };
    return (
        <div aria-labelledby={titulo}>
            <div className="isla-escalon flex items-start justify-between gap-4" style={escalon(0)}>
                <div>
                    <h2 id={titulo} className="text-[22px] font-extrabold leading-tight tracking-[-0.01em]">
                        Ajustes de lectura
                    </h2>
                    <p className="mt-1 text-[15px] text-simar-texto-2">Se guardan en este dispositivo.</p>
                </div>
                <button
                    type="button"
                    onClick={cerrar}
                    aria-label="Cerrar los ajustes de lectura"
                    className="isla-pulsa w-11 h-11 -mr-2 -mt-1 flex-shrink-0 rounded-full inline-flex items-center justify-center text-simar-texto-2 bg-simar-texto/[0.05] hover:bg-simar-texto/[0.09] hover:text-simar-texto cursor-pointer"
                >
                    <X aria-hidden="true" className="w-5 h-5" />
                </button>
            </div>

            <TamanoLetra letra={ajustes.letra} />

            <div className="mt-3 divide-y divide-simar-borde-suave">
                <div className="isla-escalon" style={escalon(2)}>
                    <SelectorLiquido
                        etiqueta="Contraste"
                        valor={ajustes.contraste}
                        opciones={[
                            { valor: 'normal', texto: 'Normal' },
                            { valor: 'alto', texto: 'Alto' },
                        ]}
                        alCambiar={(v) => cambiar({ contraste: v })}
                    />
                </div>
                <div className="isla-escalon" style={escalon(3)}>
                    <SelectorLiquido
                        etiqueta="Renglones"
                        valor={ajustes.interlineado}
                        opciones={[
                            { valor: 'normal', texto: 'Normal' },
                            { valor: 'amplio', texto: 'Amplios' },
                        ]}
                        alCambiar={(v) => cambiar({ interlineado: v })}
                    />
                </div>
                <div className="isla-escalon" style={escalon(4)}>
                    <SelectorLiquido
                        etiqueta="Tema"
                        valor={theme === 'dark' ? 'oscuro' : 'claro'}
                        opciones={[
                            { valor: 'claro', texto: 'Claro' },
                            { valor: 'oscuro', texto: 'Oscuro' },
                        ]}
                        // El tema nuevo se abre en círculo desde la opción que se tocó
                        alCambiar={(v, boton) => {
                            if ((v === 'oscuro') !== (theme === 'dark')) toggleTheme(centroDe(boton));
                        }}
                    />
                </div>
                <div className="isla-escalon" style={escalon(5)}>
                    <SelectorLiquido
                        etiqueta="Animaciones"
                        valor={ajustes.movimiento}
                        opciones={[
                            { valor: 'normal', texto: 'Sí' },
                            { valor: 'quieto', texto: 'No' },
                        ]}
                        alCambiar={(v) => cambiar({ movimiento: v })}
                    />
                </div>
                <div className="isla-escalon" style={escalon(6)}>
                    <SelectorLiquido
                        etiqueta="Subrayar enlaces"
                        valor={ajustes.enlaces}
                        opciones={[
                            { valor: 'normal', texto: 'No' },
                            { valor: 'subrayados', texto: 'Sí' },
                        ]}
                        alCambiar={(v) => cambiar({ enlaces: v })}
                    />
                </div>
            </div>

            <div className="isla-escalon" style={escalon(7)}>
                <button
                    type="button"
                    onClick={restablecer}
                    disabled={!distinto}
                    className="isla-pulsa mt-4 min-h-[48px] px-4 -ml-1 rounded-full inline-flex items-center gap-2 text-[16px] font-bold text-simar-marea-tinta hover:bg-simar-marea-suave disabled:text-simar-texto-3 disabled:hover:bg-transparent disabled:cursor-not-allowed cursor-pointer transition-colors"
                >
                    <RotateCcw aria-hidden="true" className="w-[18px] h-[18px]" />
                    Volver a como estaba
                </button>
            </div>
        </div>
    );
}

/** La gota «Lectura» de la isla de Noticias */
export function GotaLectura() {
    const gota = useGota('lectura');
    return (
        <div className="p-6 max-sm:p-5">
            <ContenidoLectura cerrar={gota.cerrar} />
        </div>
    );
}

function Panel({ cerrar, ancla }: { cerrar: () => void; ancla: RefObject<HTMLButtonElement | null> }) {
    const panel = useRef<HTMLDivElement>(null);
    const [pos, setPos] = useState<{ top: number; right: number } | null>(null);
    useVentanaAccesible(panel, true, { alEscape: cerrar });

    // En computadora, abajo del botón; en celular, hoja desde abajo (sólo CSS)
    useLayoutEffect(() => {
        const medir = () => {
            if (!ancla.current) return;
            const r = ancla.current.getBoundingClientRect();
            setPos({ top: r.bottom + 12, right: Math.max(12, window.innerWidth - r.right) });
        };
        medir();
        window.addEventListener('resize', medir);
        return () => window.removeEventListener('resize', medir);
    }, [ancla]);

    // Un clic afuera lo cierra
    useEffect(() => {
        const alPulsar = (e: PointerEvent) => {
            const t = e.target as Node;
            if (!panel.current?.contains(t) && !ancla.current?.contains(t)) cerrar();
        };
        document.addEventListener('pointerdown', alPulsar);
        return () => document.removeEventListener('pointerdown', alPulsar);
    }, [ancla, cerrar]);

    return createPortal(
        <div
            ref={panel}
            role="dialog"
            aria-modal="false"
            aria-label="Ajustes de lectura"
            style={pos ? { top: pos.top, right: pos.right } : undefined}
            className={`n-panel-lectura fixed z-[60] w-[400px] max-h-[calc(100svh-120px)] overflow-y-auto rounded-[28px] bg-simar-superficie text-simar-texto ring-1 ring-simar-borde shadow-[0_30px_80px_-30px_rgba(11,34,54,0.55)] p-6 font-sans antialiased ${
                pos ? '' : 'invisible'
            } max-sm:inset-x-3! max-sm:top-auto! max-sm:bottom-3! max-sm:w-auto! max-sm:max-h-[78svh] max-sm:p-5`}
        >
            <ContenidoLectura cerrar={cerrar} />
        </div>,
        document.body,
    );
}

/** El botón de la barra. `children`: otro texto junto al ícono (si no, «Lectura»; en celular, sólo el ícono) */
export function BotonAjustesLectura({ className = '', children, ancla = false }: { className?: string; children?: ReactNode; ancla?: boolean }) {
    const [abiertoSolo, setAbiertoSolo] = useState(false);
    const boton = useRef<HTMLButtonElement>(null);
    const cerrar = useCallback(() => setAbiertoSolo(false), []);
    const gota = useGota('lectura');
    const abierto = gota.hayIsla ? gota.abierta : abiertoSolo;
    const { ancla: ponerAncla } = gota;
    // El de la barra es de donde nace la gota
    const referencia = useCallback(
        (el: HTMLButtonElement | null) => {
            boton.current = el;
            if (ancla) ponerAncla(el);
        },
        [ancla, ponerAncla],
    );
    const ajustes = useAjustesLectura();
    const cambiado = (Object.keys(AJUSTES_BASE) as (keyof Ajustes)[]).some((k) => ajustes[k] !== AJUSTES_BASE[k]);
    return (
        <>
            <button
                ref={referencia}
                type="button"
                aria-haspopup="dialog"
                aria-expanded={abierto}
                // El de la nota manda una gotita a la isla y la gota cae de ahí (useGota().alternarDesde)
                data-isla-abre="lectura"
                data-vidrio="claro"
                onClick={(e) => (gota.hayIsla ? gota.alternarDesde(e.currentTarget) : setAbiertoSolo((a) => !a))}
                className={`relative min-h-[52px] px-4 rounded-full inline-flex items-center gap-2 text-[17px] font-bold text-simar-texto transition-colors cursor-pointer ${
                    abierto ? 'bg-simar-texto/10' : 'hover:bg-simar-texto/5'
                } movil:min-h-[46px] movil:px-3 ${className}`}
            >
                <Type aria-hidden="true" className="w-5 h-5" />
                {children ?? <span className="movil:sr-only">Lectura</span>}
                {cambiado && <span aria-hidden="true" className="absolute right-2 top-2 w-2 h-2 rounded-full bg-simar-marea" />}
                {cambiado && <span className="sr-only">(con ajustes)</span>}
            </button>
            {!gota.hayIsla && abierto && <Panel cerrar={cerrar} ancla={boton} />}
        </>
    );
}

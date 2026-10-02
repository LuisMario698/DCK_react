'use client';

/**
 * Piezas de movimiento funcional del lenguaje SiMAR (ver DISEÑO_SIMAR.md → "Movimiento").
 * Sólo presentación: no guardan datos ni cambian la lógica de las pantallas.
 * Todo respeta "reducir movimiento" del sistema.
 */
import { useEffect, useRef, useState, useSyncExternalStore, type CSSProperties } from 'react';

const CONSULTA_REDUCIR = '(prefers-reduced-motion: reduce)';

function suscribirReducir(avisar: () => void) {
    const consulta = window.matchMedia(CONSULTA_REDUCIR);
    consulta.addEventListener('change', avisar);
    return () => consulta.removeEventListener('change', avisar);
}

/** ¿El sistema pide reducir movimiento? (false en el servidor) */
export function usePrefiereMenosMovimiento() {
    return useSyncExternalStore(
        suscribirReducir,
        () => window.matchMedia(CONSULTA_REDUCIR).matches,
        () => false
    );
}

/**
 * Mantiene montada una ventana mientras hace su animación de salida.
 * `montado`: si se dibuja; `saliendo`: si debe llevar las clases de salida
 * (`simar-velo-sale` / `simar-ventana-sale`).
 */
export function usePresencia(abierto: boolean, duracionSalida = 180) {
    const [montado, setMontado] = useState(abierto);
    // Al abrir se monta en el mismo render (patrón "ajustar estado al cambiar una prop")
    if (abierto && !montado) setMontado(true);
    const saliendo = montado && !abierto;

    useEffect(() => {
        if (!saliendo) return;
        const t = setTimeout(() => setMontado(false), duracionSalida);
        return () => clearTimeout(t);
    }, [saliendo, duracionSalida]);

    return { montado: montado || abierto, saliendo };
}

/**
 * Número que cuenta hasta su valor al aparecer en pantalla y, si el valor cambia
 * (otro período, otro filtro), pasa del anterior al nuevo. Formato es-MX.
 * El lector de pantalla oye sólo el valor final.
 */
export function NumeroAnimado({
    valor,
    decimales = 0,
    duracion = 900,
    className = '',
}: {
    valor: number;
    decimales?: number;
    duracion?: number;
    className?: string;
}) {
    const reducir = usePrefiereMenosMovimiento();
    const ref = useRef<HTMLSpanElement>(null);
    const [visto, setVisto] = useState(false);
    const [mostrado, setMostrado] = useState(0);
    const desde = useRef(0);
    const final = Number.isFinite(valor) ? valor : 0;

    // Empieza a contar cuando el número entra en pantalla
    useEffect(() => {
        const nodo = ref.current;
        if (!nodo || visto) return;
        const obs = new IntersectionObserver(
            ([e]) => {
                if (e.isIntersecting) {
                    setVisto(true);
                    obs.disconnect();
                }
            },
            { threshold: 0.2 }
        );
        obs.observe(nodo);
        return () => obs.disconnect();
    }, [visto]);

    useEffect(() => {
        if (!visto || reducir) return;
        const inicio = desde.current;
        const t0 = performance.now();
        let id = requestAnimationFrame(function paso(ahora: number) {
            // La hora del cuadro puede ser un poco anterior a t0: sin el mínimo de 0 salía "-5"
            const p = Math.max(0, Math.min((ahora - t0) / duracion, 1));
            const actual = inicio + (final - inicio) * (1 - Math.pow(1 - p, 3)); // frena al final
            desde.current = actual;
            setMostrado(actual);
            if (p < 1) id = requestAnimationFrame(paso);
        });
        return () => cancelAnimationFrame(id);
    }, [final, visto, reducir, duracion]);

    const formato = (n: number) =>
        n.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

    return (
        <span ref={ref} className={className}>
            <span className="sr-only">{formato(final)}</span>
            <span aria-hidden="true" className="tabular-nums">
                {formato(reducir ? final : mostrado)}
            </span>
        </span>
    );
}

/**
 * Palomita que se dibuja: primero el círculo y luego la marca. Para "Firmado", "Guardado" y
 * los avisos de éxito. Con `circulo={false}` sólo la marca (insignias pequeñas).
 */
export function PalomitaAnimada({
    tamano = 26,
    circulo = true,
    className = '',
}: {
    tamano?: number;
    circulo?: boolean;
    className?: string;
}) {
    return (
        <svg
            aria-hidden="true"
            width={tamano}
            height={tamano}
            viewBox="0 0 26 26"
            fill="none"
            stroke="currentColor"
            strokeWidth={circulo ? 2.4 : 3}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`flex-shrink-0 ${className}`}
        >
            {circulo && (
                <circle
                    cx="13"
                    cy="13"
                    r="11"
                    pathLength={1}
                    className="simar-dibuja"
                    style={{ '--simar-trazo-dur': '0.45s' } as CSSProperties}
                />
            )}
            <path
                d={circulo ? 'M8 13.4l3.4 3.4L18.2 9.6' : 'M5 13.5l5 5L21 7.5'}
                pathLength={1}
                className="simar-dibuja"
                style={{ '--simar-trazo-dur': '0.35s', animationDelay: circulo ? '0.3s' : '0s' } as CSSProperties}
            />
        </svg>
    );
}

/** Bloque de esqueleto mientras carga una pantalla. Esquinas de 16 px salvo que se pida otra (`rounded-full`). */
export function Esqueleto({ className = '', style }: { className?: string; style?: CSSProperties }) {
    const esquinas = /\brounded/.test(className) ? '' : 'rounded-2xl';
    return <span aria-hidden="true" className={`simar-esqueleto block ${esquinas} ${className}`} style={style} />;
}

/**
 * Esqueleto de una pantalla de panel (encabezado + tarjetas) para los `loading.tsx`.
 * Espera 0.15 s antes de mostrarse: si la pantalla llega rápido, no parpadea.
 */
export function EsqueletoPantalla({ variante = 'panel' }: { variante?: 'panel' | 'estadisticas' }) {
    const tarjeta = 'bg-simar-superficie border border-simar-borde shadow-simar';
    return (
        <div role="status" aria-live="polite" className="simar-pagina max-w-[1600px] space-y-6" style={{ animationDelay: '0.15s' }}>
            <span className="sr-only">Cargando la pantalla…</span>
            <div className="flex items-center gap-5">
                <Esqueleto className="w-16 h-16 rounded-full flex-shrink-0" />
                <div className="flex-1 space-y-3">
                    <Esqueleto className="h-9 w-80 max-w-full" />
                    <Esqueleto className="h-5 w-[28rem] max-w-full" />
                </div>
            </div>

            {variante === 'estadisticas' ? (
                <>
                    {/* Pestañas, período, frase de resumen, cuatro cifras y la gráfica (ver EstadisticasGenerales) */}
                    <Esqueleto className="h-[68px] w-72 max-w-full rounded-2xl" />
                    <Esqueleto className="h-[60px] w-[26rem] max-w-full rounded-xl" />
                    <div className={`${tarjeta} rounded-[28px] p-6 md:p-8 space-y-3`}>
                        <Esqueleto className="h-5 w-40" />
                        <Esqueleto className="h-8 w-[40rem] max-w-full" />
                        <Esqueleto className="h-8 w-[30rem] max-w-full" />
                        <Esqueleto className="h-5 w-80 max-w-full" />
                    </div>
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
                        {[0, 1, 2, 3].map((i) => (
                            <div key={i} className={`${tarjeta} rounded-[22px] p-5 space-y-3`}>
                                <Esqueleto className="w-12 h-12 rounded-full" />
                                <Esqueleto className="h-9 w-32 max-w-full" />
                                <Esqueleto className="h-4 w-36 max-w-full" />
                            </div>
                        ))}
                    </div>
                    <div className={`${tarjeta} rounded-[28px] p-7`}>
                        <Esqueleto className="h-7 w-48 max-w-full" />
                        <div className="mt-8 h-56 flex items-end gap-3">
                            {[45, 70, 55, 90, 65, 80].map((alto, i) => (
                                <Esqueleto key={i} className="flex-1 max-w-[56px] rounded-xl" style={{ height: `${alto}%` }} />
                            ))}
                        </div>
                    </div>
                </>
            ) : (
                <>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                        {[0, 1, 2].map((i) => (
                            <div key={i} className={`${tarjeta} rounded-[28px] p-7 space-y-4`}>
                                <Esqueleto className="w-[72px] h-[72px] rounded-full" />
                                <Esqueleto className="h-8 w-40" />
                                <Esqueleto className="h-5 w-56 max-w-full" />
                            </div>
                        ))}
                    </div>
                    <div className={`${tarjeta} rounded-[28px] p-7 space-y-4`}>
                        <Esqueleto className="h-7 w-60" />
                        <Esqueleto className="h-14" />
                        <Esqueleto className="h-14" />
                        <Esqueleto className="h-14" />
                    </div>
                </>
            )}
        </div>
    );
}

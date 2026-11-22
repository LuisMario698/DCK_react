'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Calculator, X } from 'lucide-react';
import { useVentanaAccesible } from '@/components/ui/useVentanaAccesible';
import {
    KG_BOLSA_BASURA,
    KG_CAMION_RECOLECTOR,
    KG_CO2_POR_ARBOL_ANIO,
    LITROS_AGUA_POR_LITRO_ACEITE,
    LITROS_ALBERCA_OLIMPICA,
    LITROS_TINACO,
    RECINTO_CO2_POR_KG_BASURON,
    RECINTO_CO2_POR_LITRO_ACEITE,
} from '@/lib/constants/impacto';

const n = (v: number, decimales = 0) => v.toLocaleString('es-MX', { minimumFractionDigits: decimales, maximumFractionDigits: decimales });

/**
 * «¿Cómo se calculan?»: el botón y la ventana con los factores de lib/constants/impacto.ts.
 * `usaTinaco` / `usaBolsa`: la franja dijo tinacos o bolsas (cifras chicas) en lugar de albercas
 * o camiones, y la ventana explica esa unidad.
 */
export function ComoSeCalculan({ usaTinaco = false, usaBolsa = false }: { usaTinaco?: boolean; usaBolsa?: boolean }) {
    const [abierto, setAbierto] = useState(false);
    return (
        <>
            <button
                type="button"
                onClick={() => setAbierto(true)}
                aria-haspopup="dialog"
                className="simar-presiona min-h-[52px] pl-5 pr-6 rounded-full inline-flex items-center gap-2.5 bg-simar-marea-suave text-simar-marea-tinta text-[17px] font-extrabold hover:bg-simar-marea hover:text-white transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-simar-golfo"
            >
                <Calculator aria-hidden="true" className="w-5 h-5" strokeWidth={2.2} />
                ¿Cómo se calculan?
            </button>
            {abierto && <Ventana usaTinaco={usaTinaco} usaBolsa={usaBolsa} alCerrar={() => setAbierto(false)} />}
        </>
    );
}

function Ventana({ usaTinaco, usaBolsa, alCerrar }: { usaTinaco: boolean; usaBolsa: boolean; alCerrar: () => void }) {
    const id = useId();
    const panel = useRef<HTMLDivElement>(null);
    // Primero se ve la salida y luego se quita (sin espera con «reducir movimiento»)
    const [cerrando, setCerrando] = useState(false);
    const espera = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
    useEffect(() => () => clearTimeout(espera.current), []);
    const cerrar = () => {
        if (cerrando) return;
        setCerrando(true);
        const quieto = typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        espera.current = setTimeout(alCerrar, quieto ? 0 : 180);
    };
    // Foco adentro al abrir, Tab no se sale, Esc cierra y el foco regresa al botón
    useVentanaAccesible(panel, true, { alEscape: cerrar });

    const filas: { que: string; vale: string }[] = [
        { que: '1 litro de aceite usado', vale: `puede contaminar ${n(LITROS_AGUA_POR_LITRO_ACEITE)} L de agua (EPA)` },
        usaTinaco
            ? { que: 'Un tinaco de casa', vale: `${n(LITROS_TINACO)} L` }
            : { que: 'Una alberca olímpica', vale: `${n(LITROS_ALBERCA_OLIMPICA)} L (50 × 25 × 2 m)` },
        usaBolsa
            ? { que: 'Una bolsa de basura grande', vale: `${n(KG_BOLSA_BASURA)} kg` }
            : { que: 'Un camión recolector lleno', vale: `${n(KG_CAMION_RECOLECTOR)} kg de basura` },
        { que: 'Un árbol adulto', vale: `absorbe ${n(KG_CO2_POR_ARBOL_ANIO)} kg de CO₂ al año` },
        { que: 'Cada litro de aceite recolectado', vale: `evita ${n(RECINTO_CO2_POR_LITRO_ACEITE, 1)} kg de CO₂e` },
        { que: 'Cada kg llevado al relleno (Basurón)', vale: `evita ${n(RECINTO_CO2_POR_KG_BASURON, 1)} kg de CO₂e` },
    ];

    return (
        <div
            className={`${cerrando ? 'simar-velo-sale' : 'simar-velo'} fixed inset-0 z-[90] flex items-center justify-center p-4 bg-[rgba(11,34,54,0.55)]`}
            onClick={cerrar}
        >
            <div
                ref={panel}
                role="dialog"
                aria-modal="true"
                aria-labelledby={`${id}-titulo`}
                tabIndex={-1}
                className={`${cerrando ? 'simar-ventana-sale' : 'simar-ventana'} bg-simar-superficie text-simar-texto rounded-[28px] shadow-2xl w-full max-w-[560px] max-h-[92dvh] overflow-y-auto overscroll-contain border border-simar-borde outline-none`}
                onClick={(e) => e.stopPropagation()}
            >
                {/* El título se queda arriba si la ventana se desplaza. En celular sube como hoja (globals.css) y
                    el título se desplaza con ella: así no tapa la agarradera */}
                <div className="sticky top-0 z-10 bg-simar-superficie flex items-start justify-between gap-4 px-7 pt-7 pb-1 movil:static movil:px-5 movil:pt-7">
                    <h3 id={`${id}-titulo`} className="font-titular text-[30px] font-semibold leading-[1.08] tracking-[-0.018em] movil:text-[26px]">
                        Cómo se calculan las cifras
                    </h3>
                    <button
                        type="button"
                        onClick={cerrar}
                        aria-label="Cerrar"
                        className="w-[52px] h-[52px] flex-shrink-0 rounded-2xl bg-simar-papel text-simar-texto flex items-center justify-center hover:bg-simar-borde-suave transition-colors"
                    >
                        <X aria-hidden="true" className="w-6 h-6" />
                    </button>
                </div>

                <dl className="mt-4 mx-7 divide-y divide-simar-borde-suave border-y border-simar-borde-suave movil:mx-5">
                    {filas.map((f) => (
                        <div key={f.que} className="py-3.5 grid gap-0.5 movil:py-3">
                            <dt className="text-[17px] font-bold">{f.que}</dt>
                            <dd className="text-[17px] text-simar-texto-2 tabular-nums">{f.vale}</dd>
                        </div>
                    ))}
                </dl>

                <p className="mx-7 mt-5 mb-7 rounded-2xl bg-simar-papel px-4 py-3.5 text-[17px] leading-snug text-simar-texto-2 movil:mx-5 movil:mb-5">
                    <strong className="font-extrabold text-simar-texto">Son factores provisionales.</strong> Los revisa un asesor externo antes de usarse
                    en reportes oficiales.
                </p>
            </div>
        </div>
    );
}

'use client';

/**
 * Tarjeta "Impacto ambiental · Estimado": la usan Estadísticas del recinto y el Impacto del portal de
 * empresas, para que la misma cifra se vea y se explique igual en los dos lados (las cuentas están en
 * lib/utils/equivalencias.ts).
 *
 * Lo principal es la equivalencia en algo conocido ("1.2 albercas olímpicas", "416 árboles"): número
 * grande y su nombre. La cifra técnica ("2.9 millones de litros") va debajo, como dato de apoyo.
 * "¿Cómo se calcula?" se abre aparte, con las fórmulas que pase cada pantalla.
 */
import { useId, useState, type CSSProperties, type ReactNode } from 'react';
import { ChevronDown, Leaf } from 'lucide-react';
import { NumeroAnimado } from '@/components/ui/movimiento';
import { decimalesEquivalencia, type Equivalencia } from '@/lib/utils/equivalencias';

/** "2.9 millones de litros", "1,250 kg" */
export const fmtCifra = (n: number, unidad: string) =>
    n >= 1_000_000
        ? `${(n / 1_000_000).toLocaleString('es-MX', { maximumFractionDigits: 1 })} millones de ${unidad === 'L' ? 'litros' : unidad}`
        : `${Math.round(n).toLocaleString('es-MX')} ${unidad}`;

export interface TarjetaImpacto {
    eq: Equivalencia;
    /** La cifra técnica de apoyo: "2.9 millones de litros de agua" */
    dato: string;
}

export function ImpactoEquivalencias({
    subtitulo,
    tarjetas,
    vacio,
    calculo,
    style,
}: {
    subtitulo: string;
    tarjetas: TarjetaImpacto[];
    /** Qué decir cuando no hay nada que calcular */
    vacio: string;
    /** Los renglones de "¿Cómo se calcula?" (el aviso de factores provisionales se agrega solo) */
    calculo: ReactNode[];
    style?: CSSProperties;
}) {
    const [verCalculo, setVerCalculo] = useState(false);
    const idCalculo = useId();

    return (
        <section data-recorrido="impacto" className="simar-aparece bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 md:p-7 min-w-0 movil:p-4 movil:rounded-[22px]" style={style}>
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
                    <p className="text-[17px] text-simar-texto-2 movil:text-[14px]">{subtitulo}</p>
                </div>
            </div>

            {tarjetas.length > 0 ? (
                // En computadora, lado a lado; en celular, una bajo otra con el ícono a la izquierda
                <ul className={`mt-5 grid grid-cols-1 gap-3 md:gap-4 movil:mt-3.5 movil:gap-2.5 ${tarjetas.length === 1 ? 'sm:grid-cols-1 max-w-md' : tarjetas.length === 2 ? 'sm:grid-cols-2' : 'sm:grid-cols-3'}`}>
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
                <p className="mt-4 rounded-2xl bg-simar-papel px-5 py-8 text-center text-[17px] text-simar-texto-2 movil:text-[14px]">{vacio}</p>
            )}

            {/* Cómo se calcula: a la vista para quien lo busque, sin ocupar lugar */}
            <div className="mt-4 pt-3 border-t border-simar-borde-suave movil:mt-3">
                <button
                    type="button"
                    onClick={() => setVerCalculo((v) => !v)}
                    aria-expanded={verCalculo}
                    aria-controls={idCalculo}
                    className="simar-presiona inline-flex items-center gap-1.5 min-h-[44px] -ml-1 px-1 rounded-xl text-[15px] font-bold text-simar-marea-tinta movil:text-[14px]"
                >
                    ¿Cómo se calcula?
                    <ChevronDown className={`w-[18px] h-[18px] transition-transform duration-300 ${verCalculo ? 'rotate-180' : ''}`} aria-hidden="true" />
                </button>
                <div
                    id={idCalculo}
                    className={`grid transition-[grid-template-rows,opacity] duration-300 ${verCalculo ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
                    style={{ transitionTimingFunction: 'var(--simar-frena)' }}
                    inert={!verCalculo}
                >
                    <div className="overflow-hidden">
                        <ul className="mt-1 space-y-1.5 text-[15px] leading-snug text-simar-texto-2 movil:text-[13.5px]">
                            {calculo.map((c, i) => (
                                <li key={i}>{c}</li>
                            ))}
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

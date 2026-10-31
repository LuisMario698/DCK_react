'use client';

import { ChevronDown, Waves, Wrench, type LucideIcon } from 'lucide-react';
import { NumeroAnimado } from '@/components/ui/movimiento';
import type { LandingStats } from '@/lib/services/landing_stats';
import {
    aguaProtegidaL,
    co2EvitadoKg,
    decimalesEquivalencia,
    equivalenciaAgua,
    equivalenciaBasura,
    equivalenciaCO2,
    esUno,
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
import { Encabezado, cifra } from './comunes';
import { TextoQueSeEnciende } from './escena';

interface Tarjeta {
    icono: LucideIcon;
    etiqueta: string;
    valor: number;
    decimales: number;
    unidad: string;
    descripcion: string;
    /** De qué sale: la cantidad registrada en los manifiestos */
    base: string;
    tono: string;
}

// Tailwind sólo ve clases escritas completas
const COLUMNAS: Record<number, string> = { 1: '', 2: 'md:grid-cols-2', 3: 'md:grid-cols-3' };

const deEquivalencia = (eq: Equivalencia) => ({
    valor: eq.valor,
    decimales: decimalesEquivalencia(eq.valor),
    unidad: esUno(eq.valor) ? eq.nombre[0] : eq.nombre[1],
    descripcion: eq.descripcion,
});

/**
 * 5 · Lo que ya logramos. Junta las equivalencias y el impacto en una sola sección, sin repetir
 * cifras: una tarjeta grande (agua protegida) y tres chicas. Las cuentas son las de Estadísticas
 * (lib/utils/equivalencias.ts) y la basura del basurón no se suma a la de los barcos. Abajo, de
 * dónde salen los números (#fuentes, al que lleva el hero).
 */
export function LoQueLogramos({ stats }: { stats: LandingStats | null }) {
    const aceite = stats?.totalAceiteUsado ?? 0;
    const basura = stats?.totalBasura ?? 0;
    const co2 = co2EvitadoKg(aceite, stats?.totalBasuron ?? 0);
    const filtros = (stats?.filtrosAceite ?? 0) + (stats?.filtrosDiesel ?? 0) + (stats?.filtrosAire ?? 0);

    const eqAgua = equivalenciaAgua(aguaProtegidaL(aceite));
    const eqCO2 = equivalenciaCO2(co2);
    const eqBasura = equivalenciaBasura(basura);

    const chicas: Tarjeta[] = [];
    if (eqCO2)
        chicas.push({
            icono: eqCO2.icono,
            etiqueta: 'Aire más limpio',
            ...deEquivalencia(eqCO2),
            base: `${cifra(co2)} kg de CO₂ que se evitaron (estimado)`,
            tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        });
    if (eqBasura)
        chicas.push({
            icono: eqBasura.icono,
            etiqueta: 'Mar limpio',
            ...deEquivalencia(eqBasura),
            base: `${cifra(basura)} kg de basura que entregaron los barcos`,
            tono: 'bg-simar-marea-suave text-simar-marea-tinta',
        });
    if (filtros > 0)
        chicas.push({
            icono: Wrench,
            etiqueta: 'Filtros de motor',
            valor: filtros,
            decimales: 0,
            unidad: filtros === 1 ? 'filtro' : 'filtros',
            descripcion: 'de aceite, diésel y aire que no terminaron en el mar',
            base: `en ${cifra(stats?.totalManifiestos ?? 0)} manifiestos`,
            tono: 'bg-simar-coral-suave text-simar-coral',
        });

    return (
        <section id="logros" className="relative bg-simar-papel px-6 pt-24 md:pt-36 pb-20 md:pb-32 movil:px-5 movil:pt-16 movil:pb-14">
            <div className="max-w-[1248px] mx-auto">
                <Encabezado
                    antetitulo="Lo que ya logramos"
                    titulo={<TextoQueSeEnciende texto="Lo que el puerto ya le quitó al mar." />}
                    texto="Son la suma de todos los manifiestos registrados en SiMAR en Puerto Peñasco, y se actualizan solas."
                />

                {eqAgua ? (
                    <div className="mt-10 grid gap-5 movil:mt-7 movil:gap-3">
                        {/* La grande: agua protegida */}
                        <div className="ln-enfoca relative overflow-hidden rounded-[40px] bg-simar-marea text-white p-10 md:p-14 movil:rounded-[28px] movil:p-6">
                            {/* El agua que sube al entrar la tarjeta */}
                            <div aria-hidden="true" className="ln-llena absolute inset-x-0 bottom-0 h-[58%]">
                                <svg viewBox="0 0 1200 40" preserveAspectRatio="none" className="absolute inset-x-0 -top-[39px] h-10 w-full">
                                    <path d="M0 20 C150 0 300 0 450 20 C600 40 750 40 900 20 C1050 0 1150 6 1200 14 V40 H0 Z" fill="#FFFFFF" fillOpacity="0.1" />
                                </svg>
                                <div className="h-full bg-white/10" />
                            </div>
                            <div className="relative grid lg:grid-cols-[auto_minmax(0,1fr)] gap-x-10 gap-y-4 items-center">
                                <span className="w-20 h-20 rounded-full bg-white/15 flex items-center justify-center movil:w-14 movil:h-14">
                                    <Waves className="w-10 h-10 movil:w-7 movil:h-7" />
                                </span>
                                <div>
                                    <p className="text-lg font-bold text-white/85 movil:text-[15px]">Agua protegida</p>
                                    <p className="mt-1 flex flex-wrap items-baseline gap-x-4 font-extrabold leading-none">
                                        <NumeroAnimado
                                            valor={eqAgua.valor}
                                            decimales={decimalesEquivalencia(eqAgua.valor)}
                                            duracion={1600}
                                            className="tabular-nums text-[clamp(88px,9vw,140px)] tracking-[-0.04em] movil:text-[60px]"
                                        />
                                        <span className="text-[30px] md:text-[38px] movil:text-[22px]">{esUno(eqAgua.valor) ? eqAgua.nombre[0] : eqAgua.nombre[1]}</span>
                                    </p>
                                    <p className="mt-3 text-xl md:text-[22px] leading-snug max-w-3xl movil:text-[17px]">
                                        {eqAgua.descripcion}, gracias a {cifra(aceite)} litros de aceite usado que llegaron al centro de acopio y no al mar.
                                    </p>
                                </div>
                            </div>
                        </div>

                        {/* Las chicas: en computadora en fila, en celular en lista con el ícono a la izquierda */}
                        {chicas.length > 0 && (
                            <div className={`grid gap-5 movil:gap-3 ${COLUMNAS[chicas.length]}`}>
                                {chicas.map((t, i) => {
                                    const Icono = t.icono;
                                    return (
                                        <div
                                            key={t.etiqueta}
                                            className={`ln-enfoca ${i === 1 ? 'ln-tras-1' : i === 2 ? 'ln-tras-2' : ''} rounded-[28px] bg-simar-superficie border border-simar-borde shadow-simar p-7 movil:rounded-[22px] movil:p-4 movil:grid movil:grid-cols-[48px_minmax(0,1fr)] movil:gap-x-3.5`}
                                        >
                                            <span className={`w-14 h-14 rounded-full flex items-center justify-center movil:w-12 movil:h-12 ${t.tono}`}>
                                                <Icono className="w-7 h-7 movil:w-6 movil:h-6" />
                                            </span>
                                            <div className="mt-4 movil:mt-0">
                                                <p className="text-[17px] font-bold text-simar-texto-2 movil:text-[15px]">{t.etiqueta}</p>
                                                <p className="mt-1 flex flex-wrap items-baseline gap-x-2 font-extrabold leading-tight">
                                                    <NumeroAnimado valor={t.valor} decimales={t.decimales} duracion={1300} className="tabular-nums text-[52px] tracking-[-0.03em] movil:text-[30px]" />
                                                    <span className="text-[22px] movil:text-[18px]">{t.unidad}</span>
                                                </p>
                                                <p className="mt-1.5 text-[17px] leading-snug text-simar-texto movil:text-[15px]">{t.descripcion}</p>
                                                <p className="mt-3 text-[15px] text-simar-texto-2">{t.base}</p>
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ) : (
                    <p className="mt-10 rounded-[28px] bg-simar-superficie border border-simar-borde px-7 py-6 text-xl font-bold movil:mt-7 movil:text-[17px]">
                        Las cifras aparecen aquí en cuanto haya manifiestos registrados.
                    </p>
                )}

                {/* De dónde salen los números */}
                <details id="fuentes" className="group mt-6 rounded-[24px] bg-simar-superficie border border-simar-borde scroll-mt-28 movil:mt-4 movil:rounded-[20px]">
                    <summary className="min-h-[60px] px-6 flex items-center justify-between gap-3 cursor-pointer list-none text-lg font-extrabold movil:min-h-[52px] movil:px-5 movil:text-[17px] [&::-webkit-details-marker]:hidden">
                        ¿De dónde salen estos números?
                        <ChevronDown className="w-6 h-6 flex-shrink-0 transition-transform group-open:rotate-180" />
                    </summary>
                    <ul className="px-6 pb-6 space-y-3 text-[17px] leading-relaxed text-simar-texto-2 list-disc pl-11 movil:px-5 movil:pl-10 movil:text-[15px]">
                        <li>
                            <strong className="text-simar-texto">Agua.</strong> Un litro de aceite usado puede contaminar hasta{' '}
                            {cifra(LITROS_AGUA_POR_LITRO_ACEITE)} litros de agua. Es la cifra que difunden las campañas de reciclaje de
                            aceite, como las de la Agencia de Protección Ambiental de Estados Unidos (EPA). Por eso decimos «puede
                            contaminar hasta». Una alberca olímpica tiene {cifra(LITROS_ALBERCA_OLIMPICA)} litros.
                        </li>
                        <li>
                            <strong className="text-simar-texto">CO₂.</strong> Estimamos {cifra(RECINTO_CO2_POR_LITRO_ACEITE, 1)} kg de CO₂
                            evitado por cada litro de aceite recolectado y {cifra(RECINTO_CO2_POR_KG_BASURON, 1)} kg por cada kilo que se
                            lleva al relleno sanitario. Son factores provisionales, en revisión. Un árbol absorbe unos{' '}
                            {cifra(KG_CO2_POR_ARBOL_ANIO)} kg de CO₂ al año.
                        </li>
                        <li>
                            <strong className="text-simar-texto">Basura.</strong> Un camión recolector carga unos {cifra(KG_CAMION_RECOLECTOR)} kg.
                            Contamos sólo la basura que entregan los barcos: la que el centro de acopio lleva al relleno es la misma, así que
                            no se suma dos veces.
                        </li>
                        <li>
                            <strong className="text-simar-texto">Datos.</strong> Las cantidades salen de los manifiestos de entrega-recepción
                            que se registran en SiMAR en el recinto portuario de Puerto Peñasco.
                        </li>
                    </ul>
                </details>
            </div>
        </section>
    );
}

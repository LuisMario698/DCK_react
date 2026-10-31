'use client';

import { Droplets, FileCheck, Trash2, Waves, type LucideIcon } from 'lucide-react';
import { NumeroAnimado } from '@/components/ui/movimiento';
import { LITROS_AGUA_POR_LITRO_ACEITE } from '@/lib/constants/impacto';
import type { LandingStats } from '@/lib/services/landing_stats';
import { aguaProtegidaL, decimalesEquivalencia, equivalenciaAgua, esUno } from '@/lib/utils/equivalencias';
import { cifra } from './comun';

/**
 * «Impacto, en vivo»: cuatro cifras grandes de los manifiestos registrados (las mismas cuentas que
 * Estadísticas, lib/utils/equivalencias.ts). La basura del basurón no se suma: es la misma de los
 * manifiestos. Sin datos, no se afirma ninguna cifra.
 */
export function CifrasEnVivo({ stats }: { stats: LandingStats | null }) {
    const agua = stats ? aguaProtegidaL(stats.totalAceiteUsado) : 0;
    const alberca = equivalenciaAgua(agua);
    const cifras: { icono: LucideIcon; valor: number; decimales?: number; unidad: string; nombre: string; detalle: string }[] = stats
        ? [
              {
                  icono: Droplets,
                  valor: stats.totalAceiteUsado,
                  unidad: 'L',
                  nombre: 'Aceite usado recuperado',
                  detalle: 'Litros que las embarcaciones entregaron en el puerto en lugar de tirarlos.',
              },
              {
                  icono: Waves,
                  valor: agua / 1_000_000,
                  decimales: agua < 10_000_000 ? 1 : 0,
                  unidad: 'millones de L',
                  nombre: 'Agua que no se contaminó',
                  detalle: alberca
                      ? `Equivale a ${cifra(alberca.valor, decimalesEquivalencia(alberca.valor))} ${alberca.nombre[esUno(alberca.valor) ? 0 : 1]}.`
                      : 'Estimada con el aceite recuperado.',
              },
              {
                  icono: Trash2,
                  valor: stats.totalBasura,
                  unidad: 'kg',
                  nombre: 'Basura que no llegó al mar',
                  detalle: 'Kilos de basura registrados en los manifiestos.',
              },
              {
                  icono: FileCheck,
                  valor: stats.totalManifiestos,
                  unidad: '',
                  nombre: 'Manifiestos digitales',
                  detalle: 'Cada entrega queda registrada, firmada y guardada.',
              },
          ]
        : [];

    return (
        <section id="impacto" className="relative bg-simar-papel px-6 py-24 md:py-36 overflow-clip movil:px-5 movil:py-16">
            <div className="max-w-[1248px] mx-auto">
                <div className="max-w-4xl">
                    <p className="t3-enfoca text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">Impacto, en vivo</p>
                    <h2 className="t3-enfoca mt-3 text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]">
                        Lo que ya no llegó al mar.
                    </h2>
                    <p className="t3-enfoca mt-5 max-w-3xl text-xl md:text-[22px] leading-relaxed text-simar-texto-2 movil:mt-3 movil:text-[17px]">
                        Cifras de los manifiestos registrados en SiMAR. Crecen con cada entrega.
                    </p>
                </div>

                {stats ? (
                    <div className="mt-14 grid sm:grid-cols-2 gap-5 md:gap-6 movil:mt-9 movil:gap-4">
                        {cifras.map((c, i) => {
                            const Icono = c.icono;
                            return (
                                <article
                                    key={c.nombre}
                                    className={`t3-enfoca ${i % 2 ? 't3-enfoca-2' : ''} rounded-[32px] bg-simar-superficie border border-simar-borde shadow-simar p-8 md:p-10 movil:rounded-[24px] movil:p-6`}
                                >
                                    <span className="w-14 h-14 rounded-full bg-simar-marea-suave text-simar-marea-tinta flex items-center justify-center movil:w-12 movil:h-12">
                                        <Icono className="w-7 h-7 movil:w-6 movil:h-6" />
                                    </span>
                                    <p className="mt-6 flex flex-wrap items-baseline gap-x-3 movil:mt-4">
                                        <span className="text-[clamp(52px,6vw,92px)] font-extrabold leading-none tracking-[-0.03em] tabular-nums text-simar-texto movil:text-[46px]">
                                            <NumeroAnimado valor={c.valor} decimales={c.decimales ?? 0} duracion={1600} />
                                        </span>
                                        {c.unidad && <span className="text-2xl md:text-[28px] font-extrabold text-simar-texto-2 movil:text-xl">{c.unidad}</span>}
                                    </p>
                                    <h3 className="mt-4 text-xl md:text-[23px] font-extrabold text-simar-texto movil:text-[19px]">{c.nombre}</h3>
                                    <p className="mt-1.5 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[16px]">{c.detalle}</p>
                                </article>
                            );
                        })}
                    </div>
                ) : (
                    <p className="t3-enfoca mt-12 rounded-[28px] bg-simar-superficie border border-simar-borde shadow-simar p-8 text-xl text-simar-texto-2 movil:p-6 movil:text-[17px]">
                        Las cifras aparecen aquí en cuanto se registran manifiestos en SiMAR.
                    </p>
                )}

                <p className="mt-8 max-w-3xl text-[15px] leading-relaxed text-simar-texto-2">
                    Estimaciones con factores aproximados: 1 L de aceite puede contaminar hasta {cifra(LITROS_AGUA_POR_LITRO_ACEITE)} L de agua (EPA). La basura del basurón no se suma
                    aparte: es la misma que entregaron las embarcaciones.
                </p>
            </div>
        </section>
    );
}

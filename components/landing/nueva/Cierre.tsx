'use client';

import { useRef } from 'react';
import { ArrowRight, PlayCircle } from 'lucide-react';
import { useScroll } from 'motion/react';
import * as m from 'motion/react-m';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { MODO_DEMO } from '@/lib/demo/config';
import { usePrefiereMenosMovimiento } from '@/components/ui/movimiento';
import { OlaSeparador } from '../OlaSeparador';
import { TextoQueSeEnciende, useRango } from './escena';

/**
 * 9 · El cierre. Al llegar, el símbolo de SiMAR se enfoca y gira hasta su lugar (las flechas cierran
 * el ciclo, como el `simar-enfoca-simbolo` de la landing actual) y el mar sube desde abajo. Todo
 * atado al scroll; con "reducir movimiento" todo queda en su lugar desde el principio.
 */
export function Cierre({ rutaDemo, alEntrar }: { rutaDemo: string | null; alEntrar: () => void }) {
    const ref = useRef<HTMLElement>(null);
    const { scrollYProgress: p } = useScroll({ target: ref, offset: ['start end', 'center center'] });
    const simbolo = useRango(p, [0.15, 1], ['rotate(-50deg) scale(0.7)', 'rotate(0deg) scale(1)']);
    const simboloOpacidad = useRango(p, [0.15, 0.7], [0, 1]);
    const mar = useRango(p, [0.3, 1], ['translateY(60%)', 'translateY(0%)']);
    const conDemo = rutaDemo && !MODO_DEMO;
    const reducir = usePrefiereMenosMovimiento();

    return (
        <section ref={ref} className="relative isolate bg-simar-abismo text-white px-6 pt-28 md:pt-40 pb-32 md:pb-44 overflow-clip text-center movil:px-5 movil:pt-20 movil:pb-28">
            <OlaSeparador color="var(--simar-papel)" lado="arriba" />
            {/* El mar que sube (decorativo) */}
            <m.div aria-hidden="true" style={reducir ? undefined : { transform: mar }} className="absolute inset-x-0 bottom-0 h-[42%] -z-10">
                <svg viewBox="0 0 1440 60" preserveAspectRatio="none" className="absolute inset-x-0 -top-[59px] w-full h-[60px]">
                    <path d="M0 30 C180 6 360 6 540 30 C720 54 900 54 1080 30 C1260 6 1380 12 1440 22 V60 H0 Z" fill="#0E4E66" fillOpacity="0.55" />
                </svg>
                <div className="h-full bg-[linear-gradient(180deg,rgba(14,78,102,0.55)_0%,rgba(19,112,138,0.35)_100%)]" />
            </m.div>
            <div className="relative max-w-4xl mx-auto">
                <m.div style={reducir ? undefined : { transform: simbolo, opacity: simboloOpacidad }} className="inline-flex">
                    <LogoSimar variante="simbolo" tamano={88} prioridad={false} />
                </m.div>
                <h2 className="mt-6 text-[clamp(44px,5.4vw,80px)] font-extrabold leading-[1.02] tracking-[-0.035em] movil:mt-4 movil:text-[36px] movil:leading-[1.06] movil:tracking-[-0.02em]">
                    <TextoQueSeEnciende texto="Cada dato cuenta." className="block" />
                    <TextoQueSeEnciende texto="Cada mar lo agradece." className="block text-simar-espuma" />
                </h2>
                <p className="ln-enfoca mt-6 text-xl md:text-[22px] text-simar-franja-texto-2 leading-relaxed movil:mt-4 movil:text-[17px]">
                    Conoce SiMAR por dentro o entra con tu cuenta.
                </p>
                <div className="ln-enfoca mt-10 flex flex-wrap justify-center gap-3 movil:mt-7 movil:flex-col">
                    {conDemo && (
                        <a
                            href={rutaDemo}
                            className="simar-presiona min-h-[60px] px-7 rounded-[20px] bg-simar-espuma text-simar-abismo text-lg md:text-xl font-extrabold inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px]"
                        >
                            <PlayCircle className="w-[22px] h-[22px]" />
                            Probar la demostración
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={alEntrar}
                        className={`simar-presiona min-h-[60px] px-7 rounded-[20px] text-lg md:text-xl font-extrabold inline-flex items-center justify-center gap-2.5 cursor-pointer movil:min-h-[52px] movil:rounded-[17px] movil:text-[17px] ${
                            conDemo ? 'border-2 border-white/80 text-white hover:bg-white/10' : 'bg-simar-espuma text-simar-abismo'
                        }`}
                    >
                        {MODO_DEMO ? 'Probar la demostración' : 'Iniciar sesión'}
                        <ArrowRight className="w-[22px] h-[22px]" strokeWidth={2.4} />
                    </button>
                </div>
            </div>
        </section>
    );
}

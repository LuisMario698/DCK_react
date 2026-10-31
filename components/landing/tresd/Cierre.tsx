'use client';

import Image from 'next/image';
import { ArrowRight, Building2, PlayCircle } from 'lucide-react';
import simbolo from '@/public/assets/simar/simbolo-grande.png';
import { MODO_DEMO } from '@/lib/demo/config';

/** El llamado final: el símbolo, una frase y las tres puertas (entrar, probar, sumarse como empresa) */
export function Cierre({
    textoEntrar,
    rutaDemo,
    alEntrar,
    alRegistrarEmpresa,
}: {
    textoEntrar: string;
    rutaDemo: string | null;
    alEntrar: () => void;
    alRegistrarEmpresa: () => void;
}) {
    return (
        <section aria-labelledby="cierre-titulo" className="relative bg-simar-abismo text-white px-6 py-28 md:py-40 overflow-clip movil:px-5 movil:py-20">
            <div aria-hidden="true" className="t3-cierre-luz pointer-events-none absolute inset-0" />
            <div className="relative max-w-4xl mx-auto text-center">
                <Image src={simbolo} alt="" width={120} height={121} className="t3-enfoca mx-auto w-[96px] h-auto md:w-[120px]" />
                <h2
                    id="cierre-titulo"
                    className="t3-enfoca mt-8 text-[clamp(42px,5.6vw,84px)] font-extrabold leading-[1.02] tracking-[-0.035em] movil:mt-6 movil:text-[34px] movil:leading-[1.08] movil:tracking-[-0.02em]"
                >
                    Cada manifiesto cuenta.
                </h2>
                <p className="t3-enfoca mx-auto mt-5 max-w-[44ch] text-xl md:text-[22px] leading-relaxed text-simar-franja-texto-2 movil:text-[17px]">
                    Entra a SiMAR, pruébalo con datos de ejemplo o suma a tu empresa recolectora.
                </p>
                <div className="t3-enfoca mt-10 flex flex-wrap items-center justify-center gap-3 movil:mt-8 movil:flex-col movil:items-stretch">
                    <button
                        type="button"
                        onClick={alEntrar}
                        className="simar-presiona min-h-[60px] px-8 rounded-full bg-simar-marea hover:bg-simar-marea-hover text-white text-lg font-extrabold inline-flex items-center justify-center gap-2 cursor-pointer transition-colors movil:min-h-[54px] movil:text-[17px]"
                    >
                        {textoEntrar}
                        <ArrowRight className="w-5 h-5" strokeWidth={2.4} />
                    </button>
                    {/* En el despliegue de la demostración, el primer botón ya lleva a la demo */}
                    {rutaDemo && !MODO_DEMO && (
                        <a
                            href={rutaDemo}
                            className="min-h-[60px] px-8 rounded-full bg-white text-simar-abismo text-lg font-extrabold inline-flex items-center justify-center gap-2 hover:bg-white/90 transition-colors movil:min-h-[54px] movil:text-[17px]"
                        >
                            <PlayCircle className="w-5 h-5" />
                            Probar la demo
                        </a>
                    )}
                    <button
                        type="button"
                        onClick={alRegistrarEmpresa}
                        className="min-h-[60px] px-8 rounded-full border-2 border-white/40 text-white text-lg font-bold inline-flex items-center justify-center gap-2 hover:bg-white/10 transition-colors cursor-pointer movil:min-h-[54px] movil:text-[17px]"
                    >
                        <Building2 className="w-5 h-5" />
                        Soy empresa recolectora
                    </button>
                </div>
            </div>
        </section>
    );
}

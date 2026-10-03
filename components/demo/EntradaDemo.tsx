'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Anchor, ArrowRight, Loader2, Recycle, type LucideIcon } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { createClient } from '@/lib/supabase/client';
import { CUENTAS_DEMO, type VistaDemo } from '@/lib/demo/config';
import { guardarRecorrido } from '@/lib/demo/estadoRecorrido';
import { detalleDe } from '@/lib/utils/errores';

const OPCIONES: { vista: VistaDemo; icono: LucideIcon; tono: string; titulo: string; quien: string; texto: string }[] = [
    {
        vista: 'puerto',
        icono: Anchor,
        tono: 'bg-simar-marea-suave text-simar-marea-tinta',
        titulo: 'Como el puerto',
        quien: 'Centro de acopio de Puerto Peñasco',
        texto: 'Registra lo que entregan los barcos, pesa la basura que va al basurón y ve el impacto en el mar.',
    },
    {
        vista: 'empresa',
        icono: Recycle,
        tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        titulo: 'Como empresa recolectora',
        quien: 'Recicladora Mar Bermejo',
        texto: 'Pide al puerto el aceite, el plástico o el cartón que recicla y sigue cada recolección.',
    },
];

export function EntradaDemo({ locale, vistaInicial }: { locale: string; vistaInicial: VistaDemo | null }) {
    const [entrando, setEntrando] = useState<VistaDemo | null>(null);

    const entrar = async (vista: VistaDemo) => {
        setEntrando(vista);
        try {
            const supabase = createClient();
            // Si ya había otra vista abierta (sólo en este equipo: no saca a nadie más)
            await supabase.auth.signOut({ scope: 'local' });
            const { correo, clave, inicio } = CUENTAS_DEMO[vista];
            const { error } = await supabase.auth.signInWithPassword({ email: correo, password: clave });
            if (error) throw error;
            guardarRecorrido({ vista, paso: 0 });
            // Carga completa: el middleware y las pantallas del servidor ya leen la sesión nueva
            window.location.assign(`/${locale}${inicio}`);
        } catch (causa) {
            const { message = '' } = detalleDe(causa);
            console.error('No se pudo entrar a la demostración:', message);
            setEntrando(null);
            // Sin las cuentas de la demo (o con otra contraseña) no es la conexión: que lo arregle el equipo
            const sinCuentas = /invalid login credentials|email not confirmed/i.test(message);
            toast.error(sinCuentas ? 'La demostración todavía no está lista' : 'No pudimos abrir la demostración', {
                description: sinCuentas
                    ? 'Faltan sus cuentas de acceso. Avísale al equipo de SiMAR.'
                    : 'Revisa tu conexión a internet e inténtalo de nuevo.',
            });
        }
    };

    // Con ?vista=… (un código QR) entra sola, una vez
    const yaEntro = useRef(false);
    useEffect(() => {
        if (!vistaInicial || yaEntro.current) return;
        yaEntro.current = true;
        entrar(vistaInicial);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [vistaInicial]);

    return (
        <main className="simar-compacto relative min-h-[100svh] bg-simar-papel px-4 py-10 md:py-14 flex items-center justify-center">
            <FondoSimar />
            <div className="relative w-full max-w-[920px]">
                <div className="simar-aparece flex flex-col items-center text-center">
                    <LogoSimar tamano={64} />
                    <h1 className="mt-7 text-[28px] md:text-[40px] font-extrabold leading-tight text-simar-texto movil:mt-5 movil:text-[26px]">
                        Conoce SiMAR por dentro
                    </h1>
                    <p className="mt-3 max-w-[640px] text-lg md:text-xl leading-relaxed text-simar-texto-2 movil:text-[16px]">
                        Elige cómo quieres verlo. Un recorrido corto te enseña lo principal y después exploras con
                        calma. Son datos de ejemplo: puedes tocar todo y nada se guarda.
                    </p>
                </div>

                <div className="mt-9 grid grid-cols-1 md:grid-cols-2 gap-5 movil:mt-6 movil:gap-3">
                    {OPCIONES.map((o, i) => {
                        const Icono = o.icono;
                        const esta = entrando === o.vista;
                        return (
                            <button
                                key={o.vista}
                                type="button"
                                onClick={() => entrar(o.vista)}
                                disabled={entrando !== null}
                                aria-busy={esta}
                                className="simar-aparece simar-tarjeta-accion group text-left bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-6 md:p-7 flex flex-col gap-4 disabled:cursor-wait movil:p-4 movil:gap-3 movil:rounded-[22px]"
                                style={{ animationDelay: `${0.08 + i * 0.06}s` }}
                            >
                                <div className="flex items-center gap-4 movil:gap-3">
                                    <span className={`w-14 h-14 flex-shrink-0 rounded-full flex items-center justify-center movil:w-11 movil:h-11 ${o.tono}`}>
                                        <Icono className="w-7 h-7 movil:w-6 movil:h-6" />
                                    </span>
                                    <span className="min-w-0">
                                        <span className="block text-[24px] font-extrabold leading-tight text-simar-texto movil:text-[19px]">{o.titulo}</span>
                                        <span className="block mt-0.5 text-[15px] font-bold text-simar-texto-2">{o.quien}</span>
                                    </span>
                                </div>
                                <span className="text-lg leading-relaxed text-simar-texto-2 movil:text-[15px]">{o.texto}</span>
                                <span className="mt-auto inline-flex items-center gap-2 text-[17px] font-bold text-simar-marea-tinta movil:text-[15px]">
                                    {esta ? (
                                        <>
                                            <Loader2 className="w-5 h-5 animate-spin" />
                                            Abriendo la demostración…
                                        </>
                                    ) : (
                                        <>
                                            Empezar el recorrido
                                            <ArrowRight className="w-5 h-5 transition-transform duration-200 group-hover:translate-x-1" />
                                        </>
                                    )}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="simar-aparece mt-8 text-center movil:mt-6" style={{ animationDelay: '0.22s' }}>
                    <Link
                        href={`/${locale}`}
                        className="inline-flex min-h-[48px] items-center px-3 text-[17px] font-bold text-simar-marea-tinta underline-offset-4 hover:underline movil:text-[15px]"
                    >
                        Volver a la página principal
                    </Link>
                </p>
            </div>
        </main>
    );
}

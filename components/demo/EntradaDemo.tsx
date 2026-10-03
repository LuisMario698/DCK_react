'use client';

import { useEffect, useRef, useState } from 'react';
import Link from 'next/link';
import { toast } from 'sonner';
import { Anchor, ArrowRight, Clock, Loader2, Recycle, type LucideIcon } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { FondoSimar } from '@/components/layout/FondoSimar';
import { createClient } from '@/lib/supabase/client';
import { CUENTAS_DEMO, type VistaDemo } from '@/lib/demo/config';
import { guardarRecorrido } from '@/lib/demo/estadoRecorrido';
import { detalleDe } from '@/lib/utils/errores';

const OPCIONES: { vista: VistaDemo; icono: LucideIcon; tono: string; titulo: string; texto: string }[] = [
    {
        vista: 'puerto',
        icono: Anchor,
        tono: 'bg-simar-marea-suave text-simar-marea-tinta',
        titulo: 'Centro de acopio del puerto',
        texto: 'Registra lo que entregan los barcos y ve lo que gana el mar.',
    },
    {
        vista: 'empresa',
        icono: Recycle,
        tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
        titulo: 'Empresa recolectora',
        texto: 'Pide los residuos del puerto para reciclarlos.',
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
        // Pocas cosas y mucho aire: el nombre, la pregunta y dos tarjetas grandes. Lo demás lo cuenta el
        // recorrido. En celular, más aire arriba: el botón de tema flota en la esquina
        <main className="simar-compacto relative min-h-[100svh] bg-simar-papel px-4 py-12 md:py-16 flex items-center justify-center movil:pt-20 movil:pb-10">
            <FondoSimar />
            <div className="relative w-full max-w-[560px]">
                <div className="simar-aparece flex flex-col items-center text-center">
                    <LogoSimar variante="simbolo" tamano={72} />
                    <h1 className="mt-5 text-[34px] md:text-[42px] font-extrabold leading-tight text-simar-texto movil:text-[28px]">
                        Conoce SiMAR
                    </h1>
                    <p className="mt-2 text-lg md:text-xl text-simar-texto-2 movil:text-[16px]">¿Cómo quieres verlo?</p>
                </div>

                <div className="mt-8 flex flex-col gap-4 movil:mt-6 movil:gap-3">
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
                                className="simar-aparece simar-tarjeta-accion group w-full text-left bg-simar-superficie border border-simar-borde shadow-simar rounded-[28px] p-5 md:p-6 flex items-center gap-5 disabled:cursor-wait movil:p-4 movil:gap-4 movil:rounded-[22px]"
                                style={{ animationDelay: `${0.06 + i * 0.06}s` }}
                            >
                                <span className={`w-16 h-16 flex-shrink-0 rounded-full flex items-center justify-center movil:w-14 movil:h-14 ${o.tono}`}>
                                    <Icono className="w-8 h-8 movil:w-7 movil:h-7" />
                                </span>
                                <span className="flex-1 min-w-0">
                                    <span className="block text-[22px] font-extrabold leading-tight text-simar-texto movil:text-[19px]">{o.titulo}</span>
                                    <span className="block mt-1 text-[17px] leading-snug text-simar-texto-2 movil:text-[15px]">
                                        {esta ? 'Abriendo la demostración…' : o.texto}
                                    </span>
                                </span>
                                <span aria-hidden="true" className="w-12 h-12 flex-shrink-0 rounded-full bg-simar-marea text-white flex items-center justify-center group-hover:bg-simar-marea-hover transition-colors movil:w-10 movil:h-10">
                                    {esta ? <Loader2 className="w-5 h-5 animate-spin" /> : <ArrowRight className="w-[22px] h-[22px]" />}
                                </span>
                            </button>
                        );
                    })}
                </div>

                <p className="simar-aparece mt-7 flex items-center justify-center gap-2 text-[15px] text-simar-texto-2 movil:mt-6 movil:text-[14px]" style={{ animationDelay: '0.2s' }}>
                    <Clock aria-hidden="true" className="w-[18px] h-[18px] flex-shrink-0" />
                    Unos 2 minutos · datos de ejemplo · nada se guarda
                </p>
                <p className="simar-aparece mt-2 text-center" style={{ animationDelay: '0.24s' }}>
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

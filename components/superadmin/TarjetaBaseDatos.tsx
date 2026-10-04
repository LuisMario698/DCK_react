'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { Check, Database, ExternalLink } from 'lucide-react';
import { Tarjeta, formatoNumero } from '@/components/superadmin/ui';
import { createClient } from '@/lib/supabase/client';
import { crearClienteDckNavegador } from '@/lib/supabase/dck';
import { DCK_DISPONIBLE, baseDelNavegador, elegirBase, type BaseDatos } from '@/lib/supabase/baseDatos';
import { getResumenBase, type ResumenBase } from '@/lib/services/base_datos';

const OPCIONES: { base: BaseDatos; nombre: string; detalle: string }[] = [
    { base: 'simar', nombre: 'SiMAR', detalle: 'La base de siempre: aquí se captura.' },
    { base: 'dck', nombre: 'DCK (sólo consulta)', detalle: 'La base anterior con los registros de DCK. No se puede cambiar nada.' },
];

const fecha = (iso: string | null) =>
    iso ? `Última captura: ${new Date(iso).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}` : 'Sin manifiestos';

/**
 * Qué base de datos ve este navegador en la landing y el recinto (ver lib/supabase/baseDatos.ts).
 * Es sólo para el superadmin que la elige: a los demás no les cambia nada.
 */
export function TarjetaBaseDatos() {
    const router = useRouter();
    const locale = usePathname().split('/')[1] || 'es';
    // La cookie sólo existe en el navegador: hasta leerla, ninguna opción se marca
    const [base, setBase] = useState<BaseDatos | null>(null);
    const [resumen, setResumen] = useState<Partial<Record<BaseDatos, ResumenBase | 'error'>>>({});

    useEffect(() => {
        // eslint-disable-next-line react-hooks/set-state-in-effect -- la cookie sólo existe en el navegador
        setBase(baseDelNavegador());
        const pedir = (b: BaseDatos, cliente: Parameters<typeof getResumenBase>[0]) =>
            getResumenBase(cliente)
                .then((r) => setResumen((x) => ({ ...x, [b]: r })))
                .catch((e) => {
                    console.error(`Error contando la base ${b}:`, e);
                    setResumen((x) => ({ ...x, [b]: 'error' }));
                });
        pedir('simar', createClient());
        if (DCK_DISPONIBLE) pedir('dck', crearClienteDckNavegador());
    }, []);

    const elegir = (nueva: BaseDatos) => {
        if (nueva === base) return;
        elegirBase(nueva);
        setBase(nueva);
        router.refresh();
        toast.success(nueva === 'dck' ? 'Ahora ves la base de DCK' : 'Volviste a SiMAR', {
            description:
                nueva === 'dck'
                    ? 'La landing y el recinto muestran sus registros, sólo para consultar. Sólo en este navegador.'
                    : 'La landing y el recinto vuelven a los datos de SiMAR.',
        });
    };

    return (
        <Tarjeta titulo="Base de datos que ves" subtitulo="Sólo en este navegador: cambia la landing y el recinto portuario">
            <div className="space-y-4">
                <div role="radiogroup" aria-label="Base de datos" className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {OPCIONES.map((o) => {
                        const disponible = o.base === 'simar' || DCK_DISPONIBLE;
                        const activa = base === o.base;
                        const r = resumen[o.base];
                        return (
                            <button
                                key={o.base}
                                type="button"
                                role="radio"
                                aria-checked={activa}
                                disabled={!disponible || base === null}
                                onClick={() => elegir(o.base)}
                                className={`simar-presiona text-left rounded-2xl border-2 p-4 transition-colors disabled:opacity-60 disabled:cursor-not-allowed ${
                                    activa ? 'border-simar-violeta bg-simar-violeta-suave' : 'border-simar-borde bg-simar-superficie hover:border-simar-violeta'
                                }`}
                            >
                                <span className="flex items-center gap-2.5">
                                    <span className={`w-9 h-9 flex-shrink-0 rounded-full flex items-center justify-center ${activa ? 'bg-simar-violeta text-white' : 'bg-simar-papel text-simar-texto-2'}`}>
                                        {activa ? <Check className="w-5 h-5" strokeWidth={2.6} /> : <Database className="w-[18px] h-[18px]" />}
                                    </span>
                                    <span className="text-lg font-extrabold text-simar-texto">{o.nombre}</span>
                                </span>
                                <span className="mt-2 block text-[15px] leading-snug text-simar-texto-2">{o.detalle}</span>
                                <span className="mt-2 block text-[15px] leading-snug text-simar-texto">
                                    {!disponible
                                        ? 'Falta configurar NEXT_PUBLIC_SB_DCK_URL y SB_DCK_ANON_KEY.'
                                        : r === 'error'
                                          ? 'No se pudo leer esta base.'
                                          : r
                                            ? `${formatoNumero(r.manifiestos)} manifiestos · ${formatoNumero(r.personas)} personas · ${formatoNumero(r.embarcaciones)} embarcaciones`
                                            : 'Contando…'}
                                </span>
                                {r && r !== 'error' && <span className="block text-[15px] text-simar-texto-2">{fecha(r.ultimaCaptura)}</span>}
                            </button>
                        );
                    })}
                </div>
                {base === 'dck' && (
                    <div className="flex flex-wrap gap-2">
                        <Link
                            href={`/${locale}/dashboard`}
                            className="inline-flex items-center gap-1.5 min-h-[48px] px-4 rounded-2xl bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-bold"
                        >
                            Ver el recinto
                        </Link>
                        <Link
                            href={`/${locale}`}
                            className="inline-flex items-center gap-1.5 min-h-[48px] px-4 rounded-2xl border-2 border-simar-campo-borde bg-simar-superficie text-simar-texto text-[17px] font-bold hover:border-simar-marea-tinta"
                        >
                            Ver la landing <ExternalLink className="w-4 h-4" />
                        </Link>
                    </div>
                )}
            </div>
        </Tarjeta>
    );
}

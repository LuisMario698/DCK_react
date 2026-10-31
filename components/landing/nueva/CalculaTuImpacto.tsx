'use client';

import { useState, type CSSProperties } from 'react';
import { toast } from 'sonner';
import { Building2, Link2, Minus, Plus, Share2, Ship, Users, type LucideIcon } from 'lucide-react';
import { aguaProtegidaL, co2EvitadoKg, decimalesEquivalencia, equivalenciaAgua, equivalenciaCO2, esUno } from '@/lib/utils/equivalencias';
import { Encabezado, cifra } from './comunes';

const MINIMO = 30;
const MAXIMO = 2000;
const PASO = 10;

const nombreDe = (valor: number, nombre: [string, string]) => (esUno(valor) ? nombre[0] : nombre[1]);

/** El enlace a esta sección, para compartir (sin la consulta: ?landing=nueva se quita al decidir) */
const enlace = () => `${window.location.origin}${window.location.pathname}#calcula`;

/**
 * 8 · Calcula tu impacto y tú también cuentas. Pasa de la conciencia a la acción: un deslizador con
 * los litros de aceite al año y la respuesta en agua y árboles, con las mismas cuentas de
 * Estadísticas (lib/utils/equivalencias.ts). Debajo, qué le toca a cada quien. `alRegistrarEmpresa`
 * abre la ventana de acceso en "Empresa Recolectora".
 */
export function CalculaTuImpacto({ alRegistrarEmpresa }: { alRegistrarEmpresa: () => void }) {
    const [litros, setLitros] = useState(200);
    const agua = equivalenciaAgua(aguaProtegidaL(litros));
    const aire = equivalenciaCO2(co2EvitadoKg(litros, 0));
    const lleno = ((litros - MINIMO) / (MAXIMO - MINIMO)) * 100;

    const texto = agua
        ? `Si entrego ${cifra(litros)} L de aceite usado en el centro de acopio, protejo hasta ${cifra(agua.valor, decimalesEquivalencia(agua.valor))} ${nombreDe(agua.valor, agua.nombre)} de agua. Calcula el tuyo en SiMAR:`
        : 'Calcula cuánta agua proteges al entregar tu aceite usado en SiMAR:';

    const compartir = async () => {
        const url = enlace();
        if (navigator.share) {
            try {
                await navigator.share({ title: 'SiMAR · Calcula tu impacto', text: texto, url });
            } catch {
                // La persona cerró el menú de compartir: no es un error
            }
            return;
        }
        window.open(`https://wa.me/?text=${encodeURIComponent(`${texto} ${url}`)}`, '_blank', 'noopener');
    };
    const copiar = async () => {
        try {
            await navigator.clipboard.writeText(`${texto} ${enlace()}`);
            toast.success('Enlace copiado');
        } catch {
            toast.error('No se pudo copiar el enlace');
        }
    };

    const cambiar = (n: number) => setLitros(Math.min(MAXIMO, Math.max(MINIMO, n)));

    return (
        <section id="calcula" className="relative bg-simar-papel px-6 py-20 md:py-28 movil:px-5 movil:py-14">
            <div className="max-w-[1248px] mx-auto">
                <div className="grid lg:grid-cols-2 gap-6 items-stretch movil:gap-4">
                    {/* La pregunta */}
                    <div className="ln-sube rounded-[36px] bg-simar-superficie border border-simar-borde shadow-simar p-10 md:p-12 movil:rounded-[26px] movil:p-6">
                        <p className="text-lg font-bold text-simar-marea-tinta movil:text-[15px]">Calcula tu impacto</p>
                        <h2 className="mt-3 text-[34px] md:text-[44px] font-extrabold leading-[1.1] movil:mt-2 movil:text-[26px]">
                            ¿Cuántos litros de aceite cambia tu motor al año?
                        </h2>
                        <label htmlFor="ln-litros" className="mt-8 block text-[17px] font-bold text-simar-texto-2 movil:mt-6 movil:text-[15px]">
                            Litros de aceite usado al año
                        </label>
                        <div className="mt-2 flex items-center gap-4 movil:gap-3">
                            <button
                                type="button"
                                onClick={() => cambiar(litros - PASO)}
                                aria-label="Menos litros"
                                className="simar-presiona w-[52px] h-[52px] flex-shrink-0 rounded-2xl border-2 border-simar-campo-borde text-simar-texto flex items-center justify-center hover:bg-simar-texto/5 movil:w-11 movil:h-11"
                            >
                                <Minus className="w-6 h-6" />
                            </button>
                            <output htmlFor="ln-litros" className="flex-1 text-center font-extrabold leading-none">
                                <span className="text-[56px] tracking-[-0.02em] movil:text-[44px]">{cifra(litros)}</span>
                                <span className="ml-2 text-[24px] movil:text-[20px]">litros</span>
                            </output>
                            <button
                                type="button"
                                onClick={() => cambiar(litros + PASO)}
                                aria-label="Más litros"
                                className="simar-presiona w-[52px] h-[52px] flex-shrink-0 rounded-2xl border-2 border-simar-campo-borde text-simar-texto flex items-center justify-center hover:bg-simar-texto/5 movil:w-11 movil:h-11"
                            >
                                <Plus className="w-6 h-6" />
                            </button>
                        </div>
                        <input
                            id="ln-litros"
                            type="range"
                            min={MINIMO}
                            max={MAXIMO}
                            step={PASO}
                            value={litros}
                            onChange={(e) => setLitros(Number(e.target.value))}
                            aria-valuetext={`${cifra(litros)} litros al año`}
                            className="ln-deslizador mt-5"
                            style={{ '--ln-lleno': `${lleno}%` } as CSSProperties}
                        />
                        <div className="mt-1 flex justify-between text-[15px] text-simar-texto-2">
                            <span>{cifra(MINIMO)} L</span>
                            <span>{cifra(MAXIMO)} L</span>
                        </div>
                        <p className="mt-6 text-[17px] leading-relaxed text-simar-texto-2 movil:mt-5 movil:text-[15px]">
                            Si tienes varias embarcaciones, súmalas. Las cuentas son las mismas de las cifras del puerto.
                        </p>
                    </div>

                    {/* La respuesta */}
                    <div className="ln-sube relative overflow-hidden rounded-[36px] bg-simar-abismo text-white p-10 md:p-12 flex flex-col movil:rounded-[26px] movil:p-6" aria-live="polite">
                        <p className="text-lg font-bold text-simar-espuma movil:text-[15px]">Si los entregas en el centro de acopio, proteges hasta</p>
                        {agua && (
                            <p className="mt-3 font-extrabold leading-none">
                                <span className="text-[72px] md:text-[88px] tracking-[-0.03em] text-simar-aceite movil:text-[56px]">
                                    {cifra(agua.valor, decimalesEquivalencia(agua.valor))}
                                </span>
                                <span className="block mt-2 text-[28px] md:text-[32px] movil:text-[22px]">{nombreDe(agua.valor, agua.nombre)} de agua</span>
                            </p>
                        )}
                        <p className="mt-4 text-xl leading-snug text-simar-franja-texto-2 movil:text-[17px]">
                            Son {cifra(aguaProtegidaL(litros))} litros que no se contaminan.
                        </p>
                        {aire && (
                            <p className="mt-6 pt-6 border-t border-white/15 text-xl leading-snug movil:mt-5 movil:pt-5 movil:text-[17px]">
                                Y se evitan unos {cifra(co2EvitadoKg(litros, 0))} kg de CO₂:{' '}
                                {aire.nombre[0] === 'árbol' ? (
                                    <>
                                        lo que absorben{' '}
                                        <strong className="text-simar-espuma">
                                            {cifra(aire.valor, decimalesEquivalencia(aire.valor))} {nombreDe(aire.valor, aire.nombre)}
                                        </strong>{' '}
                                        en un año.
                                    </>
                                ) : (
                                    <>
                                        lo que echa un auto en{' '}
                                        <strong className="text-simar-espuma">{cifra(aire.valor)} km</strong>.
                                    </>
                                )}
                            </p>
                        )}
                        <div className="mt-auto pt-8 flex flex-wrap gap-3 movil:pt-6 movil:flex-col">
                            <button
                                type="button"
                                onClick={compartir}
                                className="simar-presiona min-h-[56px] px-6 rounded-[18px] bg-simar-espuma text-simar-abismo text-lg font-extrabold inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:text-[17px]"
                            >
                                <Share2 className="w-[22px] h-[22px]" />
                                Compartir
                            </button>
                            <button
                                type="button"
                                onClick={copiar}
                                className="simar-presiona min-h-[56px] px-6 rounded-[18px] border-2 border-white/70 text-white text-lg font-bold hover:bg-white/10 inline-flex items-center justify-center gap-2.5 movil:min-h-[52px] movil:text-[17px]"
                            >
                                <Link2 className="w-[22px] h-[22px]" />
                                Copiar enlace
                            </button>
                        </div>
                    </div>
                </div>

                {/* Tú también cuentas */}
                <Encabezado
                    className="mt-20 movil:mt-14"
                    antetitulo="Tú también cuentas"
                    titulo="Cada quien tiene algo que hacer."
                />
                <div className="mt-8 grid md:grid-cols-3 gap-5 movil:mt-6 movil:gap-3">
                    {(
                        [
                            {
                                icono: Ship,
                                titulo: 'Si tienes una embarcación',
                                texto: 'Entrega tu aceite usado, tus filtros y tu basura en el centro de acopio del recinto portuario. Queda registrado en tu manifiesto.',
                                tono: 'bg-simar-marea-suave text-simar-marea-tinta',
                            },
                            {
                                icono: Building2,
                                titulo: 'Si eres una empresa recolectora',
                                texto: 'Crea tu cuenta, mira los residuos disponibles en el puerto y solicita recolectarlos desde tu portal.',
                                tono: 'bg-simar-arrecife-suave text-simar-arrecife-tinta',
                                accion: { texto: 'Registrar mi empresa', alPulsar: alRegistrarEmpresa },
                            },
                            {
                                icono: Users,
                                titulo: 'Si vives aquí o nos visitas',
                                texto: 'Nunca tires aceite al drenaje ni a la arena: guárdalo en una botella cerrada y llévalo a un centro de acopio. Recoge tu basura en la playa y comparte esta página.',
                                tono: 'bg-simar-coral-suave text-simar-coral',
                            },
                        ] as { icono: LucideIcon; titulo: string; texto: string; tono: string; accion?: { texto: string; alPulsar: () => void } }[]
                    ).map((t) => {
                        const Icono = t.icono;
                        return (
                            <div key={t.titulo} className="ln-sube rounded-[28px] bg-simar-superficie border border-simar-borde shadow-simar p-7 flex flex-col movil:rounded-[22px] movil:p-5">
                                <span className={`w-14 h-14 rounded-full flex items-center justify-center movil:w-12 movil:h-12 ${t.tono}`}>
                                    <Icono className="w-7 h-7 movil:w-6 movil:h-6" />
                                </span>
                                <h3 className="mt-4 text-[22px] font-extrabold leading-tight movil:mt-3 movil:text-[19px]">{t.titulo}</h3>
                                <p className="mt-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[15px]">{t.texto}</p>
                                {t.accion && (
                                    <button
                                        type="button"
                                        onClick={t.accion.alPulsar}
                                        className="simar-presiona mt-5 self-start min-h-[52px] px-5 rounded-[16px] bg-simar-marea hover:bg-simar-marea-hover text-white text-[17px] font-extrabold movil:min-h-[48px] movil:w-full"
                                    >
                                        {t.accion.texto}
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            </div>
        </section>
    );
}

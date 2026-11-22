'use client';

import { useId, useRef, useState, type FormEvent } from 'react';
import Link from 'next/link';
import { ArrowRight, Check, Mail } from 'lucide-react';
import { LogoSimar } from '@/components/layout/LogoSimar';

/**
 * El correo del mes (landing Actual, al pie de «Noticias del Mar»): un bloque para pedir el
 * resumen mensual y, a un lado, cómo se verá ese correo (la edición de este mes al frente y las
 * anteriores detrás, que se abren al entrar a la pantalla).
 *
 * Por ahora es SÓLO DISEÑO: el formulario valida y responde en pantalla, pero el correo no se guarda
 * ni sale de esta página (ni base de datos ni almacenamiento del navegador). Por eso el aviso de
 * «listo» dice la verdad: el envío todavía no empieza. Cuando exista la tabla de suscriptores, se
 * cambia `enviar` y el texto del aviso. Ver DISEÑO_SIMAR.md §8.7.
 */

export interface DatosCorreo {
    /** «Noviembre de 2026» */
    mes: string;
    /** Las dos ediciones anteriores: «Octubre», «Septiembre» */
    anteriores: string[];
    /** Cuándo sale el próximo (el primer lunes del mes que sigue): «lun 7 dic» */
    proximo: string;
    asunto: string;
    titulares: { titulo: string; categoria: string }[];
    /** Ya con formato; vacío si no hay cifras */
    cifras: { valor: string; texto: string }[];
}

const CORREO_VALIDO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function CorreoMensual({ datos, href }: { datos: DatosCorreo; href: string }) {
    const id = useId();
    const [correo, setCorreo] = useState('');
    const [estado, setEstado] = useState<'escribiendo' | 'error' | 'listo'>('escribiendo');
    const confirmacion = useRef<HTMLDivElement>(null);

    const enviar = (e: FormEvent) => {
        e.preventDefault();
        if (!CORREO_VALIDO.test(correo.trim())) {
            setEstado('error');
            return;
        }
        // Sólo diseño: el correo no se guarda en ningún lado (ver arriba)
        setCorreo('');
        setEstado('listo');
        // Quien usa lector de pantalla o teclado llega directo al aviso
        requestAnimationFrame(() => confirmacion.current?.focus());
    };

    return (
        <section aria-labelledby={`${id}-titulo`} className="mt-20 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_minmax(0,500px)] gap-x-16 gap-y-14 items-center movil:mt-14">
            <div className="reveal">
                <p className="inline-flex flex-wrap items-center gap-x-3 gap-y-2 text-[15px] font-extrabold uppercase tracking-[0.14em] text-simar-espuma">
                    <span className="inline-flex items-center gap-2">
                        <Mail aria-hidden="true" className="w-[18px] h-[18px]" strokeWidth={2.2} />
                        El correo del mes
                    </span>
                    <span className="rounded-full ring-1 ring-simar-espuma/50 px-2.5 py-0.5 text-[13px] tracking-[0.08em]">Muy pronto</span>
                </p>
                <h3 id={`${id}-titulo`} className="mt-4 font-titular text-[clamp(36px,3.8vw,54px)] font-semibold leading-[1.03] tracking-[-0.022em] text-balance movil:text-[34px]">
                    El mar, una vez al mes, en tu correo.
                </h3>
                <p className="mt-4 max-w-[44ch] text-[19px] leading-relaxed text-white/80 text-pretty movil:text-[18px]">
                    Lo nuevo de Noticias del Mar y lo que SiMAR evitó que llegara al Golfo. Corto, el primer lunes de cada mes.
                </p>

                {estado === 'listo' ? (
                    <div
                        ref={confirmacion}
                        tabIndex={-1}
                        role="status"
                        className="correo-listo mt-8 max-w-[560px] rounded-[22px] bg-white/[0.07] ring-1 ring-white/15 p-6 outline-none focus-visible:ring-2 focus-visible:ring-simar-espuma movil:p-5"
                    >
                        <p className="flex items-center gap-3 text-[20px] font-extrabold">
                            <span aria-hidden="true" className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-espuma text-[#0B2236] flex items-center justify-center">
                                <Check className="w-5 h-5" strokeWidth={3} />
                            </span>
                            ¡Gracias por tu interés!
                        </p>
                        <p className="mt-3 text-[18px] leading-relaxed text-white/80">
                            El correo del mes todavía no sale: lo estrenamos pronto. Mientras tanto, lo nuevo siempre está en Noticias del Mar.
                        </p>
                        <div className="mt-5 flex flex-wrap gap-3">
                            <Link
                                href={href}
                                data-vidrio="claro"
                                className="simar-presiona min-h-[54px] pl-6 pr-2 rounded-full inline-flex items-center gap-3 bg-simar-espuma text-[#0B2236] text-[17px] font-extrabold"
                            >
                                Ir a Noticias del Mar
                                <span className="w-9 h-9 rounded-full bg-[#0B2236] text-simar-espuma flex items-center justify-center">
                                    <ArrowRight aria-hidden="true" className="w-[18px] h-[18px]" strokeWidth={2.4} />
                                </span>
                            </Link>
                            <button
                                type="button"
                                onClick={() => setEstado('escribiendo')}
                                className="min-h-[54px] px-5 rounded-full text-[17px] font-bold text-white/85 ring-1 ring-white/25 hover:bg-white/[0.06] transition-colors"
                            >
                                Escribir otro correo
                            </button>
                        </div>
                    </div>
                ) : (
                    <form onSubmit={enviar} noValidate className="mt-8 max-w-[560px]">
                        <label htmlFor={`${id}-correo`} className="block text-[17px] font-bold">
                            Tu correo
                        </label>
                        <div className="mt-2 flex gap-3 flex-col sm:flex-row lg:flex-col xl:flex-row">
                            <input
                                id={`${id}-correo`}
                                type="email"
                                inputMode="email"
                                autoComplete="email"
                                spellCheck={false}
                                required
                                value={correo}
                                onChange={(e) => {
                                    setCorreo(e.target.value);
                                    if (estado === 'error') setEstado('escribiendo');
                                }}
                                placeholder="nombre@correo.com"
                                aria-invalid={estado === 'error'}
                                aria-describedby={`${id}-nota`}
                                className={`min-h-[60px] flex-1 min-w-0 rounded-[18px] bg-white/[0.08] px-5 text-[18px] text-white placeholder:text-white/45 outline-none ring-1 transition-shadow focus-visible:ring-2 ${estado === 'error' ? 'ring-2 ring-simar-coral-solido focus-visible:ring-simar-coral-solido' : 'ring-white/25 focus-visible:ring-simar-espuma'}`}
                            />
                            <button
                                type="submit"
                                data-vidrio="claro"
                                className="simar-presiona group min-h-[60px] pl-7 pr-2.5 rounded-[18px] bg-simar-espuma text-[#0B2236] text-[18px] font-extrabold inline-flex items-center justify-center gap-3 whitespace-nowrap"
                            >
                                Quiero recibirlo
                                <span className="w-10 h-10 rounded-[13px] bg-[#0B2236] text-simar-espuma flex items-center justify-center transition-transform duration-300 ease-[cubic-bezier(0.22,1,0.36,1)] group-hover:translate-x-0.5">
                                    <ArrowRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                                </span>
                            </button>
                        </div>
                        <p id={`${id}-nota`} aria-live="polite" className={`mt-3 flex items-start gap-2.5 text-[17px] ${estado === 'error' ? 'font-bold text-white' : 'text-white/65'}`}>
                            {estado === 'error' && (
                                <span aria-hidden="true" className="mt-0.5 w-6 h-6 flex-shrink-0 rounded-full bg-simar-coral-solido text-white text-[15px] font-extrabold flex items-center justify-center">
                                    !
                                </span>
                            )}
                            {estado === 'error' ? 'Revisa tu correo: parece que le falta algo (por ejemplo, la @).' : 'Un correo al mes. Sin publicidad. Te das de baja cuando quieras.'}
                        </p>
                    </form>
                )}
            </div>

            <PreviaCorreo datos={datos} />
        </section>
    );
}

/** Cómo se verá el correo: la edición de este mes al frente y las dos anteriores detrás */
function PreviaCorreo({ datos }: { datos: DatosCorreo }) {
    return (
        <div aria-hidden="true" className="correo-previa relative mx-auto w-full max-w-[500px] pt-14 pl-10 movil:max-w-[400px] movil:pl-9 movil:pt-10">
            {datos.anteriores.map((mes, i) => (
                <div
                    key={mes}
                    className={`correo-hoja correo-hoja-${i + 2} absolute inset-0 top-14 left-10 rounded-[22px] bg-simar-papel ring-1 ring-black/5 dark:bg-simar-superficie movil:left-9 movil:top-10`}
                    style={{ opacity: i === 0 ? 0.62 : 0.36 }}
                >
                    <span className={`absolute top-2.5 text-[13px] font-extrabold uppercase tracking-[0.14em] text-simar-texto-2 ${i === 0 ? 'right-6' : 'left-6'}`}>{mes}</span>
                </div>
            ))}

            <div className="correo-frente relative overflow-clip rounded-[22px] bg-simar-papel text-simar-texto ring-1 ring-black/5 shadow-[0_44px_80px_-40px_rgba(0,0,0,0.85)] dark:bg-simar-superficie dark:ring-white/10">
                {/* Como en la bandeja de entrada: quién lo manda, cuándo y el asunto */}
                <div className="px-6 pt-5 pb-4 border-b border-simar-borde movil:px-5">
                    <div className="flex items-center gap-3">
                        <span className="w-10 h-10 flex-shrink-0 rounded-full bg-simar-superficie ring-1 ring-simar-borde flex items-center justify-center dark:bg-simar-papel">
                            <LogoSimar variante="simbolo" tamano={26} prioridad={false} />
                        </span>
                        <div className="min-w-0">
                            <p className="text-[15px] font-extrabold leading-tight">Noticias del Mar · SiMAR</p>
                            <p className="text-[14px] text-simar-texto-2 leading-tight">Para: ti</p>
                        </div>
                        <span className="ml-auto text-[14px] font-semibold text-simar-texto-2 whitespace-nowrap">{datos.proximo}</span>
                    </div>
                    <p className="mt-3 text-[17px] font-extrabold leading-snug text-pretty">{datos.asunto}</p>
                </div>

                {/* El boletín, con la cabecera de la hoja de Noticias */}
                <div className="px-6 pt-4 pb-6 movil:px-5">
                    <div className="border-t-2 border-simar-texto pt-2 flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                        <span className="font-titular text-[28px] font-semibold tracking-[-0.02em] leading-tight whitespace-nowrap movil:text-[23px]">
                            Noticias <i className="font-normal">del</i> Mar
                        </span>
                        <span className="text-[12px] font-extrabold uppercase tracking-[0.14em] text-simar-texto-2 whitespace-nowrap">{datos.mes}</span>
                    </div>
                    <div className="mt-2 border-t border-simar-texto/60" />

                    {datos.cifras.length > 0 && (
                        <div className="mt-4 grid grid-cols-2 gap-4">
                            {datos.cifras.map((c) => (
                                <div key={c.texto}>
                                    <p className={`font-titular font-semibold leading-none tracking-[-0.02em] tabular-nums ${c.valor.length > 9 ? 'text-[24px]' : 'text-[30px]'}`}>{c.valor}</p>
                                    <p className="mt-1.5 text-[14px] leading-snug text-simar-texto-2">{c.texto}</p>
                                </div>
                            ))}
                        </div>
                    )}

                    <ol className="mt-4 divide-y divide-simar-borde border-t border-simar-borde">
                        {datos.titulares.map((t, i) => (
                            <li key={t.titulo} className="py-2.5 flex gap-3">
                                <span className="w-5 flex-shrink-0 font-titular text-[20px] italic leading-none text-simar-texto-3 pt-0.5">{i + 1}</span>
                                <span className="min-w-0">
                                    <span className="block text-[12px] font-extrabold uppercase tracking-[0.12em] text-simar-marea-tinta">{t.categoria}</span>
                                    <span className="block font-titular text-[18px] leading-snug text-pretty">{t.titulo}</span>
                                </span>
                            </li>
                        ))}
                    </ol>

                    <span className="mt-4 inline-flex items-center gap-2 rounded-full bg-simar-texto text-simar-papel px-5 py-2.5 text-[15px] font-extrabold">
                        Leer todo en SiMAR
                        <ArrowRight className="w-4 h-4" strokeWidth={2.4} />
                    </span>
                </div>
            </div>
        </div>
    );
}

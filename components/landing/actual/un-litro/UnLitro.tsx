'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ArrowUpRight, BadgeCheck, FlaskConical, Funnel, type LucideIcon } from 'lucide-react';
import type { LandingStats } from '@/lib/services/landing_stats';
import { FOTOS, textoCredito, type FotoNoticia } from '@/lib/constants/fotos';
import { MODO_DEMO } from '@/lib/demo/config';
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
import { IlustracionLitro } from './IlustracionLitro';
import { IconoTarjeta, tipoDeUnidad, type TipoIcono } from './IconosTarjeta';
import { ComoSeCalculan } from './ComoSeCalculan';
import './un-litro.css';

/** Una cifra como se lee: 1 decimal sólo en cantidades chicas con fracción (decimalesEquivalencia) */
const cifra = (v: number) => {
    const d = decimalesEquivalencia(v);
    return v.toLocaleString('es-MX', { minimumFractionDigits: d, maximumFractionDigits: d });
};
const nombreDe = (e: Equivalencia) => e.nombre[esUno(e.valor) ? 0 : 1];

// Las tres fotos de la escena, de abajo hacia arriba
const CAPAS: { foto: FotoNoticia; posicion: string }[] = [
    { foto: FOTOS.aceiteDeMotor, posicion: '50% 45%' },
    { foto: FOTOS.gotaEnElAgua, posicion: '50% 55%' },
    { foto: FOTOS.olaMarAbierto, posicion: '50% 50%' },
];

interface Tarjeta {
    clave: string;
    /** El ícono propio; si la unidad no tiene uno, el de lucide que trae la equivalencia */
    tipo: TipoIcono | null;
    Icono: LucideIcon;
    valor: string;
    nombre: string;
    detalle: string;
    tono: 'marea' | 'arrecife';
    estimado?: boolean;
}

/**
 * Un litro (#impacto): por qué importa el aceite usado. Una escena fija que se recorre con el scroll
 * (fotos que se funden, el dibujo de la botella al cubo de 10 m y una frase por pantalla) y, con
 * datos, la franja «Lo que ya no está en el mar» y la ventana de los factores.
 * Sin datos (stats null o 0 manifiestos) sólo quedan los pasos 1 y 2 y la frase de referencia.
 * Sin soporte de animation-timeline, con «reducir movimiento» o con menos de 560 px de alto: los
 * pasos van uno debajo de otro y el dibujo se queda en el cubo lleno.
 * Todo es CSS y SVG en línea (sin WebGL ni JS por cuadro): el dibujo no espera nada para verse.
 */
export function UnLitro({ stats, cifrasAl }: { stats: LandingStats | null; cifrasAl: string }) {
    const { locale } = useParams<{ locale: string }>();
    const hayDatos = stats !== null && stats.totalManifiestos > 0;
    const aceite = hayDatos ? stats.totalAceiteUsado : 0;
    const conAceite = aceite > 0;

    const agua = conAceite ? equivalenciaAgua(aguaProtegidaL(aceite)) : null;
    const basura = hayDatos ? equivalenciaBasura(stats.totalBasura) : null;
    const filtros = hayDatos ? stats.filtrosAceite + stats.filtrosDiesel + stats.filtrosAire : 0;
    // El CO₂ suma el aceite y lo del relleno; la basura de los barcos nunca se suma al Basurón
    const co2 = hayDatos ? equivalenciaCO2(co2EvitadoKg(stats.totalAceiteUsado, stats.totalBasuron)) : null;

    const tarjetas: Tarjeta[] = [];
    if (basura)
        tarjetas.push({ clave: 'basura', tipo: tipoDeUnidad(basura.nombre[0]), Icono: basura.icono, valor: cifra(basura.valor), nombre: nombreDe(basura), detalle: basura.descripcion, tono: 'marea' });
    if (filtros > 0)
        tarjetas.push({
            clave: 'filtros',
            tipo: 'filtro',
            Icono: Funnel,
            valor: filtros.toLocaleString('es-MX'),
            nombre: filtros === 1 ? 'filtro de motor' : 'filtros de motor',
            detalle: 'usados, entregados en el centro de acopio',
            tono: 'marea',
        });
    if (co2)
        tarjetas.push({ clave: 'co2', tipo: tipoDeUnidad(co2.nombre[0]), Icono: co2.icono, valor: cifra(co2.valor), nombre: nombreDe(co2), detalle: co2.descripcion, tono: 'arrecife', estimado: true });

    const pasos = conAceite ? 4 : 3;

    return (
        <section id="impacto" aria-labelledby="ul-titulo" className="ul-seccion relative bg-simar-papel overflow-clip">
            {/* Alias de los enlaces viejos (Conciencia Azul y Equivalencias viven aquí ahora) */}
            <span id="conciencia" className="ul-ancla" aria-hidden="true" />
            <span id="equivalencias" className="ul-ancla" aria-hidden="true" />
            <h2 id="ul-titulo" className="sr-only">
                Lo que vale un litro de aceite
            </h2>

            <div className="ul-pista" data-pasos={pasos}>
                <div className="ul-escenario bg-simar-abismo text-white">
                    {/* Las fotos, una encima de otra: se funden (y en escritorio se acercan) con el scroll.
                        Van detrás de un velo: calidad 60 y carga diferida (están lejos del inicio); el
                        fondo Abismo cubre mientras llegan, así nunca se ve un hueco blanco */}
                    <div className="ul-fotos" aria-hidden="true">
                        {CAPAS.map(({ foto, posicion }, i) => (
                            <div key={foto.src} className={`ul-capa ul-capa-${i + 1}`}>
                                <Image
                                    src={foto.src}
                                    alt=""
                                    fill
                                    sizes="100vw"
                                    quality={60}
                                    loading="lazy"
                                    className="object-cover"
                                    style={{ objectPosition: posicion }}
                                />
                            </div>
                        ))}
                        <div className="ul-velo" />
                    </div>

                    <div className="ul-contenido">
                        <div className="ul-texto">
                            <p className="ul-antetitulo text-[17px] font-bold tracking-[0.01em] text-simar-espuma">Por qué importa</p>

                            <div className="ul-frases">
                                <div className="ul-paso ul-paso-1">
                                    <p className="ul-frase font-titular font-semibold">Un litro de aceite usado…</p>
                                </div>

                                <div className="ul-paso ul-paso-2">
                                    <p className="ul-frase font-titular font-semibold">…puede contaminar un millón de litros de agua.</p>
                                    <p className="mt-5 max-w-[34ch] text-[19px] leading-relaxed text-simar-franja-texto-2 text-pretty movil:mt-3.5 movil:text-[17px]">
                                        Es un cubo de agua de 10 metros por lado. Estimación de la EPA.
                                    </p>
                                    <Link
                                        href={`/${locale ?? 'es'}/noticias/un-litro-de-aceite-un-millon-de-litros-de-agua`}
                                        className="ul-enlace mt-4 min-h-[52px] -ml-1 px-1 inline-flex items-center gap-2 text-[18px] font-bold text-simar-espuma underline decoration-simar-espuma/40 underline-offset-[6px] hover:decoration-simar-espuma transition-colors movil:mt-2 movil:min-h-[48px] movil:text-[17px]"
                                    >
                                        De dónde sale la cifra
                                        <ArrowUpRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                                    </Link>
                                </div>

                                {conAceite ? (
                                    <div className="ul-paso ul-paso-3">
                                        <p className="text-[24px] font-semibold font-titular leading-snug movil:text-[21px]">En Puerto Peñasco ya se entregaron</p>
                                        <p className="ul-cifra mt-2 font-extrabold tabular-nums text-simar-aceite">
                                            {cifra(aceite)}
                                            <span className="ul-cifra-unidad"> {esUno(aceite) ? 'litro' : 'litros'}</span>
                                        </p>
                                        <p className="mt-3 text-[20px] leading-snug text-simar-franja-texto-2 movil:text-[18px]">
                                            de aceite usado en el centro de acopio.
                                        </p>
                                    </div>
                                ) : (
                                    <div className="ul-paso ul-paso-3 ul-paso-fin">
                                        <p className="ul-frase font-titular font-semibold">Cada litro que llega al muelle es uno menos en el mar.</p>
                                    </div>
                                )}

                                {agua && (
                                    <div className="ul-paso ul-paso-4 ul-paso-fin">
                                        <p className="ul-frase font-titular font-semibold">
                                            Es el agua de{' '}
                                            <span className="text-simar-espuma">
                                                {cifra(agua.valor)} {nombreDe(agua)}
                                            </span>{' '}
                                            que no se contaminó.
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>

                        <div className="ul-dibujo">
                            <IlustracionLitro />
                        </div>
                    </div>

                    {/* Crédito de la foto que se ve: uno solo a la vez (el que se va termina antes de que
                        llegue el otro) */}
                    <div className="ul-creditos text-[15px] leading-snug text-simar-franja-texto-2">
                        {CAPAS.map(({ foto }, i) => (
                            // Texto y no enlace: las tres están en el mismo lugar y las ocultas no deben recibir clics
                            <span key={foto.src} className={`ul-credito ul-credito-${i + 1}`}>
                                {textoCredito(foto.credito)}
                            </span>
                        ))}
                    </div>
                </div>
            </div>

            {hayDatos && (
                <div className="ul-franja px-6 pt-20 pb-24 movil:px-4 movil:pt-14 movil:pb-16">
                    <div className="max-w-[1248px] mx-auto">
                        {tarjetas.length > 0 && (
                            <>
                                <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-4">
                                    <h3 className="font-titular text-[clamp(32px,3.4vw,48px)] font-semibold leading-[1.05] tracking-[-0.02em] text-simar-texto text-balance movil:text-[30px]">
                                        Lo que ya no está en el mar
                                    </h3>
                                    {MODO_DEMO ? (
                                        <span className="inline-flex items-center gap-2 min-h-[36px] px-3.5 rounded-full bg-simar-violeta-suave text-simar-violeta text-[15px] font-bold">
                                            <FlaskConical aria-hidden="true" className="w-4 h-4" strokeWidth={2.4} />
                                            Datos de demostración
                                        </span>
                                    ) : (
                                        <span className="inline-flex items-center gap-2 min-h-[36px] px-3.5 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta text-[15px] font-bold">
                                            <BadgeCheck aria-hidden="true" className="w-4 h-4" strokeWidth={2.4} />
                                            Con los manifiestos registrados en SiMAR
                                        </span>
                                    )}
                                </div>

                                <ul className="ul-tarjetas mt-8 grid grid-cols-1 md:grid-cols-3 gap-5 movil:mt-6 movil:gap-3">
                                    {tarjetas.map(({ clave, tipo, Icono, valor, nombre, detalle, tono, estimado }) => {
                                        const tonoSuave =
                                            tono === 'arrecife' ? 'bg-simar-arrecife-suave text-simar-arrecife-tinta' : 'bg-simar-marea-suave text-simar-marea-tinta';
                                        const insignia = (
                                            <span className="inline-flex items-center min-h-[28px] px-2.5 rounded-full bg-simar-arrecife-suave text-simar-arrecife-tinta text-[15px] font-bold">
                                                estimado
                                            </span>
                                        );
                                        return (
                                            <li
                                                key={clave}
                                                className="ul-tarjeta flex flex-col rounded-[26px] bg-simar-superficie border border-simar-borde-suave shadow-[var(--simar-sombra)] p-7 movil:p-5 movil:rounded-[22px] movil:grid movil:grid-cols-[auto_1fr] movil:gap-x-4 movil:items-start"
                                            >
                                                {/* Arriba: el ícono en su tono y, si la cifra es estimada, su insignia */}
                                                <div className="flex items-start justify-between gap-3 movil:row-span-3">
                                                    <span aria-hidden="true" className={`w-[52px] h-[52px] rounded-[16px] flex items-center justify-center flex-shrink-0 ${tonoSuave}`}>
                                                        {tipo ? (
                                                            <IconoTarjeta tipo={tipo} className="w-7 h-7" />
                                                        ) : (
                                                            <Icono className="w-6 h-6" strokeWidth={2.1} />
                                                        )}
                                                    </span>
                                                    {estimado && <span className="movil:hidden">{insignia}</span>}
                                                </div>
                                                <p className="mt-7 text-[46px] font-extrabold leading-none tracking-[-0.025em] tabular-nums text-simar-texto movil:mt-0.5 movil:text-[34px]">
                                                    {valor}
                                                </p>
                                                <p className="mt-2.5 text-[20px] font-extrabold leading-snug text-simar-texto movil:mt-1 movil:text-[18px]">
                                                    {nombre}
                                                    {estimado && <span className="hidden ml-2 align-[2px] movil:inline-flex">{insignia}</span>}
                                                </p>
                                                <p className="mt-1 text-[17px] leading-snug text-simar-texto-2 text-pretty">{detalle}</p>
                                            </li>
                                        );
                                    })}
                                </ul>
                            </>
                        )}

                        <div className="mt-8 flex flex-wrap items-center justify-between gap-x-6 gap-y-4 movil:mt-6">
                            <p className="text-[17px] leading-snug text-simar-texto-2">Cifras al {cifrasAl}, hora de Puerto Peñasco.</p>
                            <ComoSeCalculan usaTinaco={agua?.nombre[0] === 'tinaco'} usaBolsa={basura?.nombre[0] === 'bolsa de basura'} />
                        </div>
                    </div>
                </div>
            )}
        </section>
    );
}

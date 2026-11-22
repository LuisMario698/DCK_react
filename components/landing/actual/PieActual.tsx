'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { ChevronDown } from 'lucide-react';
import { MODO_DEMO } from '@/lib/demo/config';
import { LogoSimar } from '@/components/layout/LogoSimar';
import { CREDITOS } from './creditos';

// Enlaces del pie: ≥ 52 px de alto (44 en celular) y letra de 17 px. Si el texto ocupa dos
// renglones (columnas angostas del celular), el relleno de arriba y abajo los separa del vecino
const enlace =
    'min-h-[52px] py-1.5 inline-flex items-center text-[17px] leading-snug text-simar-texto-2 hover:text-simar-marea-tinta transition-colors cursor-pointer text-left movil:min-h-[44px]';
const titulo = 'text-[15px] font-extrabold uppercase tracking-[0.14em] text-simar-texto';

/**
 * El pie de la landing Actual: a dónde ir, de dónde salen los datos, los créditos y el acceso de
 * desarrollador. En el celular es compacto: «Explorar» y «Participar» lado a lado, y «Fuentes» en
 * una fila debajo. Sin animaciones; como queda lejos de la pantalla al abrir, el navegador no lo
 * pinta hasta que se acerca (content-visibility).
 */
export function PieActual({
    alAccesoDesarrollador,
    alAbrirAcceso,
    rutaDemo,
}: {
    alAccesoDesarrollador: () => void;
    alAbrirAcceso: (rol?: 'admin' | 'recolector') => void;
    rutaDemo: string | null;
}) {
    const { locale } = useParams<{ locale: string }>();
    const noticias = `/${locale ?? 'es'}/noticias`;

    return (
        <footer className="bg-simar-superficie pt-14 pb-8 px-6 md:pt-16 [content-visibility:auto] [contain-intrinsic-size:auto_640px] movil:pt-10 movil:pb-[max(24px,env(safe-area-inset-bottom))] movil:px-5">
            <div className="max-w-[1248px] mx-auto">
                <div className="grid grid-cols-2 gap-x-5 gap-y-8 md:grid-cols-3 md:gap-x-10 md:gap-y-10 lg:grid-cols-[minmax(0,1.1fr)_repeat(3,minmax(0,1fr))]">
                    <div className="col-span-2 md:col-span-3 lg:col-span-1">
                        <LogoSimar tamano={60} prioridad={false} />
                        <p className="mt-4 max-w-[30ch] text-[17px] leading-relaxed text-simar-texto-2 movil:mt-3">
                            Sistema Integral de Manejo Ambiental de Residuos
                        </p>
                    </div>

                    <nav aria-labelledby="pie-explorar" className="min-w-0">
                        <h3 id="pie-explorar" className={titulo}>
                            Explorar
                        </h3>
                        <ul className="mt-2 movil:mt-1">
                            <li><a href="#como-funciona" className={enlace}>Cómo funciona</a></li>
                            <li><Link href={noticias} className={enlace}>Noticias del Mar</Link></li>
                            <li><a href="#impacto" className={enlace}>Impacto</a></li>
                            <li><a href="#don-francisco" className={enlace}>Don Francisco</a></li>
                            <li><a href="#mapa" className={enlace}>Puertos</a></li>
                            <li><a href="#proyecto" className={enlace}>Hecho en Puerto Peñasco</a></li>
                        </ul>
                    </nav>

                    <nav aria-labelledby="pie-participar" className="min-w-0">
                        <h3 id="pie-participar" className={titulo}>
                            Participar
                        </h3>
                        <ul className="mt-2 movil:mt-1">
                            <li><a href="#correo-del-mes" className={enlace}>Correo del mes</a></li>
                            {rutaDemo && (
                                <li><a href={rutaDemo} className={enlace}>Probar la demostración</a></li>
                            )}
                            {/* En el despliegue de la demostración, el acceso ya lleva a ella */}
                            {!MODO_DEMO && (
                                <>
                                    <li>
                                        <button type="button" onClick={() => alAbrirAcceso('recolector')} className={enlace}>
                                            Registra tu empresa recolectora
                                        </button>
                                    </li>
                                    <li>
                                        <button type="button" onClick={() => alAbrirAcceso()} className={enlace}>
                                            Iniciar sesión
                                        </button>
                                    </li>
                                </>
                            )}
                        </ul>
                    </nav>

                    {/* En el celular, a lo ancho y con sus dos enlaces en una fila */}
                    <nav aria-labelledby="pie-fuentes" className="col-span-2 min-w-0 md:col-span-1">
                        <h3 id="pie-fuentes" className={titulo}>
                            Fuentes
                        </h3>
                        <ul className="mt-2 movil:mt-1 movil:flex movil:flex-wrap movil:gap-x-6">
                            <li><Link href={`${noticias}#glosario`} className={enlace}>Glosario</Link></li>
                            <li><Link href={`${noticias}#fuentes`} className={enlace}>De dónde sale cada dato</Link></li>
                        </ul>
                    </nav>
                </div>

                {/* Créditos: cerrados, sin JS (<details> nativo); una línea por recurso de terceros */}
                <details className="group mt-10 border-t border-simar-borde-suave pt-2 movil:mt-8">
                    <summary className="min-h-[52px] inline-flex items-center gap-2 text-[17px] font-bold text-simar-texto cursor-pointer list-none [&::-webkit-details-marker]:hidden hover:text-simar-marea-tinta transition-colors movil:min-h-[44px]">
                        Créditos de imágenes
                        <ChevronDown aria-hidden="true" className="w-5 h-5 transition-transform duration-200 group-open:rotate-180" strokeWidth={2.2} />
                    </summary>
                    <ul className="mt-2 mb-2 grid gap-x-10 gap-y-3 md:grid-cols-2 text-[15px] leading-relaxed text-simar-texto-2">
                        {/* La licencia CC BY 4.0 de los modelos 3D pide el crédito y avisar que se modificaron */}
                        <li className="md:col-span-2">
                            Modelos 3D: «macbook pro M3 16 inch 2024» de jackbaeten y «Apple iPhone 15 Pro Max Black» de
                            Polyman_3D (Sketchfab), bajo{' '}
                            <a href="https://creativecommons.org/licenses/by/4.0/deed.es" target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-simar-marea-tinta">
                                CC BY 4.0
                            </a>
                            ; modificados (sin logotipos y con pantallas de SiMAR).
                        </li>
                        {CREDITOS.map((c) => (
                            <li key={c.que}>
                                <span className="font-semibold text-simar-texto">{c.que}.</span>{' '}
                                {c.pagina ? (
                                    <a href={c.pagina} target="_blank" rel="noopener noreferrer" className="underline underline-offset-2 hover:text-simar-marea-tinta">
                                        {c.texto}
                                    </a>
                                ) : (
                                    c.texto
                                )}
                            </li>
                        ))}
                    </ul>
                </details>

                <div className="mt-4 pt-4 border-t border-simar-borde-suave flex flex-wrap items-center justify-between gap-x-6 gap-y-1">
                    {/* El año sale del reloj de quien lo ve: en la noche de Año Nuevo puede no coincidir con el del servidor */}
                    <p className="text-[17px] text-simar-texto-2" suppressHydrationWarning>
                        © {new Date().getFullYear()} SiMAR · DCK / ITSPP
                    </p>
                    {/* Acceso interno al panel de superadmin: discreto a propósito (texto chico y gris, sin
                        ícono; el área que se toca sigue siendo de 44 px). También se llega entrando a
                        /es/superadmin sin sesión */}
                    <button
                        type="button"
                        onClick={alAccesoDesarrollador}
                        className="min-h-[44px] inline-flex items-center text-[14px] movil:text-[15px] text-simar-texto-3 hover:text-simar-texto-2 hover:underline underline-offset-2 transition-colors cursor-pointer"
                    >
                        Acceso desarrollador
                    </button>
                </div>
            </div>
        </footer>
    );
}

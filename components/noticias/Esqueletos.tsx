'use client';

import { useLayoutEffect, type CSSProperties } from 'react';
import { useParams } from 'next/navigation';
import { EncabezadoNoticias } from './EncabezadoNoticias';

/**
 * Lo que se ve mientras llega la página de Noticias o una nota (sus loading.tsx): la barra de arriba
 * ya está (no parpadea) y, abajo, **la forma exacta de lo que va a llegar** en huesos con brillo
 * (`n-hueso`; sobre lo oscuro, `n-hueso-claro`): la cabecera del periódico con sus filetes, la cinta
 * «Al momento», la nota principal y «Lo último»; en una nota, el tema, el titular, la firma con sus
 * botones, la foto a lo ancho y los párrafos con la letra capital. El brillo pasa en diagonal y
 * escalonado (`--n-retraso`), como una ola. Todo aparece tras un instante (`n-esqueleto`): una carga
 * rápida no se nota. Con «reducir movimiento» o «Sin animaciones», quieto.
 * Al llegar desde otra página (la landing, muy abajo), el esqueleto empieza arriba: si no, se queda
 * con la altura de la página anterior y la nueva abre a media página.
 */

function useEmpezarArriba() {
    useLayoutEffect(() => {
        if (!window.location.hash) window.scrollTo({ top: 0, behavior: 'instant' });
    }, []);
}

const CLASE_PAGINA = 'simar-landing n-pagina min-h-screen bg-simar-papel font-sans text-simar-texto antialiased';

/** Un hueso con su retraso de brillo (en segundos), para que la ola avance */
function Hueso({ className = '', retraso = 0, style }: { className?: string; retraso?: number; style?: CSSProperties }) {
    return <span aria-hidden="true" className={`n-hueso block ${className}`} style={{ animationDelay: `${retraso}s`, ...style }} />;
}

function Filete({ grueso = false }: { grueso?: boolean }) {
    return <span aria-hidden="true" className={`block bg-simar-borde ${grueso ? 'h-[3px]' : 'h-px'}`} />;
}

export function EsqueletoNoticias() {
    const { locale } = useParams<{ locale: string }>();
    useEmpezarArriba();
    return (
        <div className={CLASE_PAGINA} aria-busy="true">
            <EncabezadoNoticias locale={locale}>
                <div className="border-t border-simar-borde/70 flex gap-2 overflow-hidden px-4 py-[17px] md:px-5 movil:px-3 movil:py-4">
                    {[82, 112, 92, 104, 108, 70, 86, 78].map((ancho, i) => (
                        <Hueso key={i} className="h-7 flex-shrink-0" retraso={i * 0.05} style={{ width: ancho }} />
                    ))}
                </div>
            </EncabezadoNoticias>
            <main className="n-esqueleto">
                <p role="status" className="sr-only">
                    Cargando las noticias…
                </p>
                <section className="px-6 pt-8 pb-20 md:pt-10 movil:px-5 movil:pt-5">
                    <div className="max-w-[1248px] mx-auto">
                        {/* La cabecera del periódico */}
                        <Filete grueso />
                        <div className="mt-3 flex items-center justify-between gap-6">
                            <Hueso className="h-4 w-[min(420px,70%)]" />
                            <Hueso className="h-4 w-44 max-sm:hidden" retraso={0.1} />
                        </div>
                        <div className="mt-5 flex items-end gap-[2.5%] movil:flex-wrap movil:gap-3">
                            <Hueso className="h-[clamp(64px,8.6vw,124px)] w-[38%] rounded-[18px] movil:w-[70%] movil:h-[52px]" retraso={0.05} />
                            <Hueso className="h-[clamp(64px,8.6vw,124px)] w-[14%] rounded-[18px] movil:w-[26%] movil:h-[52px]" retraso={0.12} />
                            <Hueso className="h-[clamp(64px,8.6vw,124px)] w-[22%] rounded-[18px] movil:w-[40%] movil:h-[52px]" retraso={0.19} />
                        </div>
                        <div className="mt-5 mb-4 flex flex-wrap items-end justify-between gap-6">
                            <div className="w-[min(620px,100%)] space-y-3">
                                <Hueso className="h-5 w-[92%]" retraso={0.2} />
                                <Hueso className="h-5 w-[55%]" retraso={0.25} />
                            </div>
                            <div className="flex gap-7">
                                {[0, 1, 2].map((i) => (
                                    <div key={i} className="space-y-2">
                                        <Hueso className="h-9 w-12 rounded-[10px]" retraso={0.3 + i * 0.06} />
                                        <Hueso className="h-3 w-16" retraso={0.33 + i * 0.06} />
                                    </div>
                                ))}
                            </div>
                        </div>
                        <Filete />
                        <span aria-hidden="true" className="block h-[3px]" />
                        <Filete />

                        {/* «Al momento» */}
                        <div className="mt-5 flex items-center gap-3 rounded-full bg-simar-superficie ring-1 ring-simar-borde p-1.5">
                            <Hueso className="h-[44px] w-[150px] flex-shrink-0 movil:w-[120px]" retraso={0.35} />
                            <Hueso className="h-4 flex-1" retraso={0.4} />
                            <Hueso className="h-4 w-[22%] max-md:hidden" retraso={0.45} />
                        </div>

                        {/* La principal y «Lo último» */}
                        <div className="mt-9 grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_380px] gap-x-12 gap-y-10 movil:mt-6">
                            <div>
                                <div className="simar-cargando aspect-[16/10] rounded-[20px] movil:aspect-[4/3] movil:rounded-[16px]" />
                                <Hueso className="mt-3 ml-auto h-3.5 w-56" />
                                <Hueso className="mt-4 h-3.5 w-28" retraso={0.1} />
                                <Hueso className="mt-4 h-[clamp(36px,3.6vw,52px)] w-[92%] rounded-[14px]" retraso={0.15} />
                                <Hueso className="mt-3 h-[clamp(36px,3.6vw,52px)] w-[64%] rounded-[14px]" retraso={0.2} />
                                <Hueso className="mt-5 h-5 w-[86%]" retraso={0.25} />
                                <Hueso className="mt-3 h-5 w-[70%]" retraso={0.3} />
                            </div>
                            <div>
                                <div className="flex items-center justify-between border-b-2 border-simar-borde pb-3">
                                    <Hueso className="h-4 w-28" />
                                    <Hueso className="h-4 w-20" />
                                </div>
                                {[0, 1, 2, 3].map((i) => (
                                    <div key={i} className="grid grid-cols-[34px_minmax(0,1fr)_92px] gap-4 border-b border-simar-borde py-5 last:border-b-0 movil:grid-cols-[minmax(0,1fr)_84px]">
                                        <Hueso className="h-7 w-5 rounded-[6px] movil:hidden" retraso={0.1 * i} />
                                        <div className="space-y-2.5">
                                            <Hueso className="h-3 w-20" retraso={0.1 * i + 0.05} />
                                            <Hueso className="h-5 w-[95%] rounded-[8px]" retraso={0.1 * i + 0.1} />
                                            <Hueso className="h-5 w-[70%] rounded-[8px]" retraso={0.1 * i + 0.15} />
                                            <Hueso className="h-3 w-16" retraso={0.1 * i + 0.2} />
                                        </div>
                                        <span className="simar-cargando block w-[92px] h-[92px] rounded-[14px] movil:w-[84px] movil:h-[84px]" />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            </main>
        </div>
    );
}

export function EsqueletoArticulo() {
    const { locale } = useParams<{ locale: string }>();
    useEmpezarArriba();
    return (
        <div className={CLASE_PAGINA} aria-busy="true">
            <EncabezadoNoticias locale={locale} enArticulo />
            <main className="n-esqueleto px-6 pt-10 pb-24 md:pt-16 movil:px-5 movil:pt-6">
                <p role="status" className="sr-only">
                    Cargando la nota…
                </p>
                <div className="max-w-[1180px] mx-auto">
                    <div className="max-w-[780px] mx-auto">
                        {/* Tema, titular y entrada */}
                        <Hueso className="h-4 w-52" />
                        <Hueso className="mt-5 h-[clamp(42px,5vw,68px)] w-full rounded-[16px] movil:h-10" retraso={0.06} />
                        <Hueso className="mt-3 h-[clamp(42px,5vw,68px)] w-[88%] rounded-[16px] movil:h-10" retraso={0.12} />
                        <Hueso className="mt-3 h-[clamp(42px,5vw,68px)] w-[46%] rounded-[16px] movil:h-10" retraso={0.18} />
                        <Hueso className="mt-7 h-6 w-[94%]" retraso={0.24} />
                        <Hueso className="mt-3 h-6 w-[62%]" retraso={0.3} />

                        {/* La firma y sus botones */}
                        <div className="mt-8 flex flex-wrap items-center justify-between gap-5 border-y border-simar-borde py-5 movil:mt-6">
                            <div className="flex items-center gap-4">
                                <Hueso className="w-[52px] h-[52px] flex-shrink-0" retraso={0.3} />
                                <div className="space-y-2">
                                    <Hueso className="h-4 w-36" retraso={0.34} />
                                    <Hueso className="h-3.5 w-60 movil:w-44" retraso={0.38} />
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <Hueso className="h-[48px] w-[132px]" retraso={0.4} />
                                <Hueso className="h-[48px] w-[100px]" retraso={0.45} />
                                <Hueso className="h-[48px] w-[136px] max-sm:hidden" retraso={0.5} />
                            </div>
                        </div>
                    </div>

                    {/* La foto a lo ancho y su pie */}
                    <div className="simar-cargando mt-10 aspect-[16/9] rounded-[28px] movil:mt-6 movil:-mx-5 movil:aspect-[4/3] movil:rounded-none" />
                    <div className="max-w-[780px] mx-auto mt-3 flex justify-between gap-6">
                        <Hueso className="h-3.5 w-[46%]" />
                        <Hueso className="h-3.5 w-[30%]" retraso={0.1} />
                    </div>

                    {/* El texto, con la letra capital */}
                    <div className="max-w-[700px] mx-auto mt-12 movil:mt-8">
                        <div className="flex gap-4">
                            <Hueso className="w-[70px] h-[86px] flex-shrink-0 rounded-[12px] movil:w-[58px] movil:h-[70px]" />
                            <div className="flex-1 space-y-3.5 pt-1">
                                <Hueso className="h-6 w-full" retraso={0.05} />
                                <Hueso className="h-6 w-[94%]" retraso={0.1} />
                                <Hueso className="h-6 w-[70%]" retraso={0.15} />
                            </div>
                        </div>
                        <div className="mt-10 border-l-4 border-simar-borde pl-7 space-y-3 movil:pl-5">
                            <Hueso className="h-3.5 w-20" retraso={0.2} />
                            <Hueso className="h-14 w-40 rounded-[14px]" retraso={0.25} />
                            <Hueso className="h-5 w-[80%]" retraso={0.3} />
                        </div>
                        <div className="mt-10 space-y-3.5">
                            {[100, 96, 98, 72, 0, 100, 94, 97, 60].map((ancho, i) =>
                                ancho ? <Hueso key={i} className="h-5" retraso={0.3 + i * 0.05} style={{ width: `${ancho}%` }} /> : <span key={i} className="block h-4" />,
                            )}
                        </div>
                    </div>
                </div>
            </main>
        </div>
    );
}

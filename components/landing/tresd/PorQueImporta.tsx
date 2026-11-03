import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight, Droplet, Fish, Ship, type LucideIcon } from 'lucide-react';
import { aguaProtegidaL } from '@/lib/utils/equivalencias';
import { cifra } from './comun';
import { ComparadorHojas } from './ComparadorHojas';

/** Lo que está en juego, en tres temas. Cada uno lleva a su artículo en Noticias (con fuentes) */
const TEMAS: { Icono: LucideIcon; tema: string; titulo: string; texto: string; dato: string; nota: string; slug: string }[] = [
    {
        Icono: Droplet,
        tema: 'El aceite',
        titulo: 'Una capa que ahoga el agua.',
        texto: 'El aceite usado de un motor no deja pasar la luz ni el oxígeno. Entregado en el puerto, en cambio, se puede volver a refinar.',
        dato: '1 L',
        nota: 'basta para contaminar un millón de litros de agua',
        slug: 'un-litro-de-aceite-un-millon-de-litros-de-agua',
    },
    {
        Icono: Ship,
        tema: 'La basura',
        titulo: 'Al mar no se tira.',
        texto: 'La regla internacional MARPOL Anexo V prohíbe tirar plásticos al mar, redes y cabos incluidos. El centro de acopio es donde se entregan.',
        dato: '1998',
        nota: 'año en que México se adhirió al Anexo V',
        slug: 'marpol-anexo-v-lo-que-un-barco-no-puede-tirar-al-mar',
    },
    {
        Icono: Fish,
        tema: 'El lugar',
        titulo: 'El acuario del mundo.',
        texto: 'Puerto Peñasco está en el Alto Golfo de California, el único hogar de la vaquita marina, la marsopa más pequeña del mundo.',
        dato: '39 %',
        nota: 'de las especies de mamíferos marinos del planeta viven en el golfo',
        slug: 'el-mar-de-cortes-el-acuario-del-mundo',
    },
];

/**
 * «Por qué importa» (oscuro): el contexto del problema, sin animaciones de por medio. La cifra del
 * aceite en grande, tres temas con su dato y su artículo, el antes y después de la hoja, y la
 * persona para quien se hizo SiMAR. Las cifras salen de los artículos de lib/constants/noticias.ts
 * (con sus fuentes) y la del agua, de lib/utils/equivalencias.ts.
 */
export function PorQueImporta({ locale }: { locale: string }) {
    const noticia = (slug: string) => `/${locale}/noticias/${slug}`;

    return (
        <section id="por-que" aria-labelledby="por-que-titulo" className="relative bg-simar-abismo text-white px-6 py-24 md:py-36 overflow-clip movil:px-5 movil:py-16">
            <div className="relative max-w-[1248px] mx-auto">
                <div className="max-w-4xl">
                    <p className="t3-enfoca text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">Por qué importa</p>
                    <h2
                        id="por-que-titulo"
                        className="t3-enfoca mt-3 text-[clamp(40px,4.6vw,68px)] font-extrabold leading-[1.03] tracking-[-0.03em] movil:mt-2 movil:text-[32px] movil:leading-[1.08] movil:tracking-[-0.02em]"
                    >
                        Lo que no llega al puerto, termina en el mar.
                    </h2>
                    <p className="t3-enfoca mt-5 max-w-3xl text-xl md:text-[22px] leading-relaxed text-simar-franja-texto-2 movil:mt-3 movil:text-[17px]">
                        Las embarcaciones pesqueras de Puerto Peñasco entregan su basura y su aceite usado en el centro de acopio del recinto portuario. Cada entrega registrada es una que no se quedó en el agua.
                    </p>
                </div>

                {/* La cifra que más repetimos, en grande */}
                <div className="t3-enfoca mt-14 md:mt-20 border-t border-white/12 pt-10 md:pt-14 grid lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)] gap-6 lg:gap-16 items-end movil:mt-10 movil:pt-8">
                    <p className="text-[clamp(64px,10.5vw,164px)] font-extrabold leading-[0.9] tracking-[-0.045em] tabular-nums text-simar-aceite movil:text-[56px]">
                        {cifra(aguaProtegidaL(1))}
                    </p>
                    <div className="lg:pb-3">
                        <p className="text-[clamp(22px,2vw,28px)] font-bold leading-snug movil:text-[19px]">de litros de agua puede contaminar un solo litro de aceite usado.</p>
                        <p className="mt-3 text-[15px] leading-relaxed text-simar-franja-texto-3">Estimación de la Agencia de Protección Ambiental de Estados Unidos (EPA).</p>
                    </div>
                </div>

                {/* Tres temas, cada uno con su artículo (en celular, un carrusel que se desliza de lado) */}
                <ul aria-label="Tres temas (en celular, desliza de lado)" className="t3-enfoca simar-carrusel mt-14 md:mt-20 grid md:grid-cols-3 gap-4 md:gap-6 movil:mt-10">
                    {TEMAS.map(({ Icono, tema, titulo, texto, dato, nota, slug }) => (
                        <li key={slug} className="flex">
                            <Link
                                href={noticia(slug)}
                                className="group w-full flex flex-col rounded-[28px] bg-white/[0.06] border border-white/12 p-7 md:p-8 transition-colors hover:bg-white/[0.1] focus-visible:outline-3 focus-visible:outline-simar-espuma focus-visible:outline-offset-4 movil:rounded-[22px] movil:p-6"
                            >
                                <span className="flex items-center gap-3 text-[17px] font-bold text-simar-espuma">
                                    <span className="w-11 h-11 rounded-[14px] bg-white/10 flex items-center justify-center">
                                        <Icono aria-hidden="true" className="w-[22px] h-[22px]" />
                                    </span>
                                    {tema}
                                </span>
                                <span className="mt-6 block text-[26px] font-extrabold leading-[1.15] tracking-[-0.015em] movil:mt-5 movil:text-[22px]">{titulo}</span>
                                <span className="mt-3 block text-[17px] leading-relaxed text-simar-franja-texto-2 movil:text-[16px]">{texto}</span>
                                <span className="mt-6 pt-5 border-t border-white/12 flex items-baseline gap-3 movil:mt-5 movil:pt-4">
                                    <span className="flex-shrink-0 whitespace-nowrap text-[34px] font-extrabold leading-none tracking-[-0.02em] tabular-nums text-white movil:text-[30px]">{dato}</span>
                                    <span className="text-[15px] leading-snug text-simar-franja-texto-2">{nota}</span>
                                </span>
                                <span className="mt-auto pt-6 inline-flex items-center gap-1.5 text-[17px] font-bold text-simar-espuma movil:pt-5">
                                    Leer el artículo
                                    <span className="sr-only">: {titulo}</span>
                                    <ArrowRight aria-hidden="true" className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5" />
                                </span>
                            </Link>
                        </li>
                    ))}
                </ul>

                {/* El papel: antes y después */}
                <div className="mt-20 md:mt-32 grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.05fr)] gap-10 lg:gap-20 items-center movil:mt-14 movil:gap-7">
                    <div className="t3-enfoca lg:order-2">
                        <p className="text-lg md:text-xl font-bold text-simar-espuma movil:text-[15px]">Antes de SiMAR</p>
                        <h3 className="mt-3 text-[clamp(32px,3.4vw,50px)] font-extrabold leading-[1.06] tracking-[-0.025em] movil:mt-2 movil:text-[28px] movil:leading-[1.1]">
                            Por años, todo se anotó en papel.
                        </h3>
                        <p className="mt-5 text-xl leading-relaxed text-simar-franja-texto-2 movil:mt-3 movil:text-[17px]">
                            Cada manifiesto se llenaba a mano, hoja por hoja. El tiempo las manchaba y las borraba hasta volverlas ilegibles, y con ellas se perdía la cuenta de lo que se le había quitado al mar.
                        </p>
                        <p className="mt-4 text-xl leading-relaxed text-simar-franja-texto-2 movil:text-[17px]">
                            Con SiMAR, cada manifiesto queda firmado y guardado, y sus litros y kilos se suman solos.
                        </p>
                    </div>
                    <div className="t3-enfoca lg:order-1 w-full max-w-[520px] mx-auto lg:mx-0">
                        <ComparadorHojas />
                    </div>
                </div>

                {/* Para quién se hizo */}
                <Link
                    href={noticia('conanp-reconoce-25-anios-del-centro-de-acopio')}
                    className="t3-enfoca group mt-20 md:mt-32 grid sm:grid-cols-[minmax(0,220px)_minmax(0,1fr)] md:grid-cols-[minmax(0,300px)_minmax(0,1fr)] gap-6 md:gap-12 items-center rounded-[32px] bg-white/[0.06] border border-white/12 p-5 md:p-6 transition-colors hover:bg-white/[0.1] focus-visible:outline-3 focus-visible:outline-simar-espuma focus-visible:outline-offset-4 movil:mt-14 movil:rounded-[24px] movil:p-4"
                >
                    <div className="relative aspect-[4/3] sm:aspect-[3/4] rounded-[24px] overflow-hidden movil:rounded-[18px]">
                        <Image
                            src="/assets/images/img4.jpeg"
                            alt="Francisco Javier Bojórquez Ochoa con su reconocimiento de la CONANP, en Puerto Peñasco"
                            fill
                            sizes="(min-width: 768px) 300px, (min-width: 640px) 220px, 100vw"
                            className="object-cover"
                            style={{ objectPosition: '50% 30%' }}
                        />
                    </div>
                    <div className="pb-2 md:pr-6 movil:px-1">
                        <p className="text-lg font-bold text-simar-espuma movil:text-[15px]">Hecho con quien lo vive</p>
                        <p className="mt-3 text-[clamp(26px,2.6vw,38px)] font-extrabold leading-[1.15] tracking-[-0.02em] movil:mt-2 movil:text-[23px]">
                            Francisco Javier Bojórquez Ochoa lleva 25 años al frente del centro de acopio del puerto.
                        </p>
                        <p className="mt-4 text-[18px] leading-relaxed text-simar-franja-texto-2 movil:mt-3 movil:text-[16px]">
                            En 2025, la CONANP le reconoció ese trabajo. SiMAR se diseñó con él y para él: botones grandes, letra clara y un paso a la vez.
                        </p>
                        <span className="mt-5 inline-flex items-center gap-1.5 text-[17px] font-bold text-simar-espuma">
                            Leer la noticia
                            <ArrowRight aria-hidden="true" className="w-[18px] h-[18px] transition-transform group-hover:translate-x-0.5" />
                        </span>
                    </div>
                </Link>
            </div>
        </section>
    );
}

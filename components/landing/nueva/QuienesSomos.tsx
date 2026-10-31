import Image from 'next/image';
import { Award, Check } from 'lucide-react';
import logoItspp from '@/public/assets/logo_ITSPP.png';
import logoIcs from '@/public/assets/logo_ICS.png';
import { Encabezado } from './comunes';
import { TextoQueSeEnciende } from './escena';

/** El concurso al que va SiMAR (cámbialo aquí si cambia la etapa) */
const ETAPA = { titulo: 'Del regional al nacional', texto: 'SiMAR pasó la etapa regional y va a la etapa nacional de InnovaTecNM.' };

const RECONOCIMIENTOS = [
    {
        src: '/assets/images/img6.jpeg',
        alt: 'Reconocimiento de la CONANP a Francisco Javier Bojórquez Ochoa',
        texto: 'CONANP, 2025: por 25 años operando el centro de acopio de residuos del recinto portuario.',
        encuadre: '50% 40%',
    },
    {
        src: '/assets/images/img7.jpeg',
        alt: 'Reconocimiento a la Conservación de la Naturaleza 2015',
        texto: 'SEMARNAT y CONANP, 2015: Reconocimiento a la Conservación de la Naturaleza, mención honorífica.',
        encuadre: '50% 45%',
    },
    {
        src: '/assets/images/img5.jpeg',
        alt: 'Entrega de un reconocimiento a Don Francisco en Puerto Peñasco',
        texto: 'La entrega en Puerto Peñasco, con las autoridades del puerto y del medio ambiente.',
        encuadre: '60% 40%',
    },
];

/**
 * 7 · Quiénes somos y reconocimientos. Aquí baja "El proyecto" de la landing actual: las tres
 * instituciones, los reconocimientos de Don Francisco y el paso del regional al nacional.
 */
export function QuienesSomos() {
    return (
        <section id="nosotros" className="relative bg-simar-superficie px-6 pt-24 md:pt-36 pb-20 md:pb-32 movil:px-5 movil:pt-16 movil:pb-14">
            <div className="max-w-[1248px] mx-auto">
                <Encabezado
                    antetitulo="Quiénes somos"
                    titulo={<TextoQueSeEnciende texto="Un proyecto de Puerto Peñasco para su mar." />}
                    texto="SiMAR nace de la colaboración entre DCK Conciencia y Cultura y el Instituto Tecnológico Superior de Puerto Peñasco, con el respaldo de SEMARNAT."
                />

                <div className="mt-10 grid md:grid-cols-3 gap-5 movil:mt-7 movil:gap-3">
                    <div className="ln-enfoca rounded-[28px] border border-simar-borde bg-simar-papel p-7 movil:rounded-[22px] movil:p-5">
                        <span className="flex h-16 items-center rounded-xl dark:bg-white/90 dark:px-2 dark:w-fit">
                            <Image src="/assets/landing/logo-dck.webp" alt="DCK Conciencia y Cultura" width={61} height={64} className="h-16 w-auto object-contain" />
                        </span>
                        <h3 className="mt-4 text-[22px] font-extrabold movil:text-[19px]">DCK Conciencia y Cultura</h3>
                        <p className="mt-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[15px]">
                            Formada por Dayanara, Coral y Karitza. De aquí nace la idea y el trabajo con el puerto.
                        </p>
                    </div>
                    <div className="ln-enfoca ln-tras-1 rounded-[28px] border border-simar-borde bg-simar-papel p-7 movil:rounded-[22px] movil:p-5">
                        <span className="flex h-16 items-center gap-3 rounded-xl dark:bg-white/90 dark:px-2 dark:w-fit">
                            <Image src={logoItspp} alt="ITSPP" className="h-14 w-auto object-contain" sizes="56px" />
                            <Image src={logoIcs} alt="ICS" className="h-12 w-auto object-contain" sizes="64px" />
                        </span>
                        <h3 className="mt-4 text-[22px] font-extrabold movil:text-[19px]">ITSPP</h3>
                        <p className="mt-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[15px]">
                            Instituto Tecnológico Superior de Puerto Peñasco. Aquí se desarrolla SiMAR.
                        </p>
                    </div>
                    <div className="ln-enfoca ln-tras-2 rounded-[28px] border border-simar-borde bg-simar-papel p-7 movil:rounded-[22px] movil:p-5">
                        <span className="flex h-16 items-center text-[34px] font-extrabold tracking-[-0.01em] text-simar-texto movil:text-[28px]">SEMARNAT</span>
                        <h3 className="mt-4 text-[22px] font-extrabold movil:text-[19px]">Respaldo institucional</h3>
                        <p className="mt-2 text-[17px] leading-relaxed text-simar-texto-2 movil:text-[15px]">
                            Don Francisco, responsable del área de residuos del recinto portuario, usa SiMAR cada día.
                        </p>
                    </div>
                </div>

                {/* Reconocimientos */}
                <h3 className="ln-enfoca mt-20 text-[clamp(28px,2.6vw,38px)] font-extrabold tracking-[-0.02em] movil:mt-12 movil:text-[22px]">Los reconocimientos de Don Francisco</h3>
                <div className="mt-6 grid sm:grid-cols-3 gap-5 movil:mt-4 movil:gap-3">
                    {RECONOCIMIENTOS.map((r, i) => (
                        <figure key={r.src} className={`ln-enfoca-foto ${i === 1 ? 'ln-tras-1' : i === 2 ? 'ln-tras-2' : ''} m-0 rounded-[26px] overflow-hidden border border-simar-borde bg-simar-papel movil:rounded-[22px] movil:grid movil:grid-cols-[112px_minmax(0,1fr)] movil:items-center`}>
                            <div className="relative aspect-[4/3] movil:aspect-square movil:h-full">
                                <Image src={r.src} alt={r.alt} fill sizes="(min-width: 640px) 400px, 112px" className="object-cover" style={{ objectPosition: r.encuadre }} />
                            </div>
                            <figcaption className="p-5 text-[17px] leading-snug text-simar-texto-2 movil:p-4 movil:text-[15px]">{r.texto}</figcaption>
                        </figure>
                    ))}
                </div>

                {/* Del regional al nacional: la etapa que ya pasó y la que sigue */}
                <div className="ln-enfoca mt-6 rounded-[32px] bg-simar-abismo text-white px-8 py-8 md:px-10 movil:rounded-[24px] movil:px-5 movil:py-6">
                    <div className="flex items-center gap-5 movil:gap-4">
                        <span className="w-14 h-14 rounded-full bg-white/10 text-simar-aceite flex items-center justify-center flex-shrink-0 movil:w-12 movil:h-12">
                            <Award className="w-7 h-7 movil:w-6 movil:h-6" />
                        </span>
                        <div>
                            <p className="text-[24px] font-extrabold movil:text-[19px]">{ETAPA.titulo}</p>
                            <p className="mt-1 text-[17px] text-simar-franja-texto-2 movil:text-[15px]">{ETAPA.texto}</p>
                        </div>
                    </div>
                    <ol className="relative mt-7 grid grid-cols-2 movil:mt-5">
                        <span aria-hidden="true" className="absolute left-[22px] right-[calc(50%-22px)] top-[22px] h-1 -translate-y-1/2 rounded-full bg-simar-espuma movil:left-[18px] movil:right-[calc(50%-18px)] movil:top-[18px]" />
                        <li className="relative flex flex-col items-start gap-2">
                            <span className="w-11 h-11 rounded-full bg-simar-espuma text-simar-abismo flex items-center justify-center movil:w-9 movil:h-9">
                                <Check className="w-6 h-6 movil:w-5 movil:h-5" strokeWidth={3} />
                            </span>
                            <span className="text-[17px] font-bold movil:text-[15px]">Etapa regional</span>
                            <span className="text-[15px] text-simar-franja-texto-2">Superada</span>
                        </li>
                        <li className="relative flex flex-col items-start gap-2">
                            <span className="w-11 h-11 rounded-full border-[3px] border-simar-espuma bg-simar-abismo flex items-center justify-center movil:w-9 movil:h-9">
                                <span className="w-3 h-3 rounded-full bg-simar-espuma" />
                            </span>
                            <span className="text-[17px] font-bold movil:text-[15px]">Etapa nacional</span>
                            <span className="text-[15px] text-simar-franja-texto-2">Lo que sigue</span>
                        </li>
                    </ol>
                </div>
            </div>
        </section>
    );
}

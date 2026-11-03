import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { POR_FECHA, recientes, resumenDe } from '@/lib/constants/noticias';
import { tituloPantalla } from '@/lib/constants/titulo';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { ListaNoticias } from '@/components/noticias/ListaNoticias';
import { ElProyecto, EncabezadoSeccion, Fuentes, Glosario, LaProblematica, PortadaNoticias } from '@/components/noticias/SeccionesNoticias';

export const metadata: Metadata = {
    title: tituloPantalla('Noticias'),
    description: 'Noticias del Alto Golfo de California y de los océanos, el contexto del problema de los residuos en el mar y la historia de SiMAR, con sus fuentes.',
};

const SECCIONES = [
    { id: 'problematica', texto: 'La problemática' },
    { id: 'proyecto', texto: 'El proyecto' },
    { id: 'todas', texto: 'Todas las noticias' },
    { id: 'glosario', texto: 'Glosario' },
    { id: 'fuentes', texto: 'Fuentes' },
];

/**
 * Noticias: una página informativa aparte, para leer sin la landing. De arriba abajo:
 *  1. Portada: la noticia más reciente a lo grande y las que siguen.
 *  2. La problemática: cuatro temas con su cifra y los artículos que los explican.
 *  3. El proyecto: qué es SiMAR, quién lo hace, su historia y sus noticias.
 *  4. Todas las noticias, con filtro por tema.
 *  5. Glosario y fuentes.
 * Los datos están en lib/constants/noticias.ts. Ver DISEÑO_SIMAR.md §8.6.
 */
export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const [principal, ...siguientes] = recientes(5);
    const delProyecto = POR_FECHA.filter((n) => n.categoria === 'SiMAR').slice(0, 3);
    // A la lista sólo le llega lo de las tarjetas (sin el texto de los artículos)
    const todas = POR_FECHA.map(resumenDe);
    const seccion = 'scroll-mt-24 px-6 py-20 md:py-28 movil:px-5 movil:py-14';

    return (
        <div className="simar-landing min-h-screen bg-simar-papel font-sans text-simar-texto antialiased">
            <EncabezadoNoticias locale={locale} />
            <main>
                {/* Portada */}
                <section aria-labelledby="noticias-titulo" className="px-6 pt-12 pb-20 md:pt-16 md:pb-28 movil:px-5 movil:pt-8 movil:pb-14">
                    <div className="max-w-[1248px] mx-auto">
                        <div className="max-w-4xl">
                                <p className="text-lg md:text-xl font-bold text-simar-marea-tinta movil:text-[15px]">Noticias · SiMAR</p>
                                <h1
                                    id="noticias-titulo"
                                    className="mt-3 text-[clamp(40px,5vw,72px)] font-extrabold leading-[1.03] tracking-[-0.03em] text-balance movil:mt-2 movil:text-[34px] movil:leading-[1.08]"
                                >
                                    El Alto Golfo, los océanos y lo que hacemos por cuidarlos.
                                </h1>
                                <p className="mt-5 max-w-3xl text-xl md:text-[22px] leading-relaxed text-simar-texto-2 text-pretty movil:mt-3 movil:text-[17px]">
                                    Noticias del mar, el contexto del problema de los residuos y la historia del proyecto. Cada dato lleva su fuente.
                                </p>
                        </div>

                        {/* En esta página */}
                        <nav aria-label="En esta página" className="mt-8 -mx-5 px-5 flex gap-2 overflow-x-auto [scrollbar-width:none] md:mx-0 md:px-0 md:flex-wrap movil:mt-6">
                            {SECCIONES.map((s) => (
                                <a
                                    key={s.id}
                                    href={`#${s.id}`}
                                    className="flex-shrink-0 min-h-[48px] px-5 rounded-full border-2 border-simar-borde bg-simar-superficie text-[17px] font-bold inline-flex items-center hover:border-simar-campo-borde transition-colors movil:min-h-[44px] movil:px-4 movil:text-[15px]"
                                >
                                    {s.texto}
                                </a>
                            ))}
                        </nav>

                        <div className="mt-10 movil:mt-7">
                            <h2 className="sr-only">Lo más reciente</h2>
                            <PortadaNoticias locale={locale} principal={principal} siguientes={siguientes} />
                        </div>
                    </div>
                </section>

                {/* La problemática */}
                <section id="problematica" aria-labelledby="problematica-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion
                            id="problematica-titulo"
                            antetitulo="La problemática"
                            titulo="Lo que está en juego en el mar."
                            texto="Cuatro temas para entender por qué importa que los residuos de las embarcaciones se entreguen en tierra. Cada uno con su cifra y los artículos que lo explican."
                        />
                        <LaProblematica locale={locale} />
                    </div>
                </section>

                {/* El proyecto */}
                <section id="proyecto" aria-labelledby="proyecto-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion
                            id="proyecto-titulo"
                            antetitulo="El proyecto"
                            titulo="SiMAR, del papel a la pantalla."
                            texto="Un sistema hecho en Puerto Peñasco, con quienes llenan los manifiestos todos los días."
                        />
                        <ElProyecto locale={locale} notas={delProyecto} />
                    </div>
                </section>

                {/* Todas */}
                <section id="todas" aria-labelledby="todas-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="todas-titulo" antetitulo="Archivo" titulo="Todas las noticias." texto="De la más nueva a la más vieja. Elige un tema para ver sólo esas." />
                        <ListaNoticias noticias={todas} locale={locale} />
                    </div>
                </section>

                {/* Glosario */}
                <section id="glosario" aria-labelledby="glosario-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="glosario-titulo" antetitulo="Glosario" titulo="Las palabras del puerto." texto="Lo que quiere decir cada término que aparece en las noticias." />
                        <Glosario />
                    </div>
                </section>

                {/* Fuentes */}
                <section id="fuentes" aria-labelledby="fuentes-titulo" className={`${seccion} bg-simar-superficie/60 border-t border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion
                            id="fuentes-titulo"
                            antetitulo="Fuentes"
                            titulo="De dónde sale cada dato."
                            texto="Cada artículo cita las suyas al final. Aquí están todas juntas, con el artículo que las usa."
                        />
                        <Fuentes locale={locale} />
                    </div>
                </section>

                {/* Cierre */}
                <section aria-labelledby="cierre-noticias" className="bg-simar-abismo text-white px-6 py-20 md:py-24 movil:px-5 movil:py-14">
                    <div className="max-w-[1248px] mx-auto flex flex-wrap items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <h2 id="cierre-noticias" className="text-[clamp(32px,3.4vw,48px)] font-extrabold leading-[1.08] tracking-[-0.025em] movil:text-[28px]">
                                Del papel al dato. Del dato, a un mar más limpio.
                            </h2>
                            <p className="mt-4 text-xl leading-relaxed text-simar-franja-texto-2 movil:text-[17px]">Mira cómo SiMAR registra cada entrega en el centro de acopio.</p>
                        </div>
                        <Link
                            href={`/${locale}?landing=3d#producto`}
                            className="min-h-[58px] px-7 rounded-full bg-white text-simar-abismo text-lg font-extrabold inline-flex items-center gap-2 hover:bg-white/90 transition-colors movil:min-h-[52px] movil:text-[17px]"
                        >
                            Ver cómo funciona
                            <ArrowRight aria-hidden="true" className="w-5 h-5" strokeWidth={2.4} />
                        </Link>
                    </div>
                </section>
            </main>
        </div>
    );
}

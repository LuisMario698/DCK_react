import type { Metadata } from 'next';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { GLOSARIO, LUGARES, POR_FECHA, TEMAS, noticiaPorSlug, recientes, resumenDe, todasLasFuentes, type Noticia } from '@/lib/constants/noticias';
import { tituloPantalla } from '@/lib/constants/titulo';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { NavSecciones } from '@/components/noticias/NavSecciones';
import { ListaNoticias } from '@/components/noticias/ListaNoticias';
import { CifrasMar } from '@/components/noticias/CifrasMar';
import { MapaHistoria } from '@/components/noticias/MapaHistoria';
import { GlosarioTarjetas } from '@/components/noticias/GlosarioTarjetas';
import { DibujoPortada, MapaGolfo, enMapaGolfo } from '@/components/noticias/ilustraciones';
import { PortadaMar } from '@/components/noticias/PortadaMar';
import { PausaFuera } from '@/components/noticias/PausaFuera';
import { NadoVaquitas } from '@/components/noticias/MarAnimado';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';
import { ElProyecto, EncabezadoSeccion, Fuentes, PortadaNoticias } from '@/components/noticias/SeccionesNoticias';

export const metadata: Metadata = {
    title: tituloPantalla('Noticias'),
    description: 'Noticias del Alto Golfo de California y de los océanos, el problema de los residuos en cifras, las noticias en el mapa y la historia de SiMAR, con sus fuentes.',
};

const SECCIONES = [
    { id: 'portada', texto: 'Lo último' },
    { id: 'cifras', texto: 'En cifras' },
    { id: 'mapa', texto: 'En el mapa' },
    { id: 'proyecto', texto: 'El proyecto' },
    { id: 'todas', texto: 'Todas' },
    { id: 'glosario', texto: 'Glosario' },
    { id: 'fuentes', texto: 'Fuentes' },
];

const existe = (n: Noticia | null): n is Noticia => n !== null;

/** Los dibujos que tapan el mapa en los lugares sin marca */
const CAPA: Record<string, 'gota' | 'globo'> = { mexico: 'gota', mundo: 'globo' };

/**
 * Noticias: una página informativa aparte, para leer sin la landing. Muy visual, poco texto a la
 * vez y casi todo se ve con sólo bajar (pocos clics). De arriba abajo:
 *  0. La portada, bajo el mar: la vaquita y su cría nadan; el título y un «¿Sabías que...?».
 *  1. Lo último: la más reciente a lo grande y tres más, en mosaico.
 *  2. En cifras (oscuro): los cuatro temas a la vista, cada uno con su escena animada.
 *  3. En el mapa: el mapa del golfo se queda fijo y, al bajar, se acerca a cada lugar.
 *  4. El proyecto: SiMAR en tres ideas y su historia, en una línea que se llena al bajar.
 *  5. Todas, con buscador y filtro; el glosario en tarjetas y las fuentes.
 * La barra de arriba lleva las secciones y marca la que se lee. Los datos están en
 * lib/constants/noticias.ts y el movimiento en globals.css (clases n-*). Ver DISEÑO_SIMAR.md §8.6.
 */
export default async function NoticiasPage({ params }: { params: Promise<{ locale: string }> }) {
    const { locale } = await params;
    const [principal, ...siguientes] = recientes(4);
    // A los componentes de cliente sólo les llega lo de las tarjetas (sin el texto de los artículos)
    const todas = POR_FECHA.map(resumenDe);
    const temas = TEMAS.map(({ articulos, ...t }) => ({
        ...t,
        articulos: articulos
            .map(noticiaPorSlug)
            .filter(existe)
            .map((n) => ({ slug: n.slug, titulo: n.titulo })),
    }));
    // Los capítulos del mapa: sus noticias se dibujan aquí, en el servidor
    const capitulos = LUGARES.map(({ lon, lat, articulos, ...l }) => {
        const noticias = articulos.map(noticiaPorSlug).filter(existe).map(resumenDe);
        return {
            ...l,
            pos: lon !== undefined && lat !== undefined ? enMapaGolfo({ lon, lat }) : undefined,
            cuantas: noticias.length,
            capa: CAPA[l.id] ? <DibujoPortada tipo={CAPA[l.id]} /> : undefined,
            noticias: (
                <ul className="divide-y divide-simar-borde">
                    {noticias.map((n) => (
                        <li key={n.slug} className="py-4 first:pt-0 last:pb-0">
                            <TarjetaNoticia noticia={n} locale={locale} variante="fila" />
                        </li>
                    ))}
                </ul>
            ),
        };
    });
    const cuantas = [
        { cifra: POR_FECHA.length, texto: 'noticias' },
        { cifra: LUGARES.length, texto: 'lugares' },
        { cifra: todasLasFuentes().length, texto: 'fuentes' },
    ];
    const seccion = 'scroll-mt-[164px] px-6 py-20 md:py-28 movil:scroll-mt-[136px] movil:px-5 movil:py-14';

    return (
        <div className="simar-landing min-h-screen bg-simar-papel font-sans text-simar-texto antialiased">
            <EncabezadoNoticias locale={locale}>
                <NavSecciones secciones={SECCIONES} />
            </EncabezadoNoticias>
            <main>
                <PortadaMar locale={locale} cuantas={cuantas} />

                {/* Lo último */}
                <section id="portada" aria-labelledby="portada-titulo" className="scroll-mt-[164px] px-6 pt-12 pb-20 md:pt-16 md:pb-28 movil:scroll-mt-[136px] movil:px-5 movil:pt-8 movil:pb-14">
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="portada-titulo" antetitulo="Lo último" titulo="Lo más reciente del mar." />
                        <div className="mt-10 movil:mt-7">
                            <PortadaNoticias locale={locale} principal={principal} siguientes={siguientes} />
                        </div>
                    </div>
                </section>

                {/* En cifras */}
                <section id="cifras" aria-labelledby="cifras-titulo" className={`${seccion} bg-simar-abismo text-white`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="cifras-titulo" antetitulo="En cifras" titulo="El problema, en cuatro temas." oscuro />
                        <CifrasMar temas={temas} locale={locale} />
                    </div>
                </section>

                {/* En el mapa */}
                <section id="mapa" aria-labelledby="mapa-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="mapa-titulo" antetitulo="En el mapa" titulo="Dónde pasa cada noticia." texto="Baja y el mapa te lleva a cada lugar (las ubicaciones son aproximadas)." />
                        <MapaHistoria
                            mapa={<MapaGolfo />}
                            capitulos={capitulos}
                            vaquita={enMapaGolfo({ lon: -114.15, lat: 30.35 })}
                            panga={enMapaGolfo({ lon: -113.66, lat: 31.17 })}
                        />
                    </div>
                </section>

                {/* El proyecto */}
                <section id="proyecto" aria-labelledby="proyecto-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="proyecto-titulo" antetitulo="El proyecto" titulo="SiMAR, del papel a la pantalla." />
                        <ElProyecto locale={locale} />
                    </div>
                </section>

                {/* Todas */}
                <section id="todas" aria-labelledby="todas-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="todas-titulo" antetitulo="Archivo" titulo="Todas las noticias." texto="Busca una palabra o elige un tema." />
                        <ListaNoticias noticias={todas} locale={locale} />
                    </div>
                </section>

                {/* Glosario */}
                <section id="glosario" aria-labelledby="glosario-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="glosario-titulo" antetitulo="Glosario" titulo="Las palabras del puerto." />
                        <GlosarioTarjetas terminos={GLOSARIO} />
                    </div>
                </section>

                {/* Fuentes */}
                <section id="fuentes" aria-labelledby="fuentes-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="fuentes-titulo" antetitulo="Fuentes" titulo="De dónde sale cada dato." texto="Cada artículo cita las suyas al final. Aquí están todas juntas." />
                        <Fuentes locale={locale} />
                    </div>
                </section>

                {/* Cierre */}
                <section aria-labelledby="cierre-noticias" className="relative isolate overflow-hidden bg-simar-abismo text-white px-6 pt-20 pb-[200px] md:pt-24 md:pb-[230px] movil:px-5 movil:pt-14 movil:pb-[150px]">
                    {/* La vaquita y su cría se despiden, nadando abajo */}
                    <PausaFuera oculto className="absolute inset-0 -z-10">
                        <NadoVaquitas className="bottom-[36px] movil:bottom-[24px]" ancho="clamp(220px,24vw,340px)" dura={38} espera={-16} en="60%" />
                    </PausaFuera>
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

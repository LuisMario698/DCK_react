import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { CATEGORIAS, GLOSARIO, LUGARES, POR_FECHA, TEMAS, noticiaPorSlug, recientes, resumenDe, todasLasFuentes, type CategoriaNoticia, type Noticia } from '@/lib/constants/noticias';
import { hoyPuerto } from '@/lib/utils/fechas';
import { tituloPantalla } from '@/lib/constants/titulo';
import { EncabezadoNoticias } from '@/components/noticias/EncabezadoNoticias';
import { NavSecciones } from '@/components/noticias/NavSecciones';
import { ListaNoticias } from '@/components/noticias/ListaNoticias';
import { CifrasMar } from '@/components/noticias/CifrasMar';
import { MapaHistoria } from '@/components/noticias/MapaHistoria';
import { GlosarioTarjetas } from '@/components/noticias/GlosarioTarjetas';
import { DibujoPortada, MapaGolfo, enMapaGolfo } from '@/components/noticias/ilustraciones';
import { FOTOS, textoCredito, type FotoNoticia } from '@/lib/constants/fotos';
import { TarjetaNoticia } from '@/components/noticias/TarjetaNoticia';
import { ElProyecto, EncabezadoSeccion, Fuentes } from '@/components/noticias/SeccionesNoticias';
import { datosEditorial } from '@/components/noticias/datosEditorial';
import { PortadaEditorial, type ItemTeletipo } from '@/components/noticias/PortadaEditorial';
import { OtrosMedios } from '@/components/noticias/OtrosMedios';
import { letraTitular } from '@/components/noticias/letraTitular';
import { FUENTES_EXTERNAS, fuenteExterna, noticiasExternas, type NoticiasExternas } from '@/lib/services/noticias_externas';

export const metadata: Metadata = {
    title: tituloPantalla('Noticias'),
    description: 'Noticias del Alto Golfo de California y de los océanos, el problema de los residuos en cifras, las noticias en el mapa y la historia de SiMAR, con sus fuentes.',
};

const SECCIONES = [
    { id: 'portada', texto: 'Portada' },
    { id: 'medios', texto: 'Otros medios' },
    { id: 'cifras', texto: 'En cifras' },
    { id: 'mapa', texto: 'En el mapa' },
    { id: 'proyecto', texto: 'El proyecto' },
    { id: 'todas', texto: 'Todas' },
    { id: 'glosario', texto: 'Glosario' },
    { id: 'fuentes', texto: 'Fuentes' },
];

const existe = (n: Noticia | null): n is Noticia => n !== null;

const ZONA = 'America/Hermosillo';

/** «Hace 20 min», «Hace 3 h», «Ayer», «Hace 4 días» o la fecha corta, con el día del puerto */
function cuandoExterna(iso: string, ahora: Date, hoy: string) {
    const fecha = new Date(iso);
    const minutos = Math.max(0, Math.round((ahora.getTime() - fecha.getTime()) / 60_000));
    if (minutos < 60) return minutos <= 1 ? 'Hace un momento' : `Hace ${minutos} min`;
    if (minutos < 12 * 60) return `Hace ${Math.round(minutos / 60)} h`;
    const dia = fecha.toLocaleDateString('en-CA', { timeZone: ZONA });
    const dias = Math.round((Date.parse(`${hoy}T12:00:00Z`) - Date.parse(`${dia}T12:00:00Z`)) / 86_400_000);
    if (dias <= 0) return `Hace ${Math.round(minutos / 60)} h`;
    if (dias === 1) return 'Ayer';
    if (dias < 7) return `Hace ${dias} días`;
    return fecha.toLocaleDateString('es-MX', { day: 'numeric', month: 'short', timeZone: ZONA });
}

/** La foto de cada lugar del mapa (lib/constants/fotos.ts; sin crédito, de SiMAR) */
const FOTO_LUGAR: Record<string, { foto: FotoNoticia; alt: string; posicion?: string }> = {
    golfo: { foto: FOTOS.islaEspirituSanto, alt: 'Agua turquesa frente a la Isla Espíritu Santo, en el Golfo de California', posicion: '50% 60%' },
    penasco: { foto: FOTOS.puertoDePuertoPenasco, alt: 'Barcos camaroneros en el puerto pesquero de Puerto Peñasco', posicion: '50% 55%' },
    altogolfo: { foto: FOTOS.vaquita, alt: 'Una vaquita marina en el Alto Golfo de California', posicion: '45% 50%' },
    costa: { foto: FOTOS.plasticoEnLaPlaya, alt: 'Basura de plástico juntada en una playa', posicion: '50% 50%' },
    mexico: { foto: FOTOS.aceiteDeMotor, alt: 'Aceite de motor que cae de su envase', posicion: '40% 55%' },
    mundo: { foto: FOTOS.olaMarAbierto, alt: 'Una ola en mar abierto', posicion: '50% 50%' },
};

/** Los dibujos que tapan el mapa en los lugares sin marca */
const CAPA: Record<string, 'gota' | 'globo'> = { mexico: 'gota', mundo: 'globo' };

/**
 * Noticias: una página informativa aparte, para leer sin la landing. Muy visual, poco texto a la
 * vez y casi todo se ve con sólo bajar (pocos clics). De arriba abajo:
 *  0. La portada (PortadaEditorial), como la de un periódico: la cabecera con la fecha, la cinta
 *     «Al momento», la nota principal con su foto y «También hoy».
 *  1. Otros medios (OtrosMedios): lo que publican sobre el mar medios con licencia abierta, leído
 *     de sus canales cada hora (lib/services/noticias_externas.ts). Si no hay, no sale.
 *  2. En cifras (oscuro): los cuatro temas a la vista, cada uno con su escena.
 *  3. En el mapa: el mapa del golfo se queda fijo y, al bajar, se acerca a cada lugar.
 *  4. El proyecto: SiMAR en tres ideas y su historia, en una línea que se llena al bajar.
 *  5. El archivo (ListaNoticias): buscador, temas y vista en cuadrícula o lista; el glosario y
 *     las fuentes. Con ?tema=…&q=… el archivo abre ya filtrado.
 * La barra de arriba lleva las secciones y marca la que se lee. Los datos están en
 * lib/constants/noticias.ts y el movimiento en globals.css (clases n-*). Ver DISEÑO_SIMAR.md §8.6.
 */
export default async function NoticiasPage({
    params,
    searchParams,
}: {
    params: Promise<{ locale: string }>;
    searchParams: Promise<{ tema?: string | string[]; q?: string | string[] }>;
}) {
    const { locale } = await params;
    const busca = await searchParams;
    const uno = (v?: string | string[]) => (Array.isArray(v) ? v[0] : v) ?? '';
    const temaPedido = CATEGORIAS.find((c) => c === uno(busca.tema)) ?? null;
    const busquedaPedida = uno(busca.q).slice(0, 60);
    // Con el día del puerto: «Hoy», «Ayer», «Hace 3 días»
    const hoy = hoyPuerto();
    const ahora = new Date();
    const [principal, ...siguientes] = recientes(5).map((n) => datosEditorial(n, hoy));
    // Otros medios (guardados una hora); si fallan, la página sigue sin ellos
    const externas: NoticiasExternas = await noticiasExternas().catch(() => ({ notas: [], leidas: '' }));
    const notasExternas = externas.notas.map((n) => ({
        ...n,
        cuando: cuandoExterna(n.fecha, ahora, hoy),
        fechaTexto: new Date(n.fecha).toLocaleString('es-MX', { dateStyle: 'long', timeStyle: 'short', timeZone: ZONA }),
    }));
    const actualizado = externas.leidas
        ? new Date(externas.leidas).toLocaleTimeString('es-MX', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: ZONA })
        : null;
    const fechaHoy = new Date(`${hoy}T12:00:00Z`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    // La cinta «Al momento»: lo más nuevo de SiMAR y de los otros medios, revuelto por fecha
    const teletipo: ItemTeletipo[] = [
        ...[principal, ...siguientes].slice(0, 3).map((n) => ({ titulo: n.titulo, url: `/${locale}/noticias/${n.slug}`, fuente: 'SiMAR', externa: false, fecha: `${n.fecha}T12:00:00Z` })),
        ...externas.notas.slice(0, 6).map((n) => ({ titulo: n.titulo, url: n.url, fuente: fuenteExterna(n.fuente).nombre, externa: true, fecha: n.fecha })),
    ]
        .sort((a, b) => b.fecha.localeCompare(a.fecha))
        .map((it) => ({ titulo: it.titulo, url: it.url, fuente: it.fuente, externa: it.externa }));
    const medios = FUENTES_EXTERNAS.map((md) => ({ id: md.id, nombre: md.nombre, sitio: md.sitio, descripcion: md.descripcion, licencia: md.licencia, licenciaUrl: md.licenciaUrl }));
    const secciones = SECCIONES.filter((sec) => sec.id !== 'medios' || notasExternas.length > 0);
    // El número de cada sección en su encabezado («01 — Otros medios»), sin contar la portada
    const numero = (id: string) => String(secciones.findIndex((sec) => sec.id === id)).padStart(2, '0');
    // A los componentes de cliente sólo les llega lo de las tarjetas (sin el texto de los artículos)
    const archivo = POR_FECHA.map((n) => datosEditorial(n, hoy));
    const temasArchivo: CategoriaNoticia[] = CATEGORIAS.filter((c) => archivo.some((n) => n.categoria === c));
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
            centro: lon !== undefined && lat !== undefined ? ([lon, lat] as [number, number]) : undefined,
            foto: FOTO_LUGAR[l.id] && { src: FOTO_LUGAR[l.id].foto.src, alt: FOTO_LUGAR[l.id].alt, posicion: FOTO_LUGAR[l.id].posicion, credito: FOTO_LUGAR[l.id].foto.credito },
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
    const cifras = [
        { cifra: POR_FECHA.length, texto: 'notas' },
        { cifra: new Set(externas.notas.map((n) => n.fuente)).size, texto: 'medios' },
        { cifra: todasLasFuentes().length, texto: 'fuentes' },
    ].filter((c) => c.cifra > 0);
    const seccion = 'scroll-mt-[164px] px-6 py-20 md:py-28 movil:scroll-mt-[136px] movil:px-5 movil:py-14';

    return (
        <div className={`simar-landing n-pagina ${letraTitular.variable} min-h-screen bg-simar-papel font-sans text-simar-texto antialiased`}>
            <EncabezadoNoticias locale={locale}>
                <NavSecciones secciones={secciones} />
            </EncabezadoNoticias>
            <main>
                <PortadaEditorial
                    locale={locale}
                    datos={{ fechaHoy: fechaHoy.charAt(0).toUpperCase() + fechaHoy.slice(1), actualizado, cifras, principal, recientes: siguientes, teletipo }}
                />

                {/* Otros medios */}
                {notasExternas.length > 0 && (
                    <section id="medios" aria-labelledby="medios-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                        <div className="max-w-[1248px] mx-auto">
                            <EncabezadoSeccion
                                id="medios-titulo"
                                numero={numero('medios')}
                                antetitulo="Otros medios"
                                titulo="Lo que se publica sobre el mar."
                                texto="De medios con licencia abierta. Cada nota abre en su sitio original."
                            />
                            <OtrosMedios notas={notasExternas} medios={medios} actualizado={actualizado} />
                        </div>
                    </section>
                )}

                {/* En cifras */}
                <section id="cifras" aria-labelledby="cifras-titulo" className={`${seccion} bg-simar-abismo text-white`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="cifras-titulo" numero={numero('cifras')} antetitulo="En cifras" titulo="El problema, en cuatro temas." oscuro />
                        <CifrasMar temas={temas} locale={locale} />
                    </div>
                </section>

                {/* En el mapa */}
                <section id="mapa" aria-labelledby="mapa-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion
                            id="mapa-titulo"
                            numero={numero('mapa')}
                            antetitulo="En el mapa"
                            titulo="Dónde pasa cada noticia."
                            texto="Baja y el mapa te lleva a cada lugar: del golfo entero a Puerto Peñasco, al Alto Golfo y al mundo. También lo puedes mover y acercar."
                        />
                        <MapaHistoria mapa={<MapaGolfo />} capitulos={capitulos} />
                    </div>
                </section>

                {/* El proyecto */}
                <section id="proyecto" aria-labelledby="proyecto-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="proyecto-titulo" numero={numero('proyecto')} antetitulo="El proyecto" titulo="SiMAR, del papel a la pantalla." />
                        <ElProyecto locale={locale} />
                    </div>
                </section>

                {/* Todas */}
                <section id="todas" aria-labelledby="todas-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="todas-titulo" numero={numero('todas')} antetitulo="Archivo" titulo="Todas las noticias." texto="Busca una palabra o elige un tema." />
                        <ListaNoticias notas={archivo} temas={temasArchivo} locale={locale} temaInicial={temaPedido} busquedaInicial={busquedaPedida} />
                    </div>
                </section>

                {/* Glosario */}
                <section id="glosario" aria-labelledby="glosario-titulo" className={`${seccion} bg-simar-superficie/60 border-y border-simar-borde`}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="glosario-titulo" numero={numero('glosario')} antetitulo="Glosario" titulo="Las palabras del puerto." />
                        <GlosarioTarjetas terminos={GLOSARIO} />
                    </div>
                </section>

                {/* Fuentes */}
                <section id="fuentes" aria-labelledby="fuentes-titulo" className={seccion}>
                    <div className="max-w-[1248px] mx-auto">
                        <EncabezadoSeccion id="fuentes-titulo" numero={numero('fuentes')} antetitulo="Fuentes" titulo="De dónde sale cada dato." texto="Cada artículo cita las suyas al final. Aquí están todas juntas." />
                        <Fuentes locale={locale} />
                    </div>
                </section>

                {/* Cierre */}
                <section aria-labelledby="cierre-noticias" className="relative isolate overflow-hidden bg-simar-abismo text-white px-6 pt-[220px] pb-20 md:pt-[300px] md:pb-24 movil:px-5 movil:pt-[180px] movil:pb-14">
                    {/* La flota camaronera de Puerto Peñasco al atardecer, de fondo */}
                    <figure className="absolute inset-0 -z-10">
                        <Image
                            src={FOTOS.flotaDePuertoPenasco.src}
                            alt="La flota camaronera de Puerto Peñasco en el muelle, al atardecer"
                            fill
                            sizes="100vw"
                            className="object-cover"
                            style={{ objectPosition: '50% 45%' }}
                        />
                        <span aria-hidden="true" className="absolute inset-0 bg-gradient-to-t from-simar-abismo via-simar-abismo/75 to-simar-abismo/10" />
                        <figcaption className="absolute right-5 top-4 text-[13px] text-white/80 [text-shadow:0_1px_6px_rgba(0,0,0,0.6)]">
                            <a href={FOTOS.flotaDePuertoPenasco.credito.pagina} target="_blank" rel="noopener noreferrer" className="hover:text-white hover:underline">
                                {textoCredito(FOTOS.flotaDePuertoPenasco.credito)}
                                <span className="sr-only"> (abre en otra pestaña)</span>
                            </a>
                        </figcaption>
                    </figure>
                    <div className="max-w-[1248px] mx-auto flex flex-wrap items-end justify-between gap-8">
                        <div className="max-w-2xl">
                            <p className="text-[15px] font-extrabold uppercase tracking-[0.14em] text-simar-espuma">Puerto Peñasco, Sonora</p>
                            <h2 id="cierre-noticias" className="mt-3 font-titular text-[clamp(38px,4.4vw,64px)] font-semibold leading-[1.02] tracking-[-0.02em] text-balance movil:text-[34px]">
                                Del papel al dato. Del dato, a un mar más limpio.
                            </h2>
                            <p className="mt-4 text-xl leading-relaxed text-simar-franja-texto-2 movil:text-[17px]">Mira cómo SiMAR registra cada entrega en el centro de acopio.</p>
                        </div>
                        <Link
                            href={`/${locale}#como-funciona`}
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

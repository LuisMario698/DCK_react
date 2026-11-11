import { unstable_cache } from 'next/cache';
import { XMLParser } from 'fast-xml-parser';

/**
 * Noticias de otros medios para la página de Noticias: se leen de sus canales RSS/Atom públicos
 * en el servidor, se quedan las que hablan del mar, la costa, la pesca o los residuos, y se
 * guardan una hora (unstable_cache). Sólo de servidor: no lo importes desde un componente de
 * cliente.
 *
 * Qué se muestra de cada una: el titular, el resumen que da el propio canal (recortado), el medio,
 * el autor, la fecha y el enlace al original. No se copia el texto completo ni sus fotos (en varios
 * medios las fotos son de agencias y no entran en su licencia). Así se cumple con cada licencia:
 *  - Agencia SINC: CC BY 4.0, citando a SINC y al autor, con enlace (y sin que SINC sea la mayor
 *    parte de lo publicado: por eso hay un tope por medio).
 *  - Mongabay Latam: CC BY-NC-ND 4.0; titular y resumen con crédito y enlace.
 *  - The Conversation: CC BY-ND 4.0; permite extractos con enlace a la nota completa.
 *  - Noticias ONU: el material de noticias se puede usar dando el crédito.
 * Si un canal no responde, simplemente no aparece (nunca rompe la página).
 */

export type IdFuenteExterna = 'mongabay' | 'sinc' | 'onu' | 'conversation';

export interface FuenteExterna {
    id: IdFuenteExterna;
    nombre: string;
    sitio: string;
    /** De dónde es y de qué escribe, en una línea */
    descripcion: string;
    licencia: string;
    licenciaUrl: string;
    canales: string[];
}

export const FUENTES_EXTERNAS: FuenteExterna[] = [
    {
        id: 'mongabay',
        nombre: 'Mongabay Latam',
        sitio: 'https://es.mongabay.com',
        descripcion: 'Periodismo ambiental independiente de América Latina',
        licencia: 'CC BY-NC-ND 4.0',
        licenciaUrl: 'https://es.mongabay.com/utilice-contenido-mongabay-creative-commons-by-nc-nd/',
        canales: ['https://es.mongabay.com/feed/'],
    },
    {
        id: 'sinc',
        nombre: 'Agencia SINC',
        sitio: 'https://www.agenciasinc.es',
        descripcion: 'Agencia pública de noticias de ciencia (FECYT, España)',
        licencia: 'CC BY 4.0',
        licenciaUrl: 'https://www.agenciasinc.es/Quienes-somos/Licencia-CC',
        canales: ['https://www.agenciasinc.es/feed/Tierra'],
    },
    {
        id: 'onu',
        nombre: 'Noticias ONU',
        sitio: 'https://news.un.org/es/',
        descripcion: 'El servicio de noticias de las Naciones Unidas',
        licencia: 'Material de noticias, con crédito',
        licenciaUrl: 'https://www.un.org/es/about-us/copyright',
        canales: ['https://news.un.org/feed/subscribe/es/news/topic/climate-change/feed/rss.xml', 'https://news.un.org/feed/subscribe/es/news/all/rss.xml'],
    },
    {
        id: 'conversation',
        nombre: 'The Conversation',
        sitio: 'https://theconversation.com/es',
        descripcion: 'Artículos de investigadores universitarios',
        licencia: 'CC BY-ND 4.0',
        licenciaUrl: 'https://theconversation.com/es/republishing-guidelines',
        canales: ['https://theconversation.com/es/articles.atom'],
    },
];

export interface NoticiaExterna {
    url: string;
    titulo: string;
    resumen: string;
    /** ISO */
    fecha: string;
    fuente: IdFuenteExterna;
    autor?: string;
    /** Habla de México o del Golfo de California */
    deMexico: boolean;
}

export interface NoticiasExternas {
    notas: NoticiaExterna[];
    /** Cuándo se leyeron los canales (ISO) */
    leidas: string;
}

const AGENTE = 'SiMAR-Noticias/1.0 (lector de canales RSS publicos; enlaza al original)';
const POR_FUENTE = 4;
const MAXIMO = 14;
/** Más viejas que esto no se muestran */
const DIAS_VIGENCIA = 45;

/** Sin acentos ni mayúsculas ni signos, con espacios a los lados (para buscar palabras enteras) */
const normal = (t: string) =>
    ` ${t
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toLowerCase()
        .replace(/[^a-z0-9ñ]+/g, ' ')} `;

/** Palabras que hacen relevante una nota para SiMAR, con su peso */
const FUERTES = ['golfo de california', 'mar de cortes', 'alto golfo', 'vaquita', 'puerto penasco', 'totoaba', 'redes fantasma', 'red fantasma', 'marpol', 'basura marina', 'residuos marinos', 'contaminacion marina', 'microplasticos', 'microplastico', 'alta mar'];
const MEDIAS = ['oceano', 'oceanos', 'marino', 'marina', 'marinos', 'marinas', 'mar', 'mares', 'costa', 'costas', 'costero', 'costera', 'costeros', 'playa', 'playas', 'pesca', 'pesquera', 'pesquero', 'pesqueros', 'pescadores', 'arrecife', 'arrecifes', 'coral', 'corales', 'ballena', 'ballenas', 'tiburon', 'tiburones', 'tortuga', 'tortugas', 'manglar', 'manglares', 'plastico', 'plasticos', 'derrame', 'petroleo', 'puerto', 'puertos', 'buque', 'buques', 'barco', 'barcos'];
const DEBILES = ['basura', 'residuos', 'desechos', 'contaminacion', 'agua', 'clima', 'biodiversidad', 'especies', 'reciclaje', 'aceite'];
const MEXICO = ['mexico', 'mexicano', 'mexicana', 'sonora', 'baja california', 'sinaloa', 'golfo de california', 'mar de cortes', 'alto golfo', 'vaquita', 'puerto penasco', 'yucatan', 'veracruz', 'quintana roo'];

const tiene = (texto: string, palabra: string) => texto.includes(` ${palabra} `);

function relevancia(texto: string) {
    let puntos = 0;
    for (const p of FUERTES) if (tiene(texto, p)) puntos += 4;
    for (const p of MEDIAS) if (tiene(texto, p)) puntos += 2;
    for (const p of DEBILES) if (tiene(texto, p)) puntos += 1;
    return puntos;
}

const lector = new XMLParser({
    ignoreAttributes: false,
    attributeNamePrefix: '@',
    textNodeName: '#text',
    cdataPropName: false,
    processEntities: true,
    htmlEntities: true,
    trimValues: true,
});

type Nodo = string | number | { '#text'?: string; '@href'?: string; '@rel'?: string; '@isPermaLink'?: string; name?: unknown } | undefined;

const texto = (n: unknown): string => {
    if (n == null) return '';
    if (typeof n === 'string' || typeof n === 'number') return String(n);
    if (Array.isArray(n)) return texto(n[0]);
    if (typeof n === 'object') {
        const o = n as Record<string, unknown>;
        if ('#text' in o) return texto(o['#text']);
        if ('name' in o) return texto(o.name);
    }
    return '';
};

const ENTIDADES: Record<string, string> = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ', laquo: '«', raquo: '»', hellip: '…', ndash: '–', mdash: '—' };

/** El HTML de un resumen, en texto limpio: sin figuras ni etiquetas, con las entidades resueltas */
function limpio(html: string) {
    return html
        .replace(/<figure[\s\S]*?<\/figure>/gi, ' ')
        .replace(/<(script|style)[\s\S]*?<\/\1>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&(#\d+|#x[0-9a-f]+|[a-z]+);/gi, (m, e: string) => {
            if (e[0] === '#') {
                const n = e[1] === 'x' || e[1] === 'X' ? parseInt(e.slice(2), 16) : parseInt(e.slice(1), 10);
                return Number.isFinite(n) ? String.fromCodePoint(n) : m;
            }
            return ENTIDADES[e.toLowerCase()] ?? m;
        })
        .replace(/Elige a Mongabay Latam como fuente preferida en Google/gi, '')
        .replace(/\s+/g, ' ')
        .trim();
}

/** Recorta en la última palabra completa antes de `max` y cierra con «…» */
function recortar(t: string, max = 230) {
    if (t.length <= max) return t;
    const corte = t.slice(0, max);
    return `${corte.slice(0, corte.lastIndexOf(' ')).replace(/[,;:.\s]+$/, '')}…`;
}

function enlaceDe(item: Record<string, unknown>): string {
    // Noticias ONU: el guid permanente es la dirección limpia (el link pasa por un contador)
    const guid = item.guid as Nodo;
    if (guid && typeof guid === 'object' && guid['@isPermaLink'] === 'true' && texto(guid).startsWith('http')) return texto(guid);
    const link = item.link as Nodo | Nodo[];
    if (Array.isArray(link)) {
        const alterno = link.find((l) => typeof l === 'object' && l && (l['@rel'] ?? 'alternate') === 'alternate') ?? link[0];
        return typeof alterno === 'object' && alterno ? (alterno['@href'] ?? texto(alterno)) : texto(alterno);
    }
    if (link && typeof link === 'object') return link['@href'] ?? texto(link);
    return texto(link);
}

async function leerCanal(fuente: FuenteExterna, url: string): Promise<(NoticiaExterna & { puntos: number })[]> {
    const respuesta = await fetch(url, {
        headers: { 'User-Agent': AGENTE, Accept: 'application/rss+xml, application/atom+xml, application/xml;q=0.9, */*;q=0.8' },
        signal: AbortSignal.timeout(9000),
        cache: 'no-store',
    });
    if (!respuesta.ok) throw new Error(`${fuente.id}: ${respuesta.status}`);
    const xml = lector.parse(await respuesta.text()) as Record<string, any>; // eslint-disable-line @typescript-eslint/no-explicit-any
    const crudos: Record<string, unknown>[] = [xml.rss?.channel?.item ?? xml.feed?.entry ?? []].flat();
    const limite = Date.now() - DIAS_VIGENCIA * 86_400_000;

    return crudos.flatMap((item) => {
        const titulo = limpio(texto(item.title));
        const enlace = enlaceDe(item).replace(/^http:\/\//, 'https://');
        const fecha = new Date(texto(item.pubDate ?? item.published ?? item.updated ?? item['dc:date']));
        if (!titulo || !enlace.startsWith('https://') || Number.isNaN(fecha.getTime()) || fecha.getTime() < limite) return [];
        const resumen = recortar(limpio(texto(item.description ?? item.summary ?? item.content ?? item['content:encoded'])));
        const lugares = texto(item.locations);
        const todo = normal(`${titulo} ${titulo} ${resumen} ${texto(item['topic-tags'])} ${lugares}`);
        const puntos = relevancia(todo);
        if (puntos < 4) return [];
        const autor = limpio(texto(item['dc:creator'] ?? item.author)).replace(/^por\s+/i, '') || undefined;
        return [
            {
                url: enlace,
                titulo,
                resumen,
                fecha: fecha.toISOString(),
                fuente: fuente.id,
                autor: autor && autor.length < 80 ? autor : undefined,
                deMexico: MEXICO.some((p) => tiene(todo, p)),
                puntos,
            },
        ];
    });
}

async function leerTodas(): Promise<NoticiasExternas> {
    const lecturas = await Promise.allSettled(FUENTES_EXTERNAS.flatMap((f) => f.canales.map((c) => leerCanal(f, c))));
    // Sin repetidas: la misma dirección o el mismo titular (SINC y ONU a veces publican la misma)
    const vistas = new Set<string>();
    const todas = lecturas
        .flatMap((l) => (l.status === 'fulfilled' ? l.value : []))
        .filter((n) => {
            const claves = [n.url, normal(n.titulo)];
            if (claves.some((c) => vistas.has(c))) return false;
            claves.forEach((c) => vistas.add(c));
            return true;
        })
        // Primero lo de México y lo más relevante; dentro, lo más nuevo
        .sort((a, b) => Number(b.deMexico) - Number(a.deMexico) || b.puntos - a.puntos || b.fecha.localeCompare(a.fecha));

    // A lo más POR_FUENTE de cada medio, para que haya de todos (y ninguno sea la mayoría)
    const cuenta = new Map<IdFuenteExterna, number>();
    const elegidas = todas.filter((n) => {
        const c = cuenta.get(n.fuente) ?? 0;
        if (c >= POR_FUENTE) return false;
        cuenta.set(n.fuente, c + 1);
        return true;
    });

    return {
        notas: elegidas
            .slice(0, MAXIMO)
            .sort((a, b) => b.fecha.localeCompare(a.fecha))
            .map(({ puntos: _puntos, ...n }) => n), // eslint-disable-line @typescript-eslint/no-unused-vars
        leidas: new Date().toISOString(),
    };
}

/** Las noticias de otros medios, leídas a lo más una vez por hora */
export const noticiasExternas = unstable_cache(leerTodas, ['noticias-externas-v2'], { revalidate: 3600, tags: ['noticias-externas'] });

export const fuenteExterna = (id: IdFuenteExterna) => FUENTES_EXTERNAS.find((f) => f.id === id)!;

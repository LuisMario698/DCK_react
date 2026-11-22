import { fechaNoticia, POR_FECHA, recientes, todasLasFuentes } from '@/lib/constants/noticias';
import { hoyPuerto } from '@/lib/utils/fechas';
import { datosEditorial } from '@/components/noticias/datosEditorial';
import { letraTitularDiferida } from '@/components/noticias/letraTitularDiferida';
import { previaDe } from '@/lib/constants/previas';
import { aguaProtegidaL } from '@/lib/utils/equivalencias';
import type { LandingStats } from '@/lib/services/landing_stats';
import { NoticiasDiario } from './NoticiasDiario';
import { CorreoMensual, type DatosCorreo } from './CorreoMensual';

const mayuscula = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const numero = (n: number) => Math.round(n).toLocaleString('es-MX');
/** 2,909,000,000 → «2,909 millones»; 1,500,000,000,000 → «1.5 billones» (escala larga, como en México) */
function enPalabras(n: number) {
    if (n >= 1e12) return `${(n / 1e12).toLocaleString('es-MX', { maximumFractionDigits: 1 })} billones`;
    if (n >= 1e6) return `${numero(n / 1e6)} millones`;
    return numero(n);
}

/**
 * Lo que muestra la vista previa del correo del mes: el mes, las dos ediciones anteriores, el
 * próximo envío (el primer lunes del mes que sigue), un asunto con lo de este mes, los tres
 * titulares más nuevos y las cifras de siempre (totales: no hay cifras por mes en la landing).
 */
function datosDelCorreo(hoy: string, stats: LandingStats | null | undefined): DatosCorreo {
    const [anio, mes] = hoy.split('-').map(Number);
    const fecha = (a: number, m: number, d = 1) => new Date(Date.UTC(a, m - 1, d, 12));
    const nombreMes = (d: Date, conAnio = false) =>
        d.toLocaleDateString('es-MX', { month: 'long', ...(conAnio ? { year: 'numeric' } : {}), timeZone: 'UTC' });
    const anteriores = [1, 2].map((k) => mayuscula(nombreMes(fecha(anio, mes - k))));
    // Primer lunes del mes que sigue (getUTCDay: 0 = domingo, 1 = lunes)
    const primero = fecha(anio, mes + 1);
    const lunes = fecha(primero.getUTCFullYear(), primero.getUTCMonth() + 1, 1 + ((8 - primero.getUTCDay()) % 7));
    const proximo = lunes.toLocaleDateString('es-MX', { weekday: 'short', day: 'numeric', month: 'short', timeZone: 'UTC' }).replace(/[.,]/g, '');
    const delMes = POR_FECHA.filter((n) => n.fecha.startsWith(hoy.slice(0, 7))).length;
    const mesCorto = mayuscula(nombreMes(fecha(anio, mes)));
    const cifras: DatosCorreo['cifras'] = [];
    if (stats && stats.totalAceiteUsado > 0) {
        cifras.push({ valor: `${numero(stats.totalAceiteUsado)} L`, texto: 'de aceite usado que no llegó al mar' });
        cifras.push({ valor: enPalabras(aguaProtegidaL(stats.totalAceiteUsado)), texto: 'de litros de agua protegidos' });
    }
    return {
        mes: mayuscula(nombreMes(fecha(anio, mes), true)),
        anteriores,
        proximo,
        asunto:
            delMes > 0
                ? `${mesCorto} en el Golfo: ${delMes} ${delMes === 1 ? 'nota nueva' : 'notas nuevas'} y lo que no llegó al mar`
                : `${mesCorto} en el Golfo: lo nuevo de Noticias del Mar`,
        titulares: recientes(3).map((n) => ({ titulo: n.titulo, categoria: n.categoria })),
        cifras,
    };
}

/**
 * Las noticias de la landing Actual (va sobre su franja oscura). Este componente de servidor
 * prepara lo mismo que la portada de Noticias (la nota principal y las cuatro siguientes, sin el
 * cuerpo de los artículos) y lo pasa a NoticiasDiario, que lo dibuja como la hoja de un periódico.
 * Debajo, el correo del mes (CorreoMensual), con la vista previa armada aquí.
 */
export function NoticiasPortada({ locale, stats }: { locale: string; stats?: LandingStats | null }) {
    const hoy = hoyPuerto();
    const [principal, ...siguientes] = recientes(5).map((n) => datosEditorial(n, hoy));
    if (!principal) return null;
    const masNueva = POR_FECHA[0];
    const fechaHoy = new Date(`${hoy}T12:00:00Z`).toLocaleDateString('es-MX', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric', timeZone: 'UTC' });
    const cifras = [
        { cifra: POR_FECHA.length, texto: 'notas' },
        { cifra: todasLasFuentes().length, texto: 'fuentes' },
    ].filter((c) => c.cifra > 0);
    // Para el abanico del banner: fotos de notas que no están en la hoja (si faltan, de las que sí)
    const enLaHoja = new Set([principal, ...siguientes.slice(0, 4)].map((n) => n.slug));
    const conFoto = POR_FECHA.filter((n) => n.imagen);
    const muestras = [...conFoto.filter((n) => !enLaHoja.has(n.slug)), ...conFoto.filter((n) => enLaHoja.has(n.slug))]
        .slice(0, 3)
        .map((n) => ({ src: n.imagen!.src, posicion: n.imagen!.posicion, previa: previaDe(n.imagen!.src) }));

    // La letra de los titulares (Newsreader) sólo se pide aquí y en Noticias
    return (
        <div className={letraTitularDiferida.variable}>
            <NoticiasDiario
                locale={locale}
                datos={{
                    fechaHoy,
                    ultima: fechaNoticia(masNueva),
                    ultimaIso: masNueva.fecha,
                    cifras,
                    principal,
                    recientes: siguientes.slice(0, 4),
                    cuantas: POR_FECHA.length,
                    muestras,
                }}
            />
            {/* Destino de «Recibe el correo del mes» (Tres caminos y el pie) */}
            <div id="correo-del-mes" className="scroll-mt-[104px]">
                <CorreoMensual datos={datosDelCorreo(hoy, stats)} href={`/${locale}/noticias`} />
            </div>
        </div>
    );
}

import { fechaNoticia, POR_FECHA, recientes, todasLasFuentes } from '@/lib/constants/noticias';
import { hoyPuerto } from '@/lib/utils/fechas';
import { datosEditorial } from '@/components/noticias/datosEditorial';
import { letraTitularDiferida } from '@/components/noticias/letraTitularDiferida';
import { previaDe } from '@/lib/constants/previas';
import { NoticiasDiario } from './NoticiasDiario';

/**
 * Las noticias de la landing Actual (va sobre su franja oscura). Este componente de servidor
 * prepara lo mismo que la portada de Noticias (la nota principal y las cuatro siguientes, sin el
 * cuerpo de los artículos) y lo pasa a NoticiasDiario, que lo dibuja como la hoja de un periódico.
 */
export function NoticiasPortada({ locale }: { locale: string }) {
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
        </div>
    );
}

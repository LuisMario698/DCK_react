import { cuandoFue, fechaNoticia, ILUSTRACION_DE, minutosDeLectura, type Noticia } from '@/lib/constants/noticias';
import { previaDe } from '@/lib/constants/previas';
import type { DatosEditorial } from './TarjetaEditorial';

/**
 * Lo que dibuja una tarjeta editorial, ya resuelto en el servidor (fecha relativa con el día del
 * puerto, dibujo de su tema, minutos). Sin el cuerpo del artículo: es lo que viaja a los
 * componentes de cliente. `hoy` = hoyPuerto().
 */
export function datosEditorial(n: Noticia, hoy: string): DatosEditorial {
    return {
        slug: n.slug,
        titulo: n.titulo,
        categoria: n.categoria,
        fecha: n.fecha,
        soloMes: n.soloMes,
        resumen: n.resumen,
        imagen: n.imagen,
        previa: previaDe(n.imagen?.src),
        ilustracion: n.ilustracion ?? ILUSTRACION_DE[n.categoria],
        minutos: minutosDeLectura(n),
        cuando: cuandoFue(n, hoy),
        fechaTexto: fechaNoticia(n),
    };
}

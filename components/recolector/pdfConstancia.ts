/**
 * Constancia anual de recolección (portal de empresas): un PDF con todo lo que la empresa se llevó
 * del centro de acopio en un año, para sus propios trámites ambientales. Totales por material (cada
 * uno en su unidad), cada recolección con su folio y renglones para firmar.
 *
 * Mismo estilo que el reporte del mes (components/dashboard/pdfReporteMensual.ts). Sólo jsPDF, en el
 * cliente; se carga al tocar el botón. Los datos ya están en el Historial: no hace otra consulta.
 */
import jsPDF from 'jspdf';
import { PUERTO_PENASCO, TIPO_RESIDUO_LABEL, formatCantidad, unidadEscrita, type TipoResiduo, type UnidadResiduo } from '@/lib/constants/residuos';
import type { AsociacionRecolectora, Recoleccion } from '@/types/database';
import { C, cargarSimbolo, type RGB } from '@/components/dashboard/pdfEstadisticas';

const fechaCorta = (t: string) => {
    const [a, m, d] = t.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short', year: 'numeric' });
};
const cantidad = (n: number, u: UnidadResiduo) => `${formatCantidad(n)} ${unidadEscrita(u, n)}`;

interface Columna {
    titulo: string;
    ancho: number;
    derecha?: boolean;
}

export async function descargarConstancia(empresa: AsociacionRecolectora, recolecciones: Recoleccion[], anio: number) {
    const doc = crearConstancia(empresa, recolecciones, anio, await cargarSimbolo());
    const nombre = empresa.nombre_asociacion
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/[^A-Za-z0-9]+/g, '_')
        .replace(/^_|_$/g, '');
    doc.save(`SiMAR_constancia_${nombre}_${anio}.pdf`);
}

/** Arma el PDF (sin guardarlo). Sólo toma las recolecciones de `anio` */
export function crearConstancia(empresa: AsociacionRecolectora, todas: Recoleccion[], anio: number, logo: string | null) {
    const recs = todas.filter((r) => r.fecha.startsWith(`${anio}-`)).sort((a, b) => a.fecha.localeCompare(b.fecha) || a.folio.localeCompare(b.folio));
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const M = 18;
    const util = ancho - M * 2;
    let y = M;

    const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
    const relleno = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
    const linea = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
    const texto = (t: string, x: number, yy: number, o: { tam?: number; negrita?: boolean; c?: RGB; alinear?: 'left' | 'right' | 'center'; ancho?: number } = {}) => {
        doc.setFont('helvetica', o.negrita ? 'bold' : 'normal');
        doc.setFontSize(o.tam ?? 10);
        color(o.c ?? C.texto);
        const lineas = o.ancho ? (doc.splitTextToSize(t, o.ancho) as string[]) : [t];
        doc.text(lineas, x, yy, { align: o.alinear ?? 'left' });
        return lineas.length * (o.tam ?? 10) * 0.45;
    };
    const recortar = (t: string, anchoMax: number) => {
        if (doc.getTextWidth(t) <= anchoMax) return t;
        let s = t;
        while (s.length > 1 && doc.getTextWidth(s + '...') > anchoMax) s = s.slice(0, -1);
        return s.trimEnd() + '...';
    };
    const asegurar = (necesario: number) => {
        if (y + necesario > alto - 20) {
            doc.addPage();
            y = M;
            return true;
        }
        return false;
    };
    const titulo = (t: string) => {
        asegurar(24);
        y += 6;
        texto(t, M, y, { tam: 13, negrita: true });
        y += 4;
    };
    /** Tabla con encabezado (se repite en cada hoja) */
    const tabla = (columnas: Columna[], filas: string[][]) => {
        const altoFila = 6.6;
        const encabezado = () => {
            relleno(C.papel);
            doc.rect(M, y, util, altoFila + 0.6, 'F');
            let x = M;
            for (const c of columnas) {
                texto(c.titulo, c.derecha ? x + c.ancho - 2 : x + 2, y + 4.6, { tam: 8.5, negrita: true, c: C.texto2, alinear: c.derecha ? 'right' : 'left' });
                x += c.ancho;
            }
            y += altoFila + 0.6;
        };
        asegurar(altoFila * 3);
        encabezado();
        for (const celdas of filas) {
            if (asegurar(altoFila + 2)) encabezado();
            let x = M;
            celdas.forEach((valor, i) => {
                const c = columnas[i];
                doc.setFont('helvetica', 'normal').setFontSize(9);
                texto(recortar(valor, c.ancho - 4), c.derecha ? x + c.ancho - 2 : x + 2, y + 4.6, { tam: 9, alinear: c.derecha ? 'right' : 'left' });
                x += c.ancho;
            });
            linea(C.borde);
            doc.setLineWidth(0.2);
            doc.line(M, y + altoFila, M + util, y + altoFila);
            y += altoFila;
        }
        y += 2;
    };

    // ── Encabezado ────────────────────────────────────────────────────────────
    if (logo) doc.addImage(logo, 'PNG', M, y - 2, 14, 14);
    const xTitulo = logo ? M + 18 : M;
    texto('SiMAR', xTitulo, y + 4, { tam: 18, negrita: true, c: C.marea });
    texto(`Centro de acopio de ${PUERTO_PENASCO.nombre}, ${PUERTO_PENASCO.region}`, xTitulo, y + 10, { tam: 9, c: C.texto2 });
    texto(`Año ${anio}`, ancho - M, y + 4, { tam: 12, negrita: true, alinear: 'right' });
    texto(`Generada el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`, ancho - M, y + 10, { tam: 8.5, c: C.texto2, alinear: 'right' });
    y += 16;
    relleno(C.marea);
    doc.rect(M, y, util, 0.8, 'F');
    y += 12;

    texto('Constancia de recolección de residuos', ancho / 2, y, { tam: 16, negrita: true, alinear: 'center' });
    y += 10;

    // ── La constancia en una frase ────────────────────────────────────────────
    const quien = [
        empresa.nombre_asociacion,
        empresa.rfc ? `(RFC ${empresa.rfc})` : null,
        empresa.direccion || empresa.ubicacion ? `, con domicilio en ${[empresa.direccion, empresa.ubicacion].filter(Boolean).join(', ')}` : null,
    ]
        .filter(Boolean)
        .join(' ')
        .replace(' ,', ',');
    const frase = recs.length
        ? `Se hace constar que la empresa ${quien}${empresa.direccion || empresa.ubicacion ? ',' : ''} recolectó en el centro de acopio de ${PUERTO_PENASCO.nombre}, ${PUERTO_PENASCO.region}, durante ${anio}, los residuos que se detallan a continuación, en ${recs.length === 1 ? 'una recolección' : `${recs.length} recolecciones`} registradas en SiMAR.`
        : `En ${anio} no hay recolecciones registradas en SiMAR a nombre de la empresa ${quien}.`;
    // Si el domicilio termina en punto ("Son."), sin punto doble al final
    y += texto(frase.replace(/\.\.$/, '.'), M, y, { tam: 11, ancho: util }) + 4;

    if (recs.length) {
        // ── Totales por material (cada uno en su unidad) ──────────────────────
        const porTipo = new Map<TipoResiduo, { total: number; unidad: UnidadResiduo; veces: number }>();
        for (const r of recs) {
            const t = porTipo.get(r.tipo) ?? { total: 0, unidad: r.unidad, veces: 0 };
            t.total += r.cantidad;
            t.veces += 1;
            porTipo.set(r.tipo, t);
        }
        titulo('Total por residuo');
        tabla(
            [
                { titulo: 'Residuo', ancho: 80 },
                { titulo: 'Cantidad', ancho: 50, derecha: true },
                { titulo: 'Recolecciones', ancho: util - 130, derecha: true },
            ],
            [...porTipo.entries()].map(([tipo, t]) => [TIPO_RESIDUO_LABEL[tipo], cantidad(t.total, t.unidad), String(t.veces)])
        );

        // ── Cada recolección ──────────────────────────────────────────────────
        titulo('Detalle de recolecciones');
        tabla(
            [
                { titulo: 'Fecha', ancho: 28 },
                { titulo: 'Folio', ancho: 36 },
                { titulo: 'Residuo', ancho: 40 },
                { titulo: 'Cantidad', ancho: 30, derecha: true },
                { titulo: 'Recibió', ancho: util - 134 },
            ],
            recs.map((r) => [fechaCorta(r.fecha), r.folio, TIPO_RESIDUO_LABEL[r.tipo], cantidad(r.cantidad, r.unidad), r.recibido_por || '-'])
        );

        asegurar(14);
        y += 2;
        y += texto('Cada recolección tiene su comprobante en PDF con el mismo folio. Las cantidades son las que registró el centro de acopio al entregar.', M, y, {
            tam: 8.5,
            c: C.texto2,
            ancho: util,
        });
    }

    // ── Firmas ────────────────────────────────────────────────────────────────
    asegurar(36);
    y += 20;
    const anchoFirma = (util - 20) / 2;
    [
        ['Centro de acopio', `${PUERTO_PENASCO.nombre} · nombre, firma y sello`],
        ['Empresa recolectora', `${empresa.nombre_asociacion} · nombre y firma`],
    ].forEach(([rol, detalle], i) => {
        const x = M + i * (anchoFirma + 20);
        linea(C.texto);
        doc.setLineWidth(0.3);
        doc.line(x, y, x + anchoFirma, y);
        texto(rol, x + anchoFirma / 2, y + 5, { tam: 9.5, negrita: true, alinear: 'center' });
        doc.setFont('helvetica', 'normal').setFontSize(8);
        texto(recortar(detalle, anchoFirma), x + anchoFirma / 2, y + 9.5, { tam: 8, c: C.texto2, alinear: 'center' });
    });

    // ── Pie de cada hoja ──────────────────────────────────────────────────────
    const hojas = doc.getNumberOfPages();
    for (let i = 1; i <= hojas; i++) {
        doc.setPage(i);
        doc.setFont('helvetica', 'normal').setFontSize(8);
        texto(recortar(`SiMAR · Constancia ${anio} · ${empresa.nombre_asociacion} · Hoja ${i} de ${hojas}`, util), ancho / 2, alto - 10, { tam: 8, c: C.texto2, alinear: 'center' });
    }

    return doc;
}

/**
 * "Reporte del mes" de Estadísticas: un PDF con todo lo de un mes calendario para entregar a
 * SEMARNAT. Totales del mes, cada manifiesto con sus residuos, los recibos del basurón, lo que se
 * llevaron las empresas recolectoras y renglones para firmar (Elaboró / Recibió).
 *
 * Mismo estilo que el resumen de Estadísticas (pdfEstadisticas.ts). Sólo jsPDF, en el cliente; se
 * carga al tocar el botón. Las fuentes estándar de jsPDF no traen algunos símbolos: aquí no se usan.
 */
import jsPDF from 'jspdf';
import type { ReporteMensual } from '@/lib/services/reporte_mensual';
import { TIPO_RESIDUO_LABEL, unidadEscrita } from '@/lib/constants/residuos';
import { C, cargarSimbolo, type RGB } from './pdfEstadisticas';

const fmt = (n: number) => n.toLocaleString('es-MX', { maximumFractionDigits: 2 });
const fechaCorta = (t: string) => {
    const [a, m, d] = t.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: '2-digit', month: 'short' });
};
/** "septiembre de 2026" */
export const nombreDelMes = (anio: number, mes: number) => new Date(anio, mes - 1, 1).toLocaleDateString('es-MX', { month: 'long', year: 'numeric' });
const plural = (n: number, uno: string, varios: string) => `${fmt(n)} ${n === 1 ? uno : varios}`;

interface Columna {
    titulo: string;
    /** Ancho en mm */
    ancho: number;
    derecha?: boolean;
}

export async function descargarReporteMensual(r: ReporteMensual) {
    const doc = crearReporteMensual(r, await cargarSimbolo());
    doc.save(`SiMAR_reporte_${r.anio}-${String(r.mes).padStart(2, '0')}.pdf`);
}

/** Arma el PDF (sin guardarlo). `logo`: el símbolo de SiMAR como data URL PNG, si cargó */
export function crearReporteMensual(r: ReporteMensual, logo: string | null) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const M = 16;
    const util = ancho - M * 2;
    let y = M;
    const mesTexto = nombreDelMes(r.anio, r.mes);
    const Mes = mesTexto.charAt(0).toUpperCase() + mesTexto.slice(1);

    const color = (c: RGB) => doc.setTextColor(c[0], c[1], c[2]);
    const relleno = (c: RGB) => doc.setFillColor(c[0], c[1], c[2]);
    const linea = (c: RGB) => doc.setDrawColor(c[0], c[1], c[2]);
    const texto = (t: string, x: number, yy: number, o: { tam?: number; negrita?: boolean; c?: RGB; alinear?: 'left' | 'right' | 'center'; ancho?: number } = {}) => {
        doc.setFont('helvetica', o.negrita ? 'bold' : 'normal');
        doc.setFontSize(o.tam ?? 10);
        color(o.c ?? C.texto);
        const lineas = o.ancho ? (doc.splitTextToSize(t, o.ancho) as string[]) : [t];
        doc.text(lineas, x, yy, { align: o.alinear ?? 'left' });
        return lineas.length * (o.tam ?? 10) * 0.42;
    };
    /** Recorta el texto para que quepa en el ancho (con "..." al final) */
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
    const titulo = (t: string, sub?: string) => {
        asegurar(26);
        y += 7;
        texto(t, M, y, { tam: 13, negrita: true });
        y += 5;
        if (sub) y += texto(sub, M, y, { tam: 9, c: C.texto2, ancho: util }) + 1;
        y += 1.5;
    };

    /** Tabla con encabezado (se repite en cada hoja) y renglón de total opcional */
    const tabla = (columnas: Columna[], filas: string[][], total?: string[]) => {
        const altoFila = 6.4;
        const encabezado = () => {
            relleno(C.papel);
            doc.rect(M, y, util, altoFila + 0.6, 'F');
            let x = M;
            for (const c of columnas) {
                doc.setFont('helvetica', 'bold').setFontSize(8);
                texto(c.titulo, c.derecha ? x + c.ancho - 2 : x + 2, y + 4.4, { tam: 8, negrita: true, c: C.texto2, alinear: c.derecha ? 'right' : 'left' });
                x += c.ancho;
            }
            y += altoFila + 0.6;
        };
        const renglon = (celdas: string[], negrita = false) => {
            if (asegurar(altoFila + 2)) encabezado();
            let x = M;
            celdas.forEach((valor, i) => {
                const c = columnas[i];
                doc.setFont('helvetica', negrita ? 'bold' : 'normal').setFontSize(8.5);
                const v = recortar(valor, c.ancho - 4);
                texto(v, c.derecha ? x + c.ancho - 2 : x + 2, y + 4.4, { tam: 8.5, negrita, alinear: c.derecha ? 'right' : 'left' });
                x += c.ancho;
            });
            linea(C.borde);
            doc.setLineWidth(0.2);
            doc.line(M, y + altoFila, M + util, y + altoFila);
            y += altoFila;
        };
        asegurar(altoFila * 3);
        encabezado();
        filas.forEach((f) => renglon(f));
        if (total) {
            relleno(C.papel);
            if (asegurar(altoFila + 2)) encabezado();
            doc.rect(M, y, util, altoFila, 'F');
            renglon(total, true);
        }
        y += 2;
    };

    // ── Encabezado ────────────────────────────────────────────────────────────
    if (logo) doc.addImage(logo, 'PNG', M, y - 2, 14, 14);
    const xTitulo = logo ? M + 18 : M;
    texto('SiMAR', xTitulo, y + 4, { tam: 18, negrita: true, c: C.marea });
    texto('Reporte mensual de residuos · Recinto portuario de Puerto Peñasco, Sonora', xTitulo, y + 10, { tam: 9, c: C.texto2 });
    texto(Mes, ancho - M, y + 4, { tam: 12, negrita: true, alinear: 'right' });
    texto(`Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`, ancho - M, y + 10, { tam: 8.5, c: C.texto2, alinear: 'right' });
    y += 16;
    relleno(C.marea);
    doc.rect(M, y, util, 0.8, 'F');
    y += 6;

    // ── Resumen en una frase ──────────────────────────────────────────────────
    const t = r.totales;
    const filtros = t.filtrosAceite + t.filtrosDiesel + t.filtrosAire;
    const hayManifiestos = t.manifiestos > 0;
    let frase = hayManifiestos
        ? `En ${mesTexto} las embarcaciones entregaron ${fmt(t.basuraKg)} kg de basura, ${fmt(t.aceiteL)} L de aceite usado y ${plural(filtros, 'filtro', 'filtros')} en ${plural(t.manifiestos, 'manifiesto', 'manifiestos')} de ${plural(t.embarcaciones, 'embarcación', 'embarcaciones')}.`
        : `En ${mesTexto} no se registraron manifiestos.`;
    if (t.entregasBasuron > 0) frase += ` Al relleno sanitario se llevaron ${fmt(t.basuronKg)} kg en ${plural(t.entregasBasuron, 'viaje', 'viajes')}.`;
    const lineasFrase = doc.setFont('helvetica', 'bold').setFontSize(11.5).splitTextToSize(frase, util - 10) as string[];
    const altoCaja = lineasFrase.length * 5 + 8;
    relleno(C.papel);
    doc.roundedRect(M, y, util, altoCaja, 2, 2, 'F');
    relleno(C.marea);
    doc.rect(M, y, 1.2, altoCaja, 'F');
    texto(frase, M + 5, y + 7, { tam: 11.5, negrita: true, ancho: util - 10 });
    y += altoCaja + 4;

    // ── Cinco cifras ──────────────────────────────────────────────────────────
    const cifras = [
        { etiqueta: 'Manifiestos', valor: fmt(t.manifiestos), detalle: plural(t.embarcaciones, 'embarcación', 'embarcaciones'), c: C.violeta },
        { etiqueta: 'Basura', valor: `${fmt(t.basuraKg)} kg`, detalle: 'De las embarcaciones', c: C.marea },
        { etiqueta: 'Aceite usado', valor: `${fmt(t.aceiteL)} L`, detalle: 'Litros recibidos', c: C.coral },
        { etiqueta: 'Filtros', valor: `${fmt(filtros)}`, detalle: `Aceite ${fmt(t.filtrosAceite)} · diésel ${fmt(t.filtrosDiesel)} · aire ${fmt(t.filtrosAire)}`, c: C.texto2 },
        { etiqueta: 'Basurón', valor: `${fmt(t.basuronKg)} kg`, detalle: plural(t.entregasBasuron, 'viaje al relleno', 'viajes al relleno'), c: C.arrecife },
    ];
    const gap = 2.5;
    const anchoCifra = (util - gap * 4) / 5;
    const altoCifra = 25;
    asegurar(altoCifra + 4);
    cifras.forEach((f, i) => {
        const x = M + i * (anchoCifra + gap);
        linea(C.borde);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, anchoCifra, altoCifra, 2, 2, 'S');
        relleno(f.c);
        doc.rect(x, y + 2, 0.9, altoCifra - 4, 'F');
        texto(f.etiqueta, x + 3.5, y + 6, { tam: 8, negrita: true, c: C.texto2 });
        texto(f.valor, x + 3.5, y + 13, { tam: 13, negrita: true });
        doc.setFont('helvetica', 'normal').setFontSize(7);
        color(C.texto2);
        doc.text((doc.splitTextToSize(f.detalle, anchoCifra - 5) as string[]).slice(0, 2), x + 3.5, y + 18);
    });
    y += altoCifra + 4;

    // ── Manifiestos ───────────────────────────────────────────────────────────
    titulo('Manifiestos del mes', 'Residuos que cada embarcación entregó en el recinto portuario (formato MARPOL Anexo V).');
    if (r.manifiestos.length) {
        tabla(
            [
                { titulo: 'Fecha', ancho: 18 },
                { titulo: 'Folio', ancho: 34 },
                { titulo: 'Embarcación', ancho: 44 },
                { titulo: 'Motorista', ancho: 38 },
                { titulo: 'Basura kg', ancho: 16, derecha: true },
                { titulo: 'Aceite L', ancho: 14, derecha: true },
                { titulo: 'Filtros', ancho: 14, derecha: true },
            ],
            r.manifiestos.map((m) => [fechaCorta(m.fecha), m.folio ?? '-', m.embarcacion, m.motorista ?? '-', fmt(m.basuraKg), fmt(m.aceiteL), fmt(m.filtros)]),
            ['Total', plural(t.manifiestos, 'manifiesto', 'manifiestos'), plural(t.embarcaciones, 'embarcación', 'embarcaciones'), '', fmt(t.basuraKg), fmt(t.aceiteL), fmt(filtros)]
        );
    } else {
        y += texto('Sin manifiestos en el mes.', M, y + 3, { tam: 9.5, c: C.texto2 }) + 3;
    }

    // ── Basurón ───────────────────────────────────────────────────────────────
    titulo('Viajes al relleno sanitario (basurón)', 'Es la misma basura que entregaron las embarcaciones, camino a su destino final: no se suma a la de arriba.');
    if (r.basuron.length) {
        tabla(
            [
                { titulo: 'Fecha', ancho: 22 },
                { titulo: 'Ticket', ancho: 34 },
                { titulo: 'Recibido de', ancho: 92 },
                { titulo: 'Depositado kg', ancho: 30, derecha: true },
            ],
            r.basuron.map((b) => [fechaCorta(b.fecha), b.ticket ?? '-', b.deQuien ?? '-', fmt(b.kg)]),
            ['Total', plural(t.entregasBasuron, 'viaje', 'viajes'), '', fmt(t.basuronKg)]
        );
    } else {
        y += texto('Sin viajes al relleno en el mes.', M, y + 3, { tam: 9.5, c: C.texto2 }) + 3;
    }

    // ── Recolecciones ─────────────────────────────────────────────────────────
    titulo('Entregas a empresas recolectoras', 'Residuos que salieron del centro de acopio a reciclaje.');
    if (r.recolecciones.length) {
        tabla(
            [
                { titulo: 'Fecha', ancho: 22 },
                { titulo: 'Folio', ancho: 30 },
                { titulo: 'Empresa', ancho: 64 },
                { titulo: 'Residuo', ancho: 36 },
                { titulo: 'Cantidad', ancho: 26, derecha: true },
            ],
            r.recolecciones.map((x) => [fechaCorta(x.fecha), x.folio, x.empresa, TIPO_RESIDUO_LABEL[x.tipo] ?? x.tipo, `${fmt(x.cantidad)} ${unidadEscrita(x.unidad, x.cantidad)}`])
        );
    } else {
        y += texto('Sin entregas a empresas en el mes.', M, y + 3, { tam: 9.5, c: C.texto2 }) + 3;
    }

    // ── Firmas ────────────────────────────────────────────────────────────────
    asegurar(34);
    y += 16;
    const anchoFirma = (util - 20) / 2;
    [['Elaboró', 'Responsable del área de residuos del recinto portuario'], ['Recibió', 'Nombre, firma y sello']].forEach(([rol, detalle], i) => {
        const x = M + i * (anchoFirma + 20);
        linea(C.texto);
        doc.setLineWidth(0.3);
        doc.line(x, y, x + anchoFirma, y);
        texto(rol, x + anchoFirma / 2, y + 5, { tam: 9.5, negrita: true, alinear: 'center' });
        texto(detalle, x + anchoFirma / 2, y + 9.5, { tam: 8, c: C.texto2, alinear: 'center' });
    });

    // ── Pie de cada hoja ──────────────────────────────────────────────────────
    const hojas = doc.getNumberOfPages();
    for (let i = 1; i <= hojas; i++) {
        doc.setPage(i);
        texto(`SiMAR · Reporte de ${mesTexto} · Hoja ${i} de ${hojas}`, ancho / 2, alto - 10, { tam: 8, c: C.texto2, alinear: 'center' });
    }

    return doc;
}

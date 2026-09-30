/**
 * "Descargar PDF" de Estadísticas: una hoja carta/A4 con el resumen del período elegido, para
 * entregar a SEMARNAT o mostrar en una presentación. Sale de los mismos datos y textos que la
 * pantalla (titular, comparaciones, equivalencias), así nunca dicen cosas distintas.
 *
 * Sólo jsPDF, en el cliente (como lib/utils/pdfGenerator.ts). Se carga al tocar el botón.
 * Las fuentes estándar de jsPDF no traen "₂", "−" ni "→": aquí se escribe "CO2", "-" y palabras.
 */
import jsPDF from 'jspdf';
import simbolo from '@/public/assets/simar/simbolo.png';
import type { EstadisticasPeriodo, SinEntregar } from '@/lib/services/dashboard_stats';
import { TIPO_RESIDUO_LABEL, type TipoResiduo } from '@/lib/constants/residuos';
import {
    KG_CO2_POR_ARBOL_ANIO,
    LITROS_AGUA_POR_LITRO_ACEITE,
    RECINTO_CO2_POR_KG_BASURON,
    RECINTO_CO2_POR_LITRO_ACEITE,
} from '@/lib/constants/impacto';
import {
    PERIODOS,
    TEXTO_PERIODO,
    POR_TRAMO,
    cambio,
    decimalesEquivalencia,
    equivalenciaAgua,
    equivalenciaBasura,
    equivalenciaCO2,
    etiquetaTramo,
    topeRedondo,
} from './EstadisticasGenerales';

type RGB = [number, number, number];
const C = {
    texto: [11, 34, 54] as RGB,
    texto2: [62, 81, 99] as RGB,
    borde: [214, 206, 189] as RGB,
    papel: [244, 241, 234] as RGB,
    marea: [27, 95, 201] as RGB,
    coral: [166, 63, 14] as RGB,
    arrecife: [18, 122, 93] as RGB,
    violeta: [91, 63, 168] as RGB,
};

const fmt = (n: number, dec?: number) =>
    n.toLocaleString('es-MX', { maximumFractionDigits: dec ?? (Math.abs(n) < 100 && !Number.isInteger(n) ? 1 : 0) });
const fmtCifra = (n: number, unidad: string) =>
    n >= 1_000_000 ? `${fmt(n / 1_000_000, 1)} millones de ${unidad === 'L' ? 'litros' : unidad}` : `${fmt(n)} ${unidad}`;
const fechaCorta = (t: string) => {
    const [a, m, d] = t.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'short', year: 'numeric' });
};
const fechaLarga = (t: string) => {
    const [a, m, d] = t.split('-').map(Number);
    return new Date(a, m - 1, d).toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' });
};

/** El símbolo de SiMAR como imagen para el PDF (null si no carga: el PDF sale igual) */
function cargarSimbolo(): Promise<string | null> {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width;
            canvas.height = img.height;
            const ctx = canvas.getContext('2d');
            if (!ctx) return resolve(null);
            ctx.drawImage(img, 0, 0);
            resolve(canvas.toDataURL('image/png'));
        };
        img.onerror = () => resolve(null);
        img.src = simbolo.src;
    });
}

export async function descargarResumenPdf(datos: EstadisticasPeriodo, sinEntregar?: SinEntregar) {
    const doc = new jsPDF({ unit: 'mm', format: 'a4' });
    const ancho = doc.internal.pageSize.getWidth();
    const alto = doc.internal.pageSize.getHeight();
    const M = 16; // margen
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
        return lineas.length * (o.tam ?? 10) * 0.42; // alto aproximado en mm
    };
    /** Salta de hoja si lo que sigue no cabe */
    const asegurar = (necesario: number) => {
        if (y + necesario > alto - 18) {
            doc.addPage();
            y = M;
        }
    };
    const titulo = (t: string, sub?: string) => {
        asegurar(22);
        y += 4;
        texto(t, M, y, { tam: 13, negrita: true });
        y += 5;
        if (sub) {
            y += texto(sub, M, y, { tam: 9, c: C.texto2, ancho: util }) + 1;
        }
        y += 2;
    };

    // ── Encabezado ────────────────────────────────────────────────────────────
    const logo = await cargarSimbolo();
    if (logo) doc.addImage(logo, 'PNG', M, y - 2, 14, 14);
    const xTitulo = logo ? M + 18 : M;
    texto('SiMAR', xTitulo, y + 4, { tam: 18, negrita: true, c: C.marea });
    texto('Resumen de estadísticas del recinto portuario · Puerto Peñasco, Sonora', xTitulo, y + 10, { tam: 9, c: C.texto2 });
    const nombrePeriodo = PERIODOS.find((p) => p.valor === datos.periodo)?.texto ?? '';
    const rango =
        datos.periodo === 'todo'
            ? datos.inicio
                ? `Todo el histórico, desde ${fechaCorta(datos.inicio)}`
                : 'Todo el histórico'
            : `${nombrePeriodo}: del ${fechaCorta(datos.inicio)} al ${fechaCorta(datos.fin)}`;
    texto(rango, ancho - M, y + 4, { tam: 10, negrita: true, alinear: 'right' });
    texto(`Generado el ${new Date().toLocaleDateString('es-MX', { day: 'numeric', month: 'long', year: 'numeric' })}`, ancho - M, y + 10, { tam: 8.5, c: C.texto2, alinear: 'right' });
    y += 16;
    relleno(C.violeta);
    doc.rect(M, y, util, 0.8, 'F');
    y += 6;

    // ── Titular ───────────────────────────────────────────────────────────────
    const { actual, anterior, periodo } = datos;
    const hayDatos = actual.manifiestos > 0 || actual.entregasBasuron > 0;
    const inicioTexto = periodo === 'todo' ? (datos.inicio ? `Desde ${datos.inicio.slice(0, 4)}` : 'Hasta hoy') : TEXTO_PERIODO[periodo].actual;
    let frase = `${inicioTexto} no hay entregas registradas.`;
    if (hayDatos)
        frase = `${inicioTexto} ${periodo === 'todo' ? 'se han recibido' : 'se recibieron'} ${fmt(actual.basuraKg)} kg de basura y ${fmt(actual.aceiteL)} L de aceite usado en ${fmt(actual.manifiestos)} manifiestos de ${fmt(actual.embarcaciones)} embarcaciones.`;
    relleno(C.papel);
    const lineasFrase = doc.setFont('helvetica', 'bold').setFontSize(12).splitTextToSize(frase, util - 10) as string[];
    let comparacion = '';
    if (anterior && hayDatos) {
        const parte = (c: ReturnType<typeof cambio>, nombre: string) =>
            c.direccion === 'sube'
                ? `${c.porcentaje} % más ${nombre}`
                : c.direccion === 'baja'
                  ? `${c.porcentaje} % menos ${nombre}`
                  : c.direccion === 'nuevo'
                    ? `${nombre} que antes no había`
                    : `la misma cantidad de ${nombre}`;
        comparacion =
            anterior.manifiestos === 0 && anterior.entregasBasuron === 0
                ? `En ${TEXTO_PERIODO[periodo].anterior} no hubo registros para comparar.`
                : `Frente a ${TEXTO_PERIODO[periodo].anterior}: ${parte(cambio(actual.basuraKg, anterior.basuraKg), 'basura')} y ${parte(cambio(actual.aceiteL, anterior.aceiteL), 'aceite')}.`;
    }
    const altoCaja = lineasFrase.length * 5.2 + (comparacion ? 7 : 0) + 8;
    doc.roundedRect(M, y, util, altoCaja, 2, 2, 'F');
    relleno(C.violeta);
    doc.rect(M, y, 1.2, altoCaja, 'F');
    texto(frase, M + 5, y + 7, { tam: 12, negrita: true, ancho: util - 10 });
    if (comparacion) texto(comparacion, M + 5, y + 7 + lineasFrase.length * 5.2, { tam: 9.5, c: C.texto2, ancho: util - 10 });
    y += altoCaja + 4;

    // ── Cuatro cifras ─────────────────────────────────────────────────────────
    const contra = TEXTO_PERIODO[periodo].contra;
    const delta = (a: number, b?: number) => {
        if (b === undefined) return '';
        const c = cambio(a, b);
        return c.direccion === 'sube' ? `+${c.porcentaje} % ${contra}` : c.direccion === 'baja' ? `-${c.porcentaje} % ${contra}` : c.direccion === 'nuevo' ? `Nuevo ${contra}` : `Igual ${contra}`;
    };
    const cifras = [
        { etiqueta: 'Basura', valor: `${fmt(actual.basuraKg)} kg`, detalle: `${fmt(actual.manifiestos)} manifiestos`, delta: delta(actual.basuraKg, anterior?.basuraKg), c: C.marea },
        { etiqueta: 'Aceite usado', valor: `${fmt(actual.aceiteL)} L`, detalle: 'Litros recolectados', delta: delta(actual.aceiteL, anterior?.aceiteL), c: C.coral },
        { etiqueta: 'Basurón', valor: `${fmt(actual.basuronKg)} kg`, detalle: `${fmt(actual.entregasBasuron)} entregas al relleno`, delta: delta(actual.basuronKg, anterior?.basuronKg), c: C.arrecife },
        {
            etiqueta: 'Manifiestos',
            valor: fmt(actual.manifiestos),
            detalle: actual.porDigitalizar > 0 ? `${fmt(actual.porDigitalizar)} por digitalizar` : 'Todos digitalizados',
            delta: delta(actual.manifiestos, anterior?.manifiestos),
            c: C.violeta,
        },
    ];
    const gap = 3;
    const anchoCifra = (util - gap * 3) / 4;
    asegurar(28);
    cifras.forEach((f, i) => {
        const x = M + i * (anchoCifra + gap);
        linea(C.borde);
        doc.setLineWidth(0.3);
        doc.roundedRect(x, y, anchoCifra, 25, 2, 2, 'S');
        relleno(f.c);
        doc.rect(x, y + 2, 0.9, 21, 'F');
        texto(f.etiqueta, x + 4, y + 6, { tam: 8.5, negrita: true, c: C.texto2 });
        texto(f.valor, x + 4, y + 13, { tam: 14, negrita: true });
        texto(f.detalle, x + 4, y + 18, { tam: 7.5, c: C.texto2 });
        if (f.delta) texto(f.delta, x + 4, y + 22.3, { tam: 7.5, negrita: true });
    });
    y += 29;

    // ── Tendencia: basura y aceite, cada una en su unidad ──────────────────────
    titulo('Tendencia', `Cantidad ${POR_TRAMO[datos.granularidad]} en el período. Cada residuo en su unidad.`);
    const grafica = (x: number, w: number, nombre: string, unidad: string, valores: number[], c: RGB) => {
        const h = 34;
        const tope = topeRedondo(Math.max(...valores, 0));
        texto(`${nombre} (${unidad})`, x, y, { tam: 9, negrita: true });
        texto(`máx. ${fmt(tope)}`, x + w, y, { tam: 7.5, c: C.texto2, alinear: 'right' });
        const base = y + 4 + h;
        linea(C.borde);
        doc.setLineWidth(0.2);
        doc.line(x, base, x + w, base);
        doc.line(x, base - h / 2, x + w, base - h / 2);
        const n = Math.max(valores.length, 1);
        const sep = n > 20 ? 0.6 : 1.5;
        const bw = (w - sep * (n - 1)) / n;
        const cada = Math.max(1, Math.ceil(n / 7));
        valores.forEach((v, i) => {
            const bh = tope > 0 ? (v / tope) * h : 0;
            relleno(c);
            if (bh > 0) doc.rect(x + i * (bw + sep), base - bh, bw, Math.max(bh, 0.4), 'F');
            if (i % cada === 0) texto(etiquetaTramo(datos.serie[i].inicio, datos.granularidad).corta, x + i * (bw + sep) + bw / 2, base + 4, { tam: 6.5, c: C.texto2, alinear: 'center' });
        });
        if (!valores.some((v) => v > 0)) texto('Sin registros en el período', x + w / 2, base - h / 2 - 2, { tam: 8, c: C.texto2, alinear: 'center' });
    };
    asegurar(48);
    const anchoGrafica = (util - 8) / 2;
    grafica(M, anchoGrafica, 'Basura', 'kg', datos.serie.map((t) => t.basuraKg), C.marea);
    grafica(M + anchoGrafica + 8, anchoGrafica, 'Aceite usado', 'L', datos.serie.map((t) => t.aceiteL), C.coral);
    y += 46;

    // ── Embarcaciones ─────────────────────────────────────────────────────────
    titulo('Embarcaciones que más entregan', 'Por número de manifiestos en el período.');
    if (datos.embarcaciones.length === 0) {
        y += texto('Ninguna entrega en este período.', M, y, { tam: 9.5, c: C.texto2 }) + 2;
    } else {
        const cols = [
            { t: 'Embarcación', x: M + 2 },
            { t: 'Entregas', x: M + util * 0.55, der: true },
            { t: 'Basura', x: M + util * 0.77, der: true },
            { t: 'Aceite', x: M + util - 2, der: true },
        ];
        relleno(C.papel);
        doc.rect(M, y - 4, util, 6.5, 'F');
        cols.forEach((c) => texto(c.t, c.x, y, { tam: 8.5, negrita: true, c: C.texto2, alinear: c.der ? 'right' : 'left' }));
        y += 6;
        datos.embarcaciones.forEach((e, i) => {
            asegurar(7);
            texto(`${i + 1}. ${e.nombre}`, cols[0].x, y, { tam: 9.5 });
            texto(fmt(e.entregas), cols[1].x, y, { tam: 9.5, negrita: true, alinear: 'right' });
            texto(`${fmt(e.basuraKg)} kg`, cols[2].x, y, { tam: 9.5, alinear: 'right' });
            texto(`${fmt(e.aceiteL)} L`, cols[3].x, y, { tam: 9.5, alinear: 'right' });
            linea(C.borde);
            doc.setLineWidth(0.15);
            doc.line(M, y + 2, M + util, y + 2);
            y += 6.5;
        });
    }
    texto(`Flota: ${fmt(datos.flota.activas)} embarcaciones activas de ${fmt(datos.flota.registradas)} registradas.`, M, y + 1, { tam: 8.5, c: C.texto2 });
    y += 5;

    if (sinEntregar) {
        const lista = sinEntregar.embarcaciones;
        titulo(
            `Embarcaciones activas sin entregar (más de ${sinEntregar.dias} días)`,
            'Aviso de hoy: no depende del período.'
        );
        if (lista.length === 0) {
            y += texto(`Todas las embarcaciones activas entregaron en los últimos ${sinEntregar.dias} días.`, M, y, { tam: 9.5, c: C.arrecife, negrita: true }) + 2;
        } else {
            lista.slice(0, 12).forEach((e) => {
                asegurar(6);
                texto(e.nombre, M + 2, y, { tam: 9.5 });
                texto(e.ultimaEntrega ? `${fmt(e.dias ?? 0)} días · última entrega el ${fechaLarga(e.ultimaEntrega)}` : 'Nunca ha entregado', M + util - 2, y, {
                    tam: 9,
                    c: C.coral,
                    alinear: 'right',
                });
                y += 5.5;
            });
            if (lista.length > 12) y += texto(`y ${lista.length - 12} más.`, M + 2, y, { tam: 9, c: C.texto2 }) + 1;
        }
    }

    // ── ¿A dónde se fue? ──────────────────────────────────────────────────────
    const d = datos.destino;
    titulo('¿A dónde se fue?', 'Recibido de las embarcaciones en el período, entregado a empresas recolectoras en el período y lo que hay hoy en el centro de acopio.');
    if (!d.hayDatos) {
        y += texto('Todavía no hay recolecciones ni inventario registrados.', M, y, { tam: 9.5, c: C.texto2 }) + 2;
    } else {
        const empresas = (lista: { nombre: string; cantidad: number }[], u: string) =>
            lista.length ? `Se lo llevaron: ${lista.map((e) => `${e.nombre} (${fmt(e.cantidad)} ${u})`).join(', ')}.` : 'Ninguna empresa se lo llevó en el período.';
        const pct = (rec: number, recibido: number) => (recibido > 0 ? ` (${Math.min(100, Math.round((rec / recibido) * 100))} % de lo recibido)` : '');
        const bloque = (nombre: string, detalle: string, pie: string) => {
            asegurar(18);
            texto(nombre, M + 2, y, { tam: 10, negrita: true });
            y += 5;
            y += texto(detalle, M + 2, y, { tam: 9.5, ancho: util - 4 });
            y += texto(pie, M + 2, y, { tam: 8.5, c: C.texto2, ancho: util - 4 }) + 3;
        };
        bloque(
            'Aceite usado',
            `Recibido ${fmt(d.aceite.recibido)} L · a reciclaje ${fmt(d.aceite.reciclado)} L${pct(d.aceite.reciclado, d.aceite.recibido)} · en acopio hoy ${fmt(d.aceite.enAcopio)} L`,
            empresas(d.aceite.empresas, 'L')
        );
        bloque(
            'Filtros de motor',
            `Recibidos ${fmt(d.filtros.recibido)} (${fmt(actual.filtrosAceite)} de aceite, ${fmt(actual.filtrosDiesel)} de diésel, ${fmt(actual.filtrosAire)} de aire) · a reciclaje ${fmt(d.filtros.reciclado)}${pct(d.filtros.reciclado, d.filtros.recibido)} · en acopio hoy ${fmt(d.filtros.enAcopio)}`,
            empresas(d.filtros.empresas, 'pz')
        );
        bloque(
            'Materiales reciclables',
            `A reciclaje ${fmt(d.reciclables.reciclado)} kg${
                d.reciclables.porTipo.length ? ` (${d.reciclables.porTipo.map((t) => `${TIPO_RESIDUO_LABEL[t.tipo as TipoResiduo] ?? t.tipo} ${fmt(t.reciclado)} kg`).join(', ')})` : ''
            } · en acopio hoy ${fmt(d.reciclables.enAcopio)} kg`,
            empresas(d.reciclables.empresas, 'kg')
        );
    }

    // ── Impacto ambiental (estimado) ──────────────────────────────────────────
    titulo('Impacto ambiental (estimado)', 'Lo que el período ayudó a evitar, en cosas conocidas.');
    const co2 = actual.aceiteL * RECINTO_CO2_POR_LITRO_ACEITE + actual.basuronKg * RECINTO_CO2_POR_KG_BASURON;
    const agua = actual.aceiteL * LITROS_AGUA_POR_LITRO_ACEITE;
    const impactos = [
        { eq: equivalenciaAgua(agua), dato: `${fmtCifra(agua, 'L')} de agua` },
        { eq: equivalenciaCO2(co2), dato: `${fmtCifra(co2, 'kg')} de CO2` },
        { eq: equivalenciaBasura(actual.basuraKg), dato: `${fmtCifra(actual.basuraKg, 'kg')} de basura` },
    ].filter((i) => i.eq !== null);
    if (impactos.length === 0) {
        y += texto('Sin entregas en este período: todavía no hay impacto que calcular.', M, y, { tam: 9.5, c: C.texto2 }) + 2;
    } else {
        asegurar(30);
        const anchoImp = (util - gap * (impactos.length - 1)) / impactos.length;
        impactos.forEach(({ eq, dato }, i) => {
            const e = eq!;
            const x = M + i * (anchoImp + gap);
            doc.setFillColor(227, 242, 236);
            doc.roundedRect(x, y, anchoImp, 27, 2, 2, 'F');
            const dec = decimalesEquivalencia(e.valor);
            const uno = Math.round(e.valor * 10 ** dec) / 10 ** dec === 1;
            texto(fmt(e.valor, dec), x + 4, y + 9, { tam: 18, negrita: true });
            texto(uno ? e.nombre[0] : e.nombre[1], x + 4, y + 14, { tam: 10, negrita: true, c: C.arrecife });
            texto(e.descripcion.replace('CO₂', 'CO2'), x + 4, y + 18.5, { tam: 7.5, c: C.texto2, ancho: anchoImp - 8 });
            texto(dato, x + 4, y + 25, { tam: 7.5, negrita: true, c: C.texto2 });
        });
        y += 31;
    }
    y += texto(
        `Cálculo: CO2 = litros de aceite x ${RECINTO_CO2_POR_LITRO_ACEITE} + kg al basurón x ${RECINTO_CO2_POR_KG_BASURON}; un árbol absorbe unos ${KG_CO2_POR_ARBOL_ANIO} kg de CO2 al año; cada litro de aceite evita contaminar ${fmt(LITROS_AGUA_POR_LITRO_ACEITE)} L de agua. Factores provisionales, pendientes de validar con SEMARNAT y DCK: sirven para dar una idea, no para reportes oficiales.`,
        M,
        y,
        { tam: 7.5, c: C.texto2, ancho: util }
    );

    // ── Pie en cada hoja ──────────────────────────────────────────────────────
    const hojas = doc.getNumberOfPages();
    for (let i = 1; i <= hojas; i++) {
        doc.setPage(i);
        linea(C.borde);
        doc.setLineWidth(0.2);
        doc.line(M, alto - 12, ancho - M, alto - 12);
        texto('SiMAR · Sistema Integral de Manejo Ambiental de Residuos', M, alto - 7.5, { tam: 7.5, c: C.texto2 });
        texto(`Hoja ${i} de ${hojas}`, ancho - M, alto - 7.5, { tam: 7.5, c: C.texto2, alinear: 'right' });
    }

    doc.save(`SiMAR_estadisticas_${datos.periodo}_${datos.fin}.pdf`);
}

import jsPDF from 'jspdf';
import { AsociacionRecolectora, Recoleccion, SolicitudRecoleccion } from '@/types/database';
import { TIPO_RESIDUO_LABEL, formatCantidad } from '@/lib/constants/residuos';
import { parseFechaLocal } from '@/lib/utils/fechas';

const SUPABASE_URL = process.env.NEXT_PUBLIC_SB_URL || '';
const LOGO_SEMARNAT_URL = `${SUPABASE_URL}/storage/v1/object/public/images/logoSemarnat.png`;

const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];

async function cargarImagenBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
    if (!response.ok) return '';
    const blob = await response.blob();
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  } catch (error) {
    console.error('Error cargando imagen:', error);
    return '';
  }
}

export interface DatosComprobante {
  recoleccion: Recoleccion;
  asociacion: Pick<AsociacionRecolectora, 'nombre_asociacion' | 'rfc' | 'ubicacion'> | null;
  solicitud?: Pick<SolicitudRecoleccion, 'cantidad_solicitada' | 'cantidad_aprobada' | 'fecha_propuesta'> | null;
  /** Firmas como data URL PNG (components/ui/SignaturePad). */
  firmaEntrega?: string | null;
  firmaRecibe?: string | null;
}

/** Comprobante de recolección entregado a la asociación recolectora. */
export async function generarPDFRecoleccion(datos: DatosComprobante): Promise<Blob> {
  const { recoleccion, asociacion, solicitud, firmaEntrega, firmaRecibe } = datos;
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 15;
  const anchoUtil = pageWidth - margin * 2;

  // ── Encabezado ──────────────────────────────────────────────────────
  doc.setLineWidth(1.2);
  doc.roundedRect(10, 10, pageWidth - 20, 35, 3, 3);

  const logo = await cargarImagenBase64(LOGO_SEMARNAT_URL);
  if (logo) {
    try {
      doc.addImage(logo, 'PNG', 12, 11.5, 70, 32);
    } catch (error) {
      console.error('Error agregando logo SEMARNAT:', error);
    }
  }

  const centroX = pageWidth - 85;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.text('CENTRO DE ACOPIO 2024 AL 2034', centroX, 18);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.text('Número de Registro Ambiental BOO2604804813', centroX, 24);
  doc.text('Autorización 26-30-P5-11-10-13', centroX, 29);
  doc.text('Puerto Peñasco, Sonora C.P 83500', centroX, 34);

  // ── Título y folio ──────────────────────────────────────────────────
  let y = 58;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(14);
  doc.text('COMPROBANTE DE RECOLECCIÓN DE RESIDUOS', pageWidth / 2, y, { align: 'center' });

  y += 9;
  const fecha = parseFechaLocal(recoleccion.fecha);
  doc.setFontSize(10);
  doc.text(`Folio: ${recoleccion.folio}`, margin, y);
  doc.setFont('helvetica', 'normal');
  doc.text(
    `Puerto Peñasco, Sonora a ${fecha.getDate()} de ${MESES[fecha.getMonth()]} de ${fecha.getFullYear()}`,
    pageWidth - margin,
    y,
    { align: 'right' }
  );

  // ── Datos de la asociación ──────────────────────────────────────────
  y += 8;
  const seccion = (titulo: string) => {
    doc.setFillColor(230, 236, 245);
    doc.rect(margin, y, anchoUtil, 7, 'F');
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(titulo, margin + 2, y + 5);
    y += 12;
  };
  const fila = (etiqueta: string, valor: string) => {
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(9);
    doc.text(`${etiqueta}:`, margin + 2, y);
    doc.setFont('helvetica', 'normal');
    const lineas = doc.splitTextToSize(valor || '—', anchoUtil - 50);
    doc.text(lineas, margin + 48, y);
    y += 6 * Math.max(1, lineas.length);
  };

  seccion('ASOCIACIÓN RECOLECTORA');
  fila('Razón social', asociacion?.nombre_asociacion ?? '—');
  fila('RFC', asociacion?.rfc ?? '—');
  fila('Ubicación', asociacion?.ubicacion ?? '—');

  // ── Residuo ─────────────────────────────────────────────────────────
  y += 2;
  seccion('RESIDUO RECOLECTADO');
  const columnas = ['Tipo de residuo', 'Solicitado', 'Aprobado', 'Recolectado'];
  const anchoCol = anchoUtil / columnas.length;
  doc.setLineWidth(0.3);
  doc.setFont('helvetica', 'bold');
  columnas.forEach((c, i) => {
    doc.rect(margin + i * anchoCol, y - 5, anchoCol, 8);
    doc.text(c, margin + i * anchoCol + anchoCol / 2, y, { align: 'center' });
  });
  y += 8;
  doc.setFont('helvetica', 'normal');
  const u = recoleccion.unidad;
  const valores = [
    TIPO_RESIDUO_LABEL[recoleccion.tipo] ?? recoleccion.tipo,
    solicitud ? `${formatCantidad(solicitud.cantidad_solicitada)} ${u}` : '—',
    solicitud?.cantidad_aprobada ? `${formatCantidad(solicitud.cantidad_aprobada)} ${u}` : '—',
    `${formatCantidad(recoleccion.cantidad)} ${u}`,
  ];
  valores.forEach((v, i) => {
    doc.rect(margin + i * anchoCol, y - 5, anchoCol, 8);
    doc.text(v, margin + i * anchoCol + anchoCol / 2, y, { align: 'center' });
  });
  y += 10;

  if (recoleccion.observaciones) {
    fila('Observaciones', recoleccion.observaciones);
  }

  // ── Firmas ──────────────────────────────────────────────────────────
  y = Math.max(y + 10, 185);
  const anchoFirma = (anchoUtil - 20) / 2;
  const firmas: { titulo: string; nombre: string | null; imagen?: string | null }[] = [
    { titulo: 'ENTREGA (Centro de acopio)', nombre: recoleccion.entregado_por, imagen: firmaEntrega },
    { titulo: 'RECIBE (Asociación recolectora)', nombre: recoleccion.recibido_por, imagen: firmaRecibe },
  ];
  firmas.forEach((f, i) => {
    const x = margin + i * (anchoFirma + 20);
    if (f.imagen) {
      try {
        doc.addImage(f.imagen, 'PNG', x + 10, y, anchoFirma - 20, 28);
      } catch (error) {
        console.error('Error agregando firma:', error);
      }
    }
    doc.setLineWidth(0.4);
    doc.line(x, y + 32, x + anchoFirma, y + 32);
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(9);
    doc.text(f.nombre || 'Nombre y firma', x + anchoFirma / 2, y + 37, { align: 'center' });
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(8);
    doc.text(f.titulo, x + anchoFirma / 2, y + 42, { align: 'center' });
  });

  // ── Pie ─────────────────────────────────────────────────────────────
  doc.setFont('helvetica', 'italic');
  doc.setFontSize(7);
  doc.setTextColor(110);
  doc.text(
    'Documento generado por SiMAR — Sistema Integral de Manejo Ambiental de Residuos.',
    pageWidth / 2,
    285,
    { align: 'center' }
  );
  doc.setTextColor(0);

  return doc.output('blob');
}

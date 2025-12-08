import jsPDF from 'jspdf';
import { ManifiestoConRelaciones } from '@/types/database';
import logoDck from '@/Contexto-DCK/logo_DCK.png';

// URLs de las imágenes en Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LOGO_SEMARNAT_URL = `${SUPABASE_URL}/storage/v1/object/public/images/logoSemarnat.png`;

// Configuración de Colores
const COLORS = {
  primary: '#1e3a8a', // Azul oscuro oficial
  secondary: '#4b5563', // Gris texto secundario
  accent: '#f3f4f6', // Gris fondo suave
  text: '#111827', // Negro suave
  white: '#ffffff'
};

// Interfaz para las firmas opcionales
export interface FirmasManifiesto {
  motoristaFirma?: string | null;
  motoristaNombre?: string;
  cocineroFirma?: string | null;
  cocineroNombre?: string;
  oficialFirma?: string | null;
}

interface ImageInfo {
  data: string;
  width: number;
  height: number;
  ratio: number;
}

/**
 * Cargar imagen y obtener sus dimensiones/base64
 */
async function cargarImagen(url: string | any): Promise<ImageInfo | null> {
  if (!url) return null;
  const src = typeof url === 'string' ? url : url.src;

  return new Promise((resolve) => {
    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(img, 0, 0);
        resolve({
          data: canvas.toDataURL('image/png'),
          width: img.width,
          height: img.height,
          ratio: img.width / img.height
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => {
      console.error('Error cargando imagen para PDF:', src);
      resolve(null);
    };
    img.src = src;
  });
}

/**
 * Cargar imagen desde URL y convertirla a base64 (Legacy fallback)
 */
async function cargarImagenBase64(url: string): Promise<string> {
  const info = await cargarImagen(url);
  return info ? info.data : '';
}


/**
 * Generar PDF con diseño MODERNO y FORMAL
 */
export async function generarPDFManifiesto(manifiesto: ManifiestoConRelaciones, firmas?: FirmasManifiesto): Promise<Blob> {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 20;

  // -- HELPERS --
  const drawSectionTitle = (text: string, y: number) => {
    // DISEÑO IMPRESIÓN AMIGABLE (Sin rellenos sólidos)
    // Texto en negrita + Línea inferior
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.primary);
    doc.text(text.toUpperCase(), margin, y + 6);

    doc.setLineWidth(1.5); // Línea gruesa
    doc.setDrawColor(COLORS.primary);
    doc.line(margin, y + 8, width - margin, y + 8);

    doc.setTextColor(COLORS.text); // Reset
  };

  const drawRow = (label: string, value: string, y: number) => {
    const rowHeight = 10;
    // Sin fondo gris para ahorrar tinta

    // Label Column (30% width)
    doc.setFontSize(10);
    doc.setFont('helvetica', 'bold');
    doc.setTextColor(COLORS.secondary);
    doc.text(label, margin + 5, y + 6.5);

    // Value Column
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(COLORS.text);
    doc.text(value, margin + 60, y + 6.5);

    // Bottom Line (más fina)
    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200); // Gris claro para guiar vista
    doc.line(margin, y + rowHeight, width - margin, y + rowHeight);
  };

  // --- 1. ENCABEZADO ---
  let y = 15; // Ajuste solicitado: 5 puntos más arriba (margin era 20)

  // Load Logos
  const logoSemarnat = await cargarImagen(LOGO_SEMARNAT_URL);
  const logoDckInfo = await cargarImagen(logoDck);

  let currentHeaderX = margin;
  const logoHeight = 25; // Altura fija para logos

  // Logo SEMARNAT
  if (logoSemarnat) {
    try {
      const w = logoHeight + 40 * logoSemarnat.ratio;
      doc.addImage(logoSemarnat.data, 'PNG', currentHeaderX, y - 10, w, logoHeight + 30);
      currentHeaderX += w + 0; // Espacio entre logos
    } catch (e) { }
  }

  // Logo DCK
  if (logoDckInfo) {
    try {
      const w = logoHeight * logoDckInfo.ratio;
      doc.addImage(logoDckInfo.data, 'PNG', currentHeaderX, y, w, logoHeight);
    } catch (e) { }
  }

  // Info Institucional (Derecha)
  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'bold');
  const headerTextX = width - margin;
  doc.text('CENTRO DE ACOPIO 2024 AL 2034', headerTextX, y + 5, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text('Registro Ambiental: BOO2604804813', headerTextX, y + 10, { align: 'right' });
  doc.text('Autorización: 26-30-P5-11-10-13', headerTextX, y + 15, { align: 'right' });
  doc.text('Puerto Peñasco, Sonora C.P 83500', headerTextX, y + 20, { align: 'right' });

  // Título del Documento
  y += 35;
  doc.setFontSize(16);
  doc.setTextColor(COLORS.primary);
  doc.setFont('helvetica', 'bold');

  // Línea decorativa superior título
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.primary);
  doc.line(width / 2 - 40, y - 6, width / 2 + 40, y - 6);

  doc.text('MANIFIESTO DE ENTREGA-RECEPCIÓN', width / 2, y, { align: 'center' });

  doc.setFontSize(10);
  doc.setTextColor(COLORS.secondary);
  doc.setFont('helvetica', 'normal');
  doc.text('DE RESIDUOS PELIGROSOS Y DE MANEJO ESPECIAL', width / 2, y + 6, { align: 'center' });

  // --- 2. DATOS GENERALES ---
  y += 15;
  drawSectionTitle('1. DATOS GENERALES', y);
  y += 10; // Más espacio después del título

  // Preparar datos
  const fecha = new Date(manifiesto.fecha_emision).toLocaleDateString('es-MX', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric', timeZone: 'UTC'
  });
  const folio = manifiesto.numero_manifiesto;
  const barco = manifiesto.buque?.nombre_buque || 'N/A';

  drawRow('FOLIO:', folio, y); y += 10;
  drawRow('FECHA DE EMISIÓN:', fecha.charAt(0).toUpperCase() + fecha.slice(1), y); y += 10;
  drawRow('NOMBRE DEL BARCO:', barco, y); y += 10;

  // --- 3. RESIDUOS ENTREGADOS ---
  y += 10;
  drawSectionTitle('2. DETALLE DE RESIDUOS', y);
  y += 10;

  // Header Table (Sin relleno de fondo)
  // Línea superior del header
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.primary);
  doc.line(margin, y, width - margin, y);

  doc.setFontSize(9);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(COLORS.primary);
  doc.text('TIPO DE RESIDUO', margin + 5, y + 5.5);
  doc.text('CANTIDAD', width - margin - 40, y + 5.5);

  // Línea inferior del header
  doc.line(margin, y + 8, width - margin, y + 8);

  y += 8;

  // Items
  const residuosList = [
    { label: 'ACEITE USADO', val: `${manifiesto.residuos?.aceite_usado || 0} litros` },
    { label: 'FILTROS DE ACEITE', val: `${manifiesto.residuos?.filtros_aceite || 0} piezas` },
    { label: 'FILTROS DE DIESEL', val: `${manifiesto.residuos?.filtros_diesel || 0} piezas` },
    { label: 'FILTROS DE AIRE', val: `${manifiesto.residuos?.filtros_aire || 0} piezas` },
    { label: 'BASURA (MARPOL)', val: `${manifiesto.residuos?.basura || 0} kg` },
  ];

  residuosList.forEach((r) => {
    // Sin alternancia de colores
    // Sobreescribir estilo de texto para la tabla si se desea específico (opcional, drawRow ya lo hace bien)
    // Para la columna cantidad alineada a la derecha o fija? 
    // drawRow pone valores en margin + 60. Para tabla queremos alinear mejor.
    // Reescribimos 'drawRow' logic in-place para la tabla para mejor alineación si es necesario, 
    // pero drawRow actual funciona. Solo ajustemos la posición de Cantidad si queremos que coincida con Header.

    // Borrar lo que hizo drawRow arriba? No, no lo llamé. 
    // Hack: llamamos drawRow con value "" y ponemos el value manualmente.
    // O mejor, no llamamos drawRow y dibujamos directo.

    // -- Row drawing manual --
    const rowHeight = 10;
    doc.setFontSize(10);
    doc.setTextColor(COLORS.text);
    doc.setFont('helvetica', 'bold');
    doc.text(r.label, margin + 5, y + 6.5);

    doc.setFont('helvetica', 'normal');
    doc.text(r.val, width - margin - 40, y + 6.5); // Alineado con header

    doc.setLineWidth(0.2);
    doc.setDrawColor(200, 200, 200);
    doc.line(margin, y + rowHeight, width - margin, y + rowHeight);
    // --

    y += 10;
  });

  // --- 4. FIRMAS ---
  y += 20; // Espacio antes de firmas

  drawSectionTitle('3. VALIDACIÓN Y FIRMAS', y);
  y += 15;

  const colWidth = (width - (margin * 2)) / 3;
  const signatureHeight = 25;
  const signatureLineY = y + 35;

  // --- COL 1: OFICIAL (RECIBE) ---
  const x1 = margin;
  const center1 = x1 + (colWidth / 2);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text('RECIBE (Oficial Comisionado)', center1, y, { align: 'center' });

  if (firmas?.oficialFirma) {
    try { doc.addImage(firmas.oficialFirma, 'PNG', x1 + 10, y + 5, colWidth - 20, signatureHeight); } catch (e) { }
  }

  doc.setDrawColor(COLORS.text);
  doc.line(x1 + 5, signatureLineY, x1 + colWidth - 5, signatureLineY);

  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text('Sr. Francisco Javier Bojórquez', center1, signatureLineY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Responsable DCK', center1, signatureLineY + 9, { align: 'center' });


  // --- COL 2: MOTORISTA (ENTREGA) ---
  const x2 = margin + colWidth;
  const center2 = x2 + (colWidth / 2);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text('ENTREGA (Motorista)', center2, y, { align: 'center' });

  if (firmas?.motoristaFirma) {
    try { doc.addImage(firmas.motoristaFirma, 'PNG', x2 + 10, y + 5, colWidth - 20, signatureHeight); } catch (e) { }
  }

  doc.line(x2 + 5, signatureLineY, x2 + colWidth - 5, signatureLineY);

  const nombreMot = firmas?.motoristaNombre || manifiesto.responsable_principal?.nombre || 'NO ESPECIFICADO';
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(nombreMot.toUpperCase(), center2, signatureLineY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Responsable a Bordo', center2, signatureLineY + 9, { align: 'center' });


  // --- COL 3: COCINERO (TESTIGO) ---
  const x3 = margin + (colWidth * 2);
  const center3 = x3 + (colWidth / 2);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text('TESTIGO (Cocinero)', center3, y, { align: 'center' });

  if (firmas?.cocineroFirma) {
    try { doc.addImage(firmas.cocineroFirma, 'PNG', x3 + 10, y + 5, colWidth - 20, signatureHeight); } catch (e) { }
  }

  doc.line(x3 + 5, signatureLineY, x3 + colWidth - 5, signatureLineY);

  const nombreCoc = firmas?.cocineroNombre || manifiesto.responsable_secundario?.nombre || '----------------';
  doc.setFontSize(9);
  doc.setTextColor(COLORS.text);
  doc.setFont('helvetica', 'bold');
  doc.text(nombreCoc.toUpperCase(), center3, signatureLineY + 5, { align: 'center' });
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Personal de Apoyo', center3, signatureLineY + 9, { align: 'center' });


  // --- FOOTER ---
  const footerY = height - 15;
  doc.setLineWidth(0.5);
  doc.setDrawColor(COLORS.primary);
  doc.line(margin, footerY - 5, width - margin, footerY - 5);

  doc.setFontSize(8);
  doc.setTextColor(COLORS.secondary);
  doc.text('Documento generado digitalmente por DCK Conciencia y Cultura.', margin, footerY);
  doc.text(`Pag. 1 de 1`, width - margin, footerY, { align: 'right' });

  return doc.output('blob');
}

/**
 * Generar nombre de archivo para el PDF
 */
export function generarNombreArchivoPDF(numeroManifiesto: string): string {
  const fecha = new Date().toISOString().split('T')[0];
  return `manifiesto_${numeroManifiesto}_${fecha}.pdf`;
}

/**
 * Descargar PDF directamente en el navegador
 */
export async function descargarPDFManifiesto(manifiesto: ManifiestoConRelaciones, firmas?: FirmasManifiesto): Promise<void> {
  const pdfBlob = await generarPDFManifiesto(manifiesto, firmas);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generarNombreArchivoPDF(manifiesto.numero_manifiesto);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

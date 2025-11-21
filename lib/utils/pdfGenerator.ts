import jsPDF from 'jspdf';
import { ManifiestoConRelaciones } from '@/types/database';

// URLs de las imágenes en Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LOGO_SEMARNAT_URL = `${SUPABASE_URL}/storage/v1/object/public/images/logoSemarnat.png`;
const LOGO_MX_URL = `${SUPABASE_URL}/storage/v1/object/public/images/logoMxHover.png`;

/**
 * Cargar imagen desde URL y convertirla a base64
 */
async function cargarImagenBase64(url: string): Promise<string> {
  try {
    const response = await fetch(url);
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

/**
 * Generar PDF del manifiesto sin firmar con formato SEMARNAT
 */
export async function generarPDFManifiesto(manifiesto: ManifiestoConRelaciones): Promise<Blob> {
  const doc = new jsPDF();
  
  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Cargar imagen
  const logoSemarnatBase64 = await cargarImagenBase64(LOGO_SEMARNAT_URL);

  // ENCABEZADO PRINCIPAL CON BORDE
  doc.setLineWidth(1.5);
  doc.roundedRect(10, 10, pageWidth - 20, 35, 3, 3);
  
  // Logo SEMARNAT (MÁS GRANDE Y LARGO - ocupa todo el lado izquierdo)
  if (logoSemarnatBase64) {
    try {
      // Hacer el logo mucho más grande: ancho 70, alto 32
      doc.addImage(logoSemarnatBase64, 'PNG', 12, 11.5, 70, 32);
    } catch (error) {
      console.error('Error agregando logo SEMARNAT:', error);
    }
  }

  // Información del centro (lado derecho)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const centroX = pageWidth - 85;
  doc.text('CENTRO DE ACOPIO 2024 AL 2034', centroX, 18);
  
  doc.setFontSize(8);
  doc.setFont('helvetica', 'normal');
  doc.text('Número de Registro Ambiental BOO2604804813', centroX, 24);
  doc.text('Autorización 26-30-P5-11-10-13', centroX, 29);
  doc.text('Puerto Peñasco, Sonora C.P 83500', centroX, 34);

  // Línea de fecha con lugar
  yPosition = 55;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  const fechaEmision = new Date(manifiesto.fecha_emision);
  const dia = fechaEmision.getDate();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mes = meses[fechaEmision.getMonth()];
  const anio = fechaEmision.getFullYear();
  const fechaTexto = `Puerto Peñasco, Sonora a ${dia} de ${mes} de ${anio}`;
  doc.text(fechaTexto, margin, yPosition);

  // CUADRO PRINCIPAL DEL FORMULARIO
  yPosition = 65;
  doc.setLineWidth(1);
  doc.rect(15, yPosition, pageWidth - 30, 140);

  // FECHA
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', 25, yPosition);
  doc.setLineWidth(0.5);
  doc.line(50, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  // Agregar fecha formateada
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  const fechaFormato = `${dia}/${fechaEmision.getMonth() + 1}/${anio}`;
  doc.text(fechaFormato, 52, yPosition);

  // NOMBRE DEL BARCO
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NOMBRE DEL BARCO:', 25, yPosition);
  doc.line(75, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  // Agregar el nombre del barco si existe
  if (manifiesto.buque?.nombre_buque) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(manifiesto.buque.nombre_buque, 77, yPosition);
  }

  // ACEITE USADO (en litros)
  yPosition += 15;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('ACEITE USADO:', 25, yPosition);
  doc.line(60, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  if (manifiesto.residuos?.aceite_usado) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${manifiesto.residuos.aceite_usado} litros`, 62, yPosition);
  }

  // FILTROS DE ACEITE (en piezas)
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('FILTROS DE ACEITE:', 25, yPosition);
  doc.line(70, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  if (manifiesto.residuos?.filtros_aceite) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const unidad = manifiesto.residuos.filtros_aceite === 1 ? 'pieza' : 'piezas';
    doc.text(`${manifiesto.residuos.filtros_aceite} ${unidad}`, 72, yPosition);
  }

  // FILTROS DE DIESEL (en piezas)
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('FILTROS DE DIESEL:', 25, yPosition);
  doc.line(70, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  if (manifiesto.residuos?.filtros_diesel) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    const unidad = manifiesto.residuos.filtros_diesel === 1 ? 'pieza' : 'piezas';
    doc.text(`${manifiesto.residuos.filtros_diesel} ${unidad}`, 72, yPosition);
  }

  // FILTROS DE AIRE (campo vacío para compatibilidad con el formato)
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('FILTROS DE AIRE:', 25, yPosition);
  doc.line(65, yPosition + 2, pageWidth - 25, yPosition + 2);

  // BASURA (en kg)
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('BASURA:', 25, yPosition);
  doc.line(50, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  if (manifiesto.residuos?.basura) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(`${manifiesto.residuos.basura} kg`, 52, yPosition);
  }

  // SECCIÓN DE RECIBE
  yPosition += 25;
  doc.setLineWidth(1);
  doc.line(15, yPosition, pageWidth - 15, yPosition);
  
  yPosition += 8;
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBE: Comisionado para elección de...', 25, yPosition);
  
  yPosition += 6;
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.text('Basura y Residuos Aceitosos (MARPOL - ANEXO)', 25, yPosition);

  // FIRMAS EN LA PARTE INFERIOR
  yPosition += 20;
  const firmaWidth = (pageWidth - 40) / 3;
  const firmaStartX = 20;
  
  // Líneas de firma
  doc.setLineWidth(0.5);
  
  // RESPONSABLE DE ENTREGA DE LÍQUIDOS (ACEITE USADO)
  doc.line(firmaStartX, yPosition, firmaStartX + firmaWidth - 5, yPosition);
  doc.setFontSize(7);
  doc.setFont('helvetica', 'bold');
  const text1 = 'RESPONSABLE DE ENTREGA DE';
  const text2 = 'LIQUIDOS';
  const text3 = '(ACEITE USADO)';
  doc.text(text1, firmaStartX + (firmaWidth - 5) / 2, yPosition + 5, { align: 'center' });
  doc.text(text2, firmaStartX + (firmaWidth - 5) / 2, yPosition + 9, { align: 'center' });
  doc.text(text3, firmaStartX + (firmaWidth - 5) / 2, yPosition + 13, { align: 'center' });
  
  if (manifiesto.responsable_principal) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(manifiesto.responsable_principal.nombre, firmaStartX + (firmaWidth - 5) / 2, yPosition - 3, { align: 'center' });
  }
  
  // MOTORISTA
  const motorX = firmaStartX + firmaWidth + 10;
  doc.line(motorX, yPosition, motorX + firmaWidth - 5, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.text('MOTORISTA:', motorX + (firmaWidth - 5) / 2, yPosition + 5, { align: 'center' });
  
  if (manifiesto.responsable_secundario) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(manifiesto.responsable_secundario.nombre, motorX + (firmaWidth - 5) / 2, yPosition - 3, { align: 'center' });
  }
  
  // COCINERO
  const cocineroX = motorX + firmaWidth + 10;
  doc.line(cocineroX, yPosition, cocineroX + firmaWidth - 5, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.text('COCINERO:', cocineroX + (firmaWidth - 5) / 2, yPosition + 5, { align: 'center' });

  // PIE DE PÁGINA
  yPosition = pageHeight - 20;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const piePagina = 'Av. La Dársena entre 7 y 8 recinto portuario tel.: 638 105 603G. Comisionado de líquidos y sólidos 1er.';
  const piePagina2 = 'oficial líquidos y sólidos. Francisco Javier Bojórquez Ochoa.';
  doc.text(piePagina, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(piePagina2, pageWidth / 2, yPosition + 4, { align: 'center' });

  // Convertir a Blob
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
export async function descargarPDFManifiesto(manifiesto: ManifiestoConRelaciones): Promise<void> {
  const pdfBlob = await generarPDFManifiesto(manifiesto);
  const url = URL.createObjectURL(pdfBlob);
  const link = document.createElement('a');
  link.href = url;
  link.download = generarNombreArchivoPDF(manifiesto.numero_manifiesto);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

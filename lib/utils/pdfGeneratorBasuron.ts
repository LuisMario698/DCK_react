import jsPDF from 'jspdf';
import { ManifiestoBasuronConRelaciones } from '@/types/database';

// URLs de las imágenes en Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LOGO_SEMARNAT_URL = `${SUPABASE_URL}/storage/v1/object/public/images/logoSemarnat.png`;

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

export async function generateBasuronPDF(manifiesto: ManifiestoBasuronConRelaciones) {
  const doc = new jsPDF();
  
  // Configuración
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  let yPosition = margin;

  // Cargar logo SEMARNAT
  const logoSemarnatBase64 = await cargarImagenBase64(LOGO_SEMARNAT_URL);

  // ENCABEZADO PRINCIPAL CON BORDE
  doc.setLineWidth(1.5);
  doc.roundedRect(10, 10, pageWidth - 20, 35, 3, 3);
  
  // Logo SEMARNAT
  if (logoSemarnatBase64) {
    try {
      doc.addImage(logoSemarnatBase64, 'PNG', 12, 11.5, 70, 32);
    } catch (error) {
      console.error('Error agregando logo SEMARNAT:', error);
    }
  }

  // Información del centro
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
  const fechaEmision = new Date(manifiesto.fecha);
  const dia = fechaEmision.getDate();
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  const mes = meses[fechaEmision.getMonth()];
  const anio = fechaEmision.getFullYear();
  const fechaTexto = `Puerto Peñasco, Sonora a ${dia} de ${mes} de ${anio}`;
  doc.text(fechaTexto, margin, yPosition);

  // CUADRO PRINCIPAL DEL FORMULARIO
  yPosition = 65;
  doc.setLineWidth(1);
  doc.rect(15, yPosition, pageWidth - 30, 135);

  // TICKET
  yPosition += 10;
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.text('TICKET:', 25, yPosition);
  doc.setLineWidth(0.5);
  doc.line(50, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(`#${manifiesto.id}`, 52, yPosition);

  // NOMBRE DEL BARCO
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NOMBRE DEL BARCO:', 25, yPosition);
  doc.line(75, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  if (manifiesto.buque?.nombre_buque) {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.text(manifiesto.buque.nombre_buque, 77, yPosition);
  }

  // HORA DE ENTRADA
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('HORA DE ENTRADA:', 25, yPosition);
  doc.line(68, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  const horaEntrada = new Date(manifiesto.created_at).toLocaleTimeString('es-ES', {
    hour: '2-digit',
    minute: '2-digit'
  });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(horaEntrada, 70, yPosition);

  // HORA DE SALIDA
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('HORA DE SALIDA:', 25, yPosition);
  doc.line(65, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  const horaSalida = manifiesto.updated_at && manifiesto.estado === 'Completado'
    ? new Date(manifiesto.updated_at).toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit'
      })
    : 'Pendiente';
  doc.setFont('helvetica', 'normal');
  doc.text(horaSalida, 67, yPosition);

  // PESO DE ENTRADA
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('PESO DE ENTRADA:', 25, yPosition);
  doc.line(68, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  doc.setFont('helvetica', 'normal');
  doc.text(`${manifiesto.peso_entrada.toFixed(2)} kg`, 70, yPosition);

  // PESO DE SALIDA
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('PESO DE SALIDA:', 25, yPosition);
  doc.line(65, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  const pesoSalida = manifiesto.peso_salida ? `${manifiesto.peso_salida.toFixed(2)} kg` : 'Pendiente';
  doc.setFont('helvetica', 'normal');
  doc.text(pesoSalida, 67, yPosition);

  // TOTAL DEPOSITADO (destacado)
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.text('TOTAL DEPOSITADO:', 25, yPosition);
  doc.line(70, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  doc.setFontSize(11);
  doc.text(`${manifiesto.total_depositado.toFixed(2)} kg`, 72, yPosition);

  // NOMBRE DEL USUARIO
  yPosition += 15;
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.text('NOMBRE DEL USUARIO:', 25, yPosition);
  doc.line(75, yPosition + 2, pageWidth - 25, yPosition + 2);
  
  const nombreUsuario = manifiesto.responsable?.nombre || 'No especificado';
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.text(nombreUsuario, 77, yPosition);

  // SECCIÓN DE RECIBE
  yPosition += 20;
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
  yPosition += 15;
  const firmaWidth = (pageWidth - 50) / 2;
  const firmaStartX = 25;
  
  // RESPONSABLE
  doc.setLineWidth(0.5);
  doc.line(firmaStartX, yPosition, firmaStartX + firmaWidth, yPosition);
  doc.setFontSize(8);
  doc.setFont('helvetica', 'bold');
  doc.text('RESPONSABLE', firmaStartX + firmaWidth / 2, yPosition + 5, { align: 'center' });
  
  if (manifiesto.responsable) {
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(manifiesto.responsable.nombre, firmaStartX + firmaWidth / 2, yPosition - 3, { align: 'center' });
  }

  // OBSERVACIONES
  const obsX = firmaStartX + firmaWidth + 20;
  doc.line(obsX, yPosition, obsX + firmaWidth, yPosition);
  doc.setFont('helvetica', 'bold');
  doc.text('OBSERVACIONES:', obsX + firmaWidth / 2, yPosition + 5, { align: 'center' });
  
  if (manifiesto.observaciones) {
    doc.setFontSize(7);
    doc.setFont('helvetica', 'normal');
    const obsTexto = doc.splitTextToSize(manifiesto.observaciones, firmaWidth - 10);
    doc.text(obsTexto, obsX + firmaWidth / 2, yPosition - 3, { align: 'center' });
  }

  // PIE DE PÁGINA
  yPosition = pageHeight - 20;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(0, 0, 0);
  const piePagina = 'Av. La Dársena entre 7 y 8 recinto portuario tel.: 638 105 603G. Comisionado de líquidos y sólidos 1er.';
  const piePagina2 = 'oficial líquidos y sólidos. Francisco Javier Bojórquez Ochoa.';
  doc.text(piePagina, pageWidth / 2, yPosition, { align: 'center' });
  doc.text(piePagina2, pageWidth / 2, yPosition + 4, { align: 'center' });

  // Guardar PDF
  const fileName = `Manifiesto_Basuron_${manifiesto.id}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
}

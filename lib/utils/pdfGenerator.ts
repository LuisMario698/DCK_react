import jsPDF from 'jspdf';
import { ManifiestoConRelaciones } from '@/types/database';
import logoDck from '@/Contexto-DCK/logo_DCK.png';
import escudoMexico from '@/Contexto-DCK/escudo_mexico.png';

// URLs de las imágenes en Supabase
const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const LOGO_SEMARNAT_URL = `${SUPABASE_URL}/storage/v1/object/public/images/logoSemarnat.png`;

const COLORS = {
  text: '#000000',
  border: '#000000',
  secondary: '#4b5563'
};

export interface FirmasManifiesto {
  motoristaFirma?: string | null;
  motoristaNombre?: string;
  cocineroFirma?: string | null;
  cocineroNombre?: string;
  oficialFirma?: string | null;
  liquidosFirma?: string | null;
  liquidosNombre?: string;
}

interface ImageInfo {
  data: string;
  ratio: number;
}

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
          ratio: img.width / img.height // Ancho / Alto
        });
      } else {
        resolve(null);
      }
    };
    img.onerror = () => resolve(null);
    img.src = src;
  });
}

export async function generarPDFManifiesto(manifiesto: ManifiestoConRelaciones, firmas?: FirmasManifiesto): Promise<Blob> {
  const doc = new jsPDF();
  const width = doc.internal.pageSize.getWidth();
  const height = doc.internal.pageSize.getHeight();
  const margin = 12;
  const contentWidth = width - (margin * 2);

  const [logoSemarnat, logoDckInfo, escudoInfo] = await Promise.all([
    cargarImagen(LOGO_SEMARNAT_URL),
    cargarImagen(logoDck),
    cargarImagen(escudoMexico)
  ]);

  let y = margin;

  // --- 1. ENCABEZADO (Caja Doble) ---
  doc.setLineWidth(0.7);
  doc.roundedRect(margin, y, contentWidth, 32, 3, 3);
  doc.setLineWidth(0.2);
  doc.roundedRect(margin + 1, y + 1, contentWidth - 2, 30, 2, 2);

  // Logo SEMARNAT (Izquierda)
  if (logoSemarnat) {
    let h = 16; 
    let w = h * logoSemarnat.ratio;
    // Límite de ancho para que no choque con el centro
    if (w > 65) {
      w = 65;
      h = w / logoSemarnat.ratio;
    }
    // Centrar verticalmente en su espacio
    const yOffset = y + ((32 - h) / 2);
    doc.addImage(logoSemarnat.data, 'PNG', margin + 3, yOffset, w, h);
  }

  // Escudo de México (Centro-Arriba junto a SEMARNAT)
  if (escudoInfo) {
    const h = 22;
    const w = h * escudoInfo.ratio;
    // Centrado exacto respecto al ancho total menos un pequeño offset hacia la izquierda
    const xCenter = (width / 2) - (w / 2) - 10;
    const yOffset = y + ((32 - h) / 2);
    doc.addImage(escudoInfo.data, 'PNG', xCenter, yOffset, w, h);
  }

  // Texto Institucional (Derecha)
  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  const headerTextX = width - margin - 3;
  doc.text('SEMARNAT', headerTextX, y + 8, { align: 'right' });
  doc.setFontSize(7.5);
  doc.text('CENTRO DE ACOPIO 2024 AL 2034', headerTextX, y + 14, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.text(`Número de Registro Ambiental: ${manifiesto.numero_manifiesto || 'BOO2604804813'}`, headerTextX, y + 19, { align: 'right' });
  doc.text('Autorización 26-30-PS-11-10-13', headerTextX, y + 24, { align: 'right' });
  doc.text('Puerto Peñasco, Sonora C.P 83500', headerTextX, y + 28, { align: 'right' });

  y += 42;

  // --- 2. LUGAR Y FECHA ---
  const fecha = new Date(manifiesto.fecha_emision + 'T00:00:00');
  const meses = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
  
  doc.setFontSize(10);
  const textoFecha = `Puerto Peñasco, Sonora a ${fecha.getDate()} de ${meses[fecha.getMonth()]} de ${fecha.getFullYear()}`;
  doc.text(textoFecha, width / 2, y, { align: 'center' });
  
  y += 8;

  // --- 3. CAJA PRINCIPAL ---
  const mainBoxY = y;
  const mainBoxHeight = 185;

  // Marca de Agua (Escudo PNG) - CORREGIDO PROPORCIONALMENTE
  if (escudoInfo) {
    const watermarkH = 140; // Alto fijo
    const watermarkW = watermarkH * escudoInfo.ratio; // Ancho proporcional (para no estirar)
    
    // @ts-ignore
    const gstate = doc.GState ? new doc.GState({ opacity: 0.05 }) : null;
    if (gstate) doc.setGState(gstate);
    
    const xWatermark = (width - watermarkW) / 2;
    const yWatermark = mainBoxY + ((mainBoxHeight - watermarkH) / 2) - 10;
    
    doc.addImage(escudoInfo.data, 'PNG', xWatermark, yWatermark, watermarkW, watermarkH);
    
    // @ts-ignore
    if (doc.GState) doc.setGState(new doc.GState({ opacity: 1 }));
  }

  doc.setLineWidth(0.8);
  doc.rect(margin, mainBoxY, contentWidth, mainBoxHeight);

  // Campos del Formulario
  let campoY = mainBoxY + 15;
  const drawCampoForm = (label: string, value: string, isFullWidth = true) => {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'bold');
    doc.text(label, margin + 8, campoY);
    
    const labelW = doc.getTextWidth(label);
    doc.setFont('helvetica', 'normal');
    doc.text(value, margin + 12 + labelW, campoY - 0.5);
    
    doc.setLineWidth(0.3);
    const lineEnd = isFullWidth ? width - margin - 10 : margin + 80;
    doc.line(margin + 10 + labelW, campoY + 1, lineEnd, campoY + 1);
    campoY += 18;
  };

  const fFormateada = fecha.toLocaleDateString('es-MX', { day: '2-digit', month: '2-digit', year: 'numeric', timeZone: 'UTC' });
  
  // Fecha a la derecha
  doc.setFont('helvetica', 'bold');
  doc.text('FECHA:', width - 65, mainBoxY + 15);
  doc.setFont('helvetica', 'normal');
  doc.text(fFormateada, width - 45, mainBoxY + 15);
  doc.line(width - 48, mainBoxY + 16, width - margin - 10, mainBoxY + 16);
  campoY += 5;

  drawCampoForm('NOMBRE DEL BARCO:', (manifiesto.buque?.nombre_buque || '').toUpperCase());
  drawCampoForm('ACEITE USADO:', `${manifiesto.residuos?.aceite_usado || '0'} litros`);
  drawCampoForm('FILTROS DE ACEITE:', `${manifiesto.residuos?.filtros_aceite || '0'} piezas`);
  drawCampoForm('FILTROS DE DIESEL:', `${manifiesto.residuos?.filtros_diesel || '0'} piezas`);
  drawCampoForm('FILTROS DE AIRE:', `${manifiesto.residuos?.filtros_aire || '0'} piezas`);
  drawCampoForm('BASURA:', `${manifiesto.residuos?.basura || '0'} kg`);

  // --- 4. SECCIÓN RECIBE (COMISIONADO) ---
  const recibeY = mainBoxY + mainBoxHeight - 65;
  doc.setLineWidth(0.8);
  doc.line(margin, recibeY, width - margin, recibeY);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text('RECIBE: Comisionado para elección de...', margin + 5, recibeY + 8);
  doc.text('Basura y Residuos Aceitosos (MARPOL - ANEXO)', margin + 5, recibeY + 15);

  // Espacio para la firma del comisionado
  if (firmas?.oficialFirma) {
    doc.addImage(firmas.oficialFirma, 'PNG', width / 2 - 25, recibeY + 18, 50, 20);
  }
  doc.setLineWidth(0.4);
  doc.line(width / 2 - 40, recibeY + 40, width / 2 + 40, recibeY + 40);
  doc.setFontSize(9);
  doc.text('Francisco Javier Bojórquez Ochoa', width / 2, recibeY + 45, { align: 'center' });
  doc.setFontSize(7);
  doc.text('Oficial de líquidos y sólidos', width / 2, recibeY + 49, { align: 'center' });

  // --- 5. FIRMAS DE PIE (3 Columnas) ---
  const footerSignY = mainBoxY + mainBoxHeight - 15;
  const colW = contentWidth / 3;

  const drawFirmaCol = (index: number, label: string, subLabel: string, nombre: string, firma?: string | null) => {
    const x = margin + (index * colW);
    const centerX = x + (colW / 2);
    
    if (firma) doc.addImage(firma, 'PNG', centerX - 20, footerSignY - 20, 40, 15);
    
    doc.setLineWidth(0.4);
    doc.line(x + 5, footerSignY, x + colW - 5, footerSignY);
    
    doc.setFontSize(7.5);
    doc.setFont('helvetica', 'bold');
    doc.text(label, centerX, footerSignY + 4, { align: 'center' });
    if (subLabel) doc.text(subLabel, centerX, footerSignY + 8, { align: 'center' });
    
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(nombre.toUpperCase(), centerX, footerSignY + 14, { align: 'center' });
  };

  drawFirmaCol(0, 'RESPONSABLE DE ENTREGA DE', 'LIQUIDOS (ACEITE USADO)', (firmas?.liquidosNombre || manifiesto.responsable_liquidos?.nombre || ''), firmas?.liquidosFirma);
  drawFirmaCol(1, 'MOTORISTA:', '', (firmas?.motoristaNombre || manifiesto.responsable_principal?.nombre || ''), firmas?.motoristaFirma);
  drawFirmaCol(2, 'COCINERO:', '', (firmas?.cocineroNombre || manifiesto.responsable_secundario?.nombre || ''), firmas?.cocineroFirma);

  // --- 6. PIE DE PÁGINA ---
  const footerY = height - 10;
  doc.setFontSize(7);
  doc.setFont('helvetica', 'normal');
  doc.text('Av. La Dársena entre 7 y 8 recinto portuario tel.: 638 105 6039. Comisionado de líquidos y sólidos 1er.', width / 2, footerY - 3, { align: 'center' });
  doc.text('oficial líquidos y sólidos. Francisco Javier Bojórquez Ochoa.', width / 2, footerY, { align: 'center' });

  return doc.output('blob');
}

export function generarNombreArchivoPDF(numeroManifiesto: string): string {
  const fecha = new Date().toISOString().split('T')[0];
  return `manifiesto_${numeroManifiesto}_${fecha}.pdf`;
}

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
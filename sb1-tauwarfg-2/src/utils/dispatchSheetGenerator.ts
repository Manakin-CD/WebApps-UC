import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Maquila } from '../types';

interface DispatchRow {
  cantidad: string;
  descripcion: string;
  cliente: string;
}

interface DispatchSheetData {
  fechaEntrega: string;
  comentarios: string;
  rows: DispatchRow[];
}

const formatDate = (dateString: string): string => {
  const [year, month, day] = dateString.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));
  
  return date.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  });
};

export const generateDispatchSheet = async (
  maquila: Maquila,
  data: DispatchSheetData
): Promise<void> => {
  // Crear un nuevo documento PDF
  const doc = new jsPDF();
  
  // Configurar el título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Despacho de Maquila', 105, 15, { align: 'center' });
  
  // Información de la maquila
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nombre: ${maquila.name}`, 14, 35);
  
  // Fechas
  const today = new Date().toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
  
  doc.text(`Fecha de Envío: ${today}`, 14, 45);
  doc.text(`Fecha de Entrega: ${formatDate(data.fechaEntrega)}`, 14, 55);
  
  // Comentarios
  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('Comentarios:', 14, 70);
  
  const splitComments = doc.splitTextToSize(data.comentarios, 180);
  doc.text(splitComments, 14, 78);
  
  // Tabla de despacho
  autoTable(doc, {
    head: [['Cantidad', 'Descripción', 'Cliente']],
    body: data.rows.map(row => [
      row.cantidad,
      row.descripcion,
      row.cliente
    ]),
    startY: 100,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 5,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    }
  });
  
  // Espacio para firma
  const finalY = (doc as any).lastAutoTable.finalY + 30;
  
  doc.setFont('helvetica', 'normal');
  doc.text('Firma de Recibido:', 14, finalY);
  doc.line(50, finalY, 150, finalY);
  
  // Pie de página
  doc.setFontSize(8);
  doc.text(
    'Uniformes Centroamericanos',
    105,
    doc.internal.pageSize.height - 10,
    { align: 'center' }
  );
  
  // Guardar el PDF
  const fileName = `Despacho_Maquila_${maquila.name.replace(/\s+/g, '_')}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
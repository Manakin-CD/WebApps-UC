import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { Maquila } from '../types';

interface MaquilaClosure {
  id: string;
  maquila_id: string;
  tipo: string;
  cantidad: number;
  precio: number;
  total: number;
}

export const generateMaquilaClosurePDF = async (
  maquila: Maquila,
  closureData: MaquilaClosure[],
  advanceAmount: number
): Promise<void> => {
  // Crear un nuevo documento PDF
  const doc = new jsPDF();
  
  // Configurar el título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Cierre de Maquila', 105, 15, { align: 'center' });
  
  // Información de la maquila
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text(`Nombre: ${maquila.name}`, 14, 35);
  doc.text(`Capacidad: ${maquila.capacity}`, 14, 43);
  doc.text(`Piezas Asignadas: ${maquila.assignedPieces}`, 14, 51);
  
  // Fechas
  const formatDate = (dateString: string | null) => {
    if (!dateString) return 'No establecida';
    
    try {
      const [year, month, day] = dateString.split('-').map(Number);
      const date = new Date(Date.UTC(year, month - 1, day));
      
      if (isNaN(date.getTime())) {
        return 'Fecha no disponible';
      }

      return date.toLocaleDateString('es-ES', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        timeZone: 'UTC'
      });
    } catch (error) {
      return 'Fecha no disponible';
    }
  };
  
  doc.text(`Fecha de Despacho: ${formatDate(maquila.startDate)}`, 14, 59);
  doc.text(`Fecha de Entrega: ${formatDate(maquila.endDate)}`, 14, 67);
  doc.text(`Fecha de Pago: ${formatDate(maquila.paymentDate)}`, 14, 75);
  
  // Fecha de generación del reporte
  const today = new Date();
  doc.text(`Fecha de Cierre: ${today.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 14, 83);
  
  // Tabla de cierres
  const tableData = closureData.map(closure => [
    closure.tipo,
    closure.cantidad.toString(),
    closure.precio.toFixed(2),
    (closure.cantidad * closure.precio).toFixed(2)
  ]);
  
  // Calcular totales
  const totals = closureData.reduce(
    (acc, curr) => ({
      cantidad: acc.cantidad + curr.cantidad,
      total: acc.total + (curr.cantidad * curr.precio)
    }),
    { cantidad: 0, total: 0 }
  );
  
  // Agregar fila de totales
  tableData.push(['Totales', totals.cantidad.toString(), '', totals.total.toFixed(2)]);
  
  // Agregar fila de adelanto si existe
  if (advanceAmount > 0) {
    tableData.push(['Monto de Adelanto', '', '', `-${advanceAmount.toFixed(2)}`]);
    tableData.push(['Total Final', '', '', (totals.total - advanceAmount).toFixed(2)]);
  }
  
  // Generar la tabla
  autoTable(doc, {
    head: [['Tipo', 'Cantidad', 'Precio', 'Total']],
    body: tableData,
    startY: 95,
    theme: 'grid',
    styles: {
      fontSize: 10,
      cellPadding: 3,
      lineColor: [0, 0, 0],
      lineWidth: 0.1,
      fontStyle: 'bold',
    },
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    alternateRowStyles: {
      fillColor: [240, 240, 240],
    },
    rowStyles: (row) => {
      if (row === tableData.length - 1 || (advanceAmount > 0 && row === tableData.length - 2)) {
        return {
          fontStyle: 'bold',
          fillColor: [200, 230, 255],
        };
      }
      if (advanceAmount > 0 && row === tableData.length - 3) {
        return {
          fontStyle: 'bold',
          fillColor: [255, 230, 230],
        };
      }
      return {};
    },
  });
  
  // Agregar espacio para firmas
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Firma de Entrega: _______________________', 14, finalY);
  doc.text('Firma de Recepción: _______________________', 14, finalY + 15);
  
  // Agregar pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount} - Uniformes Centroamericanos - Cierre de Maquila: ${maquila.name}`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }
  
  // Guardar el PDF
  const fileName = `Cierre_Maquila_${maquila.name.replace(/\s+/g, '_')}_${today.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};

export const generateGlobalClosurePDF = async (maquilasData: Array<{
  maquila: Maquila;
  total: number;
}>): Promise<void> => {
  const doc = new jsPDF();
  
  // Título
  doc.setFontSize(18);
  doc.setFont('helvetica', 'bold');
  doc.text('Cierre Global de Maquilas', 105, 15, { align: 'center' });
  
  // Fecha del reporte
  const today = new Date();
  doc.setFontSize(12);
  doc.text(`Fecha de Cierre: ${today.toLocaleDateString('es-ES', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  })}`, 14, 30);

  // Preparar datos para la tabla
  const tableData = maquilasData.map(({ maquila, total }) => [
    maquila.name,
    total.toFixed(2)
  ]);

  // Calcular total global
  const totalGlobal = maquilasData.reduce((acc, { total }) => acc + total, 0);
  
  // Agregar fila de total global
  tableData.push(['Total Global', totalGlobal.toFixed(2)]);

  // Generar la tabla
  autoTable(doc, {
    head: [['Nombre de Maquila', 'Monto Total']],
    body: tableData,
    startY: 40,
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
    },
    rowStyles: (row) => {
      if (row === tableData.length - 1) {
        return {
          fontStyle: 'bold',
          fillColor: [200, 230, 255],
        };
      }
      return {};
    },
  });

  // Agregar espacio para firmas
  const finalY = (doc as any).lastAutoTable.finalY + 20;
  
  doc.setFont('helvetica', 'bold');
  doc.text('Firma de Autorización: _______________________', 14, finalY);
  doc.text('Firma de Contabilidad: _______________________', 14, finalY + 15);

  // Pie de página
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setFont('helvetica', 'normal');
    doc.text(
      `Página ${i} de ${pageCount} - Uniformes Centroamericanos - Cierre Global`,
      105,
      doc.internal.pageSize.height - 10,
      { align: 'center' }
    );
  }

  // Guardar el PDF
  const fileName = `Cierre_Global_${today.toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
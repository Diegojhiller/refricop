import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

export const generateQuotePDF = (workOrder, client, isQuote = false) => {
  const doc = new jsPDF();
  
  // Encabezado
  doc.setFontSize(22);
  doc.setTextColor(6, 182, 212); // Cian
  doc.text('REFRICOP', 14, 20);
  
  doc.setFontSize(10);
  doc.setTextColor(100);
  doc.text('Soluciones en Refrigeración y Lavarropas', 14, 26);
  doc.text('Tel: +54 9 11 1234-5678', 14, 32);
  
  // Título del documento
  doc.setFontSize(16);
  doc.setTextColor(0);
  const title = isQuote ? 'PRESUPUESTO DE REPARACIÓN' : 'ORDEN DE TRABAJO FINALIZADA';
  doc.text(title, 14, 45);
  
  // Datos del Cliente y Equipo
  doc.setFontSize(11);
  doc.text(`Fecha: ${new Date().toLocaleDateString()}`, 14, 55);
  doc.text(`Cliente: ${client.name}`, 14, 62);
  doc.text(`Domicilio: ${client.address}`, 14, 69);
  doc.text(`Equipo: ${workOrder.equipmentType} - ${workOrder.equipmentBrand}`, 14, 76);
  doc.text(`Diagnóstico: ${workOrder.diagnosis}`, 14, 83);
  
  // Tabla de Repuestos/Servicios
  const tableData = workOrder.items.map(i => [
    i.description || 'Repuesto / Mano de Obra general',
    i.quantity,
    `$${Number(i.priceApplied).toLocaleString()}`,
    `$${(Number(i.priceApplied) * Number(i.quantity)).toLocaleString()}`
  ]);

  autoTable(doc, {
    startY: 95,
    head: [['Detalle', 'Cant', 'Precio Unit.', 'Subtotal']],
    body: tableData,
    theme: 'grid',
    headStyles: { fillColor: [6, 182, 212] } // Cyan Header
  });
  
  // Total
  const finalY = doc.lastAutoTable ? doc.lastAutoTable.finalY : (doc.previousAutoTable ? doc.previousAutoTable.finalY : 100);
  doc.setFontSize(14);
  doc.setTextColor(0);
  doc.text(`Monto Total: $${Number(workOrder.totalCost).toLocaleString()}`, 14, finalY + 15);
  
  // Footer
  doc.setFontSize(10);
  doc.setTextColor(150);
  doc.text('Gracias por elegir Refricop. Garantía estándar de 3 meses.', 14, 280);

  // Descargar Archivo
  doc.save(`Refricop_${isQuote ? 'Presupuesto' : 'Ticket'}_${client.name.replace(/ /g, '_')}.pdf`);
};

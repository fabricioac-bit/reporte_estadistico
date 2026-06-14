// src/lib/exportadores.ts
import ExcelJS from 'exceljs';
// @ts-ignore
import { saveAs } from 'file-saver';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

interface RowProductividad {
  id: number;
  nombre: string;
  especialidad: string;
  turno: string;
  agendadas: number;
  atendidos: number;
  ausentes: number;
  adicionales: number;
  tiempoPromedio: string;
}

// =========================================================================
// 1. HELPER EXCEL: EXPORTACIÓN CORPORATIVA SLATE BLUE
// =========================================================================
export const generarExcelProductividad = async (datos: RowProductividad[], turnoActivo: string) => {
  if (!datos || datos.length === 0) {
    alert("No hay datos en la tabla para exportar.");
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Productividad');

  worksheet.views = [{ showGridLines: true }];

  try {
    const respuesta = await fetch('/assets/image001.png');
    const blob = await respuesta.blob();
    const base64 = await new Promise<string>((resolve) => {
      const lector = new FileReader();
      lector.onloadend = () => resolve((lector.result as string).split(',')[1]);
      lector.readAsDataURL(blob);
    });

    const logoId = workbook.addImage({
      base64: base64,
      extension: 'png',
    });

    worksheet.addImage(logoId, {
      tl: { col: 1, row: 1 }, 
      ext: { width: 55, height: 55 }
    });
  } catch (error) {
    console.warn("No se pudo cargar el logo en el Excel.", error);
  }

  const celdaEmpresa = worksheet.getCell('C2');
  celdaEmpresa.value = "Hospital Regional Rezola de Cañete";
  celdaEmpresa.font = { name: 'Segoe UI', size: 15, bold: true, color: { argb: 'FF1E293B' } };

  const celdaTitulo = worksheet.getCell('C3');
  celdaTitulo.value = `Reporte de Productividad Médica — Turno ${turnoActivo}`;
  celdaTitulo.font = { name: 'Segoe UI', size: 11, italic: true, color: { argb: 'FF64748B' } };

  worksheet.getRow(4).height = 15;

  const filaEncabezado = worksheet.getRow(5);
  filaEncabezado.values = [
    "", "MÉDICO", "ESPECIALIDAD", "TURNO", "AGENDADAS", "ATENDIDAS", "% ASISTENCIA", "ADICIONALES", "AUSENTES", "TIEMPO PROM."
  ]; 
  filaEncabezado.height = 28; 

  filaEncabezado.eachCell((celda, colNumber) => {
    if (colNumber > 1) { 
      celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      celda.font = { name: 'Segoe UI', color: { argb: 'FFFFFFFF' }, bold: true, size: 10 };
      celda.alignment = { vertical: 'middle', horizontal: 'center' };
    }
  });

  datos.forEach((medico) => {
    const porcentajeAsistencia = medico.agendadas > 0 
      ? ((medico.atendidos / medico.agendadas) * 100).toFixed(1) + '%' 
      : '0.0%';

    worksheet.addRow([
      "", 
      medico.nombre,
      medico.especialidad,
      medico.turno,
      Number(medico.agendadas),
      Number(medico.atendidos),
      porcentajeAsistencia,
      Number(medico.adicionales || 0),
      Number(medico.ausentes || 0),
      medico.tiempoPromedio || '-'
    ]);
  });

  worksheet.getColumn(1).width = 3;   
  worksheet.getColumn(2).width = 32;  
  worksheet.getColumn(3).width = 28;  
  worksheet.getColumn(4).width = 12;  
  worksheet.getColumn(5).width = 14;  
  worksheet.getColumn(6).width = 14;  
  worksheet.getColumn(7).width = 15;  
  worksheet.getColumn(8).width = 14;  
  worksheet.getColumn(9).width = 13;  
  worksheet.getColumn(10).width = 15; 

  worksheet.eachRow((fila: ExcelJS.Row, rowNumber: number) => {
    if (rowNumber > 5) {
      fila.height = 22;
      const esPar = rowNumber % 2 === 0;

      fila.eachCell((celda, colNumber) => {
        if (colNumber > 1) {
          celda.font = { name: 'Segoe UI', size: 10, color: { argb: 'FF334155' } };
          celda.alignment = { 
            vertical: 'middle', 
            horizontal: (colNumber === 2 || colNumber === 3) ? 'left' : 'center' 
          };
          
          if (esPar) {
            celda.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF8FAFC' } };
          }

          celda.border = {
            top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
            right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
          };
        }
      });
    }
  });

  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  saveAs(blob, `Reporte_Productividad_Rezola_Turno_${turnoActivo}.xlsx`);
};

// =========================================================================
// 2. HELPER PDF: EXPORTACIÓN VERTICAL SIN DESBORDE (A4 PORTRAIT)
// =========================================================================
export const generarPDFProductividad = (datos: RowProductividad[], turnoActivo: string) => {
  if (!datos || datos.length === 0) {
    alert("No hay datos en la tabla para exportar.");
    return;
  }

  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });

  doc.setFont('Helvetica', 'bold');
  doc.setFontSize(14);
  doc.setTextColor(30, 41, 59);
  doc.text("Hospital Regional Rezola de Cañete", 14, 18);

  doc.setFont('Helvetica', 'italic');
  doc.setFontSize(9);
  doc.setTextColor(100, 116, 139);
  doc.text(`Reporte Estadístico de Productividad Médica — Turno: ${turnoActivo}`, 14, 23);

  const filasTabla = datos.map((medico) => {
    const porcentajeAsistencia = medico.agendadas > 0 
      ? ((medico.atendidos / medico.agendadas) * 100).toFixed(1) + '%' 
      : '0.0%';

    return [
      medico.nombre,
      medico.especialidad,
      medico.turno,
      medico.agendadas,
      medico.atendidos,
      porcentajeAsistencia,
      medico.adicionales || 0,
      medico.ausentes || 0,
      medico.tiempoPromedio || '-'
    ];
  });

  // Ejecutamos autoTable de forma directa y segura mediante casteo explícito
  (autoTable as any)(doc, {
    startY: 28,
    margin: { left: 14, right: 14 },
    head: [['MÉDICO', 'ESPECIALIDAD', 'TURNO', 'AGEND.', 'ATEND.', '% ASIST.', 'ADIC.', 'AUS.', 'T. PROM.']],
    body: filasTabla,
    theme: 'striped',
    headStyles: {
      fillColor: [30, 58, 138],
      textColor: [255, 255, 255],
      fontSize: 8.5,
      fontStyle: 'bold',
      halign: 'center',
      valign: 'middle'
    },
    styles: { font: 'Helvetica', fontSize: 7.5, cellPadding: 2, valign: 'middle' },
    columnStyles: {
      0: { halign: 'left', cellWidth: 42 },
      1: { halign: 'left', cellWidth: 35 },
      2: { halign: 'center', cellWidth: 14 },
      3: { halign: 'center', cellWidth: 13 },
      4: { halign: 'center', cellWidth: 13 },
      5: { halign: 'center', cellWidth: 15 },
      6: { halign: 'center', cellWidth: 13 },
      7: { halign: 'center', cellWidth: 13 },
      8: { halign: 'center', cellWidth: 17 }
    },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    didDrawPage: (data: any) => {
      const numPagina = `Página ${doc.getNumberOfPages()}`;
      doc.setFontSize(8);
      doc.setTextColor(148, 163, 184);
      doc.text(numPagina, data.settings.margin.left, doc.internal.pageSize.height - 10);
    }
  });

  doc.save(`Reporte_Productividad_Rezola_Turno_${turnoActivo}.pdf`);
};
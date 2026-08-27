/** Columna de un reporte generado en PDF */
export interface ReportColumn {
  key: string;
  label: string;
  width: string | number;
  dataType?: 'date' | 'boolean' | string;
}

/** Estructura de datos que recibe generatePDF */
export interface DataReport {
  columns: ReportColumn[];
  data: Record<string, any>[];
}

/** Celda tal como la espera pdfmake */
export interface PdfMakeCell {
  text?: any;
  fillColor?: string;
  margin?: number[];
  bold?: boolean;
}

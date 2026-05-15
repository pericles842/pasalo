import * as pdfMake from 'pdfmake/build/pdfmake';
import * as pdfFonts from 'pdfmake/build/vfs_fonts';
import moment from 'moment';
import { DataReport, PdfMakeCell } from '../app/interfaces/report';

(<any>pdfMake).addVirtualFileSystem(pdfFonts);

const primaryColorReport = '#a3e635';

export const generatePDF = async (title_report: string, data: DataReport) => {
  const dateStr = moment().format('MM-DD-YYYY');

  //*tamaños de las columnas
  let widths_columns = data.columns.map((column) => column.width);

  //*Cabeceras de la tabla
  let headers: PdfMakeCell[] = data.columns.map((column) => {
    return {
      text: column.label,
      fillColor: primaryColorReport,
      margin: [0, 5, 0, 5],
      bold: true
    };
  });

  console.log(widths_columns);

  //*Valores del body
  let bodyRenderReport: PdfMakeCell[][] = data.data.map((row) => {
    return data.columns.map((column) => {
      // VALOR DE LA FILA
      let value = row[column.key];

      // Formateo
      if (column.dataType === 'date') {
        value = moment(value).format('DD-MM-YYYY');
      } else if (column.dataType === 'boolean') {
        value = value ? '✓' : '✗';
      }

      //data de inserción
      return {
        margin: [0, 5, 0, 5],
        text: value
      };
    });
  });

  //*Unimos las cabeceras con el body
  bodyRenderReport.unshift(headers);

  const docDefinition: any = {
    content: [
      { text: title_report, style: 'header' },
      { text: `Generado el: ${dateStr}`, style: 'date' },
      {
        table: {
          headerRows: 1,
          dontBreakRows: true,
          keepWithHeaderRows: 1,
          widths: widths_columns,
          body: bodyRenderReport
        },
        layout: {
          fillColor: (rowIndex: number, node: any, columnIndex: number) => {
            // Filas alternadas
            return rowIndex % 2 === 0 ? '#f9f9f9' : null;
          },
          hLineWidth: () => 0, // ancho líneas horizontales
          vLineWidth: () => 0, // ancho líneas verticales
          hLineColor: () => '#f9fafb',
          vLineColor: () => '#f1fdf0',
          margin: [0, 0, 0, 0]
        }
      }
    ],
    styles: {
      header: {
        fontSize: 25,
        bold: true,
        decoration: 'underline',
        decorationColor: primaryColorReport,
        decorationStyle: 'wavy',
        margin: [0, 0, 0, 2]
      },
      date: {
        fontSize: 12,
        margin: [0, 0, 0, 10]
      }
    },
    defaultStyle: {
      fontSize: 10,
      color: '#111827',
      pageMargins: [15, 15, 15, 15]
    }
  };

  // Generamos el PDF como Buffer
  return new Promise<Buffer>((resolve) => {
    pdfMake.createPdf(docDefinition).getBuffer((buffer: Buffer) => {
      resolve(buffer);
    });
  });
};

/**
 *  Setea las cabeceras en los headers de los reportes
 * @param title
 * @param res
 */
export const setHeadersForPdf = async (title: string, res: any) => {
  const dateStr = moment().format('MM-DD-YYYY');

  // Crear filename
  const filename = title.toLowerCase().split(' ').join('_') + '_' + dateStr + '.pdf';

  //attachment para que se descargue
  res.set({
    'Content-Type': 'application/pdf',
    'Content-Disposition': `inline; filename=${filename}.pdf`
  });
};

"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.setHeadersForPdf = exports.generatePDF = void 0;
const pdfMake = __importStar(require("pdfmake/build/pdfmake"));
const pdfFonts = __importStar(require("pdfmake/build/vfs_fonts"));
const moment_1 = __importDefault(require("moment"));
pdfMake.addVirtualFileSystem(pdfFonts);
const primaryColorReport = '#a3e635';
const generatePDF = async (title_report, data) => {
    const dateStr = (0, moment_1.default)().format('MM-DD-YYYY');
    //*tamaños de las columnas
    let widths_columns = data.columns.map((column) => column.width);
    //*Cabeceras de la tabla
    let headers = data.columns.map((column) => {
        return {
            text: column.label,
            fillColor: primaryColorReport,
            margin: [0, 5, 0, 5],
            bold: true
        };
    });
    console.log(widths_columns);
    //*Valores del body
    let bodyRenderReport = data.data.map((row) => {
        return data.columns.map((column) => {
            // VALOR DE LA FILA
            let value = row[column.key];
            // Formateo
            if (column.dataType === 'date') {
                value = (0, moment_1.default)(value).format('DD-MM-YYYY');
            }
            else if (column.dataType === 'boolean') {
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
    const docDefinition = {
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
                    fillColor: (rowIndex, node, columnIndex) => {
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
    return new Promise((resolve) => {
        pdfMake.createPdf(docDefinition).getBuffer((buffer) => {
            resolve(buffer);
        });
    });
};
exports.generatePDF = generatePDF;
/**
 *  Setea las cabeceras en los headers de los reportes
 * @param title
 * @param res
 */
const setHeadersForPdf = async (title, res) => {
    const dateStr = (0, moment_1.default)().format('MM-DD-YYYY');
    // Crear filename
    const filename = title.toLowerCase().split(' ').join('_') + '_' + dateStr + '.pdf';
    //attachment para que se descargue
    res.set({
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename=${filename}.pdf`
    });
};
exports.setHeadersForPdf = setHeadersForPdf;

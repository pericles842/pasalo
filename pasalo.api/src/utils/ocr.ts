import sharp from 'sharp';
import { PSM, createWorker } from 'tesseract.js';

/**
 * Ancho maximo antes de pasar la imagen por OCR. Una foto de celular puede
 * venir en 3000-4000px de ancho: reconocerla asi de grande le exige mucha
 * mas CPU a Tesseract sin ganar nada en precision (el texto de un
 * comprobante se lee perfecto ya en un ancho bastante mas chico). Esto es
 * aparte del resize que se hace para guardar la imagen (uploadFile): ese
 * corre en paralelo, sobre el buffer original, para no encadenar ambos.
 */
const OCR_MAX_WIDTH = 1400;

/** Achica la imagen antes de mandarla a Tesseract; si falla, se sigue con el buffer original */
async function prepareForOcr(buffer: Buffer): Promise<Buffer> {
    try {
        return await sharp(buffer)
            .resize({ width: OCR_MAX_WIDTH, withoutEnlargement: true })
            .toBuffer();
    } catch {
        return buffer;
    }
}

let workerPromise: ReturnType<typeof createWorker> | null = null;

/**
 * El worker de Tesseract se crea una sola vez y se reutiliza entre requests.
 * Se fuerza PSM.SPARSE_TEXT porque el modo por defecto (AUTO) asume el
 * layout de un documento y a veces "pierde" texto que esta dentro de un
 * boton/pill con fondo propio (ej. el monto grande arriba de un comprobante
 * de pago movil/transferencia) al confundirlo con un elemento grafico.
 * SPARSE_TEXT busca texto disperso sin asumir un layout uniforme, mejor
 * para capturas de apps con elementos de interfaz mezclados con texto.
 */
function getWorker() {
    if (!workerPromise) {
        workerPromise = createWorker('spa').then(async (worker) => {
            await worker.setParameters({ tessedit_pageseg_mode: PSM.SPARSE_TEXT });
            return worker;
        });
    }
    return workerPromise;
}

/**
 * Patrones tipicos con los que un pago móvil / transferencia / Zelle muestra
 * el numero de referencia en el comprobante.
 */
const REFERENCE_PATTERNS = [
    /(?:n[uú]mero\s+de\s+)?referencia[:\s#-]*([0-9]{4,})/i,
    /nro\.?\s*ref(?:erencia)?[:\s#-]*([0-9]{4,})/i,
    /operaci[oó]n[:\s#-]*([0-9]{4,})/i,
    /c[oó]digo\s+de\s+transacci[oó]n[:\s#-]*([0-9]{4,})/i,
];

/** Patrones con los que un comprobante muestra el monto pagado */
const AMOUNT_PATTERNS = [
    /monto(?:\s+total)?[:\s]*(?:bs\.?|usd|\$)?\s*([0-9][0-9.,]*[0-9]|[0-9])/i,
    /total(?:\s+pagado)?[:\s]*(?:bs\.?|usd|\$)?\s*([0-9][0-9.,]*[0-9]|[0-9])/i,
    /pagado[:\s]*(?:bs\.?|usd|\$)?\s*([0-9][0-9.,]*[0-9]|[0-9])/i,
];

/**
 * Numeros con formato de monto (dos decimales, con o sin separador de miles):
 * "150,00", "1.234,56", "1,234.56". Tolera un espacio suelto alrededor del
 * separador porque el OCR a veces lo mete ahi. Sirve de respaldo cuando el
 * comprobante no trae ninguna de las palabras clave de AMOUNT_PATTERNS (muy
 * comun: la app del banco solo muestra el numero grande, sin la etiqueta
 * "Monto:").
 */
const DECIMAL_AMOUNT_PATTERN = /\b[0-9]{1,3}(?:\s?[.,]\s?[0-9]{3})*\s?[.,]\s?[0-9]{2}\b/g;

/**
 * Convierte "1.234,56", "1,234.56" o incluso "7.700.00" (OCR a veces lee el
 * separador decimal como el mismo caracter que el de miles) a un numero JS
 * normal. El separador decimal es el ULTIMO que aparece en el texto, siempre
 * que le sigan exactamente 2 digitos; todo lo anterior se trata como miles,
 * sin importar que caracter use.
 */
function parseLocalizedAmount(raw: string): number | null {
    const cleaned = raw.trim();
    const lastSeparator = Math.max(cleaned.lastIndexOf(','), cleaned.lastIndexOf('.'));

    let normalized: string;

    if (lastSeparator === -1) {
        normalized = cleaned;
    } else {
        const decimals = cleaned.length - lastSeparator - 1;
        normalized = decimals === 2
            ? `${cleaned.slice(0, lastSeparator).replace(/[.,]/g, '')}.${cleaned.slice(lastSeparator + 1)}`
            : cleaned.replace(/[.,]/g, '');
    }

    const value = Number(normalized);
    return Number.isFinite(value) && value > 0 ? value : null;
}

/**
 * Extrae del texto del comprobante lo que se logra reconocer: la referencia
 * y el monto pagado. Si ningun patron de referencia calza, se queda con la
 * secuencia de digitos mas larga como mejor intento. El vendedor siempre
 * puede corregir a mano viendo la foto.
 *
 * @export
 * @param {Buffer} buffer
 */
export async function extractReceiptData(buffer: Buffer): Promise<{
    reference: string | null;
    amount: number | null;
    raw_text: string;
}> {
    const worker = await getWorker();
    const resized = await prepareForOcr(buffer);
    const { data } = await worker.recognize(resized);
    const text = data.text || '';

    let reference: string | null = null;

    for (const pattern of REFERENCE_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            reference = match[1];
            break;
        }
    }

    if (!reference) {
        const numberSequences = text.match(/[0-9]{6,}/g);
        reference = numberSequences?.sort((a, b) => b.length - a.length)[0] ?? null;
    }

    let amount: number | null = null;

    for (const pattern of AMOUNT_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            amount = parseLocalizedAmount(match[1]);
            if (amount !== null) break;
        }
    }

    // Ninguna palabra clave calzo: se busca el numero con pinta de monto (dos
    // decimales) mas grande del texto, el mismo criterio con el que una
    // persona identificaria el total a simple vista en el comprobante.
    if (amount === null) {
        const candidates = (text.match(DECIMAL_AMOUNT_PATTERN) ?? [])
            .map((match) => parseLocalizedAmount(match.replace(/\s/g, '')))
            .filter((value): value is number => value !== null);

        if (candidates.length > 0) amount = Math.max(...candidates);
    }

    return { reference, amount, raw_text: text };
}

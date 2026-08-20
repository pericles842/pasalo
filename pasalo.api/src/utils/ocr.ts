import { createWorker } from 'tesseract.js';

let workerPromise: ReturnType<typeof createWorker> | null = null;

/** El worker de Tesseract se crea una sola vez y se reutiliza entre requests */
function getWorker() {
    if (!workerPromise) {
        workerPromise = createWorker('spa');
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
 * Convierte "1.234,56" o "1,234.56" (o sin miles) a un numero JS normal.
 * El separador decimal es el ultimo que aparece en el texto.
 */
function parseLocalizedAmount(raw: string): number | null {
    const cleaned = raw.trim();
    const lastComma = cleaned.lastIndexOf(',');
    const lastDot = cleaned.lastIndexOf('.');

    let normalized: string;

    if (lastComma > -1 && lastDot > -1) {
        normalized = lastComma > lastDot
            ? cleaned.replace(/\./g, '').replace(',', '.')
            : cleaned.replace(/,/g, '');
    } else if (lastComma > -1) {
        const decimals = cleaned.length - lastComma - 1;
        normalized = decimals === 2 ? cleaned.replace(',', '.') : cleaned.replace(/,/g, '');
    } else if (lastDot > -1) {
        const decimals = cleaned.length - lastDot - 1;
        normalized = decimals === 2 ? cleaned : cleaned.replace(/\./g, '');
    } else {
        normalized = cleaned;
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
    const { data } = await worker.recognize(buffer);
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

    return { reference, amount, raw_text: text };
}

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

/**
 * Extrae el texto del comprobante y, de ahi, intenta ubicar el numero de referencia.
 * Si ningun patron conocido calza, se queda con la secuencia de digitos mas larga
 * como mejor intento: el vendedor siempre puede corregirla a mano viendo la foto.
 *
 * @export
 * @param {Buffer} buffer
 */
export async function extractPaymentReference(buffer: Buffer): Promise<{ reference: string | null; raw_text: string }> {
    const worker = await getWorker();
    const { data } = await worker.recognize(buffer);
    const text = data.text || '';

    for (const pattern of REFERENCE_PATTERNS) {
        const match = text.match(pattern);
        if (match?.[1]) {
            return { reference: match[1], raw_text: text };
        }
    }

    const numberSequences = text.match(/[0-9]{6,}/g);
    const longest = numberSequences?.sort((a, b) => b.length - a.length)[0] ?? null;

    return { reference: longest, raw_text: text };
}

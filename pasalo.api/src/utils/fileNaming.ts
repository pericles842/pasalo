/** "GYM Consultores" -> "gym_consultores": nombre de archivo/tenant_id valido */
export function slugify(value: string): string {
  const noDiacritics = Array.from(value.normalize('NFD'))
    .filter((ch) => {
      const code = ch.codePointAt(0) ?? 0;
      return code < 0x0300 || code > 0x036f; // rango de marcas diacriticas combinantes
    })
    .join('');

  return noDiacritics
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '');
}

/** Fecha corta AAMMDD, ej. 260828 para el 28 de agosto de 2026 */
export function shortDate(date: Date = new Date()): string {
  const yy = String(date.getFullYear()).slice(-2);
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  return `${yy}${mm}${dd}`;
}

/** Prefijo de nombre para imagenes: id_empresa + nombre_empresa + fecha corta de la subida */
export function buildImagePrefix(tenantId: string, companyName: string): string {
  return `${tenantId}_${slugify(companyName)}_${shortDate()}`;
}

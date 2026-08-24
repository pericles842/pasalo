/**
 * Iniciales para la burbuja de avatar: primera letra de las 2 primeras palabras.
 * Sirve tanto para el nombre de una persona ("Ana Maria" -> "AM") como para el de
 * una empresa ("Coffee Code" -> "CC").
 */
export function getInitials(text: string | null | undefined): string {
  if (!text) return '';

  return text
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((word) => word.charAt(0))
    .join('')
    .toUpperCase();
}

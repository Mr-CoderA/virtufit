/**
 * Sanitize user-supplied strings: strip HTML, trim, normalize, enforce max length.
 */
export function sanitizeString(str: unknown, maxLength = 1000): string {
  if (str == null) return '';
  const s = String(str)
    .trim()
    .replace(/<[^>]*>/g, '')
    .replace(/[^\x20-\x7E\u00A0-\uFFFF]/g, '');
  return s.slice(0, maxLength);
}

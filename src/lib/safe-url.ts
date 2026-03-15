/**
 * Validate URL is safe for outbound requests (no localhost, private IPs, metadata).
 */
export function isSafeUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (!['http:', 'https:'].includes(url.protocol)) return false;
    const host = url.hostname.toLowerCase();
    if (['localhost', '127.0.0.1', '0.0.0.0', '169.254.169.254', '::1'].includes(host)) return false;
    if (/^10\./.test(host) || /^192\.168\./.test(host) || /^172\.(1[6-9]|2\d|3[01])\./.test(host)) return false;
    return true;
  } catch {
    return false;
  }
}

/** Require HTTPS for webhook URLs. */
export function isSafeWebhookUrl(urlString: string): boolean {
  try {
    const url = new URL(urlString);
    if (url.protocol !== 'https:') return false;
    return isSafeUrl(urlString);
  } catch {
    return false;
  }
}

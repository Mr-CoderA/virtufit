/**
 * Client-side fetch wrapper for brand-facing API routes.
 * On 401 with code ACCOUNT_DELETED, clears session and redirects to /login.
 */
export async function brandFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const res = await fetch(input, { ...init, credentials: init?.credentials ?? 'include' });
  if (res.status === 401) {
    try {
      const data = await res.clone().json() as { code?: string };
      if (data?.code === 'ACCOUNT_DELETED') {
        await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
        window.location.href = '/login?closed=1';
        return res;
      }
    } catch {
      // ignore parse errors
    }
  }
  return res;
}

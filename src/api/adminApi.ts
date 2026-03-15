const ADMIN_TOKEN_KEY = 'adminToken';

export function getAdminToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(ADMIN_TOKEN_KEY);
}

export function setAdminToken(token: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(ADMIN_TOKEN_KEY, token);
}

export function clearAdminToken(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ADMIN_TOKEN_KEY);
}

export function redirectToAdminLogin(): void {
  if (typeof window === 'undefined') return;
  window.location.href = '/admin/login';
}

async function adminFetch<T>(
  path: string,
  options: RequestInit = {}
): Promise<{ data?: T; error?: string; status: number }> {
  const token = getAdminToken();
  const base = typeof window !== 'undefined' ? window.location.origin : '';
  const res = await fetch(`${base}/api/admin${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    credentials: 'same-origin',
  });
  if (res.status === 401) {
    clearAdminToken();
    redirectToAdminLogin();
    return { error: 'Unauthorized', status: 401 };
  }
  const data = await res.json().catch(() => ({}));
  return { data: data as T, error: data.error, status: res.status };
}

export const adminApi = {
  async login(email: string, password: string) {
    const res = await fetch('/api/admin/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    });
    const data = await res.json();
    if (!res.ok) return { error: data.error || 'Invalid credentials' };
    if (data.token) setAdminToken(data.token);
    return { token: data.token };
  },
  logout() {
    clearAdminToken();
  },
  async me() {
    return adminFetch<{ admin: { id: string; email: string; name: string; role: string; lastLoginAt: string | null; createdAt: string } }>('/auth/me');
  },
  async stats() {
    return adminFetch<{
      totalBrands: number;
      activeBrandsToday: number;
      generationsToday: number;
      generationsThisMonth: number;
      revenueThisMonth: number;
      creditDistribution: Record<string, number>;
      dailyGenerationsChart: { date: string; count: number }[];
      topBrands: Array<{ id: string; name: string | null; email: string; generationsThisMonth: number; creditsRemaining: number; plan: string; joinedAt: string }>;
      alerts: { brandsWithZeroCredits: number; failedGenerationsLast24h: number; failedGenerationsRate24h: number; replicateErrorsLastHour: number };
    }>('/stats');
  },
  async contactCount() {
    return adminFetch<{ unreadCount: number }>('/contact?countOnly=1');
  },
  async contactList(page = 1) {
    return adminFetch<{ submissions: Array<{ id: string; name: string; email: string; brand: string | null; platform: string | null; subject: string; message: string; read: boolean; createdAt: string }>; total: number; unreadCount: number }>(`/contact?page=${page}&limit=20`);
  },
  async contactMarkRead(id: string) {
    return adminFetch<{ success: boolean }>(`/contact/${id}/read`, { method: 'PATCH' });
  },
};

const BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:8000/api';
const TOKEN_KEY = 'wisepay_auth_token';

/**
 * Retrieves the stored JWT authentication token.
 */
export function getAuthToken(): string | null {
  if (typeof window === 'undefined') return null;
  try {
    return localStorage.getItem(TOKEN_KEY);
  } catch {
    return null;
  }
}

/**
 * Persists the JWT authentication token.
 */
export function setAuthToken(token: string | null): void {
  if (typeof window === 'undefined') return;
  try {
    if (token) {
      localStorage.setItem(TOKEN_KEY, token);
    } else {
      localStorage.removeItem(TOKEN_KEY);
    }
  } catch {
    // Ignore storage errors in restricted contexts
  }
}

/**
 * Secure fetch wrapper that:
 * 1. Automatically attaches `Authorization: Bearer <token>` if present.
 * 2. Intercepts 401 Unauthorized errors to clear token.
 * 3. Gracefully handles network failures without unhandled runtime exceptions.
 */
async function secureFetch(url: string, options: RequestInit = {}): Promise<any> {
  const headers = new Headers(options.headers || {});

  const token = getAuthToken();
  if (token && !headers.has('Authorization')) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    if (response.status === 401) {
      setAuthToken(null);
      if (typeof window !== 'undefined' && !window.location.pathname.startsWith('/login') && window.location.pathname !== '/') {
        window.dispatchEvent(new CustomEvent('wisepay:unauthorized'));
      }
    }

    const contentType = response.headers.get('content-type');
    if (contentType && contentType.includes('application/json')) {
      const data = await response.json();
      if (!response.ok && !data.error && data.detail) {
        data.error = typeof data.detail === 'string' ? data.detail : JSON.stringify(data.detail);
      }
      return data;
    }

    if (!response.ok) {
      return { error: `HTTP ${response.status}: ${response.statusText}` };
    }

    return response.text();
  } catch (err: any) {
    // Return empty payload / error object gracefully if backend is offline or restarting
    console.warn(`[WisePay API] Network request to ${url} failed:`, err?.message || err);
    return null;
  }
}

export const api = {
  auth: {
    login: async (username: string, password: string) => {
      try {
        const formData = new URLSearchParams();
        formData.append('username', username);
        formData.append('password', password);

        const res = await fetch(`${BASE_URL}/auth/login`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: formData.toString(),
        });

        const data = await res.json();
        if (res.ok && data.access_token) {
          setAuthToken(data.access_token);
        }
        return data;
      } catch (err: any) {
        return { error: err?.message || 'Login request failed' };
      }
    },
    me: () => secureFetch(`${BASE_URL}/auth/me`),
    logout: () => {
      setAuthToken(null);
    },
  },
  dashboard: {
    stats: () => secureFetch(`${BASE_URL}/dashboard/stats`),
    riskDistribution: () => secureFetch(`${BASE_URL}/dashboard/risk_distribution`),
    topCategories: () => secureFetch(`${BASE_URL}/dashboard/top_risk_categories`),
    network: () => secureFetch(`${BASE_URL}/dashboard/network`),
    processingStream: () => secureFetch(`${BASE_URL}/dashboard/processing_stream`),
  },
  transactions: {
    list: async (params: Record<string, any>) => {
      const cleanParams: Record<string, string> = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
      const query = new URLSearchParams(cleanParams).toString();
      const res = await secureFetch(`${BASE_URL}/transactions?${query}`);
      return res || { total: 0, page: 1, size: 50, items: [] };
    },
    exceptions: async (params: { flag_type?: string; search?: string; page?: number; size?: number } = {}) => {
      const cleanParams: Record<string, string> = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
      const query = new URLSearchParams(cleanParams).toString();
      const res = await secureFetch(`${BASE_URL}/transactions/exceptions${query ? `?${query}` : ''}`);
      return res || { total: 0, page: 1, size: 50, items: [] };
    },
    get: (id: string | number) => secureFetch(`${BASE_URL}/transactions/${id}`),
    similar: (id: string | number) => secureFetch(`${BASE_URL}/transactions/${id}/similar`),
  },
  invoices: {
    submit: (data: any) =>
      secureFetch(`${BASE_URL}/invoices`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    uploadCsv: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return secureFetch(`${BASE_URL}/invoices/upload-csv`, {
        method: 'POST',
        body: formData,
      });
    },
    simulateBatch: (count: number = 100) =>
      secureFetch(`${BASE_URL}/invoices/simulate-batch?count=${count}`, {
        method: 'POST',
      }),
    scanReceipt: (file: File) => {
      const formData = new FormData();
      formData.append('file', file);
      return secureFetch(`${BASE_URL}/invoices/scan-receipt`, {
        method: 'POST',
        body: formData,
      });
    },
    scanOnlineInvoice: (url: string) =>
      secureFetch(`${BASE_URL}/invoices/scan-online-invoice`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url }),
      }),
  },
  investigation: {
    get: (id: string | number) => secureFetch(`${BASE_URL}/investigation/${id}`),
    getAiReport: (id: string | number) => secureFetch(`${BASE_URL}/investigation/${id}/ai-report`),
    submitDecision: (id: string | number, data: { decision: string; reason?: string; reviewer_id?: string; reviewer_role?: string; metadata?: any }) =>
      secureFetch(`${BASE_URL}/investigation/${id}/decision`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
  },
  entities: {
    vendors: (params?: { category?: string; search?: string }) => {
      const cleanParams: Record<string, string> = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
      const q = new URLSearchParams(cleanParams).toString();
      return secureFetch(`${BASE_URL}/entities/vendors${q ? `?${q}` : ''}`);
    },
    employees: (params?: { department?: string; search?: string }) => {
      const cleanParams: Record<string, string> = {};
      Object.entries(params || {}).forEach(([k, v]) => {
        if (v !== undefined && v !== null && v !== '') {
          cleanParams[k] = String(v);
        }
      });
      const q = new URLSearchParams(cleanParams).toString();
      return secureFetch(`${BASE_URL}/entities/employees${q ? `?${q}` : ''}`);
    },
    summary: () => secureFetch(`${BASE_URL}/entities/summary`),
  },
  audit: {
    get: (txId: string | number) => secureFetch(`${BASE_URL}/audit/${txId}`),
    verify: (txId: string | number) => secureFetch(`${BASE_URL}/audit/${txId}/verify`, { method: 'POST' }),
    verifyGlobal: () => secureFetch(`${BASE_URL}/audit/verify-global`, { method: 'POST' }),
    chain: async (page = 1, size = 50) => {
      const res = await secureFetch(`${BASE_URL}/audit/chain?page=${page}&size=${size}`);
      return Array.isArray(res) ? res : [];
    },
    governanceTimeline: (page = 1, size = 50) =>
      secureFetch(`${BASE_URL}/audit/governance/timeline?page=${page}&size=${size}`),
  },
  feedback: {
    submit: (txId: string | number, data: { reviewer_id: string; reviewer_role?: string; decision: string; reason: string; metadata?: any }) =>
      secureFetch(`${BASE_URL}/feedback/${txId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }),
    stats: () => secureFetch(`${BASE_URL}/feedback/stats`),
    roles: () => secureFetch(`${BASE_URL}/feedback/roles`),
  },
};

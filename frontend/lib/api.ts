const BASE_URL = 'http://localhost:8000/api';

export const api = {
  dashboard: {
    stats: () => fetch(`${BASE_URL}/dashboard/stats`).then(r => r.json()),
    riskDistribution: () => fetch(`${BASE_URL}/dashboard/risk_distribution`).then(r => r.json()),
    topCategories: () => fetch(`${BASE_URL}/dashboard/top_risk_categories`).then(r => r.json()),
    network: () => fetch(`${BASE_URL}/dashboard/network`).then(r => r.json()),
    processingStream: () => fetch(`${BASE_URL}/dashboard/processing_stream`).then(r => r.json()),
  },
  transactions: {
    list: (params: Record<string, string | number>) => {
      const stringParams = Object.fromEntries(
        Object.entries(params).map(([k, v]) => [k, String(v)])
      );
      const query = new URLSearchParams(stringParams).toString();
      return fetch(`${BASE_URL}/transactions?${query}`).then(r => r.json());
    },
    get: (id: string | number) => fetch(`${BASE_URL}/transactions/${id}`).then(r => r.json()),
    similar: (id: string | number) => fetch(`${BASE_URL}/transactions/${id}/similar`).then(r => r.json()),
  },
  investigation: {
    get: (id: string | number) => fetch(`${BASE_URL}/investigation/${id}`).then(r => r.json()),
  },
  audit: {
    get: (txId: string | number) => fetch(`${BASE_URL}/audit/${txId}`).then(r => r.json()),
    verify: (txId: string | number) => fetch(`${BASE_URL}/audit/${txId}/verify`, { method: 'POST' }).then(r => r.json()),
    chain: (page = 1, size = 50) => fetch(`${BASE_URL}/audit/chain?page=${page}&size=${size}`).then(r => r.json()),
  },
  feedback: {
    submit: (txId: string | number, data: { reviewer_id: string; reviewer_role?: string; decision: string; reason: string }) =>
      fetch(`${BASE_URL}/feedback/${txId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      }).then(r => r.json()),
    stats: () => fetch(`${BASE_URL}/feedback/stats`).then(r => r.json()),
  },

};

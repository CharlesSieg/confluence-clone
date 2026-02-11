const BASE = '/api';

async function request(url, options = {}) {
  const res = await fetch(`${BASE}${url}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ error: res.statusText }));
    throw new Error(err.error || 'Request failed');
  }
  return res.json();
}

export const api = {
  getPages: () => request('/pages'),
  getPage: (id) => request(`/pages/${id}`),
  createPage: (data) => request('/pages', { method: 'POST', body: JSON.stringify(data) }),
  updatePage: (id, data) => request(`/pages/${id}`, { method: 'PUT', body: JSON.stringify(data) }),
  deletePage: (id) => request(`/pages/${id}`, { method: 'DELETE' }),
  searchPages: (q) => request(`/pages/search?q=${encodeURIComponent(q)}`),
  getVersions: (id) => request(`/pages/${id}/versions`),
  getVersion: (id, versionId) => request(`/pages/${id}/versions/${versionId}`),
  reorderPages: (pages) => request('/pages/reorder', { method: 'POST', body: JSON.stringify({ pages }) }),
};

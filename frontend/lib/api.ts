import type { BusinessArea, NewsArticle, Paginated, Project } from './types';

/**
 * Server-rendered public pages call FastAPI directly.
 * Browser code uses the same-origin Next.js proxy (/api/backend) so admin
 * writes and forms are not dependent on browser CORS/localhost resolution.
 */
export const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:6200/api/v1';

const BROWSER_API_BASE = '/api/backend';

function apiBase(): string {
  if (typeof window !== 'undefined') return BROWSER_API_BASE;
  return (
    process.env.INTERNAL_API_BASE_URL ||
    process.env.BACKEND_API_BASE_URL ||
    PUBLIC_API_BASE
  ).replace(/\/$/, '');
}

type ApiErrorBody = {
  message?: string;
  detail?: string | { message?: string };
  field_errors?: Record<string, string[]> | null;
  code?: string;
};

function formatApiError(body: ApiErrorBody, status: number) {
  const detailMessage = typeof body?.detail === 'object' ? body.detail?.message : body?.detail;
  const base = body?.message || detailMessage || `Request failed (${status})`;
  if (!body?.field_errors) return base;
  const fields = Object.entries(body.field_errors)
    .flatMap(([field, messages]) => messages.map((message) => `${field}: ${message}`))
    .join(' · ');
  return fields ? `${base} ${fields}` : base;
}

async function apiFetch<T>(path: string, init?: RequestInit): Promise<T> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20_000);

  try {
    const headers = new Headers(init?.headers || {});
    const isFormData = typeof FormData !== 'undefined' && init?.body instanceof FormData;
    if (init?.body && !isFormData && !headers.has('Content-Type')) headers.set('Content-Type', 'application/json');
    if (!headers.has('Accept')) headers.set('Accept', 'application/json');

    const res = await fetch(`${apiBase()}${path}`, {
      ...init,
      headers,
      cache: 'no-store',
      signal: init?.signal || controller.signal,
    });

    if (res.status === 204) return undefined as T;

    const contentType = res.headers.get('content-type') || '';
    const raw = await res.text();
    let body: any = null;
    if (raw) {
      if (contentType.includes('application/json')) {
        try { body = JSON.parse(raw); } catch { body = { message: raw }; }
      } else {
        body = { message: raw };
      }
    }

    if (!res.ok) throw new Error(formatApiError(body || {}, res.status));
    return body as T;
  } catch (error) {
    if (error instanceof DOMException && error.name === 'AbortError') {
      throw new Error('The ONIRIA API request timed out. Confirm the backend is running on port 6200.');
    }
    if (error instanceof TypeError) {
      throw new Error('Unable to reach the ONIRIA API. Confirm the backend is running and restart the frontend.');
    }
    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const getProjects = () => apiFetch<Paginated<Project>>('/projects?page_size=20');
export const getProject = (slug: string) => apiFetch<Project>(`/projects/${slug}`);
export const getNews = (page = 1, pageSize = 12) =>
  apiFetch<Paginated<NewsArticle>>(`/news?page=${page}&page_size=${pageSize}`);
export const getArticle = (slug: string) => apiFetch<NewsArticle>(`/news/${slug}`);
export const getBusinessAreas = () => apiFetch<BusinessArea[]>('/business-areas');
export const getSiteSettings = () => apiFetch<Record<string, unknown>>('/site-settings');

export async function createLead(payload: Record<string, unknown>) {
  return apiFetch<{ id: string; reference_no: string; message: string }>('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export async function authFetch<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}

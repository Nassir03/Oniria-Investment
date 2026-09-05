import type { BusinessArea, NewsArticle, Paginated, Project } from './types';
import type { ToolkitAsset } from './toolkit';

/**
 * Browser calls go through the same-origin Next.js proxy (/api/backend).
 * Server-rendered pages prefer the private/runtime backend URL so Cloudflare
 * deployments do not depend on a build-time NEXT_PUBLIC_* value.
 */
export const PUBLIC_API_BASE =
  process.env.NEXT_PUBLIC_API_BASE_URL || 'http://127.0.0.1:6200/api/v1';

const BROWSER_API_BASE = '/api/backend';

function apiBase(): string {
  if (typeof window !== 'undefined') {
    return BROWSER_API_BASE;
  }

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

export class ApiRequestError extends Error {
  readonly status: number;
  readonly code?: string;
  readonly fieldErrors?: Record<string, string[]> | null;

  constructor(
    message: string,
    status: number,
    body?: ApiErrorBody,
  ) {
    super(message);
    this.name = 'ApiRequestError';
    this.status = status;
    this.code = body?.code;
    this.fieldErrors = body?.field_errors;
  }
}

function formatApiError(
  body: ApiErrorBody,
  status: number,
): string {
  const detailMessage =
    typeof body?.detail === 'object'
      ? body.detail?.message
      : body?.detail;

  let base =
    body?.message ||
    detailMessage ||
    `Request failed (${status})`;

  // Do not expose backend tracebacks/internal DB errors in the UI.
  if (
    /traceback|sqlalchemy|asyncpg|site_visits|programmingerror/i.test(
      base,
    )
  ) {
    base =
      'This report could not be loaded right now. Please refresh the page or try again shortly.';
  }

  if (!body?.field_errors) {
    return base;
  }

  const fields = Object.entries(body.field_errors)
    .flatMap(([field, messages]) =>
      messages.map(
        (message) => `${field}: ${message}`,
      ),
    )
    .join(' · ');

  return fields ? `${base} ${fields}` : base;
}

async function apiFetch<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  const controller = new AbortController();

  const method =
    (init?.method || 'GET').toUpperCase();

  /*
   * Public server-rendered pages need fresh data, but should not
   * leave navigation hanging for a long period when the API is
   * unavailable.
   */
  const serverRead =
    typeof window === 'undefined' &&
    method === 'GET';

  const publicNewsRead =
    serverRead &&
    (
      path === '/news' ||
      path.startsWith('/news?') ||
      path.startsWith('/news/')
    );

  const publicToolkitRead =
    serverRead &&
    (
      path === '/toolkit-assets' ||
      path.startsWith('/toolkit-assets?')
    );

  const freshServerRead =
    publicNewsRead || publicToolkitRead;

  const timeoutMs =
    freshServerRead
      ? 8_000
      : serverRead
        ? 1_500
        : 20_000;

  const timeout = setTimeout(
    () => controller.abort(),
    timeoutMs,
  );

  try {
    const headers = new Headers(
      init?.headers || {},
    );

    const isFormData =
      typeof FormData !== 'undefined' &&
      init?.body instanceof FormData;

    if (
      init?.body &&
      !isFormData &&
      !headers.has('Content-Type')
    ) {
      headers.set(
        'Content-Type',
        'application/json',
      );
    }

    if (!headers.has('Accept')) {
      headers.set(
        'Accept',
        'application/json',
      );
    }

    const shouldCache =
      serverRead && !freshServerRead;

    const res = await fetch(
      `${apiBase()}${path}`,
      {
        ...init,
        headers,
        cache: shouldCache
          ? 'force-cache'
          : 'no-store',
        ...(shouldCache
          ? {
              next: {
                revalidate: 60,
              },
            }
          : {}),
        signal:
          init?.signal ||
          controller.signal,
      },
    );

    if (res.status === 204) {
      return undefined as T;
    }

    const contentType =
      res.headers.get('content-type') || '';

    const raw = await res.text();

    let body: ApiErrorBody | T | null = null;

    if (raw) {
      if (
        contentType.includes(
          'application/json',
        )
      ) {
        try {
          body = JSON.parse(raw);
        } catch {
          body = {
            message: raw,
          } as ApiErrorBody;
        }
      } else {
        body = {
          message: raw,
        } as ApiErrorBody;
      }
    }

    if (!res.ok) {
      const errorBody =
        (body || {}) as ApiErrorBody;

      throw new ApiRequestError(
        formatApiError(
          errorBody,
          res.status,
        ),
        res.status,
        errorBody,
      );
    }

    return body as T;
  } catch (error) {
    if (
      error instanceof ApiRequestError
    ) {
      throw error;
    }

    if (
      error instanceof DOMException &&
      error.name === 'AbortError'
    ) {
      throw new Error(
        'The ONIRIA service took too long to respond. Please try again.',
      );
    }

    if (error instanceof TypeError) {
      throw new Error(
        'Unable to reach the ONIRIA service. Please try again after confirming the service is running.',
      );
    }

    throw error;
  } finally {
    clearTimeout(timeout);
  }
}

export const getProjects = () =>
  apiFetch<Paginated<Project>>(
    '/projects?page_size=20',
  );

export const getProject = (
  slug: string,
) =>
  apiFetch<Project>(
    `/projects/${slug}`,
  );

export const getNews = (
  page = 1,
  pageSize = 12,
) =>
  apiFetch<Paginated<NewsArticle>>(
    `/news?page=${page}&page_size=${pageSize}`,
  );

export const getArticle = (
  slug: string,
) =>
  apiFetch<NewsArticle>(
    `/news/${slug}`,
  );

export const getBusinessAreas = () =>
  apiFetch<BusinessArea[]>(
    '/business-areas',
  );

export const getSiteSettings = () =>
  apiFetch<Record<string, unknown>>(
    '/site-settings',
  );

/**
 * Public Toolkit assets.
 *
 * This export is used by app/toolkit/page.tsx.
 */
export const getToolkitAssets = () =>
  apiFetch<Paginated<ToolkitAsset>>(
    '/toolkit-assets?page_size=100',
  );

export async function createLead(
  payload: Record<string, unknown>,
) {
  return apiFetch<{
    id: string;
    reference_no: string;
    message: string;
  }>('/leads', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

/**
 * Authenticated browser/API request.
 */
export async function authFetch<T>(
  path: string,
  token: string,
  init?: RequestInit,
): Promise<T> {
  return apiFetch<T>(path, {
    ...init,
    headers: {
      ...(init?.headers || {}),
      Authorization: `Bearer ${token}`,
    },
  });
}
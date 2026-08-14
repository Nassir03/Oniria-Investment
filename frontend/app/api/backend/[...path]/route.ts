import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const BACKEND_BASE = (
  process.env.INTERNAL_API_BASE_URL ||
  process.env.BACKEND_API_BASE_URL ||
  'http://127.0.0.1:6200/api/v1'
).replace(/\/$/, '');

function targetUrl(request: NextRequest, path: string[]) {
  const target = new URL(`${BACKEND_BASE}/${path.join('/')}`);
  request.nextUrl.searchParams.forEach((value, key) => target.searchParams.append(key, value));
  return target;
}

async function proxy(request: NextRequest, context: { params: Promise<{ path: string[] }> }) {
  const { path } = await context.params;
  const url = targetUrl(request, path);
  const headers = new Headers();

  const authorization = request.headers.get('authorization');
  const contentType = request.headers.get('content-type');
  const accept = request.headers.get('accept');
  if (authorization) headers.set('authorization', authorization);
  if (contentType) headers.set('content-type', contentType);
  if (accept) headers.set('accept', accept);

  let body: ArrayBuffer | undefined;
  if (!['GET', 'HEAD'].includes(request.method)) {
    const buffer = await request.arrayBuffer();
    if (buffer.byteLength) body = buffer;
  }

  try {
    const response = await fetch(url, {
      method: request.method,
      headers,
      body,
      cache: 'no-store',
      signal: AbortSignal.timeout(20_000),
    });

    if (response.status === 204) {
      return new NextResponse(null, { status: 204 });
    }

    const responseHeaders = new Headers();
    const responseContentType = response.headers.get('content-type');
    if (responseContentType) responseHeaders.set('content-type', responseContentType);
    const requestId = response.headers.get('x-request-id');
    if (requestId) responseHeaders.set('x-request-id', requestId);

    return new NextResponse(await response.arrayBuffer(), {
      status: response.status,
      headers: responseHeaders,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'ONIRIA service request failed';
    return NextResponse.json(
      {
        code: 'backend_unreachable',
        message: 'The ONIRIA service could not be reached. Please confirm the service is running and try again.',
        detail: message,
      },
      { status: 502 },
    );
  }
}

export const GET = proxy;
export const POST = proxy;
export const PUT = proxy;
export const PATCH = proxy;
export const DELETE = proxy;
export const OPTIONS = proxy;

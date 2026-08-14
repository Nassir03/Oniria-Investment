import { NextRequest, NextResponse } from 'next/server';

const ID_RE = /^[A-Za-z0-9_-]{10,}$/;

export async function GET(request: NextRequest) {
  const fileId = request.nextUrl.searchParams.get('id') || '';
  if (!ID_RE.test(fileId)) {
    return new NextResponse('Invalid image id', { status: 400 });
  }

  const candidates = [
    `https://drive.google.com/thumbnail?id=${fileId}&sz=w2000`,
    `https://drive.google.com/uc?export=view&id=${fileId}`,
  ];

  for (const url of candidates) {
    try {
      const response = await fetch(url, {
        headers: { 'User-Agent': 'Mozilla/5.0 ONIRIA-Newsroom' },
        cache: 'no-store',
        redirect: 'follow',
      });
      const contentType = response.headers.get('content-type') || '';
      if (!response.ok || !contentType.startsWith('image/')) continue;

      const bytes = await response.arrayBuffer();
      return new NextResponse(bytes, {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Cache-Control': 'public, max-age=3600, s-maxage=3600',
        },
      });
    } catch {
      // Try the next Google Drive URL format.
    }
  }

  return new NextResponse('Image unavailable. Make sure the Google Drive file is shared with anyone who has the link.', {
    status: 404,
  });
}

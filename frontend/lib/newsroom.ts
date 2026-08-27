export function resolveNewsImageUrl(src?: string | null): string | null {
  if (!src) return null;
  const value = src.trim();
  if (!value) return null;

  if (value.startsWith('/')) return value;
  if (/^data:image\//i.test(value)) return value;

  try {
    const url = new URL(value);

    // Older local records may contain an absolute backend media URL. Route
    // those through the frontend so the image keeps working when the site
    // host changes and the browser never depends on localhost directly.
    if ((url.hostname === '127.0.0.1' || url.hostname === 'localhost') && url.pathname.startsWith('/media/')) {
      return url.pathname;
    }

    if (url.hostname.includes('drive.google.com')) {
      const fileMatch = url.pathname.match(/\/file\/d\/([^/]+)/i);
      if (fileMatch?.[1]) {
        return `https://drive.google.com/uc?export=view&id=${fileMatch[1]}`;
      }
      const id = url.searchParams.get('id');
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    if (url.hostname.includes('docs.google.com') && url.pathname.includes('/uc')) {
      const id = url.searchParams.get('id');
      if (id) return `https://drive.google.com/uc?export=view&id=${id}`;
    }

    return value;
  } catch {
    return null;
  }
}

export function formatNewsDate(date?: string | null, long = false): string {
  if (!date) return 'ONIRIA Investments';
  try {
    return new Date(date).toLocaleDateString(
      'en-GB',
      long
        ? { day: 'numeric', month: 'long', year: 'numeric' }
        : { day: '2-digit', month: 'short', year: 'numeric' },
    );
  } catch {
    return 'ONIRIA Investments';
  }
}

export function stripHtml(value?: string | null): string {
  if (!value) return '';
  return value.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}

export function truncateText(value?: string | null, length = 180): string {
  const text = stripHtml(value);
  if (!text) return '';
  if (text.length <= length) return text;
  return `${text.slice(0, length).trimEnd()}…`;
}

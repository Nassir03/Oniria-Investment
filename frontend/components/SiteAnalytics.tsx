'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

let lastTrackedPath = '';
let lastTrackedAt = 0;

function sessionId() {
  try {
    const key = 'oniria_site_session';
    const current = window.sessionStorage.getItem(key);
    if (current) return current;
    const created = `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    window.sessionStorage.setItem(key, created);
    return created;
  } catch {
    return null;
  }
}

export default function SiteAnalytics() {
  const pathname = usePathname();

  useEffect(() => {
    if (!pathname || pathname.startsWith('/admin')) return;

    const now = Date.now();
    if (pathname === lastTrackedPath && now - lastTrackedAt < 1500) return;
    lastTrackedPath = pathname;
    lastTrackedAt = now;

    const send = () => {
      const payload = {
        path: pathname,
        session_id: sessionId(),
        referrer: document.referrer || null,
      };
      void fetch('/api/backend/analytics/page-view', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
        keepalive: true,
      }).catch(() => undefined);
    };

    const browser = window as typeof window & {
      requestIdleCallback?: (callback: () => void, options?: { timeout: number }) => number;
      cancelIdleCallback?: (id: number) => void;
    };
    if (browser.requestIdleCallback) {
      const id = browser.requestIdleCallback(send, { timeout: 1200 });
      return () => browser.cancelIdleCallback?.(id);
    }
    const timer = window.setTimeout(send, 350);
    return () => window.clearTimeout(timer);
  }, [pathname]);

  return null;
}

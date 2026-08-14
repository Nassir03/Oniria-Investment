'use client';

import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

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
  }, [pathname]);

  return null;
}

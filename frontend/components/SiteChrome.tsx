'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import SiteAnalytics from './SiteAnalytics';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isAdmin = path.startsWith('/admin');

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SiteAnalytics />
      <Header />
      {children}
      <Footer />
    </>
  );
}

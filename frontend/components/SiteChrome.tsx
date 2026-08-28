'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import SiteAnalytics from './SiteAnalytics';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isAdmin = path.startsWith('/admin');
  const hasSignatureProjectFooter = [
    '/projects/oniria-stone-town',
    '/projects/oniria-michamvi',
    '/projects/ona-towers',
  ].includes(path);

  if (isAdmin) return <>{children}</>;

  return (
    <>
      <SiteAnalytics />
      <Header />
      {children}
      {!hasSignatureProjectFooter ? <Footer /> : null}
    </>
  );
}

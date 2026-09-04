'use client';

import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';
import Header from './Header';
import Footer from './Footer';
import SiteAnalytics from './SiteAnalytics';

export default function SiteChrome({ children }: { children: ReactNode }) {
  const path = usePathname();
  const isAdmin = path.startsWith('/admin');
  const isToolkit = path === '/toolkit';

  if (isAdmin) return <>{children}</>;

  // The public toolkit is an immersive, self-contained experience. Avoid
  // stacking the normal site header/footer logo on top of its animated brand
  // lockup and carousel.
  if (isToolkit) {
    return (
      <>
        <SiteAnalytics />
        {children}
      </>
    );
  }

  return (
    <>
      <SiteAnalytics />
      <Header />
      {children}
      <Footer />
    </>
  );
}

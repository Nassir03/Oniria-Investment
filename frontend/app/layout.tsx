import type { Metadata } from 'next';
import './globals.css';
import SiteChrome from '@/components/SiteChrome';

export const metadata: Metadata = {
  title: { default: 'ONIRIA Investments | Places of Lasting Presence', template: '%s | ONIRIA Investments' },
  description: 'Explore the ONIRIA collection, company story, business areas and project enquiries.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'),
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><SiteChrome>{children}</SiteChrome></body></html>;
}

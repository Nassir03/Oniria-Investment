import type { Metadata } from 'next';
import './globals.css';
import SiteChrome from '@/components/SiteChrome';

export const metadata: Metadata = {
  title: { default: 'ONIRIA Investments | Places of Lasting Presence', template: '%s | ONIRIA Investments' },
  description: 'Explore the ONIRIA collection, company story, business areas and project enquiries.',
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3200'),
  icons: {
    icon: [
      { url: '/favicon.ico', sizes: 'any' },
      { url: '/icon.png', type: 'image/png' },
      { url: '/favicon-32x32.png', sizes: '32x32', type: 'image/png' },
      { url: '/favicon-16x16.png', sizes: '16x16', type: 'image/png' },
    ],
    shortcut: ['/favicon.ico'],
    apple: [{ url: '/apple-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return <html lang="en"><body><SiteChrome>{children}</SiteChrome></body></html>;
}

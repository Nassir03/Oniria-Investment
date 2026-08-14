'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const links = [
  ['/our-story', 'Our Story'],
  ['/business', 'Our Business'],
  ['/newsroom', 'Newsroom'],
  ['/contact', 'Contact'],
];

function routeCanOverlay(path: string) {
  return (
    path === '/' ||
    path.startsWith('/our-story') ||
    path.startsWith('/business') ||
    path.startsWith('/contact') ||
    path === '/newsroom' ||
    path.startsWith('/projects/')
  );
}

export default function Header() {
  const path = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 54);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [open]);

  const canOverlay = useMemo(() => routeCanOverlay(path), [path]);
  const solid = !canOverlay || scrolled;

  return (
    <header className={`siteHeader ${solid ? 'solid' : 'overlay'} ${canOverlay ? 'canOverlay' : 'surfaceOnly'} ${path === '/' ? 'homeRoute' : ''}`}>
      <Link href="/" className="wordmark" aria-label="ONIRIA Investments home">
        <span>ONIRIA</span>
        <small>INVESTMENTS</small>
      </Link>

      <nav className="desktopNav desktopNavRight" aria-label="Primary navigation">
        {links.map(([href, label]) => {
          const active = path === href || (href !== '/' && path.startsWith(`${href}/`));
          return (
            <Link key={href} href={href} className={active ? 'active' : ''}>
              {label}
            </Link>
          );
        })}
      </nav>

      <button
        className={`menuButton ${open ? 'open' : ''}`}
        onClick={() => setOpen((value) => !value)}
        aria-label="Toggle navigation"
        aria-expanded={open}
      >
        <span />
        <span />
      </button>

      <div className={`mobileMenu ${open ? 'open' : ''}`} aria-hidden={!open}>
        <p className="eyebrow gold">ONIRIA</p>
        {links.map(([href, label]) => (
          <Link key={href} href={href}>
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}

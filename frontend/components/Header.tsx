'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';

const links = [
  ['/vision', 'Vision'],
  ['/projects', 'Projects'],
  ['/our-story', 'About'],
  ['/newsroom', 'News'],
  ['/contact', 'Contact'],
] as const;

function routeCanOverlay(path: string) {
  return (
    path === '/' ||
    path.startsWith('/our-story') ||
    path.startsWith('/vision') ||
    path.startsWith('/business') ||
    path.startsWith('/contact') ||
    path === '/newsroom' ||
    path.startsWith('/projects')
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
    <header className={`siteHeader ${solid ? 'solid' : 'overlay'} ${canOverlay ? 'canOverlay' : 'surfaceOnly'} ${path === '/' ? 'homeRoute' : ''} ${path.startsWith('/contact') ? 'contactRoute' : ''}`}>
      <Link href="/" prefetch className="wordmark" aria-label="ONIRIA Investments home">
        <span className="wordmarkLogo" aria-hidden="true" />
      </Link>

      <nav className="desktopNav desktopNavRight" aria-label="Primary navigation">
        {links.map(([href, label]) => {
          const active = path === href || path.startsWith(`${href}/`);
          return (
            <Link key={href} href={href} prefetch className={active ? 'active' : ''}>
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
          <Link key={href} href={href} prefetch>
            {label}
          </Link>
        ))}
      </div>
    </header>
  );
}

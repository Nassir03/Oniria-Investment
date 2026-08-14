'use client';

import Image from 'next/image';
import { useMemo, useState } from 'react';
import { resolveNewsImageUrl } from '@/lib/newsroom';

type Props = {
  src?: string | null;
  alt: string;
  fill?: boolean;
  className?: string;
  sizes?: string;
  priority?: boolean;
  fallbackTitle?: string;
  fallbackLabel?: string;
  fallbackTone?: 'light' | 'dark';
};

export default function EditorialImage({
  src,
  alt,
  fill = true,
  className,
  sizes = '100vw',
  priority = false,
  fallbackTitle = 'ONIRIA',
  fallbackLabel = 'Editorial image',
  fallbackTone = 'dark',
}: Props) {
  const normalized = useMemo(() => resolveNewsImageUrl(src), [src]);
  const [failed, setFailed] = useState(false);

  if (!normalized || failed) {
    return (
      <div className={`editorialFallback ${fallbackTone} ${className || ''}`.trim()} aria-label={alt} role="img">
        <span className="editorialFallbackLabel">{fallbackLabel}</span>
        <strong>{fallbackTitle}</strong>
        <p>Thoughtful destinations, official updates and investment perspectives from ONIRIA Investments.</p>
      </div>
    );
  }

  return (
    <Image
      src={normalized}
      alt={alt}
      fill={fill}
      sizes={sizes}
      className={className}
      priority={priority}
      unoptimized
      onError={() => setFailed(true)}
    />
  );
}

'use client';

import { useEffect, useState } from 'react';
import { AdminFrame } from '@/components/AdminData';
import { getProjects } from '@/lib/api';
import type { Project } from '@/lib/types';

export default function Page() {
  const [items, setItems] = useState<Project[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { getProjects().then((result)=>setItems(result.items)).catch((err)=>setError(err instanceof Error ? err.message : 'Unable to load projects')); }, []);
  return <AdminFrame title="Projects" kicker="Portfolio visibility">
    <div className="adminToolbar"><div><strong>{items.length || '—'}</strong><span>Portfolio projects</span></div><p>Current public project records. Editing remains disabled until a protected project mutation endpoint is added to FastAPI.</p></div>
    {error && <div className="adminNotice error">{error}</div>}
    <div className="adminProjectGrid">{items.map((project)=><article key={project.id}><div><h2>{project.name}</h2><p>{project.summary || 'No summary provided.'}</p></div><div><small>Status</small><strong>{project.status}</strong><small>Slug</small><strong>{project.slug}</strong></div></article>)}</div>
  </AdminFrame>;
}

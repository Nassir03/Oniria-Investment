'use client';

import { useEffect, useState } from 'react';
import { AdminFrame } from '@/components/AdminData';
import { getProjects } from '@/lib/api';
import type { Project } from '@/lib/types';

function projectDisplay(project: Project) {
  if (project.slug === 'v-town') {
    return {
      name: 'ROHO',
      category: 'My home. My soul.',
      summary:
        'A new kind of coastal community where residences, sport and social life come together - designed around the way people want to live.',
    };
  }

  if (project.slug === 'ona-towers') {
    return {
      name: 'ONA Towers',
      category: 'Live above. See beyond.',
      summary: project.summary || 'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
    };
  }

  return {
    name: project.name,
    category: project.category,
    summary: project.summary,
  };
}

export default function Page() {
  const [items, setItems] = useState<Project[]>([]);
  const [error, setError] = useState('');
  useEffect(() => { getProjects().then((result)=>setItems(result.items)).catch((err)=>setError(err instanceof Error ? err.message : 'Unable to load projects')); }, []);
  const published = items.filter((project)=>project.status === 'published').length;
  const featured = items.filter((project)=>project.featured).length;

  return <AdminFrame title="Projects" kicker="ONIRIA portfolio">
    <section className="adminWelcomeStrip adminWelcomePremium compact">
      <div><p className="eyebrow">Portfolio overview</p><h2>See the projects currently representing ONIRIA online.</h2></div>
      <p>Use this view to confirm project names, positioning and publication status before marketing or customer conversations.</p>
    </section>
    <div className="adminMetrics adminMetricsModern adminMetricsThree">
      <article><span>All projects</span><strong>{items.length || '—'}</strong><small>Portfolio total</small></article>
      <article><span>Published</span><strong>{published || '—'}</strong><small>Visible publicly</small></article>
      <article><span>Featured</span><strong>{featured || '—'}</strong><small>Priority projects</small></article>
    </div>
    {error && <div className="adminNotice error">{error}</div>}
    <div className="adminProjectGrid adminProjectGridPremium">{items.map((project)=>{
      const display = projectDisplay(project);
      return <article key={project.id}><div><p className="eyebrow">{display.category || 'ONIRIA project'}</p><h2>{display.name}</h2><p>{display.summary || 'Project information is being prepared.'}</p></div><div><small>Status</small><strong>{project.status}</strong><small>Location</small><strong>{project.location || 'Available on enquiry'}</strong></div></article>;
    })}</div>
  </AdminFrame>;
}

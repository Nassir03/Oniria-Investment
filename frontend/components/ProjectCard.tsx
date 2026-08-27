import Image from 'next/image';
import type { Project } from '@/lib/types';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export default function ProjectCard({ project }: { project: Project; index?: number }) {
  const visual = projectVisuals[project.slug] || fallbackVisual;
  return <article className="projectCard premiumProjectCard">
    <div className="projectCardMedia"><Image src={visual.hero || project.media?.[0]?.url} alt={project.media?.[0]?.alt_text || `${project.name} architecture`} fill sizes="(max-width:900px) 100vw, 50vw"/><div className="projectCardShade"/></div>
    <div className="projectCardCopy"><div><p className="eyebrow">{project.category || visual.eyebrow}</p><h3>{project.name}</h3></div><span>{project.location || 'Project information'}</span></div>
  </article>;
}

import Image from 'next/image';
import Link from 'next/link';
import type { Project } from '@/lib/types';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export default function ProjectCard({ project }: { project: Project; index?: number }) {
  const visual = projectVisuals[project.slug] || fallbackVisual;
  return <Link href={`/projects/${project.slug}`} className="projectCard premiumProjectCard">
    <div className="projectCardMedia"><Image src={project.media?.[0]?.url || visual.hero} alt={project.media?.[0]?.alt_text || `${project.name} architecture`} fill sizes="(max-width:900px) 100vw, 50vw"/><div className="projectCardShade"/><div className="projectCardHover"><span>Discover project</span><b>↗</b></div></div>
    <div className="projectCardCopy"><div><p className="eyebrow">{project.category || visual.eyebrow}</p><h3>{project.name}</h3></div><span>{project.location || 'Project information'}</span></div>
  </Link>;
}

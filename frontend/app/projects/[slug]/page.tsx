import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import ContactForm from '@/components/ContactForm';
import Reveal from '@/components/Reveal';
import { getProject, getProjects } from '@/lib/api';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export const dynamic = 'force-dynamic';

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let project:any;
  try { project = await getProject(slug); } catch { return notFound(); }
  const visual = projectVisuals[slug] || fallbackVisual;
  let projects:any[] = [];
  try { projects = (await getProjects()).items; } catch {}
  const gallery = project.media?.length ? project.media.map((m:any)=>m.url) : visual.gallery;
  const hero = project.media?.[0]?.url || visual.hero;
  return <main className="publicPage"><section className="projectHero"><Image src={hero} alt={project.media?.[0]?.alt_text || `${project.name} architecture`} fill priority sizes="100vw"/><div className="imageOverlay"/><div className="projectHeroCopy"><p className="eyebrow light">{project.category || visual.eyebrow}</p><h1>{project.name}</h1><p>{project.location || 'Project information available on request'}</p></div></section><section className="section projectIntro"><Reveal><p className="eyebrow">The project</p><div className="editorialSplit"><h2>{project.summary || 'A distinctive ONIRIA project shaped around considered architecture, landscape and experience.'}</h2><div className="projectFacts"><div><span>Category</span><strong>{project.category || 'ONIRIA development'}</strong></div><div><span>Status</span><strong>{project.status === 'published' ? 'Presented' : 'In development'}</strong></div><div><span>Conversations</span><strong>By direct enquiry</strong></div></div></div></Reveal></section><section className="projectGallery">{gallery.slice(0,3).map((src:string,i:number)=><div key={`${src}-${i}`} className={`projectGalleryItem item${i+1}`}><Image src={src} alt={`${project.name} project image`} fill sizes="(max-width:900px) 100vw, 60vw"/></div>)}</section><section className="navyStatement compactStatement"><Reveal><p className="eyebrow gold">Project information</p><h2>Interested in {project.name}?</h2><p>Request verified project information or arrange a conversation with the ONIRIA team.</p></Reveal></section><section className="section enquirySection"><div className="sectionHeading premiumHeading"><div><p className="eyebrow">Contact ONIRIA</p><h2>Start a conversation.</h2></div><Link href="/business" className="textLink">Explore our business <span>→</span></Link></div><ContactForm projects={projects} selectedProjectId={project.id}/></section></main>;
}

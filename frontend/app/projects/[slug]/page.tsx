import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { getProject } from '@/lib/api';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export const revalidate = 60;

type Detail = {
  name: string;
  subheading: string;
  summary: string;
  hero: string;
};

const fallbackDetails: Record<string, Detail> = {
  'oniria-stone-town': {
    name: 'ONIRIA Stone Town',
    subheading: 'Heritage Hospitality',
    summary:
      'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet. First AI boutique hotel in the heart of Stone Town.',
    hero: '/images/stone-town-restaurant.jpg',
  },
  'oniria-michamvi': {
    name: 'ONIRIA Michamvi',
    subheading: 'Wellness · Nature · Longevity',
    summary: 'A coastal destination concept focused on wellness, rejuvenation and longevity.',
    hero: '/images/michamvi-concept.jpg',
  },
  'ona-towers': {
    name: 'ONA Towers',
    subheading: 'Landmark Residences',
    summary:
      'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
    hero: '/images/outside-ona-tower.jpg',
  },
};

export default async function ProjectDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const fallback = fallbackDetails[slug];

  let project: any = null;
  try {
    project = await getProject(slug);
  } catch {
    project = null;
  }

  if (!project && !fallback) notFound();

  const visual = projectVisuals[slug] || fallbackVisual;
  const name = fallback?.name || project?.name || 'ONIRIA Project';
  const subheading = fallback?.subheading || project?.category || visual.eyebrow;
  const summary =
    fallback?.summary ||
    project?.summary ||
    'A distinctive ONIRIA project shaped around considered architecture, landscape and experience.';
  const hero = fallback?.hero || project?.media?.[0]?.url || visual.hero;

  return (
    <main className="publicPage projectDetailPage">
      <section className="projectDetailHero">
        <Image
          src={hero}
          alt={project?.media?.[0]?.alt_text || `${name} project`}
          fill
          priority
          quality={92}
          sizes="100vw"
        />
        <div className="projectDetailHeroShade" />
        <div className="projectDetailHeroCopy">
          <p className="projectDetailSubheading">{subheading}</p>
          <h1>{name}</h1>
        </div>
      </section>

      <section className="section projectDetailBody">
        <div className="projectDetailBodyGrid">
          <div>
            <p className="projectDetailLabel">ONIRIA PROJECT</p>
            <div className="projectDetailGoldLine" />
          </div>
          <div className="projectDetailBodyCopy">
            <p>{summary}</p>
            <Link href="/projects" prefetch className="projectEditorialDiscover">
              <span>BACK TO PROJECTS</span>
              <span aria-hidden="true">←</span>
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

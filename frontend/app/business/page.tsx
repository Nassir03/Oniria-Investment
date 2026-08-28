import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { getProjects } from '@/lib/api';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export const revalidate = 60;
export const metadata = { title: 'Our Projects' };

const VIGOR_GROUP_URL = 'https://turkysgroup.co.tz/';
const V_TOWN_URL = 'https://oniria-city-2hez.vercel.app/';

const fallbackProjects = [
  {
    id: 'oniria-stone-town',
    slug: 'oniria-stone-town',
    name: 'ONIRIA Stone Town',
    category: 'Hospitality',
    location: '',
    summary:
      'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet. First AI boutique hotel in the heart of Stone Town.',
  },
  {
    id: 'oniria-michamvi',
    slug: 'oniria-michamvi',
    name: 'ONIRIA Michamvi',
    category: 'Destination Development',
    location: '',
    summary: 'A coastal destination concept focused on wellness, rejuvenation and longevity.',
  },
  {
    id: 'ona-towers',
    slug: 'ona-towers',
    name: 'ONA Towers',
    category: 'Residential',
    location: '',
    summary:
      'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
  },
  {
    id: 'v-town',
    slug: 'v-town',
    name: 'V Town',
    category: 'Mixed-use',
    location: 'Fumba, Zanzibar',
    summary:
      'A new kind of coastal community where residences, sport and social life come together — designed around the way people want to live.',
  },
];

const projectPresentation: Record<
  string,
  { number: string; name: string; subheading: string; summary: string }
> = {
  'oniria-stone-town': {
    number: '01',
    name: 'ONIRIA Stone Town',
    subheading: 'Heritage Hospitality',
    summary:
      'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet. First AI boutique hotel in the heart of Stone Town.',
  },
  'oniria-michamvi': {
    number: '02',
    name: 'ONIRIA Michamvi',
    subheading: 'Wellness · Nature · Longevity',
    summary: 'A coastal destination concept focused on wellness, rejuvenation and longevity.',
  },
  'ona-towers': {
    number: '03',
    name: 'ONA Towers',
    subheading: 'Landmark Residences',
    summary:
      'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
  },
  'v-town': {
    number: '04',
    name: 'V Town',
    subheading: 'The Art of Living',
    summary:
      'A new kind of coastal community where residences, sport and social life come together — designed around the way people want to live.',
  },
};

function projectHref(slug: string) {
  return slug === 'v-town' ? V_TOWN_URL : `/projects/${slug}`;
}

const stableProjectHero: Record<string, string> = {
  'oniria-stone-town': '/images/oniria-stone-town-attached.png',
  'oniria-michamvi': '/images/oniria-michamvi-attached.png',
  'ona-towers': '/images/ona-towers-attached.png',
  'v-town': '/images/v-town-attached.png',
};

function projectHero(slug: string, mediaUrl?: string | null, fallback?: string) {
  return stableProjectHero[slug] || mediaUrl || fallback || '/images/homepage-light.webp';
}

export default async function Page() {
  const [projectsResult] = await Promise.allSettled([getProjects()]);
  const projects = projectsResult.status === 'fulfilled' ? projectsResult.value.items : [];
  const projectList = projects.length ? projects : fallbackProjects;

  return (
    <main className="publicPage businessPremiumPage">
      <section className="businessPremiumHero">
        <Image
          src="/images/zanzibar-stone-town-coast.webp"
          alt="Aerial view of Stone Town and the Zanzibar coastline"
          fill
          priority
          quality={92}
          sizes="100vw"
        />
        <div className="businessPremiumHeroShade" />
        <div className="businessPremiumHeroCopy">
          <p className="eyebrow light">Our Projects</p>
          <h1>Place that do not exist anywhere else.</h1>
          <p className="businessPremiumHeroLeadTwoLine">
            <span>From Stone Town to Zanzibar coastline, ONIRIA is creating a new</span>
            <span>generation of places to stay, live, gather and experience.</span>
          </p>
        </div>
      </section>

      <section id="overview" className="section businessPremiumCreating">
        <Reveal>
          <h2>This is what we are currently creating</h2>
        </Reveal>
      </section>

      <section id="projects" className="section businessPremiumProjects businessPremiumProjectsNoIntro">
        <div className="businessPremiumProjectStack">
          {projectList.map((project: any, index: number) => {
            const visual = projectVisuals[project.slug] || fallbackVisual;
            const hero = projectHero(project.slug, project.media?.[0]?.url, visual.hero);
            const href = projectHref(project.slug);
            const external = href.startsWith('http');
            const presentation = projectPresentation[project.slug];
            const displayName = presentation?.name || project.name;
            const displaySubheading = presentation?.subheading || project.category || visual.eyebrow;
            const displaySummary =
              presentation?.summary ||
              project.summary ||
              'A distinctive ONIRIA project shaped around considered architecture, landscape and experience.';
            const displayNumber = presentation?.number || String(index + 1).padStart(2, '0');

            return (
              <Reveal key={project.id ?? project.slug} delay={index * 0.03}>
                <article className="businessPremiumProject projectEditorialRow">
                  <div className="businessPremiumProjectMedia projectEditorialMedia">
                    <Image
                      src={hero}
                      alt={project.media?.[0]?.alt_text || `${displayName} project`}
                      fill
                      quality={92}
                      sizes="(max-width: 900px) calc(100vw - 44px), 640px"
                    />
                  </div>

                  <div className="businessPremiumProjectCopy projectEditorialCopy">
                    <span className="projectEditorialNumber">{displayNumber}</span>
                    <h3>{displayName}</h3>
                    <p className="projectEditorialSubheading">{displaySubheading}</p>
                    <div className="projectEditorialRule" aria-hidden="true" />
                    <p className="businessPremiumProjectSummary projectEditorialSummary">{displaySummary}</p>

                    {external ? (
                      <a
                        href={href}
                        target="_blank"
                        rel="noreferrer"
                        className="projectEditorialDiscover"
                        aria-label={`Discover ${displayName}`}
                      >
                        <span>DISCOVER PROJECT</span>
                        <span aria-hidden="true">→</span>
                      </a>
                    ) : (
                      <Link
                        href={href}
                        prefetch
                        className="projectEditorialDiscover"
                        aria-label={`Discover ${displayName}`}
                      >
                        <span>DISCOVER PROJECT</span>
                        <span aria-hidden="true">→</span>
                      </Link>
                    )}
                  </div>
                </article>
              </Reveal>
            );
          })}
        </div>
      </section>

      <section id="partnerships" className="section businessPremiumPartnerships businessPremiumPartnershipsIntegrated">
        <Reveal>
          <div className="businessPremiumPartnershipsGrid">
            <div className="businessPremiumPartnershipsTitle">
              <p className="eyebrow">Partnerships</p>
              <h2>Built through the right relationships.</h2>
            </div>
            <div className="businessPremiumPartnershipsCopy">
              <p>
                ONIRIA welcomes project, investment and commercial conversations that complement the destination vision. Our wider Vigor / Turky Group connection brings experience across operating businesses and sectors in Tanzania.
              </p>
              <Link href="/contact" prefetch className="button buttonNavy">
                Contact<span className="arrow">→</span>
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="businessPremiumGroupIntegrated">
          <Reveal className="businessPremiumGroupIdentity">
            <a
              href={VIGOR_GROUP_URL}
              target="_blank"
              rel="noreferrer"
              className="businessPremiumGroupLogoLink"
              aria-label="Visit Vigor / Turky Group of Companies website"
            >
              <div className="businessPremiumGroupLogoWrap">
                <Image
                  src="/images/vigor-group-attached.png"
                  alt="Vigor, a Turky's Group of Companies"
                  fill
                  sizes="(max-width: 900px) 68vw, 30vw"
                />
              </div>
            </a>
            <div className="businessPremiumGroupIdentityCopy">
              <p className="eyebrow">Vigor / Turky Group of Companies</p>
              <h3>Connected to a diversified business ecosystem.</h3>
              <p>
                The wider group brings together established businesses across healthcare, hospitality, manufacturing, energy, real estate, services, insurance and social impact.
              </p>
              <a
                href={VIGOR_GROUP_URL}
                target="_blank"
                rel="noreferrer"
                className="businessPremiumGroupLink"
              >
                VISIT VIGOR GROUP <span className="arrow">→</span>
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

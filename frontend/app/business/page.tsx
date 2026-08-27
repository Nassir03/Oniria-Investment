import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { getProjects } from '@/lib/api';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export const revalidate = 60;
export const metadata = { title: 'Our Project' };

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
      'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet. First AI boutique hotel in the heart of stone town',
  },
  {
    id: 'oniria-michamvi',
    slug: 'oniria-michamvi',
    name: 'ONIRIA Michamvi',
    category: 'Destination Development',
    location: '',
    summary: 'A coastal destination concept focused on wellness, rejuvenation and longevity',
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
      'A new kind of coastal community where residences, sport and social life come together- designed around the way people want to live.',
  },
];

const projectPresentation: Record<
  string,
  { number: string; name: string; summary: string }
> = {
  'oniria-stone-town': {
    number: '1.',
    name: 'ONIRIA Stone Town',
    summary:
      'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet. First AI boutique hotel in the heart of stone town',
  },
  'oniria-michamvi': {
    number: '2.',
    name: 'ONIRIA Michamvi',
    summary: 'A coastal destination concept focused on wellness, rejuvenation and longevity',
  },
  'ona-towers': {
    number: '3.',
    name: 'ONA Towers',
    summary:
      'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
  },
  'v-town': {
    number: '4.',
    name: 'V Town',
    summary:
      'A new kind of coastal community where residences, sport and social life come together- designed around the way people want to live.',
  },
};

function projectHref(slug: string) {
  return slug === 'v-town' ? V_TOWN_URL : '';
}

function cleanProjectLocation(location?: string | null) {
  if (!location) return '';
  return location.toLowerCase().includes('enquiry') ? '' : location;
}


const stableProjectHero: Record<string, string> = {
  'oniria-stone-town': '/images/stone-town-restaurant.jpg',
  'oniria-michamvi': '/images/michamvi-concept.jpg',
  'ona-towers': '/images/outside-ona-tower.jpg',
  'v-town': '/images/v-town-villa.webp',
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
          <p className="eyebrow light">Our Project</p>
          <h1>Place that don&apos;t exist anywhere else.</h1>
          <p className="businessPremiumHeroLeadTwoLine">
            <span>From stone town to Zanzibar Coastline, ONIRIA is creating a new</span>
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
            const displaySummary =
              presentation?.summary ||
              project.summary ||
              'A distinctive ONIRIA project shaped around considered architecture, landscape and experience.';
            const displayLocation = cleanProjectLocation(project.location);

            return (
              <Reveal key={project.id ?? project.slug} delay={index * 0.03}>
                <article className={`businessPremiumProject ${index % 2 ? 'reverse' : ''}`}>
                  <div className="businessPremiumProjectMedia" aria-hidden="true">
                    <Image
                      src={hero}
                      alt={project.media?.[0]?.alt_text || `${displayName} project`}
                      fill
                      sizes="(max-width: 900px) 100vw, 62vw"
                    />
                    <div className="businessPremiumProjectShade" />
                  </div>

                  <div className="businessPremiumProjectCopy">
                    <div>
                      <h3>
                        {presentation ? `${presentation.number} ${displayName}` : displayName}
                      </h3>
                    </div>
                    <p className="businessPremiumProjectSummary">{displaySummary}</p>
                    <div className="businessPremiumProjectMeta">
                      <span>{displayLocation}</span>
                      {external ? (
                        <a href={href} target="_blank" rel="noreferrer" className="businessPremiumProjectLink">
                          View website
                        </a>
                      ) : presentation ? (
                        <span className="businessPremiumProjectLink businessPremiumProjectLinkStatic">
                          View website
                        </span>
                      ) : null}
                    </div>
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
                Contact
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
                  src="/images/vigor-group-new.webp"
                  alt="Vigor, a Turky's Group of Companies"
                  fill
                  sizes="(max-width: 900px) 60vw, 28vw"
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
                Visit Vigor Group
              </a>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

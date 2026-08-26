import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';
import { getBusinessAreas, getProjects } from '@/lib/api';
import { fallbackVisual, projectVisuals } from '@/lib/projectVisuals';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Our Business' };

const VIGOR_GROUP_URL = 'https://www.turkysgroup.co.tz/';
const V_TOWN_URL = 'https://oniria-city-2hez.vercel.app/';

const fallbackAreas = [
  {
    id: 'destination-development',
    name: 'Destination Development',
    summary: 'Destination concepts that align architecture, landscape and experience around a clear sense of place.',
  },
  {
    id: 'hospitality',
    name: 'Hospitality',
    summary: 'Guest experiences considered from arrival and dining through private rooms and shared spaces.',
  },
  {
    id: 'residential',
    name: 'Residential',
    summary: 'Homes designed around comfort, light, materiality and an understated sense of premium living.',
  },
  {
    id: 'mixed-use',
    name: 'Mixed-use',
    summary: 'Integrated environments where complementary uses contribute to a coherent destination experience.',
  },
];

const fallbackProjects = [
  {
    id: 'oniria-stone-town',
    slug: 'oniria-stone-town',
    name: 'ONIRIA Stone Town',
    category: 'Hospitality',
    location: 'Location details available on enquiry',
    summary: 'A hospitality-led ONIRIA concept where heritage character, warm materiality and contemporary guest experience meet.',
  },
  {
    id: 'oniria-michamvi',
    slug: 'oniria-michamvi',
    name: 'ONIRIA Michamvi',
    category: 'Destination Development',
    location: 'Location details available on enquiry',
    summary: 'A coastal destination concept focused on landscape, hospitality and an immersive sense of escape.',
  },
  {
    id: 'ona-towers',
    slug: 'ona-towers',
    name: 'ONA Towers',
    category: 'Residential',
    location: 'Location details available on enquiry',
    summary: 'A contemporary residential concept with a premium arrival, light-filled homes and carefully considered shared spaces.',
  },
  {
    id: 'v-town',
    slug: 'v-town',
    name: 'V Town',
    category: 'Mixed-use',
    location: 'Fumba, Zanzibar',
    summary: 'A new ONIRIA residential expression composed around calm architecture, greenery and everyday quality of life.',
  },
];


function projectHref(slug: string) {
  return slug === 'v-town' ? V_TOWN_URL : `/projects/${slug}`;
}

export default async function Page() {
  const [areasResult, projectsResult] = await Promise.allSettled([
    getBusinessAreas(),
    getProjects(),
  ]);

  const areas = areasResult.status === 'fulfilled' ? areasResult.value : [];
  const projects = projectsResult.status === 'fulfilled' ? projectsResult.value.items : [];

  const businessAreas = areas.length ? areas : fallbackAreas;
  const projectList = projects.length ? projects : fallbackProjects;

  return (
    <main className="publicPage businessPremiumPage">
      <section className="businessPremiumHero">
        <Image src="/images/restaurant.webp" alt="ONIRIA hospitality interior" fill priority sizes="100vw" />
        <div className="businessPremiumHeroShade" />
        <div className="businessPremiumHeroCopy">
          <p className="eyebrow light">Our Business</p>
          <h1>Shaping destinations.<br/><em>Building lasting value.</em></h1>
          <p>
            ONIRIA brings destination thinking, hospitality, residential design and commercial discipline together to create places with distinctive identity and long-term relevance.
          </p>
        </div>
      </section>

      <section id="overview" className="section businessPremiumOverview">
        <Reveal>
          <div className="businessPremiumIntro">
            <div>
              <p className="eyebrow">Overview</p>
              <h2>Building future-proof businesses.</h2>
            </div>
            <p>
              We approach every ONIRIA proposition as more than a physical development. Strong places connect design, experience, positioning and commercial clarity so they can remain relevant long after launch.
            </p>
          </div>
        </Reveal>

        <div className="businessPremiumCapabilities">
          {businessAreas.map((area: any, index: number) => (
            <Reveal key={area.id ?? area.name} delay={index * 0.04}>
              <article className="businessPremiumCapability">
                <div className="businessPremiumCapabilityTop">
                  <span className="businessPremiumCapabilityIndex">{String(index + 1).padStart(2, '0')}</span>
                  <span className="businessPremiumCapabilityRule" aria-hidden="true" />
                </div>
                <div className="businessPremiumCapabilityBody">
                  <h3>{area.name}</h3>
                  <p>{area.summary || fallbackAreas[index]?.summary}</p>
                </div>
              </article>
            </Reveal>
          ))}
        </div>
      </section>

      <section className="businessPremiumPerspective">
        <div className="businessPremiumPerspectiveMedia">
          <Image src="/images/outside-ona-tower.webp" alt="ONA Towers arrival" fill sizes="100vw" />
          <div className="businessPremiumPerspectiveShade" />
        </div>
        <Reveal className="businessPremiumPerspectiveCopy">
          <p className="eyebrow light">Commercial perspective</p>
          <h2>Design creates desire.<br/><em>Experience builds trust.</em></h2>
          <p>
            Marketability is strongest when the proposition is easy to understand, visually distinctive and supported by an experience that feels considered from the first interaction onward.
          </p>
        </Reveal>
      </section>

      <section id="projects" className="section businessPremiumProjects">
        <Reveal>
          <div className="businessPremiumProjectsHead">
            <div>
              <p className="eyebrow">Projects</p>
              <h2>Signature developments.</h2>
            </div>
            <p>
              Hospitality, destination development, residential and mixed-use concepts brought to life through distinct ONIRIA projects.
            </p>
          </div>
        </Reveal>

        <div className="businessPremiumProjectStack">
          {projectList.map((project: any, index: number) => {
            const visual = projectVisuals[project.slug] || fallbackVisual;
            const hero = project.media?.[0]?.url || visual.hero;
            const href = projectHref(project.slug);
            const external = href.startsWith('http');

            return (
              <Reveal key={project.id ?? project.slug} delay={index * 0.03}>
                <article className={`businessPremiumProject ${index % 2 ? 'reverse' : ''}`}>
                  <div className="businessPremiumProjectMedia" aria-hidden="true">
                    <Image
                      src={hero}
                      alt={project.media?.[0]?.alt_text || `${project.name} project`}
                      fill
                      sizes="(max-width: 900px) 100vw, 62vw"
                    />
                    <div className="businessPremiumProjectShade" />
                    <span className="businessPremiumProjectNameWatermark">{project.name}</span>
                  </div>

                  <div className="businessPremiumProjectCopy">
                    <div>
                      <p className="eyebrow">{project.category || visual.eyebrow}</p>
                      <h3>{project.name}</h3>
                    </div>
                    <p className="businessPremiumProjectSummary">
                      {project.summary || 'A distinctive ONIRIA project shaped around considered architecture, landscape and experience.'}
                    </p>
                    <div className="businessPremiumProjectMeta">
                      <span>{project.location || 'Location details available on enquiry'}</span>
                      {external ? (
                        <a href={href} target="_blank" rel="noreferrer" className="businessPremiumProjectLink">
                          Visit project website <span>↗</span>
                        </a>
                      ) : (
                        <Link href={href} className="businessPremiumProjectLink">
                          View project <span>↗</span>
                        </Link>
                      )}
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
              <Link href="/contact" className="button buttonNavy">
                Contact ONIRIA <span>↗</span>
              </Link>
            </div>
          </div>
        </Reveal>

        <div className="businessPremiumGroupIntegrated">
          <Reveal className="businessPremiumGroupIdentity">
            <div className="businessPremiumGroupLogoWrap">
              <Image
                src="/images/vigor-group-logo.jpg"
                alt="Vigor, a Turky's Group of Companies"
                fill
                sizes="(max-width: 900px) 60vw, 28vw"
              />
            </div>
            <div className="businessPremiumGroupIdentityCopy">
              <p className="eyebrow">Vigor / Turky Group of Companies</p>
              <h3>Connected to a diversified business ecosystem.</h3>
              <p>
                The wider group brings together established businesses across healthcare, hospitality, manufacturing, energy, real estate, services, insurance and social impact.
              </p>
              <a href={VIGOR_GROUP_URL} target="_blank" rel="noreferrer" className="businessPremiumGroupLink">
                Visit Vigor Group <span>↗</span>
              </a>
            </div>
          </Reveal>

        </div>
      </section>
    </main>
  );
}

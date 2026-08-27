import Image from 'next/image';
import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import Reveal from '@/components/Reveal';


const collection = [
  {
    name: 'ONIRIA Stone Town',
    descriptor: 'Heritage Hospitality',
    image: '/images/stone-town-restaurant.jpg',
    href: '',
    external: false,
  },
  {
    name: 'ONIRIA Michamvi',
    descriptor: 'Wellness · Nature · Longevity',
    image: '/images/michamvi-concept.jpg',
    href: '',
    external: false,
  },
  {
    name: 'ONA Towers',
    descriptor: 'Landmark Residences',
    image: '/images/ona-tower.webp',
    href: '',
    external: false,
  },
  {
    name: 'V Town',
    descriptor: 'The Art of Living',
    image: '/images/v-town-villa.webp',
    href: 'https://oniria-city-2hez.vercel.app/',
    external: true,
  },
];

export default function Home() {
  return (
    <main className="publicPage">
      <HomeHero />

      <section id="vision" className="section pointOfViewSection pointOfViewEditorial">
        <Reveal>
          <p className="eyebrow">ONIRIA / Our view</p>
          <div className="pointOfViewGrid">
            <div className="pointOfViewStatement">
              <h2><span className="pointOfViewFirstLine">We begin with <em>place.</em></span><br />Then imagine what it could become.</h2>
            </div>
            <div className="pointOfViewCopy">
              <p>Every ONIRIA project begins with its place — its landscape, culture and possibilities — and evolves into an experience that could belong nowhere else.</p>
              <Link href="/vision" prefetch className="textLink">Discover Our Vision <span>→</span></Link>
            </div>
          </div>
        </Reveal>

        <Reveal className="homeCollectionPremium" aria-label="The ONIRIA Collection">
          <div className="homeCollectionPremiumIntro">
            <p className="eyebrow">The ONIRIA Collection</p>
            <h3>Distinctive places. Unmistakably ONIRIA.</h3>
            <p>
              From heritage hospitality to coastal wellness, landmark residences and complete living environments,
              every ONIRIA project is shaped to create memorable experiences, distinctive identity and lasting value.
            </p>
          </div>

          <div className="homeCollectionPremiumGrid" role="list" aria-label="ONIRIA projects">
            {collection.map((project, index) => {
              const CardInner = (
                <>
                  <div className="homeCollectionPremiumMedia">
                    <Image
                      src={project.image}
                      alt={`${project.name} project image`}
                      fill
                      sizes="(max-width: 700px) 100vw, (max-width: 1200px) 50vw, 25vw"
                    />
                    <div className="homeCollectionPremiumShade" />
                  </div>
                  <div className="homeCollectionPremiumBody">
                    <span className="homeCollectionPremiumMarker" aria-hidden="true" />
                    <div>
                      <h4>{project.name}</h4>
                      <p>{project.descriptor}</p>
                    </div>
                    {project.external ? (
                      <span className="homeCollectionPremiumAction">Discover <b>→</b></span>
                    ) : null}
                  </div>
                </>
              );

              return project.external ? (
                <a
                  key={project.name}
                  href={project.href}
                  target="_blank"
                  rel="noreferrer"
                  className={`homeCollectionPremiumCard homeCollectionPremiumCard${index + 1}`}
                  role="listitem"
                >
                  {CardInner}
                </a>
              ) : (
                <article
                  key={project.name}
                  className={`homeCollectionPremiumCard homeCollectionPremiumCardStatic homeCollectionPremiumCard${index + 1}`}
                  role="listitem"
                >
                  {CardInner}
                </article>
              );
            })}
          </div>

          <div className="homeCollectionPremiumFooter">
            <Link href="/projects" prefetch className="textLink">Explore all projects <span>→</span></Link>
          </div>
        </Reveal>
      </section>

      <section className="dualFeature premiumBusinessFeature hospitalityFeature hospitalityFeatureRefined">
        <div className="dualMedia hospitalityMedia" aria-hidden="true">
          <div className="hospitalityImage" />
        </div>
        <Reveal className="dualCopy hospitalityCopy hospitalityCopyRefined">
          <h2>We design for how life feels.</h2>
          <p>Every details shapes the experience, how we arrive, move, connect retreat and belong.</p>
          <Link href="/business" prefetch className="button buttonNavy">Explore Our Project <span>↗</span></Link>
        </Reveal>
      </section>

    </main>
  );
}

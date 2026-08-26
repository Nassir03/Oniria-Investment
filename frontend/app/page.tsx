import Image from 'next/image';
import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import Reveal from '@/components/Reveal';
import EditorialImage from '@/components/EditorialImage';
import { formatNewsDate, truncateText } from '@/lib/newsroom';
import { getNews } from '@/lib/api';

export const dynamic = 'force-dynamic';

const collection = [
  {
    name: 'ONIRIA Stone Town',
    descriptor: 'Heritage Hospitality',
    image: '/images/stone-town-restaurant.png',
    href: '/projects/oniria-stone-town',
    external: false,
  },
  {
    name: 'ONIRIA Michamvi',
    descriptor: 'Wellness · Nature · Longevity',
    image: '/images/michamvi-concept.png',
    href: '/projects/oniria-michamvi',
    external: false,
  },
  {
    name: 'ONA Towers',
    descriptor: 'Landmark Residences',
    image: '/images/ona-tower.webp',
    href: '/projects/ona-towers',
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

export default async function Home() {
  let news: any[] = [];
  try { news = (await getNews(1, 4)).items; } catch {}

  return (
    <main className="publicPage">
      <HomeHero />

      <section id="vision" className="section pointOfViewSection pointOfViewEditorial">
        <Reveal>
          <p className="eyebrow">ONIRIA / Our view</p>
          <div className="pointOfViewGrid">
            <div className="pointOfViewStatement">
              <h2>We begin with <em>place.</em><br />Then imagine what it could become.</h2>
            </div>
            <div className="pointOfViewCopy">
              <p>Every ONIRIA project begins with its place — its landscape, culture and possibilities — and evolves into an experience that could belong nowhere else.</p>
              <Link href="/our-story" className="textLink">Discover Our Vision <span>→</span></Link>
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
                    <span className="homeCollectionPremiumAction">Discover <b>→</b></span>
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
                <Link
                  key={project.name}
                  href={project.href}
                  className={`homeCollectionPremiumCard homeCollectionPremiumCard${index + 1}`}
                  role="listitem"
                >
                  {CardInner}
                </Link>
              );
            })}
          </div>

          <div className="homeCollectionPremiumFooter">
            <Link href="/projects" className="textLink">Explore all projects <span>→</span></Link>
          </div>
        </Reveal>
      </section>

      <section className="dualFeature premiumBusinessFeature hospitalityFeature">
        <div className="dualMedia hospitalityMedia" aria-hidden="true">
          <div className="hospitalityImage" />
        </div>
        <Reveal className="dualCopy hospitalityCopy">
          <p className="eyebrow">Hospitality as atmosphere</p>
          <h2>Designed for how a place <em>feels.</em></h2>
          <p>From arrival to dining, private rooms to shared spaces, each touchpoint is designed as part of one complete experience.</p>
          <Link href="/business" className="button buttonNavy">Explore our business <span>↗</span></Link>
        </Reveal>
      </section>

      <section className="section homeNewsroomTeaser" aria-label="ONIRIA Newsroom preview">
        <Reveal>
          <div className="homeNewsTeaserHead">
            <div>
              <p className="eyebrow">ONIRIA Newsroom</p>
              <h2>New & upcoming.</h2>
            </div>
            <Link href="/newsroom" className="textLink">Open newsroom <span>→</span></Link>
          </div>

          {news.length ? (
            <div className="homeNewsTeaserGrid">
              {news.slice(0, 4).map((article: any, index: number) => (
                <Link
                  key={article.id || article.slug}
                  href={`/newsroom/${article.slug}`}
                  className={`homeNewsMiniCard ${index === 0 ? 'featured' : ''}`}
                >
                  <div className="homeNewsMiniMedia">
                    <EditorialImage
                      src={article.hero_image_url}
                      alt={article.hero_image_alt || article.title}
                      sizes={index === 0 ? '(max-width: 900px) 100vw, 42vw' : '(max-width: 900px) 100vw, 22vw'}
                      fallbackTitle="ONIRIA"
                      fallbackLabel="Newsroom update"
                    />
                  </div>
                  <div className="homeNewsMiniCopy">
                    <div className="homeNewsMiniMeta">
                      <span>{index === 0 ? 'Latest update' : 'ONIRIA update'}</span>
                      <span>{formatNewsDate(article.published_at)}</span>
                    </div>
                    <h3>{article.title}</h3>
                    <p>{truncateText(article.excerpt || article.title, index === 0 ? 128 : 92)}</p>
                    <span className="homeNewsMiniAction">Read update <b>→</b></span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <Link href="/newsroom" className="homeNewsTeaserEmpty">
              <span>Newsroom</span>
              <strong>New stories and official updates will appear here.</strong>
              <b>Explore newsroom →</b>
            </Link>
          )}
        </Reveal>
      </section>
    </main>
  );
}

import Link from 'next/link';
import HomeHero from '@/components/HomeHero';
import Reveal from '@/components/Reveal';
import EditorialImage from '@/components/EditorialImage';
import { formatNewsDate, truncateText } from '@/lib/newsroom';
import { getNews } from '@/lib/api';

export const dynamic = 'force-dynamic';

const collection = [
  { name: 'ONIRIA Stone Town', descriptor: 'Heritage Hospitality' },
  { name: 'ONIRIA Michamvi', descriptor: 'Wellness · Nature · Longevity' },
  { name: 'ONA Towers', descriptor: 'Landmark Residences' },
  { name: 'V Town', descriptor: 'The Art of Living' },
];

export default async function Home() {
  let news: any[] = [];
  try { news = (await getNews(1, 4)).items; } catch {}

  return (
    <main className="publicPage">
      <HomeHero />

      <section className="section pointOfViewSection pointOfViewEditorial">
        <Reveal>
          <p className="eyebrow">ONIRIA / Our point of view</p>
          <div className="pointOfViewGrid">
            <div className="pointOfViewStatement">
              <h2>We begin with <em>place.</em><br />Then imagine what it could become.</h2>
            </div>
            <div className="pointOfViewCopy">
              <p>ONIRIA develops destinations and residences around one clear idea: the experience should feel intentional from the first view to the final detail.</p>
              <Link href="/our-story" className="textLink">Discover our story <span>→</span></Link>
            </div>
          </div>
        </Reveal>

        <Reveal className="oniriaPhilosophyFlow" aria-label="ONIRIA principles and collection">
          <div className="philosophyRail" role="list" aria-label="ONIRIA principles">
            {['Place', 'Design', 'Experience', 'Legacy'].map((principle) => (
              <div key={principle} className="philosophyRailItem" role="listitem">
                <span className="philosophyRailDot" aria-hidden="true" />
                <span>{principle}</span>
              </div>
            ))}
          </div>

          <div className="collectionOrbit">
            <div className="collectionOrbitIntro">
              <p className="eyebrow">The ONIRIA Collection</p>
              <h3>Distinctive places. Enduring value. Unmistakably ONIRIA.</h3>
              <p>From heritage hospitality to coastal wellness, landmark residences and complete living environments, every ONIRIA destination is shaped to create memorable experiences, distinctive identity and lasting value.</p>
            </div>

            <div className="collectionOrbitStage" role="list" aria-label="The ONIRIA Collection">
              <div className="collectionOrbitHubWrap" aria-hidden="true">
                <span className="collectionOrbitPulse collectionOrbitPulseOne" />
                <span className="collectionOrbitPulse collectionOrbitPulseTwo" />
                <div className="collectionOrbitHub">
                  <span>ONIRIA</span>
                  <strong>Collection</strong>
                </div>
              </div>

              <svg className="collectionOrbitLines" viewBox="0 0 1200 430" preserveAspectRatio="none" aria-hidden="true">
                <path className="orbitArc" d="M220 150 C 380 10, 820 10, 980 150" />
                <path className="orbitStem" d="M600 186 L600 228" />
                <path className="orbitLink" d="M220 150 C 210 216, 186 244, 160 268" />
                <path className="orbitLink" d="M420 120 C 416 204, 392 236, 350 268" />
                <path className="orbitLink" d="M780 120 C 784 204, 808 236, 850 268" />
                <path className="orbitLink" d="M980 150 C 990 216, 1014 244, 1040 268" />
                <circle className="orbitNode orbitNodeA" cx="220" cy="150" r="9" />
                <circle className="orbitNode orbitNodeB" cx="420" cy="120" r="9" />
                <circle className="orbitNode orbitNodeC" cx="780" cy="120" r="9" />
                <circle className="orbitNode orbitNodeD" cx="980" cy="150" r="9" />
              </svg>

              <div className="collectionOrbitProjects">
                {collection.map((project, index) => (
                  <article key={project.name} className={`collectionOrbitProject collectionOrbitProject${index + 1}`} role="listitem">
                    <span className="collectionOrbitNode" aria-hidden="true"><i /></span>
                    <div className="collectionOrbitProjectText">
                      <h4>{project.name}</h4>
                      <p>{project.descriptor}</p>
                    </div>
                  </article>
                ))}
              </div>
            </div>
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

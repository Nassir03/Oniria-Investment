import Link from 'next/link';
import EditorialImage from '@/components/EditorialImage';
import { getNews } from '@/lib/api';
import { formatNewsDate, truncateText } from '@/lib/newsroom';

export const dynamic = 'force-dynamic';
export const metadata = { title: 'Newsroom' };

export default async function Page() {
  let news: any[] = [];
  try {
    news = (await getNews(1, 30)).items;
  } catch {
    news = [];
  }

  return (
    <main className="publicPage newsroomExperiencePage">
      <section className="newsroomImageHero">
        <div className="newsroomImageHeroMedia">
          <EditorialImage
            src="/images/newsroom-hero.webp"
            alt="ONIRIA newsroom"
            priority
            sizes="100vw"
            fallbackTitle="ONIRIA Newsroom"
            fallbackLabel="Official updates"
          />
          <div className="imageOverlay newsroomImageHeroOverlay" />
        </div>
        <div className="newsroomImageHeroCopy">
          <p className="eyebrow light">Newsroom</p>
          <h1>News & official updates.</h1>
          <p>Project milestones, company announcements and perspectives from across ONIRIA Investments.</p>
        </div>
      </section>

      <section className="section newsroomCompactSection">
        <div className="newsroomCompactHead">
          <div>
            <p className="eyebrow">All updates</p>
            <h2>Latest from ONIRIA.</h2>
          </div>
          <p>Concise updates designed for quick reading, with full stories available when you want to explore further.</p>
        </div>

        {news.length ? (
          <div className="newsroomCompactGrid">
            {news.map((article: any) => (
              <article key={article.id} className="newsroomCompactCard">
                <Link href={`/newsroom/${article.slug}`} className="newsroomCompactMedia">
                  <EditorialImage
                    src={article.hero_image_url}
                    alt={article.hero_image_alt || article.title}
                    sizes="(max-width: 760px) 100vw, 33vw"
                    fallbackTitle="ONIRIA"
                    fallbackLabel="Newsroom update"
                  />
                </Link>
                <div className="newsroomCompactBody">
                  <span className="newsDate">{formatNewsDate(article.published_at)}</span>
                  <h3>{article.title}</h3>
                  <p>{truncateText(article.excerpt || article.meta_description || article.title, 145)}</p>
                  <Link href={`/newsroom/${article.slug}`} className="textLink">
                    Read more <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="newsroomEmptyCompact">
            <p>No published updates yet. Publish from the administration portal and the story will appear here automatically.</p>
          </div>
        )}
      </section>
    </main>
  );
}

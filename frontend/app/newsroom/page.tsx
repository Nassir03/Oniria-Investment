import Link from 'next/link';
import EditorialImage from '@/components/EditorialImage';
import { getNews } from '@/lib/api';
import { formatNewsDate, truncateText } from '@/lib/newsroom';

export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const metadata = { title: 'News' };

export default async function Page() {
  let news: any[] = [];
  let loadError = false;
  try {
    news = (await getNews(1, 30)).items;
  } catch {
    loadError = true;
  }

  return (
    <main className="publicPage newsroomExperiencePage">
      <section className="newsroomImageHero">
        <div className="newsroomImageHeroMedia">
          <EditorialImage
            src="/images/newsroom-hero.webp"
            alt="ONIRIA news"
            priority
            sizes="100vw"
            fallbackTitle="ONIRIA News"
            fallbackLabel="ONIRIA updates"
          />
          <div className="imageOverlay newsroomImageHeroOverlay" />
        </div>
        <div className="newsroomImageHeroCopy premiumUnifiedHeroCopy">
          <p className="eyebrow light">News</p>
          <h1>See our progress.</h1>
          <p>Project milestones, company announcements and perspectives from across ONIRIA Investments.</p>
        </div>
      </section>

      <section className="section newsroomCompactSection newsPageStream">
        {news.length ? (
          <div className="newsroomCompactGrid">
            {news.map((article: any) => (
              <article key={article.id} className="newsroomCompactCard">
                <Link href={`/newsroom/${article.slug}`} prefetch className="newsroomCompactMedia">
                  <EditorialImage
                    src={article.hero_image_url}
                    alt={article.hero_image_alt || article.title}
                    sizes="(max-width: 760px) 100vw, 33vw"
                    fallbackTitle="ONIRIA"
                    fallbackLabel="News update"
                  />
                </Link>
                <div className="newsroomCompactBody">
                  <span className="newsDate">{formatNewsDate(article.published_at)}</span>
                  <h3>{article.title}</h3>
                  <p>{truncateText(article.excerpt || article.meta_description || article.title, 145)}</p>
                  <Link href={`/newsroom/${article.slug}`} prefetch className="textLink">
                    Read more <span>→</span>
                  </Link>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="newsroomEmptyCompact">
            <p>{loadError
              ? 'News updates are temporarily unavailable. Please refresh shortly; published stories remain stored and have not been removed.'
              : 'No published updates yet. Publish from the administration portal and the story will appear here automatically.'}</p>
          </div>
        )}
      </section>
    </main>
  );
}

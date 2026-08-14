import Link from 'next/link';
import { notFound } from 'next/navigation';
import EditorialImage from '@/components/EditorialImage';
import { getArticle } from '@/lib/api';
import { formatNewsDate } from '@/lib/newsroom';

export const dynamic = 'force-dynamic';

function textFromNode(node: any): string {
  if (!node) return '';
  if (typeof node.text === 'string') return node.text;
  if (Array.isArray(node.content)) return node.content.map(textFromNode).join('');
  return '';
}

function renderBody(body: any) {
  if (!body) return null;
  if (typeof body === 'string') {
    return body
      .split(/\n\n+/)
      .map((paragraph, index) => (paragraph.trim() ? <p key={index}>{paragraph.trim()}</p> : null));
  }
  if (Array.isArray(body.content)) {
    return body.content.map((node: any, index: number) => {
      const text = textFromNode(node).trim();
      if (!text) return null;
      if (node.type === 'heading') return <h2 key={index}>{text}</h2>;
      if (node.type === 'blockquote') return <blockquote key={index}>{text}</blockquote>;
      return <p key={index}>{text}</p>;
    });
  }
  return body.text ? <p>{body.text}</p> : null;
}

export default async function Page({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  let article: any;

  try {
    article = await getArticle(slug);
  } catch {
    return notFound();
  }

  const categories = article.categories?.length
    ? article.categories.map((category: any) => category.name).join(' · ')
    : 'ONIRIA Investments';

  return (
    <main className="publicPage newsroomArticleTaupe">
      <article className="newsroomArticleShell">
        <header className="newsroomArticleHeader">
          <Link href="/newsroom" className="textLink">Back to newsroom <span>→</span></Link>
          <div className="newsroomArticleMeta">
            <span>{formatNewsDate(article.published_at)}</span>
            <span>{categories}</span>
          </div>
          <h1>{article.title}</h1>
          {article.excerpt ? <p>{article.excerpt}</p> : null}
        </header>

        <div className="newsroomArticleImage">
          <EditorialImage
            src={article.hero_image_url}
            alt={article.hero_image_alt || article.title}
            priority
            sizes="(max-width: 900px) 100vw, 82vw"
            fallbackTitle={article.title}
            fallbackLabel="ONIRIA newsroom"
            fallbackTone="light"
          />
        </div>

        <div className="newsroomArticleBody">{renderBody(article.body)}</div>

        <footer className="newsroomArticleFooter">
          <span>ONIRIA Investments</span>
          <Link href="/contact" className="textLink">Start an enquiry <span>→</span></Link>
        </footer>
      </article>
    </main>
  );
}

-- Migration 003: Newsroom
-- Created by Kelvin - Database Lead
-- Tables: news_categories, news_articles, news_article_categories

CREATE TABLE news_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  name VARCHAR(255) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE news_categories IS 'Categories used to classify newsroom articles (e.g. company news, project updates).';

CREATE TYPE article_status AS ENUM ('draft', 'scheduled', 'published', 'archived');

CREATE TABLE news_articles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug VARCHAR(255) UNIQUE NOT NULL,
  title VARCHAR(255) NOT NULL,
  excerpt TEXT,
  body JSONB,
  hero_image_url VARCHAR(500),
  status article_status DEFAULT 'draft',
  published_at TIMESTAMP,
  author_id UUID REFERENCES profiles(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

COMMENT ON TABLE news_articles IS 'Newsroom articles with draft/scheduled/published/archived workflow, managed by staff.';

CREATE INDEX idx_news_articles_status_published ON news_articles(status, published_at DESC);
CREATE UNIQUE INDEX idx_news_articles_slug ON news_articles(slug);

CREATE TABLE news_article_categories (
  article_id UUID NOT NULL REFERENCES news_articles(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES news_categories(id) ON DELETE CASCADE,
  PRIMARY KEY (article_id, category_id)
);

COMMENT ON TABLE news_article_categories IS 'Links newsroom articles to one or more categories.';

ALTER TABLE news_articles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can view published articles"
ON news_articles FOR SELECT
USING (status = 'published');
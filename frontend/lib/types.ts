export type ProjectMedia = { id: string; url: string; alt_text: string; media_type: string; width?: number | null; height?: number | null; is_concept: boolean; sort_order: number };
export type Project = { id: string; slug: string; name: string; category?: string | null; location?: string | null; summary?: string | null; body?: Record<string, unknown> | null; status: string; featured: boolean; sort_order: number; media: ProjectMedia[]; created_at: string; updated_at: string };
export type NewsArticle = { id: string; slug: string; title: string; excerpt?: string | null; body: Record<string, unknown>; hero_image_url?: string | null; hero_image_alt?: string | null; status: string; published_at?: string | null; meta_description?: string | null; categories: {id:string;slug:string;name:string}[]; created_at:string; updated_at:string };
export type PageMeta = { page:number; page_size:number; total:number; pages:number };
export type Paginated<T> = { items:T[]; meta:PageMeta };
export type BusinessArea = { id:string; slug:string; name:string; summary?:string|null; body?:Record<string,unknown>|null };

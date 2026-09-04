export type ToolkitCategory =
  | 'gallery'
  | 'logo'
  | 'project_brief'
  | 'brochure'
  | 'floor_plans'
  | 'project_film'
  | 'payment_plan'
  | 'material_boards'
  | 'masterplan';

export type ToolkitAsset = {
  id: string;

  project_id?: string | null;
  project_slug: string;

  category: ToolkitCategory;

  title: string;
  description?: string | null;

  /*
   * The REAL file/document URL.
   *
   * For Google Drive assets:
   * - Eye icon opens this URL
   * - Download icon converts this URL to a direct-download URL
   */
  file_url: string;

  /*
   * The image displayed on the carousel card.
   *
   * This can be completely different from file_url.
   *
   * Example:
   * file_url = Google Drive brochure PDF
   * preview_image_url = abstract palm-shadow image
   */
  preview_image_url?: string | null;

  storage_path?: string | null;
  preview_storage_path?: string | null;

  media_type: 'image' | 'pdf' | 'video' | 'document';

  file_name?: string | null;
  file_size?: number | null;

  is_public: boolean;
  is_downloadable: boolean;

  sort_order: number;

  created_at?: string;
  updated_at?: string;
};

export type ToolkitProject = {
  slug: string;
  name: string;
  slogan: string;
};

/*
 * Shared project list.
 *
 * Both the public toolkit and Admin use this same list.
 */
export const toolkitProjects: ToolkitProject[] = [
  {
    slug: 'all-projects',
    name: 'ONIRIA Investments',
    slogan: '',
  },
  {
    slug: 'ona-towers',
    name: 'ONA Towers',
    slogan: 'Ishi juu, ona zaidi.',
  },
  {
    slug: 'roho',
    name: 'ROHO',
    slogan: '',
  },
];


export const toolkitCategoryDefaultCover: Record<ToolkitCategory, string> = {
  gallery: '/images/toolkit/ona-tower.png',
  logo: '/images/toolkit/oniria-logo-white.png',
  project_brief: '/images/toolkit/ona-hall.png',
  brochure: '/images/toolkit/abstract/palm-shadow.png',
  floor_plans: '/images/toolkit/ona-living-room.png',
  project_film: '/images/toolkit/abstract/sand-texture.png',
  payment_plan: '/images/toolkit/ona-coffee.png',
  material_boards: '/images/toolkit/abstract/ocean-wave.png',
  masterplan: '/images/toolkit/coastal-residence.png',
};

const imageCategories = new Set<ToolkitCategory>([
  'gallery',
  'logo',
  'material_boards',
]);

const pdfCategories = new Set<ToolkitCategory>([
  'project_brief',
  'brochure',
  'floor_plans',
  'payment_plan',
  'masterplan',
]);

export function normalizeToolkitLink(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) throw new Error('Enter the asset link.');

  if (trimmed.startsWith('/') && !trimmed.startsWith('//')) return trimmed;

  const candidate = trimmed.startsWith('//')
    ? `https:${trimmed}`
    : /^[a-z][a-z0-9+.-]*:\/\//i.test(trimmed)
      ? trimmed
      : `https://${trimmed}`;

  let url: URL;
  try {
    url = new URL(candidate);
  } catch {
    throw new Error('Enter a valid public link.');
  }

  if (!['http:', 'https:'].includes(url.protocol)) {
    throw new Error('Toolkit links must use HTTP or HTTPS.');
  }

  return url.toString();
}

export function inferToolkitMediaType(
  rawUrl: string,
  category: ToolkitCategory,
): ToolkitAsset['media_type'] {
  const url = rawUrl.toLowerCase().split(/[?#]/)[0];

  if (/\.(png|jpe?g|webp|avif|gif|svg)$/.test(url)) return 'image';
  if (/\.pdf$/.test(url)) return 'pdf';
  if (/\.(mp4|webm|mov|m4v)$/.test(url)) return 'video';

  if (category === 'project_film') return 'video';
  if (pdfCategories.has(category)) return 'pdf';
  if (imageCategories.has(category)) return 'image';
  return 'document';
}

/*
 * ----------------------------------------------------------
 * FALLBACK TOOLKIT ASSETS
 * ----------------------------------------------------------
 *
 * These appear when the API/database has no published toolkit
 * assets yet.
 *
 * Cover sequence:
 *
 * A = real project image
 * B = abstract / nature / atmospheric cover
 *
 * A B A B A B A B A
 *
 * Gallery             A
 * Logo                B
 * Project Briefing    A
 * Brochure            B
 * Floor Plans         A
 * Project Film        B
 * Payment Plan        A
 * Material Boards     B
 * Masterplan           A
 */

export const fallbackToolkitAssets: ToolkitAsset[] = [
  /*
   * 01 — GALLERY
   * TYPE A
   * Real project visual
   */
  {
    id: 'gallery',
    project_slug: 'all-projects',

    category: 'gallery',
    title: 'Gallery',

    file_url: '/images/toolkit/ona-tower.png',

    preview_image_url:
      '/images/toolkit/ona-tower.png',

    media_type: 'image',

    file_name: 'oniria-gallery.png',

    is_public: true,
    is_downloadable: true,

    sort_order: 10,
  },

  /*
   * 02 — LOGO
   * TYPE B
   *
   * Cover:
   * Abstract ocean image
   *
   * File:
   * ONIRIA logo on Google Drive
   */
  {
    id: 'logo',
    project_slug: 'all-projects',

    category: 'logo',
    title: 'Logo',

    file_url:
      'https://drive.google.com/file/d/1SfgaphlnuV2_AiGKmEFeLgagevCnrZFy/view?usp=drive_link',

    preview_image_url:
      '/images/toolkit/oniria-logo-white.png',

    media_type: 'image',

    file_name: 'oniria-logo',

    is_public: true,
    is_downloadable: true,

    sort_order: 20,
  },

  /*
   * 03 — PROJECT BRIEFING
   * TYPE A
   *
   * Cover:
   * Real ONA project image
   *
   * File:
   * ONA project brief on Google Drive
   */
  {
    id: 'project-brief',
    project_slug: 'all-projects',

    category: 'project_brief',
    title: 'Project Briefing',

    file_url:
      'https://drive.google.com/file/d/1ui8jUIKPY4Id02s1HwdJMyCiXAZqjDVH/view?usp=drive_link',

    preview_image_url:
      '/images/toolkit/ona-hall.png',

    media_type: 'pdf',

    file_name: 'ona-project-brief',

    is_public: true,
    is_downloadable: true,

    sort_order: 30,
  },

  /*
   * 04 — BROCHURE
   * TYPE B
   *
   * Cover:
   * Abstract palm shadow
   *
   * File:
   * Brochure on Google Drive
   */
  {
    id: 'brochure',
    project_slug: 'all-projects',

    category: 'brochure',
    title: 'Brochure',

    file_url:
      'https://drive.google.com/file/d/1F8DXhXfyCcmNbWkzAt89qDNImnl-tGV9/view?usp=drive_link',

    preview_image_url:
      '/images/toolkit/abstract/palm-shadow.png',

    media_type: 'pdf',

    file_name: 'oniria-brochure',

    is_public: true,
    is_downloadable: true,

    sort_order: 40,
  },

  /*
   * 05 — FLOOR PLANS
   * TYPE A
   *
   * Cover:
   * Project interior
   *
   * File:
   * Floor plans on Google Drive
   */
  {
    id: 'floor-plans',
    project_slug: 'all-projects',

    category: 'floor_plans',
    title: 'Floor Plans',

    file_url:
      'https://drive.google.com/file/d/1HJ9DzHvzuFHAqK4AuMmsSBGEZWeVemJc/view?usp=drive_link',

    preview_image_url:
      '/images/toolkit/ona-living-room.png',

    media_type: 'pdf',

    file_name: 'floor-plans',

    is_public: true,
    is_downloadable: true,

    sort_order: 50,
  },

  /*
   * 06 — PROJECT FILM
   * TYPE B
   *
   * You have not provided the real project-film link yet.
   * Therefore only the abstract cover is shown for now.
   *
   * Download is disabled until the real video URL is available.
   */
  {
    id: 'project-film',
    project_slug: 'all-projects',

    category: 'project_film',
    title: 'Project Film',

    file_url:
      '/images/toolkit/abstract/sand-texture.png',

    preview_image_url:
      '/images/toolkit/abstract/sand-texture.png',

    media_type: 'image',

    file_name: 'project-film-preview.png',

    is_public: true,
    is_downloadable: false,

    sort_order: 60,
  },

  /*
   * 07 — PAYMENT PLAN
   * TYPE A
   *
   * Cover:
   * Project / hospitality image
   *
   * File:
   * Payment Plan on Google Drive
   */
  {
    id: 'payment-plan',
    project_slug: 'all-projects',

    category: 'payment_plan',
    title: 'Payment Plan',

    file_url:
      'https://drive.google.com/file/d/1I-CaLr1B-MZ90gssZz3S1WbNk5XBrkqn/view?usp=drive_link',

    preview_image_url:
      '/images/toolkit/ona-coffee.png',

    media_type: 'pdf',

    file_name: 'payment-plan',

    is_public: true,
    is_downloadable: true,

    sort_order: 70,
  },

  /*
   * 08 — MATERIAL BOARDS
   * TYPE B
   *
   * You have not supplied the real material-board document yet.
   *
   * Cover:
   * Abstract stone/light image
   */
  {
    id: 'material-boards',
    project_slug: 'all-projects',

    category: 'material_boards',
    title: 'Material Boards',

    file_url:
      '/images/toolkit/abstract/ocean-wave.png',

    preview_image_url:
      '/images/toolkit/abstract/ocean-wave.png',

    media_type: 'image',

    file_name: 'material-boards-preview.png',

    is_public: true,
    is_downloadable: false,

    sort_order: 80,
  },

  /*
   * 09 — MASTERPLAN
   * TYPE A
   *
   * Cover:
   * Destination / project image
   *
   * File:
   * Masterplan on Google Drive
   */
  {
    id: 'masterplan',
    project_slug: 'all-projects',

    category: 'masterplan',
    title: 'Masterplan',

    file_url:
      'https://drive.google.com/file/d/14VMJrUFeMluAMQCpeTSdBFos0hEBxkrF/view?usp=drive_link',

    preview_image_url:
      '/images/toolkit/coastal-residence.png',

    media_type: 'pdf',

    file_name: 'masterplan',

    is_public: true,
    is_downloadable: true,

    sort_order: 90,
  },
];
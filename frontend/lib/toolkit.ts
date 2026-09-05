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

  /**
   * IMPORTANT:
   *
   * `all-projects` is the existing slug used by this project for
   * ONIRIA Investments.
   *
   * It must be treated as a real project slug.
   *
   * It must NOT mean:
   * - every project
   * - all toolkit records
   * - global assets
   *
   * This keeps ONIRIA Investments independent from ONA Towers and ROHO.
   */
  project_slug: string;

  category: ToolkitCategory;

  title: string;

  description?: string | null;

  /**
   * The REAL file/document URL.
   *
   * For Google Drive assets:
   * - Eye/Open action opens this URL
   * - Download action may convert this URL to a direct-download URL
   */
  file_url: string;

  /**
   * Image displayed on the carousel card.
   *
   * This can be completely different from file_url.
   *
   * Example:
   *
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

/**
 * Existing ONIRIA Investments project slug.
 *
 * We keep the existing value so current working records are not broken.
 *
 * IMPORTANT:
 * This is an ONIRIA Investments project identifier.
 * It must never be interpreted as "show every project's records".
 */
export const ONIRIA_INVESTMENTS_TOOLKIT_SLUG = 'all-projects';

/**
 * Shared project list.
 *
 * Both the public Toolkit and Admin use this same list.
 */
export const toolkitProjects: ToolkitProject[] = [
  {
    slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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
    slogan: 'The Art of Living',
  },
];

export const toolkitCategoryDefaultCover: Record<
  ToolkitCategory,
  string
> = {
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

/**
 * Build a stable identity for one Toolkit asset.
 *
 * Project + category are intentionally included together.
 *
 * Examples:
 *
 * all-projects:gallery
 * ona-towers:gallery
 * roho:gallery
 *
 * Those are three completely different records.
 */
export function getToolkitAssetKey(
  asset: Pick<ToolkitAsset, 'project_slug' | 'category'>,
): string {
  return `${asset.project_slug}:${asset.category}`;
}

/**
 * Return one project's assets only.
 *
 * IMPORTANT:
 *
 * There is intentionally NO special case for "all-projects".
 *
 * In this application "all-projects" is the legacy/current slug for the
 * ONIRIA Investments project itself.
 */
export function getToolkitAssetsForProject(
  assets: ToolkitAsset[],
  projectSlug: string,
): ToolkitAsset[] {
  return assets
    .filter(
      (asset) =>
        asset.project_slug === projectSlug &&
        asset.is_public,
    )
    .sort((a, b) => {
      if (a.sort_order !== b.sort_order) {
        return a.sort_order - b.sort_order;
      }

      return a.title.localeCompare(b.title);
    });
}

/**
 * Merge database/API Toolkit assets with the built-in ONIRIA assets.
 *
 * This is the important fix for the disappearing ONIRIA content.
 *
 * OLD dangerous behaviour usually looks like:
 *
 * apiAssets.length
 *   ? apiAssets
 *   : fallbackToolkitAssets
 *
 * That means as soon as ONE database asset exists for ONA Towers,
 * all fallback ONIRIA Investments assets disappear.
 *
 * NEW behaviour:
 *
 * - Preserve every fallback ONIRIA item.
 * - Replace only the SAME project + SAME category if the API contains it.
 * - Add ONA items separately.
 * - Add ROHO items separately.
 *
 * Example:
 *
 * fallback:
 *   ONIRIA + Gallery
 *   ONIRIA + Brochure
 *
 * API:
 *   ONA + Gallery
 *
 * result:
 *   ONIRIA + Gallery
 *   ONIRIA + Brochure
 *   ONA + Gallery
 */
export function mergeToolkitAssets(
  apiAssets: ToolkitAsset[] = [],
): ToolkitAsset[] {
  const apiByKey = new Map<string, ToolkitAsset>();

  for (const asset of apiAssets) {
    apiByKey.set(getToolkitAssetKey(asset), asset);
  }

  const fallbackKeys = new Set(
    fallbackToolkitAssets.map((asset) => getToolkitAssetKey(asset)),
  );

  /**
   * Start with every fallback item.
   *
   * If the API contains exactly the same project + category,
   * the API version overrides that ONE fallback item only.
   */
  const merged: ToolkitAsset[] = fallbackToolkitAssets.map(
    (fallbackAsset) => {
      const matchingApiAsset = apiByKey.get(
        getToolkitAssetKey(fallbackAsset),
      );

      return matchingApiAsset ?? fallbackAsset;
    },
  );

  /**
   * Add API items which do not correspond to a fallback item.
   *
   * This is where ONA Towers and ROHO records are added without
   * touching ONIRIA Investments.
   */
  for (const apiAsset of apiAssets) {
    const key = getToolkitAssetKey(apiAsset);

    if (!fallbackKeys.has(key)) {
      merged.push(apiAsset);
    }
  }

  return merged.sort((a, b) => {
    const projectA = toolkitProjects.findIndex(
      (project) => project.slug === a.project_slug,
    );

    const projectB = toolkitProjects.findIndex(
      (project) => project.slug === b.project_slug,
    );

    const safeProjectA =
      projectA === -1 ? Number.MAX_SAFE_INTEGER : projectA;

    const safeProjectB =
      projectB === -1 ? Number.MAX_SAFE_INTEGER : projectB;

    if (safeProjectA !== safeProjectB) {
      return safeProjectA - safeProjectB;
    }

    if (a.sort_order !== b.sort_order) {
      return a.sort_order - b.sort_order;
    }

    return a.title.localeCompare(b.title);
  });
}

export function normalizeToolkitLink(value: string): string {
  const trimmed = value.trim();

  if (!trimmed) {
    throw new Error('Enter the asset link.');
  }

  /**
   * Local application asset.
   */
  if (
    trimmed.startsWith('/') &&
    !trimmed.startsWith('//')
  ) {
    return trimmed;
  }

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
    throw new Error(
      'Toolkit links must use HTTP or HTTPS.',
    );
  }

  return url.toString();
}

export function inferToolkitMediaType(
  rawUrl: string,
  category: ToolkitCategory,
): ToolkitAsset['media_type'] {
  const url = rawUrl
    .toLowerCase()
    .split(/[?#]/)[0];

  if (/\.(png|jpe?g|webp|avif|gif|svg)$/.test(url)) {
    return 'image';
  }

  if (/\.pdf$/.test(url)) {
    return 'pdf';
  }

  if (/\.(mp4|webm|mov|m4v)$/.test(url)) {
    return 'video';
  }

  if (category === 'project_film') {
    return 'video';
  }

  if (pdfCategories.has(category)) {
    return 'pdf';
  }

  if (imageCategories.has(category)) {
    return 'image';
  }

  return 'document';
}

/**
 * ----------------------------------------------------------
 * FALLBACK TOOLKIT ASSETS
 * ----------------------------------------------------------
 *
 * These are ONIRIA Investments defaults.
 *
 * They remain available even when ONA Towers or ROHO receives
 * database/API Toolkit records.
 *
 * Database records replace a fallback only when BOTH:
 *
 * project_slug matches
 * AND
 * category matches
 */
export const fallbackToolkitAssets: ToolkitAsset[] = [
  /**
   * 01 — GALLERY
   */
  {
    id: 'fallback-oniria-gallery',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
    category: 'gallery',
    title: 'Gallery',
    file_url: '/images/toolkit/ona-tower.png',
    preview_image_url: '/images/toolkit/ona-tower.png',
    media_type: 'image',
    file_name: 'oniria-gallery.png',
    is_public: true,
    is_downloadable: true,
    sort_order: 10,
  },

  /**
   * 02 — LOGO
   */
  {
    id: 'fallback-oniria-logo',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 03 — PROJECT BRIEFING
   */
  {
    id: 'fallback-oniria-project-brief',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 04 — BROCHURE
   */
  {
    id: 'fallback-oniria-brochure',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 05 — FLOOR PLANS
   */
  {
    id: 'fallback-oniria-floor-plans',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 06 — PROJECT FILM
   *
   * Real film URL has not been supplied yet.
   */
  {
    id: 'fallback-oniria-project-film',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 07 — PAYMENT PLAN
   */
  {
    id: 'fallback-oniria-payment-plan',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 08 — MATERIAL BOARDS
   *
   * Real material-board document has not been supplied yet.
   */
  {
    id: 'fallback-oniria-material-boards',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

  /**
   * 09 — MASTERPLAN
   */
  {
    id: 'fallback-oniria-masterplan',
    project_slug: ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
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

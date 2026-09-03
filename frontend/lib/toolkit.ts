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
  file_url: string;
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
  slogan?: string;
};

export const toolkitProjects: ToolkitProject[] = [
  { slug: 'all-projects', name: 'Oniria Investments', slogan: 'Project media library' },
  { slug: 'ona-towers', name: 'Ona Towers', slogan: 'Ishi juu, ona zaidi' },
  { slug: 'roho', name: 'Roho', slogan: 'The Art of Living' },
];

// Initial ONIRIA Investments overview assets. Project-specific selections are
// intentionally empty until an admin publishes material for that project.
export const fallbackToolkitAssets: ToolkitAsset[] = [
  {
    id: 'gallery', project_slug: 'all-projects', category: 'gallery', title: 'Gallery',
    description: 'Signature spaces and destination moments.',
    file_url: '/images/toolkit/coastal-residence.png', preview_image_url: '/images/toolkit/coastal-residence.png',
    media_type: 'image', file_name: 'oniria-project-gallery.png', is_public: true, is_downloadable: true, sort_order: 10,
  },
  {
    id: 'logo', project_slug: 'all-projects', category: 'logo', title: 'Logo',
    description: 'Official ONIRIA brand assets.',
    file_url: '/images/toolkit/oniria-logo-navy.png', preview_image_url: '/images/toolkit/oniria-logo-white.png',
    media_type: 'image', file_name: 'oniria-investments-logo.png', is_public: true, is_downloadable: true, sort_order: 20,
  },
  {
    id: 'project-brief', project_slug: 'all-projects', category: 'project_brief', title: 'Project Briefing',
    description: 'The vision behind each destination.',
    file_url: '/images/toolkit/ona-hall.png', preview_image_url: '/images/toolkit/ona-hall.png',
    media_type: 'image', file_name: 'oniria-project-briefing.png', is_public: true, is_downloadable: true, sort_order: 30,
  },
  {
    id: 'brochure', project_slug: 'all-projects', category: 'brochure', title: 'Brochure',
    description: 'Discover the ONIRIA lifestyle.',
    file_url: '/images/toolkit/ona-coffee.png', preview_image_url: '/images/toolkit/ona-coffee.png',
    media_type: 'image', file_name: 'oniria-brochure-preview.png', is_public: true, is_downloadable: true, sort_order: 40,
  },
  {
    id: 'floor-plans', project_slug: 'all-projects', category: 'floor_plans', title: 'Floor Plans',
    description: 'Thoughtfully designed living spaces.',
    file_url: '/images/toolkit/ona-living-room.png', preview_image_url: '/images/toolkit/ona-living-room.png',
    media_type: 'image', file_name: 'oniria-floor-plan-preview.png', is_public: true, is_downloadable: true, sort_order: 50,
  },
  {
    id: 'project-film', project_slug: 'all-projects', category: 'project_film', title: 'Project Film',
    description: 'Experience the destination in motion.',
    file_url: '/images/toolkit/villa-residence.png', preview_image_url: '/images/toolkit/villa-residence.png',
    media_type: 'image', file_name: 'oniria-project-film-preview.png', is_public: true, is_downloadable: true, sort_order: 60,
  },
  {
    id: 'payment-plan', project_slug: 'all-projects', category: 'payment_plan', title: 'Payment Plan',
    description: 'Flexible paths to ownership.',
    file_url: '/images/toolkit/ona-tower.png', preview_image_url: '/images/toolkit/ona-tower.png',
    media_type: 'image', file_name: 'oniria-payment-plan-preview.png', is_public: true, is_downloadable: true, sort_order: 70,
  },
  {
    id: 'material-boards', project_slug: 'all-projects', category: 'material_boards', title: 'Material Boards',
    description: 'Textures, finishes and interior character.',
    file_url: '/images/toolkit/stone-town-restaurant.png', preview_image_url: '/images/toolkit/stone-town-restaurant.png',
    media_type: 'image', file_name: 'oniria-material-board.png', is_public: true, is_downloadable: true, sort_order: 80,
  },
  {
    id: 'masterplan', project_slug: 'all-projects', category: 'masterplan', title: 'Masterplan',
    description: 'The vision at destination scale.',
    file_url: '/images/toolkit/coastal-residence.png', preview_image_url: '/images/toolkit/coastal-residence.png',
    media_type: 'image', file_name: 'oniria-masterplan-preview.png', is_public: true, is_downloadable: true, sort_order: 90,
  },
];

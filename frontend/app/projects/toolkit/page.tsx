import ToolkitCarousel from '@/components/toolkit/ToolkitCarousel';
import type { ToolkitAsset } from '@/lib/toolkit';
import { fallbackToolkitAssets } from '@/lib/toolkit';
import { PUBLIC_API_BASE } from '@/lib/api';

export const metadata = {
  title: 'Project Toolkit | ONIRIA Investments',
  description: 'Official ONIRIA Investments project media, brand assets, brochures, plans and presentation material.',
};

// Toolkit publication changes should be visible as soon as the visitor refreshes
// after an admin publishes, hides, edits or removes an item.
export const dynamic = 'force-dynamic';

async function loadToolkit(): Promise<ToolkitAsset[]> {
  try {
    const response = await fetch(`${PUBLIC_API_BASE}/toolkit-assets?page_size=100`, { cache: 'no-store' });
    if (!response.ok) return fallbackToolkitAssets;
    const data = await response.json();
    return Array.isArray(data?.items) && data.items.length ? data.items : fallbackToolkitAssets;
  } catch {
    return fallbackToolkitAssets;
  }
}

export default async function ToolkitPage() {
  const assets = await loadToolkit();
  return <main className="toolkitPage"><ToolkitCarousel initialAssets={assets} /></main>;
}

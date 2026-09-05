import ToolkitCarousel from '@/components/toolkit/ToolkitCarousel';
import type { ToolkitAsset } from '@/lib/toolkit';
import { fallbackToolkitAssets } from '@/lib/toolkit';
import { getToolkitAssets } from '@/lib/api';

export const metadata = {
  title: 'Toolkit | ONIRIA Investments',
  description:
    'Official ONIRIA Investments project media, brand assets, brochures, plans and presentation material.',
};

// Toolkit publication changes should be visible as soon as a visitor refreshes
// after an admin publishes, hides, edits or removes an item.
export const dynamic = 'force-dynamic';

async function loadToolkit(): Promise<ToolkitAsset[]> {
  try {
    const data = await getToolkitAssets();
    return Array.isArray(data?.items) && data.items.length
      ? data.items
      : fallbackToolkitAssets;
  } catch {
    return fallbackToolkitAssets;
  }
}

export default async function ToolkitPage() {
  const assets = await loadToolkit();

  return (
    <main className="toolkitPage">
      <ToolkitCarousel initialAssets={assets} />
    </main>
  );
}

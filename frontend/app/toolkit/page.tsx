import ToolkitCarousel from '@/components/toolkit/ToolkitCarousel';
import type { ToolkitAsset } from '@/lib/toolkit';
import { fallbackToolkitAssets } from '@/lib/toolkit';
import { PUBLIC_API_BASE } from '@/lib/api';

export const metadata = {
  title: 'Toolkit | ONIRIA Investments',
  description:
    'Official ONIRIA Investments project media, brand assets, brochures, plans and presentation material.',
};

// Toolkit publication changes should be visible as soon as a visitor refreshes
// after an admin publishes, hides, edits or removes an item.
export const dynamic = 'force-dynamic';

async function loadToolkit(): Promise<ToolkitAsset[]> {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 4_000);

  try {
    const response = await fetch(
      `${PUBLIC_API_BASE}/toolkit-assets?page_size=100`,
      {
        cache: 'no-store',
        signal: controller.signal,
      },
    );

    if (!response.ok) return fallbackToolkitAssets;

    const data = await response.json();

    return Array.isArray(data?.items) && data.items.length
      ? data.items
      : fallbackToolkitAssets;
  } catch {
    return fallbackToolkitAssets;
  } finally {
    clearTimeout(timeout);
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

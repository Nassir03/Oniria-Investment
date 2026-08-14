'use client';

import { useEffect, useState } from 'react';
import { AdminFrame } from '@/components/AdminData';
import { getSiteSettings } from '@/lib/api';

function friendlyLabel(key:string) {
  return key.replace(/[_-]/g,' ').replace(/\b\w/g,(letter)=>letter.toUpperCase());
}

function friendlyValue(value:unknown) {
  if (typeof value === 'boolean') return value ? 'Enabled' : 'Disabled';
  if (typeof value === 'string' || typeof value === 'number') return String(value);
  if (Array.isArray(value)) return value.join(' · ');
  if (value && typeof value === 'object') return Object.entries(value as Record<string,unknown>).map(([key,item])=>`${friendlyLabel(key)}: ${String(item)}`).join(' · ');
  return '—';
}

export default function Page() {
  const [settings, setSettings] = useState<Record<string, unknown> | null>(null);
  const [error, setError] = useState('');
  useEffect(() => { getSiteSettings().then(setSettings).catch((err)=>setError(err instanceof Error ? err.message : 'Unable to load preferences')); }, []);
  const entries = Object.entries(settings || {});
  return <AdminFrame title="Preferences" kicker="Website preferences">
    <section className="adminWelcomeStrip adminWelcomePremium compact">
      <div><p className="eyebrow">Shared information</p><h2>A simple view of the details used across the ONIRIA website.</h2></div>
      <p>Review contact details, website preferences and shared information in one place so the public experience stays consistent.</p>
    </section>
    {error && <div className="adminNotice error">{error}</div>}
    <div className="adminSettingsGrid adminSettingsGridPremium">{entries.length ? entries.map(([key,value])=><article key={key}><span>{friendlyLabel(key)}</span><strong>{friendlyValue(value)}</strong></article>) : <div className="adminNotice">No shared preferences are available yet.</div>}</div>
  </AdminFrame>;
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/api';

export type StaffProfile = { id: string; email?: string | null; full_name?: string | null; roles: string[] };

export function useAdminSession() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      if (!supabase) {
        setError('Supabase is not configured for staff authentication.');
        setLoading(false);
        return;
      }
      const { data } = await supabase.auth.getSession();
      const accessToken = data.session?.access_token;
      if (!accessToken) {
        router.replace('/admin/login');
        return;
      }
      setToken(accessToken);
      try {
        setProfile(await authFetch<StaffProfile>('/admin/me', accessToken));
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Unable to verify staff account.');
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  return { token, profile, loading, error };
}

const baseNav = [
  ['/admin', 'Overview'],
  ['/admin/news', 'Newsroom'],
  ['/admin/leads', 'Leads'],
  ['/admin/projects', 'Projects'],
];

export function AdminFrame({ title, kicker = 'Management portal', children }: { title: string; kicker?: string; children?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { profile, loading, error } = useAdminSession();

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (loading) return <main className="adminStandalone"><div className="adminLoading"><span className="adminPulse"/>Verifying staff access…</div></main>;
  if (error) return <main className="adminStandalone"><div className="adminErrorPanel"><p className="eyebrow gold">Staff access</p><h1>Unable to open the management portal.</h1><p>{error}</p><Link className="button buttonNavy" href="/admin/login">Return to sign in <span>→</span></Link></div></main>;

  const nav = profile?.roles?.includes('admin') ? [...baseNav, ['/admin/staff', 'Team access']] : baseNav;

  return <main className="adminStandalone">
    <div className="adminLayout">
      <aside className="adminSidebar">
        <Link href="/admin" className="adminBrandLockup" aria-label="ONIRIA administration home">
          <img src="/oniria-admin-mark.png" alt="" />
          <span><strong>ONIRIA</strong><small>ADMINISTRATION</small></span>
        </Link>
        <div className="adminUser"><span>{profile?.full_name || 'ONIRIA Staff'}</span><small>{profile?.roles?.join(' · ') || 'Staff'}</small></div>
        <nav>{nav.map(([href,label], index)=><Link key={href} href={href} className={path === href ? 'active' : ''}><span>{String(index + 1).padStart(2,'0')}</span>{label}</Link>)}</nav>
        <div className="adminSidebarBottom"><div className="adminSecureNote"><span>Private workspace</span><small>Supabase Auth · PostgreSQL roles</small></div><button onClick={signOut}>Sign out <span>→</span></button></div>
      </aside>
      <section className="adminMain">
        <header className="adminTopbar"><div><p className="eyebrow">{kicker}</p><h1>{title}</h1></div><div className="adminTopMeta"><span>Secure staff area</span><b>●</b></div></header>
        <div className="adminContent">{children}</div>
      </section>
    </div>
  </main>;
}

export function useProtectedData<T>(endpoint: string) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    void (async () => {
      if (!supabase) { setError('Supabase is not configured.'); setLoading(false); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setError('Your staff session has expired.'); setLoading(false); return; }
      try { setData(await authFetch<T>(endpoint, token)); }
      catch (err) { setError(err instanceof Error ? err.message : 'Request failed'); }
      finally { setLoading(false); }
    })();
  }, [endpoint]);

  return { data, error, loading };
}

export function AdminState({ loading, error, empty }: { loading?: boolean; error?: string; empty?: string }) {
  if (loading) return <div className="adminNotice">Loading secure data…</div>;
  if (error) return <div className="adminNotice error">{error}</div>;
  if (empty) return <div className="adminNotice">{empty}</div>;
  return null;
}

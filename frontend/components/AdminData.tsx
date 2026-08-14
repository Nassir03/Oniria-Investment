'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/api';

export type StaffProfile = { id: string; email?: string | null; full_name?: string | null; roles: string[] };

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Editor',
  content_manager: 'Content manager',
  sales: 'Sales',
};

export function readableRoles(roles?: string[]) {
  return (roles || []).map((role) => roleLabels[role] || role).join(' · ');
}

export function useAdminSession() {
  const router = useRouter();
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<StaffProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    void (async () => {
      if (!supabase) {
        setError('Staff sign-in is not available yet. Please contact the administrator.');
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
        setError(err instanceof Error ? err.message : 'Unable to verify your staff access.');
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
  ['/admin/leads', 'Enquiries'],
  ['/admin/projects', 'Projects'],
  ['/admin/settings', 'Preferences'],
];

export function AdminFrame({ title, kicker = 'Staff workspace', children }: { title: string; kicker?: string; children?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { profile, loading, error } = useAdminSession();

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  if (loading) return <main className="adminStandalone"><div className="adminLoading"><span className="adminPulse"/>Preparing your workspace…</div></main>;
  if (error) return <main className="adminStandalone"><div className="adminErrorPanel"><p className="eyebrow gold">Staff access</p><h1>We could not open your workspace.</h1><p>{error}</p><Link className="button buttonNavy" href="/admin/login">Return to sign in <span>→</span></Link></div></main>;

  const nav = profile?.roles?.includes('admin') ? [...baseNav, ['/admin/staff', 'Team']] : baseNav;

  return <main className="adminStandalone">
    <div className="adminLayout adminLayoutPremium">
      <aside className="adminSidebar adminSidebarPremium">
        <Link href="/admin" className="adminBrandLockup" aria-label="ONIRIA administration home">
          <img src="/oniria-admin-mark.png" alt="" />
          <span><strong>ONIRIA</strong><small>ADMINISTRATION</small></span>
        </Link>
        <div className="adminUser"><span>{profile?.full_name || 'ONIRIA Staff'}</span><small>{readableRoles(profile?.roles) || 'Staff member'}</small></div>
        <nav>{nav.map(([href,label], index)=><Link key={href} href={href} className={path === href ? 'active' : ''}><span>{String(index + 1).padStart(2,'0')}</span>{label}</Link>)}</nav>
        <div className="adminSidebarBottom">
          <div className="adminSecureNote"><span>ONIRIA staff workspace</span><small>Private access for authorised team members</small></div>
          <button onClick={signOut}>Sign out <span>→</span></button>
        </div>
      </aside>
      <section className="adminMain">
        <header className="adminTopbar adminTopbarPremium">
          <div><p className="eyebrow">{kicker}</p><h1>{title}</h1></div>
          <div className="adminTopMeta"><span>Welcome, {profile?.full_name?.split(' ')[0] || 'team'}</span><b>●</b></div>
        </header>
        <div className="adminContent adminContentPremium">{children}</div>
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
      if (!supabase) { setError('Staff access is not available.'); setLoading(false); return; }
      const { data: sessionData } = await supabase.auth.getSession();
      const token = sessionData.session?.access_token;
      if (!token) { setError('Your staff session has expired. Please sign in again.'); setLoading(false); return; }
      try { setData(await authFetch<T>(endpoint, token)); }
      catch (err) { setError(err instanceof Error ? err.message : 'Unable to load this information.'); }
      finally { setLoading(false); }
    })();
  }, [endpoint]);

  return { data, error, loading };
}

export function AdminState({ loading, error, empty }: { loading?: boolean; error?: string; empty?: string }) {
  if (loading) return <div className="adminNotice">Loading…</div>;
  if (error) return <div className="adminNotice error">{error}</div>;
  if (empty) return <div className="adminNotice">{empty}</div>;
  return null;
}

'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useMemo, useState, type ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { authFetch } from '@/lib/api';

export type AdminDensity = 'comfortable' | 'compact';
export type AdminSidebarPreference = 'expanded' | 'compact';

export type AdminAppearance = {
  density: AdminDensity;
  reducedMotion: boolean;
  sidebar: AdminSidebarPreference;
};

type AdminAppearanceValue = AdminAppearance & {
  setDensity: (density: AdminDensity) => void;
  setReducedMotion: (reducedMotion: boolean) => void;
  setSidebar: (sidebar: AdminSidebarPreference) => void;
};

const defaultAppearance: AdminAppearance = {
  density: 'comfortable',
  reducedMotion: false,
  sidebar: 'expanded',
};

const storageKeys = {
  density: 'oniria_admin_density',
  reducedMotion: 'oniria_admin_reduced_motion',
  sidebar: 'oniria_admin_sidebar',
};

function readStoredAppearance(): AdminAppearance {
  if (typeof window === 'undefined') return defaultAppearance;
  const density = window.localStorage.getItem(storageKeys.density);
  const reducedMotion = window.localStorage.getItem(storageKeys.reducedMotion);
  const sidebar = window.localStorage.getItem(storageKeys.sidebar);
  return {
    density: density === 'compact' ? 'compact' : 'comfortable',
    reducedMotion: reducedMotion === 'true',
    sidebar: sidebar === 'compact' ? 'compact' : 'expanded',
  };
}

function writeStoredAppearance(appearance: AdminAppearance) {
  window.localStorage.setItem(storageKeys.density, appearance.density);
  window.localStorage.setItem(storageKeys.reducedMotion, String(appearance.reducedMotion));
  window.localStorage.setItem(storageKeys.sidebar, appearance.sidebar);
  window.dispatchEvent(new CustomEvent('oniria:admin-appearance-updated', { detail: appearance }));
}

export function useAdminAppearance(): AdminAppearanceValue {
  const [appearance, setAppearance] = useState<AdminAppearance>(readStoredAppearance);

  useEffect(() => {
    function syncAppearance(event?: Event) {
      const updated = event instanceof CustomEvent ? event.detail as AdminAppearance | undefined : undefined;
      setAppearance(updated || readStoredAppearance());
    }
    window.addEventListener('storage', syncAppearance);
    window.addEventListener('oniria:admin-appearance-updated', syncAppearance);
    return () => {
      window.removeEventListener('storage', syncAppearance);
      window.removeEventListener('oniria:admin-appearance-updated', syncAppearance);
    };
  }, []);

  return useMemo(
    () => ({
      ...appearance,
      setDensity: (density: AdminDensity) => {
        const next = { ...appearance, density };
        writeStoredAppearance(next);
        setAppearance(next);
      },
      setReducedMotion: (reducedMotion: boolean) => {
        const next = { ...appearance, reducedMotion };
        writeStoredAppearance(next);
        setAppearance(next);
      },
      setSidebar: (sidebar: AdminSidebarPreference) => {
        const next = { ...appearance, sidebar };
        writeStoredAppearance(next);
        setAppearance(next);
      },
    }),
    [appearance]
  );
}

export type StaffProfile = {
  id: string;
  email?: string | null;
  full_name?: string | null;
  phone?: string | null;
  job_title?: string | null;
  department?: string | null;
  preferred_contact_method?: string | null;
  avatar_url?: string | null;
  notification_preferences?: Record<string, unknown>;
  roles: string[];
};

type AdminNotification = {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string | null;
  is_read: boolean;
  created_at: string;
};

type AdminNotificationList = {
  items: AdminNotification[];
  unread_count: number;
};

const roleLabels: Record<string, string> = {
  admin: 'Administrator',
  editor: 'Editor',
  content_manager: 'Content manager',
  sales: 'Sales',
};

export function readableRoles(roles?: string[]) {
  return (roles || []).map((role) => roleLabels[role] || role).join(' · ');
}

function staffInitials(profile?: StaffProfile | null) {
  const source = profile?.full_name || profile?.email || 'ONIRIA Staff';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
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

  useEffect(() => {
    function onProfileUpdate(event: Event) {
      const updated = (event as CustomEvent<StaffProfile>).detail;
      if (updated?.id) setProfile(updated);
    }
    window.addEventListener('oniria:staff-profile-updated', onProfileUpdate);
    return () => window.removeEventListener('oniria:staff-profile-updated', onProfileUpdate);
  }, []);

  return { token, profile, loading, error };
}

const baseNav = [
  ['/admin', 'Overview'],
  ['/admin/news', 'Newsroom'],
  ['/admin/leads', 'Enquiries'],
  ['/admin/projects', 'Projects'],
  ['/admin/settings', 'Settings'],
];

export function AdminFrame({ title, kicker = 'Staff workspace', children }: { title: string; kicker?: string; children?: ReactNode }) {
  const path = usePathname();
  const router = useRouter();
  const { token, profile, loading, error } = useAdminSession();
  const appearance = useAdminAppearance();
  const [notifications, setNotifications] = useState<AdminNotificationList>({ items: [], unread_count: 0 });
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  async function signOut() {
    if (supabase) await supabase.auth.signOut();
    router.replace('/admin/login');
  }

  async function refreshNotifications() {
    if (!token) return;
    try {
      setNotifications(await authFetch<AdminNotificationList>('/admin/notifications', token));
    } catch {
      setNotifications({ items: [], unread_count: 0 });
    }
  }

  async function markNotificationRead(id: string) {
    if (!token) return;
    await authFetch(`/admin/notifications/${id}/read`, token, { method: 'PATCH' });
    await refreshNotifications();
  }

  async function markAllNotificationsRead() {
    if (!token) return;
    await authFetch('/admin/notifications/read-all', token, { method: 'PATCH' });
    await refreshNotifications();
  }

  useEffect(() => {
    if (!token) return;
    void refreshNotifications();
    const timer = window.setInterval(() => void refreshNotifications(), 60000);
    return () => window.clearInterval(timer);
  }, [token]);

  if (loading) return <main className="adminStandalone"><div className="adminLoading"><span className="adminPulse"/>Preparing your workspace…</div></main>;
  if (error) return <main className="adminStandalone"><div className="adminErrorPanel"><p className="eyebrow gold">Staff access</p><h1>We could not open your workspace.</h1><p>{error}</p><Link className="button buttonNavy" href="/admin/login">Return to sign in <span>→</span></Link></div></main>;

  const nav = profile?.roles?.includes('admin') ? [...baseNav.slice(0, 4), ['/admin/staff', 'Team'], baseNav[4]] : baseNav;

  return <main className="adminStandalone">
    <div
      className="adminLayout adminLayoutPremium"
      data-density={appearance.density}
      data-reduced-motion={appearance.reducedMotion ? 'true' : 'false'}
      data-sidebar={appearance.sidebar}
      suppressHydrationWarning
    >
      <aside className="adminSidebar adminSidebarPremium">
        <Link href="/admin" className="adminBrandLockup" aria-label="ONIRIA administration home">
          <img src="/oniria-admin-mark.png" alt="" />
          <span><strong>ONIRIA</strong><small>ADMINISTRATION</small></span>
        </Link>
        <nav>{nav.map(([href,label], index)=><Link key={href} href={href} title={label} aria-label={label} className={path === href ? 'active' : ''}><span>{String(index + 1).padStart(2,'0')}</span>{label}</Link>)}</nav>
        <div className="adminSidebarBottom">
          <Link href="/admin/settings?section=profile" className="adminUser adminUserProfileLink" aria-label="Open your profile settings">
            <span className="adminSidebarAvatar">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt="" onError={(event)=>{event.currentTarget.style.display='none';}} /> : null}
              <b>{staffInitials(profile)}</b>
            </span>
            <span className="adminSidebarUserText">
              <strong>{profile?.full_name || 'ONIRIA Staff'}</strong>
              <small>{readableRoles(profile?.roles) || 'Staff member'}</small>
              <em><i aria-hidden="true" /> Active</em>
            </span>
          </Link>
          <button onClick={signOut} aria-label="Sign out">Sign out <span>→</span></button>
        </div>
      </aside>
      <section className="adminMain">
        <header className="adminTopbar adminTopbarPremium">
          <div><p className="eyebrow">{kicker}</p><h1>{title}</h1></div>
          <div className="adminTopMeta">
            <span>Welcome, {profile?.full_name?.split(' ')[0] || 'team'}</span>
            <div className="adminNotifications">
              <button
                aria-label="Open notifications"
                aria-expanded={notificationsOpen}
                onClick={() => setNotificationsOpen((value) => !value)}
              >
                <span aria-hidden="true">Alerts</span>
                {notifications.unread_count ? <b>{notifications.unread_count}</b> : null}
              </button>
              {notificationsOpen ? (
                <div className="adminNotificationsPanel">
                  <div>
                    <strong>Notifications</strong>
                    {notifications.unread_count ? <button onClick={() => void markAllNotificationsRead()}>Mark all read</button> : null}
                  </div>
                  {notifications.items.length ? notifications.items.map((item) => (
                    <Link
                      key={item.id}
                      href={item.link || '/admin'}
                      className={item.is_read ? '' : 'unread'}
                      onClick={() => {
                        setNotificationsOpen(false);
                        if (!item.is_read) void markNotificationRead(item.id);
                      }}
                    >
                      <strong>{item.title}</strong>
                      <small>{item.message}</small>
                    </Link>
                  )) : <p>No notifications yet.</p>}
                </div>
              ) : null}
            </div>
            <b>●</b>
          </div>
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

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


type AdminSessionSnapshot = {
  token: string | null;
  profile: StaffProfile | null;
  error: string;
  loadedAt: number;
};

let adminSessionCache: AdminSessionSnapshot | null = null;
let adminSessionPromise: Promise<AdminSessionSnapshot> | null = null;
const ADMIN_SESSION_CACHE_MS = 30_000;

function clearAdminSessionCache() {
  adminSessionCache = null;
  adminSessionPromise = null;
}

async function loadAdminSession(force = false): Promise<AdminSessionSnapshot> {
  const now = Date.now();
  if (!force && adminSessionCache && now - adminSessionCache.loadedAt < ADMIN_SESSION_CACHE_MS) {
    return adminSessionCache;
  }
  if (!force && adminSessionPromise) return adminSessionPromise;

  adminSessionPromise = (async () => {
    if (!supabase) {
      return { token: null, profile: null, error: 'Staff sign-in is not available yet. Please contact the administrator.', loadedAt: Date.now() };
    }
    const { data } = await supabase.auth.getSession();
    const accessToken = data.session?.access_token || null;
    if (!accessToken) return { token: null, profile: null, error: '', loadedAt: Date.now() };
    try {
      const profile = await authFetch<StaffProfile>('/admin/me', accessToken);
      return { token: accessToken, profile, error: '', loadedAt: Date.now() };
    } catch (err) {
      return {
        token: accessToken,
        profile: null,
        error: err instanceof Error ? err.message : 'Unable to verify your staff access.',
        loadedAt: Date.now(),
      };
    }
  })();

  try {
    adminSessionCache = await adminSessionPromise;
    return adminSessionCache;
  } finally {
    adminSessionPromise = null;
  }
}

export async function getAdminAccessToken(): Promise<string> {
  if (adminSessionCache?.token) return adminSessionCache.token;
  if (!supabase) throw new Error('Staff sign-in is not available yet. Please contact the administrator.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token || null;
  if (!token) throw new Error('Your staff session has expired. Please sign in again.');
  return token;
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
  const [token, setToken] = useState<string | null>(adminSessionCache?.token || null);
  const [profile, setProfile] = useState<StaffProfile | null>(adminSessionCache?.profile || null);
  const [loading, setLoading] = useState(!adminSessionCache);
  const [error, setError] = useState(adminSessionCache?.error || '');

  useEffect(() => {
    let active = true;
    void loadAdminSession().then((session) => {
      if (!active) return;
      setToken(session.token);
      setProfile(session.profile);
      setError(session.error);
      setLoading(false);
      if (!session.token) router.replace('/admin/login');
    });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!supabase) return;
    const { data } = supabase.auth.onAuthStateChange((event) => {
      if (event === 'SIGNED_OUT') clearAdminSessionCache();
    });
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    function onProfileUpdate(event: Event) {
      const updated = (event as CustomEvent<StaffProfile>).detail;
      if (updated?.id) {
        setProfile(updated);
        if (adminSessionCache?.token) adminSessionCache = { ...adminSessionCache, profile: updated, loadedAt: Date.now() };
      }
    }
    window.addEventListener('oniria:staff-profile-updated', onProfileUpdate);
    return () => window.removeEventListener('oniria:staff-profile-updated', onProfileUpdate);
  }, []);

  return { token, profile, loading, error };
}

const adminNav = [
  { href: '/admin', label: 'Overview' },
  { href: '/admin/news', label: 'Newsroom', roles: ['admin', 'editor', 'content_manager'] },
  { href: '/admin/leads', label: 'Enquiries', roles: ['admin', 'sales'] },
  { href: '/admin/projects', label: 'Projects' },
  { href: '/admin/toolkit', label: 'Toolkit', roles: ['admin', 'editor', 'content_manager'] },
  { href: '/admin/staff', label: 'Team', roles: ['admin'] },
  { href: '/admin/settings', label: 'Settings' },
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
    clearAdminSessionCache();
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
    const initial = window.setTimeout(() => void refreshNotifications(), 1200);
    const timer = window.setInterval(() => void refreshNotifications(), 60000);
    return () => {
      window.clearTimeout(initial);
      window.clearInterval(timer);
    };
  }, [token]);

  if (loading) return <main className="adminStandalone"><div className="adminLoading"><span className="adminPulse"/>Preparing your workspace…</div></main>;
  if (error) return <main className="adminStandalone"><div className="adminErrorPanel"><p className="eyebrow gold">Staff access</p><h1>We could not open your workspace.</h1><p>{error}</p><Link className="button buttonNavy" href="/admin/login" prefetch={false}>Return to sign in <span>→</span></Link></div></main>;

  const nav = adminNav.filter((item) => !item.roles || item.roles.some((role) => profile?.roles?.includes(role)));

  return <main className="adminStandalone">
    <div
      className="adminLayout adminLayoutPremium"
      data-density={appearance.density}
      data-reduced-motion={appearance.reducedMotion ? 'true' : 'false'}
      data-sidebar={appearance.sidebar}
      suppressHydrationWarning
    >
      <aside className="adminSidebar adminSidebarPremium">
        <Link href="/admin" prefetch={false} className="adminBrandLockup" aria-label="ONIRIA administration home">
          <span className="wordmarkLogo adminBrandWordmark" aria-hidden="true" />
          <small>ADMINISTRATION</small>
        </Link>
        <nav aria-label="Administration sections">{nav.map((item, index)=><Link key={item.href} href={item.href} prefetch={false} title={item.label} aria-label={item.label} className={path === item.href ? 'active' : ''}><span>{String(index + 1).padStart(2,'0')}</span>{item.label}</Link>)}</nav>
        <div className="adminSidebarBottom">
          <Link href="/admin/settings?section=profile" prefetch={false} className="adminUser adminUserProfileLink" aria-label="Open your profile settings">
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
                      prefetch={false}
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
    let active = true;
    void (async () => {
      try {
        const token = await getAdminAccessToken();
        const result = await authFetch<T>(endpoint, token);
        if (active) setData(result);
      }
      catch (err) { if (active) setError(err instanceof Error ? err.message : 'Unable to load this information.'); }
      finally { if (active) setLoading(false); }
    })();
    return () => { active = false; };
  }, [endpoint]);

  return { data, error, loading };
}

export function AdminState({ loading, error, empty }: { loading?: boolean; error?: string; empty?: string }) {
  if (loading) return <div className="adminNotice">Loading…</div>;
  if (error) return <div className="adminNotice error">{error}</div>;
  if (empty) return <div className="adminNotice">{empty}</div>;
  return null;
}

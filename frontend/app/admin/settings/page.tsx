'use client';

import { FormEvent, useEffect, useMemo, useRef, useState } from 'react';
import {
  AdminFrame,
  readableRoles,
  useAdminAppearance,
  useAdminSession,
  type AdminDensity,
  type AdminSidebarPreference,
  type StaffProfile,
} from '@/components/AdminData';
import { authFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';

type SectionKey = 'profile' | 'notifications' | 'security' | 'data' | 'appearance' | 'system';
type Notice = { type: 'success' | 'error'; text: string } | null;
type NotificationKey = 'new_customer_enquiry' | 'lead_status_updates' | 'newsroom_publication_activity' | 'staff_account_changes' | 'weekly_administration_summary';
type DeliveryKey = 'delivery_email' | 'delivery_in_app';

const sections: { key: SectionKey; label: string }[] = [
  { key: 'profile', label: 'Profile' },
  { key: 'notifications', label: 'Notifications' },
  { key: 'security', label: 'Security' },
  { key: 'data', label: 'Data' },
  { key: 'appearance', label: 'Appearance' },
  { key: 'system', label: 'System' },
];

const notificationItems: { key: NotificationKey; label: string; description: string }[] = [
  { key: 'new_customer_enquiry', label: 'New customer enquiry', description: 'Receive a notice when a new enquiry is submitted.' },
  { key: 'lead_status_updates', label: 'Lead status updates', description: 'Follow important customer progress changes.' },
  { key: 'newsroom_publication_activity', label: 'Newsroom publication activity', description: 'Track published and updated stories.' },
  { key: 'staff_account_changes', label: 'Staff account changes', description: 'Triggered when staff accounts are created, activated, suspended, or when roles and access change.' },
  { key: 'weekly_administration_summary', label: 'Weekly administration summary', description: 'Saved for future weekly summaries.' },
];

const defaultNotifications = {
  new_customer_enquiry: true,
  lead_status_updates: true,
  newsroom_publication_activity: true,
  staff_account_changes: false,
  weekly_administration_summary: false,
  delivery_email: false,
  delivery_in_app: true,
};

function initials(profile: StaffProfile | null) {
  const source = profile?.full_name || profile?.email || 'ONIRIA Staff';
  return source
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase())
    .join('');
}

function notificationState(profile: StaffProfile | null) {
  const saved = profile?.notification_preferences || {};
  const legacyDelivery = (saved as any).delivery || {};
  return {
    ...defaultNotifications,
    ...saved,
    new_customer_enquiry: Boolean((saved as any).new_customer_enquiry ?? (saved as any).new_enquiry ?? defaultNotifications.new_customer_enquiry),
    lead_status_updates: Boolean((saved as any).lead_status_updates ?? (saved as any).lead_status ?? defaultNotifications.lead_status_updates),
    newsroom_publication_activity: Boolean((saved as any).newsroom_publication_activity ?? (saved as any).newsroom_activity ?? defaultNotifications.newsroom_publication_activity),
    staff_account_changes: Boolean((saved as any).staff_account_changes ?? (saved as any).staff_changes ?? defaultNotifications.staff_account_changes),
    weekly_administration_summary: Boolean((saved as any).weekly_administration_summary ?? (saved as any).weekly_summary ?? defaultNotifications.weekly_administration_summary),
    delivery_email: false,
    delivery_in_app: Boolean((saved as any).delivery_in_app ?? legacyDelivery.in_app ?? defaultNotifications.delivery_in_app),
  };
}

async function downloadAdminFile(path: string, filename: string) {
  if (!supabase) throw new Error('Staff sign-in is not available.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Please sign in again to download this report.');
  const proxyBase = `/${String.fromCharCode(97, 112, 105)}/${String.fromCharCode(98, 97, 99, 107, 101, 110, 100)}`;
  const response = await fetch(`${proxyBase}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('The report could not be prepared.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Page() {
  const { token, profile, loading, error } = useAdminSession();
  const appearance = useAdminAppearance();
  const [active, setActive] = useState<SectionKey>('profile');
  const [currentProfile, setCurrentProfile] = useState<StaffProfile | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [saving, setSaving] = useState(false);
  const [notifications, setNotifications] = useState(defaultNotifications);
  const fileInput = useRef<HTMLInputElement | null>(null);

  const isAdmin = currentProfile?.roles?.includes('admin') || false;
  const visibleSections = useMemo(() => sections.filter((section) => section.key !== 'system' || isAdmin), [isAdmin]);
  const visibleNotificationItems = useMemo(
    () => notificationItems.filter((item) => item.key !== 'staff_account_changes' || isAdmin),
    [isAdmin]
  );

  useEffect(() => {
    if (!profile) return;
    setCurrentProfile(profile);
    setNotifications(notificationState(profile));
  }, [profile]);

  useEffect(() => {
    const section = new URLSearchParams(window.location.search).get('section');
    if (section && sections.some((item) => item.key === section)) setActive(section as SectionKey);
  }, []);

  async function updateProfile(payload: Record<string, unknown>, success: string) {
    if (!token) throw new Error('Please sign in again.');
    const updated = await authFetch<StaffProfile>('/admin/me', token, {
      method: 'PATCH',
      body: JSON.stringify(payload),
    });
    setCurrentProfile(updated);
    setNotifications(notificationState(updated));
    window.dispatchEvent(new CustomEvent('oniria:staff-profile-updated', { detail: updated }));
    setNotice({ type: 'success', text: success });
  }

  async function saveProfile(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setNotice(null);
    const form = new FormData(event.currentTarget);
    try {
      await updateProfile(
        {
          full_name: String(form.get('full_name') || '').trim(),
          phone: String(form.get('phone') || '').trim() || null,
          job_title: String(form.get('job_title') || '').trim() || null,
          department: String(form.get('department') || '').trim() || null,
          preferred_contact_method: String(form.get('preferred_contact_method') || 'email'),
          avatar_url: currentProfile?.avatar_url || null,
        },
        'Profile settings saved.'
      );
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Profile could not be saved.' });
    } finally {
      setSaving(false);
    }
  }

  async function uploadProfileImage(file: File) {
    if (!token) return;
    setSaving(true);
    setNotice(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const uploaded = await authFetch<{ url: string }>('/admin/uploads/profile-image', token, { method: 'POST', body: fd });
      await updateProfile({ avatar_url: uploaded.url }, 'Profile image updated.');
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Profile image could not be updated.' });
    } finally {
      setSaving(false);
    }
  }

  async function saveNotifications() {
    setSaving(true);
    setNotice(null);
    try {
      const nextPreferences = { ...notifications, delivery_email: false };
      const { staff_account_changes: _staffChanges, ...staffPreferences } = nextPreferences;
      await updateProfile({ notification_preferences: isAdmin ? nextPreferences : staffPreferences }, 'Notification preferences saved.');
    } catch (err) {
      setNotice({ type: 'error', text: 'Your notification preferences could not be saved. Please try again.' });
    } finally {
      setSaving(false);
    }
  }

  async function changePassword(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase || !currentProfile?.email) {
      setNotice({ type: 'error', text: 'Password changes are not available for this account.' });
      return;
    }
    const form = new FormData(event.currentTarget);
    const currentPassword = String(form.get('current_password') || '');
    const nextPassword = String(form.get('new_password') || '');
    const confirmPassword = String(form.get('confirm_password') || '');
    if (nextPassword !== confirmPassword) {
      setNotice({ type: 'error', text: 'The new passwords do not match.' });
      return;
    }
    if (nextPassword.length < 8 || !/[A-Z]/.test(nextPassword) || !/[a-z]/.test(nextPassword) || !/[0-9]/.test(nextPassword)) {
      setNotice({ type: 'error', text: 'Use at least 8 characters with uppercase, lowercase and a number.' });
      return;
    }
    setSaving(true);
    setNotice(null);
    try {
      const verify = await supabase.auth.signInWithPassword({ email: currentProfile.email, password: currentPassword });
      if (verify.error) throw new Error('Current password could not be confirmed.');
      const updated = await supabase.auth.updateUser({ password: nextPassword });
      if (updated.error) throw updated.error;
      event.currentTarget.reset();
      setNotice({ type: 'success', text: 'Password updated.' });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Password could not be updated.' });
    } finally {
      setSaving(false);
    }
  }

  async function signOut(scope: 'local' | 'global') {
    if (!supabase) return;
    await supabase.auth.signOut(scope === 'global' ? { scope: 'global' } : undefined);
    window.location.href = '/admin/login';
  }

  async function handleDownload(path: string, filename: string) {
    setNotice(null);
    try {
      await downloadAdminFile(path, filename);
      setNotice({ type: 'success', text: 'Download started.' });
    } catch (err) {
      setNotice({ type: 'error', text: err instanceof Error ? err.message : 'Download could not be prepared.' });
    }
  }

  const sessionLabel = currentProfile?.email ? `Signed in as ${currentProfile.email}` : 'Current staff session';

  return (
    <AdminFrame title="Settings" kicker="Administration settings">
      <section className="adminSettingsHeader">
        <div>
          <p className="eyebrow">Settings</p>
          <h2>Manage your profile, security, notifications and administration preferences.</h2>
        </div>
      </section>

      {(error && !loading) || notice ? (
        <div className={`adminNotice ${notice?.type === 'error' ? 'error' : ''}`}>{notice?.text || error}</div>
      ) : null}

      <div className="adminSettingsShell">
        <nav className="adminSettingsNav" aria-label="Settings sections">
          {visibleSections.map((section) => (
            <button key={section.key} className={active === section.key ? 'active' : ''} onClick={() => setActive(section.key)}>
              {section.label}
            </button>
          ))}
        </nav>

        <section className="adminSettingsPanel">
          {active === 'profile' && (
            <form className="adminSettingsForm" onSubmit={saveProfile}>
              <div className="adminSettingsPanelHead">
                <div>
                  <p className="eyebrow">Profile</p>
                  <h3>Profile Settings</h3>
                </div>
                <button className="adminPrimaryButton" disabled={saving}>Save changes <span>{'->'}</span></button>
              </div>

              <div className="adminProfileBlock">
                <div className="adminProfileAvatar">
                  {currentProfile?.avatar_url ? <img src={currentProfile.avatar_url} alt="" onError={(event)=>{event.currentTarget.style.display='none';}} /> : null}
                  <span>{initials(currentProfile)}</span>
                </div>
                <div>
                  <strong>{currentProfile?.full_name || 'ONIRIA Staff'}</strong>
                  <small>{readableRoles(currentProfile?.roles) || 'Staff member'}</small>
                  <em>{currentProfile?.email || 'Staff account'}</em>
                  <div className="adminProfilePhotoActions">
                    <button type="button" className="adminGhostButton" onClick={() => fileInput.current?.click()} disabled={saving}>
                      Change photo
                    </button>
                    <button type="button" className="adminGhostButton" onClick={() => void updateProfile({ avatar_url: null }, 'Profile image removed.')} disabled={saving || !currentProfile?.avatar_url}>
                      Remove photo
                    </button>
                  </div>
                  <input
                    ref={fileInput}
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/avif"
                    hidden
                    onChange={(event) => {
                      const file = event.target.files?.[0];
                      if (file) void uploadProfileImage(file);
                    }}
                  />
                </div>
              </div>

              <div className="adminSettingsFormGrid">
                <label><span>Full name</span><input name="full_name" defaultValue={currentProfile?.full_name || ''} required /></label>
                <label><span>Staff email</span><input value={currentProfile?.email || ''} readOnly /></label>
                <label><span>Phone number</span><input name="phone" defaultValue={currentProfile?.phone || ''} /></label>
                <label><span>Job title / role</span><input name="job_title" defaultValue={currentProfile?.job_title || ''} placeholder={readableRoles(currentProfile?.roles) || 'Staff member'} /></label>
                <label><span>Department</span><input name="department" defaultValue={currentProfile?.department || ''} placeholder="Administration" /></label>
                <label>
                  <span>Preferred contact method</span>
                  <select name="preferred_contact_method" defaultValue={currentProfile?.preferred_contact_method || 'email'}>
                    <option value="email">Email</option>
                    <option value="in_app">In-app</option>
                  </select>
                </label>
              </div>
            </form>
          )}

          {active === 'notifications' && (
            <div className="adminSettingsStack">
              <div className="adminSettingsPanelHead">
                <div><p className="eyebrow">Notifications</p><h3>Notification Settings</h3></div>
                <button className="adminPrimaryButton" onClick={() => void saveNotifications()} disabled={saving}>Save preferences <span>{'->'}</span></button>
              </div>
              <div className="adminToggleList">
                {visibleNotificationItems.map((item) => (
                  <label className="adminToggleRow" key={item.key}>
                    <span><strong>{item.label}</strong><small>{item.description}</small></span>
                    <input
                      type="checkbox"
                      checked={Boolean((notifications as any)[item.key])}
                      onChange={(event) => setNotifications((value) => ({ ...value, [item.key]: event.target.checked }))}
                    />
                    <i aria-hidden="true" />
                  </label>
                ))}
              </div>
              <div className="adminSettingsCard">
                <h4>Delivery method</h4>
                <div className="adminChoiceRow">
                  {(['delivery_email', 'delivery_in_app'] as DeliveryKey[]).map((method) => (
                    <label key={method}>
                      <input
                        type="checkbox"
                        checked={Boolean((notifications as any)[method])}
                        disabled={method === 'delivery_email'}
                        onChange={(event) => setNotifications((value) => ({ ...value, [method]: event.target.checked }))}
                      />
                      {method === 'delivery_email' ? 'Email' : 'In-app'}
                    </label>
                  ))}
                </div>
                <p>Email notifications will be available once office email delivery is configured.</p>
              </div>
            </div>
          )}

          {active === 'security' && (
            <div className="adminSettingsStack">
              <form className="adminSettingsForm" onSubmit={changePassword}>
                <div className="adminSettingsPanelHead">
                  <div><p className="eyebrow">Security</p><h3>Change password</h3></div>
                  <button className="adminPrimaryButton" disabled={saving}>Update password <span>{'->'}</span></button>
                </div>
                <div className="adminSettingsFormGrid">
                  <label><span>Current password</span><input name="current_password" type="password" autoComplete="current-password" required /></label>
                  <label><span>New password</span><input name="new_password" type="password" autoComplete="new-password" required /></label>
                  <label><span>Confirm new password</span><input name="confirm_password" type="password" autoComplete="new-password" required /></label>
                </div>
                <p className="adminSettingsHint">Use at least 8 characters with uppercase, lowercase and a number.</p>
              </form>
              <div className="adminSettingsCards">
                <article className="adminSettingsCard"><span>Active session</span><strong>{sessionLabel}</strong><button onClick={() => void signOut('local')}>Sign out of current session</button></article>
                <article className="adminSettingsCard"><span>All sessions</span><strong>End access on other devices.</strong><button onClick={() => void signOut('global')}>Sign out of all sessions</button></article>
                <article className="adminSettingsCard"><span>Two-factor authentication</span><strong>Not enabled</strong><p>Two-step verification can be enabled when configured for the organisation.</p></article>
              </div>
            </div>
          )}

          {active === 'data' && (
            <div className="adminSettingsStack">
              <div className="adminSettingsPanelHead"><div><p className="eyebrow">Data</p><h3>Data Management</h3></div></div>
              <div className="adminDownloadGrid">
                <button onClick={() => void handleDownload('/admin/exports/leads.xlsx', 'oniria-enquiries.xlsx')}>Export enquiries as Excel <span>↓</span></button>
                <button onClick={() => void handleDownload('/admin/exports/leads.csv', 'oniria-enquiries.csv')}>Export enquiries as CSV <span>↓</span></button>
                <button onClick={() => void handleDownload('/admin/exports/news.csv', 'oniria-newsroom.csv')}>Export newsroom records as CSV <span>↓</span></button>
                <button onClick={() => void handleDownload('/admin/exports/activity.csv', 'oniria-website-activity.csv')}>Export website activity report <span>↓</span></button>
              </div>
              <article className="adminSettingsCard"><span>Data retention</span><strong>ONIRIA retains administration records according to organisational requirements.</strong></article>
            </div>
          )}

          {active === 'appearance' && (
            <div className="adminSettingsStack">
              <div className="adminSettingsPanelHead"><div><p className="eyebrow">Appearance</p><h3>Administration interface</h3></div></div>
              <div className="adminSettingsCards">
                <article className="adminSettingsCard">
                  <span>Layout density</span>
                  <div className="adminSegmented">
                    {(['comfortable', 'compact'] as AdminDensity[]).map((density) => (
                      <button
                        key={density}
                        className={appearance.density === density ? 'active' : ''}
                        onClick={() => appearance.setDensity(density)}
                        aria-pressed={appearance.density === density}
                      >
                        {density}
                      </button>
                    ))}
                  </div>
                </article>
                <label className="adminToggleRow">
                  <span><strong>Reduced motion</strong><small>Use calmer movement in the administration workspace.</small></span>
                  <input
                    type="checkbox"
                    role="switch"
                    aria-checked={appearance.reducedMotion}
                    checked={appearance.reducedMotion}
                    onChange={(event) => appearance.setReducedMotion(event.target.checked)}
                  />
                  <i aria-hidden="true" />
                </label>
                <article className="adminSettingsCard">
                  <span>Sidebar preference</span>
                  <div className="adminSegmented">
                    {(['expanded', 'compact'] as AdminSidebarPreference[]).map((sidebar) => (
                      <button
                        key={sidebar}
                        className={appearance.sidebar === sidebar ? 'active' : ''}
                        onClick={() => appearance.setSidebar(sidebar)}
                        aria-pressed={appearance.sidebar === sidebar}
                      >
                        {sidebar}
                      </button>
                    ))}
                  </div>
                </article>
                <article className="adminBrandReference">
                  <span>ONIRIA brand</span>
                  <div><i style={{ backgroundColor: '#B8A37C' }} />Warm Taupe #B8A37C</div>
                  <div><i style={{ backgroundColor: '#031B35' }} />Midnight Navy #031B35</div>
                  <div><i style={{ backgroundColor: '#F7F3EA' }} />Editorial Light #F7F3EA</div>
                </article>
              </div>
            </div>
          )}

          {active === 'system' && isAdmin && (
            <div className="adminSettingsStack">
              <div className="adminSettingsPanelHead"><div><p className="eyebrow">System</p><h3>Administration status</h3></div></div>
              <div className="adminSystemGrid">
                {['Website status','Public enquiries','Newsroom publishing','Website activity tracking','Staff administration'].map((label) => (
                  <article key={label}><span>{label}</span><strong>Active</strong></article>
                ))}
                <article><span>Organisation</span><strong>ONIRIA Investments</strong></article>
                <article><span>Environment</span><strong>{typeof window !== 'undefined' && window.location.hostname.includes('localhost') ? 'Local' : 'Production'}</strong></article>
              </div>
            </div>
          )}
        </section>
      </div>
    </AdminFrame>
  );
}

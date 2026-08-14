'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminFrame, AdminState, type StaffProfile, useAdminSession } from '@/components/AdminData';
import { authFetch } from '@/lib/api';

const roleOptions = [
  { value: 'admin', label: 'Administrator', description: 'Full access across the staff workspace.' },
  { value: 'editor', label: 'Editor', description: 'Prepare, review and publish newsroom stories.' },
  { value: 'content_manager', label: 'Content manager', description: 'Prepare and maintain newsroom content.' },
  { value: 'sales', label: 'Sales', description: 'Review and follow up customer enquiries.' },
];

type Staff = StaffProfile & {
  status: 'active' | 'suspended';
  created_at: string;
  updated_at: string;
};

async function getToken() {
  const { supabase } = await import('@/lib/supabase');
  if (!supabase) throw new Error('Staff sign-in is unavailable. Please contact an administrator.');
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error('Your staff session has expired.');
  return token;
}

export default function Page() {
  const { profile } = useAdminSession();
  const [staff, setStaff] = useState<Staff[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const [selected, setSelected] = useState<Staff | null>(null);

  const isAdmin = profile?.roles?.includes('admin');

  const loadStaff = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const token = await getToken();
      setStaff(await authFetch<Staff[]>('/admin/staff', token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load staff.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (isAdmin) void loadStaff();
    if (profile && !isAdmin) setLoading(false);
  }, [isAdmin, profile, loadStaff]);

  const activeCount = useMemo(() => staff.filter((item) => item.status === 'active').length, [staff]);

  async function createStaff(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setSaving(true);
    setError('');
    setNotice('');
    const form = event.currentTarget;
    const data = new FormData(form);
    const roles = roleOptions.filter((role) => data.get(`role_${role.value}`) === 'on').map((role) => role.value);
    try {
      const token = await getToken();
      const created = await authFetch<Staff>('/admin/staff', token, {
        method: 'POST',
        body: JSON.stringify({
          full_name: String(data.get('full_name') || ''),
          email: String(data.get('email') || ''),
          password: String(data.get('password') || ''),
          roles,
        }),
      });
      setNotice(`${created.full_name || created.email} can now sign in with the credentials you created.`);
      form.reset();
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to create staff account.');
    } finally {
      setSaving(false);
    }
  }

  async function updateSelected(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    setSaving(true);
    setError('');
    setNotice('');
    const data = new FormData(event.currentTarget);
    const roles = roleOptions.filter((role) => data.get(`edit_role_${role.value}`) === 'on').map((role) => role.value);
    const password = String(data.get('password') || '');
    try {
      const token = await getToken();
      const updated = await authFetch<Staff>(`/admin/staff/${selected.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({
          full_name: String(data.get('full_name') || ''),
          status: String(data.get('status') || 'active'),
          roles,
          ...(password ? { password } : {}),
        }),
      });
      setSelected(updated);
      setNotice(`${updated.full_name || updated.email} has been updated.`);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to update staff account.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <AdminFrame title="Team access" kicker="Staff administration">
      {!isAdmin && profile ? (
        <div className="adminFeatureCard adminFeatureCardWide">
          <p className="eyebrow">Restricted</p>
          <h2>Administrator access is required.</h2>
          <p>Only administrators can create credentials, assign roles, suspend accounts or reset staff passwords.</p>
        </div>
      ) : (
        <>
          <div className="adminMetrics adminMetricsModern">
            <article><span>Team members</span><strong>{staff.length || '—'}</strong><small>Staff profiles</small></article>
            <article><span>Active access</span><strong>{activeCount || '—'}</strong><small>Current staff access</small></article>
            <article><span>Access setup</span><strong className="metricText">Assigned roles</strong><small>Managed by administrators</small></article>
          </div>

          <div className="adminSplitWorkspace">
            <section className="adminFeatureCard">
              <div className="adminSectionTitle">
                <p className="eyebrow">Create staff access</p>
                <h2>Add a team member.</h2>
                <p>Create staff access, choose responsibilities and provide a temporary password in one step.</p>
              </div>
              <form className="adminForm" onSubmit={createStaff}>
                <label><span>Full name</span><input name="full_name" required placeholder="Staff member name" /></label>
                <label><span>Email address</span><input name="email" type="email" required placeholder="staff@oniria.com" /></label>
                <label><span>Temporary password</span><input name="password" type="password" minLength={8} required placeholder="Use a strong temporary password" /></label>
                <fieldset>
                  <legend>Responsibilities</legend>
                  <div className="adminRoleGrid">
                    {roleOptions.map((role) => <label className="adminRoleOption" key={role.value}>
                      <input type="checkbox" name={`role_${role.value}`} defaultChecked={role.value === 'sales'} />
                      <span><strong>{role.label}</strong><small>{role.description}</small></span>
                    </label>)}
                  </div>
                </fieldset>
                <button className="adminPrimaryButton" disabled={saving}>{saving ? 'Creating access…' : 'Create staff access'} <span>→</span></button>
              </form>
            </section>

            <section className="adminFeatureCard">
              <div className="adminSectionTitle inline">
                <div><p className="eyebrow">Team directory</p><h2>Staff & roles.</h2></div>
                <span className="adminCountBadge">{staff.length}</span>
              </div>
              <AdminState loading={loading} error={error} empty={!loading && !error && !staff.length ? 'No staff profiles found.' : undefined} />
              <div className="adminStaffList">
                {staff.map((item) => <button className={`adminStaffRow ${selected?.id === item.id ? 'selected' : ''}`} key={item.id} onClick={() => setSelected(item)}>
                  <span className="adminAvatar">{(item.full_name || item.email || 'S').slice(0, 1).toUpperCase()}</span>
                  <span className="adminStaffIdentity"><strong>{item.full_name || 'Unnamed staff'}</strong><small>{item.email}</small></span>
                  <span className="adminStaffResponsibilities">{item.roles.join(' · ')}</span>
                  <span className={`adminStatusDot ${item.status}`}>{item.status}</span>
                </button>)}
              </div>
            </section>
          </div>

          {selected && <section className="adminFeatureCard adminFeatureCardWide adminEditStaff">
            <div className="adminSectionTitle inline"><div><p className="eyebrow">Manage staff</p><h2>{selected.full_name || selected.email}</h2></div><button className="adminGhostButton" onClick={() => setSelected(null)}>Close</button></div>
            <form className="adminForm adminFormThree" onSubmit={updateSelected}>
              <label><span>Full name</span><input name="full_name" defaultValue={selected.full_name || ''} required /></label>
              <label><span>Account status</span><select name="status" defaultValue={selected.status}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
              <label><span>New password (optional)</span><input name="password" type="password" minLength={8} placeholder="Leave blank to keep current password" /></label>
              <fieldset className="wide"><legend>Responsibilities</legend><div className="adminRoleGrid four">{roleOptions.map((role)=><label className="adminRoleOption" key={role.value}><input type="checkbox" name={`edit_role_${role.value}`} defaultChecked={selected.roles.includes(role.value)} /><span><strong>{role.label}</strong><small>{role.description}</small></span></label>)}</div></fieldset>
              <button className="adminPrimaryButton" disabled={saving}>{saving ? 'Saving…' : 'Save staff changes'} <span>→</span></button>
            </form>
          </section>}

          {notice && <div className="adminToast success">{notice}</div>}
          {error && !loading && <div className="adminToast error">{error}</div>}
        </>
      )}
    </AdminFrame>
  );
}

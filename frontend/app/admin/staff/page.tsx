'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminFrame, AdminState, getAdminAccessToken, type StaffProfile, useAdminSession } from '@/components/AdminData';
import { ApiRequestError, authFetch } from '@/lib/api';

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

function isRouteNotFound(err: unknown) {
  return err instanceof ApiRequestError && err.status === 404 && (!err.code || err.code === 'http_404');
}

async function removeStaffWithFallbacks(userId: string, token: string) {
  const actions = [
    { path: `/admin/staff/${userId}`, method: 'DELETE' },
    { path: `/admin/staff/${userId}/delete`, method: 'POST' },
    { path: `/admin/team/${userId}`, method: 'DELETE' },
    { path: `/admin/team/${userId}/delete`, method: 'POST' },
  ];

  let lastRouteError: unknown;

  for (const action of actions) {
    try {
      await authFetch<void>(action.path, token, { method: action.method });
      return;
    } catch (err) {
      if (!(err instanceof ApiRequestError) || (err.status !== 405 && !isRouteNotFound(err))) throw err;
      lastRouteError = err;
    }
  }

  throw lastRouteError instanceof Error ? lastRouteError : new Error('Unable to remove staff account.');
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
      const token = await getAdminAccessToken();
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
      const token = await getAdminAccessToken();
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
      const token = await getAdminAccessToken();
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

  async function removeStaffAccount(item: Staff) {
    if (item.id === profile?.id) {
      setError('You cannot remove your own staff account.');
      return;
    }

    const name = item.full_name || item.email || 'this staff member';
    if (!window.confirm(`Remove ${name} from Team Access? This deletes their staff login and cannot be undone.`)) {
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const token = await getAdminAccessToken();
      await removeStaffWithFallbacks(item.id, token);
      if (selected?.id === item.id) setSelected(null);
      setNotice(`${name} has been removed from Team Access.`);
      await loadStaff();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove staff account.');
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
            <article><span>Team members</span><strong>{staff.length || '-'}</strong><small>Staff profiles</small></article>
            <article><span>Active access</span><strong>{activeCount || '-'}</strong><small>Current staff access</small></article>
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
                    {roleOptions.map((role) => (
                      <label className="adminRoleOption" key={role.value}>
                        <input type="checkbox" name={`role_${role.value}`} defaultChecked={role.value === 'sales'} />
                        <span><strong>{role.label}</strong><small>{role.description}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <button className="adminPrimaryButton" disabled={saving}>{saving ? 'Creating access...' : 'Create staff access'} <span>-&gt;</span></button>
              </form>
            </section>

            <section className="adminFeatureCard">
              <div className="adminSectionTitle inline">
                <div><p className="eyebrow">Team directory</p><h2>Staff & roles.</h2></div>
                <span className="adminCountBadge">{staff.length}</span>
              </div>
              <AdminState loading={loading} error={error} empty={!loading && !error && !staff.length ? 'No staff profiles found.' : undefined} />
              <div className="adminStaffList">
                {staff.map((item) => (
                  <article className={`adminStaffRow ${selected?.id === item.id ? 'selected' : ''}`} key={item.id}>
                    <button type="button" className="adminStaffRowSelect" onClick={() => setSelected(item)}>
                      <span className="adminAvatar">{(item.full_name || item.email || 'S').slice(0, 1).toUpperCase()}</span>
                      <span className="adminStaffIdentity"><strong>{item.full_name || 'Unnamed staff'}</strong><small>{item.email}</small></span>
                      <span className="adminStaffResponsibilities">{item.roles.join(' - ')}</span>
                      <span className={`adminStatusDot ${item.status}`}>{item.status}</span>
                    </button>
                    <button
                      type="button"
                      className="adminStaffRemoveInline"
                      disabled={saving || item.id === profile?.id}
                      onClick={() => void removeStaffAccount(item)}
                      title={item.id === profile?.id ? 'You cannot remove your own staff account.' : 'Remove staff'}
                    >
                      Remove
                    </button>
                  </article>
                ))}
              </div>
            </section>
          </div>

          {selected && (
            <section className="adminFeatureCard adminFeatureCardWide adminEditStaff">
              <div className="adminSectionTitle inline">
                <div><p className="eyebrow">Manage staff</p><h2>{selected.full_name || selected.email}</h2></div>
                <button className="adminGhostButton" onClick={() => setSelected(null)}>Close</button>
              </div>
              <form className="adminForm adminFormThree" onSubmit={updateSelected}>
                <label><span>Full name</span><input name="full_name" defaultValue={selected.full_name || ''} required /></label>
                <label><span>Account status</span><select name="status" defaultValue={selected.status}><option value="active">Active</option><option value="suspended">Suspended</option></select></label>
                <label><span>New password (optional)</span><input name="password" type="password" minLength={8} placeholder="Leave blank to keep current password" /></label>
                <fieldset className="wide">
                  <legend>Responsibilities</legend>
                  <div className="adminRoleGrid four">
                    {roleOptions.map((role) => (
                      <label className="adminRoleOption" key={role.value}>
                        <input type="checkbox" name={`edit_role_${role.value}`} defaultChecked={selected.roles.includes(role.value)} />
                        <span><strong>{role.label}</strong><small>{role.description}</small></span>
                      </label>
                    ))}
                  </div>
                </fieldset>
                <div className="adminStaffActions">
                  <button className="adminPrimaryButton" disabled={saving}>{saving ? 'Saving...' : 'Save staff changes'} <span>-&gt;</span></button>
                  <button
                    type="button"
                    className="adminDangerButton"
                    disabled={saving || selected.id === profile?.id}
                    onClick={() => void removeStaffAccount(selected)}
                    title={selected.id === profile?.id ? 'You cannot remove your own staff account.' : 'Remove staff'}
                  >
                    Remove staff
                  </button>
                </div>
              </form>
            </section>
          )}

          {notice && <div className="adminToast success">{notice}</div>}
          {error && !loading && <div className="adminToast error">{error}</div>}
        </>
      )}
    </AdminFrame>
  );
}

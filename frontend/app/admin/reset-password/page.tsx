'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [saving, setSaving] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) { setError('Password reset is not available.'); return; }
    void supabase.auth.getSession().then(({ data }) => setReady(Boolean(data.session)));
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => setReady(Boolean(session)));
    return () => listener.subscription.unsubscribe();
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) return;
    const data = new FormData(event.currentTarget);
    const password = String(data.get('password') || '');
    const confirm = String(data.get('confirm_password') || '');
    if (password !== confirm) { setError('The passwords do not match.'); return; }
    setSaving(true);setError('');setNotice('');
    const { error: updateError } = await supabase.auth.updateUser({ password });
    setSaving(false);
    if (updateError) setError(updateError.message);
    else {
      setNotice('Your password has been updated.');
      setTimeout(()=>router.replace('/admin'), 900);
    }
  }

  return <main className="adminLoginPage adminLoginPremium adminLoginRefined">
    <section className="adminLoginBrand">
      <div className="adminLoginLogo"><img src="/oniria-admin-mark.png" alt="ONIRIA Investments" /></div>
      <div className="adminLoginStory"><p className="eyebrow">Account recovery</p><h1>Create a new password.</h1><p>Choose a strong password for your ONIRIA staff account, then return to your workspace.</p></div>
      <span className="adminLoginFine">ONIRIA Investments · Staff administration</span>
    </section>
    <section className="adminLoginPanel"><div className="adminLoginCard adminLoginCardRefined">
      <p className="eyebrow">Password reset</p><h2>New password</h2>
      {!ready && !error ? <p>Opening your secure reset session…</p> : null}
      {ready ? <form onSubmit={submit}>
        <label><span>New password</span><input name="password" type="password" minLength={8} required /></label>
        <label><span>Confirm password</span><input name="confirm_password" type="password" minLength={8} required /></label>
        <button className="adminLoginSubmit" disabled={saving}>{saving ? 'Updating…' : 'Update password'} <span>→</span></button>
      </form> : null}
      {notice && <div className="adminLoginNotice">{notice}</div>}
      {error && <div className="formError adminLoginError">{error}</div>}
    </div></section>
  </main>;
}

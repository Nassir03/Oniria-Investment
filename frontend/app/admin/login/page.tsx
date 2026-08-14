'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace('/admin'); });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Supabase staff authentication is not configured.'); return; }
    setLoading(true);
    setError('');
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get('email')),
      password: String(form.get('password')),
    });
    setLoading(false);
    if (authError) setError(authError.message);
    else router.replace('/admin');
  }

  return <main className="adminLoginPage adminLoginPremium">
    <section className="adminLoginBrand">
      <div className="adminLoginLogo"><img src="/oniria-admin-mark.png" alt="ONIRIA Investments" /></div>
      <div className="adminLoginStory">
        <p className="eyebrow">ONIRIA staff</p>
        <h1>Secure access for authorised team members.</h1>
        <p>Manage leads, newsroom publishing, projects and staff operations from the private ONIRIA workspace.</p>
      </div>
      <span className="adminLoginFine">Private administration portal · Authorized staff only</span>
    </section>

    <section className="adminLoginPanel">
      <div className="adminLoginCard">
        <p className="eyebrow">Staff portal</p>
        <h2>Sign in</h2>
        <p>Continue with your ONIRIA staff credentials.</p>
        <form onSubmit={submit}>
          <label><span>Staff email</span><input name="email" type="email" autoComplete="email" required placeholder="name@oniria.com" /></label>
          <label><span>Password</span><div className="adminPasswordField"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value)=>!value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
          <button className="adminLoginSubmit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button>
          {error && <div className="formError adminLoginError">{error}</div>}
        </form>
        <div className="adminLoginHelp"><span>Need access?</span><small>Contact your ONIRIA administrator to create or restore staff credentials.</small></div>
      </div>
    </section>
  </main>;
}

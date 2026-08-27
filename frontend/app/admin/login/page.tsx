'use client';

import { FormEvent, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

export default function Page() {
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showRecovery, setShowRecovery] = useState(false);
  const router = useRouter();

  useEffect(() => {
    if (!supabase) return;
    void supabase.auth.getSession().then(({ data }) => { if (data.session) router.replace('/admin'); });
  }, [router]);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Staff sign-in is not available yet. Please contact your administrator.'); return; }
    setLoading(true);
    setError('');
    setNotice('');
    const form = new FormData(event.currentTarget);
    const { error: authError } = await supabase.auth.signInWithPassword({
      email: String(form.get('email')),
      password: String(form.get('password')),
    });
    setLoading(false);
    if (authError) setError(authError.message);
    else {
      router.replace('/admin');
    }
  }

  async function recover(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!supabase) { setError('Password recovery is not available yet. Please contact your administrator.'); return; }
    setLoading(true);
    setError('');
    setNotice('');
    const data = new FormData(event.currentTarget);
    const email = String(data.get('recovery_email') || '');
    const { error: recoveryError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${window.location.origin}/admin/reset-password`,
    });
    setLoading(false);
    if (recoveryError) setError(recoveryError.message);
    else setNotice('Check your email for a password reset link.');
  }

  return <main className="adminLoginPage adminLoginPremium adminLoginRefined">
    <section className="adminLoginBrand">
      <div className="adminLoginLogo" aria-label="ONIRIA Investments"><span className="wordmarkLogo adminLoginWordmarkLogo" aria-hidden="true" /></div>
      <div className="adminLoginStory">
        <p className="eyebrow">ONIRIA staff</p>
        <h1>Welcome back.</h1>
        <p>Sign in to manage enquiries, newsroom updates, projects and team access from one private workspace.</p>
      </div>
      <span className="adminLoginFine">ONIRIA Investments · Staff administration</span>
    </section>

    <section className="adminLoginPanel">
      <div className="adminLoginCard adminLoginCardRefined">
        {!showRecovery ? <>
          <p className="eyebrow">Staff portal</p>
          <h2>Sign in</h2>
          <p>Use your authorised staff account to continue.</p>
          <form onSubmit={submit}>
            <label><span>Email address</span><input name="email" type="email" autoComplete="email" required placeholder="name@example.com" /></label>
            <label><span>Password</span><div className="adminPasswordField"><input name="password" type={showPassword ? 'text' : 'password'} autoComplete="current-password" required /><button type="button" onClick={() => setShowPassword((value)=>!value)} aria-label={showPassword ? 'Hide password' : 'Show password'}>{showPassword ? 'Hide' : 'Show'}</button></div></label>
            <button className="adminLoginSubmit" disabled={loading}>{loading ? 'Signing in…' : 'Sign in'} <span>→</span></button>
          </form>
          <button className="adminRecoveryLink" type="button" onClick={()=>{setShowRecovery(true);setError('');setNotice('');}}>Forgot your password?</button>
        </> : <>
          <p className="eyebrow">Password help</p>
          <h2>Reset access</h2>
          <p>Enter your staff email and we will send you a secure link to create a new password.</p>
          <form onSubmit={recover}>
            <label><span>Staff email</span><input name="recovery_email" type="email" autoComplete="email" required placeholder="name@example.com" /></label>
            <button className="adminLoginSubmit" disabled={loading}>{loading ? 'Sending…' : 'Send reset link'} <span>→</span></button>
          </form>
          <button className="adminRecoveryLink" type="button" onClick={()=>{setShowRecovery(false);setError('');setNotice('');}}>Back to sign in</button>
        </>}
        {notice && <div className="adminLoginNotice">{notice}</div>}
        {error && <div className="formError adminLoginError">{error}</div>}
        <div className="adminLoginHelp"><span>Need help?</span><small>Contact an ONIRIA administrator if you no longer have access to your staff email.</small></div>
      </div>
    </section>
  </main>;
}

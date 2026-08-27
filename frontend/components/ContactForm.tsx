'use client';

import { FormEvent, useState } from 'react';
import { createLead } from '@/lib/api';
import { useSearchParams } from 'next/navigation';

export default function ContactForm({
  projects: _projects,
  selectedProjectId: selectedProjectIdProp,
}: {
  projects: any[];
  selectedProjectId?: string;
}) {
  const searchParams = useSearchParams();
  const selectedProjectId = selectedProjectIdProp || searchParams.get('project') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');

    const form = e.currentTarget;
    const fd = new FormData(form);
    const firstName = String(fd.get('first_name') || '').trim();
    const lastName = String(fd.get('last_name') || '').trim();
    const company = String(fd.get('company') || '').trim();
    const originalMessage = String(fd.get('message') || '').trim();
    const message = company ? `Company / Organization: ${company}\n\n${originalMessage}` : originalMessage;

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: fd.get('email'),
      phone: null,
      country: 'Tanzania',
      enquiry_type: 'Website contact',
      project_id: selectedProjectId || null,
      message,
      preferred_contact_method: 'email',
      consent: true,
    };

    try {
      const r = await createLead(payload);
      setReference(r.reference_no);
      setStatus('success');
      form.reset();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit enquiry');
      setStatus('error');
    }
  }

  return (
    <form className="contactReferenceForm" onSubmit={submit}>
      <div className="contactReferenceNameFields">
        <label>
          <span>First name</span>
          <input name="first_name" autoComplete="given-name" required />
        </label>
        <label>
          <span>Last name</span>
          <input name="last_name" autoComplete="family-name" required />
        </label>
      </div>

      <label>
        <span>Email address</span>
        <input type="email" name="email" autoComplete="email" required />
      </label>

      <label>
        <span>Company / Organization</span>
        <input name="company" autoComplete="organization" />
      </label>

      <label className="contactReferenceMessageField">
        <span>Your message</span>
        <textarea name="message" minLength={5} required rows={6} />
      </label>

      <button type="submit" className="contactReferenceSubmit" disabled={status === 'loading'}>
        <span>{status === 'loading' ? 'Sending…' : 'Send message'}</span>
        <span aria-hidden="true">⟶</span>
      </button>

      <p className="contactReferencePrivacy">
        By sending this message, you agree to our <span>Privacy Policy</span>.
      </p>

      {status === 'success' && (
        <div className="form-success contactReferenceStatus">
          <strong>Message received.</strong> Your reference is <b>{reference}</b>.
        </div>
      )}
      {status === 'error' && <div className="form-error contactReferenceStatus">{error}</div>}
    </form>
  );
}

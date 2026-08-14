'use client';

import { FormEvent, useMemo, useState } from 'react';
import { createLead } from '@/lib/api';
import { useSearchParams } from 'next/navigation';
import { countryOptions } from '@/lib/countries';

const subjectOptions = [
  'General question',
  'Property information',
  'Investment',
  'Commercial opportunity',
  'Site visit',
];

export default function ContactForm({ projects, selectedProjectId: selectedProjectIdProp }: { projects: any[]; selectedProjectId?: string }) {
  const selectedProjectId = selectedProjectIdProp || useSearchParams().get('project') || '';
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [error, setError] = useState('');
  const [reference, setReference] = useState('');
  const [country, setCountry] = useState('Tanzania');
  const [dialCode, setDialCode] = useState('+255');

  const countryList = useMemo(() => countryOptions, []);

  function onCountryChange(name: string) {
    setCountry(name);
    const matched = countryList.find((item) => item.name === name);
    if (matched) setDialCode(matched.code);
  }

  async function submit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setStatus('loading');
    setError('');

    const form = e.currentTarget;
    const fd = new FormData(form);

    const fullName = String(fd.get('full_name') || '').trim();
    const parts = fullName.split(/\s+/).filter(Boolean);
    const firstName = parts[0] || fullName || 'Guest';
    const lastName = parts.slice(1).join(' ');

    const selectedCountry = String(fd.get('country') || 'Tanzania');
    const selectedDialCode = String(fd.get('dial_code') || '+255');
    const localPhone = String(fd.get('phone_local') || '').trim();
    const phone = localPhone ? `${selectedDialCode} ${localPhone}` : null;
    const subject = String(fd.get('subject') || 'General question');
    const originalMessage = String(fd.get('message') || '').trim();
    const projectId = String(fd.get('project_id') || '');
    const projectLabel = form.querySelector<HTMLSelectElement>('select[name="project_id"]')?.selectedOptions?.[0]?.text || 'General ONIRIA enquiry';

    const message = [`Subject: ${subject}`, `Project of interest: ${projectLabel}`, '', originalMessage]
      .filter(Boolean)
      .join('\n');

    const payload = {
      first_name: firstName,
      last_name: lastName,
      email: fd.get('email'),
      phone,
      country: selectedCountry,
      enquiry_type: subject,
      project_id: projectId || null,
      message,
      preferred_contact_method: fd.get('preferred_contact_method') || null,
      consent: fd.get('consent') === 'on',
      honeypot: fd.get('company_website') || null,
    };

    try {
      const r = await createLead(payload);
      setReference(r.reference_no);
      setStatus('success');
      form.reset();
      setCountry('Tanzania');
      setDialCode('+255');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to submit enquiry');
      setStatus('error');
    }
  }

  return (
    <form className="lead-form lead-formPremium contactCompactForm" onSubmit={submit}>
      <div className="contactFormIntro contactCompactFormIntro">
        <p className="eyebrow">Send a message</p>
        <div>
          <h3>Let’s start with the essentials.</h3>
          <p>Share a few details and the relevant ONIRIA team can continue the conversation with you.</p>
        </div>
      </div>

      <div className="form-grid form-gridPremium contactCompactFields">
        <label>
          <span>Full name *</span>
          <input name="full_name" placeholder="Your full name" required />
        </label>

        <label>
          <span>Email address *</span>
          <input type="email" name="email" placeholder="you@example.com" required />
        </label>

        <label>
          <span>Preferred contact</span>
          <select name="preferred_contact_method" defaultValue="email">
            <option value="email">Email</option>
            <option value="whatsapp">WhatsApp</option>
          </select>
        </label>

        <label>
          <span>Country</span>
          <select name="country" value={country} onChange={(e) => onCountryChange(e.target.value)}>
            {countryList.map((item) => (
              <option key={item.name} value={item.name}>
                {item.name}
              </option>
            ))}
          </select>
        </label>

        <div className="phoneField widePhone contactCompactPhone">
          <label>
            <span>Country code</span>
            <select name="dial_code" value={dialCode} onChange={(e) => setDialCode(e.target.value)}>
              {countryList.map((item) => (
                <option key={`${item.name}-${item.code}`} value={item.code}>
                  {item.name} ({item.code})
                </option>
              ))}
            </select>
          </label>

          <label>
            <span>Phone number</span>
            <input name="phone_local" placeholder="7XX XXX XXX" />
          </label>
        </div>

        <label>
          <span>Subject</span>
          <select name="subject" defaultValue="General question">
            {subjectOptions.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </label>

        <label>
          <span>Project of interest</span>
          <select name="project_id" defaultValue={selectedProjectId || ''}>
            <option value="">General ONIRIA enquiry</option>
            {projects.map((project) => (
              <option key={project.id} value={project.id}>
                {project.name}
              </option>
            ))}
          </select>
        </label>

        <label className="wide">
          <span>Message *</span>
          <textarea
            name="message"
            minLength={10}
            required
            rows={4}
            placeholder="Share a little about what you would like to explore..."
          />
        </label>

        <input className="hp" name="company_website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="contactCompactSubmitRow">
        <label className="consent">
          <input type="checkbox" name="consent" required />
          <span>I agree that ONIRIA may use these details to respond to my enquiry.</span>
        </label>

        <button className="button buttonNavy" disabled={status === 'loading'}>
          {status === 'loading' ? 'Sending…' : 'Send message'} <span>↗</span>
        </button>
      </div>

      {status === 'success' && (
        <div className="form-success">
          <strong>Message received.</strong> Your reference is <b>{reference}</b>.
        </div>
      )}

      {status === 'error' && <div className="form-error">{error}</div>}
    </form>
  );
}

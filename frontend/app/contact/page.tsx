import Image from 'next/image';
import { Suspense } from 'react';
import ContactForm from '@/components/ContactForm';
import { getProjects } from '@/lib/api';

export const revalidate = 60;
export const metadata = { title: 'Contact' };

function ContactIcon({ type }: { type: 'location' | 'email' | 'phone' | 'web' }) {
  if (type === 'location') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M12 21s6-5.4 6-12a6 6 0 1 0-12 0c0 6.6 6 12 6 12Z" />
        <circle cx="12" cy="9" r="2.2" />
      </svg>
    );
  }
  if (type === 'email') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <rect x="3" y="5" width="18" height="14" rx="1" />
        <path d="m4 7 8 6 8-6" />
      </svg>
    );
  }
  if (type === 'phone') {
    return (
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M7.2 3.5 4.6 5.7c-.7.6-.8 1.6-.4 2.5 2.7 5.8 5.8 8.9 11.6 11.6.9.4 1.9.3 2.5-.4l2.2-2.6-4.1-3-2 2c-2.5-1.4-4.8-3.7-6.2-6.2l2-2-3-4.1Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="9" />
      <path d="M3 12h18M12 3c2.6 2.5 4 5.5 4 9s-1.4 6.5-4 9c-2.6-2.5-4-5.5-4-9s1.4-6.5 4-9Z" />
    </svg>
  );
}

function WorldMark() {
  return (
    <svg className="contactReferenceWorld" viewBox="0 0 320 120" aria-hidden="true">
      <path d="M13 34c16-15 37-18 53-11l14-10 20 7 12 14-12 9-18-1-6 12-17 6-12-7-14 3-13-9-7-13Zm91 19 16-8 20 5 6 11-9 8 1 14-8 16-11-4-7-18-8-12V53Zm56-31 22-7 19 6 17-2 11 8 18 1 12 9-10 7-13-3-5 8-18 2-9 12-13-3-6-10-14-5-5-12-6-10Zm61 44 18-9 22 3 13 9-2 13-18 7-9 10-16-5-10-14 2-14Zm48-32 13-7 18 4 7 8-8 7-17-1-13-11Z" />
      <circle cx="183" cy="88" r="3.7" />
    </svg>
  );
}

export default async function Page() {
  let projects: any[] = [];
  try {
    projects = (await getProjects()).items;
  } catch {}

  return (
    <main className="publicPage contactReferencePage">
      <section className="contactReferenceHero">
        <Image
          className="contactReferenceHeroImage"
          src="/images/vision-ocean.webp"
          alt="ONIRIA coastal residence overlooking the ocean"
          fill
          priority
          quality={92}
          sizes="100vw"
        />
        <div className="contactReferenceHeroWash" />

        <div className="contactReferenceHeroCopy">
          <p className="contactReferenceKicker">Contact</p>
          <span className="contactReferenceShortRule" aria-hidden="true" />
          <h1>Let’s build what<br />does not exist yet.</h1>
          <span className="contactReferenceShortRule contactReferenceShortRuleLower" aria-hidden="true" />
          <p className="contactReferenceIntro">
            We are always open to new ideas, partnerships<br className="contactReferenceDesktopBreak" />
            and opportunities that align with our vision.<br className="contactReferenceDesktopBreak" />
            Let’s start a conversation.
          </p>
        </div>
      </section>

      <section className="contactReferenceDetails">
        <div className="contactReferenceInfo">
          <p className="contactReferenceKicker">Get in touch</p>
          <span className="contactReferenceShortRule" aria-hidden="true" />
          <h2>
            Whether you are an investor,<br />
            partner, collaborator or simply<br />
            curious about what we’re building,<br />
            we would love to hear from you.
          </h2>

          <div className="contactReferenceInfoList">
            <div className="contactReferenceInfoRow">
              <span className="contactReferenceIcon"><ContactIcon type="location" /></span>
              <div><strong>ONIRIA Investments</strong><span>Migombani, Zanzibar, Tanzania</span></div>
            </div>
            <div className="contactReferenceInfoRow">
              <span className="contactReferenceIcon"><ContactIcon type="email" /></span>
              <div><strong>Email</strong><a href="mailto:oniriaassist@gmail.com">oniriaassist@gmail.com</a></div>
            </div>
            <div className="contactReferenceInfoRow">
              <span className="contactReferenceIcon"><ContactIcon type="phone" /></span>
              <div><strong>Phone</strong><a href="tel:+255777221121">+255 777 221 121</a></div>
            </div>
            <div className="contactReferenceInfoRow">
              <span className="contactReferenceIcon"><ContactIcon type="web" /></span>
              <div><strong>Website</strong><a href="https://oniriainvestments.com" target="_blank" rel="noopener noreferrer">oniriainvestments.com</a></div>
            </div>
          </div>

          <WorldMark />
        </div>

        <div className="contactReferenceFormColumn">
          <p className="contactReferenceKicker">Send us a message</p>
          <span className="contactReferenceShortRule" aria-hidden="true" />
          <Suspense fallback={null}>
            <ContactForm projects={projects} />
          </Suspense>
        </div>
      </section>

      <section className="contactReferenceClosing">
        <Image
          src="/images/v-town-villa.webp"
          alt="ONIRIA tropical residence and garden"
          fill
          sizes="100vw"
        />
        <div className="contactReferenceClosingShade" />
        <div className="contactReferenceClosingCopy">
          <h2>Great spaces begin with<br />a conversation.</h2>
          <p>We look forward to connecting.</p>
          <span className="contactReferenceShortRule" aria-hidden="true" />
        </div>
      </section>
    </main>
  );
}

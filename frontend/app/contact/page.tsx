import Image from 'next/image';
import { Suspense } from 'react';
import ContactForm from '@/components/ContactForm';
import { getProjects } from '@/lib/api';

export const revalidate = 60;
export const metadata = { title: 'Contact' };

export default async function Page() {
  let projects: any[] = [];
  try {
    projects = (await getProjects()).items;
  } catch {}

  return (
    <main className="publicPage contactPage contactPremiumPage">
      <section className="contactPremiumHero">
        <Image
          className="contactPremiumHeroImage"
          src="/images/contact-hero-ona-arrival.webp"
          alt="ONA Towers arrival façade at golden hour"
          fill
          priority
          sizes="100vw"
        />
        <div className="contactPremiumHeroShade" />

        <div className="contactPremiumHeroContent">
          <p className="eyebrow light">Contact</p>
          <h1>Start a <em>conversation.</em></h1>
          <p>
            Whether you are exploring a residence, an investment opportunity or a partnership, tell us what matters to
            you. We will connect your enquiry with the right ONIRIA team.
          </p>
        </div>
      </section>

      <section className="section contactPremiumBody contactCompactBody contactDirectBody">
        <div className="contactPremiumFormShell contactCompactFormShell contactDirectFormShell">
          <Suspense fallback={null}>
            <ContactForm projects={projects} />
          </Suspense>
        </div>
      </section>
    </main>
  );
}

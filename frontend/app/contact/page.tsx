import Image from 'next/image';
import ContactForm from '@/components/ContactForm';
import { getProjects } from '@/lib/api';

export const dynamic = 'force-dynamic';
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
          src="/images/contact-hero-ona-towers.png"
          alt="ONA Towers exterior"
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

      <section className="section contactPremiumBody contactCompactBody">
        <div className="contactPremiumIntro contactCompactIntro">
          <div>
            <p className="eyebrow">Connect with ONIRIA</p>
            <h2>Begin with what matters to you.</h2>
          </div>
          <p>
            Share your interest and preferred way to be contacted. We will route your enquiry to the right ONIRIA team
            for a relevant follow-up.
          </p>
        </div>

        <div className="contactPremiumServices contactCompactServices" aria-label="ONIRIA enquiry types">
          <article>
            <span>01 · Project enquiries</span>
            <h3>Explore a destination.</h3>
            <p>Request project information, availability context or a more detailed introduction.</p>
          </article>
          <article>
            <span>02 · Investment</span>
            <h3>Discuss the opportunity.</h3>
            <p>Tell us what you are considering and we will direct the conversation to the relevant team.</p>
          </article>
          <article>
            <span>03 · Partnerships & media</span>
            <h3>Connect with the right people.</h3>
            <p>Start a focused specialist conversation without unnecessary steps.</p>
          </article>
        </div>

        <div className="contactPremiumFormShell contactCompactFormShell">
          <ContactForm projects={projects} />
        </div>
      </section>
    </main>
  );
}

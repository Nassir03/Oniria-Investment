import Image from 'next/image';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'About | ONIRIA Investments',
  description: 'Discover the purpose, perspective and principles that shape ONIRIA Investments in Zanzibar.',
};

const pillars = [
  {
    label: 'Our Purpose',
    title: 'Create places with a reason to belong.',
    copy: 'We begin with context — the character of a place, the people it serves and the experience it can create. Purpose gives every decision a clear direction.',
  },
  {
    label: 'Our Perspective',
    title: 'Make every detail part of one idea.',
    copy: 'We connect development, design, hospitality and commercial thinking around a clear proposition so each place feels coherent, distinctive and intentional.',
  },
  {
    label: 'Built on Integrity',
    title: 'Make clarity part of the experience.',
    copy: 'We value considered decisions, responsible partnerships and straightforward communication — from the first idea through delivery and beyond.',
  },
];

export default function Page() {
  return (
    <main className="publicPage story2026Page about2026Page">
      <section className="about2026HeroFull" aria-label="About ONIRIA introduction">
        <Image
          src="/images/about-mazizini-rooftop-4pm.webp"
          alt="ONA Towers rooftop leisure deck in Mazizini with pool, gym and dining terrace at 4pm"
          fill
          priority
          sizes="100vw"
        />
        <div className="about2026HeroFullShade" aria-hidden="true" />
        <Reveal className="about2026HeroFullCopy premiumUnifiedHeroCopy">
          <p className="eyebrow light">About ONIRIA</p>
          <h1>Born in Zanzibar.</h1>
          <p className="premiumUnifiedHeroLead">Built with purpose.</p>
        </Reveal>
      </section>

      <section className="story2026Opening section about2026Opening">
        <Reveal>
          <div className="story2026OpeningGrid">
            <div>
              <p className="eyebrow">What defines ONIRIA</p>
              <h2>Intent comes first.</h2>
            </div>
            <div className="story2026OpeningCopy">
              <p>We do not begin with a visual style. We begin with the opportunity: what a place can offer, how it should feel and why it should matter.</p>
              <p>That perspective guides the way architecture, landscape, hospitality, residential living and commercial thinking come together as one considered experience.</p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="story2026Pillars about2026Pillars" aria-label="ONIRIA purpose, perspective and integrity">
        <div className="story2026PillarsHeader section">
          <Reveal>
            <p className="eyebrow">The foundation</p>
            <h2>Purpose. Perspective. Integrity.</h2>
            <p className="story2026PillarsLead">Three principles shape how ONIRIA makes decisions and how every destination is brought to life.</p>
          </Reveal>
        </div>

        <div className="story2026PillarsGrid">
          {pillars.map((pillar, index) => (
            <Reveal key={pillar.label} delay={index * 0.05}>
              <article className="story2026PillarCard">
                <span className="story2026PillarLabel">{pillar.label}</span>
                <h3>{pillar.title}</h3>
                <p>{pillar.copy}</p>
                <span className="story2026PillarMark" aria-hidden="true" />
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

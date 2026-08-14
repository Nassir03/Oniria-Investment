import Image from 'next/image';
import Link from 'next/link';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Our Story | ONIRIA Investments',
  description: 'Discover the purpose, vision and values that shape ONIRIA Investments.',
};

const pillars = [
  {
    label: 'Our Purpose',
    title: 'Create places with a reason to belong.',
    copy: 'We begin with context — the character of a place, the people it serves and the experience it can create. Purpose gives every decision a clear direction.',
  },
  {
    label: 'Our Vision',
    title: 'Build destinations that remain relevant.',
    copy: 'Our ambition is to shape hospitality, residential and mixed-use environments with a distinct identity, lasting appeal and long-term value.',
  },
  {
    label: 'Built on Integrity',
    title: 'Make clarity part of the experience.',
    copy: 'We value considered decisions, responsible partnerships and straightforward communication — from the first idea through delivery and beyond.',
  },
];

const sustainablePath = [
  {
    principle: 'Context',
    title: 'Read the place before shaping it.',
    copy: 'We begin with climate, character, opportunity and the people a destination should serve — so every decision has a reason to belong.',
  },
  {
    principle: 'Clarity',
    title: 'Define a proposition people can feel.',
    copy: 'A clear identity aligns design, hospitality and commercial thinking around one memorable experience rather than a collection of disconnected features.',
  },
  {
    principle: 'Stewardship',
    title: 'Make considered choices with a longer view.',
    copy: 'We look beyond launch day, favouring decisions that support enduring relevance for the destination, the asset and the experience around it.',
  },
  {
    principle: 'Endurance',
    title: 'Create value that continues to matter.',
    copy: 'The goal is not a short-lived impression, but places with enough identity, usefulness and adaptability to remain desirable over time.',
  },
];

export default function Page() {
  return (
    <main className="publicPage story2026Page">
      <section className="story2026Hero">
        <Image
          src="/images/outside-ona-tower.png"
          alt="ONIRIA contemporary destination architecture"
          fill
          priority
          sizes="100vw"
        />
        <div className="story2026HeroOverlay" />
        <Reveal className="story2026HeroCopy">
          <p className="eyebrow light">Our Story</p>
          <h1>Places with purpose.<br /><em>Value with perspective.</em></h1>
          <p>ONIRIA brings development, design and experience together to create destinations with a distinct identity and a long-term point of view.</p>
        </Reveal>
      </section>

      <section className="story2026Opening section">
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

      <section className="story2026Pillars" aria-label="ONIRIA purpose, vision and integrity">
        <div className="story2026PillarsHeader section">
          <Reveal>
            <p className="eyebrow">The foundation</p>
            <h2>Purpose. Vision. Integrity.</h2>
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

      <section className="story2026VisionSplit">
        <div className="story2026VisionMedia">
          <Image
            src="/images/homepage-light.png"
            alt="ONIRIA coastal residential concept"
            fill
            sizes="(max-width: 900px) 100vw, 56vw"
          />
        </div>
        <Reveal className="story2026VisionCopy">
          <p className="eyebrow gold">A long-term view</p>
          <h2>Designed to be remembered for the right reasons.</h2>
          <p>Distinctive architecture can create attention. A strong destination creates something more enduring: relevance, experience and value that continue after the first impression.</p>
          <p>That is the standard ONIRIA works toward — clear enough to understand, considered enough to trust and distinctive enough to remember.</p>
        </Reveal>
      </section>

      <section className="story2026Impact section" aria-label="ONIRIA values and development approach">
        <Reveal>
          <div className="story2026ImpactHead">
            <div>
              <p className="eyebrow">Our values · Our journey</p>
              <h2>Value designed to endure.</h2>
            </div>
            <p>For ONIRIA, sustainable value is not a separate promise added at the end. It is a way of making decisions — from understanding a place and defining its identity to shaping an experience that can remain relevant, desirable and commercially meaningful over time.</p>
          </div>
        </Reveal>

        <Reveal className="story2026ImpactCanvas">
          <div className="story2026ImpactCore">
            <span>FROM PLACE</span>
            <strong>to lasting value.</strong>
          </div>

          <div className="story2026ImpactPath" role="list">
            {sustainablePath.map((item) => (
              <article key={item.principle} className="story2026ImpactItem" role="listitem">
                <div className="story2026ImpactMarker" aria-hidden="true"><i /></div>
                <p className="story2026ImpactPrinciple">{item.principle}</p>
                <h3>{item.title}</h3>
                <p className="story2026ImpactCopy">{item.copy}</p>
              </article>
            ))}
          </div>
        </Reveal>
      </section>

      <section className="story2026BusinessCta section">
        <div className="story2026BusinessCtaShell">
          <Reveal className="story2026BusinessCopy">
            <p className="eyebrow">ONIRIA Investments</p>
            <h2>Creating places with lasting presence.</h2>
            <p>Explore how ONIRIA translates this point of view into hospitality, residential and destination experiences.</p>
            <Link href="/business" className="button buttonNavy">Explore our business <span>↗</span></Link>
          </Reveal>

          <Reveal className="story2026BusinessVisual" delay={0.05}>
            <div className="story2026BusinessImageWrap">
              <Image
                src="/images/our-story-workspace.png"
                alt="Refined ONIRIA planning workspace with flowers and a laptop"
                fill
                sizes="(max-width: 980px) 100vw, 42vw"
              />
              <div className="story2026BusinessImageNote">
                <span>Thoughtful strategy</span>
                <strong>Quiet clarity behind every decision.</strong>
              </div>
            </div>
          </Reveal>
        </div>
      </section>
    </main>
  );
}

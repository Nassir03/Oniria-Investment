import Image from 'next/image';
import Reveal from '@/components/Reveal';

export const metadata = {
  title: 'Vision | ONIRIA Investments',
  description: 'Discover ONIRIA Investments’ vision for distinctive hospitality, residential and destination experiences shaped for Zanzibar and built for lasting relevance.',
};

const visionPrinciples = [
  {
    number: '01',
    label: 'Destination',
    title: 'Create reasons to arrive.',
    copy: 'We imagine places with a clear identity — destinations that feel rooted in Zanzibar while offering an experience compelling enough to be sought out, shared and remembered.',
  },
  {
    number: '02',
    label: 'Living',
    title: 'Make everyday life feel exceptional.',
    copy: 'Hospitality, residences, landscape and shared spaces should work together so daily life feels effortless, elevated and unmistakably connected to place.',
  },
  {
    number: '03',
    label: 'Value',
    title: 'Build relevance beyond launch.',
    copy: 'The strongest destinations do more than make a first impression. They create lasting appeal, continued demand and value that grows from a distinctive experience.',
  },
];

export default function Page() {
  return (
    <main className="publicPage vision2026Page">
      <section className="vision2026HeroEditorial vision2026HeroImage">
        <Image
          src="/images/restaurant-vision-attached.png"
          alt="ONIRIA restaurant and lounge interior with warm lighting"
          fill
          priority
          sizes="100vw"
        />
        <div className="vision2026HeroEditorialShade" />
        <Reveal className="vision2026HeroCopyEditorial premiumUnifiedHeroCopy">
          <h1>We saw what Zanzibar is.</h1>
          <p className="premiumUnifiedHeroLead">And imagined what could become.</p>
        </Reveal>
      </section>

      <section className="vision2026Statement section">
        <Reveal>
          <div className="vision2026StatementGrid">
            <div>
              <p className="eyebrow">The opportunity ahead</p>
              <h2>A new expression of Zanzibar.</h2>
            </div>
            <div className="vision2026StatementCopy">
              <p>
                ONIRIA sees an opportunity to create destinations that carry Zanzibar forward without losing what makes it distinctive — its character, coastline, culture and sense of place.
              </p>
              <p>
                Our vision is to turn that potential into hospitality, residential and mixed-use experiences with international appeal, a clear identity and lasting commercial relevance.
              </p>
            </div>
          </div>
        </Reveal>
      </section>

      <section className="vision2026Principles" aria-label="How ONIRIA turns vision into destinations">
        <div className="vision2026PrinciplesHead section">
          <Reveal>
            <p className="eyebrow">Vision in practice</p>
            <h2>Places people choose. Experiences people remember.</h2>
          </Reveal>
        </div>

        <div className="vision2026PrinciplesGrid">
          {visionPrinciples.map((item, index) => (
            <Reveal key={item.label} delay={index * 0.05}>
              <article className="vision2026PrincipleCard">
                <div className="vision2026PrincipleTop">
                  <span>{item.number}</span>
                  <span>{item.label}</span>
                </div>
                <h3>{item.title}</h3>
                <p>{item.copy}</p>
              </article>
            </Reveal>
          ))}
        </div>
      </section>
    </main>
  );
}

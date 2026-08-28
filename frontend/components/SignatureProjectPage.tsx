import Image from 'next/image';
import Link from 'next/link';

type SignatureSlug = 'oniria-stone-town' | 'oniria-michamvi' | 'ona-towers' | 'v-town';

export const signatureProjectSlugs: SignatureSlug[] = [
  'oniria-stone-town',
  'oniria-michamvi',
  'ona-towers',
  'v-town',
];

export function isSignatureProjectSlug(slug: string): slug is SignatureSlug {
  return signatureProjectSlugs.includes(slug as SignatureSlug);
}

type IconName =
  | 'window'
  | 'arch'
  | 'spark'
  | 'leaf'
  | 'lantern'
  | 'bowl'
  | 'movement'
  | 'moon'
  | 'drop'
  | 'sun'
  | 'tower'
  | 'waves'
  | 'sofa'
  | 'car'
  | 'dumbbell'
  | 'restaurant'
  | 'yoga'
  | 'library'
  | 'kids'
  | 'shield'
  | 'sail'
  | 'building'
  | 'community'
  | 'cycle';

function ProjectIcon({ name }: { name: IconName }) {
  if (name === 'leaf') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M39 8C25 10 13 17 10 31c8 2 17-1 23-8 5-6 6-15 6-15Z"/><path d="M11 35c7-9 14-14 24-19"/></svg>;
  }
  if (name === 'moon') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M32 8c-8 2-14 10-14 18 0 8 6 14 14 16-3 2-7 3-11 2C10 42 4 31 8 21 12 11 22 6 32 8Z"/><path d="m36 13 1.5 3 3 .6-2.3 2.1.6 3-2.8-1.4-2.8 1.4.6-3-2.3-2.1 3-.6Z"/></svg>;
  }
  if (name === 'drop') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6S12 20 12 29a12 12 0 0 0 24 0C36 20 24 6 24 6Z"/></svg>;
  }
  if (name === 'sun') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="24" r="8"/><path d="M24 5v7M24 36v7M5 24h7M36 24h7M11 11l5 5M32 32l5 5M37 11l-5 5M16 32l-5 5"/></svg>;
  }
  if (name === 'bowl') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 25h28c0 9-6 15-14 15S10 34 10 25Z"/><path d="M15 20c2-5 7-8 12-8M21 18c1-5 5-9 10-11M10 40h28"/></svg>;
  }
  if (name === 'movement' || name === 'yoga') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="10" r="3"/><path d="M24 14v12M24 18l-9 7M24 18l9 7M18 40l6-14 6 14M12 40h24"/></svg>;
  }
  if (name === 'window') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M11 41V20C11 11 17 6 24 6s13 5 13 14v21Z"/><path d="M18 41V19c0-4 2-7 6-7s6 3 6 7v22M11 27h26M24 12v29"/></svg>;
  }
  if (name === 'arch') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 41V22C10 12 16 6 24 6s14 6 14 16v19Z"/><path d="M16 41V23c0-6 3-10 8-10s8 4 8 10v18M18 21h12"/></svg>;
  }
  if (name === 'spark') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m24 4 4 14 14 4-14 4-4 14-4-14-14-4 14-4Z"/><path d="m37 6 1 5 5 1-5 1-1 5-1-5-5-1 5-1Z"/></svg>;
  }
  if (name === 'lantern') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M17 13h14l4 7-3 21H16l-3-21 4-7Z"/><path d="M20 13V8h8v5M17 21h14M20 21v14M28 21v14"/></svg>;
  }
  if (name === 'tower') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 41V12h12v29M27 41V7h12v34M5 41h38"/><path d="M13 17h4M13 23h4M13 29h4M31 13h4M31 19h4M31 25h4M31 31h4"/></svg>;
  }
  if (name === 'waves') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M5 16c5 0 5 4 10 4s5-4 10-4 5 4 10 4 5-4 8-4M5 25c5 0 5 4 10 4s5-4 10-4 5 4 10 4 5-4 8-4M5 34c5 0 5 4 10 4s5-4 10-4 5 4 10 4 5-4 8-4"/></svg>;
  }
  if (name === 'sofa' || name === 'library') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M10 23h28v14H10Z"/><path d="M14 23v-7c0-3 2-5 5-5h10c3 0 5 2 5 5v7M7 28h3M38 28h3M14 37v4M34 37v4"/></svg>;
  }
  if (name === 'car') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="m10 28 4-10h20l4 10v9H10Z"/><path d="M8 29h32M16 37v4M32 37v4"/><circle cx="16" cy="31" r="2"/><circle cx="32" cy="31" r="2"/></svg>;
  }
  if (name === 'dumbbell') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 15v18M8 19v10M35 15v18M40 19v10M13 24h22"/></svg>;
  }
  if (name === 'restaurant') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M13 7v14M9 7v8c0 4 8 4 8 0V7M13 21v20M31 7v34M31 7c6 5 8 12 3 18h-3"/></svg>;
  }
  if (name === 'kids') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="24" cy="12" r="4"/><path d="M24 16v11M24 20l-10 6M24 20l10 6M17 41l7-14 7 14M10 41h28"/></svg>;
  }
  if (name === 'shield') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 6 38 11v11c0 9-5 16-14 20-9-4-14-11-14-20V11Z"/><path d="m18 24 4 4 8-9"/></svg>;
  }
  if (name === 'sail') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M24 7v28M24 10 12 30h12M27 14l10 16H27M9 36c5 0 5 3 10 3s5-3 10-3 5 3 10 3"/></svg>;
  }
  if (name === 'building') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><path d="M9 41V16h13v25M22 41V9h17v32M5 41h38"/><path d="M13 21h5M13 27h5M13 33h5M27 15h7M27 21h7M27 27h7M27 33h7"/></svg>;
  }
  if (name === 'community') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="17" cy="17" r="5"/><circle cx="31" cy="17" r="5"/><path d="M7 38c1-8 5-12 10-12s9 4 10 12M21 38c1-7 5-11 10-11s9 4 10 11"/></svg>;
  }
  if (name === 'cycle') {
    return <svg viewBox="0 0 48 48" aria-hidden="true"><circle cx="13" cy="34" r="7"/><circle cx="36" cy="34" r="7"/><path d="m13 34 8-14 8 14H13l9-8h8M20 16h8M28 20l5 6"/></svg>;
  }
  return null;
}

function StoneTownPage() {
  const highlights: Array<[IconName, string, string]> = [
    ['window', '20 Keys', 'Collection of Standard Deluxe, Junior Suite, Supreme and Master Suite rooms.'],
    ['arch', 'Heritage Building', 'Restored with care, preserving the soul of Stone Town.'],
    ['spark', 'AI Boutique Hotel', 'Smart systems for comfort, efficiency and a seamless guest experience.'],
    ['leaf', 'Wellness & Spa', 'A serene spa and wellbeing spaces for rest and reconnection.'],
    ['lantern', 'SHI Restaurant', 'A refined dining concept celebrating local flavors and culture.'],
  ];
  const rooms = [
    ['/images/room.png', 'Standard Deluxe', '9 Rooms'],
    ['/images/project-pages/stone-lounge.jpg', 'Junior Suite', '4 Rooms'],
    ['/images/project-pages/stone-bedroom.jpg', 'Supreme', '4 Rooms'],
    ['/images/project-pages/stone-corridor.jpg', 'Master Suite', '3 Rooms'],
  ];

  return (
    <main className="signatureProjectPage stoneTownProjectPage">
      <section className="signatureHero stoneHero">
        <Image src="/images/oniria-stone-town-ai-boutique.webp" alt="ONIRIA Stone Town heritage boutique hotel" fill priority quality={92} sizes="100vw" />
        <div className="signatureHeroShade" />
        <div className="signatureHeroCopy">
          <p>Heritage Hospitality</p>
          <h1>ONIRIA Stone Town</h1>
          <span>A boutique hotel blending Zanzibar&apos;s heritage with warm hospitality and modern comfort.</span>
        </div>
      </section>

      <section className="signatureIntro signatureSectionIvory">
        <div className="signatureIntroAside"><p>The Concept</p><div className="signatureRule"/><span>Heritage character.<br/>Contemporary experience.<br/>Heart of Stone Town.</span></div>
        <div className="signatureIntroMain">
          <p>ONIRIA Stone Town is our signature boutique hotel project, set within a carefully restored heritage building in the UNESCO-listed heart of Zanzibar.</p>
          <p>Designed as the first AI-enabled boutique hotel in Stone Town, it combines timeless architecture with intelligent comfort and warm, intuitive hospitality.</p>
          <a href="#stone-project-details" className="signatureTextLink">Project Details <span>→</span></a>
        </div>
      </section>

      <section className="signatureHighlights signatureNavySection">
        <p className="signatureSectionKicker">Key Highlights</p>
        <div className="signatureHighlightGrid fiveCol">
          {highlights.map(([icon, title, copy]) => <article key={title}><ProjectIcon name={icon}/><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="stoneGallery" aria-label="ONIRIA Stone Town interiors">
        {[
          ['/images/project-pages/stone-lounge.jpg','Stone Town lounge'],
          ['/images/project-pages/stone-courtyard-gallery.jpg','Stone Town courtyard'],
          ['/images/project-pages/stone-bedroom.jpg','Stone Town bedroom'],
          ['/images/project-pages/stone-corridor.jpg','Stone Town corridor'],
        ].map(([src, alt]) => <div className="stoneGalleryItem" key={src}><Image src={src} alt={alt} fill quality={92} sizes="25vw"/></div>)}
      </section>

      <section className="stoneRooms signatureSectionIvory">
        <div className="stoneRoomsIntro"><p>Room Collection</p><div className="signatureRule"/><span>View all rooms <b>←</b></span></div>
        <div className="stoneRoomGrid">
          {rooms.map(([src, name, count]) => <article key={name}><div className="stoneRoomImage"><Image src={src} alt={`${name} room`} fill quality={92} sizes="(max-width:700px) 100vw, 22vw"/></div><h3>{name}</h3><p>{count}</p><span>View Room <b>→</b></span></article>)}
        </div>
      </section>

      <section id="stone-project-details" className="stoneProjectDetails">
        <div className="stoneProjectDetailsCopy">
          <p className="signatureSectionKicker alignLeft">Project Details</p>
          <dl>
            <div><dt>Location</dt><dd>Stone Town, Zanzibar</dd></div>
            <div><dt>Rooms</dt><dd>20 Keys</dd></div>
            <div><dt>Categories</dt><dd>Standard Deluxe, Junior Suite, Supreme, Master Suite</dd></div>
            <div><dt>Amenities</dt><dd>Spa, Restaurant, AI Systems, Rooftop Terrace</dd></div>
            <div><dt>Status</dt><dd>Under Construction</dd></div>
            <div><dt>Opening</dt><dd>April 2027</dd></div>
          </dl>
          <span className="signatureDownload">Download Brochure ↓</span>
        </div>
        <div className="stoneProjectDetailsMedia"><Image src="/images/project-pages/stone-courtyard-main.jpg" alt="ONIRIA Stone Town courtyard" fill quality={92} sizes="(max-width:800px) 100vw, 60vw"/></div>
      </section>

      <section className="stoneClosing signatureSectionIvory">
        <h2>A new standard<br/>of hospitality in<br/>Stone Town.</h2>
        <div><p>ONIRIA Stone Town is more than a hotel — it is a celebration of place, people and progressive hospitality.</p><Link href="/projects" className="signatureTextLink">Back to Projects <span>←</span></Link></div>
        <span className="stoneClosingMark" aria-hidden="true">✦</span>
      </section>

    </main>
  );
}

function MichamviPage() {
  const journey: Array<[IconName, string, string]> = [
    ['leaf','Advanced Diagnostics','Precision health assessments to personalize your longevity journey.'],
    ['bowl','Nutrition & Metabolic Health','Expert nutrition programs to optimize metabolism and vitality.'],
    ['movement','Movement & Recovery','Curated movement, breathwork and recovery to strengthen body and mind.'],
    ['moon','Sleep Optimization','Science-backed protocols for deep, restorative sleep.'],
    ['drop','Mind & Stress Balance','Mental clarity, stress reduction and emotional resilience.'],
    ['sun','Sobriety & Renewal','Support and programs for alcohol-free living and renewal.'],
  ];

  return (
    <main className="signatureProjectPage michamviProjectPage">
      <section className="signatureHero michamviHero">
        <Image src="/images/oniria-michamvi-attached.png" alt="ONIRIA Michamvi longevity resort" fill priority quality={92} sizes="100vw" />
        <div className="signatureHeroShade" />
        <div className="signatureHeroCopy">
          <p>Wellness · Nature · Longevity</p>
          <h1>ONIRIA<br/>MICHAMVI</h1>
          <strong>Longevity Resort</strong>
          <span>A coastal destination concept focused on wellness, rejuvenation and longevity.</span>
          <em>Opening August 2027</em>
        </div>
      </section>

      <section className="michamviVision signatureSectionIvory">
        <div><p className="signatureSectionKicker alignLeft">Our Vision</p><div className="signatureRule"/><h2>Longevity by the Ocean</h2><p>ONIRIA Michamvi is a sanctuary designed to extend healthspan and elevate quality of life. Rooted in science, inspired by nature, and guided by holistic wellbeing.</p></div>
        <div className="michamviVisionImage"><Image src="/images/project-pages/michamvi-wellness.jpg" alt="Wellness by the ocean at Michamvi" fill quality={92} sizes="(max-width:800px) 100vw, 50vw"/></div>
      </section>

      <section className="michamviJourney signatureSectionIvory">
        <p className="signatureSectionKicker">The Experience</p><h2>A Holistic Journey</h2>
        <div className="michamviJourneyGrid">
          {journey.map(([icon,title,copy]) => <article key={title}><ProjectIcon name={icon}/><h3>{title}</h3><p>{copy}</p></article>)}
        </div>
      </section>

      <section className="michamviResort signatureSectionIvory">
        <div className="michamviResortImage"><Image src="/images/michamvi-island-ocean-attached.png" alt="Turquoise island shoreline with boats and white sand beach" fill quality={92} sizes="(max-width:800px) 100vw, 55vw"/></div>
        <div className="michamviResortCopy">
          <p className="signatureSectionKicker alignLeft">The Resort</p>
          <h2>Designed in Harmony<br/>with Nature</h2>
          <p>A collection of private villas, wellness facilities and immersive experiences set within untouched beauty on Zanzibar&apos;s south east coast.</p>
          <ul><li>Medical Wellness & Longevity Programs</li><li>Private Villas with Ocean Views</li><li>Gourmet Healthy Cuisine</li><li>Beach Club & Sunset Experiences</li><li>Sustainable Architecture</li></ul>
        </div>
      </section>

    </main>
  );
}

function OnaTowersPage() {
  const heroFeatures: Array<[IconName, string, string]> = [
    ['tower','Two Iconic Towers','11 storeys each'],
    ['waves','Premium Views','Ocean & Sunrise'],
    ['sofa','Spacious Homes','2, 3 & Penthouse'],
    ['car','Private Parking','3 levels'],
    ['dumbbell','Lifestyle Amenities','Rooftop & podium'],
  ];
  const amenities: Array<[IconName, string]> = [
    ['waves','Rooftop Pool & Sun Deck'],['restaurant','Rooftop Restaurant & Lounge'],['dumbbell','Gym & Fitness Studio'],['yoga','Yoga & Wellness Space'],
    ['library','Residents Lounge & Library'],['kids','Kids Club & Play Area'],['shield','24/7 Security & Concierge'],['car','3 Levels of Parking'],
  ];
  const homes = [
    ['236','SQM','3 BR Ocean View'],['203','SQM','2 BR Ocean View'],['203','SQM','2 BR Sunrise View'],['236','SQM','3 BR Sunrise View'],['416+','SQM','Penthouses'],
  ];
  const interiors = [
    ['/images/project-pages/ona-living.jpg','Spacious living & dining'],['/images/project-pages/ona-kitchen.jpg','Contemporary kitchens'],['/images/project-pages/ona-bedroom.jpg','Serene bedrooms'],['/images/project-pages/ona-balcony.jpg','Panoramic balconies'],
  ];

  return (
    <main className="signatureProjectPage onaTowersProjectPage">
      <section className="signatureHero onaHero">
        <Image src="/images/project-pages/ona-hero-towers.jpg" alt="ONA Towers in Zanzibar" fill priority quality={92} sizes="100vw" />
        <div className="signatureHeroShade" />
        <div className="signatureHeroCopy">
          <p>Landmark Residences</p>
          <h1>ONA Towers</h1>
          <span>Elevated living in the heart of Zanzibar.<br/>Two iconic towers designed for light, space and connection.</span>
        </div>
      </section>

      <section className="onaFeatureStrip signatureSectionIvory">
        {heroFeatures.map(([icon,title,copy]) => <article key={title}><ProjectIcon name={icon}/><h3>{title}</h3><p>{copy}</p></article>)}
      </section>

      <section className="onaProjectIntro signatureSectionIvory">
        <div className="onaProjectCopy"><p className="signatureSectionKicker alignLeft">The Project</p><h2>A New Landmark<br/>for Zanzibar</h2><p>ONA Towers is a contemporary residential development in Mazizini, Stone Town.</p><p>Two 11-storey towers rise above the city, bringing together elegant homes, premium amenities and vibrant community spaces.</p><ul><li>Prime location in the heart of Stone Town</li><li>Walking distance to the ocean</li><li>Contemporary architecture with tropical character</li><li>Designed for comfort, privacy and community</li></ul><Link href="/contact" className="signatureTextLink">Enquire Now <span>→</span></Link></div>
        <div className="onaProjectImage"><Image src="/images/project-pages/ona-aerial.jpg" alt="Aerial view of ONA Towers" fill quality={92} sizes="(max-width:800px) 100vw, 58vw"/></div>
      </section>

      <section className="onaResidences signatureNavySection">
        <div className="onaResidencesHead"><div><p className="signatureSectionKicker alignLeft">Residences</p><h2>Homes Filled with Light</h2><p>Thoughtfully designed layouts with generous space, floor-to-ceiling windows and private balconies. Choose your view, your light, your lifestyle.</p></div><div className="onaHomeStats">{homes.map(([n,u,l])=><article key={`${n}-${l}`}><strong>{n}</strong><span>{u}</span><p>{l}</p></article>)}</div></div>
        <div className="onaInteriorGrid">{interiors.map(([src,label])=><figure key={src}><div><Image src={src} alt={label} fill quality={92} sizes="(max-width:700px) 100vw, 25vw"/></div><figcaption>{label}</figcaption></figure>)}</div>
      </section>

      <section className="onaAmenities signatureSectionIvory">
        <div className="onaAmenitiesIntro"><p className="signatureSectionKicker alignLeft">Amenities & Services</p><h2>Designed for<br/>Everyday Wellbeing</h2><p>From daily essentials to moments of leisure, ONA Towers offers facilities that elevate your lifestyle.</p></div>
        <div className="onaAmenitiesGrid">{amenities.map(([icon,title])=><article key={title}><ProjectIcon name={icon}/><h3>{title}</h3></article>)}</div>
      </section>

    </main>
  );
}

const V_TOWN_URL = 'https://oniria-city-2hez.vercel.app/';

function VTownPage() {
  const highlights: Array<[IconName, string, string]> = [
    ['waves', 'Oceanfront Living', 'Uninterrupted views & nature'],
    ['leaf', 'Wellbeing & Sports', 'Active lifestyle every day'],
    ['sail', 'V Yacht Club', 'Mooring, dining & ocean experiences'],
    ['building', 'Boutique Lifestyle', 'Retail, dining & essential services'],
    ['community', 'Private Community', 'Privacy, security & a sense of belonging'],
  ];

  const residences = [
    ['/images/project-pages/vtown-entry.jpg', 'Signature Villas', '2, 3 & 4 Bedroom', 'Oceanfront & Lagoon Villas'],
    ['/images/project-pages/vtown-bedroom-ocean.jpg', 'Residence Collection', '1, 2 & 3 Bedroom Apartments', 'Contemporary Coastal Living'],
    ['/images/project-pages/vtown-kitchen.jpg', 'Promenade & Retail', 'Shops, Cafés', '& Restaurants'],
    ['/images/project-pages/vtown-bedroom-arch.jpg', 'V Yacht Club', 'Boating, Leisure', '& Exclusive Experiences'],
  ];

  const amenities: Array<[IconName, string, string]> = [
    ['dumbbell', 'Gym & Fitness', 'Indoor & outdoor'],
    ['yoga', 'Yoga & Wellness', 'Studios & retreats'],
    ['cycle', 'Running & Cycling', 'Scenic tracks'],
    ['kids', 'Kids Club', 'Safe & engaging'],
    ['spark', 'Art & Culture', 'Gallery & events'],
    ['waves', 'Beach Club', 'Relax & unwind'],
    ['sail', 'Water Sports', 'Adventure & fun'],
    ['community', 'Community Spaces', 'Gather & connect'],
  ];

  return (
    <main className="signatureProjectPage vTownProjectPage">
      <section className="signatureHero vTownHero">
        <Image
          src="/images/v-town-villa.png"
          alt="V Town coastal villa in Fumba, Zanzibar"
          fill
          priority
          quality={92}
          sizes="100vw"
        />
        <div className="signatureHeroShade" />
        <div className="signatureHeroCopy vTownHeroCopy">
          <h1>V TOWN</h1>
          <strong>The Art of Living</strong>
          <span>A masterplanned coastal community in Fumba, where art, wellbeing and nature come together to create an elevated way of life.</span>
          <a href={V_TOWN_URL} target="_blank" rel="noreferrer" className="vTownHeroWebsiteLink">
            Visit V Town Website <b aria-hidden="true">↗</b>
          </a>
        </div>
      </section>

      <section className="vTownEssence signatureSectionIvory">
        <div className="vTownEssenceCopy">
          <p className="signatureSectionKicker alignLeft">The Essence</p>
          <div className="signatureRule" />
          <h2>More than a place<br/>to live.<br/>A way to live.</h2>
          <p>V Town is thoughtfully designed to harmonize modern living with Zanzibar&apos;s natural beauty. Every space, every detail, every experience is crafted for balance and connection.</p>
        </div>
        <div className="vTownEssenceImage">
          <Image src="/images/project-pages/vtown-living.jpg" alt="V Town contemporary coastal living space" fill quality={92} sizes="(max-width:800px) 100vw, 58vw"/>
        </div>
      </section>

      <section className="vTownFeatureStrip signatureSectionIvory" aria-label="V Town highlights">
        {highlights.map(([icon, title, copy]) => (
          <article key={title}>
            <ProjectIcon name={icon}/>
            <h3>{title}</h3>
            <p>{copy}</p>
          </article>
        ))}
      </section>

      <section className="vTownResidences signatureSectionIvory">
        <div className="vTownResidencesIntro">
          <p className="signatureSectionKicker alignLeft">Residences</p>
          <div className="signatureRule" />
          <h2>Elegant homes<br/>in perfect harmony.</h2>
        </div>
        <div className="vTownResidenceGrid">
          {residences.map(([src, title, lineOne, lineTwo]) => (
            <article key={title}>
              <div className="vTownResidenceImage"><Image src={src} alt={`${title} at V Town`} fill quality={92} sizes="(max-width:700px) 100vw, 20vw"/></div>
              <h3>{title}</h3>
              <p>{lineOne}<br/>{lineTwo}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="vTownArtOfLiving">
        <Image src="/images/project-pages/vtown-entry.jpg" alt="V Town landscaped arrival and coastal architecture" fill quality={92} sizes="100vw"/>
        <div className="vTownArtShade" />
        <div className="vTownArtInner">
          <div className="vTownArtIntro">
            <p className="signatureSectionKicker alignLeft">The Art of Living</p>
            <h2>Live well.<br/>Every day.</h2>
            <p>Wellbeing, connection and inspiration are woven into every moment.</p>
          </div>
          <div className="vTownAmenitiesGrid">
            {amenities.map(([icon, title, copy]) => (
              <article key={title}>
                <ProjectIcon name={icon}/>
                <div><h3>{title}</h3><p>{copy}</p></div>
              </article>
            ))}
          </div>
        </div>
      </section>

    </main>
  );
}

export default function SignatureProjectPage({ slug }: { slug: SignatureSlug }) {
  if (slug === 'oniria-stone-town') return <StoneTownPage />;
  if (slug === 'oniria-michamvi') return <MichamviPage />;
  if (slug === 'ona-towers') return <OnaTowersPage />;
  return <VTownPage />;
}

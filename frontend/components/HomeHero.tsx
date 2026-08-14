'use client';

import Image from 'next/image';
import Link from 'next/link';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useEffect, useState } from 'react';

const slides = [
  { image: '/images/homepage-light.png', title: ['Places shaped', 'to be remembered.'], copy: 'Destination, hospitality and residential experiences composed around place, identity and long-term value.' },
  { image: '/images/outside-ona-tower.png', title: ['Architecture with', 'lasting presence.'], copy: 'A considered approach to arrival, form and the quality of everyday experience.' },
  { image: '/images/restaurant.png', title: ['Every detail', 'belongs to the story.'], copy: 'From first impression to final touchpoint, ONIRIA treats experience as one complete composition.' },
];

export default function HomeHero() {
  const [index, setIndex] = useState(0);
  const reduce = useReducedMotion();
  useEffect(() => {
    if (reduce) return;
    const timer = window.setInterval(() => setIndex((current) => (current + 1) % slides.length), 6800);
    return () => window.clearInterval(timer);
  }, [reduce]);
  const slide = slides[index];
  return (
    <section className="homeHero" aria-label="ONIRIA Investments introduction">
      <div className="homeHeroMedia">
        <AnimatePresence initial={false} mode="sync">
          <motion.div key={slide.image} className="homeHeroSlide" initial={reduce ? false : { opacity: 0, scale: 1.05 }} animate={{ opacity: 1, scale: 1 }} exit={reduce ? undefined : { opacity: 0 }} transition={{ duration: 1.35, ease: [0.22, 1, 0.36, 1] }}>
            <Image src={slide.image} alt="ONIRIA architecture and hospitality" fill priority={index === 0} sizes="100vw" />
          </motion.div>
        </AnimatePresence>
      </div>
      <div className="homeHeroOverlay" />
      <motion.div className="homeHeroContent homeHeroContentClean" initial={reduce ? false : { opacity: 0, y: 32 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.95, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}>
        <AnimatePresence mode="wait">
          <motion.div key={slide.title.join('')} initial={reduce ? false : { opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} exit={reduce ? undefined : { opacity: 0, y: -12 }} transition={{ duration: 0.72 }}>
            <h1>{slide.title[0]}<br /><em>{slide.title[1]}</em></h1>
            <p className="heroLead">{slide.copy}</p>
          </motion.div>
        </AnimatePresence>
        <div className="heroActions heroActionsSingle">
          <Link href="/business" className="button buttonLight">Discover our business <span>↗</span></Link>
        </div>
      </motion.div>
      <div className="heroDots" aria-label="Hero slides">
        {slides.map((item, i) => <button key={item.image} className={i === index ? 'active' : ''} onClick={() => setIndex(i)} aria-label={`Show hero image ${i + 1}`} />)}
      </div>
    </section>
  );
}

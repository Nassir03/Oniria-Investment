'use client';

import Image from 'next/image';
import Link from 'next/link';
import { motion, useReducedMotion } from 'framer-motion';

export default function HomeHero() {
  const reduce = useReducedMotion();

  return (
    <section className="homeHero homeHeroSingle" aria-label="ONIRIA Investments introduction">
      <div className="homeHeroMedia">
        <Image
          src="/images/home-page-light-attached.png"
          alt="Oceanfront ONIRIA residence with pool and palm trees"
          fill
          priority
          sizes="100vw"
        />
      </div>
      <div className="homeHeroOverlay" />

      <motion.div
        className="homeHeroContent homeHeroContentClean homeHeroEditorial"
        initial={reduce ? false : { opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 1, delay: 0.12, ease: [0.22, 1, 0.36, 1] }}
      >
        <h1>We create what does not exist yet.</h1>
        <p className="heroLead">Places. Experience new ways living. Born in Zanzibar.</p>

        <div className="heroActions heroActionsSingle">
          <Link href="/projects" prefetch className="button buttonLight">
            Explore Our projects <span>↗</span>
          </Link>
        </div>
      </motion.div>
    </section>
  );
}

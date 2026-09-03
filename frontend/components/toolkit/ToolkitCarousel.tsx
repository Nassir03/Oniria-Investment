'use client';

import Image from 'next/image';
import { AnimatePresence, motion, useReducedMotion } from 'framer-motion';
import { useCallback, useEffect, useMemo, useState } from 'react';
import type { ToolkitAsset } from '@/lib/toolkit';
import { fallbackToolkitAssets, toolkitProjects } from '@/lib/toolkit';

function EyeIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M2.4 12s3.4-6 9.6-6 9.6 6 9.6 6-3.4 6-9.6 6S2.4 12 2.4 12Z"/><circle cx="12" cy="12" r="2.7"/></svg>;
}
function DownloadIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14"/></svg>;
}
function ArrowIcon({ direction }: { direction: 'left' | 'right' }) {
  return <svg viewBox="0 0 24 24" aria-hidden="true" style={{ transform: direction === 'left' ? 'rotate(180deg)' : undefined }}><path d="m9 5 7 7-7 7"/></svg>;
}
function CloseIcon() {
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 5l14 14M19 5 5 19"/></svg>;
}

function circularOffset(index: number, active: number, length: number) {
  let offset = index - active;
  if (offset > length / 2) offset -= length;
  if (offset < -length / 2) offset += length;
  return offset;
}

function cardPose(offset: number) {
  const abs = Math.abs(offset);
  if (abs === 0) return { x: 0, z: 110, rotateY: 0, scale: 1, opacity: 1, filter: 'brightness(1)' };
  const sign = offset < 0 ? -1 : 1;
  if (abs === 1) return { x: sign * 330, z: -20, rotateY: sign * -30, scale: .82, opacity: .82, filter: 'brightness(.68)' };
  if (abs === 2) return { x: sign * 570, z: -135, rotateY: sign * -46, scale: .64, opacity: .62, filter: 'brightness(.5)' };
  return { x: sign * 760, z: -220, rotateY: sign * -58, scale: .5, opacity: 0, filter: 'brightness(.4)' };
}

function AssetPreview({ asset, onClose }: { asset: ToolkitAsset; onClose: () => void }) {
  useEffect(() => {
    const handler = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <motion.div className="toolkitModal" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} role="dialog" aria-modal="true" aria-label={`${asset.title} preview`}>
      <button className="toolkitModalBackdrop" onClick={onClose} aria-label="Close preview" />
      <motion.div className="toolkitModalPanel" initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 20, opacity: 0 }}>
        <div className="toolkitModalTop">
          <div><span>ONIRIA TOOLKIT</span><h2>{asset.title}</h2></div>
          <button className="toolkitIconButton" onClick={onClose} aria-label="Close preview"><CloseIcon /></button>
        </div>
        <div className="toolkitModalMedia">
          {asset.media_type === 'video' ? (
            <video src={asset.file_url} controls playsInline />
          ) : asset.media_type === 'pdf' ? (
            <iframe src={asset.file_url} title={`${asset.title} PDF`} />
          ) : (
            <Image src={asset.file_url} alt={asset.title} fill sizes="90vw" quality={92} />
          )}
        </div>
        <div className="toolkitModalBottom">
          <p>{asset.description}</p>
          {asset.is_downloadable && <a className="toolkitDownloadLink" href={asset.file_url} download={asset.file_name || undefined}><DownloadIcon /><span>Download asset</span></a>}
        </div>
      </motion.div>
    </motion.div>
  );
}

export default function ToolkitCarousel({ initialAssets = fallbackToolkitAssets }: { initialAssets?: ToolkitAsset[] }) {
  const reduceMotion = useReducedMotion();
  const [projectSlug, setProjectSlug] = useState('all-projects');
  const [active, setActive] = useState(0);
  const [preview, setPreview] = useState<ToolkitAsset | null>(null);

  const selectedProject = useMemo(
    () => toolkitProjects.find((project) => project.slug === projectSlug) || toolkitProjects[0],
    [projectSlug],
  );

  // IMPORTANT: no fallback to another project here. Selecting ONA Towers means
  // only assets explicitly published with project_slug="ona-towers" are shown.
  const assets = useMemo(
    () => initialAssets
      .filter((asset) => asset.project_slug === projectSlug && asset.is_public !== false)
      .slice()
      .sort((a, b) => a.sort_order - b.sort_order),
    [initialAssets, projectSlug],
  );

  useEffect(() => {
    setActive(0);
    setPreview(null);
  }, [projectSlug]);

  const move = useCallback((delta: number) => {
    if (!assets.length) return;
    setActive((value) => (value + delta + assets.length) % assets.length);
  }, [assets.length]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (preview || !assets.length) return;
      if (event.key === 'ArrowLeft') move(-1);
      if (event.key === 'ArrowRight') move(1);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [assets.length, move, preview]);

  const current = assets.length ? assets[Math.min(active, assets.length - 1)] : null;

  return (
    <section className="toolkitExperience" aria-label="ONIRIA project toolkit">
      <div className="toolkitAmbient" aria-hidden="true" />
      <header className="toolkitIntro">
        <div className="toolkitBrand">
          <Image src="/images/toolkit/oniria-logo-white.png" width={250} height={110} alt="ONIRIA Investments" priority />
        </div>
        <div className="toolkitTitleBlock">
          <p>{selectedProject.subtitle}</p>
          <h1>ONIRIA <em>Toolkit</em></h1>
        </div>
        <label className="toolkitProjectPicker">
          <span>Project</span>
          <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)}>
            {toolkitProjects.map((project) => <option key={project.slug} value={project.slug}>{project.name}</option>)}
          </select>
        </label>
      </header>

      {assets.length ? (
        <>
          <div className="toolkitStage" style={{ perspective: '1500px' }}>
            {assets.map((asset, index) => {
              const offset = circularOffset(index, active, assets.length);
              const pose = cardPose(offset);
              const isActive = offset === 0;
              return (
                <motion.article
                  key={asset.id}
                  className={`toolkitCard ${isActive ? 'active' : ''}`}
                  animate={pose}
                  transition={reduceMotion ? { duration: 0 } : { type: 'spring', stiffness: 120, damping: 22, mass: .85 }}
                  style={{ zIndex: 20 - Math.abs(offset), transformStyle: 'preserve-3d' }}
                  onClick={() => !isActive && setActive(index)}
                  aria-hidden={Math.abs(offset) > 2}
                >
                  <Image src={asset.preview_image_url || asset.file_url} alt="" fill sizes="(max-width: 800px) 72vw, 420px" quality={92} />
                  <div className="toolkitCardShade" />
                  <h2>{asset.title}</h2>
                  {isActive && (
                    <div className="toolkitCardActions">
                      {asset.is_downloadable && <a href={asset.file_url} download={asset.file_name || undefined} className="toolkitSquareAction" aria-label={`Download ${asset.title}`} onClick={(e) => e.stopPropagation()}><DownloadIcon /></a>}
                      <button className="toolkitSquareAction" onClick={(e) => { e.stopPropagation(); setPreview(asset); }} aria-label={`Preview ${asset.title}`}><EyeIcon /></button>
                    </div>
                  )}
                </motion.article>
              );
            })}
          </div>

          <div className="toolkitControls">
            <button onClick={() => move(-1)} aria-label="Previous toolkit item"><ArrowIcon direction="left" /></button>
            <div><span>{String(active + 1).padStart(2, '0')}</span><i /><span>{String(assets.length).padStart(2, '0')}</span></div>
            <button onClick={() => move(1)} aria-label="Next toolkit item"><ArrowIcon direction="right" /></button>
          </div>

          <footer className="toolkitMeta">
            <p>{current?.description}</p>
          </footer>
        </>
      ) : (
        <div className="toolkitEmptyProject" role="status">
          <span>{selectedProject.name}</span>
          <h2>Project toolkit coming together.</h2>
          <p>No public assets have been published for this project yet.</p>
        </div>
      )}

      <AnimatePresence>{preview && <AssetPreview asset={preview} onClose={() => setPreview(null)} />}</AnimatePresence>
    </section>
  );
}

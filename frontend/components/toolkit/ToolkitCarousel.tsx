'use client';

import Link from 'next/link';

import {
  AnimatePresence,
  motion,
  useReducedMotion,
} from 'framer-motion';

import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from 'react';

import type {
  ToolkitAsset,
} from '@/lib/toolkit';

import {
  fallbackToolkitAssets,
  toolkitCategoryDefaultCover,
  toolkitProjects,
} from '@/lib/toolkit';

/*
 * ----------------------------------------------------------
 * ICONS
 * ----------------------------------------------------------
 */

function EyeIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M2.4 12s3.4-6 9.6-6 9.6 6 9.6 6-3.4 6-9.6 6S2.4 12 2.4 12Z" />

      <circle
        cx="12"
        cy="12"
        r="2.7"
      />
    </svg>
  );
}

function DownloadIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M12 3v12m0 0 4.5-4.5M12 15l-4.5-4.5M5 20h14" />
    </svg>
  );
}

function ArrowIcon({
  direction,
}: {
  direction: 'left' | 'right';
}) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      style={{
        transform:
          direction === 'left'
            ? 'rotate(180deg)'
            : undefined,
      }}
    >
      <path d="m9 5 7 7-7 7" />
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
    >
      <path d="M5 5l14 14M19 5 5 19" />
    </svg>
  );
}

/*
 * ----------------------------------------------------------
 * LINK + COVER HELPERS
 * ----------------------------------------------------------
 */

function isExternalLink(url: string) {
  return /^https?:\/\//i.test(url);
}

function getGoogleDriveFileId(url: string) {
  const pathMatch = url.match(
    /(?:drive\.google\.com\/file\/d\/|docs\.google\.com\/[^/]+\/d\/)([^/?#]+)/i,
  );
  if (pathMatch?.[1]) return pathMatch[1];

  try {
    const parsed = new URL(url);
    if (
      parsed.hostname === 'drive.google.com' ||
      parsed.hostname.endsWith('.google.com')
    ) {
      return parsed.searchParams.get('id');
    }
  } catch {
    // Relative/local links are valid toolkit URLs and simply are not Drive links.
  }

  return null;
}


function getDownloadUrl(url: string) {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return url;

  return `https://drive.google.com/uc?export=download&id=${fileId}`;
}

function getGoogleDriveThumbnail(url: string) {
  const fileId = getGoogleDriveFileId(url);
  if (!fileId) return null;

  return `https://drive.google.com/thumbnail?id=${fileId}&sz=w1600`;
}

function getToolkitCoverUrl(asset: ToolkitAsset) {
  const requested = asset.preview_image_url?.trim();

  if (requested) {
    return getGoogleDriveThumbnail(requested) || requested;
  }

  if (asset.media_type === 'image') {
    return getGoogleDriveThumbnail(asset.file_url) || asset.file_url;
  }

  return toolkitCategoryDefaultCover[asset.category];
}

function ToolkitCover({
  asset,
}: {
  asset: ToolkitAsset;
}) {
  const fallback = toolkitCategoryDefaultCover[asset.category];
  const [src, setSrc] = useState(() => getToolkitCoverUrl(asset));

  useEffect(() => {
    setSrc(getToolkitCoverUrl(asset));
  }, [asset]);

  return (
    <img
      src={src}
      alt=""
      aria-hidden="true"
      loading="eager"
      onError={() => {
        if (src !== fallback) setSrc(fallback);
      }}
    />
  );
}

/*
 * ----------------------------------------------------------
 * CAROUSEL POSITION HELPERS
 * ----------------------------------------------------------
 */

function circularOffset(
  index: number,
  active: number,
  length: number,
) {
  let offset =
    index - active;

  if (
    offset >
    length / 2
  ) {
    offset -= length;
  }

  if (
    offset <
    -length / 2
  ) {
    offset += length;
  }

  return offset;
}

/*
 * Main 3D card positions.
 *
 * Active card:
 * centered and full size
 *
 * Side cards:
 * rotated in 3D
 */
function cardPose(
  offset: number,
) {
  const abs =
    Math.abs(offset);

  /*
   * CENTER CARD
   */
  if (abs === 0) {
    return {
      x: 0,
      z: 110,
      rotateY: 0,
      scale: 1,
      opacity: 1,
      filter:
        'brightness(1)',
    };
  }

  const sign =
    offset < 0
      ? -1
      : 1;

  /*
   * FIRST SIDE CARD
   */
  if (abs === 1) {
    return {
      x: sign * 330,
      z: -20,

      rotateY:
        sign * -30,

      scale: 0.82,

      opacity: 0.82,

      filter:
        'brightness(.68)',
    };
  }

  /*
   * SECOND SIDE CARD
   */
  if (abs === 2) {
    return {
      x: sign * 570,
      z: -135,

      rotateY:
        sign * -46,

      scale: 0.64,

      opacity: 0.62,

      filter:
        'brightness(.5)',
    };
  }

  /*
   * HIDDEN CARDS
   */
  return {
    x: sign * 760,
    z: -220,

    rotateY:
      sign * -58,

    scale: 0.5,

    opacity: 0,

    filter:
      'brightness(.4)',
  };
}

/*
 * ----------------------------------------------------------
 * INTERNAL PREVIEW MODAL
 * ----------------------------------------------------------
 *
 * Used only for local / Supabase assets.
 *
 * Google Drive files open directly in another tab instead.
 */

function AssetPreview({
  asset,
  onClose,
}: {
  asset: ToolkitAsset;
  onClose: () => void;
}) {
  useEffect(() => {
    const handler = (
      event: KeyboardEvent,
    ) => {
      if (
        event.key ===
        'Escape'
      ) {
        onClose();
      }
    };

    window.addEventListener(
      'keydown',
      handler,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        handler,
      );
    };
  }, [onClose]);

  return (
    <motion.div
      className="toolkitModal"
      initial={{
        opacity: 0,
      }}
      animate={{
        opacity: 1,
      }}
      exit={{
        opacity: 0,
      }}
      role="dialog"
      aria-modal="true"
      aria-label={`${asset.title} preview`}
    >
      <button
        className="toolkitModalBackdrop"
        onClick={
          onClose
        }
        aria-label="Close preview"
      />

      <motion.div
        className="toolkitModalPanel"
        initial={{
          y: 24,
          opacity: 0,
        }}
        animate={{
          y: 0,
          opacity: 1,
        }}
        exit={{
          y: 20,
          opacity: 0,
        }}
      >
        <div className="toolkitModalTop">
          <div>
            <span>
              ONIRIA TOOLKIT
            </span>

            <h2>
              {asset.title}
            </h2>
          </div>

          <button
            className="toolkitIconButton"
            onClick={
              onClose
            }
            aria-label="Close preview"
          >
            <CloseIcon />
          </button>
        </div>

        <div className="toolkitModalMedia">
          {asset.media_type ===
          'video' ? (
            <video
              src={
                asset.file_url
              }
              controls
              playsInline
            />
          ) : asset.media_type ===
            'pdf' ? (
            <iframe
              src={
                asset.file_url
              }
              title={`${asset.title} PDF`}
            />
          ) : (
            <img
              src={getGoogleDriveThumbnail(asset.file_url) || asset.file_url}
              alt={asset.title}
            />
          )}
        </div>

        {asset.is_downloadable && (
          <div className="toolkitModalBottom">
            <a
              className="toolkitDownloadLink"
              href={
                getDownloadUrl(
                  asset.file_url,
                )
              }
              target={isExternalLink(getDownloadUrl(asset.file_url)) ? '_blank' : undefined}
              rel={isExternalLink(getDownloadUrl(asset.file_url)) ? 'noopener noreferrer' : undefined}
              download={!isExternalLink(asset.file_url) ? asset.file_name || undefined : undefined}
            >
              <DownloadIcon />

              <span>
                Download asset
              </span>
            </a>
          </div>
        )}
      </motion.div>
    </motion.div>
  );
}

/*
 * ----------------------------------------------------------
 * MAIN TOOLKIT CAROUSEL
 * ----------------------------------------------------------
 */

export default function ToolkitCarousel({
  initialAssets =
    fallbackToolkitAssets,
}: {
  initialAssets?: ToolkitAsset[];
}) {
  const reduceMotion =
    useReducedMotion();

  /*
   * Current selected project.
   */
  const [
    projectSlug,
    setProjectSlug,
  ] = useState(
    toolkitProjects[0].slug,
  );

  /*
   * Current active card.
   */
  const [
    active,
    setActive,
  ] = useState(0);

  /*
   * Internal preview modal.
   */
  const [
    preview,
    setPreview,
  ] =
    useState<ToolkitAsset | null>(
      null,
    );

  /*
   * Selected project information.
   */
  const selectedProject =
    useMemo(
      () =>
        toolkitProjects.find(
          (project) =>
            project.slug ===
            projectSlug,
        ) ||
        toolkitProjects[0],
      [projectSlug],
    );

  /*
   * --------------------------------------------------------
   * STRICT PROJECT FILTER
   * --------------------------------------------------------
   *
   * If ONA Towers is selected:
   *
   * ONLY
   *
   * project_slug === "ona-towers"
   *
   * appears.
   *
   * ROHO assets cannot appear under ONA Towers.
   */
  const assets = useMemo(
    () =>
      initialAssets
        .filter(
          (asset) =>
            asset.project_slug ===
              projectSlug &&
            asset.is_public !==
              false,
        )
        .slice()
        .sort(
          (a, b) =>
            a.sort_order -
            b.sort_order,
        ),
    [
      initialAssets,
      projectSlug,
    ],
  );

  /*
   * Reset carousel whenever project changes.
   */
  useEffect(() => {
    setActive(0);

    setPreview(null);
  }, [projectSlug]);

  /*
   * Move carousel left/right.
   */
  const move =
    useCallback(
      (
        delta: number,
      ) => {
        if (
          !assets.length
        ) {
          return;
        }

        setActive(
          (value) =>
            (
              value +
              delta +
              assets.length
            ) %
            assets.length,
        );
      },
      [assets.length],
    );

  /*
   * Keyboard controls.
   */
  useEffect(() => {
    const onKey = (
      event: KeyboardEvent,
    ) => {
      if (
        preview ||
        !assets.length
      ) {
        return;
      }

      if (
        event.key ===
        'ArrowLeft'
      ) {
        move(-1);
      }

      if (
        event.key ===
        'ArrowRight'
      ) {
        move(1);
      }
    };

    window.addEventListener(
      'keydown',
      onKey,
    );

    return () => {
      window.removeEventListener(
        'keydown',
        onKey,
      );
    };
  }, [
    assets.length,
    move,
    preview,
  ]);

  return (
    <section
      className="toolkitExperience"
      aria-label="ONIRIA project toolkit"
    >
      <div
        className="toolkitAmbient"
        aria-hidden="true"
      />

      {/*
       * ----------------------------------------------------
       * TOP HEADER
       * ----------------------------------------------------
       */}
      <header className="toolkitIntro">
        <Link href="/" prefetch className="toolkitBrand" aria-label="ONIRIA Investments home">
          <span className="wordmarkLogo toolkitBrandWordmark" aria-hidden="true" />
        </Link>

        <div className="toolkitTitleBlock">
          <h1>
            {
              selectedProject.name
            }
          </h1>

          {selectedProject.slogan && (
            <p>
              {
                selectedProject.slogan
              }
            </p>
          )}
        </div>

        <label className="toolkitProjectPicker">
          <span>
            Project
          </span>

          <select
            value={
              projectSlug
            }
            onChange={(
              event,
            ) =>
              setProjectSlug(
                event.target
                  .value,
              )
            }
          >
            {toolkitProjects.map(
              (project) => (
                <option
                  key={
                    project.slug
                  }
                  value={
                    project.slug
                  }
                >
                  {
                    project.name
                  }
                </option>
              ),
            )}
          </select>
        </label>
      </header>

      {/*
       * ----------------------------------------------------
       * CAROUSEL
       * ----------------------------------------------------
       */}

      {assets.length ? (
        <>
          <div
            className="toolkitStage"
            style={{
              perspective:
                '1500px',
            }}
          >
            {assets.map(
              (
                asset,
                index,
              ) => {
                const offset =
                  circularOffset(
                    index,
                    active,
                    assets.length,
                  );

                const pose =
                  cardPose(
                    offset,
                  );

                const isActive =
                  offset === 0;

                return (
                  <motion.article
                    key={
                      asset.id
                    }
                    className={
                      `toolkitCard toolkitCard--${asset.category} ${
                        isActive
                          ? 'active'
                          : ''
                      }`
                    }
                    animate={
                      pose
                    }
                    transition={
                      reduceMotion
                        ? {
                            duration:
                              0,
                          }
                        : {
                            type:
                              'spring',

                            stiffness:
                              120,

                            damping:
                              22,

                            mass:
                              0.85,
                          }
                    }
                    style={{
                      zIndex:
                        20 -
                        Math.abs(
                          offset,
                        ),

                      transformStyle:
                        'preserve-3d',
                    }}
                    onClick={() => {
                      if (
                        !isActive
                      ) {
                        setActive(
                          index,
                        );
                      }
                    }}
                    aria-hidden={
                      Math.abs(
                        offset,
                      ) > 2
                    }
                  >
                    {/*
                     * CARD COVER
                     *
                     * IMPORTANT:
                     *
                     * This uses preview_image_url,
                     * NOT file_url.
                     *
                     * Therefore the abstract images
                     * show correctly as B covers.
                     */}
                    <ToolkitCover asset={asset} />

                    <div className="toolkitCardShade" />

                    <h2>
                      {
                        asset.title
                      }
                    </h2>

                    {/*
                     * ------------------------------------------------
                     * ACTIVE CARD ACTIONS
                     * ------------------------------------------------
                     */}
                    {isActive && (
                      <div className="toolkitCardActions">
                        {/*
                         * DOWNLOAD ICON
                         */}
                        {asset.is_downloadable && (
                          <a
                            href={
                              getDownloadUrl(
                                asset.file_url,
                              )
                            }
                            target={isExternalLink(getDownloadUrl(asset.file_url)) ? '_blank' : undefined}
                            rel={isExternalLink(getDownloadUrl(asset.file_url)) ? 'noopener noreferrer' : undefined}
                            download={!isExternalLink(asset.file_url) ? asset.file_name || undefined : undefined}
                            className="toolkitSquareAction"
                            aria-label={`Download ${asset.title}`}
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();
                            }}
                          >
                            <DownloadIcon />
                          </a>
                        )}

                        {/*
                         * EYE / PREVIEW ICON
                         *
                         * External links open in another tab so Google Drive,
                         * hosted PDFs and web pages work without iframe restrictions.
                         *
                         * Local media keeps the internal ONIRIA preview.
                         */}
                        {isExternalLink(asset.file_url) ? (
                          <a
                            href={
                              asset.file_url
                            }
                            target="_blank"
                            rel="noopener noreferrer"
                            className="toolkitSquareAction"
                            aria-label={`View ${asset.title}`}
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();
                            }}
                          >
                            <EyeIcon />
                          </a>
                        ) : (
                          <button
                            type="button"
                            className="toolkitSquareAction"
                            onClick={(
                              event,
                            ) => {
                              event.stopPropagation();

                              setPreview(
                                asset,
                              );
                            }}
                            aria-label={`Preview ${asset.title}`}
                          >
                            <EyeIcon />
                          </button>
                        )}
                      </div>
                    )}
                  </motion.article>
                );
              },
            )}
          </div>

          {/*
           * ----------------------------------------------------
           * NAVIGATION
           * ----------------------------------------------------
           *
           * No 01 ----- 09 counter.
           *
           * Only:
           *
           * <     >
           */}
          <div className="toolkitControls">
            <button
              type="button"
              onClick={() =>
                move(-1)
              }
              aria-label="Previous toolkit item"
            >
              <ArrowIcon direction="left" />
            </button>

            <button
              type="button"
              onClick={() =>
                move(1)
              }
              aria-label="Next toolkit item"
            >
              <ArrowIcon direction="right" />
            </button>
          </div>
        </>
      ) : (
        /*
         * ----------------------------------------------------
         * EMPTY PROJECT
         * ----------------------------------------------------
         *
         * If ROHO or ONA Towers has no published files,
         * ONIRIA Investments files are NOT shown instead.
         */
        <div
          className="toolkitEmptyProject"
          role="status"
        >
          <span>
            {
              selectedProject.name
            }
          </span>

          <h2>
            Project toolkit
            coming together.
          </h2>

          <p>
            No public assets
            have been published
            for this project yet.
          </p>
        </div>
      )}

      {/*
       * ------------------------------------------------------
       * LOCAL ASSET PREVIEW MODAL
       * ------------------------------------------------------
       */}
      <AnimatePresence>
        {preview && (
          <AssetPreview
            asset={
              preview
            }
            onClose={() =>
              setPreview(
                null,
              )
            }
          />
        )}
      </AnimatePresence>
    </section>
  );
}
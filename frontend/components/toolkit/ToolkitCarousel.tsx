'use client';

import Image from 'next/image';
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
  getToolkitAssetsForProject,
  mergeToolkitAssets,
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
 * GOOGLE DRIVE HELPERS
 * ----------------------------------------------------------
 */

function isGoogleDriveFile(
  url: string,
) {
  return (
    /^https:\/\/drive\.google\.com\//i.test(url) &&
    Boolean(getGoogleDriveFileId(url))
  );
}

function getGoogleDriveFileId(
  url: string,
) {
  const match = url.match(
    /drive\.google\.com\/file\/d\/([^/?]+)/i,
  );

  if (match?.[1]) {
    return match[1];
  }

  try {
    const parsedUrl = new URL(url);

    if (
      parsedUrl.hostname.toLowerCase() ===
      'drive.google.com'
    ) {
      return parsedUrl.searchParams.get('id');
    }
  } catch {
    return null;
  }

  return null;
}

function getDownloadUrl(
  url: string,
) {
  const fileId =
    getGoogleDriveFileId(url);

  if (!fileId) {
    return url;
  }

  return (
    'https://drive.google.com/uc' +
    `?export=download&id=${fileId}`
  );
}

function getGoogleDrivePreviewUrl(
  url: string,
) {
  const fileId =
    getGoogleDriveFileId(url);

  return fileId
    ? `/api/news-image?id=${fileId}`
    : null;
}

function isLocalAssetUrl(
  url: string,
) {
  return url.startsWith('/') && !url.startsWith('//');
}

function getToolkitImageUrl(
  asset: ToolkitAsset,
) {
  const source =
    asset.preview_image_url ||
    asset.file_url;

  if (isGoogleDriveFile(source)) {
    return getGoogleDrivePreviewUrl(source) || source;
  }

  return source;
}

function ToolkitImage({
  src,
  alt,
  sizes,
  priority = false,
}: {
  src: string;
  alt: string;
  sizes: string;
  priority?: boolean;
}) {
  if (
    isLocalAssetUrl(src)
  ) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        quality={92}
        priority={priority}
      />
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      loading={priority ? 'eager' : 'lazy'}
      decoding="async"
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
 * Main 3D card positioning.
 *
 * The animation values are preserved from your current
 * working carousel.
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
      x: sign * 390,
      z: -45,

      rotateY:
        sign * -36,

      scale: 0.78,

      opacity: 0.86,

      filter:
        'brightness(.68)',
    };
  }

  /*
   * SECOND SIDE CARD
   */
  if (abs === 2) {
    return {
      x: sign * 690,
      z: -210,

      rotateY:
        sign * -56,

      scale: 0.58,

      opacity: 0.66,

      filter:
        'brightness(.5)',
    };
  }

  /*
   * HIDDEN CARDS
   */
  return {
    x: sign * 900,
    z: -310,

    rotateY:
      sign * -68,

    scale: 0.46,

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
 * Used for local / directly previewable assets.
 *
 * Google Drive files open directly in a new tab.
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
            <ToolkitImage
              src={getToolkitImageUrl(asset)}
              alt={asset.title}
              sizes="90vw"
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
              target={
                isGoogleDriveFile(
                  asset.file_url,
                )
                  ? '_blank'
                  : undefined
              }
              rel={
                isGoogleDriveFile(
                  asset.file_url,
                )
                  ? 'noopener noreferrer'
                  : undefined
              }
              download={
                !isGoogleDriveFile(
                  asset.file_url,
                )
                  ? asset.file_name ||
                    undefined
                  : undefined
              }
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
   * --------------------------------------------------------
   * COMPLETE TOOLKIT COLLECTION
   * --------------------------------------------------------
   *
   * IMPORTANT FIX:
   *
   * The database/API assets are merged with the built-in
   * ONIRIA Investments assets.
   *
   * This means:
   *
   * Adding ONA Towers does NOT remove ONIRIA Investments.
   *
   * Adding ROHO does NOT remove ONIRIA Investments.
   *
   * Adding ROHO does NOT remove ONA Towers.
   *
   * A database asset replaces a fallback only if BOTH:
   *
   * project_slug + category
   *
   * match.
   */
  const allAssets =
    useMemo(
      () =>
        mergeToolkitAssets(
          initialAssets,
        ),
      [initialAssets],
    );

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
   * ONIRIA Investments:
   *
   * project_slug === "all-projects"
   *
   * ONA Towers:
   *
   * project_slug === "ona-towers"
   *
   * ROHO:
   *
   * project_slug === "roho"
   *
   * `all-projects` is therefore treated as ONIRIA
   * Investments itself, NOT as a request to combine all
   * projects.
   */
  const assets =
    useMemo(
      () =>
        getToolkitAssetsForProject(
          allAssets,
          projectSlug,
        ),
      [
        allAssets,
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
   * Protect active index if assets change while the same
   * project remains selected.
   */
  useEffect(() => {
    if (!assets.length) {
      setActive(0);
      return;
    }

    setActive(
      (current) =>
        Math.min(
          current,
          assets.length - 1,
        ),
    );
  }, [assets.length]);

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
        <Link
          href="/"
          prefetch
          className="toolkitBrand"
          aria-label="ONIRIA Investments home"
        >
          <span
            className="wordmarkLogo toolkitBrandWordmark"
            aria-hidden="true"
          />
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
                    /*
                     * Include project in the React key as an extra
                     * isolation guard.
                     */
                    key={`${asset.project_slug}:${asset.id}`}
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
                     * preview_image_url controls the visual card.
                     *
                     * file_url remains the actual downloadable /
                     * viewable material.
                     */}
                    <ToolkitImage
                      src={getToolkitImageUrl(asset)}
                      alt=""
                      sizes="(max-width: 800px) 72vw, 420px"
                      priority={isActive}
                    />

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
                         * DOWNLOAD
                         */}
                        {asset.is_downloadable && (
                          <a
                            href={
                              getDownloadUrl(
                                asset.file_url,
                              )
                            }
                            target={
                              isGoogleDriveFile(
                                asset.file_url,
                              )
                                ? '_blank'
                                : undefined
                            }
                            rel={
                              isGoogleDriveFile(
                                asset.file_url,
                              )
                                ? 'noopener noreferrer'
                                : undefined
                            }
                            download={
                              !isGoogleDriveFile(
                                asset.file_url,
                              )
                                ? asset.file_name ||
                                  undefined
                                : undefined
                            }
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
                         * VIEW / PREVIEW
                         *
                         * Google Drive opens externally.
                         *
                         * Other assets use the existing internal
                         * preview.
                         */}
                        {isGoogleDriveFile(
                          asset.file_url,
                        ) ? (
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
         * Do NOT substitute ONIRIA Investments assets when
         * ONA or ROHO genuinely has no public assets.
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

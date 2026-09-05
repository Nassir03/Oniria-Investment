'use client';

import {
  FormEvent,
  useEffect,
  useMemo,
  useState,
} from 'react';

import {
  AdminFrame,
  AdminState,
  getAdminAccessToken,
} from '@/components/AdminData';

import { ApiRequestError, authFetch } from '@/lib/api';

import type {
  ToolkitAsset,
  ToolkitCategory,
} from '@/lib/toolkit';

import {
  inferToolkitMediaType,
  normalizeToolkitLink,
  ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
  toolkitCategoryDefaultCover,
  toolkitProjects,
} from '@/lib/toolkit';

const categories: {
  value: ToolkitCategory;
  label: string;
}[] = [
  {
    value: 'gallery',
    label: 'Gallery',
  },
  {
    value: 'logo',
    label: 'Logo',
  },
  {
    value: 'project_brief',
    label: 'Project Briefing',
  },
  {
    value: 'brochure',
    label: 'Brochure',
  },
  {
    value: 'floor_plans',
    label: 'Floor Plans',
  },
  {
    value: 'project_film',
    label: 'Project Film',
  },
  {
    value: 'payment_plan',
    label: 'Payment Plan',
  },
  {
    value: 'material_boards',
    label: 'Material Boards',
  },
  {
    value: 'masterplan',
    label: 'Masterplan',
  },
];

function categoryLabel(value: ToolkitCategory) {
  return (
    categories.find(
      (entry) => entry.value === value,
    )?.label || value
  );
}

function projectName(projectSlug: string) {
  return (
    toolkitProjects.find(
      (project) => project.slug === projectSlug,
    )?.name || projectSlug
  );
}

function toolkitErrorMessage(
  err: unknown,
  fallback: string,
) {
  const message =
    err instanceof Error
      ? err.message
      : fallback;

  // Only describe an individual asset as missing when the API explicitly
  // identifies that condition. A generic route-level 404 used to be shown as
  // "Toolkit asset data could not be found", which hid deployment problems.
  if (
    err instanceof ApiRequestError &&
    err.code === 'toolkit_asset_not_found'
  ) {
    return 'That toolkit asset no longer exists. The library has been refreshed.';
  }

  if (
    err instanceof ApiRequestError &&
    err.status === 404
  ) {
    return 'The toolkit administration API is not available on the deployed backend.';
  }

  return message || fallback;
}

async function updateToolkitAsset(
  id: string,
  token: string,
  payload: Record<string, unknown>,
) {
  try {
    return await authFetch<ToolkitAsset>(
      `/admin/toolkit-assets/${id}`,
      token,
      {
        method: 'PATCH',
        body: JSON.stringify(payload),
      },
    );
  } catch (err) {
    if (!(err instanceof ApiRequestError) || err.status !== 405) throw err;
    return authFetch<ToolkitAsset>(
      `/admin/toolkit-assets/${id}/update`,
      token,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
    );
  }
}

async function deleteToolkitAsset(
  id: string,
  token: string,
) {
  try {
    await authFetch<void>(
      `/admin/toolkit-assets/${id}`,
      token,
      { method: 'DELETE' },
    );
  } catch (err) {
    if (!(err instanceof ApiRequestError) || err.status !== 405) throw err;
    await authFetch<void>(
      `/admin/toolkit-assets/${id}/delete`,
      token,
      { method: 'POST' },
    );
  }
}

export default function ToolkitAdminPage() {
  const [items, setItems] =
    useState<ToolkitAsset[]>([]);

  const [loading, setLoading] =
    useState(true);

  const [saving, setSaving] =
    useState(false);

  const [error, setError] =
    useState('');

  const [notice, setNotice] =
    useState('');

  /**
   * ---------------------------------------------------------
   * FORM STATE
   * ---------------------------------------------------------
   *
   * Toolkit files are link-based.
   */
  const [editingId, setEditingId] =
    useState<string | null>(null);

  const [projectSlug, setProjectSlug] =
    useState(
      ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
    );

  const [category, setCategory] =
    useState<ToolkitCategory>('gallery');

  const [title, setTitle] =
    useState('Gallery');

  const [assetLink, setAssetLink] =
    useState('');

  const [previewLink, setPreviewLink] =
    useState('');

  const [downloadable, setDownloadable] =
    useState(true);

  const [isPublic, setIsPublic] =
    useState(true);

  /**
   * Library filter is deliberately separate from form project.
   *
   * Changing "Show project" therefore cannot modify form data.
   */
  const [
    manageProjectSlug,
    setManageProjectSlug,
  ] = useState('all');

  /**
   * Exact item currently being edited.
   */
  const editingItem = useMemo(() => {
    if (!editingId) {
      return null;
    }

    return (
      items.find(
        (item) => item.id === editingId,
      ) || null
    );
  }, [editingId, items]);

  async function refresh() {
    setLoading(true);
    setError('');

    try {
      const token =
        await getAdminAccessToken();

      const loadedItems =
        await authFetch<ToolkitAsset[]>(
          '/admin/toolkit-assets',
          token,
        );

      /**
       * Always replace admin state with the COMPLETE API response.
       *
       * The endpoint is expected to return all database assets.
       */
      setItems(loadedItems);
    } catch (err) {
      setError(
        toolkitErrorMessage(
          err,
          'Unable to load toolkit assets.',
        ),
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void refresh();
  }, []);

  useEffect(() => {
    /**
     * Only auto-fill the default title while creating.
     *
     * Never alter an existing item's title during edit simply
     * because a category value changes.
     */
    if (!editingId) {
      setTitle(categoryLabel(category));
    }
  }, [category, editingId]);

  const visibleItems = useMemo(() => {
    if (manageProjectSlug === 'all') {
      return items;
    }

    /**
     * Strict project matching.
     *
     * `all-projects` is ONIRIA Investments here.
     * Only the literal filter value "all" means all projects.
     */
    return items.filter(
      (item) =>
        item.project_slug ===
        manageProjectSlug,
    );
  }, [items, manageProjectSlug]);

  const grouped = useMemo(() => {
    return toolkitProjects
      .map((project) => ({
        project,

        items: visibleItems.filter(
          (item) =>
            item.project_slug ===
            project.slug,
        ),
      }))
      .filter(
        (group) =>
          group.items.length > 0,
      );
  }, [visibleItems]);

  function resetForm(
    preferredProjectSlug:
      | string
      | undefined = undefined,
  ) {
    setEditingId(null);

    setProjectSlug(
      preferredProjectSlug ||
        ONIRIA_INVESTMENTS_TOOLKIT_SLUG,
    );

    setCategory('gallery');

    setTitle('Gallery');

    setAssetLink('');

    setPreviewLink('');

    setDownloadable(true);

    setIsPublic(true);
  }

  function edit(item: ToolkitAsset) {
    /**
     * Lock edit to the project's actual slug.
     *
     * The user can edit the asset, but cannot accidentally move it
     * from ONIRIA Investments to ONA or ROHO.
     */
    setEditingId(item.id);

    setProjectSlug(item.project_slug);

    setCategory(item.category);

    setTitle(item.title);

    setAssetLink(item.file_url);

    /**
     * Do not clutter the edit form with an automatic category
     * fallback cover.
     *
     * Show only a preview link explicitly saved to the item.
     */
    setPreviewLink(
      item.preview_image_url ===
        toolkitCategoryDefaultCover[
          item.category
        ]
        ? ''
        : item.preview_image_url || '',
    );

    setDownloadable(
      item.is_downloadable,
    );

    setIsPublic(item.is_public);

    setError('');

    setNotice(
      `Editing “${item.title}” in ${projectName(item.project_slug)}. The project is locked so this asset cannot accidentally move to another project.`,
    );

    window.scrollTo({
      top: 0,
      behavior: 'smooth',
    });
  }

  async function submit(
    event: FormEvent,
  ) {
    event.preventDefault();

    let normalizedAssetLink = '';

    let normalizedPreviewLink = '';

    try {
      normalizedAssetLink =
        normalizeToolkitLink(assetLink);

      normalizedPreviewLink =
        previewLink.trim()
          ? normalizeToolkitLink(
              previewLink,
            )
          : '';
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Enter a valid toolkit link.',
      );

      return;
    }

    if (!title.trim()) {
      setError(
        'Enter a display title.',
      );

      return;
    }

    /**
     * When editing, the original item's project always wins.
     *
     * This is a very important isolation guard.
     */
    const effectiveProjectSlug =
      editingItem?.project_slug ||
      projectSlug;

    /**
     * Do not allow accidental duplicate category creation for the
     * SAME project.
     *
     * A Gallery under ONIRIA and a Gallery under ONA are allowed.
     *
     * Two Gallery rows under ONA created accidentally are blocked.
     */
    if (!editingId) {
      const duplicate =
        items.find(
          (item) =>
            item.project_slug ===
              effectiveProjectSlug &&
            item.category === category,
        );

      if (duplicate) {
        setError(
          `${projectName(effectiveProjectSlug)} already has a ${categoryLabel(category)} asset. Use Edit on the existing asset instead of creating another one.`,
        );

        return;
      }
    }

    setSaving(true);

    setError('');

    setNotice('');

    try {
      const existing =
        editingId
          ? items.find(
              (item) =>
                item.id === editingId,
            ) || null
          : null;

      const resolvedPreviewLink =
        normalizedPreviewLink ||
        toolkitCategoryDefaultCover[
          category
        ];

      const keepsExistingFile =
        Boolean(
          existing &&
            normalizedAssetLink ===
              existing.file_url,
        );

      const keepsExistingPreview =
        Boolean(
          existing &&
            resolvedPreviewLink ===
              (
                existing.preview_image_url ||
                toolkitCategoryDefaultCover[
                  existing.category
                ]
              ),
        );

      const payload: Record<
        string,
        unknown
      > = {
        /**
         * CRITICAL:
         *
         * Editing keeps original project.
         * Creating uses selected project.
         */
        project_slug:
          effectiveProjectSlug,

        category,

        title: title.trim(),

        file_url:
          normalizedAssetLink,

        preview_image_url:
          resolvedPreviewLink,

        /**
         * Preserve old storage metadata only while the same old
         * object is still being referenced.
         */
        storage_path:
          keepsExistingFile
            ? existing?.storage_path ||
              null
            : null,

        preview_storage_path:
          keepsExistingPreview
            ? existing
                ?.preview_storage_path ||
              null
            : null,

        media_type:
          keepsExistingFile &&
          existing
            ? existing.media_type
            : inferToolkitMediaType(
                normalizedAssetLink,
                category,
              ),

        file_name:
          keepsExistingFile &&
          existing
            ? existing.file_name
            : title.trim(),

        file_size:
          keepsExistingFile &&
          existing
            ? existing.file_size
            : null,

        is_public: isPublic,

        is_downloadable:
          downloadable,

        sort_order:
          (categories.findIndex(
            (entry) =>
              entry.value ===
              category,
          ) +
            1) *
          10,
      };

      const token =
        await getAdminAccessToken();

      if (editingId) {
        const updated =
          await updateToolkitAsset(
            editingId,
            token,
            payload,
          );

        /**
         * Update only the exact item.
         *
         * Do not replace another project's collection.
         */
        setItems((current) =>
          current.map((entry) =>
            entry.id === updated.id
              ? updated
              : entry,
          ),
        );

        setNotice(
          `${projectName(effectiveProjectSlug)} toolkit link updated successfully.`,
        );
      } else {
        const created =
          await authFetch<ToolkitAsset>(
            '/admin/toolkit-assets',
            token,
            {
              method: 'POST',
              body: JSON.stringify(
                payload,
              ),
            },
          );

        /**
         * Add the new item while preserving all current projects.
         */
        setItems((current) => {
          const alreadyExists =
            current.some(
              (entry) =>
                entry.id ===
                created.id,
            );

          if (alreadyExists) {
            return current.map(
              (entry) =>
                entry.id ===
                created.id
                  ? created
                  : entry,
            );
          }

          return [
            ...current,
            created,
          ];
        });

        setNotice(
          `${projectName(effectiveProjectSlug)} toolkit link published successfully.`,
        );
      }

      /**
       * Keep the project that was just used selected.
       *
       * Example:
       * after adding ONA Gallery, the form remains on ONA Towers.
       */
      resetForm(
        effectiveProjectSlug,
      );

      /**
       * Refresh from server as final source of truth.
       *
       * The endpoint returns all DB assets.
       */
      await refresh();
    } catch (err) {
      if (
        editingId &&
        err instanceof ApiRequestError &&
        err.code === 'toolkit_asset_not_found'
      ) {
        resetForm(effectiveProjectSlug);
        await refresh();
        setNotice('That asset had already been removed. The library is now up to date.');
        return;
      }

      setError(
        toolkitErrorMessage(
          err,
          'Unable to save this toolkit asset.',
        ),
      );
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(
    item: ToolkitAsset,
  ) {
    setError('');

    setNotice('');

    try {
      const token =
        await getAdminAccessToken();

      /**
       * Only visibility is modified. Project is not changed.
       */
      const updated =
        await updateToolkitAsset(
          item.id,
          token,
          {
            is_public:
              !item.is_public,
          },
        );

      setItems((current) =>
        current.map((entry) =>
          entry.id === item.id
            ? updated
            : entry,
        ),
      );

      setNotice(
        updated.is_public
          ? `${projectName(item.project_slug)} asset published to the public toolkit.`
          : `${projectName(item.project_slug)} asset hidden from the public toolkit.`,
      );
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        err.code === 'toolkit_asset_not_found'
      ) {
        await refresh();
        setNotice('That asset had already been removed. The library is now up to date.');
        return;
      }

      setError(
        toolkitErrorMessage(
          err,
          'Unable to change publication status.',
        ),
      );
    }
  }

  async function remove(
    item: ToolkitAsset,
  ) {
    const ownerProjectName =
      projectName(
        item.project_slug,
      );

    if (
      !window.confirm(
        `Permanently remove “${item.title}” from ${ownerProjectName}? This does not affect the other projects.`,
      )
    ) {
      return;
    }

    setError('');

    setNotice('');

    try {
      const token =
        await getAdminAccessToken();

      /**
       * Delete exact asset ID only.
       */
      await deleteToolkitAsset(
        item.id,
        token,
      );

      /**
       * Remove exact local item only.
       */
      setItems((current) =>
        current.filter(
          (entry) =>
            entry.id !== item.id,
        ),
      );

      if (
        editingId === item.id
      ) {
        resetForm(
          item.project_slug,
        );
      }

      setNotice(
        `“${item.title}” removed from ${ownerProjectName}. Other projects were not changed.`,
      );
    } catch (err) {
      if (
        err instanceof ApiRequestError &&
        err.code === 'toolkit_asset_not_found'
      ) {
        setItems((current) =>
          current.filter((entry) => entry.id !== item.id),
        );
        if (editingId === item.id) resetForm(item.project_slug);
        await refresh();
        setNotice('That asset had already been removed. The library is now up to date.');
        return;
      }

      setError(
        toolkitErrorMessage(
          err,
          'Unable to remove the asset.',
        ),
      );
    }
  }

  return (
    <AdminFrame
      title="Project Toolkit"
      kicker="Media library"
    >
      <section className="adminWelcomeStrip adminWelcomePremium compact">
        <div>
          <p className="eyebrow">
            Toolkit management
          </p>

          <h2>
            Publish, update or
            remove every project
            asset.
          </h2>
        </div>

        <p>
          Paste a secure public
          link for each item.
          Assets are kept
          separately for ONIRIA
          Investments, ONA Towers
          and ROHO.
        </p>
      </section>

      <form
        className={`toolkitAdminForm ${
          editingId
            ? 'isEditing'
            : ''
        }`}
        onSubmit={submit}
      >
        <div className="toolkitAdminHeading">
          <div>
            <p className="eyebrow">
              {editingId
                ? 'Edit asset'
                : 'Add asset'}
            </p>

            <h2>
              {editingId
                ? 'Update project material'
                : 'Add material by link'}
            </h2>
          </div>

          <a
            href="/toolkit"
            target="_blank"
            rel="noreferrer"
          >
            Open public toolkit ↗
          </a>
        </div>

        <div className="toolkitAdminGrid">
          <label>
            <span>Project</span>

            <select
              value={projectSlug}
              disabled={
                Boolean(editingId)
              }
              onChange={(event) =>
                setProjectSlug(
                  event.target.value,
                )
              }
            >
              {toolkitProjects.map(
                (project) => (
                  <option
                    value={
                      project.slug
                    }
                    key={
                      project.slug
                    }
                  >
                    {project.name}
                  </option>
                ),
              )}
            </select>

            {editingId && (
              <small>
                Project is locked
                while editing so
                this asset cannot
                accidentally move
                to another
                project.
              </small>
            )}
          </label>

          <label>
            <span>Category</span>

            <select
              value={category}
              onChange={(event) =>
                setCategory(
                  event.target
                    .value as ToolkitCategory,
                )
              }
            >
              {categories.map(
                (entry) => (
                  <option
                    value={
                      entry.value
                    }
                    key={
                      entry.value
                    }
                  >
                    {entry.label}
                  </option>
                ),
              )}
            </select>
          </label>

          <label>
            <span>
              Display title
            </span>

            <input
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value,
                )
              }
              required
            />
          </label>

          <label className="toolkitAdminWideField">
            <span>
              Asset link
            </span>

            <input
              value={assetLink}
              onChange={(event) =>
                setAssetLink(
                  event.target.value,
                )
              }
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://drive.google.com/file/d/.../view"
              required
            />

            <small>
              Paste a public HTTPS
              link such as Google
              Drive, PDF, image,
              video or another
              public page. No
              storage setup is
              required.
            </small>
          </label>

          <label className="toolkitAdminWideField">
            <span>
              Preview image link
              (optional)
            </span>

            <input
              value={previewLink}
              onChange={(event) =>
                setPreviewLink(
                  event.target.value,
                )
              }
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://example.com/project-cover.jpg"
            />

            <small>
              Use a direct image
              link for a custom
              card cover. Leave
              blank to use the
              ONIRIA category
              cover.
            </small>
          </label>
        </div>

        <div className="toolkitAdminChecks">
          <label>
            <input
              type="checkbox"
              checked={isPublic}
              onChange={(event) =>
                setIsPublic(
                  event.target
                    .checked,
                )
              }
            />

            Visible publicly
          </label>

          <label>
            <input
              type="checkbox"
              checked={
                downloadable
              }
              onChange={(event) =>
                setDownloadable(
                  event.target
                    .checked,
                )
              }
            />

            Allow download
          </label>
        </div>

        {error && (
          <div className="adminNotice error">
            {error}
          </div>
        )}

        {notice && (
          <div className="adminNotice">
            {notice}
          </div>
        )}

        <div className="toolkitAdminFormActions">
          <button
            className="button buttonNavy"
            disabled={saving}
          >
            {saving
              ? 'Saving…'
              : editingId
                ? 'Save changes'
                : 'Publish link'}{' '}
            <span>→</span>
          </button>

          {editingId && (
            <button
              type="button"
              className="toolkitAdminCancel"
              onClick={() =>
                resetForm(
                  editingItem
                    ?.project_slug,
                )
              }
              disabled={saving}
            >
              Cancel edit
            </button>
          )}
        </div>
      </form>

      <section className="toolkitAdminLibrary">
        <div className="toolkitAdminHeading toolkitAdminLibraryHeading">
          <div>
            <p className="eyebrow">
              Library
            </p>

            <h2>
              Manage published
              assets
            </h2>
          </div>

          <label className="toolkitAdminProjectFilter">
            <span>
              Show project
            </span>

            <select
              value={
                manageProjectSlug
              }
              onChange={(event) =>
                setManageProjectSlug(
                  event.target.value,
                )
              }
            >
              <option value="all">
                All projects
              </option>

              {toolkitProjects.map(
                (project) => (
                  <option
                    value={
                      project.slug
                    }
                    key={
                      project.slug
                    }
                  >
                    {project.name}
                  </option>
                ),
              )}
            </select>
          </label>
        </div>

        <AdminState
          loading={loading}
          error={
            error &&
            !items.length
              ? error
              : undefined
          }
          empty={
            !loading &&
            !visibleItems.length
              ? 'No toolkit assets for this project yet.'
              : undefined
          }
        />

        {grouped.map(
          ({
            project,
            items: groupItems,
          }) => (
            <div
              className="toolkitAdminProject"
              key={project.slug}
            >
              <div className="toolkitAdminProjectTitle">
                <h3>
                  {project.name}
                </h3>

                <span>
                  {
                    groupItems.length
                  }{' '}
                  {groupItems.length ===
                  1
                    ? 'asset'
                    : 'assets'}
                </span>
              </div>

              <div className="toolkitAdminRows">
                {groupItems.map(
                  (item) => (
                    <article
                      key={item.id}
                      className={
                        editingId ===
                        item.id
                          ? 'isEditing'
                          : ''
                      }
                    >
                      <div>
                        <small>
                          {categoryLabel(
                            item.category,
                          )}
                        </small>

                        <strong>
                          {item.title}
                        </strong>

                        <span>
                          {item.media_type.toUpperCase()}{' '}
                          ·{' '}
                          {item.is_public
                            ? 'Public'
                            : 'Hidden'}{' '}
                          · Link
                        </span>
                      </div>

                      <div className="toolkitAdminRowActions">
                        <a
                          href={
                            item.file_url
                          }
                          target="_blank"
                          rel="noopener noreferrer"
                        >
                          Open link
                        </a>

                        <button
                          type="button"
                          onClick={() =>
                            edit(
                              item,
                            )
                          }
                        >
                          Edit
                        </button>

                        <button
                          type="button"
                          onClick={() =>
                            void toggleVisibility(
                              item,
                            )
                          }
                        >
                          {item.is_public
                            ? 'Hide'
                            : 'Publish'}
                        </button>

                        <button
                          type="button"
                          className="danger"
                          onClick={() =>
                            void remove(
                              item,
                            )
                          }
                        >
                          Remove
                        </button>
                      </div>
                    </article>
                  ),
                )}
              </div>
            </div>
          ),
        )}
      </section>
    </AdminFrame>
  );
}

'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminFrame, AdminState, getAdminAccessToken } from '@/components/AdminData';
import { authFetch } from '@/lib/api';
import type { ToolkitAsset, ToolkitCategory } from '@/lib/toolkit';
import {
  inferToolkitMediaType,
  normalizeToolkitLink,
  toolkitCategoryDefaultCover,
  toolkitProjects,
} from '@/lib/toolkit';

const categories: { value: ToolkitCategory; label: string }[] = [
  { value: 'gallery', label: 'Gallery' },
  { value: 'logo', label: 'Logo' },
  { value: 'project_brief', label: 'Project Briefing' },
  { value: 'brochure', label: 'Brochure' },
  { value: 'floor_plans', label: 'Floor Plans' },
  { value: 'project_film', label: 'Project Film' },
  { value: 'payment_plan', label: 'Payment Plan' },
  { value: 'material_boards', label: 'Material Boards' },
  { value: 'masterplan', label: 'Masterplan' },
];

function categoryLabel(value: ToolkitCategory) {
  return categories.find((entry) => entry.value === value)?.label || value;
}

export default function ToolkitAdminPage() {
  const [items, setItems] = useState<ToolkitAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Form state. Toolkit media is intentionally link-based so publishing does
  // not depend on a separately configured storage service.
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState('all-projects');
  const [category, setCategory] = useState<ToolkitCategory>('gallery');
  const [title, setTitle] = useState('Gallery');
  const [assetLink, setAssetLink] = useState('');
  const [previewLink, setPreviewLink] = useState('');
  const [downloadable, setDownloadable] = useState(true);
  const [isPublic, setIsPublic] = useState(true);

  // Library filter: selecting ONA Towers shows ONA Towers only.
  const [manageProjectSlug, setManageProjectSlug] = useState('all');

  async function refresh() {
    setLoading(true);
    setError('');
    try {
      const token = await getAdminAccessToken();
      setItems(await authFetch<ToolkitAsset[]>('/admin/toolkit-assets', token));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load toolkit assets.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { void refresh(); }, []);

  useEffect(() => {
    // Only auto-fill category title while creating a new item.
    if (!editingId) setTitle(categoryLabel(category));
  }, [category, editingId]);

  const visibleItems = useMemo(() => {
    if (manageProjectSlug === 'all') return items;
    return items.filter((item) => item.project_slug === manageProjectSlug);
  }, [items, manageProjectSlug]);

  const grouped = useMemo(() => {
    return toolkitProjects
      .map((project) => ({
        project,
        items: visibleItems.filter((item) => item.project_slug === project.slug),
      }))
      .filter((group) => group.items.length);
  }, [visibleItems]);

  function resetForm() {
    setEditingId(null);
    setProjectSlug('all-projects');
    setCategory('gallery');
    setTitle('Gallery');
    setAssetLink('');
    setPreviewLink('');
    setDownloadable(true);
    setIsPublic(true);
  }

  function edit(item: ToolkitAsset) {
    setEditingId(item.id);
    setProjectSlug(item.project_slug);
    setCategory(item.category);
    setTitle(item.title);
    setAssetLink(item.file_url);
    // Do not clutter the edit form with an automatic category cover. Only
    // show a preview URL that was explicitly saved for this asset.
    setPreviewLink(
      item.preview_image_url === toolkitCategoryDefaultCover[item.category]
        ? ''
        : item.preview_image_url || '',
    );
    setDownloadable(item.is_downloadable);
    setIsPublic(item.is_public);
    setError('');
    setNotice(`Editing “${item.title}”. Update the links or publication settings, then save.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();

    let normalizedAssetLink = '';
    let normalizedPreviewLink = '';
    try {
      normalizedAssetLink = normalizeToolkitLink(assetLink);
      normalizedPreviewLink = previewLink.trim() ? normalizeToolkitLink(previewLink) : '';
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Enter a valid toolkit link.');
      return;
    }

    if (!title.trim()) {
      setError('Enter a display title.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const existing = editingId ? items.find((item) => item.id === editingId) : null;
      const resolvedPreviewLink = normalizedPreviewLink || toolkitCategoryDefaultCover[category];
      const keepsExistingFile = Boolean(existing && normalizedAssetLink === existing.file_url);
      const keepsExistingPreview = Boolean(
        existing && resolvedPreviewLink === (existing.preview_image_url || toolkitCategoryDefaultCover[existing.category]),
      );

      const payload: Record<string, unknown> = {
        project_slug: projectSlug,
        category,
        title: title.trim(),
        file_url: normalizedAssetLink,
        preview_image_url: resolvedPreviewLink,
        // Preserve storage metadata only while an existing stored object is
        // still being referenced. Switching to a pasted link clears the old
        // storage path so backend cleanup can safely remove the obsolete file.
        storage_path: keepsExistingFile ? existing?.storage_path || null : null,
        preview_storage_path: keepsExistingPreview ? existing?.preview_storage_path || null : null,
        media_type: keepsExistingFile && existing
          ? existing.media_type
          : inferToolkitMediaType(normalizedAssetLink, category),
        file_name: keepsExistingFile && existing ? existing.file_name : title.trim(),
        file_size: keepsExistingFile && existing ? existing.file_size : null,
        is_public: isPublic,
        is_downloadable: downloadable,
        sort_order: (categories.findIndex((entry) => entry.value === category) + 1) * 10,
      };

      const token = await getAdminAccessToken();
      if (editingId) {
        await authFetch<ToolkitAsset>(`/admin/toolkit-assets/${editingId}`, token, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setNotice('Toolkit link updated successfully and is ready for the public website.');
      } else {
        await authFetch<ToolkitAsset>('/admin/toolkit-assets', token, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotice('Toolkit link published successfully and is ready for the public website.');
      }

      resetForm();
      await refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to save this toolkit asset.');
    } finally {
      setSaving(false);
    }
  }

  async function toggleVisibility(item: ToolkitAsset) {
    setError('');
    setNotice('');
    try {
      const token = await getAdminAccessToken();
      const updated = await authFetch<ToolkitAsset>(`/admin/toolkit-assets/${item.id}`, token, {
        method: 'PATCH',
        body: JSON.stringify({ is_public: !item.is_public }),
      });
      setItems((current) => current.map((entry) => entry.id === item.id ? updated : entry));
      setNotice(updated.is_public ? 'Asset published to the public toolkit.' : 'Asset hidden from the public toolkit.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to change publication status.');
    }
  }

  async function remove(item: ToolkitAsset) {
    const projectName = toolkitProjects.find((project) => project.slug === item.project_slug)?.name || item.project_slug;
    if (!window.confirm(`Permanently remove “${item.title}” from ${projectName}?`)) return;

    setError('');
    setNotice('');
    try {
      const token = await getAdminAccessToken();
      await authFetch(`/admin/toolkit-assets/${item.id}`, token, { method: 'DELETE' });
      setItems((current) => current.filter((entry) => entry.id !== item.id));
      if (editingId === item.id) resetForm();
      setNotice('Toolkit asset removed.');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to remove the asset.');
    }
  }

  return (
    <AdminFrame title="Project Toolkit" kicker="Media library">
      <section className="adminWelcomeStrip adminWelcomePremium compact">
        <div><p className="eyebrow">Toolkit management</p><h2>Publish, update or remove every project asset.</h2></div>
        <p>Paste a secure public link for each item. Public visitors immediately see published entries for the project they select.</p>
      </section>

      <form className={`toolkitAdminForm ${editingId ? 'isEditing' : ''}`} onSubmit={submit}>
        <div className="toolkitAdminHeading">
          <div>
            <p className="eyebrow">{editingId ? 'Edit asset' : 'Add asset'}</p>
            <h2>{editingId ? 'Update project material' : 'Add material by link'}</h2>
          </div>
          <a href="/toolkit" target="_blank" rel="noreferrer">Open public toolkit ↗</a>
        </div>

        <div className="toolkitAdminGrid">
          <label>
            <span>Project</span>
            <select value={projectSlug} onChange={(e) => setProjectSlug(e.target.value)}>
              {toolkitProjects.map((project) => <option value={project.slug} key={project.slug}>{project.name}</option>)}
            </select>
          </label>
          <label>
            <span>Category</span>
            <select value={category} onChange={(e) => setCategory(e.target.value as ToolkitCategory)}>
              {categories.map((entry) => <option value={entry.value} key={entry.value}>{entry.label}</option>)}
            </select>
          </label>
          <label>
            <span>Display title</span>
            <input value={title} onChange={(e) => setTitle(e.target.value)} required />
          </label>
          <label className="toolkitAdminWideField">
            <span>Asset link</span>
            <input
              value={assetLink}
              onChange={(e) => setAssetLink(e.target.value)}
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://drive.google.com/file/d/.../view"
              required
            />
            <small>Paste a public HTTPS link (Google Drive, PDF, image, video or another public page). No storage setup is required.</small>
          </label>
          <label className="toolkitAdminWideField">
            <span>Preview image link (optional)</span>
            <input
              value={previewLink}
              onChange={(e) => setPreviewLink(e.target.value)}
              type="text"
              inputMode="url"
              autoCapitalize="none"
              autoCorrect="off"
              spellCheck={false}
              placeholder="https://example.com/project-cover.jpg"
            />
            <small>Use a direct image link for a custom card cover. Leave blank to use the ONIRIA category cover.</small>
          </label>
        </div>

        <div className="toolkitAdminChecks">
          <label><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Visible publicly</label>
          <label><input type="checkbox" checked={downloadable} onChange={(e) => setDownloadable(e.target.checked)} /> Allow download</label>
        </div>

        {error && <div className="adminNotice error">{error}</div>}
        {notice && <div className="adminNotice">{notice}</div>}

        <div className="toolkitAdminFormActions">
          <button className="button buttonNavy" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish link'} <span>→</span></button>
          {editingId && <button type="button" className="toolkitAdminCancel" onClick={resetForm} disabled={saving}>Cancel edit</button>}
        </div>
      </form>

      <section className="toolkitAdminLibrary">
        <div className="toolkitAdminHeading toolkitAdminLibraryHeading">
          <div><p className="eyebrow">Library</p><h2>Manage published assets</h2></div>
          <label className="toolkitAdminProjectFilter">
            <span>Show project</span>
            <select value={manageProjectSlug} onChange={(e) => setManageProjectSlug(e.target.value)}>
              <option value="all">All projects</option>
              {toolkitProjects.map((project) => <option value={project.slug} key={project.slug}>{project.name}</option>)}
            </select>
          </label>
        </div>

        <AdminState
          loading={loading}
          error={error && !items.length ? error : undefined}
          empty={!loading && !visibleItems.length ? 'No toolkit assets for this project yet.' : undefined}
        />

        {grouped.map(({ project, items: groupItems }) => (
          <div className="toolkitAdminProject" key={project.slug}>
            <div className="toolkitAdminProjectTitle">
              <h3>{project.name}</h3>
              <span>{groupItems.length} {groupItems.length === 1 ? 'asset' : 'assets'}</span>
            </div>
            <div className="toolkitAdminRows">
              {groupItems.map((item) => (
                <article key={item.id} className={editingId === item.id ? 'isEditing' : ''}>
                  <div>
                    <small>{categoryLabel(item.category)}</small>
                    <strong>{item.title}</strong>
                    <span>{item.media_type.toUpperCase()} · {item.is_public ? 'Public' : 'Hidden'} · Link</span>
                  </div>
                  <div className="toolkitAdminRowActions">
                    <a href={item.file_url} target="_blank" rel="noopener noreferrer">Open link</a>
                    <button type="button" onClick={() => edit(item)}>Edit</button>
                    <button type="button" onClick={() => void toggleVisibility(item)}>{item.is_public ? 'Hide' : 'Publish'}</button>
                    <button type="button" className="danger" onClick={() => void remove(item)}>Remove</button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        ))}
      </section>
    </AdminFrame>
  );
}

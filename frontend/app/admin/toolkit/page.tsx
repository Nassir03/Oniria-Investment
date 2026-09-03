'use client';

import { FormEvent, useEffect, useMemo, useState } from 'react';
import { AdminFrame, AdminState, getAdminAccessToken } from '@/components/AdminData';
import { authFetch } from '@/lib/api';
import { supabase } from '@/lib/supabase';
import type { ToolkitAsset, ToolkitCategory } from '@/lib/toolkit';
import { toolkitProjects } from '@/lib/toolkit';

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

function mediaType(file: File): ToolkitAsset['media_type'] {
  if (file.type === 'application/pdf') return 'pdf';
  if (file.type.startsWith('video/')) return 'video';
  if (file.type.startsWith('image/')) return 'image';
  return 'document';
}

export default function ToolkitAdminPage() {
  const [items, setItems] = useState<ToolkitAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');

  // Form state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [projectSlug, setProjectSlug] = useState('all-projects');
  const [category, setCategory] = useState<ToolkitCategory>('gallery');
  const [title, setTitle] = useState('Gallery');
  const [file, setFile] = useState<File | null>(null);
  const [previewFile, setPreviewFile] = useState<File | null>(null);
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

  async function uploadFile(upload: File, folder: string) {
    if (!supabase) throw new Error('Supabase is not configured in the frontend environment.');
    const token = await getAdminAccessToken();
    const signed = await authFetch<{ path: string; token: string; signed_url?: string | null }>('/admin/uploads/sign', token, {
      method: 'POST',
      body: JSON.stringify({ filename: upload.name, content_type: upload.type, size_bytes: upload.size, folder }),
    });
    const bucket = process.env.NEXT_PUBLIC_SUPABASE_STORAGE_BUCKET || 'oniria-media';
    const result = await supabase.storage.from(bucket).uploadToSignedUrl(signed.path, signed.token, upload, { contentType: upload.type });
    if (result.error) throw result.error;
    const publicUrl = supabase.storage.from(bucket).getPublicUrl(signed.path).data.publicUrl;
    return { url: publicUrl, path: signed.path };
  }

  function clearFileInputs() {
    const fileInput = document.getElementById('toolkit-file') as HTMLInputElement | null;
    const previewInput = document.getElementById('toolkit-preview') as HTMLInputElement | null;
    if (fileInput) fileInput.value = '';
    if (previewInput) previewInput.value = '';
  }

  function resetForm() {
    setEditingId(null);
    setProjectSlug('all-projects');
    setCategory('gallery');
    setTitle('Gallery');
    setFile(null);
    setPreviewFile(null);
    setDownloadable(true);
    setIsPublic(true);
    clearFileInputs();
  }

  function edit(item: ToolkitAsset) {
    setEditingId(item.id);
    setProjectSlug(item.project_slug);
    setCategory(item.category);
    setTitle(item.title);
    setFile(null);
    setPreviewFile(null);
    setDownloadable(item.is_downloadable);
    setIsPublic(item.is_public);
    clearFileInputs();
    setError('');
    setNotice(`Editing “${item.title}”. You can change details without uploading the file again.`);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function submit(event: FormEvent) {
    event.preventDefault();
    const existing = editingId ? items.find((item) => item.id === editingId) : null;
    if (!existing && !file) {
      setError('Choose a toolkit file first.');
      return;
    }

    setSaving(true);
    setError('');
    setNotice('');

    try {
      const payload: Record<string, unknown> = {
        project_slug: projectSlug,
        category,
        title: title.trim(),
        is_public: isPublic,
        is_downloadable: downloadable,
        sort_order: (categories.findIndex((entry) => entry.value === category) + 1) * 10,
      };

      if (file) {
        const uploaded = await uploadFile(file, `toolkit/${projectSlug}/${category}`);
        payload.file_url = uploaded.url;
        payload.storage_path = uploaded.path;
        payload.media_type = mediaType(file);
        payload.file_name = file.name;
        payload.file_size = file.size;

        // When replacing an image whose preview was the main image, keep them in sync.
        if (mediaType(file) === 'image' && (!existing?.preview_storage_path || existing.preview_image_url === existing.file_url)) {
          payload.preview_image_url = uploaded.url;
          payload.preview_storage_path = null;
        }
      }

      if (previewFile) {
        const preview = await uploadFile(previewFile, `toolkit/${projectSlug}/${category}/previews`);
        payload.preview_image_url = preview.url;
        payload.preview_storage_path = preview.path;
      }

      const token = await getAdminAccessToken();
      if (existing) {
        await authFetch<ToolkitAsset>(`/admin/toolkit-assets/${existing.id}`, token, {
          method: 'PATCH',
          body: JSON.stringify(payload),
        });
        setNotice('Toolkit asset updated successfully.');
      } else {
        // A new PDF/video without a preview can still be published. The public
        // card will use the file URL; for best presentation upload a preview image.
        if (!payload.preview_image_url && file) {
          const uploadedUrl = payload.file_url as string;
          payload.preview_image_url = uploadedUrl;
        }
        await authFetch<ToolkitAsset>('/admin/toolkit-assets', token, {
          method: 'POST',
          body: JSON.stringify(payload),
        });
        setNotice('Toolkit asset published successfully.');
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
    if (!window.confirm(`Permanently remove “${item.title}” from ${projectName}? The stored toolkit file will also be removed.`)) return;

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
        <p>Each item belongs to one project. Public visitors only see files published for the project they select.</p>
      </section>

      <form className={`toolkitAdminForm ${editingId ? 'isEditing' : ''}`} onSubmit={submit}>
        <div className="toolkitAdminHeading">
          <div>
            <p className="eyebrow">{editingId ? 'Edit asset' : 'Add asset'}</p>
            <h2>{editingId ? 'Update project material' : 'Upload new material'}</h2>
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

          <label>
            <span>{editingId ? 'Replace main file (optional)' : 'Main file'}</span>
            <input id="toolkit-file" type="file" accept="image/*,application/pdf,video/mp4,video/webm" onChange={(e) => setFile(e.target.files?.[0] || null)} required={!editingId} />
          </label>
          <label>
            <span>{editingId ? 'Replace preview image (optional)' : 'Preview image (optional)'}</span>
            <input id="toolkit-preview" type="file" accept="image/*" onChange={(e) => setPreviewFile(e.target.files?.[0] || null)} />
          </label>
        </div>

        <div className="toolkitAdminChecks">
          <label><input type="checkbox" checked={isPublic} onChange={(e) => setIsPublic(e.target.checked)} /> Visible publicly</label>
          <label><input type="checkbox" checked={downloadable} onChange={(e) => setDownloadable(e.target.checked)} /> Allow download</label>
        </div>

        {error && <div className="adminNotice error">{error}</div>}
        {notice && <div className="adminNotice">{notice}</div>}

        <div className="toolkitAdminFormActions">
          <button className="button buttonNavy" disabled={saving}>{saving ? 'Saving…' : editingId ? 'Save changes' : 'Publish asset'} <span>→</span></button>
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
                    <span>{item.media_type.toUpperCase()} · {item.is_public ? 'Public' : 'Hidden'}</span>
                  </div>
                  <div className="toolkitAdminRowActions">
                    <a href={item.file_url} target="_blank" rel="noreferrer">Preview</a>
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

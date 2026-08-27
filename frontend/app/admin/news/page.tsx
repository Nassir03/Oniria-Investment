'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminFrame, AdminState, getAdminAccessToken, useAdminSession } from '@/components/AdminData';
import EditorialImage from '@/components/EditorialImage';
import { authFetch } from '@/lib/api';

type News = {
  id:string;
  title:string;
  slug:string;
  excerpt?:string|null;
  body:Record<string,unknown>;
  hero_image_url?:string|null;
  hero_image_alt?:string|null;
  seo_title?:string|null;
  meta_description?:string|null;
  status:string;
  published_at?:string|null;
  updated_at:string;
};
type Result = { items:News[]; meta:{total:number} };

function slugify(value:string) {
  return value.toLowerCase().trim().replace(/[^a-z0-9]+/g,'-').replace(/^-+|-+$/g,'');
}

function bodyToText(body:Record<string,unknown> | null | undefined): string {
  if (!body) return '';
  if (typeof (body as any).text === 'string') return (body as any).text;
  if (Array.isArray((body as any).content)) {
    return (body as any).content.map((node:any) => {
      if (Array.isArray(node?.content)) return node.content.map((child:any)=>child?.text || '').join('');
      return node?.text || '';
    }).filter(Boolean).join('\n\n');
  }
  return '';
}

function textToBody(text:string) {
  return {
    type:'doc',
    content:text.split(/\n\s*\n/).map((paragraph)=>paragraph.trim()).filter(Boolean).map((paragraph)=>({
      type:'paragraph',
      content:[{type:'text',text:paragraph}],
    })),
  };
}


export default function Page() {
  const [data,setData]=useState<Result|null>(null);
  const [loading,setLoading]=useState(true);
  const [error,setError]=useState('');
  const [notice,setNotice]=useState('');
  const [saving,setSaving]=useState(false);
  const [editing,setEditing]=useState<News|null>(null);
  const [creating,setCreating]=useState(false);
  const [uploadingImage,setUploadingImage]=useState(false);
  const [uploadedImageUrl,setUploadedImageUrl]=useState('');
  const { profile } = useAdminSession();
  const canPublish = Boolean(profile?.roles?.some((role)=>role === 'admin' || role === 'editor'));
  const canDelete = Boolean(profile?.roles?.includes('admin'));

  function upsertArticle(article: News, isNew = false) {
    setData((current) => {
      if (!current) return { items: [article], meta: { total: 1 } };
      const exists = current.items.some((item) => item.id === article.id);
      return {
        items: [article, ...current.items.filter((item) => item.id !== article.id)],
        meta: { total: current.meta.total + (isNew && !exists ? 1 : 0) },
      };
    });
  }

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{ setData(await authFetch<Result>('/admin/news?page_size=100',await getAdminAccessToken())); }
    catch(err){ setError(err instanceof Error?err.message:'Unable to load newsroom.'); }
    finally{ setLoading(false); }
  },[]);

  useEffect(()=>{void load();},[load]);
  const published=useMemo(()=>data?.items.filter((item)=>item.status==='published').length||0,[data]);
  const drafts=useMemo(()=>data?.items.filter((item)=>item.status==='draft').length||0,[data]);

  async function uploadHeroImage(file:File){
    setUploadingImage(true);setError('');setNotice('');
    try{
      const fd=new FormData();
      fd.append('file',file);
      const result=await authFetch<{url:string;path:string}>('/admin/uploads/newsroom-image',await getAdminAccessToken(),{method:'POST',body:fd});
      setUploadedImageUrl(result.url);
      setNotice('Image uploaded. Save the article to attach it to this story.');
    }catch(err){setError(err instanceof Error?err.message:'Unable to upload image.');}
    finally{setUploadingImage(false);}
  }

  async function saveArticle(event:FormEvent<HTMLFormElement>){
    event.preventDefault();
    setSaving(true);setError('');setNotice('');
    const form=event.currentTarget;
    const fd=new FormData(form);
    const title=String(fd.get('title')||'').trim();
    const payload={
      title,
      slug:String(fd.get('slug')||slugify(title)).trim(),
      excerpt:String(fd.get('excerpt')||'').trim()||null,
      body:textToBody(String(fd.get('body')||'')),
      hero_image_url:uploadedImageUrl||String(fd.get('hero_image_url')||'').trim()||null,
      hero_image_alt:String(fd.get('hero_image_alt')||'').trim()||null,
      seo_title:String(fd.get('seo_title')||'').trim()||null,
      meta_description:String(fd.get('meta_description')||'').trim()||null,
    };
    try{
      const access=await getAdminAccessToken();
      if(editing){
        const updated=await authFetch<News>(`/admin/news/${editing.id}`,access,{method:'PATCH',body:JSON.stringify(payload)});
        upsertArticle(updated);
        setEditing(updated);
        setUploadedImageUrl(updated.hero_image_url || '');
        setNotice(updated.status === 'published' ? 'Changes saved. The public Newsroom will use this updated version immediately.' : 'Newsroom article saved.');
      }else{
        const created=await authFetch<News>('/admin/news',access,{method:'POST',body:JSON.stringify({...payload,category_ids:[]})});
        upsertArticle(created, true);
        setEditing(created);
        setCreating(false);
        setUploadedImageUrl(created.hero_image_url || '');
        setNotice('Draft article created.');
      }
    }catch(err){setError(err instanceof Error?err.message:'Unable to save article.');}
    finally{setSaving(false);}
  }

  async function action(item:News,kind:'publish'|'unpublish'|'archive'){
    if(kind==='archive'&&!window.confirm(`Delete “${item.title}”? It will be removed from the public Newsroom.`))return;
    setSaving(true);setError('');setNotice('');
    try{
      const access=await getAdminAccessToken();
      if(kind==='archive') {
        await authFetch<void>(`/admin/news/${item.id}`,access,{method:'DELETE'});
        setData((current) => current ? { items: current.items.filter((entry)=>entry.id !== item.id), meta: { total: Math.max(0, current.meta.total - 1) } } : current);
        setNotice('Article deleted from the Newsroom.');
      } else {
        const updated = await authFetch<News>(`/admin/news/${item.id}/${kind}`,access,{method:'POST'});
        upsertArticle(updated);
        if (editing?.id === item.id) setEditing(updated);
        setNotice(kind === 'publish'
          ? 'Published — this story is live and will remain visible until an administrator unpublishes or deletes it.'
          : 'Moved back to draft and removed from the public Newsroom.');
      }
      if(kind === 'archive' && editing?.id===item.id){setEditing(null);setUploadedImageUrl('');}
    }catch(err){setError(err instanceof Error?err.message:'Newsroom action failed.');}
    finally{setSaving(false);}
  }

  const formItem=editing;
  return <AdminFrame title="Newsroom" kicker="Editorial publishing">
    <div className="adminMetrics adminMetricsModern newsroomMetrics">
      <article><span>All stories</span><strong>{data?.meta.total??'—'}</strong><small>Draft and published</small></article>
      <article><span>Live stories</span><strong>{loading&&!data?'—':published}</strong><small>Live on the public website</small></article>
      <article><span>In preparation</span><strong>{loading&&!data?'—':drafts}</strong><small>Ready for review</small></article>
    </div>

    <div className="adminEditorialToolbar">
      <div><p className="eyebrow">Newsroom planning</p><h2>Shape the story. Share it with confidence.</h2><p>Published stories appear automatically in the public ONIRIA Newsroom and stay live until an authorised administrator unpublishes or deletes them.</p></div>
      <button className="adminPrimaryButton" onClick={()=>{setEditing(null);setUploadedImageUrl('');setCreating(true);}}>New article <span>＋</span></button>
    </div>

    <AdminState loading={loading} error={error} empty={!loading&&!error&&!data?.items?.length?'No newsroom records found.':undefined}/>

    <div className="adminNewsWorkspace">
      <section className="adminNewsList">
        {data?.items.map((item)=><article key={item.id} className={`adminNewsCard ${editing?.id===item.id?'active':''}`}>
          <button className="adminNewsCardMain" onClick={()=>{setEditing(item);setUploadedImageUrl(item.hero_image_url||'');setCreating(false);}}>
            <span className="adminNewsCardThumb" aria-hidden="true">
              <EditorialImage
                src={item.hero_image_url}
                alt={item.hero_image_alt || item.title}
                sizes="132px"
                fallbackTitle="ONIRIA"
                fallbackLabel="Story image"
              />
            </span>
            <span className="adminNewsCardCopy">
              <span className="statusPill">{item.status}</span>
              <h3>{item.title}</h3>
              <p>{item.excerpt||'No excerpt yet.'}</p>
              <small>Updated {new Date(item.updated_at).toLocaleDateString()}</small>
            </span>
          </button>
          <div className="adminNewsActions">
            {canPublish ? (item.status==='published'?<button onClick={()=>action(item,'unpublish')} disabled={saving}>Unpublish</button>:<button onClick={()=>action(item,'publish')} disabled={saving}>Publish</button>) : null}
            {item.status === 'published' ? <a href={`/newsroom/${item.slug}`} target="_blank" rel="noreferrer">View live ↗</a> : null}
            {canDelete ? <button className="danger" onClick={()=>action(item,'archive')} disabled={saving}>Delete</button> : null}
          </div>
        </article>)}
      </section>

      {(creating||formItem)&&<section className="adminEditorPanel">
        <div className="adminSectionTitle inline"><div><p className="eyebrow">{formItem?'Edit story':'New story'}</p><h2>{formItem?'Refine the article.':'Create a newsroom update.'}</h2></div><button className="adminGhostButton" onClick={()=>{setCreating(false);setEditing(null);setUploadedImageUrl('');}}>Close</button></div>
        <form className="adminForm" key={formItem?.id||'new'} onSubmit={saveArticle}>
          <label><span>Headline</span><input name="title" defaultValue={formItem?.title||''} required onBlur={(event)=>{const slug=(event.currentTarget.form?.elements.namedItem('slug') as HTMLInputElement|null);if(slug&&!slug.value)slug.value=slugify(event.currentTarget.value);}} /></label>
          <label><span>Slug</span><input name="slug" defaultValue={formItem?.slug||''} required placeholder="oniria-project-update" /></label>
          <label><span>Excerpt</span><textarea name="excerpt" rows={3} defaultValue={formItem?.excerpt||''} placeholder="A concise introduction for the Newsroom listing." /></label>
          <label className="adminArticleBodyField"><span>Article body</span><textarea name="body" rows={10} defaultValue={bodyToText(formItem?.body)} required placeholder="Write the article in clear paragraphs. Separate paragraphs with a blank line." /></label>
          <div className="adminImageUploadField">
            <div className="adminImageUploadCopy">
              <span>Story image</span>
              <strong>Add a strong visual for this story.</strong>
              <p>Use a clear landscape image so the article looks polished across the public Newsroom. JPG, PNG, WEBP or AVIF · maximum 10 MB.</p>
            </div>
            <label className="adminUploadButton">
              <input
                type="file"
                accept="image/jpeg,image/png,image/webp,image/avif"
                onChange={(event)=>{const file=event.target.files?.[0];if(file)void uploadHeroImage(file);}}
                disabled={uploadingImage}
              />
              {uploadingImage?'Uploading…':'Upload image'} <span>↑</span>
            </label>
            {(uploadedImageUrl||formItem?.hero_image_url)&&<div className="adminImagePreview">
              <img src={uploadedImageUrl||formItem?.hero_image_url||''} alt="Newsroom hero preview" />
              <span>Image ready</span>
            </div>}
            <input name="hero_image_url" type="hidden" value={uploadedImageUrl||formItem?.hero_image_url||''} readOnly />
          </div>
          <label><span>Image alt text</span><input name="hero_image_alt" defaultValue={formItem?.hero_image_alt||''} placeholder="Describe the image for accessibility" /></label>
          <div className="adminFormTwo">
            <label><span>SEO title</span><input name="seo_title" maxLength={70} defaultValue={formItem?.seo_title||''} /></label>
            <label><span>Meta description</span><input name="meta_description" maxLength={180} defaultValue={formItem?.meta_description||''} /></label>
          </div>
          <div className="adminEditorFooter"><span>{formItem?.status==='published'?'Saving changes keeps this story published.':'Save as draft, then publish when approved.'}</span><button className="adminPrimaryButton" disabled={saving}>{saving?'Saving…':formItem?'Save changes':'Create draft'} <span>→</span></button></div>
        </form>
      </section>}
    </div>
    {notice&&<div className="adminToast success">{notice}</div>}
    {error&&!loading&&<div className="adminToast error">{error}</div>}
  </AdminFrame>;
}

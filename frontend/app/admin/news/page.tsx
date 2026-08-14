'use client';

import { FormEvent, useCallback, useEffect, useMemo, useState } from 'react';
import { AdminFrame, AdminState } from '@/components/AdminData';
import { authFetch, getArticle } from '@/lib/api';
import { supabase } from '@/lib/supabase';

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

async function token() {
  if (!supabase) throw new Error('Supabase is not configured.');
  const { data } = await supabase.auth.getSession();
  if (!data.session?.access_token) throw new Error('Your staff session has expired.');
  return data.session.access_token;
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

  const load=useCallback(async()=>{
    setLoading(true);setError('');
    try{ setData(await authFetch<Result>('/admin/news?page_size=100',await token())); }
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
      const result=await authFetch<{url:string;path:string}>('/admin/uploads/newsroom-image',await token(),{method:'POST',body:fd});
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
      const access=await token();
      if(editing){
        const updated=await authFetch<News>(`/admin/news/${editing.id}`,access,{method:'PATCH',body:JSON.stringify(payload)});
        setEditing(updated);setNotice('Newsroom article saved.');
      }else{
        const created=await authFetch<News>('/admin/news',access,{method:'POST',body:JSON.stringify({...payload,category_ids:[]})});
        setEditing(created);setCreating(false);setNotice('Draft article created.');
      }
      await load();
    }catch(err){setError(err instanceof Error?err.message:'Unable to save article.');}
    finally{setSaving(false);}
  }

  async function action(item:News,kind:'publish'|'unpublish'|'archive'){
    if(kind==='archive'&&!window.confirm(`Archive “${item.title}”?`))return;
    setSaving(true);setError('');setNotice('');
    try{
      const access=await token();
      if(kind==='archive') {
        await authFetch<void>(`/admin/news/${item.id}`,access,{method:'DELETE'});
        setNotice('Article archived.');
      } else {
        const updated = await authFetch<News>(`/admin/news/${item.id}/${kind}`,access,{method:'POST'});
        if (kind === 'publish') {
          // Verify that the public endpoint can immediately read the published record.
          await getArticle(updated.slug);
          setNotice('Published and verified — this story is now live on the public Newsroom.');
        } else {
          setNotice('Moved back to draft.');
        }
      }
      if(editing?.id===item.id)setEditing(null);
      await load();
    }catch(err){setError(err instanceof Error?err.message:'Newsroom action failed.');}
    finally{setSaving(false);}
  }

  const formItem=editing;
  return <AdminFrame title="Newsroom" kicker="Editorial publishing">
    <div className="adminMetrics adminMetricsModern newsroomMetrics">
      <article><span>Editorial records</span><strong>{data?.meta.total??'—'}</strong><small>Draft + published</small></article>
      <article><span>Live stories</span><strong>{published||'—'}</strong><small>Visible to website visitors</small></article>
      <article><span>Draft workspace</span><strong>{drafts||'—'}</strong><small>Not yet public</small></article>
    </div>

    <div className="adminEditorialToolbar">
      <div><p className="eyebrow">Publishing workflow</p><h2>Write once. Publish everywhere.</h2><p>Articles published here are served by the FastAPI newsroom API and appear automatically on the public ONIRIA website.</p></div>
      <button className="adminPrimaryButton" onClick={()=>{setEditing(null);setUploadedImageUrl('');setCreating(true);}}>New article <span>＋</span></button>
    </div>

    <AdminState loading={loading} error={error} empty={!loading&&!error&&!data?.items?.length?'No newsroom records found.':undefined}/>

    <div className="adminNewsWorkspace">
      <section className="adminNewsList">
        {data?.items.map((item)=><article key={item.id} className={`adminNewsCard ${editing?.id===item.id?'active':''}`}>
          <button className="adminNewsCardMain" onClick={()=>{setEditing(item);setUploadedImageUrl(item.hero_image_url||'');setCreating(false);}}>
            <span className="statusPill">{item.status}</span>
            <h3>{item.title}</h3>
            <p>{item.excerpt||'No excerpt yet.'}</p>
            <small>Updated {new Date(item.updated_at).toLocaleDateString()}</small>
          </button>
          <div className="adminNewsActions">
            {item.status==='published'?<button onClick={()=>action(item,'unpublish')} disabled={saving}>Unpublish</button>:<button onClick={()=>action(item,'publish')} disabled={saving}>Publish</button>}
            <a href={`/newsroom/${item.slug}`} target="_blank" rel="noreferrer">Preview ↗</a>
            <button className="danger" onClick={()=>action(item,'archive')} disabled={saving}>Archive</button>
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
              <p>Use a clear landscape image so the article looks polished across the homepage and Newsroom. JPG, PNG, WEBP or AVIF · maximum 10 MB.</p>
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
          <div className="adminEditorFooter"><span>Save as draft, then publish when approved.</span><button className="adminPrimaryButton" disabled={saving}>{saving?'Saving…':formItem?'Save changes':'Create draft'} <span>→</span></button></div>
        </form>
      </section>}
    </div>
    {notice&&<div className="adminToast success">{notice}</div>}
    {error&&!loading&&<div className="adminToast error">{error}</div>}
  </AdminFrame>;
}

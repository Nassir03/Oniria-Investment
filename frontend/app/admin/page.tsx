'use client';

import Link from 'next/link';
import { AdminFrame, AdminState, useProtectedData, type StaffProfile } from '@/components/AdminData';

type PageResult<T> = { items: T[]; meta: { total: number } };
type NewsItem = { id:string; title:string; status:string; updated_at:string };
type Lead = { id:string; reference_no:string; first_name:string; last_name:string; status:string; created_at:string };

export default function Page() {
  const news = useProtectedData<PageResult<NewsItem>>('/admin/news?page_size=5');
  const leads = useProtectedData<PageResult<Lead>>('/admin/leads?page_size=5');
  const me = useProtectedData<StaffProfile>('/admin/me');
  const isAdmin = me.data?.roles?.includes('admin');

  return <AdminFrame title="Overview" kicker="ONIRIA administration">
    <section className="adminWelcomeStrip">
      <div><p className="eyebrow">Private operations workspace</p><h2>Everything that moves ONIRIA forward, in one place.</h2></div>
      <p>Review customer enquiries, publish company updates, manage projects and control staff access without leaving the secure administration portal.</p>
    </section>

    <div className="adminMetrics adminMetricsModern">
      <article><span>Newsroom</span><strong>{news.data?.meta?.total ?? '—'}</strong><small>Editorial records</small></article>
      <article><span>Lead pipeline</span><strong>{leads.data?.meta?.total ?? '—'}</strong><small>Stored enquiries</small></article>
      <article><span>Access level</span><strong className="metricText">{me.data?.roles?.join(' / ') || '—'}</strong><small>Database-backed role</small></article>
    </div>

    <section className="adminQuickActions">
      <Link href="/admin/news"><span>01</span><div><small>Editorial</small><strong>Create or publish a newsroom update</strong></div><b>↗</b></Link>
      <Link href="/admin/leads"><span>02</span><div><small>Sales</small><strong>Review new enquiries and lead activity</strong></div><b>↗</b></Link>
      {isAdmin && <Link href="/admin/staff"><span>03</span><div><small>Administration</small><strong>Create staff credentials and assign roles</strong></div><b>↗</b></Link>}
    </section>

    <div className="adminDashboardGrid adminDashboardGridModern">
      <section className="adminPanel adminPanelModern">
        <div className="adminPanelHead"><div><span>Recent enquiries</span><h2>Lead activity</h2></div><Link href="/admin/leads">View all →</Link></div>
        <AdminState loading={leads.loading} error={leads.error}/>
        {leads.data?.items?.map((lead)=><div className="adminCompactRow" key={lead.id}><div><strong>{lead.first_name} {lead.last_name}</strong><span>{lead.reference_no}</span></div><span className="statusPill">{lead.status}</span></div>)}
      </section>
      <section className="adminPanel adminPanelModern">
        <div className="adminPanelHead"><div><span>Editorial</span><h2>Latest newsroom work</h2></div><Link href="/admin/news">Open newsroom →</Link></div>
        <AdminState loading={news.loading} error={news.error}/>
        {news.data?.items?.map((item)=><div className="adminCompactRow" key={item.id}><div><strong>{item.title}</strong><span>{new Date(item.updated_at).toLocaleDateString()}</span></div><span className="statusPill">{item.status}</span></div>)}
      </section>
    </div>
  </AdminFrame>;
}

'use client';

import Link from 'next/link';
import { AdminFrame, AdminState, getAdminAccessToken, readableRoles, useAdminSession, useProtectedData } from '@/components/AdminData';

type NewsItem = { id:string; title:string; status:string; updated_at:string };
type Lead = { id:string; reference_no:string; first_name:string; last_name:string; status:string; created_at:string };
type Analytics = {
  period_days: number;
  total_views: number;
  unique_visitors: number;
  daily: { label:string; views:number; visitors:number }[];
  monthly: { label:string; views:number; visitors:number }[];
  top_pages: { path:string; views:number }[];
};
type Overview = {
  news: { items: NewsItem[]; total: number | null };
  leads: { items: Lead[]; total: number | null };
  analytics: Analytics;
};

function labelPath(path:string) {
  if (path === '/') return 'Home';
  return path.replace(/^\//,'').replace(/[-/]/g,' ').replace(/\b\w/g,(c)=>c.toUpperCase());
}

async function downloadReport(kind:'csv'|'xlsx') {
  const token = await getAdminAccessToken();
  const response = await fetch(`/api/backend/admin/exports/leads.${kind}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) throw new Error('Unable to prepare the report.');
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `oniria-enquiries.${kind}`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  URL.revokeObjectURL(url);
}

export default function Page() {
  const overview = useProtectedData<Overview>('/admin/overview');
  const { profile } = useAdminSession();
  const overviewUnavailable = /^not found$/i.test(overview.error.trim());
  const analytics = overview.data?.analytics;
  const news = overview.data?.news;
  const leads = overview.data?.leads;
  const isAdmin = profile?.roles?.includes('admin');
  const canUseNewsroom = Boolean(profile?.roles?.some((role)=>['admin','editor','content_manager'].includes(role)));
  const canUseLeads = Boolean(profile?.roles?.some((role)=>['admin','sales'].includes(role)));
  const maxDaily = Math.max(1, ...(analytics?.daily.map((item)=>item.views) || [1]));
  const recentDaily = analytics?.daily.slice(-14) || [];
  const maxMonthly = Math.max(1, ...(analytics?.monthly.map((item)=>item.views) || [1]));

  return <AdminFrame title="Overview" kicker="ONIRIA administration">
    <section className="adminWelcomeStrip adminWelcomePremium">
      <div>
        <p className="eyebrow">Today at a glance</p>
        <h2>A clear view of enquiries, publishing and audience activity.</h2>
      </div>
      <p>Keep the team aligned, respond to new interest quickly and understand how people are engaging with ONIRIA online.</p>
    </section>

    <AdminState
      loading={overview.loading}
      error={
        overviewUnavailable
          ? 'Dashboard data is not available right now. The workspace is still ready to use.'
          : overview.error
      }
    />

    <div className="adminMetrics adminMetricsModern adminMetricsFour">
      <article><span>Website visits</span><strong>{analytics?.total_views ?? '—'}</strong><small>Last 30 days</small></article>
      <article><span>Visitors</span><strong>{analytics?.unique_visitors ?? '—'}</strong><small>Last 30 days</small></article>
      <article><span>Enquiries</span><strong>{leads?.total ?? '—'}</strong><small>{canUseLeads ? 'Customer interest' : 'Restricted access'}</small></article>
      <article><span>Newsroom</span><strong>{news?.total ?? '—'}</strong><small>{canUseNewsroom ? 'Published & draft stories' : 'Restricted access'}</small></article>
    </div>

    <section className="adminAnalyticsGrid">
      <article className="adminChartCard">
        <div className="adminPanelHead compact">
          <div><span>Audience activity</span><h2>Daily visits</h2></div><small>Recent 14 days</small>
        </div>
        <div className="adminBarChart" aria-label="Daily website visits">
          {recentDaily.length ? recentDaily.map((item)=><div className="adminBarItem" key={item.label} title={`${item.label}: ${item.views} visits`}>
            <span className="adminBarValue">{item.views}</span>
            <div className="adminBarTrack"><i style={{height:`${Math.max(8,(item.views/maxDaily)*100)}%`}} /></div>
            <small>{new Date(`${item.label}T00:00:00`).toLocaleDateString('en-GB',{day:'2-digit',month:'short'})}</small>
          </div>) : <div className="adminChartEmpty">Visitor activity will appear here as people browse the public website.</div>}
        </div>
      </article>

      <article className="adminChartCard">
        <div className="adminPanelHead compact">
          <div><span>Longer view</span><h2>Monthly visits</h2></div><small>Up to 12 months</small>
        </div>
        <div className="adminMonthChart">
          {(analytics?.monthly || []).slice(-12).map((item)=><div key={item.label} className="adminMonthRow">
            <span>{new Date(`${item.label}-01T00:00:00`).toLocaleDateString('en-GB',{month:'short',year:'2-digit'})}</span>
            <div><i style={{width:`${Math.max(4,(item.views/maxMonthly)*100)}%`}} /></div>
            <strong>{item.views}</strong>
          </div>)}
          {!overview.loading && !analytics?.monthly.length ? <div className="adminChartEmpty">Monthly activity will build automatically over time.</div> : null}
        </div>
      </article>
    </section>

    <section className="adminLowerGrid">
      <article className="adminPanel adminPanelModern adminPopularPanel">
        <div className="adminPanelHead"><div><span>Most viewed</span><h2>Popular pages</h2></div><small>Last 30 days</small></div>
        {(analytics?.top_pages || []).map((item,index)=><div className="adminPopularRow" key={item.path}><span>{String(index+1).padStart(2,'0')}</span><strong>{labelPath(item.path)}</strong><b>{item.views}</b></div>)}
        {!overview.loading && !analytics?.top_pages.length ? <div className="adminNotice">Page activity will appear here as visitors use the website.</div> : null}
      </article>

      {canUseLeads ? <article className="adminPanel adminPanelModern adminReportsPanel">
        <div className="adminPanelHead"><div><span>Reports</span><h2>Download enquiries</h2></div></div>
        <p className="adminPanelIntro">Take customer enquiry records with you for meetings, follow-up and internal reporting.</p>
        <div className="adminReportButtons">
          <button onClick={()=>void downloadReport('xlsx')}>Excel report <span>↓</span></button>
          <button onClick={()=>void downloadReport('csv')}>CSV report <span>↓</span></button>
        </div>
        <div className="adminAccessSummary"><span>Your access</span><strong>{readableRoles(profile?.roles) || 'Staff member'}</strong></div>
      </article> : <article className="adminPanel adminPanelModern adminReportsPanel">
        <div className="adminPanelHead"><div><span>Your access</span><h2>Staff workspace</h2></div></div>
        <p className="adminPanelIntro">Your dashboard only shows the areas assigned to your staff role.</p>
        <div className="adminAccessSummary"><span>Responsibilities</span><strong>{readableRoles(profile?.roles) || 'Staff member'}</strong></div>
      </article>}
    </section>

    <section className="adminQuickActions adminQuickActionsPremium">
      {canUseNewsroom && <Link href="/admin/news" prefetch={false}><span>01</span><div><small>Newsroom</small><strong>Create or publish an update</strong></div><b>↗</b></Link>}
      {canUseLeads && <Link href="/admin/leads" prefetch={false}><span>02</span><div><small>Enquiries</small><strong>Review customer interest and follow-up</strong></div><b>↗</b></Link>}
      {isAdmin && <Link href="/admin/staff" prefetch={false}><span>03</span><div><small>Team</small><strong>Add staff and manage access</strong></div><b>↗</b></Link>}
    </section>

    <div className="adminDashboardGrid adminDashboardGridModern">
      {canUseLeads && <section className="adminPanel adminPanelModern">
        <div className="adminPanelHead"><div><span>Recent enquiries</span><h2>Customer activity</h2></div><Link href="/admin/leads" prefetch={false}>View all →</Link></div>
        {leads?.items?.map((lead)=><div className="adminCompactRow" key={lead.id}><div><strong>{lead.first_name} {lead.last_name}</strong><span>{lead.reference_no}</span></div><span className="statusPill">{lead.status}</span></div>)}
      </section>}
      {canUseNewsroom && <section className="adminPanel adminPanelModern">
        <div className="adminPanelHead"><div><span>Latest stories</span><h2>Newsroom activity</h2></div><Link href="/admin/news" prefetch={false}>Open newsroom →</Link></div>
        {news?.items?.map((item)=><div className="adminCompactRow" key={item.id}><div><strong>{item.title}</strong><span>{new Date(item.updated_at).toLocaleDateString()}</span></div><span className="statusPill">{item.status}</span></div>)}
      </section>}
    </div>
  </AdminFrame>;
}

'use client';

import { AdminFrame, AdminState, getAdminAccessToken, useProtectedData } from '@/components/AdminData';

type Lead = {
  id:string; reference_no:string; first_name:string; last_name:string; email:string; phone?:string|null;
  country?:string|null; enquiry_type?:string|null; message:string; preferred_contact_method?:string|null;
  status:string; created_at:string;
};
type Result = { items: Lead[]; meta: { total:number } };

async function download(kind:'csv'|'xlsx') {
  const token = await getAdminAccessToken();
  const response = await fetch(`/api/backend/admin/exports/leads.${kind}`, { headers: { Authorization: `Bearer ${token}` } });
  if (!response.ok) return;
  const blob = await response.blob();
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = `oniria-enquiries.${kind}`;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export default function Page() {
  const { data, error, loading } = useProtectedData<Result>('/admin/leads?page_size=100');
  const newCount = data?.items.filter((lead)=>lead.status === 'new').length || 0;
  const activeCount = data?.items.filter((lead)=>['contacted','qualified','viewing_scheduled'].includes(lead.status)).length || 0;

  return <AdminFrame title="Enquiries" kicker="Customer relationships">
    <section className="adminWelcomeStrip adminWelcomePremium compact">
      <div><p className="eyebrow">Customer interest</p><h2>Follow every conversation from first contact to next step.</h2></div>
      <p>Keep enquiries organised, identify what needs attention and take a clean report into meetings or follow-up sessions.</p>
    </section>

    <div className="adminMetrics adminMetricsModern adminMetricsThree">
      <article><span>All enquiries</span><strong>{data?.meta?.total ?? '—'}</strong><small>Total received</small></article>
      <article><span>New</span><strong>{newCount || '—'}</strong><small>Awaiting first follow-up</small></article>
      <article><span>In progress</span><strong>{activeCount || '—'}</strong><small>Active conversations</small></article>
    </div>

    <div className="adminListToolbar">
      <div><p className="eyebrow">Enquiry list</p><h2>Customer conversations</h2></div>
      <div className="adminReportButtons compact"><button onClick={()=>void download('xlsx')}>Excel <span>↓</span></button><button onClick={()=>void download('csv')}>CSV <span>↓</span></button></div>
    </div>

    <AdminState loading={loading} error={error} empty={!loading && !error && !data?.items?.length ? 'No enquiries yet.' : undefined}/>
    {data?.items?.length ? <div className="adminTable adminTablePremium adminLeadTable">
      <div className="adminTableHead"><span>Customer</span><span>Reference</span><span>Interest</span><span>Date</span><span>Status</span></div>
      {data.items.map((lead)=><article className="adminLeadEntry" key={lead.id}>
        <div className="adminTableRow"><div data-label="Customer"><strong>{lead.first_name} {lead.last_name}</strong><small>{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</small></div><span data-label="Reference">{lead.reference_no}</span><span data-label="Interest">{lead.enquiry_type || 'General'}</span><span data-label="Date">{new Date(lead.created_at).toLocaleDateString('en-GB')}</span><span className="statusPill" data-label="Status">{lead.status.replaceAll('_',' ')}</span></div>
        <div className="adminLeadMessage"><span>Message</span><p>{lead.message}</p></div>
      </article>)}
    </div> : null}
  </AdminFrame>;
}

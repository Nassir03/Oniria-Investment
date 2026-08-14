'use client';

import { AdminFrame, AdminState, useProtectedData } from '@/components/AdminData';

type Lead = { id:string; reference_no:string; first_name:string; last_name:string; email:string; phone?:string|null; country?:string|null; enquiry_type?:string|null; status:string; created_at:string };
type Result = { items: Lead[]; meta: { total:number } };

export default function Page() {
  const { data, error, loading } = useProtectedData<Result>('/admin/leads?page_size=100');
  return <AdminFrame title="Leads" kicker="Sales pipeline">
    <div className="adminToolbar"><div><strong>{data?.meta?.total ?? '—'}</strong><span>Total enquiries</span></div><p>Website enquiries stored in PostgreSQL and available to authorized sales/admin staff.</p></div>
    <AdminState loading={loading} error={error} empty={!loading && !error && !data?.items?.length ? 'No leads found.' : undefined}/>
    {data?.items?.length ? <div className="adminTable"><div className="adminTableHead"><span>Contact</span><span>Reference</span><span>Type</span><span>Date</span><span>Status</span></div>{data.items.map((lead)=><div className="adminTableRow" key={lead.id}><div><strong>{lead.first_name} {lead.last_name}</strong><small>{lead.email}{lead.phone ? ` · ${lead.phone}` : ''}</small></div><span>{lead.reference_no}</span><span>{lead.enquiry_type || 'General'}</span><span>{new Date(lead.created_at).toLocaleDateString()}</span><span className="statusPill">{lead.status}</span></div>)}</div> : null}
  </AdminFrame>;
}

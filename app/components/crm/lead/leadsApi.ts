// app/dashboard/crm/lead/leadsApi.ts
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";

export type LeadLite = {
  id: string;
  name: string;
  email: string | null;
  phone: string | null;
  status: LeadStatus;
  rating: number | null;
  reviewCount: number | null;
  city: string | null;
  category: string | null;
  website: string | null;
  mapsUrl: string | null;
  placeId: string | null;
  createdAt: string;
};

export async function fetchLeads(): Promise<LeadLite[]> {
  const res = await fetch("/api/admin/leads", { cache: "no-store" });
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "FETCH_LEADS_FAILED");
  return (json.leads || []).map((x: any) => ({
    ...x,
    createdAt: x.createdAt ? String(x.createdAt) : new Date().toISOString(),
  }));
}

export async function createLead(input: {
  name: string;
  email: string;
  phone?: string;
  type?: string;
  rating?: number | string;
  reviewCount?: number | string;
  city?: string;
  category?: string;
  website?: string;
  mapsUrl?: string;
  placeId?: string;
}): Promise<LeadLite> {
  const res = await fetch("/api/admin/leads", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "CREATE_LEAD_FAILED");

  const lead = json.lead as any;
  return {
    id: lead.id,
    name: lead.name,
    email: lead.email ?? null,
    phone: lead.phone ?? null,
    status: lead.status,
    rating: lead.rating ?? null,
    reviewCount: lead.reviewCount ?? null,
    city: lead.city ?? null,
    category: lead.category ?? null,
    website: lead.website ?? null,
    mapsUrl: lead.mapsUrl ?? null,
    placeId: lead.placeId ?? null,
    createdAt: lead.createdAt ? String(lead.createdAt) : new Date().toISOString(),
  };
}

export async function fetchLeadById(id: string): Promise<any> {
  const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}`, {
    cache: "no-store",
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "FETCH_LEAD_FAILED");
  return json.lead;
}

export async function patchLeadStatus(id: string, status: LeadStatus): Promise<LeadStatus> {
  const res = await fetch(`/api/admin/leads/${encodeURIComponent(id)}/status`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ status }),
  });
  const json = await res.json();
  if (!res.ok || !json?.ok) throw new Error(json?.message || "PATCH_STATUS_FAILED");
  return json.lead.status as LeadStatus;
}

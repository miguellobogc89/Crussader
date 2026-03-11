// app/components/crm/lead/types.ts
export type LeadStatus = "NEW" | "CONTACTED" | "QUALIFIED" | "LOST" | "WON";
export type LeadType = "TEST_USER" | "BETA" | "CUSTOMER" | "PARTNER" | "OTHER";
export type LeadSource =
  | "UNKNOWN"
  | "WEBSITE"
  | "REFERRAL"
  | "GOOGLE"
  | "FACEBOOK"
  | "YELP"
  | "TRIPADVISOR"
  | "OTHER";

export type InviteLite = {
  id: string;
  code: string;
  status: "PENDING" | "USED" | "EXPIRED" | "REVOKED";
  expires_at: string | null;
  created_at: string;
};

export type LeadRow = {
  id: string;
  companyId: string;
  ownerId: string | null;
  name: string;
  email: string | null;
  phone: string | null;
  source: LeadSource;
  status: LeadStatus;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  type: LeadType;

  rating: string | null;
  reviewCount: number | null;
  placeId: string | null;
  mapsUrl: string | null;
  website: string | null;
  city: string | null;
  category: string | null;
  contactName: string | null;
  contactRole: string | null;
  lastContactAt: string | null;
  nextFollowUpAt: string | null;

  Invite?: InviteLite[]; // viene del include en GET
};

export type AlertState = {
  variant: "success" | "error" | "info";
  message: string;
} | null;

export type ApiResponse = {
  ok: boolean;
  code?: string;
  message?: string;
  lead?: any;
  leads?: any[];
  invite?: any;
  reused?: boolean;
  context?: any;
};

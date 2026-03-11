// app/components/admin/integrations/whatsapp/templates/types.ts
export type TemplateStatus = "approved" | "pending" | "rejected";
export type TemplateCategory = "marketing" | "utility" | "authentication";
export type TemplateUse = "start_conversation" | "within_24h";

export type WaTemplate = {
  id: string;
  name: string; // template_name
  title: string;
  status: TemplateStatus;
  category: TemplateCategory;
  language: string; // es / es_ES / etc
  use: TemplateUse;
  body: string; // preview
  updatedAt: string; // ISO

  isFavorite?: boolean;
  favoriteAt?: string | null;
};

export type TemplateFilters = {
  q: string;
  status: TemplateStatus | "all";
  category: TemplateCategory | "all";
  lang: string | "all";
};
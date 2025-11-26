// app/components/notifications/types.ts

export interface Notification {
  /** ====== SHAPE UI ====== */
  id: string;

  category:
    | "all"
    | "agent"
    | "reviews"
    | "billing"
    | "system"
    | "integrations"
    | "general";   // 🔹 NUEVA CATEGORÍA

  type: string;
  title: string;         // título visible en UI
  description: string;   // descripción visible en UI
  timestamp: string;     // ISO string o formateado
  read: boolean;
  priority?: "low" | "medium" | "high";
  created_at: string;

  /** —— Datos enriquecidos opcionales ——— */
  data?: {
    comment?: string;
    rating?: number;
    reviewerName?: string;
    reviewId?: string;
    [key: string]: any;
  };

  /** —— Campos compatibles con BBDD (opcional) ——— */
  object_id?: string | null;
  subject?: string | null; 
  comment?: string | null;
  body?: string | null;
  status?: string | null; // "unread" | "read"
  notified_at?: string | Date | null;
  locationId?: string | null;
  accountId?: string | null;
  userId?: string | null;
  reviewId?: string | null;
  metadata?: any;

  // banderas extra, si existieran
  read_db?: boolean | null;
}

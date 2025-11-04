// app/components/notifications/types.ts

export interface Notification {
  /** ====== TU SHAPE UI (tal cual lo tenías) ====== */
  id: string;
  category: "all" | "agent" | "reviews" | "billing" | "system" | "integrations";
  type: string;
  title: string;          // título visible en UI
  description: string;    // descripción visible en UI
  timestamp: string;      // ISO string (o humanizado) preferido por la UI
  read: boolean;
  priority?: "low" | "medium" | "high";
  created_at: string;

  /** Datos enriquecidos opcionales para UI */
  data?: {
    comment?: string;        // texto de la review u otro detalle
    rating?: number;         // puntuación (ej. 4.5)
    reviewerName?: string;   // nombre del autor de la review
    reviewId?: string;       // para posibles acciones (ver más, etc.)
    [key: string]: any;
  };

  /** ====== CAMPOS “PRISMA-LIKE” OPCIONALES (para tolerar lectura directa de BBDD) ====== */
  object_id?: string | null;
  subject?: string | null;     // alternativa a title
  comment?: string | null;     // alternativa a description
  body?: string | null;        // alternativa a description
  status?: string | null;      // "unread" | "read" (texto)
  notified_at?: string | Date | null; // alternativa a timestamp
  locationId?: string | null;
  accountId?: string | null;
  userId?: string | null;
  reviewId?: string | null;
  metadata?: any;
  // banderas de BBDD
  read_db?: boolean | null;    // si alguna vez usas otro flag
}

// app/components/admin/integrations/whatsapp/ConversationHeader.tsx
"use client";

import { MoreVertical, Search, User } from "lucide-react";

export type ConversationContact = {
  name: string;
  phoneE164: string; // sin +, como viene de tu lista (digits)
  avatarUrl?: string | null;
};

function normalizePhone(p: string) {
  return p.replace(/[^\d]/g, "");
}

function formatEsPhoneForUi(raw: string) {
  const digits = normalizePhone(raw);
  let local = digits;

  if (local.startsWith("34") && local.length > 9) {
    local = local.slice(2);
  }

  const parts: string[] = [];
  for (let i = 0; i < local.length; i += 3) {
    parts.push(local.slice(i, i + 3));
  }
  return parts.join(" ").trim();
}

export default function ConversationHeader({ contact }: { contact: ConversationContact | null }) {
  return (
    <div className="border-b p-3">
      <div className="flex items-center justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="h-9 w-9 shrink-0 overflow-hidden rounded-full border bg-muted/30">
            {contact && contact.avatarUrl ? (
              <img src={contact.avatarUrl} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
          </div>

          <div className="min-w-0">
            <div className="truncate text-sm font-semibold leading-5">{contact ? contact.name : "Conversación"}</div>
            {contact ? (
              <div className="truncate text-xs text-muted-foreground">{formatEsPhoneForUi(contact.phoneE164)}</div>
            ) : null}
          </div>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted/60"
            aria-label="Buscar"
          >
            <Search className="h-5 w-5" />
          </button>

          <button
            type="button"
            className="inline-flex h-9 w-9 items-center justify-center rounded-md hover:bg-muted/60"
            aria-label="Opciones"
          >
            <MoreVertical className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
}
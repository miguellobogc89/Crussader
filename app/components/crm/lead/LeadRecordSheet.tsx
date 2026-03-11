// app/components/crm/lead/LeadRecordSheet.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { fetchLeadById, LeadStatus, patchLeadStatus } from "@/app/components/crm/lead/leadsApi";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/app/components/ui/sheet";
import { Badge } from "@/app/components/ui/badge";
import { Button } from "@/app/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/app/components/ui/select";
import { ExternalLink } from "lucide-react";

const STATUS_OPTIONS: LeadStatus[] = ["NEW", "CONTACTED", "QUALIFIED", "WON", "LOST"];

type Props = {
  leadId: string | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
  onStatusChanged: (leadId: string, nextStatus: LeadStatus) => void;
};

function fmtDate(d?: string | null) {
  if (!d) return "—";
  const x = new Date(d);
  if (Number.isNaN(x.getTime())) return "—";
  return x.toLocaleString("es-ES");
}

export default function LeadRecordSheet({
  leadId,
  open,
  onOpenChange,
  onStatusChanged,
}: Props) {
  const [loading, setLoading] = useState(false);
  const [lead, setLead] = useState<any>(null);
  const [savingStatus, setSavingStatus] = useState(false);

  useEffect(() => {
    if (!open || !leadId) return;

    setLoading(true);
    setLead(null);

    fetchLeadById(leadId)
      .then((x) => setLead(x))
      .finally(() => setLoading(false));
  }, [open, leadId]);

  const header = useMemo(() => {
    if (!lead) return null;
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <div className="text-sm text-muted-foreground">Lead</div>
          <div className="text-lg font-semibold truncate">{lead.name}</div>
          <div className="text-sm text-muted-foreground truncate">
            {lead.city || "—"} {lead.category ? `· ${lead.category}` : ""}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Badge variant="outline">{lead.status}</Badge>

          <Select
            value={lead.status}
            onValueChange={(v) => {
              const next = v as LeadStatus;
              setLead((p: any) => ({ ...p, status: next }));
              setSavingStatus(true);

              patchLeadStatus(lead.id, next)
                .then((saved) => {
                  setLead((p: any) => ({ ...p, status: saved }));
                  onStatusChanged(lead.id, saved);
                })
                .finally(() => setSavingStatus(false));
            }}
            disabled={savingStatus}
          >
            <SelectTrigger className="w-[170px] h-9">
              <SelectValue placeholder="Estado" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>
    );
  }, [lead, savingStatus, onStatusChanged]);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full sm:max-w-[640px] overflow-auto">
        <SheetHeader>
          <SheetTitle>Ficha del lead</SheetTitle>
        </SheetHeader>

        <div className="pt-4 space-y-4">
          {loading ? (
            <div className="text-sm text-muted-foreground">Cargando…</div>
          ) : !lead ? (
            <div className="text-sm text-muted-foreground">No hay datos.</div>
          ) : (
            <>
              {header}

              <div className="grid grid-cols-2 gap-3 rounded-xl border p-4 bg-white">
                <div>
                  <div className="text-xs text-muted-foreground">Email</div>
                  <div className="text-sm">{lead.email || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Teléfono</div>
                  <div className="text-sm">{lead.phone || "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Rating</div>
                  <div className="text-sm">{lead.rating ?? "—"}</div>
                </div>
                <div>
                  <div className="text-xs text-muted-foreground">Volumen</div>
                  <div className="text-sm">{lead.reviewCount ?? "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Website</div>
                  <div className="text-sm truncate">{lead.website || "—"}</div>
                </div>
                <div className="col-span-2">
                  <div className="text-xs text-muted-foreground">Maps</div>
                  <div className="flex items-center gap-2">
                    <div className="text-sm truncate flex-1">{lead.mapsUrl || "—"}</div>
                    {lead.mapsUrl ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => window.open(lead.mapsUrl, "_blank", "noopener,noreferrer")}
                        className="gap-2"
                      >
                        <ExternalLink className="h-4 w-4" />
                        Abrir
                      </Button>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-white space-y-2">
                <div className="text-sm font-medium">Meta</div>
                <div className="grid grid-cols-2 gap-3 text-sm">
                  <div>
                    <div className="text-xs text-muted-foreground">Creado</div>
                    <div>{fmtDate(lead.createdAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Actualizado</div>
                    <div>{fmtDate(lead.updatedAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Último contacto</div>
                    <div>{fmtDate(lead.lastContactAt)}</div>
                  </div>
                  <div>
                    <div className="text-xs text-muted-foreground">Próximo follow up</div>
                    <div>{fmtDate(lead.nextFollowUpAt)}</div>
                  </div>
                </div>
              </div>

              <div className="rounded-xl border p-4 bg-white space-y-2">
                <div className="text-sm font-medium">Invites recientes</div>
                {(lead.Invite || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">—</div>
                ) : (
                  <div className="space-y-2">
                    {(lead.Invite || []).map((inv: any) => (
                      <div key={inv.id} className="flex items-center justify-between text-sm">
                        <div className="min-w-0">
                          <div className="font-medium truncate">{inv.code}</div>
                          <div className="text-xs text-muted-foreground">
                            {inv.status} · exp {fmtDate(inv.expires_at)}
                          </div>
                        </div>
                        <Badge variant="outline">
                          {inv.used_count}/{inv.max_uses}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="rounded-xl border p-4 bg-white space-y-2">
                <div className="text-sm font-medium">Interacciones</div>
                {(lead.lead_interaction || []).length === 0 ? (
                  <div className="text-sm text-muted-foreground">—</div>
                ) : (
                  <div className="space-y-3">
                    {(lead.lead_interaction || []).map((it: any) => (
                      <div key={it.id} className="text-sm">
                        <div className="flex items-center justify-between">
                          <div className="font-medium">
                            {it.channel} {it.interest ? `· ${it.interest}` : ""}
                          </div>
                          <div className="text-xs text-muted-foreground">{fmtDate(it.created_at)}</div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          next: {it.next_step || "—"} · follow: {fmtDate(it.follow_up_at)}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}

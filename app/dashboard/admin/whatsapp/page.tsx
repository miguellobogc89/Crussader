// app/dashboard/admin/whatsapp/page.tsx
// app/dashboard/admin/whatsapp/page.tsx
import PageShell from "@/app/components/layouts/PageShell";
import WhatsAppAdminShell from "@/app/components/admin/integrations/whatsapp/WhatsAppAdminShell";

export const dynamic = "force-dynamic";

type WaDebugEvent =
  | {
      kind: "status";
      at: number;
      status: string;
      id?: string;
      to?: string;
      ts?: string;
    }
  | {
      kind: "message";
      at: number;
      from: string;
      id?: string;
      type?: string;
      text?: string;
      ts?: string;
    };

async function getDebugEvents() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/webhooks/whatsapp?debug=1`, {
    cache: "no-store",
  });

  if (!res.ok) {
    return { ok: false as const, count: 0, events: [] as WaDebugEvent[] };
  }

  const data = (await res.json()) as {
    ok: boolean;
    count: number;
    events: WaDebugEvent[];
  };

  return data;
}

export default async function AdminWhatsAppPage() {
  const data = await getDebugEvents();

  return (
    <PageShell title="Admin · WhatsApp">
      <WhatsAppAdminShell initialEvents={data.events} />
    </PageShell>
  );
}
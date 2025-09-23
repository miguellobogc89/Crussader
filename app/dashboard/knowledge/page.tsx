import React from "react";
import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { KnowledgeVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";

export const dynamic = "force-dynamic";

/** ===== Server Action: guardar contenido de una sección ===== */
async function saveSectionAction(formData: FormData) {
  "use server";
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { UserCompany: { select: { companyId: true }, take: 1 } },
  });
  const companyId = user?.UserCompany?.[0]?.companyId;
  if (!companyId) return;

  const kind = (formData.get("kind") as "PUBLIC" | "PRIVATE") ?? "PUBLIC";
  const title =
    (formData.get("title") as string) ||
    (kind === "PUBLIC" ? "Conocimiento Público (general)" : "Conocimiento Privado (panel)");
  const content = ((formData.get("content") as string) || "").trim();

  const existing = await prisma.knowledgeItem.findFirst({
    where: { companyId, siteId: null, visibility: kind as KnowledgeVisibility },
    select: { id: true },
  });

  if (existing) {
    await prisma.knowledgeItem.update({
      where: { id: existing.id },
      data: { title, content },
    });
  } else {
    await prisma.knowledgeItem.create({
      data: { companyId, siteId: null, title, content, visibility: kind as KnowledgeVisibility },
    });
  }
  revalidatePath("/dashboard/knowledge");
}

export default async function KnowledgePage() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");

  // 1) Obtener companyId
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { UserCompany: { select: { companyId: true }, take: 1 } },
  });
  const companyId = user?.UserCompany?.[0]?.companyId;
  if (!companyId) {
    return (
      <div style={{ padding: 24 }}>
        <h1 style={{ fontSize: 20, fontWeight: 600 }}>Knowledge</h1>
        <p style={{ color: "#666", marginTop: 8 }}>
          No tienes ninguna empresa asociada. Crea una empresa para empezar.
        </p>
      </div>
    );
  }

  // 2) Cargar PUBLIC y PRIVATE
  const [pub, priv] = await Promise.all([
    prisma.knowledgeItem.findFirst({
      where: { companyId, siteId: null, visibility: "PUBLIC" as KnowledgeVisibility },
      select: { id: true, title: true, content: true, updatedAt: true },
    }),
    prisma.knowledgeItem.findFirst({
      where: { companyId, siteId: null, visibility: "PRIVATE" as KnowledgeVisibility },
      select: { id: true, title: true, content: true, updatedAt: true },
    }),
  ]);

  // 3) Datos normalizados
  const sections = {
    public: {
      id: pub?.id ?? "public",
      kind: "PUBLIC" as const,
      label: pub?.title ?? "Conocimiento Público (general)",
      desc: "Productos, servicios, precios, cómo pedir demo…",
      content: pub?.content ?? "",
      published: Boolean(pub?.content?.trim()?.length),
      updatedAt: pub?.updatedAt?.toISOString(),
    },
    private: {
      id: priv?.id ?? "private",
      kind: "PRIVATE" as const,
      label: priv?.title ?? "Conocimiento Privado (panel)",
      desc: "Procesos internos, rutas del panel y FAQs avanzadas…",
      content: priv?.content ?? "",
      published: Boolean(priv?.content?.trim()?.length),
      updatedAt: priv?.updatedAt?.toISOString(),
    },
  };

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, minHeight: 500 }}>
      {/* ====== CSS mínimo para tabs hash sin recarga ====== */}
      <style>{`
        .sec { display: none; }
        /* Al tener un objetivo (#public o #private) se muestra esa sección */
        .sec:target { display: block; }
        /* Fallback: si NO hay :target, mostrar por defecto la pública */
        body:not(:has(:target)) #sec-public { display: block; }
      `}</style>

      {/* ===== Menú lateral ===== */}
      <aside style={{ width: 280 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Secciones</h2>
          <button
            type="button"
            disabled
            title="Próximamente"
            style={{
              cursor: "not-allowed",
              opacity: 0.6,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              padding: "6px 10px",
              background: "white",
              fontSize: 12,
              fontWeight: 600,
            }}
          >
            + Añadir
          </button>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          <a
            href="#public"
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{sections.public.label}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{sections.public.desc}</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              Estado:{" "}
              <span style={{ fontWeight: 600, color: sections.public.published ? "#16a34a" : "#d97706" }}>
                {sections.public.published ? "Publicado" : "Borrador"}
              </span>
            </div>
          </a>

          <a
            href="#private"
            style={{
              display: "block",
              padding: 12,
              border: "1px solid #e5e7eb",
              borderRadius: 8,
              textDecoration: "none",
            }}
          >
            <div style={{ fontWeight: 600, fontSize: 14 }}>{sections.private.label}</div>
            <div style={{ color: "#6b7280", fontSize: 12 }}>{sections.private.desc}</div>
            <div style={{ marginTop: 6, fontSize: 12 }}>
              Estado:{" "}
              <span style={{ fontWeight: 600, color: sections.private.published ? "#16a34a" : "#d97706" }}>
                {sections.private.published ? "Publicado" : "Borrador"}
              </span>
            </div>
          </a>
        </nav>

        <div style={{ marginTop: 16, fontSize: 12, color: "#6b7280" }}>
          Total: <strong>2</strong> secciones
        </div>
      </aside>

      {/* ===== Contenido (2 secciones renderizadas, se alternan por hash) ===== */}
      <main style={{ flex: 1, display: "grid", gap: 24 }}>
        {/* Pública */}
        <section id="sec-public" className="sec" style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <header style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{sections.public.label}</h1>
            <div style={{ color: "#6b7280", fontSize: 14 }}>{sections.public.desc}</div>
          </header>

          <form action={saveSectionAction} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="kind" value={sections.public.kind} />
            <label style={{ fontSize: 12, color: "#6b7280" }}>Título</label>
            <input
              type="text"
              name="title"
              defaultValue={sections.public.label}
              style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            />

            <label style={{ fontSize: 12, color: "#6b7280" }}>Contenido</label>
            <textarea
              name="content"
              defaultValue={sections.public.content}
              placeholder="(Público: productos, precios, demo)"
              rows={12}
              style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, whiteSpace: "pre-wrap" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="submit"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 14px",
                  background: "white",
                  fontWeight: 600,
                }}
              >
                Guardar cambios
              </button>
              <a
                href="#public"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 14px",
                  background: "white",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Cancelar
              </a>
            </div>
          </form>
        </section>

        {/* Privada */}
        <section id="sec-private" className="sec" style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
          <header style={{ marginBottom: 12 }}>
            <h1 style={{ fontSize: 18, fontWeight: 700, marginBottom: 4 }}>{sections.private.label}</h1>
            <div style={{ color: "#6b7280", fontSize: 14 }}>{sections.private.desc}</div>
          </header>

          <form action={saveSectionAction} style={{ display: "grid", gap: 12 }}>
            <input type="hidden" name="kind" value={sections.private.kind} />
            <label style={{ fontSize: 12, color: "#6b7280" }}>Título</label>
            <input
              type="text"
              name="title"
              defaultValue={sections.private.label}
              style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
            />

            <label style={{ fontSize: 12, color: "#6b7280" }}>Contenido</label>
            <textarea
              name="content"
              defaultValue={sections.private.content}
              placeholder="(Privado: rutas del panel, procesos internos)"
              rows={12}
              style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14, whiteSpace: "pre-wrap" }}
            />

            <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
              <button
                type="submit"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 14px",
                  background: "white",
                  fontWeight: 600,
                }}
              >
                Guardar cambios
              </button>
              <a
                href="#private"
                style={{
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  padding: "8px 14px",
                  background: "white",
                  textDecoration: "none",
                  fontWeight: 600,
                }}
              >
                Cancelar
              </a>
            </div>
          </form>
        </section>
      </main>
    </div>
  );
}

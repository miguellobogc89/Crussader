import { prisma } from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import type { KnowledgeVisibility } from "@prisma/client";
import { revalidatePath } from "next/cache";
import React from "react";

export const dynamic = "force-dynamic";

/* ============ Server Actions ============ */
async function requireCompanyId() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.email) redirect("/login");
  const user = await prisma.user.findUnique({
    where: { email: session.user.email },
    include: { UserCompany: { select: { companyId: true }, take: 1 } },
  });
  const companyId = user?.UserCompany?.[0]?.companyId;
  if (!companyId) throw new Error("No company associated");
  return companyId;
}

export async function createSectionAction(formData: FormData) {
  "use server";
  const companyId = await requireCompanyId();
  const title = ((formData.get("title") as string) || "Nueva sección").trim();
  const visibility = (formData.get("visibility") as KnowledgeVisibility) || "PUBLIC";
  // posición: siguiente correlativo
  const max = await prisma.knowledgeSection.aggregate({
    _max: { position: true },
    where: { companyId },
  });
  const position = (max._max.position ?? -1) + 1;

  await prisma.knowledgeSection.create({
    data: {
      companyId,
      title,
      slug: `${Date.now()}`, // simple único; luego puedes cambiarlo desde UI si quieres
      content: "",
      visibility,
      position,
      isActive: true,
    },
  });

  revalidatePath("/dashboard/knowledge");
}

export async function deleteSectionAction(formData: FormData) {
  "use server";
  const companyId = await requireCompanyId();
  const id = formData.get("id") as string;
  if (!id) return;

  // seguridad: borra solo si pertenece a la misma company
  await prisma.knowledgeSection.delete({
    where: { id },
  }).catch(() => { /* silencio si ya no existe */ });

  // opcional: compactar positions (no imprescindible)
  const sections = await prisma.knowledgeSection.findMany({
    where: { companyId },
    orderBy: { position: "asc" },
    select: { id: true },
  });
  await Promise.all(
    sections.map((s, i) =>
      prisma.knowledgeSection.update({ where: { id: s.id }, data: { position: i } })
    )
  );

  revalidatePath("/dashboard/knowledge");
}

export async function saveSectionAction(formData: FormData) {
  "use server";
  await requireCompanyId();
  const id = formData.get("id") as string;
  if (!id) return;

  const title = ((formData.get("title") as string) || "").trim();
  const visibility = (formData.get("visibility") as KnowledgeVisibility) || "PUBLIC";
  const content = ((formData.get("content") as string) || "").trim();

  await prisma.knowledgeSection.update({
    where: { id },
    data: { title, visibility, content },
  });

  revalidatePath("/dashboard/knowledge");
}

/* ============ Helper ============ */
function visibilityBadge(v: KnowledgeVisibility) {
  const color = v === "PUBLIC" ? "#16a34a" : "#6b7280";
  const bg = v === "PUBLIC" ? "#ecfdf5" : "#f3f4f6";
  return (
    <span style={{ fontSize: 12, fontWeight: 700, color, background: bg, padding: "2px 8px", borderRadius: 999 }}>
      {v}
    </span>
  );
}

/* ============ Component (Server) ============ */
export default async function KnowledgeSectionsManager({
  basePath = "/dashboard/knowledge",
  selectedId,
}: {
  /** ruta donde vive la page que lo renderiza */
  basePath?: string;
  /** id de sección seleccionada (pásalo desde searchParams.sectionId si quieres) */
  selectedId?: string;
}) {
  const companyId = await requireCompanyId();

  const sections = await prisma.knowledgeSection.findMany({
    where: { companyId, isActive: true },
    orderBy: [{ position: "asc" }, { updatedAt: "desc" }],
    select: { id: true, title: true, visibility: true, updatedAt: true },
  });

  const current =
    sections.find((s) => s.id === selectedId) ??
    (sections.length ? sections[0] : undefined);

  const currentFull = current
    ? await prisma.knowledgeSection.findUnique({
        where: { id: current.id },
        select: { id: true, title: true, visibility: true, content: true, updatedAt: true },
      })
    : null;

  return (
    <div style={{ display: "flex", gap: 24, padding: 24, minHeight: 560 }}>
      {/* Sidebar */}
      <aside style={{ width: 300 }}>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
          <h2 style={{ fontSize: 16, fontWeight: 700 }}>Secciones</h2>
          <form action={createSectionAction} style={{ display: "flex", gap: 8 }}>
            <input type="hidden" name="visibility" value="PUBLIC" />
            <input
              type="text"
              name="title"
              placeholder="Nueva sección…"
              style={{ border: "1px solid #e5e7eb", borderRadius: 8, padding: "6px 8px", fontSize: 13 }}
            />
            <button
              type="submit"
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 8,
                padding: "6px 10px",
                background: "white",
                fontSize: 12,
                fontWeight: 700,
              }}
              title="Crear sección (por defecto: PUBLIC)"
            >
              Añadir
            </button>
          </form>
        </div>

        <nav style={{ display: "grid", gap: 8 }}>
          {sections.map((s) => (
            <div
              key={s.id}
              style={{
                border: "1px solid #e5e7eb",
                borderRadius: 10,
                padding: 10,
                background: current?.id === s.id ? "#f9fafb" : "white",
              }}
            >
              <a
                href={`${basePath}?sectionId=${s.id}`}
                style={{ display: "block", textDecoration: "none", color: "inherit" }}
              >
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 8 }}>
                  <div style={{ fontWeight: 700, fontSize: 14, lineHeight: 1.2 }}>{s.title || "(sin título)"}</div>
                  {visibilityBadge(s.visibility as KnowledgeVisibility)}
                </div>
                <div style={{ color: "#6b7280", fontSize: 12, marginTop: 4 }}>
                  {new Date(s.updatedAt).toLocaleString()}
                </div>
              </a>

              <form action={deleteSectionAction} style={{ marginTop: 8 }}>
                <input type="hidden" name="id" value={s.id} />
                <button
                  type="submit"
                  style={{
                    fontSize: 12,
                    color: "#b91c1c",
                    background: "white",
                    border: "1px solid #fee2e2",
                    borderRadius: 8,
                    padding: "4px 8px",
                  }}
                >
                  Borrar
                </button>
              </form>
            </div>
          ))}

          {!sections.length && (
            <div style={{ color: "#6b7280", fontSize: 13 }}>
              No hay secciones. Crea la primera con el formulario de arriba.
            </div>
          )}
        </nav>

        <div style={{ marginTop: 12, fontSize: 12, color: "#6b7280" }}>
          Total: <strong>{sections.length}</strong> secciones
        </div>
      </aside>

      {/* Editor */}
      <main style={{ flex: 1 }}>
        {!currentFull ? (
          <div
            style={{
              border: "1px dashed #e5e7eb",
              borderRadius: 12,
              padding: 24,
              color: "#6b7280",
              fontSize: 14,
            }}
          >
            Selecciona una sección para editar su contenido.
          </div>
        ) : (
          <section style={{ border: "1px solid #e5e7eb", borderRadius: 12, padding: 16 }}>
            <header style={{ marginBottom: 12 }}>
              <h1 style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{currentFull.title || "(sin título)"}</h1>
              <div style={{ color: "#6b7280", fontSize: 12 }}>
                Última edición: {new Date(currentFull.updatedAt!).toLocaleString()}
              </div>
            </header>

            <form action={saveSectionAction} style={{ display: "grid", gap: 12 }}>
              <input type="hidden" name="id" value={currentFull.id} />

              <label style={{ fontSize: 12, color: "#6b7280" }}>Título</label>
              <input
                type="text"
                name="title"
                defaultValue={currentFull.title ?? ""}
                style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
              />

              <label style={{ fontSize: 12, color: "#6b7280" }}>Visibilidad</label>
              <select
                name="visibility"
                defaultValue={currentFull.visibility}
                style={{ padding: 10, border: "1px solid #e5e7eb", borderRadius: 8, fontSize: 14 }}
              >
                <option value="PUBLIC">PUBLIC</option>
                <option value="PRIVATE">PRIVATE</option>
              </select>

              <label style={{ fontSize: 12, color: "#6b7280" }}>Contenido</label>
              <textarea
                name="content"
                defaultValue={currentFull.content ?? ""}
                placeholder="Horarios, dirección, servicios, reservas, etc."
                rows={16}
                style={{
                  padding: 10,
                  border: "1px solid #e5e7eb",
                  borderRadius: 8,
                  fontSize: 14,
                  whiteSpace: "pre-wrap",
                }}
              />

              <div style={{ display: "flex", justifyContent: "flex-end", gap: 12 }}>
                <button
                  type="submit"
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "8px 14px",
                    background: "white",
                    fontWeight: 700,
                  }}
                >
                  Guardar cambios
                </button>
                <a
                  href={`${basePath}?sectionId=${currentFull.id}`}
                  style={{
                    border: "1px solid #e5e7eb",
                    borderRadius: 8,
                    padding: "8px 14px",
                    background: "white",
                    textDecoration: "none",
                    fontWeight: 700,
                  }}
                >
                  Cancelar
                </a>
              </div>
            </form>
          </section>
        )}
      </main>
    </div>
  );
}

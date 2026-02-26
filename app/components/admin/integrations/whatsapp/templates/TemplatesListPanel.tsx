// app/components/admin/integrations/whatsapp/templates/TemplatesListPanel.tsx
"use client";

import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/app/components/ui/card";
import { Input } from "@/app/components/ui/input";
import { Button } from "@/app/components/ui/button";
import { Badge } from "@/app/components/ui/badge";
import { Separator } from "@/app/components/ui/separator";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/app/components/ui/dropdown-menu";

import {
  LayoutTemplate,
  Search,
  Filter,
  ChevronDown,
  ChevronRight,
  CheckCircle2,
  Clock,
  XCircle,
  RefreshCw,
  Star,
} from "lucide-react";

import type {
  TemplateCategory,
  TemplateFilters,
  TemplateStatus,
  TemplateUse,
  WaTemplate,
} from "./types";
import { extractVars, fmtDate } from "./utils";
import TemplatesAddDialog from "./TemplatesAddDialog";
import { inferTemplateGroupKey } from "@/lib/whatsapp/templateGroups";

function StatusBadge({ status }: { status: TemplateStatus }) {
  if (status === "approved") {
    return (
      <Badge className="gap-1">
        <CheckCircle2 className="h-3.5 w-3.5" />
        Aprobada
      </Badge>
    );
  }
  if (status === "pending") {
    return (
      <Badge variant="secondary" className="gap-1">
        <Clock className="h-3.5 w-3.5" />
        En revisión
      </Badge>
    );
  }
  return (
    <Badge variant="destructive" className="gap-1">
      <XCircle className="h-3.5 w-3.5" />
      Rechazada
    </Badge>
  );
}

function CategoryBadge({ category }: { category: TemplateCategory }) {
  const label =
    category === "marketing" ? "Marketing" : category === "utility" ? "Utility" : "Auth";
  return (
    <Badge variant="outline" className="text-xs">
      {label}
    </Badge>
  );
}

function UseBadge({ use }: { use: TemplateUse }) {
  return (
    <Badge variant="outline" className="text-xs">
      {use === "start_conversation" ? "Inicia conversación" : "Solo 24h"}
    </Badge>
  );
}

function categoryLabel(cat: TemplateCategory) {
  if (cat === "utility") return "Utility";
  if (cat === "marketing") return "Marketing";
  return "Authentication";
}

function categoryOrder(cat: TemplateCategory) {
  if (cat === "utility") return 1;
  if (cat === "marketing") return 2;
  return 3;
}

type GroupBlock = {
  category: TemplateCategory;
  label: string;
  items: WaTemplate[];
  total: number;
  favs: number;
};

export default function TemplatesListPanel({
  items,
  loading,
  selectedId,
  onSelect,
  filters,
  onChangeFilters,
  languages,
  onRefresh,
  onToggleFavorite,
}: {
  items: WaTemplate[];
  loading: boolean;
  selectedId: string | null;
  onSelect: (id: string) => void;
  filters: TemplateFilters;
  onChangeFilters: (next: TemplateFilters) => void;
  languages: string[];
  onRefresh: () => void;
  onToggleFavorite: (templateId: string, next: boolean) => void;
}) {
  const [openCats, setOpenCats] = useState<Record<TemplateCategory, boolean>>({
    utility: true,
    marketing: true,
    authentication: true,
  });

  // Optimistic overrides: id -> isFavorite
  const [favOverride, setFavOverride] = useState<Record<string, boolean | undefined>>({});

  function effectiveIsFavorite(t: WaTemplate) {
    const v = favOverride[t.id];
    if (typeof v === "boolean") return v;
    return Boolean(t.isFavorite);
  }

  const filtered = useMemo(() => {
    const query = filters.q.trim().toLowerCase();

    return items
      .filter((t) => {
        if (filters.status !== "all" && t.status !== filters.status) return false;
        if (filters.category !== "all" && t.category !== filters.category) return false;
        if (filters.lang !== "all" && t.language !== filters.lang) return false;

        if (!query) return true;

        const hay = `${t.title} ${t.name} ${t.body}`.toLowerCase();
        return hay.includes(query);
      })
      .sort((a, b) => {
        const af = effectiveIsFavorite(a) ? 1 : 0;
        const bf = effectiveIsFavorite(b) ? 1 : 0;
        if (bf !== af) return bf - af;
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, filters, favOverride]);

  const groups = useMemo<GroupBlock[]>(() => {
    const byCat = new Map<TemplateCategory, WaTemplate[]>();
    for (const t of filtered) {
      const arr = byCat.get(t.category) ?? [];
      arr.push(t);
      byCat.set(t.category, arr);
    }

    const cats: TemplateCategory[] = ["utility", "marketing", "authentication"];

    const blocks: GroupBlock[] = cats
      .map((cat) => {
        const arr = byCat.get(cat) ?? [];
        const favs = arr.reduce((acc, x) => acc + (effectiveIsFavorite(x) ? 1 : 0), 0);

        // dentro del grupo: favoritos arriba, luego updated
        arr.sort((a, b) => {
          const af = effectiveIsFavorite(a) ? 1 : 0;
          const bf = effectiveIsFavorite(b) ? 1 : 0;
          if (bf !== af) return bf - af;
          return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
        });

        return {
          category: cat,
          label: categoryLabel(cat),
          items: arr,
          total: arr.length,
          favs,
        };
      })
      .sort((a, b) => categoryOrder(a.category) - categoryOrder(b.category));

    return blocks;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filtered, favOverride]);

  function toggleCat(cat: TemplateCategory) {
    setOpenCats((prev) => ({ ...prev, [cat]: !prev[cat] }));
  }

  function handleToggleFavoriteUI(t: WaTemplate) {
    const next = !effectiveIsFavorite(t);
    const groupKey = inferTemplateGroupKey(t.name);

    // UI instantánea: si marcas favorito, desmarca el anterior del mismo grupo
    setFavOverride((prev) => {
      const nextMap: Record<string, boolean | undefined> = { ...prev };

      if (next) {
        for (const x of items) {
          const k = inferTemplateGroupKey(x.name);
          if (k === groupKey) nextMap[x.id] = false;
        }
      }

      nextMap[t.id] = next;
      return nextMap;
    });

    onToggleFavorite(t.id, next);
  }

  const showEmptyLoading = loading && items.length === 0;

  return (
    <Card className="h-full overflow-hidden">
      <CardHeader className="border-b py-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <LayoutTemplate className="h-5 w-5" />
              Plantillas
            </CardTitle>
            <CardDescription className="mt-1">
              Gestión interna (DB). Luego: sync con Meta si lo necesitas.
            </CardDescription>
          </div>

          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              size="icon"
              onClick={onRefresh}
              disabled={showEmptyLoading}
              aria-label="Refrescar"
            >
              <RefreshCw className={["h-4 w-4", loading ? "animate-spin" : ""].join(" ")} />
            </Button>
            <TemplatesAddDialog />
          </div>
        </div>

        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
          <div className="relative flex-1">
            <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              value={filters.q}
              onChange={(e) => onChangeFilters({ ...filters, q: e.target.value })}
              placeholder="Buscar por nombre, título o texto..."
              className="pl-9"
              disabled={showEmptyLoading}
            />
          </div>

          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2" disabled={showEmptyLoading}>
                <Filter className="h-4 w-4" />
                Filtros
                <ChevronDown className="h-4 w-4 opacity-70" />
              </Button>
            </DropdownMenuTrigger>

            <DropdownMenuContent align="end" className="w-72">
              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Estado</div>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, status: "all" })}>
                Todos
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, status: "approved" })}>
                Aprobadas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, status: "pending" })}>
                En revisión
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, status: "rejected" })}>
                Rechazadas
              </DropdownMenuItem>

              <Separator className="my-2" />

              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Categoría</div>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, category: "all" })}>
                Todas
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, category: "marketing" })}>
                Marketing
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, category: "utility" })}>
                Utility
              </DropdownMenuItem>
              <DropdownMenuItem
                onClick={() => onChangeFilters({ ...filters, category: "authentication" })}
              >
                Auth
              </DropdownMenuItem>

              <Separator className="my-2" />

              <div className="px-3 py-2 text-xs font-semibold text-muted-foreground">Idioma</div>
              <DropdownMenuItem onClick={() => onChangeFilters({ ...filters, lang: "all" })}>
                Todos
              </DropdownMenuItem>
              {languages.map((l) => (
                <DropdownMenuItem key={l} onClick={() => onChangeFilters({ ...filters, lang: l })}>
                  {l}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </CardHeader>

      <CardContent className="h-[calc(100%-168px)] p-0">
        <div className="h-full overflow-auto">
          {showEmptyLoading ? (
            <div className="p-6 text-sm text-muted-foreground">Cargando...</div>
          ) : filtered.length === 0 ? (
            <div className="p-6 text-sm text-muted-foreground">No hay plantillas que coincidan.</div>
          ) : (
            <div className="divide-y">
              {groups.map((g) => {
                const isOpen = openCats[g.category];
                return (
                  <div key={g.category} className="border-b last:border-b-0">
                    <button
                      type="button"
                      onClick={() => toggleCat(g.category)}
                      className="flex w-full items-center justify-between gap-3 px-4 py-3 hover:bg-muted/30"
                    >
                      <div className="flex items-center gap-2">
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4 text-muted-foreground" />
                        ) : (
                          <ChevronRight className="h-4 w-4 text-muted-foreground" />
                        )}
                        <div className="text-sm font-semibold">{g.label}</div>
                      </div>

                      <div className="flex items-center gap-2">
                        <Badge variant="secondary" className="text-xs">
                          {g.total}
                        </Badge>
                        {g.favs > 0 ? (
                          <Badge variant="outline" className="text-xs">
                            ★ {g.favs}
                          </Badge>
                        ) : null}
                      </div>
                    </button>

                    {isOpen ? (
                      <div className="divide-y">
                        {g.items.map((t) => {
                          const active = t.id === selectedId;
                          const vars = extractVars(t.body);
                          const fav = effectiveIsFavorite(t);

                          return (
                            <button
                              key={t.id}
                              type="button"
                              onClick={() => onSelect(t.id)}
                              className={[
                                "w-full text-left",
                                "px-4 py-4",
                                "hover:bg-muted/40",
                                active ? "bg-muted/50" : "bg-transparent",
                              ].join(" ")}
                            >
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <div className="truncate text-sm font-semibold">{t.title}</div>
                                  <div className="mt-0.5 truncate font-mono text-[11px] text-muted-foreground">
                                    {t.name}
                                  </div>
                                </div>

                                <div className="flex items-center gap-2">
                                  <span
                                    role="button"
                                    tabIndex={0}
                                    onClick={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      handleToggleFavoriteUI(t);
                                    }}
                                    onKeyDown={(e) => {
                                      if (e.key === "Enter" || e.key === " ") {
                                        e.preventDefault();
                                        e.stopPropagation();
                                        handleToggleFavoriteUI(t);
                                      }
                                    }}
                                    className={[
                                      "inline-flex h-8 w-8 items-center justify-center rounded-md border",
                                      "hover:bg-muted/50",
                                      "cursor-pointer select-none",
                                      fav ? "bg-muted/60" : "bg-background",
                                    ].join(" ")}
                                    aria-label={fav ? "Quitar de favoritos" : "Marcar como favorito"}
                                    title={fav ? "Favorito" : "Marcar favorito"}
                                  >
                                    <Star
                                      className={["h-4 w-4", fav ? "" : "opacity-60"].join(" ")}
                                      {...(fav ? { fill: "currentColor" } : {})}
                                    />
                                  </span>

                                  <div className="shrink-0 text-xs text-muted-foreground">
                                    {fmtDate(t.updatedAt)}
                                  </div>
                                </div>
                              </div>

                              <div className="mt-2 flex flex-wrap items-center gap-2">
                                <StatusBadge status={t.status} />
                                <CategoryBadge category={t.category} />
                                <Badge variant="outline" className="text-xs">
                                  {t.language}
                                </Badge>
                                <UseBadge use={t.use} />
                              </div>

                              <div className="mt-2 line-clamp-2 text-xs text-muted-foreground">
                                {t.body}
                              </div>

                              {vars.length > 0 ? (
                                <div className="mt-2 flex flex-wrap gap-1.5">
                                  {vars.map((v) => (
                                    <Badge key={v} variant="secondary" className="text-[11px]">
                                      {v}
                                    </Badge>
                                  ))}
                                </div>
                              ) : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
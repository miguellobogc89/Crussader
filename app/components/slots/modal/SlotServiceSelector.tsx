"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, LayoutGroup, motion } from "framer-motion";
import {
  Droplets,
  Loader2,
  PackageOpen,
  Plus,
  Scissors,
  Search,
  Sparkles,
  X,
} from "lucide-react";
import type {
  CreateServiceDraft,
  SavedServiceItem,
  SelectedServiceItem,
} from "./slotModal.types";

type SlotServiceSelectorProps = {
  companyId?: string;
  locationId: string;
  slotId: string;
  slotDurationMin: number;
  selectedServices: SelectedServiceItem[];
  onChange: (services: SelectedServiceItem[]) => void;
  onSaved?: () => void;
};

const SERVICES_LIST_ENDPOINT = "/api/slots/services/list";
const SERVICES_CREATE_ENDPOINT = "/api/slots/services/create";

function normalizePrice(value: string): number | null {
  const normalized = value.replace(",", ".").trim();

  if (!normalized) {
    return null;
  }

  const parsed = Number(normalized);

  if (Number.isNaN(parsed)) {
    return null;
  }

  if (parsed < 0) {
    return null;
  }

  return parsed;
}

function normalizeDuration(value: string): number | null {
  const parsed = Number(value);

  if (Number.isNaN(parsed)) {
    return null;
  }

  if (parsed <= 0) {
    return null;
  }

  return Math.floor(parsed);
}

function toSelectedService(service: SavedServiceItem): SelectedServiceItem {
  return {
    serviceId: service.id,
    serviceName: service.name,
    price: service.price,
    durationMin: service.durationMin,
  };
}

function isServiceSelected(
  selectedServices: SelectedServiceItem[],
  serviceId: string,
): boolean {
  return selectedServices.some((service) => service.serviceId === serviceId);
}

function getServiceIcon(serviceName: string) {
  const normalized = serviceName.toLowerCase();

  if (normalized.includes("hidrat")) {
    return Droplets;
  }

  if (normalized.includes("corte")) {
    return Scissors;
  }

  if (normalized.includes("barba")) {
    return Scissors;
  }

  if (normalized.includes("peinado")) {
    return Scissors;
  }

  return Sparkles;
}

function sortServices(items: SavedServiceItem[]): SavedServiceItem[] {
  return [...items].sort((a, b) => {
    if (a.name !== b.name) {
      return a.name.localeCompare(b.name, "es");
    }

    if (a.price !== b.price) {
      return a.price - b.price;
    }

    return a.durationMin - b.durationMin;
  });
}

function buildSelectedSavedServices(
  allServices: SavedServiceItem[],
  selectedServices: SelectedServiceItem[],
): SavedServiceItem[] {
  return selectedServices
    .map((selected) => {
      return allServices.find((service) => service.id === selected.serviceId);
    })
    .filter((service): service is SavedServiceItem => Boolean(service));
}

export function SlotServiceSelector({
  companyId,
  locationId,
  slotId,
  slotDurationMin,
  selectedServices,
  onChange,
  onSaved,
}: SlotServiceSelectorProps) {
  const [services, setServices] = useState<SavedServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [isAdding, setIsAdding] = useState(false);
  const [search, setSearch] = useState("");
  const [hoveredServiceId, setHoveredServiceId] = useState<string | null>(null);
  const [justAddedId, setJustAddedId] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [isSubmittingCreate, setIsSubmittingCreate] = useState(false);
  const [createErrorText, setCreateErrorText] = useState("");
  const [createSuccessText, setCreateSuccessText] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [draft, setDraft] = useState<CreateServiceDraft>({
    name: "",
    price: "",
    durationMin: "",
  });

  useEffect(() => {
    if (!locationId && !companyId) {
      setServices([]);
      return;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        setLoading(true);
        setErrorText("");

        const params = new URLSearchParams();

        if (locationId) {
          params.set("locationId", locationId);
        } else if (companyId) {
          params.set("companyId", companyId);
        }

        const response = await fetch(
          `${SERVICES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data?.ok) {
          setErrorText("No se pudieron cargar los servicios.");
          setServices([]);
          setLoading(false);
          return;
        }

        const nextServices = Array.isArray(data.services)
          ? data.services.map((item: any) => {
              return {
                id: String(item.id),
                name: String(item.name ?? ""),
                price: Number(item.price ?? 0),
                durationMin: Number(item.durationMin ?? 0),
                active: Boolean(item.active ?? true),
              } satisfies SavedServiceItem;
            })
          : [];

        setServices(nextServices);
        setLoading(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[SlotServiceSelector] loadServices", error);
        setErrorText("No se pudieron cargar los servicios.");
        setServices([]);
        setLoading(false);
      }
    }

    loadServices();

    return () => controller.abort();
  }, [locationId, companyId]);

  useEffect(() => {
    if (!companyId) {
      return;
    }

    const compatibleIds = new Set(
      services
        .filter((service) => service.active !== false)
        .filter((service) => service.durationMin <= slotDurationMin)
        .map((service) => service.id),
    );

    const filteredSelectedServices = selectedServices.filter((service) => {
      return compatibleIds.has(service.serviceId);
    });

    if (filteredSelectedServices.length !== selectedServices.length) {
      onChange(filteredSelectedServices);
    }
  }, [companyId, services, slotDurationMin, selectedServices, onChange]);

  useEffect(() => {
    if (!createSuccessText) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setCreateSuccessText("");
    }, 1600);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [createSuccessText]);

  useEffect(() => {
    if (!justAddedId) {
      return;
    }

    const timeout = window.setTimeout(() => {
      setJustAddedId(null);
    }, 1400);

    return () => {
      window.clearTimeout(timeout);
    };
  }, [justAddedId]);

useEffect(() => {
  if (!slotId) {
    return;
  }

  const timeout = window.setTimeout(async () => {
    try {
      setIsSaving(true);

      const response = await fetch("/api/slots/services/assign", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          slotId,
          services: selectedServices.map((service, index) => {
            return {
              serviceId: service.serviceId,
              position: index,
            };
          }),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "No se pudieron guardar los servicios.");
      }

      // 👇 AQUÍ está lo importante
      if (onSaved) {
        onSaved();
      }

    } catch (error) {
      console.error("[autosave services]", error);
    } finally {
      setIsSaving(false);
    }
  }, 400);

  return () => {
    window.clearTimeout(timeout);
  };
}, [selectedServices, slotId, onSaved]);

  const compatibleServices = useMemo(() => {
    return sortServices(
      services
        .filter((service) => service.active !== false)
        .filter((service) => service.durationMin <= slotDurationMin),
    );
  }, [services, slotDurationMin]);

  const selectedSavedServices = useMemo(() => {
    return buildSelectedSavedServices(compatibleServices, selectedServices);
  }, [compatibleServices, selectedServices]);

  const availableServices = useMemo(() => {
    const normalizedSearch = search.trim().toLowerCase();

    return compatibleServices.filter((service) => {
      if (isServiceSelected(selectedServices, service.id)) {
        return false;
      }

      if (!normalizedSearch) {
        return true;
      }

      return service.name.toLowerCase().includes(normalizedSearch);
    });
  }, [compatibleServices, search, selectedServices]);

  function addService(service: SavedServiceItem) {
    if (isServiceSelected(selectedServices, service.id)) {
      return;
    }

    onChange([...selectedServices, toSelectedService(service)]);
    setJustAddedId(service.id);
  }

  function removeService(serviceId: string) {
    onChange(
      selectedServices.filter((selectedService) => {
        return selectedService.serviceId !== serviceId;
      }),
    );
  }

  function toggleAdding() {
    setIsAdding((current) => !current);
    setSearch("");
    setIsCreating(false);
    setCreateErrorText("");
    setCreateSuccessText("");
    setDraft({
      name: "",
      price: "",
      durationMin: "",
    });
  }

  async function handleCreateService() {
    setCreateErrorText("");
    setCreateSuccessText("");

    if (!locationId) {
      setCreateErrorText("Selecciona una ubicación.");
      return;
    }

    const name = draft.name.trim();
    const price = normalizePrice(draft.price);
    const durationMin = normalizeDuration(draft.durationMin);

    if (!name) {
      setCreateErrorText("Introduce el nombre del servicio.");
      return;
    }

    if (price === null) {
      setCreateErrorText("Introduce un precio válido.");
      return;
    }

    if (durationMin === null) {
      setCreateErrorText("Introduce una duración válida.");
      return;
    }

    if (durationMin > slotDurationMin) {
      setCreateErrorText("Ese servicio no cabe en este hueco.");
      return;
    }

    setIsSubmittingCreate(true);

    try {
      const response = await fetch(SERVICES_CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          locationId,
          name,
          price,
          durationMin,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok || !data?.service?.id) {
        setCreateErrorText(data?.error ?? "No se pudo crear el servicio.");
        setIsSubmittingCreate(false);
        return;
      }

      const createdService: SavedServiceItem = {
        id: String(data.service.id),
        name: String(data.service.name ?? name),
        price: Number(data.service.price ?? price),
        durationMin: Number(data.service.durationMin ?? durationMin),
        active: true,
      };

      setServices((current) => {
        return sortServices([createdService, ...current]);
      });

      onChange([...selectedServices, toSelectedService(createdService)]);
      setJustAddedId(createdService.id);
      setCreateSuccessText("Servicio creado correctamente");
      setDraft({
        name: "",
        price: "",
        durationMin: "",
      });
      setIsCreating(false);
      setSearch("");
      setIsSubmittingCreate(false);
    } catch (error) {
      console.error("[SlotServiceSelector] createService", error);
      setCreateErrorText("No se pudo crear el servicio.");
      setIsSubmittingCreate(false);
    }
  }

  {isSaving && (
  <div className="text-xs text-muted-foreground flex items-center gap-1">
    <Loader2 className="h-3 w-3 animate-spin" />
    Guardando...
  </div>
)}

  return (
    <div className="space-y-3">
      <div className="space-y-1">
        <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Servicios ofertados
        </p>
        <p className="text-xs text-muted-foreground">
          Se muestran los servicios de la empresa que caben en {slotDurationMin} min.
        </p>
      </div>

      {loading ? (
        <div className="flex items-center gap-2 rounded-2xl border border-border/60 bg-muted/20 px-4 py-3 text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          Cargando servicios...
        </div>
      ) : null}

      {!loading && errorText ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700">
          {errorText}
        </div>
      ) : null}

      {!loading && !errorText ? (
        <LayoutGroup>
          <div className="space-y-3">
            <div className="flex min-h-[44px] flex-wrap gap-2">
              <AnimatePresence mode="popLayout">
{selectedSavedServices.length === 0 ? (
  <motion.div
    key="empty-banner"
    layout
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    className="flex w-full items-start gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-3 text-sm text-amber-800"
  >
    <PackageOpen className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
    <span>Este hueco aún no tiene servicios asignados.</span>
  </motion.div>
) : null}

                {selectedSavedServices.map((service) => {
                  const Icon = getServiceIcon(service.name);
                  const isNew = justAddedId === service.id;
                  const isHovered = hoveredServiceId === service.id;

                  return (
                    <motion.div
                      key={service.id}
                      layout
                      layoutId={`service-${service.id}`}
                      initial={{ opacity: 0, scale: 0.85, y: 12 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.85, y: 12 }}
                      transition={{
                        type: "spring",
                        damping: 28,
                        stiffness: 340,
                        mass: 0.8,
                      }}
                      className="relative"
                      onMouseEnter={() => setHoveredServiceId(service.id)}
                      onMouseLeave={() => setHoveredServiceId(null)}
                    >
                      <div className="inline-flex items-center gap-2 rounded-xl border border-border/70 bg-card px-3 py-2.5 pr-3.5 text-sm font-medium text-foreground shadow-[0_1px_3px_0_hsl(var(--border)/0.5)] transition-all duration-150 hover:border-border hover:shadow-[0_2px_8px_0_hsl(var(--border)/0.6)]">
                        <span className="flex h-6 w-6 items-center justify-center rounded-lg bg-primary/10">
                          <Icon className="h-3.5 w-3.5 text-primary" />
                        </span>

                        <span>{service.name}</span>

                        <span className="ml-0.5 text-xs font-normal tabular-nums text-muted-foreground">
                          {service.price}€ · {service.durationMin} min
                        </span>
                      </div>

                      <AnimatePresence>
                        {isNew ? (
                          <motion.span
                            initial={{ opacity: 0, x: -6 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: 6 }}
                            transition={{ duration: 0.2 }}
                            className="pointer-events-none absolute -right-2 -top-2 rounded-md bg-primary px-1.5 py-0.5 text-[10px] font-semibold text-primary-foreground shadow-sm"
                          >
                            Añadido
                          </motion.span>
                        ) : null}
                      </AnimatePresence>

<AnimatePresence initial={false}>
  {isHovered && !isNew ? (
    <motion.button
      type="button"
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.5 }}
      transition={{ duration: 0.15 }}
      onClick={() => removeService(service.id)}
      className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full bg-red-500 text-white shadow-sm transition-transform active:scale-90"
    >
      <X className="h-3 w-3" />
    </motion.button>
  ) : null}
</AnimatePresence>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            <div className="flex items-center gap-2">
              <motion.button
                type="button"
                onClick={toggleAdding}
                layout
                className="inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 active:scale-[0.97]"
                animate={{
                  backgroundColor: isAdding
                    ? "hsl(var(--muted))"
                    : "rgba(239,246,255,1)",
                  color: isAdding
                    ? "hsl(var(--muted-foreground))"
                    : "rgba(37,99,235,1)",
                }}
                transition={{ duration: 0.2 }}
              >
                <motion.span
                  animate={{ rotate: isAdding ? 45 : 0 }}
                  transition={{ type: "spring", damping: 20, stiffness: 300 }}
                  className="flex items-center"
                >
                  <Plus className="h-4 w-4" />
                </motion.span>
                <motion.span key={isAdding ? "cancel" : "add"}>
                  {isAdding ? "Cancelar" : "Añadir"}
                </motion.span>
              </motion.button>

              <AnimatePresence>
                {createSuccessText ? (
                  <motion.div
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    className="rounded-full bg-primary/10 px-3 py-1 text-xs font-medium text-primary"
                  >
                    {createSuccessText}
                  </motion.div>
                ) : null}
              </AnimatePresence>
            </div>

            <AnimatePresence>
              {isAdding ? (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ type: "spring", damping: 26, stiffness: 300 }}
                  className="overflow-hidden"
                >
                  <div className="space-y-2.5 pt-1">
                    <div className="relative">
                      <Search className="pointer-events-none absolute left-3 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Buscar servicio..."
                        className="h-9 w-full rounded-xl border border-border/60 bg-muted/50 pl-9 pr-3 text-sm text-foreground placeholder:text-muted-foreground transition-shadow focus:outline-none focus:border-[#2563EB] focus:ring-0"
                      />
                    </div>

                    <div className="space-y-1">
                      <AnimatePresence mode="popLayout">
                        {availableServices.map((service) => {
                          const Icon = getServiceIcon(service.name);

                          return (
                            <motion.button
                              key={service.id}
                              type="button"
                              layout
                              layoutId={`service-${service.id}`}
                              initial={{ opacity: 0, y: -8 }}
                              animate={{ opacity: 1, y: 0 }}
                              exit={{ opacity: 0, y: -8 }}
                              transition={{
                                type: "spring",
                                damping: 28,
                                stiffness: 340,
                                mass: 0.8,
                              }}
                              onClick={() => addService(service)}
                              className="group/item flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm transition-colors duration-150 hover:bg-primary/10 active:scale-[0.98]"
                            >
                              <span className="flex h-7 w-7 items-center justify-center rounded-lg bg-muted transition-colors duration-150 group-hover/item:bg-primary/10">
                                <Icon className="h-3.5 w-3.5 text-muted-foreground transition-colors duration-150 group-hover/item:text-primary" />
                              </span>

                              <span className="flex-1 font-medium text-foreground">
                                {service.name}
                              </span>

                              <span className="text-xs tabular-nums text-muted-foreground">
                                {service.price}€ · {service.durationMin} min
                              </span>

                              <Plus className="h-3.5 w-3.5 text-muted-foreground/50 transition-colors duration-150 group-hover/item:text-primary" />
                            </motion.button>
                          );
                        })}

                        {availableServices.length === 0 && !isCreating ? (
                          <motion.p
                            key="no-results"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="py-3 text-center text-sm text-muted-foreground"
                          >
                            No se encontró "{search || "…"}"
                          </motion.p>
                        ) : null}
                      </AnimatePresence>
                    </div>

                    <AnimatePresence mode="wait">
                      {!isCreating ? (
                        <motion.button
                          key="create-trigger"
                          type="button"
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          onClick={() => {
                            setIsCreating(true);
                            setCreateErrorText("");
                            setDraft((current) => {
                              return {
                                ...current,
                                name: search,
                              };
                            });
                          }}
                          className="flex w-full items-center gap-2 rounded-xl px-3 py-2.5 text-sm font-medium text-primary transition-colors duration-150 hover:bg-primary/10 active:scale-[0.98]"
                        >
                          <Plus className="h-3.5 w-3.5" />
                          Crear servicio nuevo
                        </motion.button>
                      ) : null}

                      {isCreating ? (
                        <motion.div
                          key="create-form"
                          initial={{ opacity: 0, height: 0 }}
                          animate={{ opacity: 1, height: "auto" }}
                          exit={{ opacity: 0, height: 0 }}
                          transition={{ type: "spring", damping: 26, stiffness: 300 }}
                          className="overflow-hidden"
                        >
<div className="grid grid-cols-1 gap-2 sm:grid-cols-[minmax(0,3fr)_78px_86px_auto_auto]">
  <input
    value={draft.name}
    onChange={(e) =>
      setDraft((current) => {
        return {
          ...current,
          name: e.target.value,
        };
      })
    }
    placeholder="Nombre"
    autoFocus
    className="h-8 min-w-0 rounded-lg border border-border/60 bg-card px-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB] focus:ring-0"
  />

  <div className="relative">
    <input
      value={draft.price}
      onChange={(e) =>
        setDraft((current) => {
          return {
            ...current,
            price: e.target.value.replace(/[^0-9,.]/g, ""),
          };
        })
      }
      placeholder="0"
      className="h-8 w-full rounded-lg border border-border/60 bg-card px-2.5 pr-7 text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB] focus:ring-0"
    />
    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
      €
    </span>
  </div>

  <div className="relative">
    <input
      value={draft.durationMin}
      onChange={(e) =>
        setDraft((current) => {
          return {
            ...current,
            durationMin: e.target.value.replace(/[^0-9]/g, ""),
          };
        })
      }
      placeholder="0"
      className="h-8 w-full rounded-lg border border-border/60 bg-card px-2.5 pr-9 text-sm tabular-nums text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-[#2563EB] focus:ring-0"
    />
    <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground">
      min
    </span>
  </div>

  <button
    type="button"
    onClick={handleCreateService}
    disabled={isSubmittingCreate}
    className="h-8 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-95 disabled:opacity-40"
  >
    {isSubmittingCreate ? "Creando..." : "Crear"}
  </button>

  <button
    type="button"
    onClick={() => {
      setIsCreating(false);
      setCreateErrorText("");
      setDraft({
        name: "",
        price: "",
        durationMin: "",
      });
    }}
    className="flex h-8 w-8 items-center justify-center rounded-lg transition-colors hover:bg-muted"
  >
    <X className="h-3.5 w-3.5 text-muted-foreground" />
  </button>
</div>
                        </motion.div>
                      ) : null}
                    </AnimatePresence>
                  </div>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </LayoutGroup>
      ) : null}
    </div>
  );
}
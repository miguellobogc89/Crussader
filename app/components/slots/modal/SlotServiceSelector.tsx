"use client";

import { useEffect, useMemo, useState } from "react";
import { Check, Loader2, Plus, Scissors } from "lucide-react";
import { Button } from "@/app/components/ui/button";
import { Input } from "@/app/components/ui/input";
import { Label } from "@/app/components/ui/label";
import type {
  CreateServiceDraft,
  SavedServiceItem,
  SelectedServiceItem,
} from "./slotModal.types";

type SlotServiceSelectorProps = {
  locationId: string;
  slotDurationMin: number;
  selectedServices: SelectedServiceItem[];
  onChange: (services: SelectedServiceItem[]) => void;
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
  serviceId: string
): boolean {
  return selectedServices.some((service) => service.serviceId === serviceId);
}

export function SlotServiceSelector({
  locationId,
  slotDurationMin,
  selectedServices,
  onChange,
}: SlotServiceSelectorProps) {
  const [services, setServices] = useState<SavedServiceItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [errorText, setErrorText] = useState("");
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [createErrorText, setCreateErrorText] = useState("");
  const [draft, setDraft] = useState<CreateServiceDraft>({
    name: "",
    price: "",
    durationMin: "",
  });

  useEffect(() => {
    if (!locationId) {
      setServices([]);
      return;
    }

    const controller = new AbortController();

    async function loadServices() {
      try {
        setLoading(true);
        setErrorText("");

        const params = new URLSearchParams();
        params.set("locationId", locationId);

        const response = await fetch(
          `${SERVICES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal: controller.signal,
          }
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
  }, [locationId]);

  useEffect(() => {
    if (!locationId) {
      return;
    }

    const compatibleIds = new Set(
      services
        .filter((service) => service.active !== false)
        .filter((service) => service.durationMin <= slotDurationMin)
        .map((service) => service.id)
    );

    const filteredSelectedServices = selectedServices.filter((service) => {
      return compatibleIds.has(service.serviceId);
    });

    if (filteredSelectedServices.length !== selectedServices.length) {
      onChange(filteredSelectedServices);
    }
  }, [locationId, services, slotDurationMin, selectedServices, onChange]);

  const compatibleServices = useMemo(() => {
    return services
      .filter((service) => service.active !== false)
      .filter((service) => service.durationMin <= slotDurationMin)
      .sort((a, b) => {
        if (b.price !== a.price) {
          return b.price - a.price;
        }

        return a.durationMin - b.durationMin;
      });
  }, [services, slotDurationMin]);

  function toggleService(service: SavedServiceItem) {
    const alreadySelected = isServiceSelected(selectedServices, service.id);

    if (alreadySelected) {
      onChange(
        selectedServices.filter((selectedService) => {
          return selectedService.serviceId !== service.id;
        })
      );
      return;
    }

    onChange([...selectedServices, toSelectedService(service)]);
  }

  async function handleCreateService() {
    setCreateErrorText("");

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

    setIsCreating(true);

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
        setCreateErrorText("No se pudo crear el servicio.");
        setIsCreating(false);
        return;
      }

      const createdService: SavedServiceItem = {
        id: String(data.service.id),
        name: String(data.service.name ?? name),
        price: Number(data.service.price ?? price),
        durationMin: Number(data.service.durationMin ?? durationMin),
        active: true,
      };

      setServices((current) => [createdService, ...current]);
      onChange([...selectedServices, toSelectedService(createdService)]);
      setDraft({
        name: "",
        price: "",
        durationMin: "",
      });
      setShowCreateForm(false);
      setIsCreating(false);
    } catch (error) {
      console.error("[SlotServiceSelector] createService", error);
      setCreateErrorText("No se pudo crear el servicio.");
      setIsCreating(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3">
        <div>
          <Label className="text-sm text-muted-foreground">
            Servicios disponibles
          </Label>
          <p className="mt-1 text-xs text-muted-foreground">
            Se muestran los que caben en {slotDurationMin} min.
          </p>
        </div>

        <Button
          type="button"
          variant="outline"
          onClick={() => setShowCreateForm((value) => !value)}
          className="h-9 rounded-xl"
        >
          <Plus className="mr-1 h-4 w-4" />
          Crear servicio
        </Button>
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

      {!loading && !errorText && compatibleServices.length === 0 ? (
        <div className="rounded-2xl border border-border/60 bg-muted/20 px-4 py-4 text-sm text-muted-foreground">
          No hay servicios guardados que quepan en este hueco.
        </div>
      ) : null}

      {!loading && compatibleServices.length > 0 ? (
        <div className="flex flex-wrap gap-2">
          {compatibleServices.map((service) => {
            const selected = isServiceSelected(selectedServices, service.id);

            return (
              <button
                key={service.id}
                type="button"
                onClick={() => toggleService(service)}
                className={[
                  "inline-flex items-center gap-2 rounded-full border px-3 py-2 text-sm transition-colors",
                  selected
                    ? "border-primary/30 bg-primary/10 text-foreground"
                    : "border-border/60 bg-white text-muted-foreground hover:bg-muted/40",
                ].join(" ")}
              >
                {selected ? (
                  <Check className="h-4 w-4 text-primary" />
                ) : (
                  <Scissors className="h-4 w-4" />
                )}

                <span className="font-medium text-foreground">{service.name}</span>
                <span className="text-muted-foreground">· {service.price}€</span>
                <span className="text-muted-foreground">
                  · {service.durationMin} min
                </span>
              </button>
            );
          })}
        </div>
      ) : null}

      {showCreateForm ? (
        <div className="space-y-3 rounded-2xl border border-border/60 bg-muted/20 p-4">
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <div className="space-y-2 sm:col-span-1">
              <Label className="text-xs text-muted-foreground">Nombre</Label>
              <Input
                value={draft.name}
                onChange={(e) =>
                  setDraft((current) => {
                    return {
                      ...current,
                      name: e.target.value,
                    };
                  })
                }
                placeholder="Ej. Higiene dental"
                className="h-10 rounded-xl border-0 bg-white focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Precio</Label>
              <Input
                inputMode="decimal"
                value={draft.price}
                onChange={(e) =>
                  setDraft((current) => {
                    return {
                      ...current,
                      price: e.target.value,
                    };
                  })
                }
                placeholder="45"
                className="h-10 rounded-xl border-0 bg-white focus-visible:ring-primary"
              />
            </div>

            <div className="space-y-2">
              <Label className="text-xs text-muted-foreground">Duración</Label>
              <Input
                inputMode="numeric"
                value={draft.durationMin}
                onChange={(e) =>
                  setDraft((current) => {
                    return {
                      ...current,
                      durationMin: e.target.value,
                    };
                  })
                }
                placeholder="30"
                className="h-10 rounded-xl border-0 bg-white focus-visible:ring-primary"
              />
            </div>
          </div>

          {createErrorText ? (
            <div className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
              {createErrorText}
            </div>
          ) : null}

          <div className="flex items-center justify-end gap-2">
            <Button
              type="button"
              variant="ghost"
              onClick={() => {
                setShowCreateForm(false);
                setCreateErrorText("");
              }}
              className="h-10 rounded-xl"
            >
              Cancelar
            </Button>

            <Button
              type="button"
              onClick={handleCreateService}
              disabled={isCreating}
              className="h-10 rounded-xl"
            >
              {isCreating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creando...
                </>
              ) : (
                "Guardar servicio"
              )}
            </Button>
          </div>
        </div>
      ) : null}

      {selectedServices.length > 0 ? (
        <div className="space-y-2">
          <Label className="text-sm text-muted-foreground">
            Servicios seleccionados
          </Label>

          <div className="flex flex-wrap gap-2">
            {selectedServices.map((service) => {
              return (
                <div
                  key={service.serviceId}
                  className="inline-flex items-center rounded-full bg-primary/10 px-3 py-1.5 text-sm text-foreground"
                >
                  <span className="font-medium">{service.serviceName}</span>
                  <span className="ml-2 text-muted-foreground">
                    {service.price}€ · {service.durationMin} min
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      ) : null}
    </div>
  );
}
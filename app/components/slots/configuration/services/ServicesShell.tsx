// app/components/slots/configuration/services/ServicesShell.tsx
"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { ServicesPanel } from "./ServicesPanel";
import { CreateServicePanel } from "./CreateServicePanel";

export type ServiceItem = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  active: boolean;
};

type AssignedEmployeeServiceItem = {
  id: string;
  name: string;
  durationMin: number;
  price: number;
  active: boolean;
};

type ServicesShellProps = {
  locationId: string;
  selectedEmployeeId: string;
  selectedEmployeeName: string;
  assignedServices: AssignedEmployeeServiceItem[];
  onAssignService: (service: ServiceItem) => void;
  isUpdating?: boolean;
  updateErrorText?: string;
};

const SERVICES_LIST_ENDPOINT = "/api/slots/services/list";
const SERVICES_CREATE_ENDPOINT = "/api/slots/services/create";

export function ServicesShell({
  locationId,
  selectedEmployeeId,
  selectedEmployeeName,
  assignedServices,
  onAssignService,
  isUpdating = false,
  updateErrorText = "",
}: ServicesShellProps) {
  const [services, setServices] = useState<ServiceItem[]>([]);
  const [loadingServices, setLoadingServices] = useState(false);
  const [servicesErrorText, setServicesErrorText] = useState("");
  const [selectedServiceId, setSelectedServiceId] = useState("");
  const [serviceQuery, setServiceQuery] = useState("");
  const [reloadKey, setReloadKey] = useState(0);

  const loadServices = useCallback(
    async (signal?: AbortSignal) => {
      if (!locationId) {
        setServices([]);
        setSelectedServiceId("");
        setServicesErrorText("Selecciona una ubicación.");
        return;
      }

      try {
        setLoadingServices(true);
        setServicesErrorText("");

        const params = new URLSearchParams({ locationId });

        const response = await fetch(
          `${SERVICES_LIST_ENDPOINT}?${params.toString()}`,
          {
            method: "GET",
            cache: "no-store",
            signal,
          },
        );

        const data = await response.json();

        if (!response.ok || !data?.ok) {
          setServices([]);
          setSelectedServiceId("");
          setServicesErrorText(
            data?.error || "No se pudieron cargar los servicios.",
          );
          setLoadingServices(false);
          return;
        }

        const nextServices: ServiceItem[] = Array.isArray(data.services)
          ? data.services.map((item: any) => {
              return {
                id: String(item.id || ""),
                name: String(item.name || ""),
                price: Number(item.price || 0),
                durationMin: Number(item.durationMin || 0),
                active: Boolean(item.active ?? true),
              };
            })
          : [];

        setServices(nextServices);

        setSelectedServiceId((current) => {
          const exists = nextServices.some((s) => {
            return s.id === current;
          });

          if (exists) {
            return current;
          }

          return nextServices[0]?.id ?? "";
        });

        setLoadingServices(false);
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          return;
        }

        console.error("[ServicesShell] loadServices", error);
        setServices([]);
        setSelectedServiceId("");
        setServicesErrorText("No se pudieron cargar los servicios.");
        setLoadingServices(false);
      }
    },
    [locationId],
  );

  useEffect(() => {
    const controller = new AbortController();
    loadServices(controller.signal);
    return () => controller.abort();
  }, [loadServices, reloadKey]);

  const filteredServices = useMemo(() => {
    const normalized = serviceQuery.trim().toLowerCase();

    const assignedIds = new Set(
      assignedServices.map((service) => {
        return service.id;
      }),
    );

    const availableServices = services.filter((service) => {
      return !assignedIds.has(service.id);
    });

    if (!normalized) {
      return availableServices;
    }

    return availableServices.filter((service) => {
      return service.name.toLowerCase().includes(normalized);
    });
  }, [assignedServices, serviceQuery, services]);

  async function handleCreateService(input: {
    name: string;
    price: number;
    durationMin: number;
  }) {
    const response = await fetch(SERVICES_CREATE_ENDPOINT, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        locationId,
        name: input.name,
        price: input.price,
        durationMin: input.durationMin,
      }),
    });

    const data = await response.json();

    if (!response.ok || !data?.ok) {
      throw new Error(data?.error || "No se pudo crear el servicio.");
    }

    setReloadKey((current) => current + 1);
  }

  function handleSelectAndAssign(serviceId: string) {
    if (isUpdating) {
      return;
    }

    setSelectedServiceId(serviceId);

    const selectedService = services.find((service) => {
      return service.id === serviceId;
    });

    if (!selectedService || !selectedEmployeeId) {
      return;
    }

    onAssignService(selectedService);
  }

  return (
    <div className="h-full min-h-0">
      <ServicesPanel
        services={filteredServices}
        selectedServiceId={selectedServiceId}
        serviceQuery={serviceQuery}
        onSelectService={handleSelectAndAssign}
        onServiceQueryChange={setServiceQuery}
        loading={loadingServices}
        errorText={servicesErrorText || updateErrorText}
        selectedEmployeeId={selectedEmployeeId}
        selectedEmployeeName={selectedEmployeeName}
        disabled={isUpdating}
        isUpdating={isUpdating}
        actionSlot={
          <CreateServicePanel
            locationId={locationId}
            onCreateService={handleCreateService}
          />
        }
      />
    </div>
  );
}
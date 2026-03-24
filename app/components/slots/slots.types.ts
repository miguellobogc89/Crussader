// app/components/slots/slot.types.ts
export type SavedServiceItem = {
  id: string;
  name: string;
  price: number;
  durationMin: number;
  active?: boolean;
};

export type SelectedServiceItem = {
  serviceId: string;
  serviceName: string;
  price: number;
  durationMin: number;
};

export type CreateServiceDraft = {
  name: string;
  price: string;
  durationMin: string;
};

export type SlotItem = {
  id: string;
  time: string;
  status: "pending" | "fresh" | "recovered" | "unfilled";
  service: string;
  sentToCount?: number;
};
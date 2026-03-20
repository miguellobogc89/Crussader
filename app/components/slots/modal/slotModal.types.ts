// app/components/slots/modal/slotModal.types.ts
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
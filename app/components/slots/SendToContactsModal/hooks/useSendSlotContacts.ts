// app/components/slots/SendToContactsModal/hooks/useSendSlotContacts.ts

import { useState } from "react";
import {
  buildSendButtonLabel,
  getSendDisabled,
  type CustomerListItem,
} from "@/app/components/slots/helpers/slotsCustomersPickerHelpers";

type Params = {
  companyId: string;
  slotId: string;
  selectedIds: string[];
  selectedCustomers: CustomerListItem[];
  onSent?: () => void;
  onClose: () => void;
};

export function useSendSlotContacts({
  companyId,
  slotId,
  selectedIds,
  selectedCustomers,
  onSent,
  onClose,
}: Params) {
  const [sending, setSending] = useState(false);

  const selectedCount = selectedIds.length;

  const sendDisabled = getSendDisabled({
    selectedCount,
    sending,
  });

  const sendButtonLabel = buildSendButtonLabel(selectedCount);

  async function handleSend() {
    if (selectedCount === 0) {
      return;
    }

    try {
      setSending(true);

      const response = await fetch("/api/slots/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          companyId,
          slotId,
          customers: selectedCustomers.map((customer) => ({
            customerId: customer.customerId,
            phone: customer.customer.phone,
          })),
        }),
      });

      const data = await response.json();

      if (!response.ok || !data?.ok) {
        throw new Error(data?.error || "Failed sending");
      }

      onSent?.();
      onClose();
    } catch (error) {
      console.error("[modal] send error", error);
    } finally {
      setSending(false);
    }
  }

  return {
    sending,
    sendDisabled,
    sendButtonLabel,
    handleSend,
  };
}
// app/components/slots/slots.mock.ts

import { Clock, MessageSquare, Send, UserCheck } from "lucide-react";
import type {
  InterestedClientsSummary,
  SlotActivityItem,
  SlotItem,
  SlotStatItem,
  WeeklySlotsData,
} from "./slots.types";

export const SLOT_DAYS = ["Lun 12", "Mar 13", "Mié 14", "Jue 15", "Vie 16", "Sáb 17", "Dom 18"];

// 👉 ya no usamos SLOT_TIMES fijo

const CLIENTS = ["Marta G.", "Carlos R.", "Ana L.", "Pedro M.", "Laura S.", "José F."];

// helper para crear slots reales
function createSlot(
  time: string,
  status: SlotItem["status"],
  extra?: Partial<SlotItem>
): SlotItem {
  return {
    time,
    status,
    ...extra,
  };
}

// 👉 mock coherente temporalmente:
// pasado → recovered / unfilled
// futuro → fresh / pending
export const weeklySlotsMock: WeeklySlotsData = {
  "Lun 12": [
    createSlot("09:00", "unfilled"),
    createSlot("10:30", "recovered", { client: "Marta G." }),
    createSlot("12:15", "unfilled"),
  ],
  "Mar 13": [
    createSlot("09:20", "recovered", { client: "Carlos R." }),
    createSlot("11:00", "unfilled"),
  ],
  "Mié 14": [
    createSlot("10:10", "recovered", { client: "Ana L." }),
    createSlot("12:45", "unfilled"),
  ],
  "Jue 15": [
    createSlot("11:00", "pending", { sentToCount: 18 }),
    createSlot("15:30", "pending", { sentToCount: 12 }),
  ],
  "Vie 16": [
    createSlot("09:05", "fresh"),
    createSlot("13:40", "pending", { sentToCount: 9 }),
  ],
  "Sáb 17": [
    createSlot("10:00", "fresh"),
    createSlot("16:20", "pending", { sentToCount: 6 }),
  ],
  "Dom 18": [
    createSlot("11:15", "pending", { sentToCount: 14 }),
  ],
};

export const slotStatsMock: SlotStatItem[] = [
  {
    id: "recovered",
    label: "Huecos recuperados",
    value: "7",
    sub: "de 12",
  },
  {
    id: "messages",
    label: "Mensajes enviados",
    value: "156",
    sub: "esta semana",
  },
  {
    id: "response-rate",
    label: "Tasa de respuesta",
    value: "68%",
    sub: "+5% vs anterior",
  },
];

export const interestedClientsMock: InterestedClientsSummary = {
  totalActive: 24,
  averageResponseTime: "4 min",
  description: "Suscritos a alertas de huecos disponibles",
};

export const slotActivitiesMock: SlotActivityItem[] = [
  {
    id: "1",
    icon: Send,
    text: "Mensaje enviado a 20 clientes",
    time: "Hace 5 min",
    colorClass: "text-primary",
  },
  {
    id: "2",
    icon: MessageSquare,
    text: "3 clientes han respondido",
    time: "Hace 12 min",
    colorClass: "text-primary",
  },
  {
    id: "3",
    icon: UserCheck,
    text: "Hueco reservado por Marta G.",
    time: "Hace 18 min",
    colorClass: "text-primary",
  },
  {
    id: "4",
    icon: Send,
    text: "Mensaje enviado a 15 clientes",
    time: "Hace 1h",
    colorClass: "text-muted-foreground",
  },
  {
    id: "5",
    icon: Clock,
    text: "Nueva cancelación registrada",
    time: "Hace 2h",
    colorClass: "text-muted-foreground",
  },
  {
    id: "6",
    icon: UserCheck,
    text: "Hueco reservado por Carlos R.",
    time: "Hace 3h",
    colorClass: "text-muted-foreground",
  },
];
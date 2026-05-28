// lib/whatsapp/actions/handleCancelAppointmentIntent.ts

import { cancelAppointmentByWhatsapp } from "@/lib/appointments/actions/cancelAppointmentByWhatsapp";

export type HandleCancelAppointmentIntentResult = {
  ok: boolean;
  replyText: string;
};

type Params = {
  fromPhone: string;
};

export async function handleCancelAppointmentIntent({
  fromPhone,
}: Params): Promise<HandleCancelAppointmentIntentResult> {
  const result = await cancelAppointmentByWhatsapp({
    fromPhone,
  });

  if (result.ok) {
    return {
      ok: true,
      replyText: "✅ Tu cita ha sido cancelada correctamente.",
    };
  }

  return {
    ok: false,
    replyText:
      "No hemos encontrado ninguna cita futura activa asociada a este número.",
  };
}
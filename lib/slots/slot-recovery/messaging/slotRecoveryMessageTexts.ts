// lib/slots/slot-recovery/messaging/slotRecoveryMessageTexts.ts

export const slotRecoveryTexts = {
  serviceSelection: {
    body: 
      "¡Perfecto! 🚀 El hueco es tuyo! Solo falta un detalle.\n¿Qué servicio necesitas? 👇",
    button: "Ver servicios",
  },

confirmation: {
  build: (params: {
    serviceName: string;
    date: string;
    time: string;
    locationName: string;
  }) => {
    return `✅ *¡Cita confirmada!*

Tu reserva para *${params.serviceName}* ha quedado registrada!
Te esperamos en ${params.locationName} el *${params.date}*📅 a las *${params.time}*!
¡Hasta pronto!

Si necesitas cancelar tu cita, responde escribiendo *CANCELAR*.`;
  },
},

  slotAlreadyTaken: {
    text: "¡Uy! Llegaste por muy poco ⏳. Este hueco acaba de ser reservado por otro cliente.\n\nNo te preocupes, te avisaremos en cuanto se libere la próxima oportunidad. 🔔",
  },

  noInterest: {
    text: "¡Entendido! 👌 No te preocupes, seguiremos buscando el horario perfecto para ti. ¡Que tengas un gran día!",
  },
};
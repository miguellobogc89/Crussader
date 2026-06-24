// lib/integrations/google-calendar/appointments.ts
import { google } from "googleapis";
import { prisma } from "@/lib/prisma";

export async function createGoogleEventForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      location: true,
      employee: true,
      resource: true,
    },
  });

  if (!appointment) {
  return null;
}

console.log("[GOOGLE CREATE] appointment", {
  id: appointment.id,
  externalProvider: appointment.externalProvider,
  externalCalendarId: appointment.externalCalendarId,
  externalEventId: appointment.externalEventId,
});

  if (appointment.externalProvider === "google-calendar") {
    return null;
  }

  const connection = await prisma.externalConnection.findFirst({
    where: {
      companyId: appointment.location.companyId,
      provider: "google-calendar",
      status: "active",
    },
  });

  console.log("[GOOGLE CREATE] connection", {
  companyId: appointment.location.companyId,
  hasConnection: Boolean(connection),
  connectionId: connection?.id,
  provider: connection?.provider,
  status: connection?.status,
  hasAccessToken: Boolean(connection?.access_token),
  hasRefreshToken: Boolean(connection?.refresh_token),
});

if (!connection?.access_token || !connection.refresh_token) {

  return null;
}

const storedCalendar = await prisma.external_calendar.findFirst({
  where: {
    connection_id: connection.id,
    company_id: appointment.location.companyId,
    location_id: appointment.locationId,
    provider: "google-calendar",
    purpose: "crussader_mirror",
    active: true,
    external_calendar_id: {
      not: "",
    },
  },
  orderBy: {
    updated_at: "desc",
  },
});

console.log("[GOOGLE CREATE] connection/calendar", {
  hasConnection: Boolean(connection),
  hasAccessToken: Boolean(connection?.access_token),
  hasRefreshToken: Boolean(connection?.refresh_token),
  storedCalendarId: storedCalendar?.external_calendar_id,
});

if (!storedCalendar) {
  console.log("[GOOGLE SYNC] calendario Crussader no encontrado", {
    companyId: appointment.location.companyId,
  });
  return null;
}


  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.expires_at
      ? connection.expires_at * 1000
      : undefined,
  });

  const calendar = google.calendar({ version: "v3", auth: client });

  const title = appointment.serviceName || "Cita Crussader";

  const description = [
    appointment.customerName ? `Cliente: ${appointment.customerName}` : null,
    appointment.customerPhone ? `Teléfono: ${appointment.customerPhone}` : null,
    appointment.customerEmail ? `Email: ${appointment.customerEmail}` : null,
    appointment.employee?.name ? `Empleado: ${appointment.employee.name}` : null,
    appointment.resource?.name ? `Recurso: ${appointment.resource.name}` : null,
    appointment.notes ? `Notas: ${appointment.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

const created = await calendar.events.insert({
  calendarId: storedCalendar.external_calendar_id as string,
  requestBody: {
      summary: title,
      description,
      start: {
        dateTime: appointment.startAt.toISOString(),
        timeZone: "Europe/Madrid",
      },
      end: {
        dateTime: appointment.endAt.toISOString(),
        timeZone: "Europe/Madrid",
      },
    },
  });

console.log("[GOOGLE SYNC] evento creado", {
  googleEventId: created.data.id,
  htmlLink: created.data.htmlLink,
});

if (!created.data.id) return null;

await prisma.appointment.update({
  where: { id: appointment.id },
  data: {
    externalProvider: "google-calendar",
    externalCalendarId: storedCalendar.external_calendar_id,
    externalEventId: created.data.id,
  },
});

  return created.data;
}

export async function updateGoogleEventForAppointment(appointmentId: string) {
  const appointment = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: {
      location: true,
      employee: true,
      resource: true,
    },
  });

  if (!appointment) {
    return null;
  }

  if (!appointment.externalCalendarId || !appointment.externalEventId) {
    return null;
  }

  const connection = await prisma.externalConnection.findFirst({
    where: {
      companyId: appointment.location.companyId,
      provider: "google-calendar",
      status: "active",
    },
  });

  if (!connection?.access_token || !connection.refresh_token) {
    return null;
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CALENDAR_CLIENT_ID!,
    process.env.GOOGLE_CALENDAR_CLIENT_SECRET!,
    process.env.GOOGLE_CALENDAR_REDIRECT_URI
  );

  client.setCredentials({
    access_token: connection.access_token,
    refresh_token: connection.refresh_token,
    expiry_date: connection.expires_at
      ? connection.expires_at * 1000
      : undefined,
  });

  const calendar = google.calendar({ version: "v3", auth: client });

  const title = appointment.serviceName || "Cita Crussader";

  const description = [
    appointment.customerName ? `Cliente: ${appointment.customerName}` : null,
    appointment.customerPhone ? `Teléfono: ${appointment.customerPhone}` : null,
    appointment.customerEmail ? `Email: ${appointment.customerEmail}` : null,
    appointment.employee?.name ? `Empleado: ${appointment.employee.name}` : null,
    appointment.resource?.name ? `Recurso: ${appointment.resource.name}` : null,
    appointment.notes ? `Notas: ${appointment.notes}` : null,
  ]
    .filter(Boolean)
    .join("\n");

  const updated = await calendar.events.update({
    calendarId: appointment.externalCalendarId,
    eventId: appointment.externalEventId,
    requestBody: {
      summary: title,
      description,
      start: {
        dateTime: appointment.startAt.toISOString(),
        timeZone: "Europe/Madrid",
      },
      end: {
        dateTime: appointment.endAt.toISOString(),
        timeZone: "Europe/Madrid",
      },
    },
  });

  return updated.data;
}
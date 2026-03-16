// lib/crussader-assistant/utils/getCurrentDateContext.ts

export function getCurrentDateContext() {
  const now = new Date();

  const date = now.toLocaleDateString("es-ES", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const time = now.toLocaleTimeString("es-ES", {
    hour: "2-digit",
    minute: "2-digit",
  });

  return {
    iso: now.toISOString(),
    date,
    time,
  };
}
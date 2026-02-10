///scripts/seed-calendar-week.ts
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const companyId = "cmfmxqzho0009i5i4yhokb3p9";
const locationId = "cmfmxr01c000di5i4kh7tal6o";
const serviceId = "seed_srv_empaste_cmfmxr01c000di5i4kh7tal6o";

function startOfWeekMon(d: Date) {
  const x = new Date(d);
  const day = x.getDay(); // 0=Sun
  const delta = day === 0 ? -6 : 1 - day;
  x.setHours(0, 0, 0, 0);
  x.setDate(x.getDate() + delta);
  return x;
}

function atLocal(d: Date, hh: number, mm: number) {
  const x = new Date(d);
  x.setHours(hh, mm, 0, 0);
  return x;
}

function addDays(d: Date, n: number) {
  const x = new Date(d);
  x.setDate(x.getDate() + n);
  return x;
}

async function main() {
  const weekStart = startOfWeekMon(new Date());

  // ====== 1) empleados ======
  const employeesSeed = [
    { name: "Dra. Vega", job_title: "Veterinaria", color: "#7c3aed" },
    { name: "Dr. Salas", job_title: "Veterinario", color: "#2563eb" },
    { name: "Laura", job_title: "Auxiliar", color: "#16a34a" },
    { name: "Marcos", job_title: "Auxiliar", color: "#f59e0b" },
    { name: "Paula", job_title: "Recepción", color: "#db2777" },
    { name: "Sergio", job_title: "Recepción", color: "#0ea5e9" },
  ];

  const employees = await Promise.all(
    employeesSeed.map((e) =>
      prisma.employee.create({
        data: {
          name: e.name,
          job_title: e.job_title,
          color: e.color,
          timezone: "Europe/Madrid",
        },
      })
    )
  );

  // vincular empleados a la location (para que aparezcan en UI si lo usas)
  await Promise.all(
    employees.map((e, idx) =>
      prisma.employeeLocation.create({
        data: {
          employeeId: e.id,
          locationId,
          isPrimary: idx === 0,
          visibleInLocation: true,
          allowCrossLocationBooking: false,
        },
      })
    )
  );

  // ====== 2) recursos ======
  const resourcesSeed = [
    { name: "Consulta 1" },
    { name: "Consulta 2" },
    { name: "Quirófano" },
  ];

  const resources = await Promise.all(
    resourcesSeed.map((r) =>
      prisma.resource.create({
        data: {
          locationId,
          name: r.name,
          active: true,
        },
      })
    )
  );

  // ====== 3) turnos (ShiftEvent) ======
  // Patrón simple:
  // - Vet1 + Aux1: 09:00–17:00 (L-V)
  // - Vet2 + Aux2: 10:00–18:00 (L-V)
  // - Recepción: 09:00–14:00 (S)
  // - Domingo OFF (sin eventos)
  const [vet1, vet2, aux1, aux2, rec1] = employees;

  const shiftEvents: Array<{
    companyId: string;
    locationId: string;
    employeeId: string;
    startAt: Date;
    endAt: Date;
    kind: any;
    label: string;
  }> = [];

  for (let i = 0; i < 5; i++) {
    const day = addDays(weekStart, i);
    shiftEvents.push({
      companyId,
      locationId,
      employeeId: vet1.id,
      startAt: atLocal(day, 9, 0),
      endAt: atLocal(day, 17, 0),
      kind: "WORK",
      label: "Turno mañana",
    });
    shiftEvents.push({
      companyId,
      locationId,
      employeeId: aux1.id,
      startAt: atLocal(day, 9, 0),
      endAt: atLocal(day, 17, 0),
      kind: "WORK",
      label: "Apoyo consulta",
    });
    shiftEvents.push({
      companyId,
      locationId,
      employeeId: vet2.id,
      startAt: atLocal(day, 10, 0),
      endAt: atLocal(day, 18, 0),
      kind: "WORK",
      label: "Turno tarde",
    });
    shiftEvents.push({
      companyId,
      locationId,
      employeeId: aux2.id,
      startAt: atLocal(day, 10, 0),
      endAt: atLocal(day, 18, 0),
      kind: "WORK",
      label: "Apoyo tarde",
    });
  }

  // Sábado recepción
  const sat = addDays(weekStart, 5);
  shiftEvents.push({
    companyId,
    locationId,
    employeeId: rec1.id,
    startAt: atLocal(sat, 9, 0),
    endAt: atLocal(sat, 14, 0),
    kind: "WORK",
    label: "Recepción",
  });

  await prisma.shiftEvent.createMany({
    data: shiftEvents.map((s) => ({
      companyId: s.companyId,
      locationId: s.locationId,
      employeeId: s.employeeId,
      startAt: s.startAt,
      endAt: s.endAt,
      kind: s.kind,
      label: s.label,
    })),
  });

  // ====== 4) citas (Appointment) ======
  // Repartimos 4 citas/día (L-V), 2 el sábado, 0 domingo.
  // Mezcla: algunas asignadas, otras sin employeeId (para UX).
  const appts: any[] = [];

  const consult1 = resources[0];
  const consult2 = resources[1];
  const or = resources[2];

  const customers = [
    { name: "Ana (Luna)", phone: "600111222" },
    { name: "Carlos (Toby)", phone: "600222333" },
    { name: "Marta (Nala)", phone: "600333444" },
    { name: "Javi (Rocky)", phone: "600444555" },
    { name: "Sofía (Kira)", phone: "600555666" },
    { name: "Pablo (Max)", phone: "600666777" },
  ];

  function addAppt(day: Date, hh: number, mm: number, durMin: number, who: any, employeeId?: string | null, resourceId?: string | null, notes?: string) {
    const startAt = atLocal(day, hh, mm);
    const endAt = new Date(startAt);
    endAt.setMinutes(endAt.getMinutes() + durMin);

    appts.push({
      locationId,
      serviceId,
      startAt,
      endAt,
      employeeId: employeeId ?? undefined,
      resourceId: resourceId ?? undefined,
      customerName: who.name,
      customerPhone: who.phone,
      notes: notes ?? undefined,
    });
  }

  for (let i = 0; i < 5; i++) {
    const day = addDays(weekStart, i);

    addAppt(day, 9, 30, 30, customers[0], vet1.id, consult1.id, "Revisión");
    addAppt(day, 10, 15, 45, customers[1], vet2.id, consult2.id, "Vacuna");
    addAppt(day, 12, 0, 30, customers[2], null, consult1.id, "Sin asignar (test UX)");
    addAppt(day, 16, 0, 60, customers[3], vet1.id, or.id, "Procedimiento");

    // alguna extra sin recurso
    if (i % 2 === 0) {
      addAppt(day, 13, 0, 30, customers[4], vet2.id, null, "Consulta rápida");
    }
  }

  // sábado 2 citas
  addAppt(sat, 10, 0, 30, customers[5], null, consult1.id, "Urgencia (sin asignar)");

  await prisma.appointment.createMany({ data: appts });

  console.log("✅ Seed calendario listo:", {
    employees: employees.length,
    resources: resources.length,
    shiftEvents: shiftEvents.length,
    appointments: appts.length,
    weekStart: weekStart.toISOString(),
  });
}

main()
  .catch((e) => {
    console.error("❌ seed error:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

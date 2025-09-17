import fs from "node:fs";
import * as dotenv from "dotenv";
if (fs.existsSync(".env.local")) dotenv.config({ path: ".env.local" });
dotenv.config();

import { PrismaClient, CompanyRole, Role } from "@prisma/client";

const prisma = new PrismaClient();

/** ========= Datos base ========= */
type CompanySeed = {
  name: string;
  activityName?: string;    // intenta enlazar con Activity por nombre (si existe)
  defaultTypeName?: string; // intenta enlazar con Type dentro de esa Activity (si existe)
  website?: string;
  email?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  countryCode?: string;
  brandColor?: string;
  description?: string;
};

const COMPANIES: CompanySeed[] = [
  { name: "Grupo Alameda Restauración S.L.", activityName: "Alimentación y hostelería", defaultTypeName: "restaurante", website: "https://alamedarest.es", email: "contacto@alamedarest.es", phone: "+34951000001", city: "Sevilla", country: "España", countryCode: "ES", brandColor: "#D35400", description: "Restauración y catering." },
  { name: "Clínica Luz & Vida", activityName: "Salud y bienestar", defaultTypeName: "clínica médica", website: "https://clinicalluzvida.com", email: "info@clinicalluzvida.com", phone: "+34910000002", city: "Madrid", country: "España", countryCode: "ES", brandColor: "#16A085", description: "Clínica médica integral." },
  { name: "IberTech Sistemas", activityName: "Servicios profesionales y empresas", defaultTypeName: "consultoría", website: "https://ibertechsistemas.com", email: "hola@ibertechsistemas.com", phone: "+34930000003", city: "Valencia", country: "España", countryCode: "ES", brandColor: "#2C3E50", description: "Ingeniería y consultoría tecnológica." },
  { name: "Verdalia Supermercados", activityName: "Alimentación y hostelería", defaultTypeName: "supermercado", website: "https://verdalia.es", email: "atencion@verdalia.es", phone: "+34954000004", city: "Sevilla", country: "España", countryCode: "ES", brandColor: "#27AE60", description: "Supermercados de proximidad." },
  { name: "Taller MotorSur", activityName: "Transporte y automoción", defaultTypeName: "taller mecánico", website: "https://motorsur.es", email: "citas@motorsur.es", phone: "+34956000005", city: "Málaga", country: "España", countryCode: "ES", brandColor: "#8E44AD", description: "Taller mecánico multimarca." },
  { name: "Casa del Pan Artesano", activityName: "Alimentación y hostelería", defaultTypeName: "panadería-pastelería", website: "https://casadelpan.es", email: "pedidos@casadelpan.es", phone: "+34985000006", city: "Granada", country: "España", countryCode: "ES", brandColor: "#C0392B", description: "Panadería y pastelería artesanal." },
  { name: "Óptica Horizonte", activityName: "Salud y bienestar", defaultTypeName: "óptica", website: "https://opticahorizonte.es", email: "clientes@opticahorizonte.es", phone: "+34960000007", city: "Zaragoza", country: "España", countryCode: "ES", brandColor: "#2980B9", description: "Centro óptico y audiología." },
  { name: "Hotel Mar Azul", activityName: "Turismo y alojamiento", defaultTypeName: "hotel", website: "https://hotelmarazul.es", email: "reservas@hotelmarazul.es", phone: "+34970000008", city: "Alicante", country: "España", countryCode: "ES", brandColor: "#1ABC9C", description: "Hotel vacacional frente al mar." },
  { name: "Financredit Asesores", activityName: "Finanzas e inmobiliario", defaultTypeName: "asesor financiero", website: "https://financredit.es", email: "contacto@financredit.es", phone: "+34912000009", city: "Madrid", country: "España", countryCode: "ES", brandColor: "#34495E", description: "Asesoría financiera y créditos." },
  { name: "Estudio Creativo Naranja", activityName: "Servicios profesionales y empresas", defaultTypeName: "diseño gráfico-branding", website: "https://creativonaranja.com", email: "hola@creativonaranja.com", phone: "+34931000010", city: "Barcelona", country: "España", countryCode: "ES", brandColor: "#E67E22", description: "Diseño gráfico y branding." },
];

/** ========= Utilidades determinísticas (sin libs externas) ========= */
const STREET_TYPES = ["C/", "Av.", "Paseo", "Ronda", "Plaza", "Camino", "Travesía"];
const STREET_NAMES = ["Mayor", "Gran Vía", "Constitución", "Sol", "Alcalá", "Sierpes", "Catalunya", "Fuencarral", "Valencia", "San Fernando"];
const DISTRICTS = ["Centro", "Norte", "Sur", "Este", "Oeste", "Triana", "Nervión", "Eixample", "Gràcia", "Chamberí", "Salamanca", "El Carmen", "La Latina", "Gros", "Indautxu", "Casco Antiguo"];

function seededInt(name: string, mod: number, offset = 0) {
  let s = 0;
  for (let i = 0; i < name.length; i++) s += name.charCodeAt(i);
  return (s % mod) + offset;
}
function deterministicCount1to3(name: string) {
  return (seededInt(name, 3) + 1); // 1..3
}
function pick<T>(arr: T[], seed: number) {
  return arr[seed % arr.length];
}
function buildAddress(seed: number) {
  const t = pick(STREET_TYPES, seed);
  const n = pick(STREET_NAMES, seed * 7);
  const num = (seed % 70) + 1;
  return `${t} ${n} ${num}`;
}
function buildPhone(seed: number) {
  // Fijo español +34 9xx xxx xxx
  const base = 900000000 + (seed % 90000000);
  return `+34${base}`;
}

/** ========= Helpers de BBDD ========= */
async function getCreatorUserId(): Promise<string> {
  // Prioridades: Miguel → test01 → cualquier user → crear uno rápido
  const preferred = ["miguel.lobogc.89@gmail.com", "test01@example.com", "test1@example.com"];
  for (const email of preferred) {
    const u = await prisma.user.findUnique({ where: { email } });
    if (u) return u.id;
  }
  const any = await prisma.user.findFirst();
  if (any) return any.id;
  const created = await prisma.user.create({
    data: { name: "Seeder Owner", email: "owner@seed.local", role: Role.org_admin, isActive: true },
  });
  return created.id;
}
async function ensureUserCompany(userId: string, companyId: string, role: CompanyRole) {
  const exists = await prisma.userCompany.findFirst({ where: { userId, companyId } });
  if (exists) return exists;
  return prisma.userCompany.create({ data: { userId, companyId, role } });
}
async function findActivityTypeIds(activityName?: string, typeName?: string) {
  if (!activityName) return { activityId: undefined as string | undefined, typeId: undefined as string | undefined };
  const act = await prisma.activity.findUnique({ where: { name: activityName } });
  if (!act) return { activityId: undefined, typeId: undefined };
  if (!typeName) return { activityId: act.id, typeId: undefined };
  const typ = await prisma.type.findFirst({ where: { activityId: act.id, name: typeName } });
  return { activityId: act.id, typeId: typ?.id };
}

/** ========= RUN ========= */
async function run() {
  const creatorId = await getCreatorUserId();

  let createdC = 0, updatedC = 0, createdL = 0, updatedL = 0;

  for (const c of COMPANIES) {
    // 1) Crear/actualizar empresa por name (idempotente)
    const existing = await prisma.company.findFirst({ where: { name: c.name } });
    const data = {
      createdById: creatorId,
      activity: c.activityName,
      website: c.website,
      email: c.email,
      phone: c.phone,
      address: c.address ?? undefined,
      city: c.city ?? undefined,
      country: c.country ?? "España",
      countryCode: c.countryCode ?? "ES",
      brandColor: c.brandColor,
      description: c.description,
    };
    let companyId: string;

    if (existing) {
      const updated = await prisma.company.update({ where: { id: existing.id }, data });
      await ensureUserCompany(creatorId, updated.id, CompanyRole.OWNER);
      companyId = updated.id;
      updatedC++;
    } else {
      const created = await prisma.company.create({ data: { name: c.name, ...data } });
      await ensureUserCompany(creatorId, created.id, CompanyRole.OWNER);
      companyId = created.id;
      createdC++;
    }

    // 2) Crear entre 1 y 3 ubicaciones por empresa (determinístico para no crear más en reruns)
    const count = deterministicCount1to3(c.name); // 1..3 estable por nombre
    const activityType = await findActivityTypeIds(c.activityName, c.defaultTypeName);

    for (let i = 0; i < count; i++) {
      const seed = seededInt(`${c.name}#${i}`, 10_000);
      const district = pick(DISTRICTS, seed + i);
      const title = `${c.name} — ${district}`;
      const address = buildAddress(seed + i * 13);
      const city = c.city ?? pick(["Madrid", "Barcelona", "Valencia", "Sevilla", "Zaragoza", "Málaga", "Bilbao", "Alicante", "Granada"], seed + i * 3);
      const postalCode = String(10000 + (seed % 89999));
      const phone = buildPhone(seed + i * 17);
      const website = c.website ? `${c.website.replace(/\/$/, "")}/${district.toLowerCase().replace(/\s+/g, "-")}` : undefined;

      const existingLoc = await prisma.location.findFirst({
        where: { companyId, title },
        select: { id: true },
      });

      const locData = {
        companyId,
        title,
        address,
        city,
        postalCode,
        phone,
        website,
        timezone: "Europe/Madrid",
        status: "ACTIVE" as const,
        activityId: activityType.activityId,
        typeId: activityType.typeId,
      };

      if (existingLoc) {
        await prisma.location.update({ where: { id: existingLoc.id }, data: locData });
        updatedL++;
      } else {
        await prisma.location.create({ data: locData });
        createdL++;
      }
    }
  }

  console.log(`✅ Empresas — creadas: ${createdC}, actualizadas: ${updatedC}`);
  console.log(`✅ Ubicaciones — creadas: ${createdL}, actualizadas: ${updatedL}`);
}

run()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

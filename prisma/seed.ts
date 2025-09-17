import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

/** ================== Catálogo: Actividad -> Tipos ================== */
const CATALOG: Array<{ name: string; types: string[] }> = [
  {
    name: "Alimentación y hostelería",
    types: [
      "supermercado","hipermercado","ultramarinos","tienda gourmet","carnicería",
      "pescadería","panadería-pastelería","frutería","bodega","delicatessen",
      "bar","cafetería","restaurante","food truck","catering","heladería",
    ],
  },
  {
    name: "Salud y bienestar",
    types: [
      "clínica médica","consulta médica","dentista","ortodoncia","fisioterapia",
      "podología","óptica","audiología","psicología","psiquiatría",
      "nutrición-dietética","rehabilitación","spa-balneario","yoga","pilates","medicina estética",
    ],
  },
  {
    name: "Belleza y cuidado personal",
    types: [
      "peluquería","barbería","centro de estética","salón de uñas","depilación láser",
      "microblading","solárium","tatuajes","piercing",
    ],
  },
  {
    name: "Mascotas y veterinaria",
    types: [
      "clínica veterinaria","hospital veterinario","peluquería canina","tienda de mascotas",
      "adiestramiento","guardería-residencia","acuariofilia",
    ],
  },
  {
    name: "Hogar, construcción y mantenimiento",
    types: [
      "reformas integrales","constructora","ferretería","carpintería","cerrajería",
      "fontanería","electricidad","climatización-A/C","calefacción","energías renovables",
      "cristalería","pintura","albañilería","suelos-parquet","toldos-persianas",
      "domótica","control de plagas",
    ],
  },
  {
    name: "Comercio y moda",
    types: [
      "tienda de ropa","boutique","outlet","calzado","deportes","joyería","relojería",
      "bolsos-complementos","mercería","lencería","juguetería","librería",
      "papelería","imprenta-copistería","música-instrumentos","cómics-juegos",
      "informática (retail)","electrónica-telefonía (retail)",
    ],
  },
  {
    name: "Servicios profesionales y empresas",
    types: [
      "bufete de abogados","procurador","notaría","gestoría-asesoría fiscal","consultoría",
      "RR. HH.-laboral","protección de datos-compliance","agencia de marketing",
      "diseño gráfico-branding","arquitectura","ingeniería","coworking",
      "traducción-interpretación","auditoría","call center-BPO",
    ],
  },
  {
    name: "Finanzas e inmobiliario",
    types: [
      "banco-sucursal","cooperativa de crédito","correduría de seguros","asesor financiero",
      "financiación-préstamos","inmobiliaria","administración de fincas","tasación-valoración",
      "bróker hipotecario",
    ],
  },
  {
    name: "Turismo y alojamiento",
    types: [
      "hotel","hostal-pensión","apartamento turístico","casa rural","camping","albergue",
      "agencia de viajes","touroperador","guía turístico","oficina de turismo",
    ],
  },
  {
    name: "Transporte y automoción",
    types: [
      "taller mecánico","chapa-pintura","concesionario","compra-venta de vehículos",
      "alquiler de coches","taller de motos","ITV-inspección",
      "gasolinera-estación de servicio","lavado de coches","neumáticos",
      "mensajería-paquetería","logística-almacén","transporte de mercancías","autoescuela",
    ],
  },
  {
    name: "Arte, cultura y ocio",
    types: [
      "teatro","cine","museo","galería de arte","sala de conciertos","escuela de artes",
      "academia de baile","escape room","parque de ocio","sala de juegos","discoteca","pub",
      "centro cultural",
    ],
  },
  {
    name: "Otros servicios",
    types: [
      "funeraria","tanatorio","cementerio","náutica-astillero","puerto deportivo",
      "insumos agrícolas","taller de bicicletas","sastrería-arreglos","lavandería",
      "tintorería","fotografía-estudio","serigrafía","alquiler de material para eventos",
    ],
  },
];

/** ================== Helpers idempotentes (sin únicos obligatorios) ================== */
async function ensureCompanyByNameAndCreator(params: { name: string; createdById: string }) {
  const existing = await prisma.company.findFirst({
    where: { name: params.name, createdById: params.createdById },
  });
  if (existing) return existing;
  return prisma.company.create({ data: params });
}

async function ensureUserCompany(userId: string, companyId: string, role: string) {
  const existing = await prisma.userCompany.findFirst({
    where: { userId, companyId },
  });
  if (existing) return existing;
  return prisma.userCompany.create({
    data: { userId, companyId, role: role as any },
  });
}

async function ensureExternalConnection(input: {
  userId: string;
  provider: string;
  accountEmail: string;
  access_token: string;
  refresh_token: string;
  expires_at: number;
}) {
  const existing = await prisma.externalConnection.findFirst({
    where: {
      userId: input.userId,
      provider: input.provider,
      accountEmail: input.accountEmail,
    },
  });
  if (existing) return existing;
  return prisma.externalConnection.create({ data: input });
}

async function seedActivitiesAndTypes() {
  for (const activity of CATALOG) {
    // Primero intentamos upsert por name (si name es único, mejor rendimiento)
    const act = await prisma.activity.upsert({
      where: { name: activity.name },
      update: {},
      create: { name: activity.name },
      select: { id: true, name: true },
    });

    // Para cada tipo: si existe índice único compuesto (activityId, name) usaremos upsert.
    // Si tu schema aún no lo tiene, este upsert fallará: en ese caso, hacemos fallback a findFirst+create.
    for (const t of activity.types) {
      try {
        await prisma.type.upsert({
          where: {
            // requiere: @@unique([activityId, name])
            activityId_name: { activityId: act.id, name: t },
          },
          update: {},
          create: { name: t, activityId: act.id },
        });
      } catch {
        const exists = await prisma.type.findFirst({
          where: { activityId: act.id, name: t },
        });
        if (!exists) {
          await prisma.type.create({ data: { name: t, activityId: act.id } });
        }
      }
    }
  }
  console.log("✅ Actividades y tipos sincronizados");
}

/** ================== Seed principal ================== */
async function main() {
  // 1) Usuario de prueba (idempotente por email)
  const user = await prisma.user.upsert({
    where: { email: "miguel.lobogc.89@gmail.com" },
    update: {},
    create: {
      name: "Miguel",
      email: "miguel.lobogc.89@gmail.com",
    },
  });

  // 2) Empresa de prueba (idempotente sin únicos obligatorios)
  const company = await ensureCompanyByNameAndCreator({
    name: "Empresa de Prueba",
    createdById: user.id,
  });

  // 3) Relación usuario ↔ empresa (idempotente)
  await ensureUserCompany(user.id, company.id, "OWNER");

  // 4) Conexión externa de prueba (idempotente)
  await ensureExternalConnection({
    userId: user.id,
    provider: "google-business",
    accountEmail: "crussadersolutions@gmail.com",
    access_token: "fake_access_token",
    refresh_token: "fake_refresh_token",
    expires_at: Math.floor(Date.now() / 1000) + 3600, // +1h
  });

  // 5) Catálogo Actividad/Tipo (idempotente)
  await seedActivitiesAndTypes();

  console.log("✅ Seed ejecutado correctamente");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

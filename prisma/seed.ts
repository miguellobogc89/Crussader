import { PrismaClient, ReviewProvider } from "@prisma/client";

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
await seedReviews(prisma);
await recomputeAggregates(prisma);

  console.log("✅ Seed ejecutado correctamente");
}
/** ================== Reviews de prueba (4 locations) ================== */
async function seedReviews(prisma: PrismaClient) {
  type R = {
    locationId: string;
    externalId: string;
    reviewerName: string;
    rating: number;
    comment: string;
    languageCode: string;
    createdAt: string; // ISO con zona +02:00
  };

  const REVIEWS: R[] = [
    // ---------- 1) Taller MotorSur — Nervión (cmfmxr34u0012i5i4ad2ac53i)
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-01", reviewerName: "Laura Gómez",     rating: 5, comment: "Me cambiaron las pastillas de freno y la revisión en el mismo día. Trato claro y sin sustos en la factura.", languageCode: "es-ES", createdAt: "2025-08-05T10:10:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-02", reviewerName: "Javier Martín",   rating: 4, comment: "Diagnóstico rápido de un ruido raro en la dirección. Me explicaron las opciones y eligieron la económica.", languageCode: "es-ES", createdAt: "2025-07-22T09:05:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-03", reviewerName: "Noelia Ruiz",     rating: 2, comment: "Dejé el coche para la ITV y al final tardaron dos días más de lo previsto. Me faltó comunicación.",          languageCode: "es-ES", createdAt: "2025-06-28T12:40:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-04", reviewerName: "Andrés Pardo",    rating: 5, comment: "Cambio de aceite y filtros perfecto. Te mandan fotos del proceso y el presupuesto se respetó.",            languageCode: "es-ES", createdAt: "2025-09-02T17:20:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-05", reviewerName: "Marta Salas",     rating: 1, comment: "Dejé el coche por un testigo del motor y me lo devolvieron igual. 0 soluciones y 200€ menos.",            languageCode: "es-ES", createdAt: "2025-07-03T16:05:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-06", reviewerName: "Santiago Arroyo", rating: 4, comment: "Me cambiaron el embrague. Precio ajustado y te dan coche de cortesía si lo pides con tiempo.",             languageCode: "es-ES", createdAt: "2025-08-18T11:35:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-07", reviewerName: "Rocío del Valle", rating: 5, comment: "Atención de 10. Revisaron gratis una fuga pequeña y me dijeron cómo vigilarla.",                           languageCode: "es-ES", createdAt: "2025-09-10T08:55:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-08", reviewerName: "Cristian López",  rating: 3, comment: "Bien, pero el recambio tardó un día más y me descuadró. Aun así, cumplieron.",                              languageCode: "es-ES", createdAt: "2025-08-01T15:25:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-09", reviewerName: "Elena Prats",     rating: 2, comment: "Presupuesto inicial muy bajo y luego “aparecieron” piezas extra. Me sentí poco informada.",               languageCode: "es-ES", createdAt: "2025-06-21T10:15:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-10", reviewerName: "Hugo Caballero",  rating: 5, comment: "Honestos y rápidos. Me ahorraron una reparación cambiando solo un sensor.",                               languageCode: "es-ES", createdAt: "2025-08-26T18:30:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-11", reviewerName: "Pablo Ferrer",    rating: 4, comment: "Buena relación calidad-precio. Sala de espera cómoda y wifi.",                                             languageCode: "es-ES", createdAt: "2025-07-12T13:00:00+02:00" },
    { locationId: "cmfmxr34u0012i5i4ad2ac53i", externalId: "seed-g-taller-12", reviewerName: "Nuria Cebrián",   rating: 1, comment: "Prometieron coche listo el viernes y hasta el lunes nada. Perdí el fin de semana.",                       languageCode: "es-ES", createdAt: "2025-09-01T09:45:00+02:00" },

    // ---------- 2) Verdalia Supermercados — Salamanca (cmfmxr1v0000ri5i4nk3m1b45)
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-01", reviewerName: "María Santos",   rating: 5, comment: "Fruta muy fresca y pan caliente a cualquier hora. Caja rápida incluso en hora punta.",             languageCode: "es-ES", createdAt: "2025-08-14T10:00:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-02", reviewerName: "Tomás Iglesias", rating: 4, comment: "Buenos precios en lácteos y una pescadería que sorprende. Aparcamiento justo.",                         languageCode: "es-ES", createdAt: "2025-07-19T12:20:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-03", reviewerName: "Claudia Peña",   rating: 2, comment: "Muchas colas en cajas automáticas y solo una persona ayudando. Se hace eterno.",                        languageCode: "es-ES", createdAt: "2025-06-25T19:05:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-04", reviewerName: "Irene Navarro",  rating: 5, comment: "Siempre encuentro lo que busco y si no, el personal propone alternativas.",                            languageCode: "es-ES", createdAt: "2025-08-29T09:30:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-05", reviewerName: "Germán Núñez",   rating: 1, comment: "Pasillos desordenados y productos caducando en nevera. Falta control.",                                languageCode: "es-ES", createdAt: "2025-07-07T17:50:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-06", reviewerName: "Bea Romero",     rating: 4, comment: "La zona eco está muy completa. Los carritos a veces están sucios.",                                     languageCode: "es-ES", createdAt: "2025-08-03T11:40:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-07", reviewerName: "Diego Quintana", rating: 5, comment: "Promos claras y se aplican bien en caja. Muy cómodo hacer la compra grande.",                           languageCode: "es-ES", createdAt: "2025-09-05T18:10:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-08", reviewerName: "Natalia Viana",  rating: 3, comment: "Correcto, aunque faltaba stock en algunas marcas de limpieza.",                                        languageCode: "es-ES", createdAt: "2025-08-22T13:35:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-09", reviewerName: "Pilar Lozano",   rating: 2, comment: "Los precios en estantería no coinciden con caja en varias referencias. Ojo.",                           languageCode: "es-ES", createdAt: "2025-06-30T20:05:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-10", reviewerName: "Xavier Costa",   rating: 5, comment: "La panadería huele a gloria y el personal es majo. Vuelvo fijo.",                                      languageCode: "es-ES", createdAt: "2025-09-09T08:20:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-11", reviewerName: "Lola Riera",     rating: 4, comment: "Tienda limpia y bien iluminada. Señalética mejorable.",                                                 languageCode: "es-ES", createdAt: "2025-07-25T10:15:00+02:00" },
    { locationId: "cmfmxr1v0000ri5i4nk3m1b45", externalId: "seed-g-verda-12", reviewerName: "Ricardo Méndez", rating: 1, comment: "Caja preferente cerrada y nadie atendiendo. Mal para gente mayor.",                                     languageCode: "es-ES", createdAt: "2025-08-11T19:45:00+02:00" },

    // ---------- 3) Clínica Luz & Vida — Casco Antiguo (cmfmxr01c000di5i4kh7tal6o)
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-01", reviewerName: "Silvia Marín",   rating: 5, comment: "Equipo médico cercano y explican el tratamiento con calma. Recepción eficiente.",               languageCode: "es-ES", createdAt: "2025-08-06T09:00:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-02", reviewerName: "Óscar Benito",   rating: 4, comment: "Instalaciones nuevas y muy limpias. La primera cita tardó un poco en llegar.",                     languageCode: "es-ES", createdAt: "2025-07-10T10:30:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-03", reviewerName: "Ana Beltrán",    rating: 2, comment: "Sala de espera saturada y me pasaron 40 minutos tarde. El médico bien.",                           languageCode: "es-ES", createdAt: "2025-06-19T11:45:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-04", reviewerName: "Teresa Coll",    rating: 5, comment: "Me hicieron una extracción complicada sin dolor y con seguimiento por WhatsApp.",                  languageCode: "es-ES", createdAt: "2025-08-27T16:20:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-05", reviewerName: "Julián Pino",    rating: 1, comment: "Me cambiaron dos veces la hora el mismo día. Falta de respeto al paciente.",                        languageCode: "es-ES", createdAt: "2025-07-30T12:10:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-06", reviewerName: "Patricia Lazo",  rating: 4, comment: "Buena coordinación con el seguro. Me dieron informe completo por email.",                          languageCode: "es-ES", createdAt: "2025-09-04T09:25:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-07", reviewerName: "Ignacio Vidal",  rating: 3, comment: "Profesionales, pero la recepción va desbordada y se nota en el trato.",                            languageCode: "es-ES", createdAt: "2025-08-01T18:15:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-08", reviewerName: "Marta Paredes",  rating: 5, comment: "Gran atención de enfermería y resultados disponibles en 24 h. Volveré.",                          languageCode: "es-ES", createdAt: "2025-09-07T08:50:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-09", reviewerName: "Celia Roldán",   rating: 2, comment: "Cobro doble del ticket de parking y nadie sabía cómo devolverlo.",                                 languageCode: "es-ES", createdAt: "2025-06-23T15:05:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-10", reviewerName: "Raúl Medina",    rating: 4, comment: "Trato humano y diagnóstico acertado. Mejoraría el sistema de citas online.",                        languageCode: "es-ES", createdAt: "2025-08-20T10:05:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-11", reviewerName: "Inés Cruz",      rating: 5, comment: "Me acompañaron en todo el proceso. Salí tranquila y bien informada.",                                languageCode: "es-ES", createdAt: "2025-08-31T11:30:00+02:00" },
    { locationId: "cmfmxr01c000di5i4kh7tal6o", externalId: "seed-g-clin-12", reviewerName: "Victor Sainz",   rating: 1, comment: "Intenté anular una cita y nadie cogía el teléfono. Perdiendo el tiempo.",                           languageCode: "es-ES", createdAt: "2025-07-04T09:40:00+02:00" },

    // ---------- 4) La Mia Gelateria (cmfmr96rr0004i5r8nzri3ck6)
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-01", reviewerName: "Paula Tena",     rating: 5, comment: "El pistacho es puro vicio. Cono crujiente y raciones generosas.",                          languageCode: "es-ES", createdAt: "2025-08-09T20:10:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-02", reviewerName: "Marc Soler",     rating: 4, comment: "Sabores originales (stracciatella de café top). Algo de cola, pero va rápido.",             languageCode: "es-ES", createdAt: "2025-07-21T22:05:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-03", reviewerName: "Aitana R.",      rating: 2, comment: "Los helados se derretían enseguida y nos manchamos enteros. Mesa pegajosa.",                 languageCode: "es-ES", createdAt: "2025-06-24T19:40:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-04", reviewerName: "Daniel Ortega",  rating: 5, comment: "Tienen opciones sin lactosa y sorbetes buenísimos. Personal atento.",                        languageCode: "es-ES", createdAt: "2025-08-30T18:15:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-05", reviewerName: "Sofía Navas",    rating: 1, comment: "Precio alto para la cantidad. Y el cucurucho llegó blando.",                               languageCode: "es-ES", createdAt: "2025-07-05T17:20:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-06", reviewerName: "Íñigo Pérez",    rating: 4, comment: "Terraza agradable y variedad suficiente. Volveremos con los peques.",                        languageCode: "es-ES", createdAt: "2025-09-06T21:10:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-07", reviewerName: "Lucía V.",       rating: 5, comment: "Crema de avellana brutal y servicio rápido. Sitio de cabecera.",                             languageCode: "es-ES", createdAt: "2025-08-17T20:20:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-08", reviewerName: "Federico Mateos",rating: 3, comment: "Correcto sin más. Sabores ricos, pero el local estaba muy lleno.",                              languageCode: "es-ES", createdAt: "2025-08-23T19:55:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-09", reviewerName: "Nerea Alba",     rating: 2, comment: "Pedí dos bolas y sirvieron media. Tuvimos que reclamar.",                                    languageCode: "es-ES", createdAt: "2025-06-29T18:30:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-10", reviewerName: "Adrián Castaño", rating: 5, comment: "Helado de limón espectacular y terraza limpia. Precio acorde.",                               languageCode: "es-ES", createdAt: "2025-08-25T22:00:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-11", reviewerName: "Gala Prieto",    rating: 4, comment: "Buenas mesas interiores con aire. Carta corta pero muy bien ejecutada.",                     languageCode: "es-ES", createdAt: "2025-07-27T21:25:00+02:00" },
    { locationId: "cmfmr96rr0004i5r8nzri3ck6", externalId: "seed-g-gela-12", reviewerName: "Borja Vidal",    rating: 1, comment: "Nos atendieron con prisas y se equivocaron en los sabores. Experiencia floja.",               languageCode: "es-ES", createdAt: "2025-06-20T20:35:00+02:00" },
  ];

  for (const r of REVIEWS) {
    const loc = await prisma.location.findUnique({
      where: { id: r.locationId },
      select: { companyId: true },
    });
    if (!loc) {
      console.warn(`⚠️ Location no encontrada: ${r.locationId} — review ${r.externalId} saltada`);
      continue;
    }

    await prisma.review.upsert({
      where: { provider_externalId: { provider: ReviewProvider.GOOGLE, externalId: r.externalId } },
      update: {}, // si existe, no tocamos
      create: {
        companyId: loc.companyId,
        locationId: r.locationId,
        provider: ReviewProvider.GOOGLE,
        externalId: r.externalId,
        reviewerName: r.reviewerName,
        reviewerAnon: false,
        rating: r.rating,
        comment: r.comment,
        languageCode: r.languageCode,
        createdAtG: new Date(r.createdAt),
        updatedAtG: new Date(r.createdAt),
      },
    });
  }

  console.log("✅ Reviews de prueba insertadas/aseguradas");
}

/** ================== KPIs rápidos: count + avg en Location/Company ================== */
async function recomputeAggregates(prisma: PrismaClient) {
  // Por ubicación
  const byLoc = await prisma.review.groupBy({
    by: ["locationId"],
    _count: { _all: true },
    _avg: { rating: true },
  });
  for (const row of byLoc) {
    await prisma.location.update({
      where: { id: row.locationId },
      data: {
        reviewsCount: row._count._all,
        reviewsAvg: row._avg.rating ? Number(row._avg.rating.toFixed(2)) : null,
      },
    });
  }

  // Por compañía
  const byCompany = await prisma.review.groupBy({
    by: ["companyId"],
    _count: { _all: true },
    _avg: { rating: true },
  });
  for (const row of byCompany) {
    await prisma.company.update({
      where: { id: row.companyId },
      data: {
        reviewsCount: row._count._all,
        reviewsAvg: row._avg.rating ? Number(row._avg.rating.toFixed(2)) : null,
      },
    });
  }

  console.log("✅ Aggregates (reviewsCount/reviewsAvg) recalculados");
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });

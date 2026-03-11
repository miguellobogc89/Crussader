// lib/bootstrap.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import "server-only";

/** Relación mínima para el Type de Location cuando cargamos por company */
type LocationTypeRel = {
  id: string;
  name: string;
  createdAt: Date;
  updatedAt: Date;
  activityId: string;
};

/** Tipos que expondrá el buffer de sesión (seguros para hidratar en cliente) */
export type BootstrapData = {
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
    role: "system_admin" | "org_admin" | "user" | "test";
    locale: string | null;
    timezone: string | null;
    onboardingStatus: "PENDING" | "IN_PROGRESS" | "COMPLETED";
  };
  companies: Array<{
    companyId: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | null;
  }>;
  /** ✅ NUEVO: misma info pero con nombre resuelto */
  companiesResolved?: Array<{
    id: string;
    name: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | null;
  }>;
  activeCompany: {
    id: string;
    name: string;
    logoUrl: string | null;
    plan: string | null;
    city: string | null;
    country: string | null;
    website: string | null;
    brandColor: string | null;
    reviewsAvg: string | null; // Decimal -> string
    reviewsCount: number;
    lastSyncAt: Date | null;
  } | null;
  /** ✅ NUEVO: alias cómodo para el cliente */
  activeCompanyResolved?: { id: string; name: string } | null;
  locations: Array<{
    id: string;
    companyId: string;
    title: string;
    slug: string | null;
    status: "ACTIVE" | "INACTIVE" | "DRAFT" | "PENDING_VERIFICATION" | null;
    type: LocationTypeRel | "HQ" | "BRANCH" | "FRANCHISE" | null;
    address: string | null;
    address2: string | null;
    city: string | null;
    region: string | null;
    postalCode: string | null;
    country: string | null;
    countryCode: string | null;
    openingHours: any | null;
    phone: string | null;
    email: string | null;
    website: string | null;
    googleName: string | null;
    googlePlaceId: string | null;
    googleLocationId: string | null;
    googleAccountId: string | null;
    externalConnectionId: string | null;
    featuredImageUrl: string | null;
    instagramUrl: string | null;
    facebookUrl: string | null;
    timezone: string | null;
    latitude: string | null; // Decimal -> string
    longitude: string | null; // Decimal -> string
    reviewsAvg: string | null; // Decimal -> string
    reviewsCount: number;
    lastSyncAt: Date | null;
    createdAt: Date;
    updatedAt: Date;
    isFeatured: boolean;
  }>;
  connections: Array<{
    id: string;
    provider: string;
    accountName: string | null;
    accountEmail: string | null;
    scope: string | null;
    expires_at: number | null;
    companyId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }>;
};

const ACTIVE_COOKIE = "active_company_id";

/** Carga única: usuario + empresas + (empresa activa por cookie/primera) + ubicaciones + conexiones */
export async function getBootstrapData(): Promise<BootstrapData> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;
  if (!email) throw Object.assign(new Error("unauth"), { status: 401 });

  // ---- Usuario
  const user = await prisma.user.findUnique({
    where: { email },
    select: {
      id: true,
      name: true,
      email: true,
      image: true,
      role: true,
      locale: true,
      timezone: true,
      onboardingStatus: true,
    },
  });
  if (!user) throw Object.assign(new Error("no_user"), { status: 400 });

  const isAdmin = user.role === "system_admin" || user.role === "org_admin";

  // ---- Empresas
  let userCompanies: Array<{ companyId: string; role: "OWNER" | "ADMIN" | "MEMBER" | null }> = [];
  let companiesResolved: Array<{ id: string; name: string; role: "OWNER" | "ADMIN" | "MEMBER" | null }> = [];

  if (isAdmin) {
    const allCompanies = await prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    // compatibilidad: mismo shape antiguo
    userCompanies = allCompanies.map((c) => ({ companyId: c.id, role: "ADMIN" }));

    // dropdown: todas con nombre
    companiesResolved = allCompanies.map((c) => ({ id: c.id, name: c.name, role: "ADMIN" }));
  } else {
    userCompanies = await prisma.userCompany.findMany({
      where: { userId: user.id },
      select: { companyId: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    const userCompaniesWithName = await prisma.userCompany.findMany({
      where: { userId: user.id },
      select: {
        companyId: true,
        role: true,
        Company: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: "asc" },
    });

    companiesResolved = userCompaniesWithName.map((uc) => ({
      id: uc.Company?.id ?? uc.companyId,
      name: uc.Company?.name ?? `Empresa ${uc.companyId.slice(0, 6)}…`,
      role: uc.role,
    }));
  }

  // LEER cookie (no escribir aquí)
  const jar = await cookies(); // ✅ En Next 15 es async
  const cookieCompanyId = jar.get(ACTIVE_COOKIE)?.value ?? null;

  // Preferimos cookie si pertenece al usuario; si no, la primera (admins: cualquier)
  const allowedCompanyIds = new Set(userCompanies.map((uc) => uc.companyId));
  const activeCompanyId =
    (cookieCompanyId && allowedCompanyIds.has(cookieCompanyId) ? cookieCompanyId : null) ??
    userCompanies[0]?.companyId ??
    null;

  // ---- Empresa activa (si hay)
  const activeCompany = activeCompanyId
    ? await prisma.company.findUnique({
        where: { id: activeCompanyId },
        select: {
          id: true,
          name: true,
          logoUrl: true,
          plan: true,
          city: true,
          country: true,
          website: true,
          brandColor: true,
          reviewsAvg: true,
          reviewsCount: true,
          lastSyncAt: true,
        },
      })
    : null;

  // ---- Ubicaciones de la activa
  const rawLocations = activeCompanyId
    ? await prisma.location.findMany({
        where: { companyId: activeCompanyId },
        select: {
          id: true,
          companyId: true,
          title: true,
          slug: true,
          status: true,
          type: true,
          address: true,
          address2: true,
          openingHours: true,
          city: true,
          region: true,
          postalCode: true,
          country: true,
          countryCode: true,
          phone: true,
          email: true,
          website: true,
          googleName: true,
          googlePlaceId: true,
          googleLocationId: true,
          googleAccountId: true,
          externalConnectionId: true,
          featuredImageUrl: true,
          instagramUrl: true,
          facebookUrl: true,
          timezone: true,
          latitude: true,
          longitude: true,
          reviewsAvg: true,
          reviewsCount: true,
          lastSyncAt: true,
          createdAt: true,
          updatedAt: true,
          isFeatured: true,
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  const locations = rawLocations.map((l) => ({
    ...l,
    latitude: l.latitude ? l.latitude.toString() : null,
    longitude: l.longitude ? l.longitude.toString() : null,
    reviewsAvg: l.reviewsAvg ? l.reviewsAvg.toString() : null,
  }));

  // ---- Conexiones externas (sin tokens)
  const connections = activeCompanyId
    ? await prisma.externalConnection.findMany({
        where: { companyId: activeCompanyId },
        select: {
          id: true,
          provider: true,
          accountName: true,
          accountEmail: true,
          scope: true,
          expires_at: true,
          companyId: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: { createdAt: "asc" },
      })
    : [];

  // ✅ NUEVO: alias cómodo para el cliente
  const activeCompanyResolved = activeCompany ? { id: activeCompany.id, name: activeCompany.name } : null;

  return {
    user: {
      id: user.id,
      name: user.name,
      email: user.email!,
      image: user.image ?? null,
      role: user.role,
      locale: user.locale ?? null,
      timezone: user.timezone ?? null,
      onboardingStatus: (user.onboardingStatus as any) ?? "PENDING",
    },
    companies: userCompanies, // ← compat
    companiesResolved, // ← con nombre (admins: todas)
    activeCompany: activeCompany
      ? {
          id: activeCompany.id,
          name: activeCompany.name,
          logoUrl: activeCompany.logoUrl,
          plan: activeCompany.plan,
          city: activeCompany.city,
          country: activeCompany.country,
          website: activeCompany.website,
          brandColor: activeCompany.brandColor,
          reviewsAvg: activeCompany.reviewsAvg ? activeCompany.reviewsAvg.toString() : null,
          reviewsCount: activeCompany.reviewsCount,
          lastSyncAt: activeCompany.lastSyncAt ?? null,
        }
      : null,
    activeCompanyResolved,
    locations,
    connections,
  };
}

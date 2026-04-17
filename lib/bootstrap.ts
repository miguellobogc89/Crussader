// lib/bootstrap.ts
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/prisma";
import { cookies } from "next/headers";
import "server-only";

/** Relación mínima para el Type de Location cuando cargamos en bootstrap */
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
    reviewsAvg: string | null;
    reviewsCount: number;
    lastSyncAt: Date | null;
  } | null;
  activeCompanyResolved?: { id: string; name: string } | null;
  activeLocationResolved?: {
    id: string;
    title: string;
    companyId: string;
  } | null;
  sessionContext: {
    userId: string;
    userRole: "system_admin" | "org_admin" | "user" | "test";
    companyId: string | null;
    locationId: string | null;
  };
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
    latitude: string | null;
    longitude: string | null;
    reviewsAvg: string | null;
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

const ACTIVE_LOCATION_COOKIE = "active_location_id";

export async function getBootstrapData(): Promise<BootstrapData> {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email ?? null;

  if (!email) {
    throw Object.assign(new Error("unauth"), { status: 401 });
  }

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

  if (!user) {
    throw Object.assign(new Error("no_user"), { status: 400 });
  }

  const isAdmin = user.role === "system_admin" || user.role === "org_admin";

  // Compatibilidad: seguimos exponiendo companies, pero ya no gobiernan el flujo.
  let userCompanies: Array<{
    companyId: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | null;
  }> = [];

  let companiesResolved: Array<{
    id: string;
    name: string;
    role: "OWNER" | "ADMIN" | "MEMBER" | null;
  }> = [];

  if (isAdmin) {
    const allCompanies = await prisma.company.findMany({
      select: { id: true, name: true },
      orderBy: { createdAt: "asc" },
    });

    userCompanies = allCompanies.map((c) => ({
      companyId: c.id,
      role: "ADMIN",
    }));

    companiesResolved = allCompanies.map((c) => ({
      id: c.id,
      name: c.name,
      role: "ADMIN",
    }));
  } else {
    const rawUserCompanies = await prisma.userCompany.findMany({
      where: { userId: user.id },
      select: { companyId: true, role: true },
      orderBy: { createdAt: "asc" },
    });

    userCompanies = rawUserCompanies;

    const rawUserCompaniesWithName = await prisma.userCompany.findMany({
      where: { userId: user.id },
      select: {
        companyId: true,
        role: true,
        Company: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    companiesResolved = rawUserCompaniesWithName.map((uc) => ({
      id: uc.Company?.id ?? uc.companyId,
      name: uc.Company?.name ?? `Empresa ${uc.companyId.slice(0, 6)}…`,
      role: uc.role,
    }));
  }

  // Base nueva real: locations accesibles por user
  const rawUserLocations = isAdmin
    ? await prisma.location.findMany({
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
    : await prisma.userLocation.findMany({
        where: { userId: user.id },
        select: {
          location: {
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
          },
        },
        orderBy: { createdAt: "asc" },
      }).then((rows) => rows.map((row) => row.location));

  const locations = rawUserLocations.map((l) => ({
    ...l,
    latitude: l.latitude ? l.latitude.toString() : null,
    longitude: l.longitude ? l.longitude.toString() : null,
    reviewsAvg: l.reviewsAvg ? l.reviewsAvg.toString() : null,
  }));

  const jar = await cookies();
  const cookieLocationId = jar.get(ACTIVE_LOCATION_COOKIE)?.value ?? null;

  const allowedLocationIds = new Set(locations.map((l) => l.id));

  const activeLocation =
    cookieLocationId && allowedLocationIds.has(cookieLocationId)
      ? (locations.find((l) => l.id === cookieLocationId) || locations[0] || null)
      : (locations[0] || null);
    locations[0] ??
    null;

  const activeLocationResolved = activeLocation
    ? {
        id: activeLocation.id,
        title: activeLocation.title,
        companyId: activeLocation.companyId,
      }
    : null;

  const activeCompany = activeLocation?.companyId
    ? await prisma.company.findUnique({
        where: { id: activeLocation.companyId },
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

  const activeCompanyResolved = activeCompany
    ? {
        id: activeCompany.id,
        name: activeCompany.name,
      }
    : null;

  const connections = activeCompany?.id
    ? await prisma.externalConnection.findMany({
        where: { companyId: activeCompany.id },
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

  const sessionContext = {
    userId: user.id,
    userRole: user.role,
    companyId: activeCompany?.id ?? null,
    locationId: activeLocation?.id ?? null,
  };

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
    companies: userCompanies,
    companiesResolved,
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
          reviewsAvg: activeCompany.reviewsAvg
            ? activeCompany.reviewsAvg.toString()
            : null,
          reviewsCount: activeCompany.reviewsCount,
          lastSyncAt: activeCompany.lastSyncAt ?? null,
        }
      : null,
    activeCompanyResolved,
    activeLocationResolved,
    sessionContext,
    locations,
    connections,
  };
}
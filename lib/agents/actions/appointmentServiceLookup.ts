// lib/agents/actions/appointmentServiceLookup.ts
import { prisma } from "@/lib/prisma";
import { updateSessionMemory } from "@/lib/agents/memory/updateSessionMemory";

function clean(v: unknown): string {
  return String(v || "").trim();
}

function normalizeText(v: unknown): string {
  return clean(v)
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function tokenize(v: string): string[] {
  const text = normalizeText(v);

  if (text.length === 0) {
    return [];
  }

  return text.split(" ").filter((part) => part.length > 1);
}

type ServiceCandidate = {
  serviceId: string;
  serviceName: string;
  locationId: string;
  locationTitle: string;
  score: number;
};

export type AppointmentServiceLookupResult = {
  ok: true;
  status: "RESOLVED" | "AMBIGUOUS" | "NOT_FOUND";
  requestedText: string;
  selectedServiceId: string | null;
  selectedLocationId: string | null;
  candidates: Array<{
    serviceId: string;
    serviceName: string;
    locationId: string;
    locationTitle: string;
    score: number;
  }>;
  message: string;
};

function scoreServiceMatch(userText: string, serviceName: string): number {
  const userNorm = normalizeText(userText);
  const serviceNorm = normalizeText(serviceName);

  if (userNorm.length === 0 || serviceNorm.length === 0) {
    return 0;
  }

  if (userNorm === serviceNorm) {
    return 100;
  }

  if (serviceNorm.includes(userNorm)) {
    return 80;
  }

  if (userNorm.includes(serviceNorm)) {
    return 70;
  }

  const userTokens = tokenize(userNorm);
  const serviceTokens = tokenize(serviceNorm);

  if (userTokens.length === 0 || serviceTokens.length === 0) {
    return 0;
  }

  let shared = 0;

  for (const token of userTokens) {
    if (serviceTokens.includes(token)) {
      shared += 1;
    }
  }

  if (shared === 0) {
    return 0;
  }

  let score = shared * 10;

  if (shared === userTokens.length) {
    score += 20;
  }

  return score;
}

export async function appointmentServiceLookup(args: {
  sessionId: string;
  companyId: string;
  userText: string;
}): Promise<AppointmentServiceLookupResult> {
  const sessionId = clean(args.sessionId);
  const companyId = clean(args.companyId);
  const userText = clean(args.userText);

  if (!sessionId) {
    throw new Error("Missing sessionId");
  }

  if (!companyId) {
    throw new Error("Missing companyId");
  }

  if (!userText) {
    throw new Error("Missing userText");
  }

  const services = await prisma.service.findMany({
    where: {
      active: true,
      location: {
        companyId,
        status: "ACTIVE",
      },
    },
    select: {
      id: true,
      name: true,
      locationId: true,
      location: {
        select: {
          title: true,
        },
      },
    },
    orderBy: [{ name: "asc" }],
  });

  const candidates: ServiceCandidate[] = [];

  for (const service of services) {
    const score = scoreServiceMatch(userText, service.name);

    if (score > 0) {
      candidates.push({
        serviceId: service.id,
        serviceName: service.name,
        locationId: service.locationId,
        locationTitle: service.location.title,
        score,
      });
    }
  }

  candidates.sort((a, b) => b.score - a.score);

  if (candidates.length === 0) {
    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        flow: "appointment_management",
        step: "awaiting_service",
        requestedServiceText: userText,
        selectedServiceId: null,
      },
    });

    return {
      ok: true,
      status: "NOT_FOUND",
      requestedText: userText,
      selectedServiceId: null,
      selectedLocationId: null,
      candidates: [],
      message: "service not found",
    };
  }

  const best = candidates[0];
  const second = candidates.length > 1 ? candidates[1] : null;

  let isAmbiguous = false;

  if (second) {
    if (second.score === best.score) {
      isAmbiguous = true;
    }
  }

  if (isAmbiguous) {
    const topCandidates = candidates.filter((candidate) => candidate.score === best.score);

    await updateSessionMemory({
      sessionId,
      bucket: "state",
      patch: {
        flow: "appointment_management",
        step: "awaiting_service_confirmation",
        requestedServiceText: userText,
        selectedServiceId: null,
      },
    });

    return {
      ok: true,
      status: "AMBIGUOUS",
      requestedText: userText,
      selectedServiceId: null,
      selectedLocationId: null,
      candidates: topCandidates.map((candidate) => ({
        serviceId: candidate.serviceId,
        serviceName: candidate.serviceName,
        locationId: candidate.locationId,
        locationTitle: candidate.locationTitle,
        score: candidate.score,
      })),
      message: "multiple matching services",
    };
  }

  const sameServiceInLocations = candidates.filter((candidate) => {
    return normalizeText(candidate.serviceName) === normalizeText(best.serviceName);
  });

  let selectedLocationId: string | null = null;
  let nextStep = "awaiting_location";

  if (sameServiceInLocations.length === 1) {
    selectedLocationId = best.locationId;
    nextStep = "awaiting_datetime";
  }

  await updateSessionMemory({
    sessionId,
    bucket: "state",
    patch: {
      flow: "appointment_management",
      step: nextStep,
      requestedServiceText: userText,
      selectedServiceId: best.serviceId,
      selectedLocationId,
    },
  });

  return {
    ok: true,
    status: "RESOLVED",
    requestedText: userText,
    selectedServiceId: best.serviceId,
    selectedLocationId,
    candidates: sameServiceInLocations.map((candidate) => ({
      serviceId: candidate.serviceId,
      serviceName: candidate.serviceName,
      locationId: candidate.locationId,
      locationTitle: candidate.locationTitle,
      score: candidate.score,
    })),
    message: "service resolved",
  };
}
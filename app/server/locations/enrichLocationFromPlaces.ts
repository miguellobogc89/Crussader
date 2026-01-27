import { prisma } from "@/app/server/db";

type PlacesAddressComponent = {
  longText?: string;
  shortText?: string;
  types?: string[];
};

function pick(components: PlacesAddressComponent[], type: string) {
  for (const c of components) {
    if (Array.isArray(c.types) && c.types.includes(type)) {
      return {
        long: c.longText ?? null,
        short: c.shortText ?? null,
      };
    }
  }
  return { long: null, short: null };
}

export async function enrichLocationFromPlaces(params: {
  locationId: string;      // tu Location.id
  placeId: string;         // Google placeId (ChIJ...)
  apiKey: string;          // server key
}) {
  const { locationId, placeId, apiKey } = params;

  const url =
    `https://places.googleapis.com/v1/places/${encodeURIComponent(placeId)}` +
    `?fields=formattedAddress,location,addressComponents`;

  const res = await fetch(url, {
    headers: { "X-Goog-Api-Key": apiKey },
    cache: "no-store",
  });

  const data = await res.json();

  if (!res.ok) {
    throw new Error(data?.error?.message || "Places error");
  }

  const components: PlacesAddressComponent[] = Array.isArray(data.addressComponents)
    ? data.addressComponents
    : [];

  const streetNumber = pick(components, "street_number").long;
  const route = pick(components, "route").long;
  const locality = pick(components, "locality").long;
  const admin2 = pick(components, "administrative_area_level_2").long;
  const admin1 = pick(components, "administrative_area_level_1").long;
  const postal = pick(components, "postal_code").long;
  const countryShort = pick(components, "country").short;

  let streetLine1 = "";
  if (route) streetLine1 = route;
  if (streetNumber) streetLine1 = streetLine1 ? `${streetLine1} ${streetNumber}` : streetNumber;
  if (!streetLine1) streetLine1 = data.formattedAddress ?? "";

  const lat = data?.location?.latitude ?? null;
  const lng = data?.location?.longitude ?? null;

  // 1) upsert address + attach a location (usa tu función SQL)
  const rows = await prisma.$queryRaw<Array<{ id: string }>>`
    select public.upsert_address_and_attach_to_location(
      ${locationId},
      ${placeId},
      ${data.formattedAddress ?? null},
      ${streetLine1},
      ${null},
      ${postal ?? null},
      ${countryShort ?? "ES"},
      ${locality ?? null},
      ${admin2 ?? null},
      ${admin1 ?? null},
      ${lat},
      ${lng},
      ${JSON.stringify(components)}::jsonb
    ) as id
  `;

  const addressId = rows?.[0]?.id ?? null;

  // 2) opcional: rellenar legacy en Location (si quieres “por si acaso” además del trigger)
  await prisma.location.update({
    where: { id: locationId },
    data: {
      googlePlaceId: placeId,
      address: data.formattedAddress ?? undefined,
      city: locality ?? undefined,
      region: admin1 ?? undefined,
      postalCode: postal ?? undefined,
      countryCode: (countryShort ?? "ES") as any,
      latitude: lat ?? undefined,
      longitude: lng ?? undefined,
    },
  });

  return { addressId };
}

// lib/crussader-assistant/products/prayer/deliverPrayerProduct.ts

import { getPrayer } from "@/lib/crussader-assistant/domains/prayer/getPrayer";

type PrayerCatalogItemKey =
  | "GOSPEL"
  | "PSALM"
  | "READING"
  | "REFLECTION"
  | "ALL";

type DeliverPrayerProductArgs = {
  itemKey?: string | null;
};

type DeliveredPrayerItem = {
  product: "PRAYER";
  itemKey: string;
  title: string;
  reference: string;
  text: string;
  source: string;
};

type DeliverPrayerProductResult =
  | {
      ok: true;
      product: "PRAYER";
      items: DeliveredPrayerItem[];
    }
  | {
      ok: false;
      product: "PRAYER";
      error: string;
    };

type PrayerAllItem = {
  title: string;
  part: string;
  data?: {
    primera_lectura?: {
      title: string;
      reference: string;
      text: string;
    };
    salmo?: {
      title: string;
      reference: string;
      text: string;
    };
    evangelio?: {
      title: string;
      reference: string;
      text: string;
    };
  };
};

function isPrayerAllItem(value: unknown): value is PrayerAllItem {
  if (!value || typeof value !== "object") {
    return false;
  }

  const record = value as Record<string, unknown>;

  if (record.part !== "all") {
    return false;
  }

  return "data" in record;
}

function normalizePrayerItemKey(value: unknown): PrayerCatalogItemKey {
  const raw = String(value || "").trim().toUpperCase();

  if (raw === "PSALM") {
    return "PSALM";
  }

  if (raw === "READING") {
    return "READING";
  }

  if (raw === "REFLECTION") {
    return "REFLECTION";
  }

  if (raw === "ALL") {
    return "ALL";
  }

  return "GOSPEL";
}

function mapCatalogItemToPrayerKind(itemKey: PrayerCatalogItemKey): string {
  if (itemKey === "PSALM") {
    return "salmo";
  }

  if (itemKey === "READING") {
    return "primera_lectura";
  }

  if (itemKey === "ALL") {
    return "all";
  }

  if (itemKey === "REFLECTION") {
    return "reflection";
  }

  return "evangelio";
}

function mapPrayerPartToCatalogItemKey(part: unknown): string {
  const raw = String(part || "").trim().toLowerCase();

  if (raw === "salmo") {
    return "PSALM";
  }

  if (raw === "primera_lectura") {
    return "READING";
  }

  if (raw === "reflection") {
    return "REFLECTION";
  }

  return "GOSPEL";
}

export async function deliverPrayerProduct(
  args: DeliverPrayerProductArgs = {}
): Promise<DeliverPrayerProductResult> {
  const itemKey = normalizePrayerItemKey(args.itemKey);
  const prayerKind = mapCatalogItemToPrayerKind(itemKey);

  if (itemKey === "REFLECTION") {
    return {
      ok: false,
      product: "PRAYER",
      error: "La reflexión todavía no está disponible."
    };
  }

  try {
    const result = await getPrayer({
      kind: prayerKind
    });

    if (!result.ok) {
      return {
        ok: false,
        product: "PRAYER",
        error: "No he podido obtener el rezo ahora mismo."
      };
    }

    if (Array.isArray(result.items) && result.items.length > 0) {
      const items: DeliveredPrayerItem[] = [];

      for (const item of result.items) {
        items.push({
          product: "PRAYER",
          itemKey: mapPrayerPartToCatalogItemKey(item.part),
          title: String(item.title || "").trim(),
          reference: String(item.reference || "").trim(),
          text: String(item.text || "").trim(),
          source: String(item.source || "").trim()
        });
      }

      return {
        ok: true,
        product: "PRAYER",
        items
      };
    }

    if (result.item && isPrayerAllItem(result.item) && result.item.data) {
      const items: DeliveredPrayerItem[] = [];

      if (result.item.data.primera_lectura) {
        items.push({
          product: "PRAYER",
          itemKey: "READING",
          title: String(result.item.data.primera_lectura.title || "").trim(),
          reference: String(result.item.data.primera_lectura.reference || "").trim(),
          text: String(result.item.data.primera_lectura.text || "").trim(),
          source: "prayer-api"
        });
      }

      if (result.item.data.salmo) {
        items.push({
          product: "PRAYER",
          itemKey: "PSALM",
          title: String(result.item.data.salmo.title || "").trim(),
          reference: String(result.item.data.salmo.reference || "").trim(),
          text: String(result.item.data.salmo.text || "").trim(),
          source: "prayer-api"
        });
      }

      if (result.item.data.evangelio) {
        items.push({
          product: "PRAYER",
          itemKey: "GOSPEL",
          title: String(result.item.data.evangelio.title || "").trim(),
          reference: String(result.item.data.evangelio.reference || "").trim(),
          text: String(result.item.data.evangelio.text || "").trim(),
          source: "prayer-api"
        });
      }

      return {
        ok: true,
        product: "PRAYER",
        items
      };
    }

if (
  result.item &&
  "reference" in result.item &&
  "text" in result.item &&
  "source" in result.item
) {
  return {
    ok: true,
    product: "PRAYER",
    items: [
      {
        product: "PRAYER",
        itemKey: mapPrayerPartToCatalogItemKey(result.item.part),
        title: String(result.item.title || "").trim(),
        reference: String(result.item.reference || "").trim(),
        text: String(result.item.text || "").trim(),
        source: String(result.item.source || "").trim()
      }
    ]
  };
}

    return {
      ok: false,
      product: "PRAYER",
      error: "No he encontrado contenido disponible."
    };
  } catch (error) {
    return {
      ok: false,
      product: "PRAYER",
      error: error instanceof Error ? error.message : "Unknown error"
    };
  }
}   
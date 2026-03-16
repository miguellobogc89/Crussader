// lib/crussader-assistant/routing/resolveIntentAgainstCatalog.ts
import { IntakePacket } from "../legacy/intake/types";
import { getNeed } from "../catalogs/needs";
import { getProduct } from "../catalogs/products";

type ResolveIntentResult = {
  valid: boolean;
  targetModule: string | null;
  normalizedNeed: string | null;
  normalizedProduct: string | null;
};

export function resolveIntentAgainstCatalog(
  packet: IntakePacket
): ResolveIntentResult {
  const need = getNeed(packet.understanding.requestedNeed);
  const product = getProduct(packet.understanding.product);

  if (!need) {
    return {
      valid: false,
      targetModule: null,
      normalizedNeed: null,
      normalizedProduct: null
    };
  }

  if (!product) {
    return {
      valid: false,
      targetModule: null,
      normalizedNeed: need.key,
      normalizedProduct: null
    };
  }

  return {
    valid: true,
    targetModule: product.actionModule,
    normalizedNeed: need.key,
    normalizedProduct: product.key
  };
}
// lib/crussader-assistant/catalogs/index.ts

import {
  PRODUCT_CATALOG,
  PRODUCT_KEYS,
  getProduct,
  type ProductKey
} from "./products";
import {
  ACTION_CATALOG,
  ACTION_KEYS,
  getAction,
  type ActionKey
} from "./actions";

export { PRODUCT_CATALOG, PRODUCT_KEYS, getProduct };
export { ACTION_CATALOG, ACTION_KEYS, getAction };

export function isValidProductAction(
  productKey: string | null,
  actionKey: string | null
): boolean {
  const product = getProduct(productKey);
  const action = getAction(actionKey);

  if (!product || !action) {
    return false;
  }

  return product.allowedActions.includes(action.key);
}

export function getAllowedActionsForProduct(productKey: string | null) {
  const product = getProduct(productKey);

  if (!product) {
    return [];
  }

  return product.allowedActions
    .map((actionKey) => getAction(actionKey))
    .filter(Boolean);
}

export function getCatalogSummaryText(): string {
  const lines = PRODUCT_KEYS.map((productKey) => {
    const product = PRODUCT_CATALOG[productKey];
    return `- ${product.name}: ${product.description}`;
  });

  return lines.join("\n");
}

export function getProductDetailsText(productKey: string | null): string | null {
  const product = getProduct(productKey);

  if (!product) {
    return null;
  }

  const allowedActions = getAllowedActionsForProduct(product.key)
    .map((action) => action?.name)
    .filter(Boolean)
    .join(", ");

  return [
    `${product.name}`,
    product.description,
    `Acciones disponibles: ${allowedActions}.`
  ].join("\n");
}

export function getCatalogForPrompt() {
  return PRODUCT_KEYS.map((productKey) => {
    const product = PRODUCT_CATALOG[productKey];

    return {
      key: product.key,
      name: product.name,
      description: product.description,
      allowedActions: product.allowedActions.map((actionKey) => {
        const action = ACTION_CATALOG[actionKey as ActionKey];

        return {
          key: action.key,
          name: action.name,
          description: action.description
        };
      })
    };
  });
}
// lib/crussader-assistant/catalog/getActiveAgentCatalog.ts

import { getAgentCatalog } from "./getAgentCatalog";

export async function getActiveAgentCatalog() {
  const catalog = await getAgentCatalog();

  return catalog
    .filter((capability) => capability.status === "ACTIVE")
    .map((capability) => {
      return {
        ...capability,
        actions: capability.actions.filter((action) => action.status === "ACTIVE"),
        products: capability.products
          .filter((product) => product.status === "ACTIVE")
          .map((product) => {
            return {
              ...product,
              items: product.items.filter((item) => item.status === "ACTIVE")
            };
          })
      };
    });
}
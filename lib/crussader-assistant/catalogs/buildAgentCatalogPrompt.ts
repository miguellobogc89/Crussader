// lib/crussader-assistant/catalog/buildAgentCatalogPrompt.ts

import { getActiveAgentCatalog } from "./getActiveAgentCatalog";

export async function buildAgentCatalogPrompt() {
  const catalog = await getActiveAgentCatalog();

  if (!catalog.length) {
    return "El asistente no tiene capacidades disponibles.";
  }

  const sections: string[] = [];

  for (const capability of catalog) {
    const lines: string[] = [];

    lines.push(`CAPABILITY: ${capability.key}`);
    lines.push(`Nombre: ${capability.label}`);

    if (capability.description) {
      lines.push(`Descripción: ${capability.description}`);
    }

    if (capability.actions.length) {
      const actions = capability.actions.map((a) => a.key).join(", ");
      lines.push(`Acciones permitidas: ${actions}`);
    }

    if (capability.products.length) {
      lines.push(`Productos:`);

      for (const product of capability.products) {
        const itemKeys = product.items.map((i) => i.key).join(", ");

        if (itemKeys) {
          lines.push(
            ` - ${product.key} (${product.label}) -> items: ${itemKeys}`
          );
        } else {
          lines.push(` - ${product.key} (${product.label})`);
        }
      }
    }

    sections.push(lines.join("\n"));
  }

  return `
CAPACIDADES DEL ASISTENTE

${sections.join("\n\n")}
`;
}
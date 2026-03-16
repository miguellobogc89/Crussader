// lib/crussader-assistant/catalog/items/resolveItemTemplateVariables.ts
import { getPrayer } from "@/lib/crussader-assistant/domains/prayer/getPrayer";

type WhatsAppTemplateParameter = {
  type: "text";
  text: string;
};

type WhatsAppTemplateComponent = {
  type: "body";
  parameters: WhatsAppTemplateParameter[];
};

type ResolveItemTemplateVariablesArgs = {
  itemKey: string;
  templateVariables: unknown;
};

function asText(value: unknown) {
  return String(value || "").trim();
}

function sanitizeWhatsAppTemplateText(value: unknown) {
  let text = asText(value);

  text = text.replace(/\r\n/g, " ");
  text = text.replace(/\n/g, " ");
  text = text.replace(/\r/g, " ");
  text = text.replace(/\t/g, " ");
  text = text.replace(/ {5,}/g, "    ");
  text = text.replace(/\s+/g, " ").trim();

  return text;
}

function asStringArray(value: unknown): string[] {
  if (!Array.isArray(value)) {
    return [];
  }

  const result: string[] = [];

  for (const item of value) {
    const text = asText(item);

    if (text) {
      result.push(text);
    }
  }

  return result;
}

function buildBodyComponents(values: string[]): WhatsAppTemplateComponent[] {
  const parameters: WhatsAppTemplateParameter[] = [];

  for (const value of values) {
parameters.push({
  type: "text",
  text: sanitizeWhatsAppTemplateText(value),
});
  }

  if (parameters.length === 0) {
    return [];
  }

  return [
    {
      type: "body",
      parameters,
    },
  ];
}

function getPrayerItemText(value: unknown): string {
  if (!value || typeof value !== "object") {
    return "";
  }

  const record = value as Record<string, unknown>;
  return asText(record.text);
}

async function resolvePrayerValue(itemKey: string): Promise<string> {
  if (itemKey === "GOSPEL") {
    const result = await getPrayer({ kind: "gospel" });
    return getPrayerItemText(result.item);
  }

  if (itemKey === "PSALM") {
    const result = await getPrayer({ kind: "psalm" });
    return getPrayerItemText(result.item);
  }

  if (itemKey === "READING") {
    const result = await getPrayer({ kind: "reading" });
    return getPrayerItemText(result.item);
  }

  return "";
}

export async function resolveItemTemplateVariables(
  args: ResolveItemTemplateVariablesArgs
) {
  const itemKey = asText(args.itemKey);
  const variableNames = asStringArray(args.templateVariables);

  if (!itemKey) {
    return {
      valuesByName: {} as Record<string, string>,
      orderedValues: [] as string[],
      components: [] as WhatsAppTemplateComponent[],
    };
  }

  if (variableNames.length === 0) {
    return {
      valuesByName: {} as Record<string, string>,
      orderedValues: [] as string[],
      components: [] as WhatsAppTemplateComponent[],
    };
  }

  const valuesByName: Record<string, string> = {};

  if (
    itemKey === "GOSPEL" ||
    itemKey === "PSALM" ||
    itemKey === "READING"
  ) {
    const resolvedValue = await resolvePrayerValue(itemKey);

    for (const variableName of variableNames) {
      valuesByName[variableName] = resolvedValue;
    }
  }

  const orderedValues: string[] = [];

  for (const variableName of variableNames) {
    orderedValues.push(asText(valuesByName[variableName]));
  }

  return {
    valuesByName,
    orderedValues,
    components: buildBodyComponents(orderedValues),
  };
}
// lib/crussader-assistant/dev/translatorCapabilityTestSuite.ts
import { translateUserMessageForIntake } from "../legacy/bridges/translator/translateUserMessageForIntake";

type TestCase = {
  text: string;
};

const tests: TestCase[] = [
  { text: "hola" },
  { text: "buenas" },
  { text: "he tenido un mal día" },

  { text: "¿qué puedes hacer?" },
  { text: "dime todo lo que sabes hacer" },

  { text: "quiero que me recuerdes llamar a mamá" },
  { text: "recuérdame comprar pan mañana" },
  { text: "despiértame a las 8" },

  { text: "mañana a las 9" },
  { text: "todos los días" },

  { text: "¿qué recordatorios tengo?" },
  { text: "dime mis recordatorios" },

  { text: "cambia el recordatorio de llamar a mamá a las 9" },
  { text: "muévelo a mañana" },

  { text: "pausa el recordatorio" },
  { text: "reanúdalo" },

  { text: "cancela el recordatorio de llamar a mamá" },
  { text: "borra todos mis recordatorios" },

  { text: "¿cuál es la capital de Perú?" },
  { text: "no sabía la capital de Marruecos" },

  { text: "envíame el evangelio todos los días" },
  { text: "quiero recibir las noticias cada mañana" },

  { text: "explícame los avisos deportivos" },
  { text: "qué envíos tienes" }
];

export async function runTranslatorCapabilityTestSuite() {
  for (const test of tests) {
    const result = await translateUserMessageForIntake({
      rawUserText: test.text,
      previousMessages: [],
      catalog: [],
      catalogSummary: ""
    });

    console.log("--------------------------------------------------");
    console.log("INPUT:", test.text);
    console.log("interactionMode:", result.interactionMode);
    console.log("legacyCapability:", result.detectedCapability);

    console.log("catalogCapability:", result.detectedCatalogCapabilityKey);
    console.log("catalogAction:", result.detectedCatalogActionKey);
    console.log("catalogProduct:", result.detectedCatalogProductKey);
    console.log("catalogItem:", result.detectedCatalogItemKey);

    console.log("confidence:", result.confidence);
  }
}
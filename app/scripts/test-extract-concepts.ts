// scripts/test-extract-concepts.ts
import { extractConceptsFromReview } from "@/app/server/concepts/extractConcepts";

async function main() {
  const samples = [
    "Todo perfecto, volveré.",
    "El helado de pistacho estaba buenísimo pero me pareció caro para la cantidad. La chica de la barra fue muy amable.",
    "Tardaron 25 minutos en atendernos y el baño estaba sucio. El café con leche estaba correcto.",
    "No había sitio en la terraza y nos dijeron que esperáramos. Al final nos fuimos.",
  ];

  for (const text of samples) {
    const concepts = await extractConceptsFromReview(text, {
      businessName: "Heladería Demo",
      businessType: "Heladería",
      activityName: "Consumo en local",
    });

    console.log("\n=== REVIEW ===");
    console.log(text);
    console.log("=== CONCEPTS ===");
    console.log(JSON.stringify(concepts, null, 2));
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});

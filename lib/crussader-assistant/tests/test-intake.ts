// lib/crussader-assistant/tests/test-intake.ts
import { createBaseIntakePacket } from "../intake/createBaseIntakePacket";
import { resolveIntentAgainstCatalog } from "../routing/resolveIntentAgainstCatalog";

function runTest() {
  const packet = createBaseIntakePacket({
    rawUserText: "Avísame del tiempo en Sevilla todos los días",
    hasPendingState: false,

    requestedNeed: "CREATE",
    product: "EVENT",
    subtype: "WEATHER_ALERT",

    confidence: 0.9,

    data: {
      place: "Sevilla",
      frequency: "daily"
    }
  });

  console.log("\nINTAKE PACKET\n");
  console.dir(packet, { depth: null });

  const routing = resolveIntentAgainstCatalog(packet);

  console.log("\nROUTING RESULT\n");
  console.dir(routing, { depth: null });
}

runTest();

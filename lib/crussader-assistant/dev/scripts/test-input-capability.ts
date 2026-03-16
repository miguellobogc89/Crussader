// lib/crussader-assistant/scripts/test-input-capability.ts
import { testInputCapability } from "@/lib/crussader-assistant/dev/testInputCapability";

async function main() {
  await testInputCapability();
}

main().catch((error) => {
  console.error("[test-input-capability] failed", error);
  process.exit(1);
});


/**
 * PHASE 2 CLEANUP SCRIPT
 * Run in staging ONLY after verifying the audit queries
 *
 * This script:
 * 1. Removes invalid purposes from external_calendar
 * 2. Cleans up orphaned appointments (externalProvider set but no externalCalendarId)
 * 3. Marks external_calendar_connection as deprecated (not deleted, for audit trail)
 */

import { prisma } from "@/lib/prisma";

async function cleanup() {
  console.log("🔍 PHASE 2 CLEANUP - Starting...\n");

  try {
    // 1. Audit invalid purposes
    console.log("1️⃣ Auditing invalid purposes...");
    const invalidPurposes = await prisma.$queryRaw`
      SELECT DISTINCT purpose
      FROM external_calendar
      WHERE provider = 'google-calendar'
        AND purpose NOT IN ('crussader_mirror', 'google_context')
    `;
    console.log(`   Found ${Array.isArray(invalidPurposes) ? invalidPurposes.length : 0} invalid purposes:`, invalidPurposes);

    // 2. Audit orphaned appointments
    console.log("\n2️⃣ Auditing orphaned appointments...");
    const orphanedCount = await prisma.appointment.count({
      where: {
        externalProvider: { not: null },
        AND: [
          {
            OR: [
              { externalCalendarId: null },
              { externalCalendarId: "" },
            ],
          },
        ],
      },
    });
    console.log(`   Found ${orphanedCount} orphaned appointments (externalProvider set, but no externalCalendarId)`);

    // 3. Audit unused external_calendar_connection records
    console.log("\n3️⃣ Auditing unused external_calendar_connection records...");
    const unusedConnections = await prisma.$queryRaw`
      SELECT COUNT(*) as unused_count
      FROM external_calendar_connection ecc
      WHERE NOT EXISTS (
        SELECT 1 FROM external_calendar ec
        WHERE ec.connection_id = ecc.id
      )
    `;
    console.log(`   Found unused connections:`, unusedConnections);

    console.log("\n✅ AUDIT COMPLETE - Review the numbers above before proceeding with deletions");
    console.log("\n📝 Manual Actions Needed (PHASE 3):");
    console.log("   1. Review invalid purposes and decide: DELETE or RECLASSIFY");
    console.log("   2. Review orphaned appointments - likely safe to DELETE or UPDATE externalProvider=null");
    console.log("   3. Delete external_calendar_connection table (backup first!)");

  } catch (error) {
    console.error("❌ CLEANUP FAILED:", error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

cleanup();

/*
  Warnings:

  - A unique constraint covering the columns `[slug]` on the table `Location` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[googlePlaceId]` on the table `Location` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateEnum
CREATE TYPE "public"."LocationType" AS ENUM ('HQ', 'BRANCH', 'FRANCHISE');

-- CreateEnum
CREATE TYPE "public"."LocationStatus" AS ENUM ('ACTIVE', 'INACTIVE', 'DRAFT', 'PENDING_VERIFICATION');

-- DropIndex
DROP INDEX "public"."Location_googleName_idx";

-- DropIndex
DROP INDEX "public"."Location_googlePlaceId_idx";

-- AlterTable
ALTER TABLE "public"."Location" ADD COLUMN     "address2" TEXT,
ADD COLUMN     "countryCode" VARCHAR(2),
ADD COLUMN     "email" TEXT,
ADD COLUMN     "externalConnectionId" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "featuredImageUrl" TEXT,
ADD COLUMN     "googleAccountId" TEXT,
ADD COLUMN     "googleLocationId" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "latitude" DECIMAL(10,7),
ADD COLUMN     "longitude" DECIMAL(10,7),
ADD COLUMN     "openingHours" JSONB,
ADD COLUMN     "reviewsAvg" DECIMAL(3,2),
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "slug" TEXT,
ADD COLUMN     "status" "public"."LocationStatus" DEFAULT 'DRAFT',
ADD COLUMN     "timezone" TEXT,
ADD COLUMN     "type" "public"."LocationType";

-- CreateIndex
CREATE UNIQUE INDEX "Location_slug_key" ON "public"."Location"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "Location_googlePlaceId_key" ON "public"."Location"("googlePlaceId");

-- CreateIndex
CREATE INDEX "Location_googleAccountId_idx" ON "public"."Location"("googleAccountId");

-- CreateIndex
CREATE INDEX "Location_status_idx" ON "public"."Location"("status");

-- AddForeignKey
ALTER TABLE "public"."Location" ADD CONSTRAINT "Location_externalConnectionId_fkey" FOREIGN KEY ("externalConnectionId") REFERENCES "public"."ExternalConnection"("id") ON DELETE SET NULL ON UPDATE CASCADE;

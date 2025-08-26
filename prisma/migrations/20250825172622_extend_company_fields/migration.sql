-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "address" TEXT,
ADD COLUMN     "brandColor" VARCHAR(16),
ADD COLUMN     "city" TEXT,
ADD COLUMN     "country" TEXT,
ADD COLUMN     "countryCode" VARCHAR(2),
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "facebookUrl" TEXT,
ADD COLUMN     "instagramUrl" TEXT,
ADD COLUMN     "lastSyncAt" TIMESTAMP(3),
ADD COLUMN     "linkedinUrl" TEXT,
ADD COLUMN     "matrix" VARCHAR(128),
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "postalCode" TEXT,
ADD COLUMN     "region" TEXT,
ADD COLUMN     "registryId" VARCHAR(64),
ADD COLUMN     "reviewsAvg" DECIMAL(3,2),
ADD COLUMN     "reviewsCount" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "tagline" VARCHAR(128),
ADD COLUMN     "twitterUrl" TEXT,
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
ADD COLUMN     "vatNumber" VARCHAR(32),
ADD COLUMN     "website" TEXT;

-- CreateIndex
CREATE INDEX "Company_name_idx" ON "public"."Company"("name");

-- CreateIndex
CREATE INDEX "Company_activity_idx" ON "public"."Company"("activity");

-- CreateIndex
CREATE INDEX "Company_matrix_idx" ON "public"."Company"("matrix");

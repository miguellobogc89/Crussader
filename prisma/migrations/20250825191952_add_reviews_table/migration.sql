-- CreateEnum
CREATE TYPE "public"."ReviewProvider" AS ENUM ('GOOGLE');

-- CreateTable
CREATE TABLE "public"."Review" (
    "id" TEXT NOT NULL,
    "companyId" TEXT NOT NULL,
    "locationId" TEXT NOT NULL,
    "provider" "public"."ReviewProvider" NOT NULL,
    "externalId" TEXT NOT NULL,
    "reviewerName" TEXT,
    "reviewerPhoto" TEXT,
    "reviewerAnon" BOOLEAN,
    "rating" INTEGER NOT NULL,
    "comment" TEXT,
    "languageCode" VARCHAR(8),
    "createdAtG" TIMESTAMP(3),
    "updatedAtG" TIMESTAMP(3),
    "replyComment" TEXT,
    "replyUpdatedAtG" TIMESTAMP(3),
    "ingestedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Review_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Review_companyId_idx" ON "public"."Review"("companyId");

-- CreateIndex
CREATE INDEX "Review_locationId_idx" ON "public"."Review"("locationId");

-- CreateIndex
CREATE INDEX "Review_rating_idx" ON "public"."Review"("rating");

-- CreateIndex
CREATE INDEX "Review_createdAtG_idx" ON "public"."Review"("createdAtG");

-- CreateIndex
CREATE UNIQUE INDEX "Review_provider_externalId_key" ON "public"."Review"("provider", "externalId");

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "public"."Company"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Review" ADD CONSTRAINT "Review_locationId_fkey" FOREIGN KEY ("locationId") REFERENCES "public"."Location"("id") ON DELETE CASCADE ON UPDATE CASCADE;

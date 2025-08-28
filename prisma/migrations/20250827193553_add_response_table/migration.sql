-- CreateEnum
CREATE TYPE "public"."ResponseStatus" AS ENUM ('PENDING', 'APPROVED', 'PUBLISHED', 'REJECTED', 'DISABLED');

-- CreateEnum
CREATE TYPE "public"."ResponseSource" AS ENUM ('AI', 'HUMAN');

-- CreateTable
CREATE TABLE "public"."Response" (
    "id" TEXT NOT NULL,
    "reviewId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "status" "public"."ResponseStatus" NOT NULL DEFAULT 'PENDING',
    "active" BOOLEAN NOT NULL DEFAULT true,
    "published" BOOLEAN NOT NULL DEFAULT false,
    "edited" BOOLEAN NOT NULL DEFAULT false,
    "generationCount" INTEGER NOT NULL DEFAULT 1,
    "lastGeneratedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "publishedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "editedById" TEXT,
    "source" "public"."ResponseSource" NOT NULL DEFAULT 'AI',
    "model" TEXT,
    "temperature" DOUBLE PRECISION,
    "promptVersion" TEXT,
    "language" TEXT,
    "tone" TEXT,
    "businessType" TEXT,
    "moderationFlag" BOOLEAN NOT NULL DEFAULT false,
    "moderationNotes" TEXT,
    "lastError" TEXT,

    CONSTRAINT "Response_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Response_reviewId_idx" ON "public"."Response"("reviewId");

-- CreateIndex
CREATE INDEX "Response_status_published_active_idx" ON "public"."Response"("status", "published", "active");

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_reviewId_fkey" FOREIGN KEY ("reviewId") REFERENCES "public"."Review"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "public"."Response" ADD CONSTRAINT "Response_editedById_fkey" FOREIGN KEY ("editedById") REFERENCES "public"."User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

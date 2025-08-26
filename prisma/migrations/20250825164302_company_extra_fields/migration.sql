-- AlterTable
ALTER TABLE "public"."Company" ADD COLUMN     "activity" VARCHAR(64),
ADD COLUMN     "cif" VARCHAR(32),
ADD COLUMN     "employeesBand" VARCHAR(32),
ADD COLUMN     "logoUrl" TEXT;

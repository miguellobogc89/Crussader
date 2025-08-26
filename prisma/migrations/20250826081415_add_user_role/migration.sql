-- CreateEnum
CREATE TYPE "public"."Role" AS ENUM ('system_admin', 'org_admin', 'user');

-- AlterTable
ALTER TABLE "public"."User" ADD COLUMN     "role" "public"."Role" NOT NULL DEFAULT 'user';

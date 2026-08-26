/*
  Warnings:

  - You are about to drop the column `ip` on the `AuditLog` table. All the data in the column will be lost.
  - The `details` column on the `AuditLog` table would be dropped and recreated. This will lead to data loss if there is data in the column.

*/
-- AlterTable
ALTER TABLE "AuditLog" DROP COLUMN "ip",
ADD COLUMN     "ip_address" TEXT,
ADD COLUMN     "resource" TEXT,
ADD COLUMN     "user_agent" TEXT,
DROP COLUMN "details",
ADD COLUMN     "details" JSONB;

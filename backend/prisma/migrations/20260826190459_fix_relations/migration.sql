/*
  Warnings:

  - You are about to drop the column `guest_document` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `guest_email` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `guest_name` on the `reservations` table. All the data in the column will be lost.
  - You are about to drop the column `guest_phone` on the `reservations` table. All the data in the column will be lost.
  - Made the column `guest_id` on table `reservations` required. This step will fail if there are existing NULL values in that column.

*/
-- DropForeignKey
ALTER TABLE "reservations" DROP CONSTRAINT "reservations_guest_id_fkey";

-- AlterTable
ALTER TABLE "reservations" DROP COLUMN "guest_document",
DROP COLUMN "guest_email",
DROP COLUMN "guest_name",
DROP COLUMN "guest_phone",
ALTER COLUMN "guest_id" SET NOT NULL;

-- AddForeignKey
ALTER TABLE "reservations" ADD CONSTRAINT "reservations_guest_id_fkey" FOREIGN KEY ("guest_id") REFERENCES "guests"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

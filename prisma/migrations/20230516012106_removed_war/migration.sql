/*
  Warnings:

  - You are about to drop the `War` table. If the table is not empty, all the data it contains will be lost.

*/
-- DropForeignKey
ALTER TABLE "War" DROP CONSTRAINT "War_user_id_fkey";

-- DropTable
DROP TABLE "War";

/*
  Warnings:

  - You are about to drop the column `latitude` on the `Project` table. All the data in the column will be lost.
  - You are about to drop the column `longitude` on the `Project` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "Project" DROP COLUMN "latitude",
DROP COLUMN "longitude";

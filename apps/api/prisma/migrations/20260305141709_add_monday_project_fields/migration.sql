/*
  Warnings:

  - A unique constraint covering the columns `[mondayId]` on the table `Project` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Project" ADD COLUMN     "mondayId" TEXT,
ADD COLUMN     "qualificationNotes" TEXT;

-- CreateIndex
CREATE UNIQUE INDEX "Project_mondayId_key" ON "Project"("mondayId");

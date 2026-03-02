-- DropForeignKey
ALTER TABLE "ProjectBudget" DROP CONSTRAINT "ProjectBudget_projectId_fkey";

-- AlterTable
ALTER TABLE "ProjectBudget" ADD COLUMN     "customerName" TEXT,
ADD COLUMN     "productsUsed" JSONB,
ALTER COLUMN "projectId" DROP NOT NULL;

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE SET NULL ON UPDATE CASCADE;

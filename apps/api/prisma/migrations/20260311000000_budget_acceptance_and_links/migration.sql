-- CreateEnum
CREATE TYPE "ProjectBudgetStatus" AS ENUM ('PENDING', 'ACCEPTED');

-- AlterTable ProjectBudget: status, acceptedAt, saleId
ALTER TABLE "ProjectBudget" ADD COLUMN "saleId" UUID,
ADD COLUMN "status" "ProjectBudgetStatus" NOT NULL DEFAULT 'PENDING',
ADD COLUMN "acceptedAt" TIMESTAMP(3);

-- AlterTable Project: projectBudgetId (unique)
ALTER TABLE "Project" ADD COLUMN "projectBudgetId" UUID;

-- AlterTable Contract: projectBudgetId, compraVendaPdfUrl, prestacaoServicoPdfUrl
ALTER TABLE "Contract" ADD COLUMN "projectBudgetId" UUID,
ADD COLUMN "compraVendaPdfUrl" TEXT,
ADD COLUMN "prestacaoServicoPdfUrl" TEXT;

-- CreateIndex ProjectBudget.projectBudgetId unique on Project
CREATE UNIQUE INDEX "Project_projectBudgetId_key" ON "Project"("projectBudgetId");

-- AddForeignKey ProjectBudget.saleId -> Sale
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Project.projectBudgetId -> ProjectBudget
ALTER TABLE "Project" ADD CONSTRAINT "Project_projectBudgetId_fkey" FOREIGN KEY ("projectBudgetId") REFERENCES "ProjectBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey Contract.projectBudgetId -> ProjectBudget
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_projectBudgetId_fkey" FOREIGN KEY ("projectBudgetId") REFERENCES "ProjectBudget"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "ProjectBudget_saleId_idx" ON "ProjectBudget"("saleId");
CREATE INDEX "Project_projectBudgetId_idx" ON "Project"("projectBudgetId");
CREATE INDEX "Contract_projectBudgetId_idx" ON "Contract"("projectBudgetId");

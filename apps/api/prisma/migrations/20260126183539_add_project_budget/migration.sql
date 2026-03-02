-- CreateTable
CREATE TABLE "ProjectBudget" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "projectId" UUID NOT NULL,
    "laborCost" DECIMAL(15,2) NOT NULL,
    "materialCost" DECIMAL(15,2) NOT NULL,
    "taxAmount" DECIMAL(15,2) NOT NULL,
    "otherCosts" DECIMAL(15,2),
    "totalValue" DECIMAL(15,2) NOT NULL,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ProjectBudget_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ProjectBudget_companyId_idx" ON "ProjectBudget"("companyId");

-- CreateIndex
CREATE INDEX "ProjectBudget_projectId_idx" ON "ProjectBudget"("projectId");

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ProjectBudget" ADD CONSTRAINT "ProjectBudget_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateEnum
CREATE TYPE "SaleStatus" AS ENUM ('NEW', 'PROPOSAL', 'WON', 'LOST');

-- CreateEnum
CREATE TYPE "SignatureType" AS ENUM ('DRAWN', 'UPLOAD');

-- CreateEnum
CREATE TYPE "ChecklistStatus" AS ENUM ('NOT_STARTED', 'IN_PROGRESS', 'DONE');

-- CreateEnum
CREATE TYPE "ChecklistItemStatus" AS ENUM ('PENDING', 'IN_PROGRESS', 'DONE', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ChecklistDepartment" AS ENUM (
  'COMMERCIAL',
  'CONTRACTS',
  'FINANCE',
  'TECHNICAL',
  'OPERATIONS'
);

-- CreateTable
CREATE TABLE "Sale" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "customerId" UUID NOT NULL,
    "status" "SaleStatus" NOT NULL DEFAULT 'NEW',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "Sale_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "Contract" ADD COLUMN     "saleId" UUID,
ADD COLUMN     "contractNumber" TEXT,
ADD COLUMN     "signedName" TEXT,
ADD COLUMN     "signedDocument" TEXT,
ADD COLUMN     "signedIp" TEXT,
ADD COLUMN     "signedUserAgent" TEXT,
ADD COLUMN     "signatureType" "SignatureType",
ADD COLUMN     "signatureImageUrl" TEXT,
ADD COLUMN     "contractPdfUrl" TEXT;

-- CreateTable
CREATE TABLE "ImplementationChecklistTemplate" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "name" TEXT NOT NULL,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ImplementationChecklistTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImplementationChecklistTemplateItem" (
    "id" UUID NOT NULL,
    "templateId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" "ChecklistDepartment" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "defaultDueDays" INTEGER NOT NULL DEFAULT 2,
    "orderIndex" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ImplementationChecklistTemplateItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImplementationChecklist" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "saleId" UUID NOT NULL,
    "contractId" UUID NOT NULL,
    "status" "ChecklistStatus" NOT NULL DEFAULT 'NOT_STARTED',
    "startedAt" TIMESTAMP(3),
    "finishedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ImplementationChecklist_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImplementationChecklistItem" (
    "id" UUID NOT NULL,
    "checklistId" UUID NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "department" "ChecklistDepartment" NOT NULL,
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "ChecklistItemStatus" NOT NULL DEFAULT 'PENDING',
    "dueDate" TIMESTAMP(3),
    "assigneeUserId" UUID,
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdById" UUID,
    "updatedById" UUID,

    CONSTRAINT "ImplementationChecklistItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ImplementationItemEvidence" (
    "id" UUID NOT NULL,
    "checklistItemId" UUID NOT NULL,
    "fileUrl" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,

    CONSTRAINT "ImplementationItemEvidence_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Sale_companyId_idx" ON "Sale"("companyId");

-- CreateIndex
CREATE INDEX "Sale_customerId_idx" ON "Sale"("customerId");

-- CreateIndex
CREATE INDEX "Contract_saleId_idx" ON "Contract"("saleId");

-- CreateIndex
CREATE INDEX "ImplementationChecklistTemplate_companyId_idx" ON "ImplementationChecklistTemplate"("companyId");

-- CreateIndex
CREATE INDEX "ImplementationChecklistTemplateItem_templateId_idx" ON "ImplementationChecklistTemplateItem"("templateId");

-- CreateIndex
CREATE INDEX "ImplementationChecklist_companyId_idx" ON "ImplementationChecklist"("companyId");

-- CreateIndex
CREATE INDEX "ImplementationChecklist_saleId_idx" ON "ImplementationChecklist"("saleId");

-- CreateIndex
CREATE INDEX "ImplementationChecklist_contractId_idx" ON "ImplementationChecklist"("contractId");

-- CreateIndex
CREATE INDEX "ImplementationChecklistItem_checklistId_idx" ON "ImplementationChecklistItem"("checklistId");

-- CreateIndex
CREATE INDEX "ImplementationChecklistItem_assigneeUserId_idx" ON "ImplementationChecklistItem"("assigneeUserId");

-- CreateIndex
CREATE INDEX "ImplementationChecklistItem_status_idx" ON "ImplementationChecklistItem"("status");

-- CreateIndex
CREATE INDEX "ImplementationItemEvidence_checklistItemId_idx" ON "ImplementationItemEvidence"("checklistItemId");

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Sale" ADD CONSTRAINT "Sale_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contract" ADD CONSTRAINT "Contract_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklistTemplate" ADD CONSTRAINT "ImplementationChecklistTemplate_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklistTemplateItem" ADD CONSTRAINT "ImplementationChecklistTemplateItem_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "ImplementationChecklistTemplate"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklist" ADD CONSTRAINT "ImplementationChecklist_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklist" ADD CONSTRAINT "ImplementationChecklist_saleId_fkey" FOREIGN KEY ("saleId") REFERENCES "Sale"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklist" ADD CONSTRAINT "ImplementationChecklist_contractId_fkey" FOREIGN KEY ("contractId") REFERENCES "Contract"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklistItem" ADD CONSTRAINT "ImplementationChecklistItem_checklistId_fkey" FOREIGN KEY ("checklistId") REFERENCES "ImplementationChecklist"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationChecklistItem" ADD CONSTRAINT "ImplementationChecklistItem_assigneeUserId_fkey" FOREIGN KEY ("assigneeUserId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ImplementationItemEvidence" ADD CONSTRAINT "ImplementationItemEvidence_checklistItemId_fkey" FOREIGN KEY ("checklistItemId") REFERENCES "ImplementationChecklistItem"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Remove projectId from ProjectBudget: orçamento não tem projeto atrelado; projeto é sempre criado a partir do orçamento no fechamento.
-- DropForeignKey
ALTER TABLE "ProjectBudget" DROP CONSTRAINT IF EXISTS "ProjectBudget_projectId_fkey";

-- DropIndex
DROP INDEX IF EXISTS "ProjectBudget_projectId_idx";

-- AlterTable
ALTER TABLE "ProjectBudget" DROP COLUMN IF EXISTS "projectId";

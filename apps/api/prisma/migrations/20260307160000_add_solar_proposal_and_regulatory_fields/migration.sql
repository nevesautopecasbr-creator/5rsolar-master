-- AlterTable
ALTER TABLE "ProjectBudget" ADD COLUMN     "monthlySavings" DECIMAL(15,2),
ADD COLUMN     "paybackYears" DECIMAL(10,2),
ADD COLUMN     "paymentTerms" TEXT,
ADD COLUMN     "fioBPct" DECIMAL(10,6),
ADD COLUMN     "simultaneityFactor" DECIMAL(10,6),
ADD COLUMN     "consumerGroup" TEXT,
ADD COLUMN     "modality" TEXT;

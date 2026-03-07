-- AlterTable
ALTER TABLE "ProjectBudget" ADD COLUMN     "consumerUnitCode" TEXT,
ADD COLUMN     "consumptionKwh" DECIMAL(15,2),
ADD COLUMN     "systemPowerKwp" DECIMAL(15,2);

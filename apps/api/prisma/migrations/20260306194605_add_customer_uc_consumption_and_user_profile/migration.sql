-- CreateEnum
CREATE TYPE "UserProfile" AS ENUM ('VENDEDOR_EXTERNO', 'TRAFEGO_PAGO', 'DIRETOR', 'ADMIN');

-- AlterTable
ALTER TABLE "Customer" ADD COLUMN     "consumerUnitCode" TEXT,
ADD COLUMN     "currentConsumptionKwh" DECIMAL(15,2);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "profile" "UserProfile";

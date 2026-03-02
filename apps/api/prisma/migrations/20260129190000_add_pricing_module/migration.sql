-- CreateEnum
CREATE TYPE "PricingItemType" AS ENUM ('PROJECT', 'KIT', 'CREDIT', 'SERVICE');

-- CreateTable
CREATE TABLE "PricingSettings" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "desiredProfitPct" DECIMAL(10,6) NOT NULL DEFAULT 0.2,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingSettings_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "FixedExpense" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "description" TEXT NOT NULL,
    "monthlyValue" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FixedExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "VariableExpense" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "description" TEXT NOT NULL,
    "pct" DECIMAL(10,6) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "VariableExpense_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RevenueBaseMonthly" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "year" INTEGER NOT NULL,
    "month" INTEGER NOT NULL,
    "revenueValue" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RevenueBaseMonthly_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "PricingItem" (
    "id" UUID NOT NULL,
    "companyId" UUID,
    "type" "PricingItemType" NOT NULL,
    "name" TEXT NOT NULL,
    "costValue" DECIMAL(15,2) NOT NULL,
    "currentPrice" DECIMAL(15,2) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PricingItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PricingSettings_companyId_key" ON "PricingSettings"("companyId");

-- CreateIndex
CREATE INDEX "PricingSettings_companyId_idx" ON "PricingSettings"("companyId");

-- CreateIndex
CREATE INDEX "FixedExpense_companyId_idx" ON "FixedExpense"("companyId");

-- CreateIndex
CREATE INDEX "VariableExpense_companyId_idx" ON "VariableExpense"("companyId");

-- CreateIndex
CREATE UNIQUE INDEX "RevenueBaseMonthly_companyId_year_month_key" ON "RevenueBaseMonthly"("companyId", "year", "month");

-- CreateIndex
CREATE INDEX "RevenueBaseMonthly_companyId_idx" ON "RevenueBaseMonthly"("companyId");

-- CreateIndex
CREATE INDEX "RevenueBaseMonthly_year_idx" ON "RevenueBaseMonthly"("year");

-- CreateIndex
CREATE INDEX "PricingItem_companyId_idx" ON "PricingItem"("companyId");

-- CreateIndex
CREATE INDEX "PricingItem_type_idx" ON "PricingItem"("type");

-- AddForeignKey
ALTER TABLE "PricingSettings" ADD CONSTRAINT "PricingSettings_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FixedExpense" ADD CONSTRAINT "FixedExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "VariableExpense" ADD CONSTRAINT "VariableExpense_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RevenueBaseMonthly" ADD CONSTRAINT "RevenueBaseMonthly_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PricingItem" ADD CONSTRAINT "PricingItem_companyId_fkey" FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

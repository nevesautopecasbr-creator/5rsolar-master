-- CreateTable
CREATE TABLE "ConsumerUnit" (
    "id" UUID NOT NULL,
    "customerId" UUID NOT NULL,
    "consumerUnitCode" TEXT NOT NULL,
    "currentConsumptionKwh" DECIMAL(15,2),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ConsumerUnit_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ConsumerUnit_customerId_idx" ON "ConsumerUnit"("customerId");

-- AddForeignKey
ALTER TABLE "ConsumerUnit" ADD CONSTRAINT "ConsumerUnit_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- Create enum for unified templates
CREATE TYPE "DocumentTemplateType" AS ENUM ('CONTRACT', 'PROPOSAL');

-- Create unified templates table
CREATE TABLE "DocumentTemplate" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "companyId" UUID,
    "name" TEXT NOT NULL,
    "type" "DocumentTemplateType" NOT NULL,
    "content" TEXT NOT NULL,
    "version" INTEGER NOT NULL DEFAULT 1,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isDefault" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdById" UUID,
    "updatedById" UUID,
    CONSTRAINT "DocumentTemplate_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "DocumentTemplate_companyId_idx" ON "DocumentTemplate"("companyId");
CREATE INDEX "DocumentTemplate_type_idx" ON "DocumentTemplate"("type");
CREATE INDEX "DocumentTemplate_companyId_type_isActive_idx" ON "DocumentTemplate"("companyId", "type", "isActive");

ALTER TABLE "DocumentTemplate"
ADD CONSTRAINT "DocumentTemplate_companyId_fkey"
FOREIGN KEY ("companyId") REFERENCES "Company"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- Seed CONTRACT templates from existing ContractTemplate table
INSERT INTO "DocumentTemplate" (
  "id",
  "companyId",
  "name",
  "type",
  "content",
  "version",
  "isActive",
  "isDefault",
  "createdAt",
  "updatedAt",
  "createdById",
  "updatedById"
)
SELECT
  gen_random_uuid(),
  ct."companyId",
  ct."name",
  'CONTRACT'::"DocumentTemplateType",
  ct."content",
  ct."version",
  ct."isActive",
  false,
  ct."createdAt",
  ct."updatedAt",
  ct."createdById",
  ct."updatedById"
FROM "ContractTemplate" ct;

-- Ensure each company has at least one PROPOSAL template
INSERT INTO "DocumentTemplate" (
  "id",
  "companyId",
  "name",
  "type",
  "content",
  "version",
  "isActive",
  "isDefault",
  "createdAt",
  "updatedAt"
)
SELECT
  gen_random_uuid(),
  c."id",
  'Proposta padrão',
  'PROPOSAL'::"DocumentTemplateType",
  '<h1>Proposta Comercial</h1><p><strong>Cliente:</strong> {{customerName}}</p><p><strong>UC:</strong> {{consumerUnitCode}}</p><p><strong>Consumo:</strong> {{consumptionKwh}}</p><p><strong>Potência do sistema:</strong> {{systemPowerKwp}}</p><p><strong>Economia mensal:</strong> {{monthlySavings}}</p><p><strong>Payback:</strong> {{paybackYears}}</p><p><strong>Condições de pagamento:</strong> {{paymentTerms}}</p><p><strong>Valor total:</strong> {{totalValue}}</p><p><strong>Observações:</strong> {{notes}}</p>',
  1,
  true,
  true,
  CURRENT_TIMESTAMP,
  CURRENT_TIMESTAMP
FROM "Company" c
WHERE NOT EXISTS (
  SELECT 1
  FROM "DocumentTemplate" dt
  WHERE dt."companyId" = c."id"
    AND dt."type" = 'PROPOSAL'::"DocumentTemplateType"
);

-- DropForeignKey
ALTER TABLE IF EXISTS "ImplementationChecklistItem"
  DROP CONSTRAINT IF EXISTS "ImplementationChecklistItem_checklistId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "ImplementationChecklistTemplateItem"
  DROP CONSTRAINT IF EXISTS "ImplementationChecklistTemplateItem_templateId_fkey";

-- DropForeignKey
ALTER TABLE IF EXISTS "ImplementationItemEvidence"
  DROP CONSTRAINT IF EXISTS "ImplementationItemEvidence_checklistItemId_fkey";

-- AddForeignKey
ALTER TABLE IF EXISTS "ImplementationChecklistTemplateItem"
  ADD CONSTRAINT "ImplementationChecklistTemplateItem_templateId_fkey"
  FOREIGN KEY ("templateId") REFERENCES "ImplementationChecklistTemplate"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ImplementationChecklistItem"
  ADD CONSTRAINT "ImplementationChecklistItem_checklistId_fkey"
  FOREIGN KEY ("checklistId") REFERENCES "ImplementationChecklist"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE IF EXISTS "ImplementationItemEvidence"
  ADD CONSTRAINT "ImplementationItemEvidence_checklistItemId_fkey"
  FOREIGN KEY ("checklistItemId") REFERENCES "ImplementationChecklistItem"("id")
  ON DELETE RESTRICT ON UPDATE CASCADE;

# Integration Notes — Assinatura + Checklist

## Inventário do schema
- Tabelas existentes:
  - `Contract` (relaciona com `Project` e `Customer`)
  - `ContractTemplate`
  - `AuditLog`
- Enum existente:
  - `ContractStatus` (DRAFT/ACTIVE/SUSPENDED/COMPLETED/CANCELLED)

## Campos adicionados em Contract
- `saleId`
- `contractNumber`
- `signedName`
- `signedDocument`
- `signedIp`
- `signedUserAgent`
- `signatureType`
- `signatureImageUrl`
- `contractPdfUrl`

## Novas tabelas
- `Sale`
- `ImplementationChecklistTemplate`
- `ImplementationChecklistTemplateItem`
- `ImplementationChecklist`
- `ImplementationChecklistItem`
- `ImplementationItemEvidence`

## Mapeamentos
- Não existia `sales/deals`: foi criada tabela `Sale` mínima.
- `SIGNED` foi mapeado para `Contract.status = ACTIVE`.
- `ContractTemplate.content` reutilizado como template HTML do contrato.


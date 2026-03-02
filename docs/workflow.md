# Workflow e aprovacoes

## Visao geral
O modulo de workflow centraliza as transicoes de status para Sale, Contract e
ImplementationChecklist. Todas as mutacoes usam version (optimistic locking) e
registram auditoria via AuditLog.

## Multi-tenant
Todas as rotas exigem o header `x-company-id`. As consultas filtram por
companyId quando presente.

## Transicoes suportadas

### SALE (SaleStatus)
- SALE_SET_PROPOSAL: NEW -> PROPOSAL
- SALE_MARK_WON: PROPOSAL -> WON
- SALE_MARK_LOST: NEW|PROPOSAL -> LOST (motivo obrigatorio)
  - Cancelamento de venda: usar `SALE_MARK_LOST` com `payload.reasonType=CANCELLED`

### CONTRACT (ContractStatus)
- CONTRACT_REQUEST_SIGNATURE: DRAFT -> DRAFT (nao muda status, atualiza sentAt)
- CONTRACT_ACTIVATE: DRAFT -> ACTIVE (requer signedAt)
- CONTRACT_SUSPEND: ACTIVE -> SUSPENDED (motivo obrigatorio, requer aprovacao)
- CONTRACT_RESUME: SUSPENDED -> ACTIVE (motivo obrigatorio)
- CONTRACT_COMPLETE: ACTIVE -> COMPLETED
- CONTRACT_CANCEL: DRAFT|ACTIVE|SUSPENDED -> CANCELLED (motivo obrigatorio)
  - Requer aprovacao quando o status atual e ACTIVE ou SUSPENDED

### CHECKLIST (ChecklistStatus)
- CHECKLIST_START: NOT_STARTED -> IN_PROGRESS (contrato precisa estar ACTIVE)
- CHECKLIST_FINISH: IN_PROGRESS -> DONE (itens obrigatorios DONE)
  - Se nao houver itens, a validacao permite finalizar

## Checklist bloqueado
Quando um contrato e cancelado, o checklist relacionado recebe:
- blockedAt: timestamp de bloqueio
- blockedReason: motivo

Se blockedAt != null, o endpoint de allowed-actions retorna lista vazia e a UI
exibe o status "BLOQUEADO".

## Aprovações
As acoes abaixo exigem aprovacao:
- CONTRACT_SUSPEND
- CONTRACT_CANCEL (quando o contrato esta ACTIVE ou SUSPENDED)

Fluxo:
1) `POST /workflow/.../transition` cria ApprovalRequest PENDING e retorna 202.
2) `POST /approvals/:id/decide` com APPROVE aplica a transicao e registra auditoria.
3) REJECT apenas marca a solicitacao como rejeitada.

## Optimistic locking
Todos os updates enviados pelo frontend devem incluir `version`.
O backend atualiza usando:
`where: { id, companyId, version }` e incrementa `version + 1`.
Se nenhuma linha for afetada, retorna 409 Conflict.

## Auditoria
O endpoint `GET /audit?entityType&entityId` retorna logs recentes por entidade.
As transicoes registram `fromStatus`, `toStatus`, `reason` e `reasonType` quando aplicavel.

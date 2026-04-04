import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCashMovementDto } from "./dto/create-cash-movement.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class CashMovementsService {
  private readonly logger = new Logger(CashMovementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    try {
      const list = await this.prisma.cashMovement.findMany({
        where: companyId ? { companyId } : undefined,
        orderBy: { movementDate: "desc" },
      });
      // Normaliza Decimal para número para evitar falhas na serialização JSON.
      return list.map((m) => ({ ...m, amount: Number(m.amount) }));
    } catch (error) {
      this.logger.error(
        `Erro ao listar movimentações de caixa (companyId=${companyId ?? "-"})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }
  }

  async findOne(id: string, companyId?: string) {
    const movement = await this.prisma.cashMovement.findFirst({
      where: companyId ? { id, companyId } : { id },
    });
    if (!movement) {
      throw new NotFoundException("Movimentação não encontrada");
    }
    return movement;
  }

  async create(
    companyId: string | undefined,
    dto: CreateCashMovementDto,
    actorId?: string,
  ) {
    let created;
    try {
      created = await this.prisma.cashMovement.create({
        data: {
          companyId,
          cashAccountId: dto.cashAccountId,
          projectId: dto.projectId,
          accountId: dto.accountId,
          payableId: dto.payableId,
          receivableId: dto.receivableId,
          direction: dto.direction,
          amount: dto.amount,
          movementDate: dto.movementDate ? new Date(dto.movementDate) : undefined,
          description: dto.description,
          createdById: actorId,
        },
      });
    } catch (error) {
      this.logger.error(
        `Erro ao criar movimentação de caixa (companyId=${companyId ?? "-"} cashAccountId=${dto.cashAccountId})`,
        error instanceof Error ? error.stack : String(error),
      );
      throw error;
    }

    await this.audit.log({
      actorId,
      companyId,
      entityName: "CashMovement",
      entityId: created.id,
      action: "CREATE",
      payload: { amount: created.amount },
    });

    return { ...created, amount: Number(created.amount) };
  }
}

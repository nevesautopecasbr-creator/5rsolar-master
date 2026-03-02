import { Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { CreateCashMovementDto } from "./dto/create-cash-movement.dto";
import { AuditService } from "../iam/audit.service";

@Injectable()
export class CashMovementsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  async findAll(companyId?: string) {
    return this.prisma.cashMovement.findMany({
      where: companyId ? { companyId } : undefined,
    });
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
    const created = await this.prisma.cashMovement.create({
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

    await this.audit.log({
      actorId,
      companyId,
      entityName: "CashMovement",
      entityId: created.id,
      action: "CREATE",
      payload: { amount: created.amount },
    });

    return created;
  }
}
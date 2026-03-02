import { Inject, Injectable, NotFoundException } from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import {
  ChargeRequest,
  ChargeResponse,
  PAYMENT_PROVIDER,
  PaymentProvider,
} from "./providers/payment-provider";

@Injectable()
export class ChargesService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    @Inject(PAYMENT_PROVIDER) private readonly provider: PaymentProvider,
  ) {}

  async createCharge(
    companyId: string | undefined,
    input: ChargeRequest,
    actorId?: string,
  ): Promise<ChargeResponse> {
    const receivable = await this.prisma.receivable.findUnique({
      where: { id: input.receivableId },
    });
    if (!receivable) {
      throw new NotFoundException("Recebível não encontrado");
    }

    const charge = await this.provider.createCharge(input);
    await this.audit.log({
      actorId,
      companyId: companyId ?? receivable.companyId ?? undefined,
      entityName: "Receivable",
      entityId: receivable.id,
      action: "CREATE_CHARGE",
      payload: { provider: charge.provider, reference: charge.reference },
    });

    return charge;
  }
}

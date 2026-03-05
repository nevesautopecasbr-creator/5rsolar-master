import {
  BadRequestException,
  Injectable,
  Logger,
} from "@nestjs/common";
import { PrismaService } from "../../prisma/prisma.service";
import { AuditService } from "../iam/audit.service";
import { PostProposalService } from "../post-proposal/post-proposal.service";
import { MondayWebhookPayloadDto } from "./dto/monday-webhook.dto";

const MONDAY_DEFAULT_COMPANY_ID = "MONDAY_DEFAULT_COMPANY_ID";

@Injectable()
export class MondayService {
  private readonly logger = new Logger(MondayService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
    private readonly postProposal: PostProposalService,
  ) {}

  /**
   * Resolve companyId para integração Monday (env ou primeira empresa).
   */
  private async resolveCompanyId(): Promise<string> {
    const fromEnv = process.env[MONDAY_DEFAULT_COMPANY_ID];
    if (fromEnv) return fromEnv;
    const first = await this.prisma.company.findFirst({
      select: { id: true },
      orderBy: { createdAt: "asc" },
    });
    if (!first) {
      throw new BadRequestException(
        "Nenhuma empresa cadastrada. Configure MONDAY_DEFAULT_COMPANY_ID ou crie uma empresa.",
      );
    }
    return first.id;
  }

  /**
   * Encontra ou cria o cliente a partir dos dados do lead.
   */
  private async findOrCreateCustomer(
    companyId: string,
    payload: MondayWebhookPayloadDto,
  ): Promise<{ id: string }> {
    const name = payload.leadName?.trim() || payload.company?.trim() || "Lead sem nome";
    const email = payload.email?.trim();
    const phone = payload.phone?.trim();

    if (email) {
      const existing = await this.prisma.customer.findFirst({
        where: { companyId, email },
        select: { id: true },
      });
      if (existing) return existing;
    }

    const created = await this.prisma.customer.create({
      data: {
        companyId,
        name,
        email: email || undefined,
        phone: phone || undefined,
      },
      select: { id: true },
    });

    await this.audit.log({
      companyId,
      entityName: "Customer",
      entityId: created.id,
      action: "CREATE",
      payload: { name, source: "monday" },
    });

    return created;
  }

  /**
   * Fluxo completo: lead → projeto → proposta → notificação (Módulo 00 + Módulo 01).
   */
  async processLeadFromWebhook(payload: MondayWebhookPayloadDto): Promise<{
    projectId: string;
    saleId: string;
    contractId?: string;
    alreadyExisted?: boolean;
  }> {
    const companyId = await this.resolveCompanyId();

    if (payload.mondayId) {
      const existingProject = await this.prisma.project.findUnique({
        where: { mondayId: payload.mondayId },
        select: { id: true, customerId: true },
      });
      if (existingProject) {
        this.logger.log(
          `Projeto já existe para mondayId=${payload.mondayId}, ignorando duplicata.`,
        );
        const sale = existingProject.customerId
          ? await this.prisma.sale.findFirst({
              where: {
                customerId: existingProject.customerId,
                companyId,
              },
              select: { id: true },
            })
          : null;
        const contract = sale
          ? await this.prisma.contract.findFirst({
              where: { saleId: sale.id, companyId },
              select: { id: true },
            })
          : null;
        return {
          projectId: existingProject.id,
          saleId: sale?.id ?? "",
          contractId: contract?.id,
          alreadyExisted: true,
        };
      }
    }

    const customer = await this.findOrCreateCustomer(companyId, payload);

    const projectName =
      payload.leadName?.trim() || payload.company?.trim() || "Projeto lead";
    const project = await this.prisma.project.create({
      data: {
        companyId,
        name: projectName,
        description: payload.qualificationNotes
          ? `Qualificação: ${payload.qualificationNotes}`
          : undefined,
        customerId: customer.id,
        mondayId: payload.mondayId ?? undefined,
        qualificationNotes: payload.qualificationNotes ?? undefined,
      },
      select: { id: true },
    });

    await this.audit.log({
      companyId,
      entityName: "Project",
      entityId: project.id,
      action: "CREATE",
      payload: { name: projectName, source: "monday", mondayId: payload.mondayId },
    });

    const sale = await this.prisma.sale.create({
      data: {
        companyId,
        customerId: customer.id,
        status: "NEW",
      },
      select: { id: true },
    });

    await this.audit.log({
      companyId,
      entityName: "Sale",
      entityId: sale.id,
      action: "CREATE",
      payload: { source: "monday", projectId: project.id },
    });

    let contractId: string | undefined;
    try {
      const contract = await this.postProposal.createContractFromTemplate(
        sale.id,
        companyId,
        undefined,
      );
      contractId = contract?.id;
    } catch (err) {
      this.logger.warn(
        `Proposta (Módulo 01) não gerada para saleId=${sale.id}: ${err instanceof Error ? err.message : String(err)}`,
      );
    }

    this.notifyTeam(companyId, {
      projectId: project.id,
      saleId: sale.id,
      leadName: payload.leadName,
      company: payload.company,
      funnelStage: payload.funnelStage,
      commercialResponsible: payload.commercialResponsible,
    });

    return {
      projectId: project.id,
      saleId: sale.id,
      contractId,
    };
  }

  private notifyTeam(
    companyId: string,
    data: {
      projectId: string;
      saleId: string;
      leadName?: string;
      company?: string;
      funnelStage?: string;
      commercialResponsible?: string;
    },
  ) {
    this.logger.log(
      `[Módulo 00] Novo lead processado: projectId=${data.projectId} saleId=${data.saleId} lead=${data.leadName} empresa=${data.company} estágio=${data.funnelStage} responsável=${data.commercialResponsible}`,
    );
    // TODO: enviar e-mail ou webhook (Slack/Teams) se configurado
  }
}

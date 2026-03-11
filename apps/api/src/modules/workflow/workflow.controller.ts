import {
  BadRequestException,
  Body,
  Controller,
  Get,
  HttpStatus,
  Inject,
  Param,
  Post,
  Res,
  UseGuards,
  forwardRef,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { Response } from "express";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { TransitionDto } from "./dto/transition.dto";
import { WorkflowEngineService } from "./workflow.service";
import { WorkflowPermissionsService } from "./workflow-permissions.service";
import { PostProposalService } from "../post-proposal/post-proposal.service";

type EntityType = "SALE" | "CONTRACT" | "CHECKLIST";

@ApiTags("Workflow")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("workflow")
export class WorkflowController {
  constructor(
    private readonly workflow: WorkflowEngineService,
    private readonly permissions: WorkflowPermissionsService,
    @Inject(forwardRef(() => PostProposalService))
    private readonly postProposal: PostProposalService,
  ) {}

  @Get(":entityType/:entityId/allowed-actions")
  async allowedActions(
    @Param("entityType") entityTypeRaw: string,
    @Param("entityId") entityId: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user?: { sub: string },
  ) {
    const entityType = this.parseEntityType(entityTypeRaw);
    await this.permissions.ensurePermission(
      user?.sub,
      companyId,
      this.getReadPermission(entityType),
    );
    return this.workflow.getAllowedActions(entityType, entityId, companyId);
  }

  @Post(":entityType/:entityId/transition")
  async transition(
    @Param("entityType") entityTypeRaw: string,
    @Param("entityId") entityId: string,
    @Body() dto: TransitionDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user?: { sub: string },
    @Res({ passthrough: true }) res?: Response,
  ) {
    const entityType = this.parseEntityType(entityTypeRaw);
    await this.permissions.ensurePermission(
      user?.sub,
      companyId,
      this.getWritePermission(entityType),
    );
    const result = await this.workflow.transition({
      entityType,
      entityId,
      action: dto.action,
      reason: dto.reason,
      payload: dto.payload,
      version: dto.version,
      actorId: user?.sub,
      companyId,
    });

    if (result.type === "PENDING") {
      res?.status(HttpStatus.ACCEPTED);
      return { approvalRequestId: result.approvalRequestId };
    }

    // Após fechamento/aceite do orçamento (SALE_MARK_WON com budgetId), dispara emissão dos PDFs
    if (
      entityType === "SALE" &&
      dto.action === "SALE_MARK_WON" &&
      (dto.payload?.budgetId ?? dto.payload?.projectBudgetId)
    ) {
      const sale = result.entity as { id: string };
      this.postProposal.generateClosingContractPdfs(sale.id, companyId).catch(() => {
        // Não falha a resposta; PDFs podem ser gerados depois
      });
    }

    return result.entity;
  }

  private parseEntityType(raw: string): EntityType {
    const upper = raw.toUpperCase();
    if (upper === "SALE" || upper === "CONTRACT" || upper === "CHECKLIST") {
      return upper as EntityType;
    }
    throw new BadRequestException("Tipo de entidade inválido.");
  }

  private getReadPermission(entityType: EntityType) {
    if (entityType === "CHECKLIST") {
      return ["obras.read"];
    }
    return ["contratos.read"];
  }

  private getWritePermission(entityType: EntityType) {
    if (entityType === "CHECKLIST") {
      return ["obras.write"];
    }
    return ["contratos.write"];
  }
}

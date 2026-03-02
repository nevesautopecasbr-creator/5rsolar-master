import {
  Body,
  Controller,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
  Req,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PostProposalService } from "./post-proposal.service";
import { SignContractDto } from "./dto/sign-contract.dto";
import { UpdateContractDto } from "./dto/create-contract.dto";

@ApiTags("Pós-proposta")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller()
export class PostProposalController {
  constructor(private readonly service: PostProposalService) {}

  @Get("sales/:saleId/contract")
  @Permissions("contratos.read")
  getSaleContract(@Param("saleId") saleId: string, @CompanyId() companyId?: string) {
    return this.service.getContractBySale(saleId, companyId);
  }

  @Get("sales/:saleId")
  @Permissions("contratos.read")
  getSaleById(@Param("saleId") saleId: string, @CompanyId() companyId?: string) {
    return this.service.getSaleById(saleId, companyId);
  }

  @Post("sales/:saleId/contract/create-from-template")
  @Permissions("contratos.write")
  createContractFromTemplate(
    @Param("saleId") saleId: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.createContractFromTemplate(saleId, companyId, user?.sub);
  }

  @Put("contracts/:contractId")
  @Permissions("contratos.write")
  updateContract(
    @Param("contractId") contractId: string,
    @Body() body: UpdateContractDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.updateContract(contractId, body, companyId, user?.sub);
  }

  @Post("contracts/:contractId/sign")
  @Permissions("contratos.write")
  signContract(
    @Param("contractId") contractId: string,
    @Body() dto: SignContractDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
    @Req() req: { ip?: string; headers?: Record<string, string> },
  ) {
    return this.service.signContract(
      contractId,
      {
        ...dto,
        signedUserAgent: req.headers?.["user-agent"],
        signedIp: req.ip,
      },
      companyId,
      user?.sub,
    );
  }

  @Get("contracts/:contractId/pdf")
  @Permissions("contratos.read")
  getContractPdf(
    @Param("contractId") contractId: string,
    @CompanyId() companyId?: string,
  ) {
    return this.service.getContractPdf(contractId, companyId);
  }

  @Get("sales/:saleId/checklist")
  @Permissions("obras.read")
  getChecklist(@Param("saleId") saleId: string, @CompanyId() companyId?: string) {
    return this.service.getChecklistBySale(saleId, companyId);
  }

  @Get("checklists/:checklistId/items")
  @Permissions("obras.read")
  getChecklistItems(
    @Param("checklistId") checklistId: string,
    @CompanyId() companyId?: string,
  ) {
    return this.service.getChecklistItems(checklistId, companyId);
  }

  @Put("checklists/:checklistId/start")
  @Permissions("obras.write")
  startChecklist(
    @Param("checklistId") checklistId: string,
    @Body() body: { version: number },
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.startChecklist(checklistId, body.version, companyId, user?.sub);
  }

  @Put("checklist-items/:itemId/status")
  @Permissions("obras.write")
  updateItemStatus(
    @Param("itemId") itemId: string,
    @Body() body: { status: "PENDING" | "IN_PROGRESS" | "DONE" | "BLOCKED"; notes?: string },
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.updateChecklistItemStatus(itemId, body, companyId, user?.sub);
  }

  @Put("checklist-items/:itemId/assign")
  @Permissions("obras.write")
  assignItem(
    @Param("itemId") itemId: string,
    @Body() body: { assigneeUserId: string | null },
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.assignChecklistItem(
      itemId,
      body.assigneeUserId,
      companyId,
      user?.sub,
    );
  }

  @Post("checklist-items/:itemId/evidence")
  @Permissions("obras.write")
  addEvidence(
    @Param("itemId") itemId: string,
    @Body() body: { fileBase64: string; fileName: string },
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.addEvidence(itemId, body, companyId, user?.sub);
  }

  @Put("checklists/:checklistId/finish")
  @Permissions("obras.write")
  finishChecklist(
    @Param("checklistId") checklistId: string,
    @Body() body: { version: number },
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.finishChecklist(checklistId, body.version, companyId, user?.sub);
  }
}

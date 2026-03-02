import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { IamModule } from "../iam/iam.module";
import { WorkflowController } from "./workflow.controller";
import { WorkflowEngineService } from "./workflow.service";
import { WorkflowPermissionsService } from "./workflow-permissions.service";
import { ApprovalsController } from "./approvals.controller";
import { ApprovalsService } from "./approvals.service";
import { WorkflowAuditController } from "./workflow-audit.controller";

@Module({
  imports: [PrismaModule, IamModule],
  controllers: [WorkflowController, ApprovalsController, WorkflowAuditController],
  providers: [WorkflowEngineService, WorkflowPermissionsService, ApprovalsService],
  exports: [WorkflowEngineService],
})
export class WorkflowModule {}

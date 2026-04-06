import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { IamModule } from "../iam/iam.module";
import { PostProposalController } from "./post-proposal.controller";
import { PostProposalService } from "./post-proposal.service";
import { FileService } from "./storage/file.service";
import { WorkflowModule } from "../workflow/workflow.module";
import { DocumentTemplatesModule } from "../document-templates/document-templates.module";
import { CommonModule } from "../common/common.module";

@Module({
  imports: [PrismaModule, IamModule, WorkflowModule, DocumentTemplatesModule, CommonModule],
  controllers: [PostProposalController],
  providers: [PostProposalService, FileService],
  exports: [PostProposalService, FileService],
})
export class PostProposalModule {}

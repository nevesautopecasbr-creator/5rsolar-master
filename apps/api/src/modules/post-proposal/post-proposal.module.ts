import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { IamModule } from "../iam/iam.module";
import { PostProposalController } from "./post-proposal.controller";
import { PostProposalService } from "./post-proposal.service";
import { FileService } from "./storage/file.service";
import { WorkflowModule } from "../workflow/workflow.module";

@Module({
  imports: [PrismaModule, IamModule, WorkflowModule],
  controllers: [PostProposalController],
  providers: [PostProposalService, FileService],
})
export class PostProposalModule {}

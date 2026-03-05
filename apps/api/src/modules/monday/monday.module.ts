import { Module } from "@nestjs/common";
import { PrismaModule } from "../../prisma/prisma.module";
import { IamModule } from "../iam/iam.module";
import { PostProposalModule } from "../post-proposal/post-proposal.module";
import { MondayController } from "./monday.controller";
import { MondayLeadsController } from "./monday-leads.controller";
import { MondayService } from "./monday.service";

@Module({
  imports: [PrismaModule, IamModule, PostProposalModule],
  controllers: [MondayController, MondayLeadsController],
  providers: [MondayService],
})
export class MondayModule {}

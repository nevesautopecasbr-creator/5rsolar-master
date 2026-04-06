import { Module } from "@nestjs/common";
import { ContractsController } from "./contracts.controller";
import { TemplatesController } from "./templates.controller";
import { ContractAddendaController } from "./addenda.controller";
import { ContractsService } from "./contracts.service";
import { TemplatesService } from "./templates.service";
import { ContractAddendaService } from "./addenda.service";
import { PostProposalModule } from "../post-proposal/post-proposal.module";

@Module({
  imports: [PostProposalModule],
  controllers: [ContractsController, TemplatesController, ContractAddendaController],
  providers: [ContractsService, TemplatesService, ContractAddendaService],
})
export class ContractsModule {}

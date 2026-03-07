import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectBudgetsController } from "./project-budgets.controller";
import { ProjectBudgetsService } from "./project-budgets.service";
import { PostProposalModule } from "../post-proposal/post-proposal.module";

@Module({
  imports: [PostProposalModule],
  controllers: [ProjectsController, ProjectBudgetsController],
  providers: [ProjectsService, ProjectBudgetsService],
})
export class ProjectsModule {}

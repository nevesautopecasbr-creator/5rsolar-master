import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectBudgetsController } from "./project-budgets.controller";
import { ProjectBudgetsService } from "./project-budgets.service";
import { SolarSimulatorController } from "./solar-simulator.controller";
import { SolarSimulatorService } from "./solar-simulator.service";
import { PostProposalModule } from "../post-proposal/post-proposal.module";

@Module({
  imports: [PostProposalModule],
  controllers: [ProjectsController, ProjectBudgetsController, SolarSimulatorController],
  providers: [ProjectsService, ProjectBudgetsService, SolarSimulatorService],
})
export class ProjectsModule {}

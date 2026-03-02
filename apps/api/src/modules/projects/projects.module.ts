import { Module } from "@nestjs/common";
import { ProjectsController } from "./projects.controller";
import { ProjectsService } from "./projects.service";
import { ProjectBudgetsController } from "./project-budgets.controller";
import { ProjectBudgetsService } from "./project-budgets.service";

@Module({
  controllers: [ProjectsController, ProjectBudgetsController],
  providers: [ProjectsService, ProjectBudgetsService],
})
export class ProjectsModule {}

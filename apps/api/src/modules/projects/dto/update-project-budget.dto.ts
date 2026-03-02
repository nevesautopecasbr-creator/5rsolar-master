import { PartialType } from "@nestjs/mapped-types";
import { CreateProjectBudgetDto } from "./create-project-budget.dto";

export class UpdateProjectBudgetDto extends PartialType(CreateProjectBudgetDto) {}

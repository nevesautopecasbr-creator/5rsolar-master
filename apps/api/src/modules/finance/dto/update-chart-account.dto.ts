import { PartialType } from "@nestjs/mapped-types";
import { CreateChartAccountDto } from "./create-chart-account.dto";

export class UpdateChartAccountDto extends PartialType(
  CreateChartAccountDto,
) {}
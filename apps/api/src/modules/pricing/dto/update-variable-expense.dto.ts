import { PartialType } from "@nestjs/mapped-types";
import { CreateVariableExpenseDto } from "./create-variable-expense.dto";

export class UpdateVariableExpenseDto extends PartialType(CreateVariableExpenseDto) {}

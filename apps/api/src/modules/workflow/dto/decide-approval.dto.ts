import { IsEnum, IsOptional, IsString } from "class-validator";

export class DecideApprovalDto {
  @IsEnum(["APPROVE", "REJECT"])
  decision: "APPROVE" | "REJECT";

  @IsOptional()
  @IsString()
  note?: string;
}

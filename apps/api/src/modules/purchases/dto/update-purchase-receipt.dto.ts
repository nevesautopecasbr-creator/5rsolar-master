import { PartialType } from "@nestjs/mapped-types";
import { CreatePurchaseReceiptDto } from "./create-purchase-receipt.dto";

export class UpdatePurchaseReceiptDto extends PartialType(
  CreatePurchaseReceiptDto,
) {}
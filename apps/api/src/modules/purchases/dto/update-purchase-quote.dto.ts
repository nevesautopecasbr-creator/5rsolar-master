import { PartialType } from "@nestjs/mapped-types";
import { CreatePurchaseQuoteDto } from "./create-purchase-quote.dto";

export class UpdatePurchaseQuoteDto extends PartialType(CreatePurchaseQuoteDto) {}
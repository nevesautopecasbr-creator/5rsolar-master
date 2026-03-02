import { PartialType } from "@nestjs/mapped-types";
import { CreatePricingItemDto } from "./create-pricing-item.dto";

export class UpdatePricingItemDto extends PartialType(CreatePricingItemDto) {}

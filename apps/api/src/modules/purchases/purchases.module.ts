import { Module } from "@nestjs/common";
import { PurchaseRequestsController } from "./purchase-requests.controller";
import { PurchaseQuotesController } from "./purchase-quotes.controller";
import { PurchaseOrdersController } from "./purchase-orders.controller";
import { PurchaseReceiptsController } from "./purchase-receipts.controller";
import { PurchaseRequestsService } from "./purchase-requests.service";
import { PurchaseQuotesService } from "./purchase-quotes.service";
import { PurchaseOrdersService } from "./purchase-orders.service";
import { PurchaseReceiptsService } from "./purchase-receipts.service";

@Module({
  controllers: [
    PurchaseRequestsController,
    PurchaseQuotesController,
    PurchaseOrdersController,
    PurchaseReceiptsController,
  ],
  providers: [
    PurchaseRequestsService,
    PurchaseQuotesService,
    PurchaseOrdersService,
    PurchaseReceiptsService,
  ],
})
export class PurchasesModule {}

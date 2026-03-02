import { Module } from "@nestjs/common";
import { ChartAccountsController } from "./chart-accounts.controller";
import { ChargesController } from "./charges.controller";
import { PayablesController } from "./payables.controller";
import { ReconciliationsController } from "./reconciliations.controller";
import { ReceivablesController } from "./receivables.controller";
import { CashAccountsController } from "./cash-accounts.controller";
import { CashMovementsController } from "./cash-movements.controller";
import { FinanceReportsController } from "./finance-reports.controller";
import { PaymentsController } from "./payments.controller";
import { ChargesService } from "./charges.service";
import { ChartAccountsService } from "./chart-accounts.service";
import { PayablesService } from "./payables.service";
import { ReceivablesService } from "./receivables.service";
import { CashAccountsService } from "./cash-accounts.service";
import { CashMovementsService } from "./cash-movements.service";
import { FinanceReportsService } from "./finance-reports.service";
import { PaymentsService } from "./payments.service";
import { ReconciliationsService } from "./reconciliations.service";
import { PAYMENT_PROVIDER } from "./providers/payment-provider";
import { MockPaymentProvider } from "./providers/mock-payment-provider";

@Module({
  controllers: [
    ChartAccountsController,
    ChargesController,
    PayablesController,
    ReceivablesController,
    CashAccountsController,
    CashMovementsController,
    FinanceReportsController,
    PaymentsController,
    ReconciliationsController,
  ],
  providers: [
    { provide: PAYMENT_PROVIDER, useClass: MockPaymentProvider },
    ChargesService,
    ChartAccountsService,
    PayablesService,
    ReceivablesService,
    CashAccountsService,
    CashMovementsService,
    FinanceReportsService,
    PaymentsService,
    ReconciliationsService,
  ],
})
export class FinanceModule {}

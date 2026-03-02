import { Module } from "@nestjs/common";
import { PrismaModule } from "./prisma/prisma.module";
import { IamModule } from "./modules/iam/iam.module";
import { CadastrosModule } from "./modules/cadastros/cadastros.module";
import { ProjectsModule } from "./modules/projects/projects.module";
import { ContractsModule } from "./modules/contracts/contracts.module";
import { PurchasesModule } from "./modules/purchases/purchases.module";
import { WorksModule } from "./modules/works/works.module";
import { FinanceModule } from "./modules/finance/finance.module";
import { AfterSalesModule } from "./modules/after-sales/after-sales.module";
import { CommonModule } from "./modules/common/common.module";
import { JobsModule } from "./modules/jobs/jobs.module";
import { PricingModule } from "./modules/pricing/pricing.module";
import { PostProposalModule } from "./modules/post-proposal/post-proposal.module";
import { WorkflowModule } from "./modules/workflow/workflow.module";

@Module({
  imports: [
    PrismaModule,
    CommonModule,
    IamModule,
    CadastrosModule,
    ProjectsModule,
    ContractsModule,
    PurchasesModule,
    WorksModule,
    FinanceModule,
    PricingModule,
    AfterSalesModule,
    JobsModule,
    PostProposalModule,
    WorkflowModule,
  ],
})
export class AppModule {}

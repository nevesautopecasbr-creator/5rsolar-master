import { Module } from "@nestjs/common";
import { TicketsController } from "./tickets.controller";
import { WarrantiesController } from "./warranties.controller";
import { TicketsService } from "./tickets.service";
import { WarrantiesService } from "./warranties.service";

@Module({
  controllers: [TicketsController, WarrantiesController],
  providers: [TicketsService, WarrantiesService],
})
export class AfterSalesModule {}

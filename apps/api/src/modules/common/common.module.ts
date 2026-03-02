import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CompanyContextInterceptor } from "../../common/interceptors/company-context.interceptor";
import { HealthController } from "./health.controller";

@Module({
  controllers: [HealthController],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: CompanyContextInterceptor,
    },
  ],
})
export class CommonModule {}

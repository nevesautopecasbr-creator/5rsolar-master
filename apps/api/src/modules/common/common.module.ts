import { Module } from "@nestjs/common";
import { APP_INTERCEPTOR } from "@nestjs/core";
import { CompanyContextInterceptor } from "../../common/interceptors/company-context.interceptor";
import { HealthController } from "./health.controller";
import { PdfRenderService } from "./pdf-render.service";

@Module({
  controllers: [HealthController],
  providers: [
    PdfRenderService,
    {
      provide: APP_INTERCEPTOR,
      useClass: CompanyContextInterceptor,
    },
  ],
  exports: [PdfRenderService],
})
export class CommonModule {}

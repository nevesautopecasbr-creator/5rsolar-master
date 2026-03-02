import {
  CallHandler,
  ExecutionContext,
  Injectable,
  NestInterceptor,
} from "@nestjs/common";
import { Observable } from "rxjs";

@Injectable()
export class CompanyContextInterceptor implements NestInterceptor {
  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const request = context.switchToHttp().getRequest();
    const headerValue = request.headers["x-company-id"];
    request.companyId = Array.isArray(headerValue)
      ? headerValue[0]
      : headerValue;
    return next.handle();
  }
}

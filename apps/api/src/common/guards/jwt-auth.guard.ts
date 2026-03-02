import { AuthGuard } from "@nestjs/passport";
import { ExecutionContext, Injectable } from "@nestjs/common";

@Injectable()
export class JwtAuthGuard extends AuthGuard("jwt") {
  canActivate(context: ExecutionContext) {
    if (process.env.ALLOW_ANONYMOUS === "true") {
      return true;
    }
    return super.canActivate(context);
  }
}

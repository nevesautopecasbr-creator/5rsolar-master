import { Global, Module } from "@nestjs/common";
import { JwtModule } from "@nestjs/jwt";
import { PassportModule } from "@nestjs/passport";
import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { JwtStrategy } from "./jwt.strategy";
import { UsersController } from "./users.controller";
import { UsersService } from "./users.service";
import { RolesController } from "./roles.controller";
import { RolesService } from "./roles.service";
import { PermissionsController } from "./permissions.controller";
import { AuditController } from "./audit.controller";
import { AuditService } from "./audit.service";

@Global()
@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: false,
      secret: process.env.JWT_SECRET ?? "change-me",
      signOptions: { expiresIn: "8h" },
    }),
  ],
  controllers: [
    AuthController,
    UsersController,
    RolesController,
    PermissionsController,
    AuditController,
  ],
  providers: [AuthService, JwtStrategy, UsersService, RolesService, AuditService],
  exports: [AuthService, AuditService],
})
export class IamModule {}

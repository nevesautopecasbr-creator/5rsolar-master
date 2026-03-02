import { Controller, Get, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { PrismaService } from "../../prisma/prisma.service";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";

@ApiTags("IAM")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("permissions")
export class PermissionsController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  @Permissions("iam.read")
  findAll() {
    return this.prisma.permission.findMany();
  }
}

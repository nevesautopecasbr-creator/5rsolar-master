import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { UsersService } from "./users.service";
import { CreateUserDto } from "./dto/create-user.dto";
import { UpdateUserDto } from "./dto/update-user.dto";

@ApiTags("IAM")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("users")
export class UsersController {
  constructor(private readonly usersService: UsersService) {}

  @Get()
  @Permissions("iam.read")
  findAll() {
    return this.usersService.findAll();
  }

  @Get(":id")
  @Permissions("iam.read")
  findOne(@Param("id") id: string) {
    return this.usersService.findOne(id);
  }

  @Post()
  @Permissions("iam.write")
  create(@Body() dto: CreateUserDto, @CurrentUser() user: { sub: string }) {
    return this.usersService.create(dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("iam.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateUserDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.usersService.update(id, dto, user?.sub);
  }

  @Delete(":id")
  @Permissions("iam.write")
  remove(@Param("id") id: string, @CurrentUser() user: { sub: string }) {
    return this.usersService.remove(id, user?.sub);
  }
}

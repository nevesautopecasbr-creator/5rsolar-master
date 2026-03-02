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
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { ProductsService } from "./products.service";
import { CreateProductDto } from "./dto/create-product.dto";
import { UpdateProductDto } from "./dto/update-product.dto";

@ApiTags("Cadastros")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("products")
export class ProductsController {
  constructor(private readonly productsService: ProductsService) {}

  @Get()
  @Permissions("cadastros.read")
  findAll(@CompanyId() companyId?: string) {
    return this.productsService.findAll(companyId);
  }

  @Get(":id")
  @Permissions("cadastros.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.productsService.findOne(id, companyId);
  }

  @Post()
  @Permissions("cadastros.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateProductDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.productsService.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("cadastros.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateProductDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.productsService.update(id, dto, user?.sub, companyId);
  }

  @Delete(":id")
  @Permissions("cadastros.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.productsService.remove(id, user?.sub, companyId);
  }
}
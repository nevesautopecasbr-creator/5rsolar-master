import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { PricingService } from "./pricing.service";
import { UpdatePricingSettingsDto } from "./dto/update-pricing-settings.dto";
import { CreateFixedExpenseDto } from "./dto/create-fixed-expense.dto";
import { UpdateFixedExpenseDto } from "./dto/update-fixed-expense.dto";
import { CreateVariableExpenseDto } from "./dto/create-variable-expense.dto";
import { UpdateVariableExpenseDto } from "./dto/update-variable-expense.dto";
import { UpdateRevenueBaseDto } from "./dto/update-revenue-base.dto";
import { CreatePricingItemDto } from "./dto/create-pricing-item.dto";
import { UpdatePricingItemDto } from "./dto/update-pricing-item.dto";

@ApiTags("Precificação")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("pricing")
export class PricingController {
  constructor(private readonly service: PricingService) {}

  @Get("settings")
  @Permissions("precificacao.read")
  getSettings(@CompanyId() companyId?: string) {
    return this.service.getSettings(companyId);
  }

  @Put("settings")
  @Permissions("precificacao.write")
  updateSettings(
    @CompanyId() companyId: string | undefined,
    @Body() dto: UpdatePricingSettingsDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.updateSettings(companyId, dto, user?.sub);
  }

  @Get("fixed-expenses")
  @Permissions("precificacao.read")
  findFixedExpenses(@CompanyId() companyId?: string) {
    return this.service.findFixedExpenses(companyId);
  }

  @Post("fixed-expenses")
  @Permissions("precificacao.write")
  createFixedExpense(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateFixedExpenseDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.createFixedExpense(companyId, dto, user?.sub);
  }

  @Patch("fixed-expenses/:id")
  @Permissions("precificacao.write")
  updateFixedExpense(
    @Param("id") id: string,
    @Body() dto: UpdateFixedExpenseDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.updateFixedExpense(id, dto, user?.sub, companyId);
  }

  @Delete("fixed-expenses/:id")
  @Permissions("precificacao.write")
  removeFixedExpense(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.removeFixedExpense(id, user?.sub, companyId);
  }

  @Get("variable-expenses")
  @Permissions("precificacao.read")
  findVariableExpenses(@CompanyId() companyId?: string) {
    return this.service.findVariableExpenses(companyId);
  }

  @Post("variable-expenses")
  @Permissions("precificacao.write")
  createVariableExpense(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateVariableExpenseDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.createVariableExpense(companyId, dto, user?.sub);
  }

  @Patch("variable-expenses/:id")
  @Permissions("precificacao.write")
  updateVariableExpense(
    @Param("id") id: string,
    @Body() dto: UpdateVariableExpenseDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.updateVariableExpense(id, dto, user?.sub, companyId);
  }

  @Delete("variable-expenses/:id")
  @Permissions("precificacao.write")
  removeVariableExpense(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.removeVariableExpense(id, user?.sub, companyId);
  }

  @Get("revenue-base")
  @Permissions("precificacao.read")
  getRevenueBase(
    @CompanyId() companyId: string | undefined,
    @Query("year") year?: string,
  ) {
    const parsedYear = Number(year ?? new Date().getFullYear());
    return this.service.getRevenueBase(companyId, parsedYear);
  }

  @Get("revenue-years")
  @Permissions("precificacao.read")
  getRevenueYears(@CompanyId() companyId: string | undefined) {
    return this.service.getRevenueYears(companyId);
  }

  @Put("revenue-base")
  @Permissions("precificacao.write")
  updateRevenueBase(
    @CompanyId() companyId: string | undefined,
    @Query("year") year: string | undefined,
    @Body() dto: UpdateRevenueBaseDto,
    @CurrentUser() user: { sub: string },
  ) {
    const parsedYear = Number(year ?? new Date().getFullYear());
    return this.service.updateRevenueBase(companyId, parsedYear, dto, user?.sub);
  }

  @Get("items")
  @Permissions("precificacao.read")
  findPricingItems(@CompanyId() companyId?: string) {
    return this.service.findPricingItems(companyId);
  }

  @Post("items")
  @Permissions("precificacao.write")
  createPricingItem(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreatePricingItemDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.createPricingItem(companyId, dto, user?.sub);
  }

  @Patch("items/:id")
  @Permissions("precificacao.write")
  updatePricingItem(
    @Param("id") id: string,
    @Body() dto: UpdatePricingItemDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.updatePricingItem(id, dto, user?.sub, companyId);
  }

  @Delete("items/:id")
  @Permissions("precificacao.write")
  removePricingItem(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.removePricingItem(id, user?.sub, companyId);
  }

  @Get("summary")
  @Permissions("precificacao.read")
  getSummary(
    @CompanyId() companyId: string | undefined,
    @Query("year") year?: string,
  ) {
    const parsedYear = Number(year ?? new Date().getFullYear());
    return this.service.getSummary(companyId, parsedYear);
  }

  @Get("items/calculated")
  @Permissions("precificacao.read")
  getItemsCalculated(
    @CompanyId() companyId: string | undefined,
    @Query("year") year?: string,
  ) {
    const parsedYear = Number(year ?? new Date().getFullYear());
    return this.service.getItemsCalculated(companyId, parsedYear);
  }
}

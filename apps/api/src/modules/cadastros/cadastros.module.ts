import { Module } from "@nestjs/common";
import { CustomersController } from "./customers.controller";
import { CustomersService } from "./customers.service";
import { SuppliersController } from "./suppliers.controller";
import { SuppliersService } from "./suppliers.service";
import { ProductsController } from "./products.controller";
import { ProductsService } from "./products.service";
import { BanksController } from "./banks.controller";
import { BanksService } from "./banks.service";

@Module({
  controllers: [
    CustomersController,
    SuppliersController,
    ProductsController,
    BanksController,
  ],
  providers: [CustomersService, SuppliersService, ProductsService, BanksService],
})
export class CadastrosModule {}

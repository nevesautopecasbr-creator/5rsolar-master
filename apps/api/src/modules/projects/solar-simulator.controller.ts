import { Body, Controller, Post, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { SolarSimulateDto } from "./dto/solar-simulate.dto";
import { SolarSimulatorService } from "./solar-simulator.service";

@ApiTags("Projetos")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("solar-simulator")
export class SolarSimulatorController {
  constructor(private readonly service: SolarSimulatorService) {}

  @Post("calculate")
  @Permissions("projetos.read")
  calculate(@Body() dto: SolarSimulateDto) {
    return this.service.simulate(dto);
  }
}

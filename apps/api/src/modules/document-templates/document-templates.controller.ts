import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseBoolPipe,
  Patch,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { DocumentTemplateType } from "@prisma/client";
import { JwtAuthGuard } from "../../common/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../common/guards/permissions.guard";
import { Permissions } from "../../common/decorators/permissions.decorator";
import { CompanyId } from "../../common/decorators/company-id.decorator";
import { CurrentUser } from "../../common/decorators/current-user.decorator";
import { DocumentTemplatesService } from "./document-templates.service";
import { CreateDocumentTemplateDto } from "./dto/create-document-template.dto";
import { UpdateDocumentTemplateDto } from "./dto/update-document-template.dto";
import { UploadTemplateImageDto } from "./dto/upload-template-image.dto";

@ApiTags("Templates de Documento")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, PermissionsGuard)
@Controller("document-templates")
export class DocumentTemplatesController {
  constructor(private readonly service: DocumentTemplatesService) {}

  @Get()
  @Permissions("contratos.read")
  findAll(
    @CompanyId() companyId?: string,
    @Query("type") type?: DocumentTemplateType,
    @Query("active", new ParseBoolPipe({ optional: true })) active?: boolean,
  ) {
    return this.service.findAll(companyId, type, active);
  }

  @Get("variables")
  @Permissions("contratos.read")
  getVariables(@Query("type") type: DocumentTemplateType) {
    return this.service.getVariables(type);
  }

  @Get(":id")
  @Permissions("contratos.read")
  findOne(@Param("id") id: string, @CompanyId() companyId?: string) {
    return this.service.findOne(id, companyId);
  }

  @Post()
  @Permissions("contratos.write")
  create(
    @CompanyId() companyId: string | undefined,
    @Body() dto: CreateDocumentTemplateDto,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.create(companyId, dto, user?.sub);
  }

  @Patch(":id")
  @Permissions("contratos.write")
  update(
    @Param("id") id: string,
    @Body() dto: UpdateDocumentTemplateDto,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.update(id, dto, user?.sub, companyId);
  }

  @Post(":id/activate")
  @Permissions("contratos.write")
  activate(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.activate(id, user?.sub, companyId);
  }

  @Post("assets/image")
  @Permissions("contratos.write")
  uploadImage(@Body() payload: UploadTemplateImageDto) {
    return this.service.uploadImage(payload);
  }

  @Delete(":id")
  @Permissions("contratos.write")
  remove(
    @Param("id") id: string,
    @CompanyId() companyId: string | undefined,
    @CurrentUser() user: { sub: string },
  ) {
    return this.service.remove(id, user?.sub, companyId);
  }
}

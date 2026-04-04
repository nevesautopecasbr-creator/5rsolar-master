import { Module } from "@nestjs/common";
import { DocumentTemplatesController } from "./document-templates.controller";
import { DocumentTemplatesService } from "./document-templates.service";
import { FileService } from "../post-proposal/storage/file.service";

@Module({
  controllers: [DocumentTemplatesController],
  providers: [DocumentTemplatesService, FileService],
  exports: [DocumentTemplatesService],
})
export class DocumentTemplatesModule {}

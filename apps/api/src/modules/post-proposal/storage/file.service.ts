import { Injectable } from "@nestjs/common";
import { promises as fs } from "node:fs";
import path from "node:path";

type SaveResult = {
  fileUrl: string;
  fileName: string;
  filePath: string;
};

@Injectable()
export class FileService {
  private readonly storageProvider = process.env.STORAGE_PROVIDER ?? "local";
  private readonly baseUrl = process.env.STORAGE_BASE_URL ?? "http://localhost:3001/uploads";
  private readonly uploadsDir = process.env.STORAGE_LOCAL_DIR ?? "uploads";

  async saveBase64(dataUrl: string, fileName: string): Promise<SaveResult> {
    if (this.storageProvider !== "local") {
      throw new Error("Storage provider não suportado.");
    }
    const { buffer, extension } = this.parseBase64(dataUrl);
    const safeFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const filePath = path.join(this.uploadsDir, safeFileName);
    await fs.writeFile(filePath, buffer);
    return {
      fileUrl: `${this.baseUrl}/${safeFileName}`,
      fileName: safeFileName,
      filePath,
    };
  }

  async saveBuffer(buffer: Buffer, fileName: string): Promise<SaveResult> {
    if (this.storageProvider !== "local") {
      throw new Error("Storage provider não suportado.");
    }
    await fs.mkdir(this.uploadsDir, { recursive: true });
    const filePath = path.join(this.uploadsDir, fileName);
    await fs.writeFile(filePath, buffer);
    return {
      fileUrl: `${this.baseUrl}/${fileName}`,
      fileName,
      filePath,
    };
  }

  private parseBase64(dataUrl: string) {
    const match = dataUrl.match(/^data:(.+);base64,(.*)$/);
    if (!match) {
      throw new Error("Assinatura base64 inválida.");
    }
    const mimeType = match[1];
    const data = match[2];
    const extension = mimeType === "image/png" ? ".png" : ".jpg";
    return {
      buffer: Buffer.from(data, "base64"),
      extension,
    };
  }
}

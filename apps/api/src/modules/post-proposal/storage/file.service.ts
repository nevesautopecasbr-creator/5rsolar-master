import { Injectable } from "@nestjs/common";
import { createClient, SupabaseClient } from "@supabase/supabase-js";
import { promises as fs } from "node:fs";
import path from "node:path";

export type SaveResult = {
  fileUrl: string;
  fileName: string;
  filePath?: string;
};

@Injectable()
export class FileService {
  private readonly storageProvider = process.env.STORAGE_PROVIDER ?? "local";
  private readonly baseUrl = process.env.STORAGE_BASE_URL ?? "http://localhost:3001/uploads";
  private readonly uploadsDir = process.env.STORAGE_LOCAL_DIR ?? "uploads";
  private readonly bucket = process.env.STORAGE_BUCKET ?? "documents";

  private getSupabase(): SupabaseClient | null {
    const url = process.env.SUPABASE_URL;
    const key =
      process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.SUPABASE_ANON_KEY;
    if (!url || !key) return null;
    return createClient(url, key);
  }

  async saveBase64(dataUrl: string, fileName: string): Promise<SaveResult> {
    const { buffer, extension } = this.parseBase64(dataUrl);
    const safeFileName = fileName.endsWith(extension) ? fileName : `${fileName}${extension}`;

    if (this.storageProvider === "supabase") {
      const result = await this.uploadToSupabase(buffer, safeFileName, "image/png");
      if (result) return result;
    }

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
    if (this.storageProvider === "supabase") {
      const result = await this.uploadToSupabase(buffer, fileName, "application/pdf");
      if (result) return result;
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

  private async uploadToSupabase(
    buffer: Buffer,
    fileName: string,
    contentType: string,
  ): Promise<SaveResult | null> {
    const supabase = this.getSupabase();
    if (!supabase) return null;

    const pathPrefix = contentType === "application/pdf" ? "documents" : "signatures";
    const objectPath = `${pathPrefix}/${Date.now()}-${fileName}`;

    const { data, error } = await supabase.storage
      .from(this.bucket)
      .upload(objectPath, buffer, {
        contentType,
        upsert: true,
      });

    if (error) {
      console.error("Supabase storage upload error:", error);
      return null;
    }

    const { data: urlData } = supabase.storage.from(this.bucket).getPublicUrl(data.path);
    return {
      fileUrl: urlData.publicUrl,
      fileName: data.path,
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

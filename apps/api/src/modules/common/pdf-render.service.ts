import { Injectable } from "@nestjs/common";
import PDFDocument from "pdfkit";

@Injectable()
export class PdfRenderService {
  async renderHtmlToPdf(html: string, title: string): Promise<Buffer> {
    const plainText = this.htmlToText(html);
    return this.buildPdfWithLayout(plainText, title);
  }

  private htmlToText(html: string): string {
    const withBreaks = html
      .replace(/<(br|BR)\s*\/?>/g, "\n")
      .replace(/<\/(p|div|h1|h2|h3|h4|h5|h6|tr)>/gi, "\n\n")
      .replace(/<\/(li)>/gi, "\n")
      .replace(/<(li)[^>]*>/gi, "• ")
      .replace(/<(td|th)[^>]*>/gi, " ")
      .replace(/<\/(td|th)>/gi, " | ")
      .replace(/<[^>]+>/g, " ");
    return this.decodeHtmlEntities(withBreaks)
      .replace(/\r/g, "")
      .replace(/[ \t]+\n/g, "\n")
      .replace(/\n{3,}/g, "\n\n")
      .replace(/[ \t]{2,}/g, " ")
      .trim();
  }

  private decodeHtmlEntities(value: string): string {
    const named: Record<string, string> = {
      amp: "&",
      lt: "<",
      gt: ">",
      quot: '"',
      apos: "'",
      nbsp: " ",
      ccedil: "ç",
      Ccedil: "Ç",
      aacute: "á",
      Aacute: "Á",
      eacute: "é",
      Eacute: "É",
      iacute: "í",
      Iacute: "Í",
      oacute: "ó",
      Oacute: "Ó",
      uacute: "ú",
      Uacute: "Ú",
      atilde: "ã",
      Atilde: "Ã",
      otilde: "õ",
      Otilde: "Õ",
      agrave: "à",
      Agrave: "À",
      ecirc: "ê",
      Ecirc: "Ê",
      ocirc: "ô",
      Ocirc: "Ô",
    };
    return value.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z]+);/g, (_match, entity: string) => {
      if (entity.startsWith("#x") || entity.startsWith("#X")) {
        const code = Number.parseInt(entity.slice(2), 16);
        return Number.isFinite(code) ? String.fromCodePoint(code) : _match;
      }
      if (entity.startsWith("#")) {
        const code = Number.parseInt(entity.slice(1), 10);
        return Number.isFinite(code) ? String.fromCodePoint(code) : _match;
      }
      return named[entity] ?? _match;
    });
  }

  private buildPdfWithLayout(bodyText: string, title: string): Promise<Buffer> {
    return new Promise<Buffer>((resolve, reject) => {
      const doc = new PDFDocument({
        size: "A4",
        margin: 48,
        info: { Title: title },
      });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk: Buffer) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", (error) => reject(error));

      doc.font("Helvetica-Bold").fontSize(16).text(title, { align: "left" });
      doc.moveDown(1);

      const paragraphs = bodyText.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
      doc.font("Helvetica").fontSize(11);
      for (const paragraph of paragraphs) {
        const normalized = paragraph
          .split("\n")
          .map((line) => line.trim())
          .filter(Boolean)
          .join("\n");
        doc.text(normalized, {
          width: doc.page.width - doc.page.margins.left - doc.page.margins.right,
          lineGap: 2,
          paragraphGap: 8,
        });
      }

      doc.end();
    });
  }
}

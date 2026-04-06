import { Injectable } from "@nestjs/common";

@Injectable()
export class PdfRenderService {
  async renderHtmlToPdf(html: string, title: string): Promise<Buffer> {
    const plainText = this.htmlToText(html);
    return this.buildSimplePdf(plainText, title);
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

  private buildSimplePdf(bodyText: string, title: string): Buffer {
    const header = "%PDF-1.4\n";
    const objects: string[] = [];
    const lines = bodyText.slice(0, 12000).split("\n");
    const pdfLines: string[] = [
      "BT",
      "/F1 11 Tf",
      "50 800 Td",
      `(${this.escapePdfText(title)}) Tj`,
      "0 -16 Td",
    ];
    for (const line of lines) {
      pdfLines.push(`(${this.escapePdfText(this.toPdfLatinText(line).slice(0, 110))}) Tj`, "0 -14 Td");
    }
    pdfLines.push("ET");
    const contentLines = pdfLines.join("\n");
    const content = `<< /Length ${contentLines.length} >>\nstream\n${contentLines}\nendstream`;
    objects.push("1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n");
    objects.push("2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n");
    objects.push(
      "3 0 obj\n<< /Type /Page /Parent 2 0 R /MediaBox [0 0 595 842] /Contents 4 0 R /Resources << /Font << /F1 5 0 R >> >> >>\nendobj\n",
    );
    objects.push(`4 0 obj\n${content}\nendobj\n`);
    objects.push(
      "5 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n",
    );
    let offset = header.length;
    const xref = ["xref", `0 ${objects.length + 1}`, "0000000000 65535 f "];
    const body = objects
      .map((obj) => {
        const line = `${offset.toString().padStart(10, "0")} 00000 n `;
        xref.push(line);
        offset += obj.length;
        return obj;
      })
      .join("");
    const xrefOffset = header.length + body.length;
    const trailer = `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
    return Buffer.from(`${header}${body}${xref.join("\n")}\n${trailer}`);
  }

  private escapePdfText(text: string) {
    return text.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
  }

  private toPdfLatinText(text: string): string {
    // WinAnsi (Helvetica Type1) cobre acentuação PT-BR básica; substitui chars não representáveis.
    return text.replace(/[^\x20-\x7E\xA0-\xFF]/g, "?");
  }
}

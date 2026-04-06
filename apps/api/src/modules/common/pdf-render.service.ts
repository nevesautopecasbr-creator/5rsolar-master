import { Injectable } from "@nestjs/common";
import puppeteer from "puppeteer";

@Injectable()
export class PdfRenderService {
  async renderHtmlToPdf(html: string, title: string): Promise<Buffer> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ["--no-sandbox", "--disable-setuid-sandbox"],
    });
    try {
      const page = await browser.newPage();
      await page.setContent(this.wrapHtml(html, title), { waitUntil: "networkidle0" });
      const pdf = await page.pdf({
        format: "A4",
        printBackground: true,
        margin: { top: "24mm", right: "16mm", bottom: "20mm", left: "16mm" },
      });
      return Buffer.from(pdf);
    } finally {
      await browser.close();
    }
  }

  private wrapHtml(bodyHtml: string, title: string): string {
    return `<!DOCTYPE html>
<html lang="pt-BR">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>${this.escapeHtml(title)}</title>
    <style>
      body {
        font-family: Arial, Helvetica, sans-serif;
        color: #1f2937;
        line-height: 1.5;
        font-size: 12px;
      }
      h1, h2, h3 { margin: 0 0 8px; }
      p { margin: 0 0 10px; }
      ul, ol { margin: 0 0 10px 18px; }
      table { width: 100%; border-collapse: collapse; margin: 8px 0 12px; }
      th, td { border: 1px solid #d1d5db; padding: 6px 8px; text-align: left; vertical-align: top; }
      img { max-width: 100%; height: auto; }
      .doc-title { margin-bottom: 16px; font-size: 18px; font-weight: 700; }
    </style>
  </head>
  <body>
    <div class="doc-title">${this.escapeHtml(title)}</div>
    ${bodyHtml}
  </body>
</html>`;
  }

  private escapeHtml(value: string): string {
    return value
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  }
}
